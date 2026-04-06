from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.db.extensions import db
from app.models import TerrainData
from app.schemas.common import TerrainSchema
from app.services.terrain_service import create_terrain

terrain_bp = Blueprint("terrain", __name__, url_prefix="/api/terrain")


@terrain_bp.get("")
@jwt_required(optional=True)
def list_terrain():
    project_id = request.args.get("project_id", type=int)
    query = TerrainData.query
    if project_id:
        query = query.filter_by(project_id=project_id)

    records = query.order_by(TerrainData.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "project_id": r.project_id,
            "name": r.name,
            "source_type": r.source_type,
            "metadata": r.metadata_json or {},
        }
        for r in records
    ]


@terrain_bp.post("")
@jwt_required(optional=True)
def upload_terrain_record():
    payload = TerrainSchema().load(request.get_json() or {})
    terrain = create_terrain(payload)
    db.session.commit()
    return {"id": terrain.id, "name": terrain.name}, 201

