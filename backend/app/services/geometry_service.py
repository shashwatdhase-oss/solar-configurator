from collections.abc import Iterable
from shapely.geometry import shape, mapping, Polygon
from shapely.validation import explain_validity

from app.db.extensions import db
from app.models import Feature
from app.utils.geometry import geojson_to_db_geometry, normalize_polygon_coordinates


class GeometryValidationError(ValueError):
    pass


def validate_boundary_geometry(geometry: dict):
    geom = shape(geometry)
    if geom.geom_type != "Polygon":
        raise GeometryValidationError("Boundary must be a Polygon")

    coords = list(geom.exterior.coords)
    if len(coords) < 4:
        raise GeometryValidationError("Boundary must have at least 3 vertices")

    if geom.area <= 0:
        raise GeometryValidationError("Boundary area must be non-zero")

    if not geom.is_valid:
        raise GeometryValidationError(f"Boundary is invalid: {explain_validity(geom)}")



def create_feature(payload: dict) -> Feature:
    geometry = payload["geometry"]
    if payload["feature_type"] == "boundary":
        geometry = normalize_polygon_coordinates(geometry)
        validate_boundary_geometry(geometry)

    feature = Feature(
        project_id=payload["project_id"],
        layer_id=payload["layer_id"],
        feature_type=payload["feature_type"],
        sub_type=payload.get("sub_type"),
        name=payload.get("name"),
        tag=payload.get("tag"),
        geometry=geojson_to_db_geometry(geometry),
        geometry_json=geometry,
        properties=payload.get("properties", {}),
        parent_id=payload.get("parent_id"),
        is_active=payload.get("is_active", True),
    )
    db.session.add(feature)
    return feature


def update_feature(feature: Feature, payload: dict) -> Feature:
    for field in ["name", "tag", "sub_type", "properties", "is_active", "layer_id"]:
        if field in payload:
            setattr(feature, field, payload[field])

    if "geometry" in payload:
        geometry = payload["geometry"]
        if feature.feature_type == "boundary":
            geometry = normalize_polygon_coordinates(geometry)
            validate_boundary_geometry(geometry)
        feature.geometry = geojson_to_db_geometry(geometry)
        feature.geometry_json = geometry

    return feature


def feature_to_geojson(feature: Feature) -> dict:
    return {
        "type": "Feature",
        "id": feature.id,
        "geometry": feature.geometry_json,
        "properties": {
            "feature_type": feature.feature_type,
            "sub_type": feature.sub_type,
            "name": feature.name,
            "tag": feature.tag,
            "layer_id": feature.layer_id,
            "is_active": feature.is_active,
            **(feature.properties or {}),
        },
    }


def feature_collection(features: Iterable[Feature]) -> dict:
    return {"type": "FeatureCollection", "features": [feature_to_geojson(f) for f in features]}


def features_inside_boundary(project_id: int, boundary_feature: Feature) -> list[Feature]:
    boundary = shape(boundary_feature.geometry_json)
    candidates = Feature.query.filter_by(project_id=project_id, is_active=True).all()
    result = []
    for feature in candidates:
        if feature.id == boundary_feature.id:
            continue
        geom = shape(feature.geometry_json)
        if boundary.contains(geom):
            result.append(feature)
    return result


def polygon_contains_polygon(outer: Polygon, inner_geojson: dict) -> bool:
    return outer.contains(shape(inner_geojson))

