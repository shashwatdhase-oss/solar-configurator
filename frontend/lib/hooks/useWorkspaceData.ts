"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { geometryApi } from "@/lib/api/geometryApi";
import { modulesApi } from "@/lib/api/modulesApi";
import { projectsApi } from "@/lib/api/projectsApi";
import { reportsApi } from "@/lib/api/reportsApi";
import { terrainApi } from "@/lib/api/terrainApi";
import { useWorkspaceStore } from "@/lib/store/workspaceStore";
import type { Report, TerrainData } from "@/lib/types/entities";

export function useWorkspaceData(projectId: number) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [terrain, setTerrain] = useState<TerrainData[]>([]);

  const { setProject, setLayers, setFeatures, setJobs, bumpViewportRefresh } = useWorkspaceStore();

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [project, layers, features, jobs, reportsData, terrainData] = await Promise.all([
        projectsApi.get(projectId),
        projectsApi.listLayers(projectId),
        geometryApi.list(projectId),
        modulesApi.listJobs(projectId),
        reportsApi.list(projectId),
        terrainApi.list(projectId),
      ]);

      setProject(project);
      setLayers(layers);
      setFeatures(features);
      setJobs(jobs);
      setReports(reportsData);
      setTerrain(terrainData);
      bumpViewportRefresh();
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? String(err.message) : "Failed to load workspace";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [bumpViewportRefresh, projectId, setFeatures, setJobs, setLayers, setProject]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    loading,
    error,
    reports,
    terrain,
    reload,
  };
}

