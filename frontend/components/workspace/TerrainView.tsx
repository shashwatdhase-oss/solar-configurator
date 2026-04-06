"use client";

import type { TerrainData } from "@/lib/types/entities";

export function TerrainView({ terrain }: { terrain: TerrainData[] }) {
  return (
    <div className="h-full overflow-y-auto rounded border border-slate-200 bg-white p-4">
      <h3 className="text-lg font-semibold">3D Terrain (Placeholder)</h3>
      <p className="mt-2 text-sm text-slate-600">
        Terrain rendering is isolated from map/canvas to prevent cross-module instability. This view is prepared for future 3D mesh and slope analysis integrations.
      </p>
      <div className="mt-4 space-y-2">
        {terrain.length === 0 ? (
          <div className="text-sm text-slate-500">No terrain datasets uploaded.</div>
        ) : (
          terrain.map((t) => (
            <div key={t.id} className="rounded border border-slate-200 p-2 text-sm">
              <div className="font-medium">{t.name}</div>
              <div className="text-slate-500">Source: {t.source_type}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

