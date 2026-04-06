from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.db.extensions import db
from app.models import Feature
from app.schemas.common import BulkFeatureSchema, FeatureSchema, SpatialQuerySchema
from app.services.geometry_service import (
    GeometryValidationError,
    create_feature,
    feature_collection,
    features_inside_boundary,
    update_feature,
)

geometry_bp = Blueprint("geometry", __name__, url_prefix="/api/geometry")


@geometry_bp.get("/features")
@jwt_required(optional=True)
def list_features():
    project_id = request.args.get("project_id", type=int)
    layer_id = request.args.get("layer_id", type=int)

    query = Feature.query.filter_by(is_active=True)
    if project_id:
        query = query.filter_by(project_id=project_id)
    if layer_id:
        query = query.filter_by(layer_id=layer_id)

    features = query.order_by(Feature.id.asc()).all()
    return [
        {
            "id": f.id,
            "project_id": f.project_id,
            "layer_id": f.layer_id,
            "feature_type": f.feature_type,
            "sub_type": f.sub_type,
            "name": f.name,
            "tag": f.tag,
            "geometry": f.geometry_json,
            "properties": f.properties or {},
            "parent_id": f.parent_id,
            "is_active": f.is_active,
        }
        for f in features
    ]


@geometry_bp.post("/features")
@jwt_required(optional=True)
def create_single_feature():
    payload = FeatureSchema().load(request.get_json() or {})
    try:
        feature = create_feature(payload)
        db.session.commit()
    except GeometryValidationError as exc:
        db.session.rollback()
        return {"error": "invalid_geometry", "message": str(exc)}, 400

    return {"id": feature.id}, 201


@geometry_bp.post("/features/bulk")
@jwt_required(optional=True)
def bulk_create_features():
    payload = BulkFeatureSchema().load(request.get_json() or {})
    created = []
    try:
        for item in payload["items"]:
            created.append(create_feature(item))
        db.session.commit()
    except GeometryValidationError as exc:
        db.session.rollback()
        return {"error": "invalid_geometry", "message": str(exc)}, 400

    return {"created": len(created), "ids": [f.id for f in created]}, 201


@geometry_bp.get("/features/<int:feature_id>")
@jwt_required(optional=True)
def get_feature(feature_id: int):
    f = Feature.query.get_or_404(feature_id)
    return {
        "id": f.id,
        "project_id": f.project_id,
        "layer_id": f.layer_id,
        "feature_type": f.feature_type,
        "sub_type": f.sub_type,
        "name": f.name,
        "tag": f.tag,
        "geometry": f.geometry_json,
        "properties": f.properties or {},
        "parent_id": f.parent_id,
        "is_active": f.is_active,
    }


@geometry_bp.patch("/features/<int:feature_id>")
@jwt_required(optional=True)
def patch_feature(feature_id: int):
    f = Feature.query.get_or_404(feature_id)
    payload = request.get_json() or {}
    try:
        update_feature(f, payload)
        db.session.commit()
    except GeometryValidationError as exc:
        db.session.rollback()
        return {"error": "invalid_geometry", "message": str(exc)}, 400

    return {"message": "Feature updated"}


@geometry_bp.delete("/features/<int:feature_id>")
@jwt_required(optional=True)
def delete_feature(feature_id: int):
    f = Feature.query.get_or_404(feature_id)
    f.is_active = False
    db.session.commit()
    return {"message": "Feature deleted"}


@geometry_bp.post("/features/bulk-delete")
@jwt_required(optional=True)
def bulk_delete_features():
    payload = request.get_json() or {}
    ids = payload.get("feature_ids", [])
    if not ids:
        return {"error": "missing_ids", "message": "feature_ids required"}, 400

    Feature.query.filter(Feature.id.in_(ids)).update({"is_active": False}, synchronize_session=False)
    db.session.commit()
    return {"deleted": len(ids)}


@geometry_bp.post("/features/bulk-rename")
@jwt_required(optional=True)
def bulk_rename_features():
    payload = request.get_json() or {}
    ids = payload.get("feature_ids", [])
    prefix = payload.get("prefix", "Feature")
    if not ids:
        return {"error": "missing_ids", "message": "feature_ids required"}, 400

    updated = 0
    features = Feature.query.filter(Feature.id.in_(ids)).order_by(Feature.id.asc()).all()
    for idx, feature in enumerate(features, start=1):
        feature.name = f"{prefix}-{idx}"
        updated += 1

    db.session.commit()
    return {"updated": updated}


@geometry_bp.get("/export/geojson")
@jwt_required(optional=True)
def export_geojson():
    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return {"error": "missing_project", "message": "project_id query param required"}, 400

    features = Feature.query.filter_by(project_id=project_id, is_active=True).all()
    return feature_collection(features)


@geometry_bp.post("/spatial-query/inside-boundary")
@jwt_required(optional=True)
def spatial_query_inside_boundary():
    payload = SpatialQuerySchema().load(request.get_json() or {})
    boundary = Feature.query.filter_by(
        id=payload["boundary_id"],
        project_id=payload["project_id"],
        feature_type="boundary",
        is_active=True,
    ).first()
    if boundary is None:
        return {"error": "invalid_boundary", "message": "Boundary not found"}, 404

    result = features_inside_boundary(payload["project_id"], boundary)
    return {"count": len(result), "features": [f.id for f in result]}

