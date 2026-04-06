import { useWorkspaceStore } from "@/lib/store/workspaceStore";

beforeEach(() => {
  useWorkspaceStore.setState({
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
  });
});

test("boundary selection updates and clears", () => {
  const state = useWorkspaceStore.getState();
  state.setSelectedBoundaryId(10);
  expect(useWorkspaceStore.getState().selectedBoundaryId).toBe(10);
  state.setSelectedBoundaryId(null);
  expect(useWorkspaceStore.getState().selectedBoundaryId).toBeNull();
});

