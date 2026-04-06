from flask import Blueprint

help_bp = Blueprint("help", __name__, url_prefix="/api/help")


@help_bp.get("/modules")
def module_help():
    return {
        "place_tables": "Requires selected boundary_id and table_layer_id. Tables are generated only when complete polygons fit inside boundary.",
        "place_piles": "Creates pile points for table supports (placeholder service).",
        "cable_routing_variants": "Route cable networks across equipment groups (placeholder).",
        "terrain_analysis": "Runs slope and grading checks based on terrain data (placeholder).",
    }


@help_bp.get("/crs")
def crs_help():
    return {
        "storage": "All geometries are persisted in EPSG:4326.",
        "rendering": "Frontend map and canvas interpret geometry in WGS84 via shared utilities.",
        "metric_ops": "If metric calculations are needed, isolate projected CRS operations in service utilities.",
    }

