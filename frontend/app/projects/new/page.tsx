"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { projectsApi } from "@/lib/api/projectsApi";
import type { User } from "@/lib/types/entities";

const DEFAULT_USER: User = {
  id: 0,
  email: "local@offline",
  full_name: "Local Engineer",
  role: "admin",
  organization_id: 1,
};

export default function NewProjectPage() {
  const router = useRouter();
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

  const [name, setName] = useState("Gujarat Solar Park");
  const [code, setCode] = useState("GJ-001");
  const [description, setDescription] = useState("New utility-scale plant");
  const [crs, setCrs] = useState("EPSG:32644");
  const [capacity, setCapacity] = useState(50);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setSubmitting(true);
    try {
      const resp = await projectsApi.create({
        organization_id: user.organization_id,
        name,
        code,
        description,
        status: "draft",
        crs,
        capacity_mw: capacity,
        metadata: {},
      });
      toast.success("Project created");
      router.push(`/projects/${resp.id}`);
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? String(err.message) : "Failed to create project";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen p-6">
      <h1 className="mb-4 text-2xl font-bold">Create Project</h1>
      <form onSubmit={onSubmit} className="max-w-2xl space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <input className="w-full rounded border border-slate-300 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="w-full rounded border border-slate-300 px-3 py-2" value={code} onChange={(e) => setCode(e.target.value)} required />
        <textarea className="w-full rounded border border-slate-300 px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        <input className="w-full rounded border border-slate-300 px-3 py-2" value={crs} onChange={(e) => setCrs(e.target.value)} />
        <input
          className="w-full rounded border border-slate-300 px-3 py-2"
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
        />
        <button disabled={submitting} className="rounded bg-teal-700 px-4 py-2 text-white">
          {submitting ? "Creating..." : "Create"}
        </button>
      </form>
    </main>
  );
}