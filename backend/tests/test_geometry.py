from tests.helpers import BOUNDARY_GEOMETRY, create_project, get_layer_by_type, register_user


def setup_project(client, org_payload):
    reg = register_user(client, org_payload)
    org_id = reg.get_json()["user"]["organization_id"]
    project = create_project(client, org_id).get_json()
    boundary_layer = get_layer_by_type(client, project["id"], "boundary")
    table_layer = get_layer_by_type(client, project["id"], "table")
    return project, boundary_layer, table_layer


def test_feature_crud_and_geojson_export(client, org_payload):
    project, boundary_layer, _ = setup_project(client, org_payload)

    create_resp = client.post(
        "/api/geometry/features",
        json={
            "project_id": project["id"],
            "layer_id": boundary_layer["id"],
            "feature_type": "boundary",
            "name": "B-1",
            "geometry": BOUNDARY_GEOMETRY,
            "properties": {},
        },
    )
    assert create_resp.status_code == 201
    feature_id = create_resp.get_json()["id"]

    get_resp = client.get(f"/api/geometry/features/{feature_id}")
    assert get_resp.status_code == 200
    assert get_resp.get_json()["feature_type"] == "boundary"

    patch_resp = client.patch(
        f"/api/geometry/features/{feature_id}",
        json={"name": "B-1-updated", "properties": {"owner": "epc"}},
    )
    assert patch_resp.status_code == 200

    export_resp = client.get(f"/api/geometry/export/geojson?project_id={project['id']}")
    assert export_resp.status_code == 200
    assert export_resp.get_json()["type"] == "FeatureCollection"

    delete_resp = client.delete(f"/api/geometry/features/{feature_id}")
    assert delete_resp.status_code == 200


def test_boundary_validation_rejects_invalid_polygon(client, org_payload):
    project, boundary_layer, _ = setup_project(client, org_payload)

    invalid = {
        "type": "Polygon",
        "coordinates": [[[72.1, 26.1], [72.2, 26.2], [72.2, 26.1], [72.1, 26.2], [72.1, 26.1]]],
    }
    resp = client.post(
        "/api/geometry/features",
        json={
            "project_id": project["id"],
            "layer_id": boundary_layer["id"],
            "feature_type": "boundary",
            "name": "bad",
            "geometry": invalid,
            "properties": {},
        },
    )
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "invalid_geometry"

