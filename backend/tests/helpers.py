def register_user(client, payload):
    return client.post("/api/auth/register", json=payload)


def create_project(client, org_id):
    response = client.post(
        "/api/projects",
        json={
            "organization_id": org_id,
            "name": "Demo Project",
            "code": "DEMO-1",
            "description": "desc",
            "status": "draft",
            "crs": "EPSG:32644",
            "capacity_mw": 10,
            "metadata": {},
        },
    )
    return response


def get_layer_by_type(client, project_id, layer_type):
    layers = client.get(f"/api/layers?project_id={project_id}").get_json()
    return next(layer for layer in layers if layer["layer_type"] == layer_type)


BOUNDARY_GEOMETRY = {
    "type": "Polygon",
    "coordinates": [[[72.1, 26.1], [72.2, 26.1], [72.2, 26.2], [72.1, 26.2], [72.1, 26.1]]],
}

