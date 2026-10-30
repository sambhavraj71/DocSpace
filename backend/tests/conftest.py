
import pytest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base, get_db


@pytest.fixture
def client(tmp_path):
    # Separate temporary database for every test
    test_database = tmp_path / "test_docspace.db"

    test_engine = create_engine(
        f"sqlite:///{test_database}",
        connect_args={"check_same_thread": False}
    )

    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_engine
    )

    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()


def register_and_login(client, name, email, password="Password123"):
    register_response = client.post(
        "/auth/register",
        json={
            "name": name,
            "email": email,
            "password": password
        }
    )

    assert register_response.status_code == 200

    login_response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    return {
        "id": register_response.json()["user_id"],
        "name": name,
        "email": email,
        "token": token,
        "headers": {
            "Authorization": f"Bearer {token}"
        }
    }


@pytest.fixture
def owner(client):
    return register_and_login(
        client, "Sambhav", "owner@example.com"
    )


@pytest.fixture
def editor(client):
    return register_and_login(
        client, "Editor User", "editor@example.com"
    )


@pytest.fixture
def viewer(client):
    return register_and_login(
        client, "Viewer User", "viewer@example.com"
    )


@pytest.fixture
def document(client, owner):
    response = client.post(
        "/documents/",
        headers=owner["headers"],
        json={
            "title": "Test Document",
            "content": "This is test content."
        }
    )

    assert response.status_code == 200

    return response.json()
