export type UserRole = "admin" | "engineer" | "viewer";

export type GeometryType =
  | "Point"
  | "LineString"
  | "Polygon"
  | "MultiPoint"
  | "MultiLineString"
  | "MultiPolygon";

export interface Geometry {
  type: GeometryType;
  coordinates: unknown;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  organization_id: number;
}

export interface Project {
  id: number;
  organization_id: number;
  name: string;
  code: string;
  description: string;
  status: "draft" | "active" | "completed" | "archived";
  crs: string;
  capacity_mw: number;
  metadata: Record<string, unknown>;
}

export interface Revision {
  id: number;
  name: string;
  note: string;
  is_active: boolean;
}

export interface Layer {
  id: number;
  project_id: number;
  name: string;
  layer_type: string;
  visible: boolean;
  locked: boolean;
  style: {
    color?: string;
    lineWidth?: number;
    lineStyle?: "solid" | "dashed";
    fillColor?: string;
    zIndex?: number;
  };
  z_index: number;
}

export interface Feature {
  id: number;
  project_id: number;
  layer_id: number;
  feature_type: string;
  sub_type?: string | null;
  name?: string | null;
  tag?: string | null;
  geometry: Geometry;
  properties: Record<string, unknown>;
  parent_id?: number | null;
  is_active: boolean;
}

export interface Job {
  id: number;
  project_id: number;
  module_name: string;
  status: "pending" | "running" | "done" | "failed";
  progress: number;
  error_message?: string | null;
  result_payload?: Record<string, unknown> | null;
  created_at: string;
}

export interface Report {
  id: number;
  project_id: number;
  report_type: string;
  title: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface TerrainData {
  id: number;
  project_id: number;
  name: string;
  source_type: string;
  metadata: Record<string, unknown>;
}

