import os

from geoalchemy2.shape import from_shape
from shapely.geometry import mapping, shape

DATABASE_URL = os.getenv("DATABASE_URL", "")
USE_SQLITE_GEOMETRY = DATABASE_URL.startswith("sqlite")


def geojson_to_db_geometry(geometry: dict):
    shp = shape(geometry)
    if USE_SQLITE_GEOMETRY:
        return mapping(shp)
    return from_shape(shp, srid=4326)


def normalize_polygon_coordinates(geometry: dict) -> dict:
    shp = shape(geometry)
    if shp.geom_type == "Polygon":
        coords = list(shp.exterior.coords)
        if coords[0] != coords[-1]:
            coords.append(coords[0])
            shp = type(shp)([coords])
    return mapping(shp)