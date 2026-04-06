"""Seed script for demo data.
Run: python scripts/seed.py
"""

from werkzeug.security import generate_password_hash

from app import create_app
from app.db.extensions import db
from app.models import Feature, Layer, Organization, Project, Revision, User
from app.services.project_service import create_default_layers
from app.utils.geometry import geojson_to_db_geometry


app = create_app()


RAJASTHAN_BOUNDARY = {
    "type": "Polygon",
    "coordinates": [
        [
            [72.6150, 26.9150],
            [72.6300, 26.9150],
            [72.6300, 26.9285],
            [72.6150, 26.9285],
            [72.6150, 26.9150],
        ]
    ],
}


def main():
    with app.app_context():
        db.drop_all()
        db.create_all()

        org = Organization(name="SunGrid EPC", metadata_json={"region": "India"})
        db.session.add(org)
        db.session.flush()

        user = User(
            email="admin@sungrid.local",
            password_hash=generate_password_hash("password123"),
            full_name="Admin Engineer",
            role="admin",
            organization_id=org.id,
        )
        db.session.add(user)
        db.session.flush()

        project = Project(
            organization_id=org.id,
            name="Jaisalmer 100MW",
            code="JSM-100MW",
            description="Utility-scale solar park demo",
            status="active",
            crs="EPSG:32643",
            capacity_mw=100,
            metadata_json={"state": "Rajasthan", "client": "Utility Corp"},
        )
        db.session.add(project)
        db.session.flush()

        rev = Revision(project_id=project.id, name="R1", note="Initial engineering revision", is_active=True)
        db.session.add(rev)

        layers = create_default_layers(project.id)
        db.session.flush()
        boundary_layer = next(layer for layer in layers if layer.layer_type == "boundary")
        table_layer = next(layer for layer in layers if layer.layer_type == "table")
        pile_layer = next(layer for layer in layers if layer.layer_type == "pile")
        inverter_layer = next(layer for layer in layers if layer.layer_type == "inverter")
        cable_layer = next(layer for layer in layers if layer.layer_type == "cable")

        boundary = Feature(
            project_id=project.id,
            layer_id=boundary_layer.id,
            feature_type="boundary",
            name="Main Boundary",
            geometry=geojson_to_db_geometry(RAJASTHAN_BOUNDARY),
            geometry_json=RAJASTHAN_BOUNDARY,
            properties={"zone": "A"},
            is_active=True,
        )
        db.session.add(boundary)

        sample_tables = [
            {
                "type": "Polygon",
                "coordinates": [[[72.6180, 26.9180], [72.6195, 26.9180], [72.6195, 26.9186], [72.6180, 26.9186], [72.6180, 26.9180]]],
            },
            {
                "type": "Polygon",
                "coordinates": [[[72.6200, 26.9180], [72.6215, 26.9180], [72.6215, 26.9186], [72.6200, 26.9186], [72.6200, 26.9180]]],
            },
        ]
        for idx, geom in enumerate(sample_tables, start=1):
            db.session.add(
                Feature(
                    project_id=project.id,
                    layer_id=table_layer.id,
                    feature_type="table",
                    name=f"T-{idx}",
                    geometry=geojson_to_db_geometry(geom),
                    geometry_json=geom,
                    properties={"sample": True},
                    is_active=True,
                )
            )

        for idx, coord in enumerate([[72.6187, 26.9177], [72.6207, 26.9177], [72.6227, 26.9177]], start=1):
            point = {"type": "Point", "coordinates": coord}
            db.session.add(
                Feature(
                    project_id=project.id,
                    layer_id=pile_layer.id,
                    feature_type="pile",
                    name=f"P-{idx}",
                    geometry=geojson_to_db_geometry(point),
                    geometry_json=point,
                    properties={},
                    is_active=True,
                )
            )

        inverter = {"type": "Point", "coordinates": [72.6245, 26.9200]}
        db.session.add(
            Feature(
                project_id=project.id,
                layer_id=inverter_layer.id,
                feature_type="inverter",
                name="INV-1",
                geometry=geojson_to_db_geometry(inverter),
                geometry_json=inverter,
                properties={"capacity_kw": 5000},
                is_active=True,
            )
        )

        cable = {
            "type": "LineString",
            "coordinates": [[72.6190, 26.9183], [72.6245, 26.9200]],
        }
        db.session.add(
            Feature(
                project_id=project.id,
                layer_id=cable_layer.id,
                feature_type="cable",
                name="C-1",
                geometry=geojson_to_db_geometry(cable),
                geometry_json=cable,
                properties={"type": "DC"},
                is_active=True,
            )
        )

        db.session.commit()
        print("Seed completed")


if __name__ == "__main__":
    main()

