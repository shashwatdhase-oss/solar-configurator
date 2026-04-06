from tests.helpers import BOUNDARY_GEOMETRY, create_project, get_layer_by_type, register_user


def setup_with_boundary(client, org_payload):
    reg = register_user(client, org_payload)
    org_id = reg.get_json()["user"]["organization_id"]
    project = create_project(client, org_id).get_json()
    boundary_layer = get_layer_by_type(client, project["id"], "boundary")
    table_layer = get_layer_by_type(client, project["id"], "table")

    boundary_resp = client.post(
        "/api/geometry/features",
        json={
            "project_id": project["id"],
            "layer_id": boundary_layer["id"],
            "feature_type": "boundary",
            "name": "Boundary",
            "geometry": BOUNDARY_GEOMETRY,
            "properties": {},
        },
    )
    boundary_id = boundary_resp.get_json()["id"]
    return project, boundary_id, table_layer["id"]


def test_place_tables_requires_boundary(client, org_payload):
    project, _, table_layer_id = setup_with_boundary(client, org_payload)

    resp = client.post(
        "/api/modules/place-tables",
        json={
            "project_id": project["id"],
            "table_layer_id": table_layer_id,
            "rows": 1,
            "cols": 1,
        },
    )
    assert resp.status_code == 400
    assert "boundary" in resp.get_json()["message"].lower()


def test_place_tables_inside_selected_boundary(client, org_payload):
    project, boundary_id, table_layer_id = setup_with_boundary(client, org_payload)

    resp = client.post(
        "/api/modules/place-tables",
        json={
            "project_id": project["id"],
            "boundary_id": boundary_id,
            "table_layer_id": table_layer_id,
            "rows": 3,
            "cols": 3,
        },
    )
    assert resp.status_code == 201
    assert resp.get_json()["result"]["created_count"] > 0

    spatial = client.post(
        "/api/geometry/spatial-query/inside-boundary",
        json={"project_id": project["id"], "boundary_id": boundary_id},
    )
    assert spatial.status_code == 200
    assert spatial.get_json()["count"] >= resp.get_json()["result"]["created_count"]


def test_no_demo_fallback_boundary(client, org_payload):
    reg = register_user(client, org_payload)
    org_id = reg.get_json()["user"]["organization_id"]
    project = create_project(client, org_id).get_json()
    table_layer = get_layer_by_type(client, project["id"], "table")

    resp = client.post(
        "/api/modules/place-tables",
        json={
            "project_id": project["id"],
            "boundary_id": 999999,
            "table_layer_id": table_layer["id"],
        },
    )
    assert resp.status_code == 400
    assert "does not exist" in resp.get_json()["message"].lower()

