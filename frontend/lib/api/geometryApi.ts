import { httpClient } from "@/lib/api/client";
import type { Feature, Geometry } from "@/lib/types/entities";

export interface CreateFeaturePayload {
  project_id: number;
  layer_id: number;
  feature_type: string;
  sub_type?: string;
  name?: string;
  tag?: string;
  geometry: Geometry;
  properties?: Record<string, unknown>;
  parent_id?: number;
}

export const geometryApi = {
  async list(projectId: number): Promise<Feature[]> {
    const { data } = await httpClient.get("/api/geometry/features", { params: { project_id: projectId } });
    return data;
  },

  async create(payload: CreateFeaturePayload): Promise<{ id: number }> {
    const { data } = await httpClient.post("/api/geometry/features", payload);
    return data;
  },

  async bulkCreate(payload: { items: CreateFeaturePayload[] }): Promise<{ created: number; ids: number[] }> {
    const { data } = await httpClient.post("/api/geometry/features/bulk", payload);
    return data;
  },

  async get(featureId: number): Promise<Feature> {
    const { data } = await httpClient.get(`/api/geometry/features/${featureId}`);
    return data;
  },

  async update(featureId: number, payload: Partial<CreateFeaturePayload>): Promise<void> {
    await httpClient.patch(`/api/geometry/features/${featureId}`, payload);
  },

  async remove(featureId: number): Promise<void> {
    await httpClient.delete(`/api/geometry/features/${featureId}`);
  },

  async bulkDelete(featureIds: number[]): Promise<void> {
    await httpClient.post("/api/geometry/features/bulk-delete", { feature_ids: featureIds });
  },

  async bulkRename(featureIds: number[], prefix: string): Promise<void> {
    await httpClient.post("/api/geometry/features/bulk-rename", { feature_ids: featureIds, prefix });
  },

  async exportGeoJSON(projectId: number): Promise<Record<string, unknown>> {
    const { data } = await httpClient.get("/api/geometry/export/geojson", { params: { project_id: projectId } });
    return data;
  },

  async spatialQueryInsideBoundary(projectId: number, boundaryId: number): Promise<{ count: number; features: number[] }> {
    const { data } = await httpClient.post("/api/geometry/spatial-query/inside-boundary", {
      project_id: projectId,
      boundary_id: boundaryId,
    });
    return data;
  },
};

