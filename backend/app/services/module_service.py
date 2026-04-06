import math

from shapely.geometry import shape

from app.db.extensions import db
from app.models import Feature, Job, Layer
from app.services.geometry_service import polygon_contains_polygon
from app.utils.geometry import geojson_to_db_geometry

MODULES = [
    "place_tables",
    "place_piles",
    "inverter_grouping",
    "scb_grouping",
    "mms_tagging",
    "coordinate_marking",
    "match_lines",
    "grid_marking",
    "cable_routing_variants",
    "messenger_wire",
    "trench_generation",
    "earthing",
    "lightning_ese",
    "robot_analysis",
    "terrain_analysis",
    "road_and_drainage",
    "report_generation",
]

MAX_TABLE_GRID_CELLS = 20000


def create_job(project_id: int, module_name: str, payload: dict | None = None) -> Job:
    job = Job(project_id=project_id, module_name=module_name, status="running", progress=5, input_payload=payload or {})
    db.session.add(job)
    return job


def complete_job(job: Job, result: dict):
    job.status = "done"
    job.progress = 100
    job.result_payload = result


def fail_job(job: Job, message: str):
    job.status = "failed"
    job.error_message = message
    job.progress = 100


def _meters_to_degree_steps(latitude_deg: float, meters_x: float, meters_y: float) -> tuple[float, float]:
    # Keep metric placement inside backend services so frontend rendering remains WGS84-only.
    lat_rad = math.radians(latitude_deg)
    meters_per_deg_lat = 111_320.0
    meters_per_deg_lon = max(111_320.0 * math.cos(lat_rad), 1.0)
    return meters_x / meters_per_deg_lon, meters_y / meters_per_deg_lat


