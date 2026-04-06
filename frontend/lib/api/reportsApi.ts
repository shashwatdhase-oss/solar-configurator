import { httpClient } from "@/lib/api/client";
import type { Report } from "@/lib/types/entities";

export const reportsApi = {
  async list(projectId: number): Promise<Report[]> {
    const { data } = await httpClient.get("/api/reports", { params: { project_id: projectId } });
    return data;
  },

  async createSummary(projectId: number): Promise<{ id: number; payload: Record<string, unknown> }> {
    const { data } = await httpClient.post("/api/reports/summary", { project_id: projectId });
    return data;
  },

  async getBOQ(projectId: number): Promise<Record<string, unknown>> {
    const { data } = await httpClient.get("/api/reports/boq", { params: { project_id: projectId } });
    return data;
  },

  async getGeoJSON(projectId: number): Promise<Record<string, unknown>> {
    const { data } = await httpClient.get("/api/reports/geojson", { params: { project_id: projectId } });
    return data;
  },

  async getKML(projectId: number): Promise<{ kml: string }> {
    const { data } = await httpClient.get("/api/reports/kml", { params: { project_id: projectId } });
    return data;
  },
};

