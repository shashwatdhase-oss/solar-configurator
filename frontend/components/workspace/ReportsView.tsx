"use client";

import toast from "react-hot-toast";

import { reportsApi } from "@/lib/api/reportsApi";
import type { Report } from "@/lib/types/entities";

interface ReportsViewProps {
  projectId: number;
  reports: Report[];
  onReload: () => Promise<void>;
}

export function ReportsView({ projectId, reports, onReload }: ReportsViewProps) {
  const generateSummary = async () => {
    try {
      await reportsApi.createSummary(projectId);
      toast.success("Summary report generated");
      await onReload();
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? String(err.message) : "Report generation failed";
      toast.error(message);
    }
  };

  const exportGeoJSON = async () => {
    try {
      const data = await reportsApi.getGeoJSON(projectId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${projectId}.geojson`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("GeoJSON exported");
    } catch {
      toast.error("GeoJSON export failed");
    }
  };

  const exportKML = async () => {
    try {
      const { kml } = await reportsApi.getKML(projectId);
      const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${projectId}.kml`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("KML exported");
    } catch {
      toast.error("KML export failed");
    }
  };

  return (
    <div className="h-full overflow-y-auto rounded border border-slate-200 bg-white p-4">
      <h3 className="text-lg font-semibold">Reports</h3>
      <div className="mt-3 flex gap-2 text-sm">
        <button className="rounded bg-teal-700 px-3 py-1 text-white" onClick={() => void generateSummary()}>Generate Summary</button>
        <button className="rounded border border-slate-300 px-3 py-1" onClick={() => void exportGeoJSON()}>Export GeoJSON</button>
        <button className="rounded border border-slate-300 px-3 py-1" onClick={() => void exportKML()}>Export KML</button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {reports.length === 0 ? (
          <div className="text-sm text-slate-500">No reports available yet.</div>
        ) : (
          reports.map((report) => (
            <article key={report.id} className="rounded border border-slate-200 p-3 text-sm">
              <h4 className="font-semibold">{report.title}</h4>
              <p className="text-slate-500">Type: {report.report_type}</p>
              <pre className="mt-2 overflow-x-auto rounded bg-slate-50 p-2 text-xs">{JSON.stringify(report.payload, null, 2)}</pre>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

