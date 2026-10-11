"""Integration tests for the Notes API."""
from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.repositories.note_repository import NoteRepository


# ─── Helper ────────────────────────────────────────────────────────────────────
TYPED_NOTE_PAYLOAD = {
    "title": "Introduction to Algebra",
    "subject": "Mathematics",
    "resource_type": "typed",
    "typed_content": "Algebra is the study of mathematical symbols...",
    "description": "Basic algebra concepts",
}

LINK_NOTE_PAYLOAD = {
    "title": "Khan Academy Calculus",
    "subject": "Mathematics",
    "resource_type": "video_link",
    "external_url": "https://khanacademy.org/calculus",
}


# ─── Health ────────────────────────────────────────────────────────────────────
@patch("app.api.routes.health.check_db_connection", return_value=True)
@patch("app.api.routes.health.check_storage_connection", new_callable=AsyncMock, return_value=True)
def test_health_endpoint(mock_storage, mock_db, client: TestClient):
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["database"] is True
    assert data["storage"] is True


# ─── Notes list ────────────────────────────────────────────────────────────────
def test_list_notes_empty(client: TestClient):
    resp = client.get("/api/v1/notes")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)


def test_unhandled_api_error_includes_cors_header(client: TestClient, monkeypatch):
    def raise_error(self):
        raise RuntimeError("Unexpected database error")

    monkeypatch.setattr(NoteRepository, "get_distinct_subjects", raise_error)

    with TestClient(client.app, raise_server_exceptions=False) as cors_client:
        resp = cors_client.get(
            "/api/v1/subjects",
            headers={"Origin": "http://localhost:5173"},
        )

    assert resp.status_code == 500
    assert resp.headers["access-control-allow-origin"] == "http://localhost:5173"


# ─── Create typed note ─────────────────────────────────────────────────────────
def test_create_typed_note(client: TestClient):
    resp = client.post("/api/v1/notes", data=TYPED_NOTE_PAYLOAD)
    assert resp.status_code == 201
    data = resp.json()
    assert "note" in data
    assert "deletion_token" in data
    assert data["note"]["resource_type"] == "typed"
    assert data["note"]["title"] == "Introduction to Algebra"
    # deletion_token must not be empty
    assert len(data["deletion_token"]) >= 32


# ─── Create link note ──────────────────────────────────────────────────────────
def test_create_link_note(client: TestClient):
    resp = client.post("/api/v1/notes", data=LINK_NOTE_PAYLOAD)
    assert resp.status_code == 201
    data = resp.json()
    assert data["note"]["resource_type"] == "video_link"
    assert data["note"]["external_url"] == "https://khanacademy.org/calculus"


# ─── Validation ────────────────────────────────────────────────────────────────
def test_create_note_missing_content_fails(client: TestClient):
    resp = client.post(
        "/api/v1/notes",
        data={"title": "Test", "subject": "Science", "resource_type": "typed"},
    )
    assert resp.status_code in (400, 422)


def test_create_note_bad_url_scheme_fails(client: TestClient):
    resp = client.post(
        "/api/v1/notes",
        data={
            "title": "Bad URL",
            "subject": "Science",
            "resource_type": "website_link",
            "external_url": "http://not-https.com",
        },
    )
    assert resp.status_code in (400, 422)


def test_create_note_javascript_url_fails(client: TestClient):
    resp = client.post(
        "/api/v1/notes",
        data={
            "title": "XSS",
            "subject": "Hacking",
            "resource_type": "website_link",
            "external_url": "javascript:alert(1)",
        },
    )
    assert resp.status_code in (400, 422)


# ─── Get note by ID ─────────────────────────────────────────────────────────────
def test_get_note_by_id(client: TestClient):
    create_resp = client.post("/api/v1/notes", data=TYPED_NOTE_PAYLOAD)
    note_id = create_resp.json()["note"]["id"]

    resp = client.get(f"/api/v1/notes/{note_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == note_id


def test_get_nonexistent_note_returns_404(client: TestClient):
    resp = client.get(f"/api/v1/notes/{uuid.uuid4()}")
    assert resp.status_code == 404


# ─── Storage_path not exposed ──────────────────────────────────────────────────
def test_storage_path_not_in_list_response(client: TestClient):
    client.post("/api/v1/notes", data=TYPED_NOTE_PAYLOAD)
    resp = client.get("/api/v1/notes")
    for item in resp.json()["items"]:
        assert "storage_path" not in item
        assert "deletion_token_hash" not in item


# ─── Deletion ──────────────────────────────────────────────────────────────────
@patch("app.services.note_service.delete_file", new_callable=AsyncMock, return_value=True)
def test_delete_note_with_valid_token(mock_del, client: TestClient):
    create_resp = client.post("/api/v1/notes", data=TYPED_NOTE_PAYLOAD)
    data = create_resp.json()
    note_id = data["note"]["id"]
    token = data["deletion_token"]

    del_resp = client.post(
        f"/api/v1/notes/{note_id}/delete",
        json={"deletion_token": token},
    )
    assert del_resp.status_code == 200

    # Note should be gone
    get_resp = client.get(f"/api/v1/notes/{note_id}")
    assert get_resp.status_code == 404


def test_delete_note_with_invalid_token_fails(client: TestClient):
    create_resp = client.post("/api/v1/notes", data=TYPED_NOTE_PAYLOAD)
    note_id = create_resp.json()["note"]["id"]

    del_resp = client.post(
        f"/api/v1/notes/{note_id}/delete",
        json={"deletion_token": "this-is-a-completely-wrong-token-1234567890"},
    )
    assert del_resp.status_code == 403


def test_delete_token_from_one_note_cannot_delete_another(client: TestClient):
    create_a = client.post("/api/v1/notes", data=TYPED_NOTE_PAYLOAD)
    create_b = client.post(
        "/api/v1/notes",
        data={**TYPED_NOTE_PAYLOAD, "title": "Another Note"},
    )

    note_b_id = create_b.json()["note"]["id"]
    token_a = create_a.json()["deletion_token"]

    # Try to delete note B using token A
    del_resp = client.post(
        f"/api/v1/notes/{note_b_id}/delete",
        json={"deletion_token": token_a},
    )
    assert del_resp.status_code == 403

    # Note B should still exist
    assert client.get(f"/api/v1/notes/{note_b_id}").status_code == 200


# ─── Search and filter ─────────────────────────────────────────────────────────
def test_search_by_title(client: TestClient):
    client.post(
        "/api/v1/notes",
        data={
            "title": "Photosynthesis Deep Dive",
            "subject": "Biology",
            "resource_type": "typed",
            "typed_content": "Photosynthesis is...",
        },
    )
    resp = client.get("/api/v1/notes?search=Photosynthesis")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert any("Photosynthesis" in i["title"] for i in items)


def test_filter_by_resource_type(client: TestClient):
    resp = client.get("/api/v1/notes?resource_type=typed")
    assert resp.status_code == 200
    for item in resp.json()["items"]:
        assert item["resource_type"] == "typed"


def test_invalid_sort_param(client: TestClient):
    resp = client.get("/api/v1/notes?sort=random")
    assert resp.status_code == 422


# ─── Subjects ──────────────────────────────────────────────────────────────────
def test_subjects_endpoint(client: TestClient):
    resp = client.get("/api/v1/subjects")
    assert resp.status_code == 200
    data = resp.json()
    assert "subjects" in data
    assert isinstance(data["subjects"], list)
