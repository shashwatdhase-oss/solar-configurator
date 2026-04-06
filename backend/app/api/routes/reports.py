from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.db.extensions import db
from app.models import Report
from app.services.report_service import build_geojson_export, build_kml_export, build_summary_report

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


@reports_bp.get("")
@jwt_required(optional=True)
def list_reports():
    project_id = request.args.get("project_id", type=int)
    query = Report.query
    if project_id:
        query = query.filter_by(project_id=project_id)

    reports = query.order_by(Report.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "project_id": r.project_id,
            "report_type": r.report_type,
            "title": r.title,
            "payload": r.payload,
            "created_at": r.created_at.isoformat(),
        }
        for r in reports
    ]


@reports_bp.post("/summary")
@jwt_required(optional=True)
def create_summary_report():
    payload = request.get_json() or {}
    project_id = payload.get("project_id")
    if not project_id:
        return {"error": "missing_project", "message": "project_id required"}, 400

    summary = build_summary_report(project_id)
    report = Report(project_id=project_id, report_type="summary", title="Summary Report", payload=summary)
    db.session.add(report)
    db.session.commit()
    return {"id": report.id, "payload": report.payload}, 201


@reports_bp.get("/geojson")
@jwt_required(optional=True)
def geojson_report():
    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return {"error": "missing_project", "message": "project_id required"}, 400
    return build_geojson_export(project_id)


@reports_bp.get("/boq")
@jwt_required(optional=True)
def boq_report():
    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return {"error": "missing_project", "message": "project_id required"}, 400

    summary = build_summary_report(project_id)
    return {
        "project_id": project_id,
        "table_count": summary["feature_counts"].get("table", 0),
        "pile_count": summary["feature_counts"].get("pile", 0),
        "inverter_count": summary["feature_counts"].get("inverter", 0),
        "cable_length_degree": summary["total_line_length_degree"],
    }


@reports_bp.get("/kml")
@jwt_required(optional=True)
def kml_report():
    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return {"error": "missing_project", "message": "project_id required"}, 400
    return {"kml": build_kml_export(project_id)}

