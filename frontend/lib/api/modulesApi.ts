import { httpClient } from "@/lib/api/client";
import type { Job } from "@/lib/types/entities";

export interface PlaceTablesPayload {
  project_id: number;
  boundary_id: number;
  table_layer_id: number;
  table_length_m?: number;
  table_width_m?: number;
  module_gap_m?: number;
  pitch_m?: number;
  east_west_gap_m?: number;
  north_south_gap_m?: number;
  boundary_offset_m?: number;
  attachment_height_m?: number;
  tilt_deg?: number;
  azimuth_deg?: number;
  strings_per_table?: number;
  modules_per_string?: number;
  alignment?: "left" | "center" | "right";
  table_type?: "fixed_tilt" | "tracker";
}

export const modulesApi = {
  async listModules(): Promise<{ key: string; name: string }[]> {
    const { data } = await httpClient.get("/api/modules");
    return data;
  },

  async placeTables(payload: PlaceTablesPayload): Promise<{ job_id: number; status: string; result: Record<string, unknown> }> {
    const { data } = await httpClient.post("/api/modules/place-tables", payload);
    return data;
  },

  async runModule(moduleKey: string, payload: Record<string, unknown>): Promise<{ job_id: number }> {
    const { data } = await httpClient.post(`/api/modules/${moduleKey}`, payload);
    return data;
  },

  async listJobs(projectId: number): Promise<Job[]> {
    const { data } = await httpClient.get("/api/jobs", { params: { project_id: projectId } });
    return data;
  },
};

