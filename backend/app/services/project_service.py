from app.db.extensions import db
from app.models import Layer

DEFAULT_LAYERS = [
    {"name": "Boundaries", "layer_type": "boundary", "z_index": 10, "style": {"color": "#0ea5e9", "lineWidth": 2}},
    {"name": "Tables", "layer_type": "table", "z_index": 20, "style": {"color": "#22c55e", "lineWidth": 1}},
    {"name": "Piles", "layer_type": "pile", "z_index": 30, "style": {"color": "#f59e0b", "lineWidth": 1}},
    {"name": "Inverters", "layer_type": "inverter", "z_index": 40, "style": {"color": "#ef4444", "lineWidth": 1}},
    {"name": "Cables", "layer_type": "cable", "z_index": 50, "style": {"color": "#8b5cf6", "lineWidth": 2}},
    {"name": "Terrain", "layer_type": "terrain", "z_index": 5, "style": {"color": "#64748b", "lineWidth": 1}},
    {"name": "Annotations", "layer_type": "annotation", "z_index": 60, "style": {"color": "#111827", "lineWidth": 1}},
]


def create_default_layers(project_id: int):
    layers = []
    for item in DEFAULT_LAYERS:
        layer = Layer(project_id=project_id, visible=True, locked=False, **item)
        layers.append(layer)
        db.session.add(layer)
    return layers

