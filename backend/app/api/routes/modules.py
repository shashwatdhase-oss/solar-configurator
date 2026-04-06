from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.db.extensions import db
from app.models import Job
from app.services.module_service import MODULES, create_job, complete_job, fail_job, place_tables, run_generic_module
from app.schemas.common import PlaceTablesSchema

modules_bp = Blueprint("modules", __name__, url_prefix="/api/modules")


@modules_bp.get("")
@jwt_required(optional=True)
def list_modules():
    return [{"key": key, "name": key.replace("_", " ").title()} for key in MODULES]


@modules_bp.post("/place-tables")
@jwt_required(optional=True)
def run_place_tables():
    payload = PlaceTablesSchema().load(request.get_json() or {})
    job = create_job(payload["project_id"], "place_tables", payload)
    db.session.flush()

    try:
        result = place_tables(payload)
        complete_job(job, result)
        db.session.commit()
        return {"job_id": job.id, "status": job.status, "result": result}, 201
    except ValueError as exc:
        fail_job(job, str(exc))
        db.session.commit()
        return {"error": "module_failed", "message": str(exc), "job_id": job.id}, 400
    except Exception as exc:
        db.session.rollback()
        db.session.add(job)
        fail_job(job, f"Unexpected placement error: {exc}")
        db.session.commit()
        return {"error": "module_failed", "message": f"Unexpected placement error: {exc}", "job_id": job.id}, 500


@modules_bp.post("/<module_name>")
@jwt_required(optional=True)
def run_module(module_name: str):
    if module_name not in MODULES:
        return {"error": "invalid_module", "message": f"Unknown module {module_name}"}, 404

    payload = request.get_json() or {}
    project_id = payload.get("project_id")
    if not project_id:
        return {"error": "missing_project", "message": "project_id required"}, 400

    job = create_job(project_id, module_name, payload)
    db.session.flush()
    try:
        result = run_generic_module(payload, module_name)
        complete_job(job, result)
        db.session.commit()
        return {"job_id": job.id, "status": job.status, "result": result}, 201
    except ValueError as exc:
        fail_job(job, str(exc))
        db.session.commit()
        return {"error": "module_failed", "message": str(exc), "job_id": job.id}, 400
    except Exception as exc:
        db.session.rollback()
        db.session.add(job)
        fail_job(job, f"Unexpected module error: {exc}")
        db.session.commit()
        return {"error": "module_failed", "message": f"Unexpected module error: {exc}", "job_id": job.id}, 500


jobs_bp = Blueprint("jobs", __name__, url_prefix="/api/jobs")


@jobs_bp.get("")
@jwt_required(optional=True)
def list_jobs():
    project_id = request.args.get("project_id", type=int)
    query = Job.query
    if project_id:
        query = query.filter_by(project_id=project_id)
    jobs = query.order_by(Job.created_at.desc()).all()
    return [
        {
            "id": j.id,
            "project_id": j.project_id,
            "module_name": j.module_name,
            "status": j.status,
            "progress": j.progress,
            "error_message": j.error_message,
            "result_payload": j.result_payload,
            "created_at": j.created_at.isoformat(),
        }
        for j in jobs
    ]

