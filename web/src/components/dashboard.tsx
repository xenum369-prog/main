"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, Bell, Boxes, ClipboardList, Gauge, LogOut, Plus, Users, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";

type UserInfo = { id: string; name: string; role: "ADMIN" | "MANAGER" | "TECHNICIAN" | "REQUESTER"; location: string };
type DashboardData = {
  counts: { assets: number; openRequests: number; activeOrders: number; lowStock: number };
  workload: { name: string; count: number }[];
  recentAudit: { id: string; action: string; entityType: string; createdAt: string; actor: { name: string } | null }[];
};
type Row = Record<string, unknown> & { id: string };
type Tab = "overview" | "requests" | "work-orders" | "assets" | "inventory" | "users";
const text = {
  en: { overview: "Overview", requests: "Requests", orders: "Work orders", assets: "Assets", inventory: "Inventory", users: "Users", signout: "Sign out", empty: "Nothing to show yet.", loadError: "Unable to load workspace data." },
  ar: { overview: "نظرة عامة", requests: "الطلبات", orders: "أوامر العمل", assets: "الأصول", inventory: "المخزون", users: "المستخدمون", signout: "تسجيل الخروج", empty: "لا توجد بيانات بعد.", loadError: "تعذر تحميل بيانات مساحة العمل." },
};

function key() { return crypto.randomUUID(); }

