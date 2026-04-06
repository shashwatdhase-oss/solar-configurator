"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";

import { authApi } from "@/lib/api/authApi";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "engineer" | "viewer">("engineer");
  const [organization, setOrganization] = useState("SunGrid EPC");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const resp =
        mode === "login"
          ? await authApi.login({ email, password })
          : await authApi.register({
              email,
              password,
              full_name: fullName,
              role,
              organization_name: organization,
            });

      localStorage.setItem("solar_token", resp.token);
      localStorage.setItem("solar_user", JSON.stringify(resp.user));
      toast.success(mode === "login" ? "Logged in" : "Account created");
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? String(err.message) : "Authentication failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {mode === "register" && (
        <>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Organization"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            required
          />
          <select className="w-full rounded-md border border-slate-300 px-3 py-2" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
            <option value="admin">Admin</option>
            <option value="engineer">Engineer</option>
            <option value="viewer">Viewer</option>
          </select>
        </>
      )}
      <input
        className="w-full rounded-md border border-slate-300 px-3 py-2"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="w-full rounded-md border border-slate-300 px-3 py-2"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button disabled={loading} className="w-full rounded-md bg-teal-700 px-4 py-2 font-medium text-white">
        {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
      </button>
    </form>
  );
}

