from collections import Counter
from shapely.geometry import shape
from app.models import Feature


def build_summary_report(project_id: int):
    features = Feature.query.filter_by(project_id=project_id, is_active=True).all()
    counts = Counter([f.feature_type for f in features])
    total_area = 0.0
    total_line_length = 0.0
    for feature in features:
        geom = shape(feature.geometry_json)
        if geom.geom_type in ["Polygon", "MultiPolygon"]:
            total_area += geom.area
        if geom.geom_type in ["LineString", "MultiLineString"]:
            total_line_length += geom.length

    return {
        "feature_counts": dict(counts),
        "total_polygon_area_degree2": total_area,
        "total_line_length_degree": total_line_length,
    }


def build_geojson_export(project_id: int):
    features = Feature.query.filter_by(project_id=project_id, is_active=True).all()
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": f.id,
                "geometry": f.geometry_json,
                "properties": {
                    "feature_type": f.feature_type,
                    "name": f.name,
                    "tag": f.tag,
                    "layer_id": f.layer_id,
                    **(f.properties or {}),
                },
            }
            for f in features
        ],
    }


def build_kml_export(project_id: int) -> str:
    features = Feature.query.filter_by(project_id=project_id, is_active=True).all()
    placemarks = []
    for feature in features:
        geom = shape(feature.geometry_json)
        if geom.geom_type == "Point":
            x, y = geom.coords[0]
            coord_text = f"{x},{y},0"
            geometry_kml = f"<Point><coordinates>{coord_text}</coordinates></Point>"
        elif geom.geom_type == "LineString":
            coord_text = " ".join([f"{x},{y},0" for x, y in geom.coords])
            geometry_kml = f"<LineString><coordinates>{coord_text}</coordinates></LineString>"
        elif geom.geom_type == "Polygon":
            coord_text = " ".join([f"{x},{y},0" for x, y in geom.exterior.coords])
            geometry_kml = (
                "<Polygon><outerBoundaryIs><LinearRing>"
                f"<coordinates>{coord_text}</coordinates>"
                "</LinearRing></outerBoundaryIs></Polygon>"
            )
        else:
            continue
        placemarks.append(
            f"<Placemark><name>{feature.name or f'Feature-{feature.id}'}</name>{geometry_kml}</Placemark>"
        )

    return (
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
        "<kml xmlns=\"http://www.opengis.net/kml/2.2\"><Document>"
        + "".join(placemarks)
        + "</Document></kml>"
    )

