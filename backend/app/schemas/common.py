from marshmallow import Schema, fields, validate, validates_schema, ValidationError
from shapely.geometry import shape
from shapely.validation import explain_validity

ALLOWED_GEOMETRIES = [
    "Point",
    "LineString",
    "Polygon",
    "MultiPoint",
    "MultiLineString",
    "MultiPolygon",
]


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=6))


class RegisterSchema(LoginSchema):
    full_name = fields.String(required=True)
    role = fields.String(required=True, validate=validate.OneOf(["admin", "engineer", "viewer"]))
    organization_name = fields.String(required=True)


class ProjectSchema(Schema):
    id = fields.Int(dump_only=True)
    organization_id = fields.Int(required=True)
    name = fields.String(required=True)
    code = fields.String(required=True)
    description = fields.String(load_default="")
    status = fields.String(load_default="draft")
    crs = fields.String(load_default="EPSG:32644")
    capacity_mw = fields.Float(load_default=0)
    metadata = fields.Dict(load_default=dict)


class LayerSchema(Schema):
    id = fields.Int(dump_only=True)
    project_id = fields.Int(required=True)
    name = fields.String(required=True)
    layer_type = fields.String(required=True)
    visible = fields.Bool(load_default=True)
    locked = fields.Bool(load_default=False)
    style = fields.Dict(load_default=dict)
    z_index = fields.Int(load_default=0)


class FeatureSchema(Schema):
    id = fields.Int(dump_only=True)
    project_id = fields.Int(required=True)
    layer_id = fields.Int(required=True)
    feature_type = fields.String(required=True)
    sub_type = fields.String(load_default=None, allow_none=True)
    name = fields.String(load_default=None, allow_none=True)
    tag = fields.String(load_default=None, allow_none=True)
    geometry = fields.Dict(required=True)
    properties = fields.Dict(load_default=dict)
    parent_id = fields.Int(load_default=None, allow_none=True)
    is_active = fields.Bool(load_default=True)

    @validates_schema
    def validate_geometry(self, data, **kwargs):
        geom = data.get("geometry")
        if geom is None:
            raise ValidationError("geometry is required", "geometry")

        geom_type = geom.get("type")
        if geom_type not in ALLOWED_GEOMETRIES:
            raise ValidationError(f"Unsupported geometry type: {geom_type}", "geometry")

        try:
            shp = shape(geom)
        except Exception as exc:
            raise ValidationError(f"Invalid geometry payload: {exc}", "geometry") from exc

        if shp.is_empty:
            raise ValidationError("Geometry cannot be empty", "geometry")

        if geom_type in ["Polygon", "MultiPolygon"]:
            if not shp.is_valid:
                reason = explain_validity(shp)
                raise ValidationError(f"Invalid polygon geometry: {reason}", "geometry")
            if shp.area <= 0:
                raise ValidationError("Polygon area must be non-zero", "geometry")


class BulkFeatureSchema(Schema):
    items = fields.List(fields.Nested(FeatureSchema), required=True, validate=validate.Length(min=1))


class PlaceTablesSchema(Schema):
    project_id = fields.Int(required=True)
    boundary_id = fields.Int(required=True)
    table_layer_id = fields.Int(required=True)
    table_length_m = fields.Float(load_default=12.0, validate=validate.Range(min=1.0))
    table_width_m = fields.Float(load_default=3.0, validate=validate.Range(min=0.5))
    module_gap_m = fields.Float(load_default=0.05, validate=validate.Range(min=0.0))
    pitch_m = fields.Float(load_default=6.5, validate=validate.Range(min=1.0))
    east_west_gap_m = fields.Float(load_default=0.8, validate=validate.Range(min=0.0))
    north_south_gap_m = fields.Float(load_default=1.0, validate=validate.Range(min=0.0))
    boundary_offset_m = fields.Float(load_default=1.0, validate=validate.Range(min=0.0))
    attachment_height_m = fields.Float(load_default=1.2, validate=validate.Range(min=0.0))
    tilt_deg = fields.Float(load_default=18.0, validate=validate.Range(min=0.0, max=89.9))
    azimuth_deg = fields.Float(load_default=180.0, validate=validate.Range(min=0.0, max=360.0))
    strings_per_table = fields.Int(load_default=2, validate=validate.Range(min=1))
    modules_per_string = fields.Int(load_default=14, validate=validate.Range(min=1))
    alignment = fields.String(
        load_default="center",
        validate=validate.OneOf(["left", "center", "right"]),
    )
    table_type = fields.String(
        load_default="fixed_tilt",
        validate=validate.OneOf(["fixed_tilt", "tracker"]),
    )


class SpatialQuerySchema(Schema):
    project_id = fields.Int(required=True)
    boundary_id = fields.Int(required=True)


class TerrainSchema(Schema):
    id = fields.Int(dump_only=True)
    project_id = fields.Int(required=True)
    name = fields.String(required=True)
    source_type = fields.String(required=True)
    metadata = fields.Dict(load_default=dict)

