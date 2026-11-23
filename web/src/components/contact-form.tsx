"use client";

import { FormEvent, useState } from "react";

export default function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to submit inquiry.");
      form.reset();
      setSuccess("Thank you. Your inquiry was recorded for our team.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to submit inquiry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-emerald-800 bg-white p-5 text-slate-950 shadow-xl sm:grid-cols-2 sm:p-7">
      <div>
        <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium">Name</label>
        <input id="contact-name" name="name" autoComplete="name" required minLength={2} maxLength={100} className="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
      </div>
      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium">Work email</label>
        <input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} className="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
      </div>
      <div>
        <label htmlFor="contact-organization" className="mb-1.5 block text-sm font-medium">Organization <span className="text-slate-500">(optional)</span></label>
        <input id="contact-organization" name="organization" autoComplete="organization" maxLength={120} className="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
      </div>
      <div>
        <label htmlFor="contact-service" className="mb-1.5 block text-sm font-medium">What would you like to discuss?</label>
        <select id="contact-service" name="service" required defaultValue="General inquiry" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">
          <option>Asset reliability</option>
          <option>Work management</option>
          <option>Inventory control</option>
          <option>Team coordination</option>
          <option>General inquiry</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium">How can we help?</label>
        <textarea id="contact-message" name="message" required minLength={10} maxLength={3000} rows={4} className="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
      </div>
      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="sm:col-span-2">
        {error ? <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
        {success ? <p role="status" className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{success}</p> : null}
        <button disabled={busy} className="w-full rounded-lg bg-emerald-800 px-4 py-3 font-semibold text-white hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-70">
          {busy ? "Sending…" : "Send inquiry"}
        </button>
        <p className="mt-3 text-xs leading-5 text-slate-500">By submitting, you agree that your details may be used to respond to this inquiry. Data is retained in this workspace database until handled under your organization’s retention policy.</p>
      </div>
    </form>
  );
}
