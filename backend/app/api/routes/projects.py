from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.db.extensions import db
from app.models import Project, Revision, Layer, AuditLog
from app.schemas.common import ProjectSchema
from app.services.project_service import create_default_layers
from app.services.audit_service import log_action

projects_bp = Blueprint("projects", __name__, url_prefix="/api/projects")


@projects_bp.get("")
@jwt_required(optional=True)
def list_projects():
    org_id = request.args.get("organization_id", type=int)
    query = Project.query
    if org_id:
        query = query.filter_by(organization_id=org_id)
    projects = query.order_by(Project.updated_at.desc()).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "code": p.code,
            "description": p.description,
            "status": p.status,
            "crs": p.crs,
            "capacity_mw": p.capacity_mw,
            "metadata": p.metadata_json or {},
            "updated_at": p.updated_at.isoformat(),
        }
        for p in projects
    ]


@projects_bp.post("")
@jwt_required(optional=True)
def create_project():
    payload = ProjectSchema().load(request.get_json() or {})
    project = Project(
        organization_id=payload["organization_id"],
        name=payload["name"],
        code=payload["code"],
        description=payload.get("description"),
        status=payload.get("status", "draft"),
        crs=payload.get("crs", "EPSG:32644"),
        capacity_mw=payload.get("capacity_mw", 0),
        metadata_json=payload.get("metadata", {}),
    )
    db.session.add(project)
    db.session.flush()

    create_default_layers(project.id)
    initial_revision = Revision(project_id=project.id, name="R1", note="Initial", is_active=True)
    db.session.add(initial_revision)
    log_action(None, "project", project.id, "create", {"code": project.code})

    db.session.commit()

    return {"id": project.id, "name": project.name, "code": project.code}, 201


@projects_bp.get("/<int:project_id>")
@jwt_required(optional=True)
def get_project(project_id: int):
    project = Project.query.get_or_404(project_id)
    return {
        "id": project.id,
        "organization_id": project.organization_id,
        "name": project.name,
        "code": project.code,
        "description": project.description,
        "status": project.status,
        "crs": project.crs,
        "capacity_mw": project.capacity_mw,
        "metadata": project.metadata_json or {},
    }


@projects_bp.patch("/<int:project_id>")
@jwt_required(optional=True)
def update_project(project_id: int):
    project = Project.query.get_or_404(project_id)
    payload = request.get_json() or {}
    for key in ["name", "description", "status", "crs", "capacity_mw"]:
        if key in payload:
            setattr(project, key, payload[key])
    if "metadata" in payload:
        project.metadata_json = payload["metadata"]

    log_action(None, "project", project.id, "update", payload)
    db.session.commit()
    return {"message": "Project updated"}


@projects_bp.get("/<int:project_id>/audit")
@jwt_required(optional=True)
def get_project_audit(project_id: int):
    _ = Project.query.get_or_404(project_id)
    logs = AuditLog.query.filter_by(entity_type="project", entity_id=project_id).order_by(AuditLog.created_at.desc()).all()
    return [
        {
            "id": log.id,
            "action": log.action,
            "details": log.details,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]


@projects_bp.get("/<int:project_id>/revisions")
@jwt_required(optional=True)
def list_revisions(project_id: int):
    _ = Project.query.get_or_404(project_id)
    revisions = Revision.query.filter_by(project_id=project_id).order_by(Revision.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "note": r.note,
            "is_active": r.is_active,
            "created_at": r.created_at.isoformat(),
        }
        for r in revisions
    ]


@projects_bp.post("/<int:project_id>/revisions")
@jwt_required(optional=True)
def create_revision(project_id: int):
    _ = Project.query.get_or_404(project_id)
    payload = request.get_json() or {}
    name = payload.get("name", "Revision")

    if payload.get("is_active", False):
        Revision.query.filter_by(project_id=project_id, is_active=True).update({"is_active": False})

    revision = Revision(
        project_id=project_id,
        name=name,
        note=payload.get("note", ""),
        is_active=payload.get("is_active", False),
    )
    db.session.add(revision)
    db.session.commit()
    return {"id": revision.id, "name": revision.name, "is_active": revision.is_active}, 201

