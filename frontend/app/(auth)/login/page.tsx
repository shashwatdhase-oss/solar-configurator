import Link from "next/link";
import { AuthForm } from "@/components/common/AuthForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-1 text-sm text-slate-600">Access your engineering workspace</p>
        <div className="mt-6">
          <AuthForm mode="login" />
        </div>
        <p className="mt-4 text-sm text-slate-600">
          New account? <Link className="text-teal-700" href="/register">Register</Link>
        </p>
      </section>
    </main>
  );
}

