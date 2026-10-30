
def test_user_registration(client):
    response = client.post(
        "/auth/register",
        json={
            "name": "Sambhav",
            "email": "sambhav@example.com",
            "password": "Password123"
        }
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Registration successful"


def test_duplicate_email_registration(client, owner):
    response = client.post(
        "/auth/register",
        json={
            "name": "Another User",
            "email": owner["email"],
            "password": "Password123"
        }
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"


def test_successful_login(client, owner):
    response = client.post(
        "/auth/login",
        json={
            "email": owner["email"],
            "password": "Password123"
        }
    )

    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_with_wrong_password(client, owner):
    response = client.post(
        "/auth/login",
        json={
            "email": owner["email"],
            "password": "WrongPassword"
        }
    )

    assert response.status_code == 401


def test_login_with_unknown_email(client):
    response = client.post(
        "/auth/login",
        json={
            "email": "unknown@example.com",
            "password": "Password123"
        }
    )

    assert response.status_code == 401


def test_protected_route_without_token(client):
    response = client.get("/documents/")

    assert response.status_code == 401


def test_protected_route_with_invalid_token(client):
    response = client.get(
        "/documents/",
        headers={
            "Authorization": "Bearer invalid-token"
        }
    )

    assert response.status_code == 401