def place_tables(payload: dict) -> dict:
    project_id = payload["project_id"]
    boundary_id = payload.get("boundary_id")
    table_layer_id = payload["table_layer_id"]

    if not boundary_id:
        raise ValueError("Selected boundary is required for table placement")

    boundary = Feature.query.filter_by(
        id=boundary_id,
        project_id=project_id,
        feature_type="boundary",
        is_active=True,
    ).first()
    if boundary is None:
        raise ValueError("Selected boundary does not exist or is inactive")

    table_layer = Layer.query.filter_by(id=table_layer_id, project_id=project_id).first()
    if table_layer is None:
        raise ValueError("Table layer is invalid for this project")

    boundary_poly = shape(boundary.geometry_json)
    minx, miny, maxx, maxy = boundary_poly.bounds
    if boundary_poly.area <= 0:
        raise ValueError("Selected boundary has zero area")

    center_lat = boundary_poly.centroid.y
    table_width_deg, table_length_deg = _meters_to_degree_steps(
        center_lat,
        payload.get("table_width_m", 3.0),
        payload.get("table_length_m", 12.0),
    )
    east_west_gap_deg, pitch_deg = _meters_to_degree_steps(
        center_lat,
        payload.get("east_west_gap_m", 0.8),
        payload.get("pitch_m", 6.5),
    )
    _, north_south_gap_deg = _meters_to_degree_steps(
        center_lat,
        0.0,
        payload.get("north_south_gap_m", 1.0),
    )
    boundary_offset_x_deg, boundary_offset_y_deg = _meters_to_degree_steps(
        center_lat,
        payload.get("boundary_offset_m", 1.0),
        payload.get("boundary_offset_m", 1.0),
    )

    usable_minx = minx + boundary_offset_x_deg
    usable_maxx = maxx - boundary_offset_x_deg
    usable_miny = miny + boundary_offset_y_deg
    usable_maxy = maxy - boundary_offset_y_deg
    usable_width = usable_maxx - usable_minx
    usable_height = usable_maxy - usable_miny

    if usable_width <= table_width_deg or usable_height <= table_length_deg:
        raise ValueError("Selected boundary is too small for the requested table size and offset")

    table_type = payload.get("table_type", "fixed_tilt")
    alignment = payload.get("alignment", "center")

    if table_type == "fixed_tilt":
        if pitch_deg < table_length_deg:
            raise ValueError("For fixed tilt, pitch must be greater than or equal to table length to avoid overlap")
        col_step = table_width_deg + east_west_gap_deg
        row_step = pitch_deg
        cols = max(int((usable_width + east_west_gap_deg) // max(col_step, 1e-12)), 1)
        rows = max(int((usable_height - table_length_deg) // max(row_step, 1e-12)) + 1, 1)
        actual_span_primary = cols * table_width_deg + max(cols - 1, 0) * east_west_gap_deg
        if alignment == "left":
            start_x = usable_minx
        elif alignment == "right":
            start_x = usable_maxx - actual_span_primary
        else:
            start_x = usable_minx + max((usable_width - actual_span_primary) / 2.0, 0.0)
        start_y = usable_miny
        width_step = col_step
        height_step = row_step
    else:
        if pitch_deg < table_width_deg:
            raise ValueError("For tracker, pitch must be greater than or equal to table width to avoid overlap")
        col_step = pitch_deg
        row_step = table_length_deg + north_south_gap_deg
        cols = max(int((usable_width - table_width_deg) // max(col_step, 1e-12)) + 1, 1)
        rows = max(int((usable_height + north_south_gap_deg) // max(row_step, 1e-12)), 1)
        actual_span_primary = cols * table_width_deg + max(cols - 1, 0) * max(col_step - table_width_deg, 0.0)
        if alignment == "left":
            start_x = usable_minx
        elif alignment == "right":
            start_x = usable_maxx - actual_span_primary
        else:
            start_x = usable_minx + max((usable_width - actual_span_primary) / 2.0, 0.0)
        start_y = usable_miny
        width_step = col_step
        height_step = row_step

    if rows * cols > MAX_TABLE_GRID_CELLS:
        raise ValueError(
            "Requested layout is too large to generate with current parameters. Increase pitch/offset or reduce boundary size."
        )

    created = []
    for r in range(rows):
        for c in range(cols):
            x0 = start_x + (c * width_step)
            y0 = start_y + (r * height_step)
            x1 = x0 + table_width_deg
            y1 = y0 + table_length_deg
            table_polygon = {
                "type": "Polygon",
                "coordinates": [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]],
            }

            if polygon_contains_polygon(boundary_poly, table_polygon):
                feature = Feature(
                    project_id=project_id,
                    layer_id=table_layer_id,
                    feature_type="table",
                    sub_type=payload.get("table_type", "fixed_tilt"),
                    name=f"T-{r + 1}-{c + 1}",
                    geometry=geojson_to_db_geometry(table_polygon),
                    geometry_json=table_polygon,
                    properties={
                        "row": r + 1,
                        "col": c + 1,
                        "table_length_m": payload.get("table_length_m", 12.0),
                        "table_width_m": payload.get("table_width_m", 3.0),
                        "module_gap_m": payload.get("module_gap_m", 0.05),
                        "pitch_m": payload.get("pitch_m", 6.5),
                        "east_west_gap_m": payload.get("east_west_gap_m", 0.8),
                        "north_south_gap_m": payload.get("north_south_gap_m", 1.0),
                        "boundary_offset_m": payload.get("boundary_offset_m", 1.0),
                        "attachment_height_m": payload.get("attachment_height_m", 1.2),
                        "tilt_deg": payload.get("tilt_deg", 18.0),
                        "azimuth_deg": payload.get("azimuth_deg", 180.0),
                        "strings_per_table": payload.get("strings_per_table", 2),
                        "modules_per_string": payload.get("modules_per_string", 14),
                        "alignment": alignment,
                    },
                    is_active=True,
                )
                db.session.add(feature)
                created.append(feature)

    if not created:
        raise ValueError(
            "No tables fit inside the selected boundary. Reduce table size, pitch, or boundary offset."
        )

    return {
        "created_count": len(created),
        "boundary_id": boundary_id,
        "rows_attempted": rows,
        "cols_attempted": cols,
        "table_type": table_type,
    }


def run_generic_module(payload: dict, module_name: str):
    if module_name == "place_piles":
        project_id = payload["project_id"]
        boundary_id = payload.get("boundary_id")
        if not boundary_id:
            raise ValueError("Selected boundary is required for pile placement")

        pile_layer = Layer.query.filter_by(project_id=project_id, layer_type="pile").first()
        if pile_layer is None:
            raise ValueError("Pile layer not found for this project")

        boundary = Feature.query.filter_by(
            id=boundary_id,
            project_id=project_id,
            feature_type="boundary",
            is_active=True,
        ).first()
        if boundary is None:
            raise ValueError("Selected boundary does not exist or is inactive")

        table_features = Feature.query.filter_by(
            project_id=project_id,
            feature_type="table",
            is_active=True,
        ).all()
        if not table_features:
            raise ValueError("No table features found. Place tables before generating piles.")

        edge_clearance_m = float(payload.get("edge_clearance_m", 0.6))
        pile_offset_m = float(payload.get("pile_offset_m", 0.0))
        center_lat = shape(boundary.geometry_json).centroid.y
        clearance_x_deg, clearance_y_deg = _meters_to_degree_steps(
            center_lat,
            edge_clearance_m,
            edge_clearance_m,
        )
        pile_offset_x_deg, pile_offset_y_deg = _meters_to_degree_steps(
            center_lat,
            pile_offset_m,
            pile_offset_m,
        )

        created = []
        for table in table_features:
            table_poly = shape(table.geometry_json)
            minx, miny, maxx, maxy = table_poly.bounds
            candidate_points = [
                [minx + clearance_x_deg, miny + clearance_y_deg + pile_offset_y_deg],
                [maxx - clearance_x_deg, miny + clearance_y_deg + pile_offset_y_deg],
                [minx + clearance_x_deg, maxy - clearance_y_deg - pile_offset_y_deg],
                [maxx - clearance_x_deg, maxy - clearance_y_deg - pile_offset_y_deg],
            ]
            for index, coords in enumerate(candidate_points, start=1):
                point_geojson = {"type": "Point", "coordinates": coords}
                feature = Feature(
                    project_id=project_id,
                    layer_id=pile_layer.id,
                    feature_type="pile",
                    sub_type=payload.get("pile_type", "driven"),
                    name=f"{table.name or 'T'}-P{index}",
                    geometry=geojson_to_db_geometry(point_geojson),
                    geometry_json=point_geojson,
                    properties={
                        "source_table_id": table.id,
                        "pile_spacing_m": payload.get("pile_spacing_m", 4.5),
                        "edge_clearance_m": edge_clearance_m,
                        "pile_offset_m": pile_offset_m,
                    },
                    is_active=True,
                )
                db.session.add(feature)
                created.append(feature)

        return {
            "module": module_name,
            "created_count": len(created),
            "message": "Pile points generated from current table layouts",
            "input": payload,
        }

    return {
        "module": module_name,
        "message": "Module placeholder executed",
        "input": payload,
    }
