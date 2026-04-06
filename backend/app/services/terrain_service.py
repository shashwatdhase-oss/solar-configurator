from app.db.extensions import db
from app.models import TerrainData


def create_terrain(payload: dict):
    terrain = TerrainData(
        project_id=payload["project_id"],
        name=payload["name"],
        source_type=payload["source_type"],
        metadata_json=payload.get("metadata", {}),
    )
    db.session.add(terrain)
    return terrain

