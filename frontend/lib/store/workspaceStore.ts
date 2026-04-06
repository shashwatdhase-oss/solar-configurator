import { create } from "zustand";
import type { Feature, Job, Layer, Project } from "@/lib/types/entities";

export type WorkspaceView = "canvas2d" | "map" | "terrain3d" | "reports";
export type WorkspaceTool = "select" | "draw-boundary" | "edit-boundary";

interface PanelState {
  left: boolean;
  right: boolean;
  bottom: boolean;
}

interface WorkspaceState {
  currentProject: Project | null;
  workspaceView: WorkspaceView;
  activeTool: WorkspaceTool;
  layers: Layer[];
  features: Feature[];
  selectedFeatureIds: number[];
  selectedBoundaryId: number | null;
  drawBoundaryDraft: [number, number][];
  editBoundaryDraft: [number, number][];
  panelState: PanelState;
  jobs: Job[];
  moduleDrawerOpen: boolean;
  viewportRefreshVersion: number;

  setProject: (project: Project) => void;
  setWorkspaceView: (view: WorkspaceView) => void;
  setActiveTool: (tool: WorkspaceTool) => void;
  setLayers: (layers: Layer[]) => void;
  setFeatures: (features: Feature[]) => void;
  upsertFeature: (feature: Feature) => void;
  removeFeature: (featureId: number) => void;
  setSelectedFeatureIds: (ids: number[]) => void;
  setSelectedBoundaryId: (id: number | null) => void;
  setDrawBoundaryDraft: (coords: [number, number][]) => void;
  setEditBoundaryDraft: (coords: [number, number][]) => void;
  setPanelOpen: (panel: keyof PanelState, open: boolean) => void;
  setJobs: (jobs: Job[]) => void;
  upsertJob: (job: Job) => void;
  setModuleDrawerOpen: (open: boolean) => void;
  bumpViewportRefresh: () => void;
  resetBoundaryDrafts: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  currentProject: null,
  workspaceView: "map",
  activeTool: "select",
  layers: [],
  features: [],
  selectedFeatureIds: [],
  selectedBoundaryId: null,
  drawBoundaryDraft: [],
  editBoundaryDraft: [],
  panelState: { left: true, right: true, bottom: true },
  jobs: [],
  moduleDrawerOpen: false,
  viewportRefreshVersion: 0,

  setProject: (project) => set({ currentProject: project }),
  setWorkspaceView: (workspaceView) => set({ workspaceView }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setLayers: (layers) => set({ layers }),
  setFeatures: (features) => set({ features }),
  upsertFeature: (feature) => {
    const features = get().features;
    const existingIndex = features.findIndex((f) => f.id === feature.id);
    if (existingIndex === -1) {
      set({ features: [...features, feature] });
      return;
    }
    const next = [...features];
    next[existingIndex] = feature;
    set({ features: next });
  },
  removeFeature: (featureId) => set({ features: get().features.filter((f) => f.id !== featureId) }),
  setSelectedFeatureIds: (selectedFeatureIds) => set({ selectedFeatureIds }),
  setSelectedBoundaryId: (selectedBoundaryId) => set({ selectedBoundaryId }),
  setDrawBoundaryDraft: (drawBoundaryDraft) => set({ drawBoundaryDraft }),
  setEditBoundaryDraft: (editBoundaryDraft) => set({ editBoundaryDraft }),
  setPanelOpen: (panel, open) => set({ panelState: { ...get().panelState, [panel]: open } }),
  setJobs: (jobs) => set({ jobs }),
  upsertJob: (job) => {
    const jobs = get().jobs;
    const idx = jobs.findIndex((j) => j.id === job.id);
    if (idx < 0) {
      set({ jobs: [job, ...jobs] });
      return;
    }
    const next = [...jobs];
    next[idx] = job;
    set({ jobs: next });
  },
  setModuleDrawerOpen: (moduleDrawerOpen) => set({ moduleDrawerOpen }),
  bumpViewportRefresh: () => set({ viewportRefreshVersion: get().viewportRefreshVersion + 1 }),
  resetBoundaryDrafts: () => set({ drawBoundaryDraft: [], editBoundaryDraft: [] }),
}));

