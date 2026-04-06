from flask import Blueprint, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

from app.db.extensions import db
from app.models import Organization, User
from app.schemas.common import LoginSchema, RegisterSchema

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    payload = RegisterSchema().load(request.get_json() or {})

    existing = User.query.filter_by(email=payload["email"]).first()
    if existing:
        return {"error": "email_exists", "message": "Email already registered"}, 409

    org = Organization.query.filter_by(name=payload["organization_name"]).first()
    if not org:
        org = Organization(name=payload["organization_name"], metadata_json={})
        db.session.add(org)
        db.session.flush()

    user = User(
        email=payload["email"],
        password_hash=generate_password_hash(payload["password"]),
        full_name=payload["full_name"],
        role=payload["role"],
        organization_id=org.id,
    )
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_id": user.organization_id,
        },
    }, 201


@auth_bp.post("/login")
def login():
    payload = LoginSchema().load(request.get_json() or {})
    user = User.query.filter_by(email=payload["email"]).first()

    if user is None or not check_password_hash(user.password_hash, payload["password"]):
        return {"error": "invalid_credentials", "message": "Invalid email or password"}, 401

    token = create_access_token(identity=str(user.id))
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_id": user.organization_id,
        },
    }


@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "organization_id": user.organization_id,
    }


@auth_bp.post("/logout")
@jwt_required(optional=True)
def logout():
    return {"message": "Logged out. Client should clear token."}, 200

