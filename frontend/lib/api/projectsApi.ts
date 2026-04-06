import { httpClient } from "@/lib/api/client";
import type { Layer, Project, Revision } from "@/lib/types/entities";

export const projectsApi = {
  async list(organizationId?: number): Promise<Project[]> {
    const { data } = await httpClient.get("/api/projects", { params: { organization_id: organizationId } });
    return data;
  },

  async create(payload: Omit<Project, "id">): Promise<{ id: number }> {
    const { data } = await httpClient.post("/api/projects", payload);
    return data;
  },

  async get(projectId: number): Promise<Project> {
    const { data } = await httpClient.get(`/api/projects/${projectId}`);
    return data;
  },

  async update(projectId: number, payload: Partial<Project>): Promise<void> {
    await httpClient.patch(`/api/projects/${projectId}`, payload);
  },

  async listRevisions(projectId: number): Promise<Revision[]> {
    const { data } = await httpClient.get(`/api/projects/${projectId}/revisions`);
    return data;
  },

  async createRevision(projectId: number, payload: { name: string; note?: string; is_active?: boolean }): Promise<Revision> {
    const { data } = await httpClient.post(`/api/projects/${projectId}/revisions`, payload);
    return data;
  },

  async listLayers(projectId: number): Promise<Layer[]> {
    const { data } = await httpClient.get("/api/layers", { params: { project_id: projectId } });
    return data;
  },

  async updateLayer(layerId: number, payload: Partial<Layer>): Promise<void> {
    await httpClient.patch(`/api/layers/${layerId}`, payload);
  },
};

