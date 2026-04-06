"use client";

import type { Job } from "@/lib/types/entities";

export function BottomPanel({ jobs }: { jobs: Job[] }) {
  return (
    <div className="h-full overflow-y-auto rounded-t-lg border border-slate-200 bg-white p-3">
      <h3 className="mb-2 text-sm font-semibold">Job Log</h3>
      {jobs.length === 0 ? (
        <div className="text-xs text-slate-500">No jobs yet.</div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div key={job.id} className="rounded border border-slate-200 p-2 text-xs">
              <div className="font-medium">{job.module_name}</div>
              <div>Status: {job.status}</div>
              <div>Progress: {job.progress}%</div>
              {job.error_message && <div className="text-red-600">{job.error_message}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

