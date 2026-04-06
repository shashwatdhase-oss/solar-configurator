import os
import pytest

from app import create_app
from app.core.config import TestConfig
from app.db.extensions import db


class LocalTestConfig(TestConfig):
    SQLALCHEMY_DATABASE_URI = os.getenv("TEST_DATABASE_URL", "sqlite+pysqlite:///:memory:")


@pytest.fixture()
def app():
    app = create_app(LocalTestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def org_payload():
    return {
        "email": "tester@example.com",
        "password": "password123",
        "full_name": "Test User",
        "role": "admin",
        "organization_name": "Test Org",
    }

