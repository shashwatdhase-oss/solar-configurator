"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { modulesApi } from "@/lib/api/modulesApi";
import { projectsApi } from "@/lib/api/projectsApi";
import type { Job, Project, User } from "@/lib/types/entities";

const DEFAULT_USER: User = {
  id: 0,
  email: "local@offline",
  full_name: "Local Engineer",
  role: "admin",
  organization_id: 1,
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const user = useMemo<User>(() => {
    if (typeof window === "undefined") return DEFAULT_USER;
    const raw = localStorage.getItem("solar_user");
    if (!raw) return DEFAULT_USER;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return DEFAULT_USER;
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const list = await projectsApi.list(user.organization_id);
        setProjects(list);

        if (list[0]) {
          const latestJobs = await modulesApi.listJobs(list[0].id);
          setJobs(latestJobs.slice(0, 10));
        }
      } catch (err: unknown) {
        const message = err && typeof err === "object" && "message" in err ? String(err.message) : "Failed to load dashboard";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user.organization_id]);

  if (loading) return <main className="p-6">Loading dashboard...</main>;

  return (
    <main className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-600">Welcome, {user.full_name}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/projects/new" className="rounded-md bg-teal-700 px-4 py-2 text-white">Create Project</Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Projects</div>
          <div className="text-2xl font-bold">{projects.length}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Recent Jobs</div>
          <div className="text-2xl font-bold">{jobs.length}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Completed Jobs</div>
          <div className="text-2xl font-bold">{jobs.filter((j) => j.status === "done").length}</div>
        </div>
      </section>

      <section className="mt-6 rounded-lg bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Projects</h2>
        {projects.length === 0 ? (
          <p className="text-slate-600">No projects yet. Create one to start engineering layout work.</p>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between rounded border border-slate-200 p-3">
                <div>
                  <div className="font-medium">{project.name}</div>
                  <div className="text-sm text-slate-500">{project.code} - {project.status}</div>
                </div>
                <Link className="rounded border border-slate-300 px-3 py-1 text-sm" href={`/projects/${project.id}`}>
                  Open Workspace
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-lg bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Recent Jobs</h2>
        {jobs.length === 0 ? (
          <p className="text-slate-600">No jobs run yet.</p>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job.id} className="rounded border border-slate-200 p-3 text-sm">
                <div className="font-medium">{job.module_name}</div>
                <div className="text-slate-600">{job.status} - {job.progress}%</div>
                {job.error_message && <div className="text-red-600">{job.error_message}</div>}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
