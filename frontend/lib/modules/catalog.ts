export type ModuleFieldType = "number" | "select" | "text";

export interface ModuleFieldOption {
  label: string;
  value: string;
}

export interface ModuleField {
  key: string;
  label: string;
  type: ModuleFieldType;
  defaultValue: string;
  step?: string;
  min?: string;
  options?: ModuleFieldOption[];
  helper: string;
}

export interface ModuleDefinition {
  key: string;
  name: string;
  description: string;
  requiresBoundary?: boolean;
  fields: ModuleField[];
}

export const moduleCatalog: ModuleDefinition[] = [
  {
    key: "place_tables",
    name: "Place Tables",
    description: "Populate the selected boundary with fixed-tilt or tracker table polygons using layout spacing, tilt, and offset settings.",
    requiresBoundary: true,
    fields: [
      { key: "table_length_m", label: "Table Length (m)", type: "number", defaultValue: "12", min: "1", step: "0.1", helper: "North-south footprint of one table." },
      { key: "table_width_m", label: "Table Width (m)", type: "number", defaultValue: "3", min: "0.5", step: "0.1", helper: "East-west footprint of one table." },
      { key: "strings_per_table", label: "Strings / Table", type: "number", defaultValue: "2", min: "1", step: "1", helper: "Electrical grouping per table." },
      { key: "modules_per_string", label: "Modules / String", type: "number", defaultValue: "14", min: "1", step: "1", helper: "Used for electrical metadata and reporting." },
      { key: "attachment_height_m", label: "Attachment Height (m)", type: "number", defaultValue: "1.2", min: "0", step: "0.1", helper: "Lowest structural attachment height." },
      { key: "alignment", label: "Alignment", type: "select", defaultValue: "center", options: [{ label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" }], helper: "Horizontal alignment inside the usable boundary width." },
      { key: "table_type", label: "Table Type", type: "select", defaultValue: "fixed_tilt", options: [{ label: "Fixed Tilt", value: "fixed_tilt" }, { label: "Tracker", value: "tracker" }], helper: "Stored as the table subtype for downstream workflows." },
      { key: "boundary_offset_m", label: "Boundary Offset (m)", type: "number", defaultValue: "1", min: "0", step: "0.1", helper: "Clearance from the boundary before placement starts." },
      { key: "pitch_m", label: "Pitch (m)", type: "number", defaultValue: "6.5", min: "1", step: "0.1", helper: "For fixed tilt: north-south row pitch. For tracker: east-west tracker row pitch." },
      { key: "east_west_gap_m", label: "EW Gap (m)", type: "number", defaultValue: "0.8", min: "0", step: "0.1", helper: "Used for fixed-tilt table gap inside a row." },
      { key: "north_south_gap_m", label: "NS Gap (m)", type: "number", defaultValue: "1", min: "0", step: "0.1", helper: "Used for tracker block spacing along the north-south direction." },
      { key: "module_gap_m", label: "Module Gap (m)", type: "number", defaultValue: "0.05", min: "0", step: "0.01", helper: "Gap between modules within the frame." },
      { key: "tilt_deg", label: "Tilt (deg)", type: "number", defaultValue: "18", min: "0", step: "0.1", helper: "PVcase layout guidance commonly uses tilt as a core placement parameter." },
      { key: "azimuth_deg", label: "Azimuth (deg)", type: "number", defaultValue: "180", min: "0", step: "0.1", helper: "Use south-facing 180 deg as the default for utility layouts." },
    ],
  },
  {
    key: "place_piles",
    name: "Place Piles",
    description: "Generate pile points from placed tables or tracker rows using pile spacing and end-clearance rules.",
    requiresBoundary: true,
    fields: [
      { key: "pile_spacing_m", label: "Pile Spacing (m)", type: "number", defaultValue: "4.5", min: "0.5", step: "0.1", helper: "Center-to-center spacing along each table row." },
      { key: "edge_clearance_m", label: "End Clearance (m)", type: "number", defaultValue: "0.6", min: "0", step: "0.1", helper: "Distance from row ends to first pile." },
      { key: "pile_offset_m", label: "Pile Offset (m)", type: "number", defaultValue: "0.0", min: "0", step: "0.1", helper: "Optional offset from table centerline." },
      { key: "pile_type", label: "Pile Type", type: "select", defaultValue: "driven", options: [{ label: "Driven", value: "driven" }, { label: "Screw", value: "screw" }, { label: "Micro Pile", value: "micro_pile" }], helper: "Useful for reporting and downstream foundation checks." },
    ],
  },
  {
    key: "inverter_grouping",
    name: "Inverter Grouping",
    description: "Cluster tables into inverter service groups by DC capacity and grouping strategy.",
    requiresBoundary: true,
    fields: [
      { key: "dc_capacity_kw", label: "Inverter DC Capacity (kW)", type: "number", defaultValue: "5000", min: "100", step: "50", helper: "Maximum DC load per inverter group." },
      { key: "grouping_mode", label: "Grouping Mode", type: "select", defaultValue: "nearest", options: [{ label: "Nearest", value: "nearest" }, { label: "Row Based", value: "row_based" }, { label: "Block Based", value: "block_based" }], helper: "How tables should be clustered before placing inverter groups." },
      { key: "reserve_factor_pct", label: "Reserve Factor (%)", type: "number", defaultValue: "5", min: "0", step: "1", helper: "Leaves spare capacity margin in each inverter block." },
    ],
  },
  {
    key: "scb_grouping",
    name: "SCB Grouping",
    description: "Create string combiner box groups from strings or table blocks using configurable input counts.",
    requiresBoundary: true,
    fields: [
      { key: "strings_per_scb", label: "Strings / SCB", type: "number", defaultValue: "12", min: "1", step: "1", helper: "Target number of strings connected to one combiner." },
      { key: "placement_mode", label: "Placement Mode", type: "select", defaultValue: "centroid", options: [{ label: "Centroid", value: "centroid" }, { label: "Trench Edge", value: "trench_edge" }, { label: "Road Access", value: "road_access" }], helper: "Preferred SCB placement strategy." },
    ],
  },
  {
    key: "mms_tagging",
    name: "MMS Tagging",
    description: "Apply mounting structure tags and naming conventions to tables, trackers, or rows.",
    fields: [
      { key: "tag_prefix", label: "Tag Prefix", type: "text", defaultValue: "MMS", helper: "Prefix used in generated structure tags." },
      { key: "start_index", label: "Start Index", type: "number", defaultValue: "1", min: "1", step: "1", helper: "First running sequence number." },
      { key: "tag_scope", label: "Tag Scope", type: "select", defaultValue: "table", options: [{ label: "Table", value: "table" }, { label: "Row", value: "row" }, { label: "Block", value: "block" }], helper: "Which objects should receive tags." },
    ],
  },
  {
    key: "coordinate_marking",
    name: "Coordinate Marking",
    description: "Drop coordinate annotations across the site using grid or interval rules.",
    fields: [
      { key: "interval_m", label: "Interval (m)", type: "number", defaultValue: "25", min: "1", step: "1", helper: "Spacing between coordinate marks." },
      { key: "label_format", label: "Label Format", type: "select", defaultValue: "easting_northing", options: [{ label: "Easting / Northing", value: "easting_northing" }, { label: "Lat / Lon", value: "lat_lon" }], helper: "Annotation format used in the mark labels." },
    ],
  },
  {
    key: "match_lines",
    name: "Match Lines",
    description: "Create drawing split lines for large plans and sheeted reports.",
    fields: [
      { key: "sheet_width_m", label: "Sheet Width (m)", type: "number", defaultValue: "250", min: "10", step: "10", helper: "Target coverage per sheet in the east-west direction." },
      { key: "sheet_height_m", label: "Sheet Height (m)", type: "number", defaultValue: "180", min: "10", step: "10", helper: "Target coverage per sheet in the north-south direction." },
      { key: "overlap_m", label: "Overlap (m)", type: "number", defaultValue: "10", min: "0", step: "1", helper: "Shared overlap between neighboring sheets." },
    ],
  },
  {
    key: "grid_marking",
    name: "Grid Marking",
    description: "Generate engineering grids for layout control and survey coordination.",
    fields: [
      { key: "grid_spacing_x_m", label: "Grid X Spacing (m)", type: "number", defaultValue: "20", min: "1", step: "1", helper: "East-west grid interval." },
      { key: "grid_spacing_y_m", label: "Grid Y Spacing (m)", type: "number", defaultValue: "20", min: "1", step: "1", helper: "North-south grid interval." },
      { key: "grid_labeling", label: "Grid Labeling", type: "select", defaultValue: "alpha_numeric", options: [{ label: "Alpha Numeric", value: "alpha_numeric" }, { label: "Numeric", value: "numeric" }], helper: "Grid naming convention." },
    ],
  },
  {
    key: "cable_routing_variants",
    name: "Cable Routing",
    description: "Create cable routes using trench-aware shortest-path or sticky-trench strategies.",
    requiresBoundary: true,
    fields: [
      { key: "cable_type", label: "Cable Type", type: "select", defaultValue: "dc", options: [{ label: "DC", value: "dc" }, { label: "AC", value: "ac" }, { label: "HV", value: "hv" }], helper: "PVcase cabling workflows distinguish DC, AC, and HV routes." },
      { key: "routing_mode", label: "Routing Mode", type: "select", defaultValue: "shortest_path", options: [{ label: "Shortest Path", value: "shortest_path" }, { label: "Stick To Trench", value: "stick_to_trench" }], helper: "Based on trench stickiness routing behavior from cabling tools." },
      { key: "slack_pct", label: "Slack (%)", type: "number", defaultValue: "3", min: "0", step: "1", helper: "Adds routing allowance over the geometric path." },
    ],
  },
  {
    key: "messenger_wire",
    name: "Messenger Wire",
    description: "Configure messenger wire routes between support points with sag and span checks.",
    fields: [
      { key: "max_span_m", label: "Max Span (m)", type: "number", defaultValue: "30", min: "1", step: "1", helper: "Maximum unsupported span length." },
      { key: "sag_pct", label: "Sag (%)", type: "number", defaultValue: "2", min: "0", step: "0.1", helper: "Sag allowance relative to span length." },
    ],
  },
  {
    key: "trench_generation",
    name: "Trench Generation",
    description: "Generate trench centerlines and metadata for electrical or communications routing.",
    requiresBoundary: true,
    fields: [
      { key: "trench_depth_m", label: "Depth (m)", type: "number", defaultValue: "1.0", min: "0.1", step: "0.1", helper: "Excavation depth." },
      { key: "trench_width_m", label: "Width (m)", type: "number", defaultValue: "0.6", min: "0.1", step: "0.1", helper: "Typical trench working width." },
      { key: "routing_preference", label: "Routing Preference", type: "select", defaultValue: "road_edge", options: [{ label: "Road Edge", value: "road_edge" }, { label: "Boundary Edge", value: "boundary_edge" }, { label: "Shortest Path", value: "shortest_path" }], helper: "Preferred corridor for trench generation." },
    ],
  },
  {
    key: "earthing",
    name: "Earthing",
    description: "Generate earthing network points or strips using spacing and ring options.",
    fields: [
      { key: "grid_spacing_m", label: "Grid Spacing (m)", type: "number", defaultValue: "25", min: "1", step: "1", helper: "Spacing between earthing points or strips." },
      { key: "ring_required", label: "Perimeter Ring", type: "select", defaultValue: "yes", options: [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }], helper: "Whether to include a perimeter earthing ring." },
      { key: "resistivity_ohm_m", label: "Soil Resistivity (ohm-m)", type: "number", defaultValue: "100", min: "1", step: "1", helper: "Useful for sizing and reporting ground network assumptions." },
    ],
  },
  {
    key: "lightning_ese",
    name: "Lightning / ESE",
    description: "Place air terminals or ESE devices using coverage radius and height settings.",
    fields: [
      { key: "protection_type", label: "Protection Type", type: "select", defaultValue: "air_terminal", options: [{ label: "Air Terminal", value: "air_terminal" }, { label: "ESE", value: "ese" }], helper: "Select the preferred lightning protection concept." },
      { key: "mast_height_m", label: "Mast Height (m)", type: "number", defaultValue: "6", min: "1", step: "0.5", helper: "Height of protection mast above grade." },
      { key: "coverage_radius_m", label: "Coverage Radius (m)", type: "number", defaultValue: "35", min: "1", step: "1", helper: "Target protected radius." },
    ],
  },
  {
    key: "robot_analysis",
    name: "Robot Analysis",
    description: "Assess robotic cleaning or inspection routes using aisle width and turning constraints.",
    fields: [
      { key: "robot_width_m", label: "Robot Width (m)", type: "number", defaultValue: "1.2", min: "0.1", step: "0.1", helper: "Nominal robot footprint width." },
      { key: "turn_radius_m", label: "Turn Radius (m)", type: "number", defaultValue: "2.5", min: "0.1", step: "0.1", helper: "Minimum turning radius for navigation checks." },
      { key: "travel_mode", label: "Travel Mode", type: "select", defaultValue: "aisle", options: [{ label: "Aisle", value: "aisle" }, { label: "Row Top", value: "row_top" }], helper: "Route assumption used in robot coverage logic." },
    ],
  },
  {
    key: "terrain_analysis",
    name: "Terrain Analysis",
    description: "Analyze terrain mesh, slope limits, and grading risk for the selected site.",
    requiresBoundary: true,
    fields: [
      { key: "slope_units", label: "Slope Units", type: "select", defaultValue: "degrees", options: [{ label: "Degrees", value: "degrees" }, { label: "Percent", value: "percent" }], helper: "Terrain mesh tools commonly evaluate slopes in degrees or percent." },
      { key: "max_ns_slope", label: "Max N-S Slope", type: "number", defaultValue: "12", min: "0", step: "0.1", helper: "Useful for tracker or layout viability screening." },
      { key: "max_ew_slope", label: "Max E-W Slope", type: "number", defaultValue: "8", min: "0", step: "0.1", helper: "Cross-slope threshold for constructability checks." },
    ],
  },
  {
    key: "road_and_drainage",
    name: "Road and Drainage",
    description: "Generate access roads and drainage corridors using width and slope controls.",
    requiresBoundary: true,
    fields: [
      { key: "road_width_m", label: "Road Width (m)", type: "number", defaultValue: "4", min: "1", step: "0.1", helper: "Typical internal solar site access width." },
      { key: "shoulder_width_m", label: "Shoulder Width (m)", type: "number", defaultValue: "0.5", min: "0", step: "0.1", helper: "Extra shoulder allowance beyond the traveled road." },
      { key: "drain_slope_pct", label: "Drain Slope (%)", type: "number", defaultValue: "1", min: "0", step: "0.1", helper: "Longitudinal slope target for drainage channels." },
    ],
  },
  {
    key: "report_generation",
    name: "Report Generation",
    description: "Generate design summary reports and quantity outputs with selected formats.",
    fields: [
      { key: "report_type", label: "Report Type", type: "select", defaultValue: "summary", options: [{ label: "Summary", value: "summary" }, { label: "BOQ", value: "boq" }, { label: "GeoJSON", value: "geojson" }, { label: "KML", value: "kml" }], helper: "Primary report format to generate." },
      { key: "include_geometry", label: "Include Geometry", type: "select", defaultValue: "yes", options: [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }], helper: "Include geometry-derived metrics in the output." },
    ],
  },
];

export function getModuleDefinition(moduleKey: string): ModuleDefinition | undefined {
  return moduleCatalog.find((moduleDef) => moduleDef.key === moduleKey);
}