export default function Dashboard({ initialUser }: { initialUser: UserInfo }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [locale, setLocale] = useState<"en" | "ar">("en");
  const [data, setData] = useState<DashboardData | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notifications, setNotifications] = useState<Row[]>([]);
  const mutationPending = useRef(false);
  const formKeys = useRef(new WeakMap<HTMLFormElement, { fingerprint: string; key: string }>());
  const t = text[locale];
  const canManage = initialUser.role === "ADMIN" || initialUser.role === "MANAGER";
  const tabs = useMemo(() => [
    { id: "overview" as const, label: t.overview, icon: Gauge },
    { id: "requests" as const, label: t.requests, icon: ClipboardList },
    { id: "work-orders" as const, label: t.orders, icon: Wrench },
    { id: "assets" as const, label: t.assets, icon: Boxes },
    { id: "inventory" as const, label: t.inventory, icon: Activity },
    ...(initialUser.role === "ADMIN" ? [{ id: "users" as const, label: t.users, icon: Users }] : []),
  ].filter((item) => initialUser.role !== "REQUESTER" || item.id === "overview" || item.id === "requests"), [initialUser.role, t]);

  const refresh = useCallback(async () => {
    setError("");
    const listUrl = tab === "overview" ? null
      : tab === "requests" ? "/api/requests"
        : tab === "work-orders" ? "/api/work-orders"
          : tab === "assets" ? "/api/assets"
            : tab === "users" ? "/api/users" : "/api/inventory";
    const [dashboard, notificationResult] = await Promise.all([
      fetch("/api/dashboard").then((response) => response.ok ? response.json() : Promise.reject()),
      fetch("/api/notifications").then((response) => response.ok ? response.json() : { notifications: [] }),
    ]);
    setData(dashboard);
    setNotifications(notificationResult.notifications ?? []);
    if (listUrl) {
      const response = await fetch(listUrl);
      if (!response.ok) throw new Error("Unable to load list");
      const result = await response.json();
      const property = tab === "requests" ? "requests" : tab === "work-orders" ? "workOrders" : tab === "assets" ? "assets" : tab === "users" ? "users" : "parts";
      setRows(result[property] ?? []);
    } else {
      setRows([]);
    }
  }, [tab]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try { await refresh(); } catch { if (active) setError(t.loadError); }
    };
    void load();
    return () => { active = false; };
  }, [refresh, t.loadError]);

  async function mutate(url: string, method: string, body?: unknown, operationKey = key()) {
    if (mutationPending.current) return null;
    mutationPending.current = true;
    setBusy(true); setNotice(""); setError("");
    try {
      const response = await fetch(url, {
        method,
        headers: { ...(body ? { "content-type": "application/json" } : {}), ...(method !== "GET" ? { "idempotency-key": operationKey } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Action failed");
      setNotice("Saved successfully.");
      await refresh();
      return result;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Action failed");
      return null;
    } finally { mutationPending.current = false; setBusy(false); }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  async function submitForm(event: FormEvent<HTMLFormElement>, endpoint: string, map: (form: FormData) => unknown) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const body = map(form);
    const fingerprint = JSON.stringify(body);
    const previous = formKeys.current.get(formElement);
    const operationKey = previous?.fingerprint === fingerprint ? previous.key : key();
    formKeys.current.set(formElement, { fingerprint, key: operationKey });
    const result = await mutate(endpoint, "POST", body, operationKey);
    if (result) {
      formElement.reset();
      formKeys.current.delete(formElement);
    }
  }

  const metric = (label: string, value: number | undefined, icon: typeof Gauge) => {
    const Icon = icon;
    return <article className="rounded-2xl border border-[var(--line)] bg-white p-5"><div className="flex items-center justify-between text-sm text-[var(--muted)]"><span>{label}</span><Icon size={18} /></div><p className="mt-4 text-3xl font-semibold">{value ?? "—"}</p></article>;
  };

  return <main dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen">
    <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-7">
        <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-[var(--green)] font-bold text-white">M</div><div><p className="font-semibold">Maintain</p><p className="text-xs text-[var(--muted)]">{initialUser.location}</p></div></div>
        <div className="flex items-center gap-2"><span className="hidden text-sm text-[var(--muted)] sm:inline">{initialUser.name} · {initialUser.role.toLowerCase()}</span>
          <div className="relative">
            <details>
              <summary className="list-none rounded-lg border border-[var(--line)] px-3 py-2 text-sm" aria-label="Notifications">🔔 {notifications.filter((item) => !item.readAt).length || ""}</summary>
              <ul className="absolute end-0 top-12 z-20 w-72 rounded-xl border border-[var(--line)] bg-white p-2 shadow-lg">
                {notifications.length ? notifications.slice(0, 6).map((item) => <li key={item.id}><button onClick={() => mutate("/api/notifications", "PATCH", { id: item.id })} className={`w-full rounded-lg p-2 text-start text-sm hover:bg-[var(--paper)] ${item.readAt ? "text-[var(--muted)]" : "font-medium"}`}>{String(item.message)}</button></li>) : <li className="p-3 text-sm text-[var(--muted)]">No notifications.</li>}
              </ul>
            </details>
          </div>
          <button onClick={() => setLocale(locale === "en" ? "ar" : "en")} className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm" aria-label="Toggle language">{locale === "en" ? "العربية" : "English"}</button>
          <button onClick={() => void signOut()} className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--paper)]" aria-label={t.signout}><LogOut size={18} /></button>
        </div>
      </div>
    </header>
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-7 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Main navigation" className="flex gap-2 overflow-auto lg:flex-col lg:overflow-visible">
        {tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${tab === id ? "bg-[#e6f1eb] text-[var(--green-dark)]" : "text-[var(--muted)] hover:bg-white"}`}><Icon size={18} />{label}</button>)}
      </nav>
      <section className="min-w-0">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-[var(--green)]">MAINTENANCE OPERATIONS</p><h1 className="mt-1 text-2xl font-semibold">{tabs.find((item) => item.id === tab)?.label}</h1></div>
          <button onClick={() => refresh().catch(() => setError(t.loadError))} className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm">Refresh</button>
        </div>
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-900">{notice}</p>}
        {tab === "overview" && <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metric("Registered assets", data?.counts.assets, Boxes)}
            {metric("Requests awaiting review", data?.counts.openRequests, ClipboardList)}
            {metric("Active work orders", data?.counts.activeOrders, Wrench)}
            {initialUser.role !== "REQUESTER" && metric("Parts at / below reorder point", data?.counts.lowStock, Bell)}
          </div>
          {initialUser.role === "REQUESTER" && <RequestForm onSubmit={(event) => submitForm(event, "/api/requests", (form) => ({ title: form.get("title"), description: form.get("description"), priority: form.get("priority"), assetId: form.get("assetId") || null }))} busy={busy} />}
          {(initialUser.role === "ADMIN" || initialUser.role === "MANAGER") && <section className="rounded-2xl border border-[var(--line)] bg-white p-5"><h2 className="font-semibold">Technician workload</h2>{data?.workload.length ? <ul className="mt-4 grid gap-2 sm:grid-cols-2">{data.workload.map((item) => <li key={item.name} className="rounded-xl bg-[var(--paper)] p-3 text-sm">{item.name}<span className="float-end font-semibold">{item.count} active</span></li>)}</ul> : <p className="mt-4 text-sm text-[var(--muted)]">{t.empty}</p>}</section>}
          {initialUser.role === "ADMIN" || initialUser.role === "MANAGER" ? <section className="rounded-2xl border border-[var(--line)] bg-white p-5"><h2 className="font-semibold">Recent audit activity</h2>
            {data?.recentAudit.length ? <ul className="mt-4 divide-y divide-[var(--line)]">{data.recentAudit.map((item) => <li key={item.id} className="flex justify-between gap-3 py-3 text-sm"><span>{item.action.replaceAll(".", " ")} · {item.actor?.name ?? "System"}</span><time className="shrink-0 text-[var(--muted)]">{new Date(item.createdAt).toLocaleDateString()}</time></li>)}</ul> : <p className="mt-4 text-sm text-[var(--muted)]">{t.empty}</p>}
          </section> : null}
        </div>}
        {tab === "requests" && <div className="space-y-5">
          {initialUser.role === "REQUESTER" && <RequestForm onSubmit={(event) => submitForm(event, "/api/requests", (form) => ({ title: form.get("title"), description: form.get("description"), priority: form.get("priority"), assetId: form.get("assetId") || null }))} busy={busy} />}
          <div className="space-y-3">{rows.length ? rows.map((row) => <article key={row.id} className="rounded-2xl border border-[var(--line)] bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-semibold">{String(row.title)}</h2><div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge value={String(row.status)} /><StatusBadge value={String(row.priority)} />{row.requester ? <span className="text-sm text-[var(--muted)]">{String((row.requester as Row).name)}</span> : null}</div></div>{canManage && row.status === "SUBMITTED" && <div className="flex gap-2"><button onClick={() => mutate(`/api/requests/${row.id}/decision`, "PATCH", { status: "APPROVED" })} className="rounded-lg bg-[var(--green)] px-3 py-2 text-sm text-white">Approve</button><button onClick={() => { const decisionNote = window.prompt("Reason for rejection"); if (decisionNote?.trim()) void mutate(`/api/requests/${row.id}/decision`, "PATCH", { status: "REJECTED", decisionNote }); }} className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm">Reject</button></div>}{canManage && row.status === "APPROVED" && <button onClick={() => mutate(`/api/requests/${row.id}/convert`, "POST", {})} className="rounded-lg bg-[var(--green)] px-3 py-2 text-sm text-white">Create work order</button>}</div><p className="mt-3 text-sm">{String(row.description)}</p><Attachments entityType="MaintenanceRequest" entityId={row.id} /></article>) : <Empty text={t.empty} />}</div>
        </div>}
        {tab === "work-orders" && <div className="space-y-3">{rows.length ? rows.map((row) => <article key={row.id} className="rounded-2xl border border-[var(--line)] bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-semibold">{String(row.title)}</h2><div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge value={String(row.status)} /><span className="text-sm text-[var(--muted)]">{String(row.assignedUser ? (row.assignedUser as Row).name : "Unassigned")}</span></div></div><div className="flex flex-wrap gap-2">{canManage && <AssignmentControl row={row} onAssign={(assignedUserId) => mutate(`/api/work-orders/${row.id}`, "PATCH", { assignedUserId })} />}<OrderActions row={row} role={initialUser.role} onAction={(body) => mutate(`/api/work-orders/${row.id}`, "PATCH", body)} /></div></div><p className="mt-3 text-sm">{String(row.description)}</p><Checklist value={row.checklist} onSave={(checklist) => mutate(`/api/work-orders/${row.id}`, "PATCH", { checklist })} /><Attachments entityType="WorkOrder" entityId={row.id} />{initialUser.role === "TECHNICIAN" || canManage ? <ReservationControl workOrderId={row.id} onAction={(body) => mutate("/api/inventory/movements", "POST", body)} /> : null}</article>) : <Empty text={t.empty} />}</div>}
        {tab === "assets" && <div className="space-y-5">{canManage && <AssetForm onSubmit={(event) => submitForm(event, "/api/assets", (form) => ({ code: form.get("code"), name: form.get("name"), category: form.get("category"), criticality: form.get("criticality") }))} busy={busy} />}{rows.length ? <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white"><table className="w-full min-w-[760px] text-start text-sm"><thead className="bg-[#f7faf8]"><tr>{["Asset", "Code", "Category", "Criticality", "Status", "Files"].map((item) => <th key={item} className="px-4 py-3 font-medium text-[var(--muted)]">{item}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--line)]"><td className="px-4 py-3 font-medium">{String(row.name)}</td><td className="px-4 py-3">{String(row.code)}</td><td className="px-4 py-3">{String(row.category)}</td><td className="px-4 py-3">{String(row.criticality)}</td><td className="px-4 py-3">{String(row.status)}</td><td className="px-4 py-3"><Attachments entityType="Asset" entityId={row.id} /></td></tr>)}</tbody></table></div> : <Empty text={t.empty} />}</div>}
        {tab === "inventory" && <div className="space-y-5">{canManage && <PartForm onSubmit={(event) => submitForm(event, "/api/inventory", (form) => ({ sku: form.get("sku"), name: form.get("name"), openingQuantity: Number(form.get("openingQuantity")), reorderPoint: Number(form.get("reorderPoint") ) }))} busy={busy} />}{rows.length ? <div className="space-y-3">{rows.map((row) => <article key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white p-5"><div><h2 className="font-semibold">{String(row.name)}</h2><p className="text-sm text-[var(--muted)]">{String(row.sku)} · On hand: {String(row.quantityOnHand)} · Reserved: {String(row.reservedQuantity)} · Available: {String(row.availableQuantity)} · Reorder at: {String(row.reorderPoint)}</p><MovementHistory partId={row.id} /></div>{canManage && <MovementForm busy={busy} onSubmit={(event) => submitForm(event, "/api/inventory/movements", (form) => ({ partId: row.id, type: form.get("type"), quantity: Number(form.get("quantity")), reason: form.get("reason") }))} />}</article>)}</div> : <Empty text={t.empty} />}</div>}
        {tab === "users" && initialUser.role === "ADMIN" && <UsersPanel actorId={initialUser.id} rows={rows} busy={busy} onCreate={(event) => submitForm(event, "/api/users", (form) => ({ name: form.get("name"), email: form.get("email"), password: form.get("password"), role: form.get("role") }))} onUpdate={(id, body) => mutate(`/api/users/${id}`, "PATCH", body)} />}
      </section>
    </div>
  </main>;
}

function Empty({ text }: { text: string }) { return <p className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-8 text-center text-sm text-[var(--muted)]">{text}</p>; }
function StatusBadge({ value }: { value: string }) { const tone = ["REJECTED", "URGENT"].includes(value) ? "bg-red-50 text-red-800" : ["SUBMITTED", "APPROVED", "OPEN", "IN_PROGRESS", "HIGH"].includes(value) ? "bg-amber-50 text-amber-800" : ["COMPLETED", "VERIFIED", "CLOSED", "LOW"].includes(value) ? "bg-green-50 text-green-900" : "bg-slate-100 text-slate-700"; return <span role="status" className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{value.replaceAll("_", " ")}</span>; }
function RequestForm({ onSubmit, busy }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; busy: boolean }) { const [assets, setAssets] = useState<{ id: string; code: string; name: string }[]>([]); useEffect(() => { fetch("/api/assets").then((response) => response.ok ? response.json() : Promise.reject()).then((result) => setAssets(result.assets)).catch(() => setAssets([])); }, []); return <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 sm:grid-cols-2"><h2 className="sm:col-span-2 font-semibold">Submit a maintenance request</h2><input name="title" required minLength={3} maxLength={120} placeholder="Request title" className="rounded-lg border border-[var(--line)] px-3 py-2" /><select name="priority" className="rounded-lg border border-[var(--line)] px-3 py-2"><option value="MEDIUM">Medium priority</option><option value="LOW">Low</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select><select name="assetId" defaultValue="" className="rounded-lg border border-[var(--line)] px-3 py-2 sm:col-span-2"><option value="">No asset linked</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.code} · {asset.name}</option>)}</select><textarea name="description" required minLength={5} maxLength={4000} placeholder="Describe the issue" className="min-h-24 rounded-lg border border-[var(--line)] px-3 py-2 sm:col-span-2" /><button disabled={busy} className="flex items-center justify-center gap-2 rounded-lg bg-[var(--green)] px-4 py-2 text-white sm:col-span-2"><Plus size={16} />Submit request</button></form>; }
function AssetForm({ onSubmit, busy }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; busy: boolean }) { return <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 sm:grid-cols-5"><h2 className="font-semibold sm:col-span-5">Register asset</h2><input name="code" required placeholder="Code" className="rounded-lg border border-[var(--line)] px-3 py-2" /><input name="name" required placeholder="Asset name" className="rounded-lg border border-[var(--line)] px-3 py-2" /><input name="category" required placeholder="Category" className="rounded-lg border border-[var(--line)] px-3 py-2" /><select name="criticality" className="rounded-lg border border-[var(--line)] px-3 py-2"><option>MEDIUM</option><option>LOW</option><option>HIGH</option><option>CRITICAL</option></select><button disabled={busy} className="rounded-lg bg-[var(--green)] px-3 py-2 text-white">Add asset</button></form>; }
function PartForm({ onSubmit, busy }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; busy: boolean }) { return <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 sm:grid-cols-5"><h2 className="font-semibold sm:col-span-5">Add inventory part</h2><input name="sku" required placeholder="SKU" className="rounded-lg border border-[var(--line)] px-3 py-2" /><input name="name" required placeholder="Part name" className="rounded-lg border border-[var(--line)] px-3 py-2" /><input name="openingQuantity" required type="number" min="0" placeholder="Opening stock" className="rounded-lg border border-[var(--line)] px-3 py-2" /><input name="reorderPoint" required type="number" min="0" placeholder="Reorder point" className="rounded-lg border border-[var(--line)] px-3 py-2" /><button disabled={busy} className="rounded-lg bg-[var(--green)] px-3 py-2 text-white">Add part</button></form>; }
function MovementForm({ onSubmit, busy }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; busy: boolean }) { return <form onSubmit={onSubmit} className="flex flex-wrap gap-2"><select name="type" className="rounded-lg border border-[var(--line)] px-2 py-2 text-sm"><option value="ISSUE">Issue</option><option value="RECEIPT">Receive</option></select><input name="quantity" required type="number" min="1" className="w-20 rounded-lg border border-[var(--line)] px-2 py-2 text-sm" aria-label="Quantity" /><input name="reason" required minLength={2} placeholder="Reason" className="w-28 rounded-lg border border-[var(--line)] px-2 py-2 text-sm" /><button disabled={busy} className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm">Record</button></form>; }
function OrderActions({ row, role, onAction }: { row: Row; role: UserInfo["role"]; onAction: (body: unknown) => Promise<unknown> }) { const statuses = role === "TECHNICIAN" ? [{ label: "Start work", status: "IN_PROGRESS" }, { label: "Put on hold", status: "ON_HOLD" }, { label: "Complete", status: "COMPLETED" }] : [{ label: "Verify", status: "VERIFIED" }, { label: "Close", status: "CLOSED" }]; return <div className="flex flex-wrap gap-2">{statuses.filter((action) => action.status !== "IN_PROGRESS" || row.status === "OPEN" || row.status === "ON_HOLD").filter((action) => action.status !== "ON_HOLD" || row.status === "OPEN" || row.status === "IN_PROGRESS").filter((action) => action.status !== "COMPLETED" || row.status === "IN_PROGRESS").filter((action) => action.status !== "VERIFIED" || row.status === "COMPLETED").filter((action) => action.status !== "CLOSED" || row.status === "VERIFIED").map((action) => <button key={action.label} onClick={() => { const body = action.status === "COMPLETED" ? { status: action.status, completionNote: window.prompt("Completion note") ?? "" } : { status: action.status }; void onAction(body); }} className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm">{action.label}</button>)}</div>; }
function Checklist({ value, onSave }: { value: unknown; onSave: (items: { label: string; done: boolean }[]) => void }) { const items = Array.isArray(value) ? value as { label: string; done: boolean }[] : []; return items.length ? <fieldset className="mt-4"><legend className="text-sm font-medium">Inspection checklist</legend><div className="mt-2 flex flex-wrap gap-3">{items.map((item, index) => <label key={item.label} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.done} onChange={(event) => onSave(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, done: event.target.checked } : entry))} />{item.label}</label>)}</div></fieldset> : null; }
function AssignmentControl({ row, onAssign }: { row: Row; onAssign: (id: string | null) => void }) { const [users, setUsers] = useState<{ id: string; name: string }[]>([]); useEffect(() => { fetch("/api/technicians").then((response) => response.ok ? response.json() : Promise.reject()).then((result) => setUsers(result.technicians)).catch(() => setUsers([])); }, []); return <select aria-label="Assign technician" value={String(row.assignedUserId ?? "")} onChange={(event) => onAssign(event.target.value || null)} className="rounded-lg border border-[var(--line)] px-2 py-2 text-sm"><option value="">Unassigned</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select>; }
function Attachments({ entityType, entityId }: { entityType: "Asset" | "MaintenanceRequest" | "WorkOrder"; entityId: string }) { const [items, setItems] = useState<{ id: string; originalName: string; size: number }[]>([]); const [message, setMessage] = useState(""); async function load() { const response = await fetch(`/api/attachments?entityType=${entityType}&entityId=${entityId}`); if (!response.ok) { setMessage("Unable to load attachments."); return; } const result = await response.json(); setItems(result.attachments); } async function upload(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const body = new FormData(form); body.set("entityType", entityType); body.set("entityId", entityId); const response = await fetch("/api/attachments", { method: "POST", body }); const result = await response.json(); if (!response.ok) { setMessage(result.error ?? "Upload failed."); return; } setMessage("Attachment uploaded."); form.reset(); await load(); } return <details className="mt-4 border-t border-[var(--line)] pt-3" onToggle={(event) => { if ((event.currentTarget as HTMLDetailsElement).open) void load(); }}><summary className="cursor-pointer text-sm font-medium">Attachments</summary><form onSubmit={upload} className="mt-3 flex flex-wrap items-center gap-2"><input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" required className="max-w-full text-sm" /><button className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm">Upload (10 MiB max)</button></form>{message && <p role="status" className="mt-2 text-xs text-[var(--muted)]">{message}</p>}<ul className="mt-2 space-y-1 text-sm">{items.map((item) => <li key={item.id}><a className="text-[var(--green)] underline" href={`/api/attachments/${item.id}`}>{item.originalName} ({Math.ceil(item.size / 1024)} KiB)</a></li>)}</ul></details>; }
function ReservationControl({ workOrderId, onAction }: { workOrderId: string; onAction: (body: unknown) => Promise<unknown> }) { const [parts, setParts] = useState<{ id: string; name: string; sku: string }[]>([]); const [action, setAction] = useState("reserve"); useEffect(() => { fetch("/api/inventory").then((response) => response.ok ? response.json() : Promise.reject()).then((result) => setParts(result.parts)).catch(() => setParts([])); }, []); return <form className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void onAction({ action, partId: form.get("partId"), workOrderId, quantity: Number(form.get("quantity")), ...(action === "issue" ? { type: "ISSUE", reason: form.get("reason") } : {}) }); }}><select name="partId" required className="rounded-lg border border-[var(--line)] px-2 py-2 text-sm"><option value="">Select part</option>{parts.map((part) => <option key={part.id} value={part.id}>{part.sku} · {part.name}</option>)}</select><select name="action" value={action} onChange={(event) => setAction(event.target.value)} className="rounded-lg border border-[var(--line)] px-2 py-2 text-sm"><option value="reserve">Reserve</option><option value="issue">Issue</option><option value="release">Release reservation</option></select><input name="quantity" type="number" min="1" defaultValue="1" required className="w-20 rounded-lg border border-[var(--line)] px-2 py-2 text-sm" /><input name="reason" placeholder="Issue reason" required={action === "issue"} className="w-28 rounded-lg border border-[var(--line)] px-2 py-2 text-sm" /><button className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm">Record stock use</button></form>; }
function MovementHistory({ partId }: { partId: string }) { const [items, setItems] = useState<{ id: string; type: string; quantity: number; reason: string; createdAt: string }[]>([]); const [message, setMessage] = useState(""); async function load() { const response = await fetch(`/api/inventory/movements?partId=${partId}`); if (!response.ok) { setMessage("Unable to load movement history."); return; } const result = await response.json(); setItems(result.movements); } return <details className="mt-2" onToggle={(event) => { if ((event.currentTarget as HTMLDetailsElement).open) void load(); }}><summary className="cursor-pointer text-xs text-[var(--green)]">Movement history</summary>{message && <p role="status" className="text-xs">{message}</p>}<ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">{items.map((item) => <li key={item.id}>{new Date(item.createdAt).toLocaleString()} · {item.type} {item.quantity} · {item.reason}</li>)}</ul></details>; }
function UsersPanel({ actorId, rows, busy, onCreate, onUpdate }: { actorId: string; rows: Row[]; busy: boolean; onCreate: (event: FormEvent<HTMLFormElement>) => void; onUpdate: (id: string, body: unknown) => void }) { return <div className="space-y-5"><form onSubmit={onCreate} className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 sm:grid-cols-5"><h2 className="font-semibold sm:col-span-5">Create organization user</h2><input name="name" required minLength={2} placeholder="Full name" className="rounded-lg border border-[var(--line)] px-3 py-2" /><input name="email" required type="email" placeholder="Work email" className="rounded-lg border border-[var(--line)] px-3 py-2" /><input name="password" required type="password" minLength={14} placeholder="Temporary password (14+)" className="rounded-lg border border-[var(--line)] px-3 py-2" /><select name="role" className="rounded-lg border border-[var(--line)] px-3 py-2"><option value="REQUESTER">Requester</option><option value="TECHNICIAN">Technician</option><option value="MANAGER">Manager</option></select><button disabled={busy} className="rounded-lg bg-[var(--green)] px-3 py-2 text-white">Create user</button></form>{rows.length ? <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white"><table className="w-full min-w-[700px] text-start text-sm"><thead className="bg-[#f7faf8]"><tr>{["Name", "Email", "Role", "Location", "Access"].map((item) => <th key={item} className="px-4 py-3 font-medium text-[var(--muted)]">{item}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--line)]"><td className="px-4 py-3 font-medium">{String(row.name)}</td><td className="px-4 py-3">{String(row.email)}</td><td className="px-4 py-3">{String(row.role)}</td><td className="px-4 py-3">{String(row.location ? (row.location as Row).name : "—")}</td><td className="px-4 py-3"><button disabled={row.id === actorId} onClick={() => onUpdate(row.id, { active: !row.active })} className="rounded-lg border border-[var(--line)] px-3 py-2">{row.active ? "Deactivate" : "Reactivate"}</button></td></tr>)}</tbody></table></div> : <Empty text="No users created yet." />}</div>; }
