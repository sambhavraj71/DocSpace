
def test_create_document(client, owner):
    response = client.post(
        "/documents/",
        headers=owner["headers"],
        json={
            "title": "My First Document",
            "content": "Hello DocSpace!"
        }
    )

    assert response.status_code == 200
    assert response.json()["title"] == "My First Document"
    assert response.json()["content"] == "Hello DocSpace!"


def test_create_document_with_empty_title(client, owner):
    response = client.post(
        "/documents/",
        headers=owner["headers"],
        json={
            "title": "   ",
            "content": "Some content"
        }
    )

    assert response.status_code == 400


def test_get_owned_documents(client, owner, document):
    response = client.get(
        "/documents/",
        headers=owner["headers"]
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == document["id"]


def test_get_recent_documents(client, owner, document):
    response = client.get(
        "/documents/recent",
        headers=owner["headers"]
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_single_document(client, owner, document):
    response = client.get(
        f"/documents/{document['id']}",
        headers=owner["headers"]
    )

    assert response.status_code == 200
    assert response.json()["permission"] == "owner"


def test_update_document(client, owner, document):
    response = client.put(
        f"/documents/{document['id']}",
        headers=owner["headers"],
        json={
            "title": "Updated Title",
            "content": "Updated content"
        }
    )

    assert response.status_code == 200
    assert response.json()["document"]["title"] == "Updated Title"


def test_update_document_with_empty_title(client, owner, document):
    response = client.put(
        f"/documents/{document['id']}",
        headers=owner["headers"],
        json={"title": " "}
    )

    assert response.status_code == 400


def test_unauthorized_document_access(client, viewer, document):
    response = client.get(
        f"/documents/{document['id']}",
        headers=viewer["headers"]
    )

    assert response.status_code == 403


def test_share_document_as_viewer(client, owner, viewer, document):
    response = client.post(
        f"/documents/{document['id']}/share",
        headers=owner["headers"],
        json={
            "email": viewer["email"],
            "permission": "viewer"
        }
    )

    assert response.status_code == 200
    assert response.json()["permission"] == "viewer"


def test_viewer_can_read_but_cannot_edit(
    client, owner, viewer, document
):
    client.post(
        f"/documents/{document['id']}/share",
        headers=owner["headers"],
        json={
            "email": viewer["email"],
            "permission": "viewer"
        }
    )

    read_response = client.get(
        f"/documents/{document['id']}",
        headers=viewer["headers"]
    )

    assert read_response.status_code == 200
    assert read_response.json()["permission"] == "viewer"

    edit_response = client.put(
        f"/documents/{document['id']}",
        headers=viewer["headers"],
        json={"content": "Unauthorized edit"}
    )

    assert edit_response.status_code == 403
    assert edit_response.json()["detail"] == "You have viewer-only access"


def test_share_document_as_editor(client, owner, editor, document):
    response = client.post(
        f"/documents/{document['id']}/share",
        headers=owner["headers"],
        json={
            "email": editor["email"],
            "permission": "editor"
        }
    )

    assert response.status_code == 200
    assert response.json()["permission"] == "editor"


def test_editor_can_update_document(
    client, owner, editor, document
):
    client.post(
        f"/documents/{document['id']}/share",
        headers=owner["headers"],
        json={
            "email": editor["email"],
            "permission": "editor"
        }
    )

    response = client.put(
        f"/documents/{document['id']}",
        headers=editor["headers"],
        json={
            "content": "Updated by editor"
        }
    )

    assert response.status_code == 200

    verify_response = client.get(
        f"/documents/{document['id']}",
        headers=owner["headers"]
    )

    assert verify_response.json()["content"] == "Updated by editor"


def test_get_shared_documents(client, owner, viewer, document):
    client.post(
        f"/documents/{document['id']}/share",
        headers=owner["headers"],
        json={
            "email": viewer["email"],
            "permission": "viewer"
        }
    )

    response = client.get(
        "/documents/shared-with-me",
        headers=viewer["headers"]
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["owner_name"] == owner["name"]
    assert response.json()[0]["permission"] == "viewer"


def test_update_existing_share_permission(
    client, owner, viewer, document
):
    share_url = f"/documents/{document['id']}/share"

    client.post(
        share_url,
        headers=owner["headers"],
        json={
            "email": viewer["email"],
            "permission": "viewer"
        }
    )

    response = client.post(
        share_url,
        headers=owner["headers"],
        json={
            "email": viewer["email"],
            "permission": "editor"
        }
    )

    assert response.status_code == 200
    assert response.json()["permission"] == "editor"


def test_share_with_unregistered_email(client, owner, document):
    response = client.post(
        f"/documents/{document['id']}/share",
        headers=owner["headers"],
        json={
            "email": "unknown@example.com",
            "permission": "viewer"
        }
    )

    assert response.status_code == 404


def test_invalid_share_permission(client, owner, viewer, document):
    response = client.post(
        f"/documents/{document['id']}/share",
        headers=owner["headers"],
        json={
            "email": viewer["email"],
            "permission": "admin"
        }
    )

    assert response.status_code == 400


def test_owner_cannot_share_with_self(client, owner, document):
    response = client.post(
        f"/documents/{document['id']}/share",
        headers=owner["headers"],
        json={
            "email": owner["email"],
            "permission": "viewer"
        }
    )

    assert response.status_code == 400


def test_non_owner_cannot_share_document(
    client, owner, viewer, editor, document
):
    response = client.post(
        f"/documents/{document['id']}/share",
        headers=viewer["headers"],
        json={
            "email": editor["email"],
            "permission": "viewer"
        }
    )

    assert response.status_code == 404




def test_revoke_document_access(client, owner, viewer, document):
    client.post(
        f"/documents/{document['id']}/share",
        headers=owner["headers"],
        json={
            "email": viewer["email"],
            "permission": "viewer"
        }
    )

    response = client.delete(
        f"/documents/{document['id']}/share/{viewer['id']}",
        headers=owner["headers"]
    )

    assert response.status_code == 200

    access_response = client.get(
        f"/documents/{document['id']}",
        headers=viewer["headers"]
    )

    assert access_response.status_code == 403


def test_non_owner_cannot_delete_document(
    client, owner, viewer, document
):
    response = client.delete(
        f"/documents/{document['id']}",
        headers=viewer["headers"]
    )

    assert response.status_code == 404

    verify_response = client.get(
        f"/documents/{document['id']}",
        headers=owner["headers"]
    )

    assert verify_response.status_code == 200


def test_owner_can_delete_document(client, owner, document):
    response = client.delete(
        f"/documents/{document['id']}",
        headers=owner["headers"]
    )

    assert response.status_code == 200

    verify_response = client.get(
        f"/documents/{document['id']}",
        headers=owner["headers"]
    )

    assert verify_response.status_code == 404
