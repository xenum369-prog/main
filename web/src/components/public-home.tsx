import Link from "next/link";
import { Activity, ArrowDown, ArrowRight, Boxes, ClipboardCheck, ClipboardList, ShieldCheck, Wrench } from "lucide-react";
import ContactForm from "@/components/contact-form";

const capabilities = [
  {
    icon: Boxes,
    title: "Know what you maintain",
    description: "Keep an organized asset register with location, criticality, and a traceable maintenance history.",
  },
  {
    icon: ClipboardList,
    title: "Turn requests into work",
    description: "Review requests, prioritize work, assign technicians, and follow each order through verification.",
  },
  {
    icon: Activity,
    title: "Keep parts accountable",
    description: "Record receipts and issues, reserve parts for jobs, and see available stock before work begins.",
  },
  {
    icon: ShieldCheck,
    title: "Make every change visible",
    description: "Use role-aware access, scoped workspaces, notifications, and an audit trail for key actions.",
  },
];

export default function PublicHome() {
  return (
    <main className="landing min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
          <Link className="flex items-center gap-3" href="/" aria-label="Maintain home">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-800 text-lg font-bold text-white">M</span>
            <span>
              <span className="block text-base font-semibold tracking-tight">Maintain</span>
              <span className="block text-xs text-slate-500">Maintenance operations</span>
            </span>
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#capabilities" className="hover:text-emerald-800">Capabilities</a>
            <a href="#workflow" className="hover:text-emerald-800">How it works</a>
            <a href="#coverage" className="hover:text-emerald-800">Service scope</a>
            <a href="#contact" className="hover:text-emerald-800">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Sign in</Link>
            <a href="#contact" className="hidden rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 sm:inline-flex">
              Talk to our team
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#f5f8f6]">
        <div className="absolute -end-24 -top-32 size-[28rem] rounded-full bg-emerald-100/70 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_.95fr] lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[.12em] text-emerald-900">
              <span className="size-2 rounded-full bg-emerald-600" /> Maintenance, made manageable
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Keep your sites moving with maintenance that connects the whole team.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Maintain brings assets, service requests, work orders, technicians, and parts into one clear operating workflow—from first report to verified close.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#contact" className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900">
                Discuss your operation <ArrowRight size={17} />
              </a>
              <a href="#capabilities" className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 hover:border-emerald-700">
                Explore capabilities
              </a>
            </div>
            <p className="mt-5 text-sm text-slate-500">Built for facilities and maintenance teams that need a shared, accountable workflow.</p>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute inset-4 rounded-[2rem] bg-emerald-200/50 blur-2xl" aria-hidden="true" />
            <div className="relative rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_28px_90px_-40px_rgba(15,60,44,.45)] sm:p-7">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <p className="text-sm font-medium text-slate-500">A connected workflow</p>
                  <h2 className="mt-1 text-xl font-semibold">From request to resolution</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Traceable</span>
              </div>
              <ol className="mt-5 space-y-3">
                {[
                  ["01", "Report", "A request is linked to the site and asset."],
                  ["02", "Review", "A manager sets priority and approves the work."],
                  ["03", "Assign", "A technician receives a clear work order and checklist."],
                  ["04", "Verify", "Parts, completion notes, and closeout are recorded."],
                ].map(([number, title, description], index) => (
                  <li key={number} className="flex gap-4 rounded-xl bg-slate-50 p-4">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-lg text-sm font-semibold ${index === 3 ? "bg-emerald-800 text-white" : "bg-white text-emerald-900 ring-1 ring-slate-200"}`}>{number}</span>
                    <div><p className="font-semibold">{title}</p><p className="mt-1 text-sm leading-5 text-slate-600">{description}</p></div>
                    {index === 3 ? <ClipboardCheck className="ms-auto mt-1 shrink-0 text-emerald-800" size={18} aria-hidden="true" /> : null}
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
                <Wrench size={16} className="text-emerald-800" /> One workspace. Clear ownership at each step.
              </div>
            </div>
          </div>
        </div>
        <a className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-xs font-medium text-slate-500 md:flex" href="#capabilities">
          Scroll to explore <ArrowDown size={14} />
        </a>
      </section>

      <section id="capabilities" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[.12em] text-emerald-800">What Maintain supports</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">The practical tools behind reliable maintenance.</h2>
          <p className="mt-4 leading-7 text-slate-600">A focused maintenance operations platform—not a promise of outsourced repair coverage or third-party services.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg">
              <span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-900"><Icon size={21} /></span>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="scroll-mt-24 border-y border-slate-200 bg-[#f5f8f6]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.12em] text-emerald-800">A clear operating model</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Every handoff has an owner.</h2>
            <p className="mt-4 leading-7 text-slate-600">Teams use role-based access to coordinate requests, work, assets, and inventory without losing the history of what changed.</p>
            <a href="#contact" className="mt-7 inline-flex items-center gap-2 font-semibold text-emerald-900 hover:underline">See how it fits your team <ArrowRight size={16} /></a>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Illustrative workflow</p><h3 className="mt-1 text-lg font-semibold">A request becomes accountable work</h3></div>
              <ClipboardCheck className="text-emerald-800" aria-hidden="true" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Request", "Capture issue, priority, and related asset."],
                ["Work order", "Approve, assign, and complete a checklist."],
                ["Closeout", "Record notes, verify, and retain the history."],
              ].map(([title, description], index) => (
                <div key={title} className="relative rounded-xl bg-slate-50 p-4">
                  <span className="text-xs font-semibold text-emerald-800">STEP 0{index + 1}</span>
                  <p className="mt-2 font-semibold">{title}</p>
                  <p className="mt-2 text-sm leading-5 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-500">This is an example of the product workflow, not a customer case study or performance claim.</p>
          </div>
        </div>
      </section>

      <section id="coverage" className="scroll-mt-24 mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.12em] text-emerald-800">Service scope</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Your sites. Your teams. Your deployment.</h2>
          <p className="mt-4 max-w-3xl leading-7 text-slate-600">
            Maintain is maintenance-management software that your organization configures for its own locations. It does not include field technicians, emergency dispatch, parts purchasing, or a geographic repair-service network. Hosting, email delivery, and integrations require your infrastructure and provider configuration.
          </p>
        </div>
        <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-3 font-semibold hover:border-emerald-700 hover:text-emerald-900">
          Sign in to your workspace <ArrowRight size={16} />
        </Link>
      </section>

      <section id="contact" className="scroll-mt-24 bg-emerald-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.12em] text-emerald-200">Let’s talk maintenance</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Tell us what your operation needs.</h2>
            <p className="mt-4 max-w-lg leading-7 text-emerald-100/80">Share a few details for an administrator to review. Your inquiry is stored securely in this workspace; no external email or notification provider is configured.</p>
            <p className="mt-6 text-sm text-emerald-100/70">Please don’t include passwords, sensitive personal information, or urgent safety reports.</p>
          </div>
          <ContactForm />
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} Maintain. Maintenance operations workspace.</p>
          <div className="flex items-center gap-5"><a href="#capabilities" className="hover:text-emerald-900">Capabilities</a><a href="#contact" className="hover:text-emerald-900">Contact</a><Link href="/login" className="hover:text-emerald-900">Sign in</Link></div>
        </div>
      </footer>
    </main>
  );
}
