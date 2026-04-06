import { httpClient } from "@/lib/api/client";
import type { TerrainData } from "@/lib/types/entities";

export const terrainApi = {
  async list(projectId: number): Promise<TerrainData[]> {
    const { data } = await httpClient.get("/api/terrain", { params: { project_id: projectId } });
    return data;
  },

  async create(payload: Omit<TerrainData, "id">): Promise<{ id: number; name: string }> {
    const { data } = await httpClient.post("/api/terrain", payload);
    return data;
  },
};

