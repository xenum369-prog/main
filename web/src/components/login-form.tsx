"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      if (!response.ok) {
        const result = await response.json();
        setError(result.error ?? "Sign in failed.");
        return;
      }
      router.replace("/");
    } catch {
      setError("Unable to reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-white p-8 shadow-sm sm:p-10">
        <div className="mb-9 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-[var(--green)] text-lg font-bold text-white" aria-hidden="true">M</div>
          <div><p className="text-xl font-semibold">Maintain</p><p className="text-sm text-[var(--muted)]">Maintenance operations</p></div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Sign in with your organization account.</p>
        <form className="mt-7 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium">Work email
            <input name="email" type="email" autoComplete="username" required maxLength={254} className="mt-2 h-12 w-full rounded-xl border border-[var(--line)] px-3" />
          </label>
          <label className="block text-sm font-medium">Password
            <input name="password" type="password" autoComplete="current-password" required className="mt-2 h-12 w-full rounded-xl border border-[var(--line)] px-3" />
          </label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
          <button disabled={busy} className="h-12 w-full rounded-xl bg-[var(--green)] font-semibold text-white hover:bg-[var(--green-dark)] disabled:opacity-60">
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-xs leading-5 text-[var(--muted)]">Access is provisioned by your administrator. There are no default production accounts.</p>
      </section>
    </main>
  );
}
