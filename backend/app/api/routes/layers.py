from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.db.extensions import db
from app.models import Layer
from app.schemas.common import LayerSchema

layers_bp = Blueprint("layers", __name__, url_prefix="/api/layers")


@layers_bp.get("")
@jwt_required(optional=True)
def list_layers():
    project_id = request.args.get("project_id", type=int)
    query = Layer.query
    if project_id:
        query = query.filter_by(project_id=project_id)
    layers = query.order_by(Layer.z_index.asc()).all()
    return [
        {
            "id": l.id,
            "project_id": l.project_id,
            "name": l.name,
            "layer_type": l.layer_type,
            "visible": l.visible,
            "locked": l.locked,
            "style": l.style or {},
            "z_index": l.z_index,
        }
        for l in layers
    ]


@layers_bp.post("")
@jwt_required(optional=True)
def create_layer():
    payload = LayerSchema().load(request.get_json() or {})
    layer = Layer(**payload)
    db.session.add(layer)
    db.session.commit()
    return {"id": layer.id, "name": layer.name}, 201


@layers_bp.patch("/<int:layer_id>")
@jwt_required(optional=True)
def update_layer(layer_id: int):
    layer = Layer.query.get_or_404(layer_id)
    payload = request.get_json() or {}
    for field in ["name", "visible", "locked", "z_index", "style"]:
        if field in payload:
            setattr(layer, field, payload[field])
    db.session.commit()
    return {"message": "Layer updated"}

