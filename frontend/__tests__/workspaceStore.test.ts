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

test("updates tool and boundary selection", () => {
  const store = useWorkspaceStore.getState();
  store.setActiveTool("draw-boundary");
  store.setSelectedBoundaryId(42);

  const next = useWorkspaceStore.getState();
  expect(next.activeTool).toBe("draw-boundary");
  expect(next.selectedBoundaryId).toBe(42);
});

test("increments viewport refresh", () => {
  const store = useWorkspaceStore.getState();
  store.bumpViewportRefresh();
  store.bumpViewportRefresh();
  expect(useWorkspaceStore.getState().viewportRefreshVersion).toBe(2);
});

