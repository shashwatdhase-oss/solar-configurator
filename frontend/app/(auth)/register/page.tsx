import Link from "next/link";
import { AuthForm } from "@/components/common/AuthForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Register</h1>
        <p className="mt-1 text-sm text-slate-600">Create your EPC workspace account</p>
        <div className="mt-6">
          <AuthForm mode="register" />
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Already have an account? <Link className="text-teal-700" href="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}

