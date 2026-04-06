from tests.helpers import create_project, register_user


def test_project_creation(client, org_payload):
    register_resp = register_user(client, org_payload)
    assert register_resp.status_code == 201
    org_id = register_resp.get_json()["user"]["organization_id"]

    project_resp = create_project(client, org_id)
    assert project_resp.status_code == 201
    body = project_resp.get_json()
    assert body["id"] > 0

    list_resp = client.get(f"/api/projects?organization_id={org_id}")
    assert list_resp.status_code == 200
    assert len(list_resp.get_json()) == 1

