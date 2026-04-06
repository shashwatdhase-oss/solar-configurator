import { httpClient } from "@/lib/api/client";

export const helpApi = {
  async moduleGuidance(): Promise<Record<string, string>> {
    const { data } = await httpClient.get("/api/help/modules");
    return data;
  },

  async crsGuidance(): Promise<Record<string, string>> {
    const { data } = await httpClient.get("/api/help/crs");
    return data;
  },
};

