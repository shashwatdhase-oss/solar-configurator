"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { modulesApi } from "@/lib/api/modulesApi";
import { getModuleDefinition, moduleCatalog, type ModuleField } from "@/lib/modules/catalog";
import { useWorkspaceStore } from "@/lib/store/workspaceStore";
import type { Layer } from "@/lib/types/entities";

interface ModuleDrawerProps {
  projectId: number;
  tableLayer?: Layer;
  onRefresh: () => Promise<void>;
}

function buildDefaults(fields: ModuleField[]) {
  return fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.key] = field.defaultValue;
    return acc;
  }, {});
}

export function ModuleDrawer({ projectId, tableLayer, onRefresh }: ModuleDrawerProps) {
  const { selectedBoundaryId, setModuleDrawerOpen, moduleDrawerOpen } = useWorkspaceStore();
  const [selectedModuleKey, setSelectedModuleKey] = useState<string>("place_tables");
  const [formValues, setFormValues] = useState<Record<string, string>>(() => buildDefaults(moduleCatalog[0].fields));
  const [submitting, setSubmitting] = useState(false);

  const selectedModule = useMemo(() => getModuleDefinition(selectedModuleKey) ?? moduleCatalog[0], [selectedModuleKey]);

  useEffect(() => {
    setFormValues(buildDefaults(selectedModule.fields));
  }, [selectedModule]);

  const updateField = (key: string, value: string) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };

  const buildPayload = () => {
    const payload: Record<string, unknown> = {
      project_id: projectId,
    };

    if (selectedModule.requiresBoundary) {
      payload.boundary_id = selectedBoundaryId;
    }

    selectedModule.fields.forEach((field) => {
      if (field.type === "number") {
        payload[field.key] = Number(formValues[field.key]);
      } else {
        payload[field.key] = formValues[field.key];
      }
    });

    return payload;
  };

  const handleRun = async () => {
    if (selectedModule.requiresBoundary && !selectedBoundaryId) {
      toast.error("Select a boundary before running this module");
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload();

      if (selectedModule.key === "place_tables") {
        if (!tableLayer) {
          toast.error("Table layer not found");
          return;
        }

        const resp = await modulesApi.placeTables({
          ...(payload as Record<string, unknown>),
          project_id: projectId,
          boundary_id: Number(selectedBoundaryId),
          table_layer_id: tableLayer.id,
        } as Parameters<typeof modulesApi.placeTables>[0]);

        const createdCount = Number(resp.result.created_count ?? 0);
        if (createdCount === 0) {
          toast.error("No tables fit inside the boundary with the current parameters");
        } else {
          toast.success(`Tables placed: ${createdCount}`);
        }
      } else {
        await modulesApi.runModule(selectedModule.key, payload);
        toast.success(`${selectedModule.name} job created`);
      }

      await onRefresh();
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? String(err.message) : "Module failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!moduleDrawerOpen) {
    return (
      <button className="rounded bg-slate-800 px-3 py-1 text-xs text-white" onClick={() => setModuleDrawerOpen(true)}>
        Open Modules
      </button>
    );
  }

  return (
    <div className="flex h-[min(75vh,40rem)] w-[36rem] min-h-0 flex-col rounded-xl border border-slate-300 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Automation Modules</div>
          <div className="text-xs text-slate-500">Parameter-driven engineering actions</div>
        </div>
        <button className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600" onClick={() => setModuleDrawerOpen(false)}>
          Close
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[12rem_minmax(0,1fr)] overflow-hidden">
        <div className="min-h-0 overflow-y-auto border-r border-slate-200 bg-slate-50 p-2">
          <div className="space-y-1">
            {moduleCatalog.map((moduleDef) => (
              <button
                key={moduleDef.key}
                onClick={() => setSelectedModuleKey(moduleDef.key)}
                className={`w-full rounded-lg px-3 py-2 text-left text-xs ${
                  selectedModule.key === moduleDef.key ? "bg-teal-700 text-white" : "text-slate-700 hover:bg-white"
                }`}
              >
                {moduleDef.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden">
          <div className="border-b border-slate-100 px-4 pt-4">
            <h3 className="text-base font-semibold text-slate-900">{selectedModule.name}</h3>
            <p className="mt-1 pb-3 text-xs leading-5 text-slate-600">{selectedModule.description}</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {selectedModule.requiresBoundary && (
              <div className={`mb-3 rounded-lg border px-3 py-2 text-xs ${selectedBoundaryId ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
                {selectedBoundaryId
                  ? `Using selected boundary #${selectedBoundaryId}`
                  : "This module requires a selected boundary before execution."}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              {selectedModule.fields.map((field) => (
                <label key={field.key} className="block">
                  <div className="mb-1 text-xs font-medium text-slate-700">{field.label}</div>
                  {field.type === "select" ? (
                    <select
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={formValues[field.key] ?? field.defaultValue}
                      onChange={(event) => updateField(field.key, event.target.value)}
                    >
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      type={field.type}
                      min={field.min}
                      step={field.step}
                      value={formValues[field.key] ?? field.defaultValue}
                      onChange={(event) => updateField(field.key, event.target.value)}
                    />
                  )}
                  <div className="mt-1 text-[11px] leading-4 text-slate-500">{field.helper}</div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] text-slate-500">
              Research-backed defaults are prefilled and can be tuned per run.
            </div>
            <button
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={submitting}
              onClick={() => void handleRun()}
            >
              {submitting ? "Running..." : `Run ${selectedModule.name}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
