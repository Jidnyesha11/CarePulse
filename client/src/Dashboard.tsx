import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Users,
  Stethoscope,
  BedDouble,
  CircleDollarSign,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Search,
  Plus,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileText,
  X,
  ShieldCheck,
  ChartNoAxesCombined,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { io, Socket } from "socket.io-client";
import type { User } from "./store";
import { api } from "./api";

type Row = Record<string, any>;
const titles: Record<string, string> = {
  "/": "Overview",
  "/appointments": "Appointments",
  "/patients": "Patients",
  "/doctors": "Doctors",
  "/records": "Medical records",
  "/prescriptions": "Prescriptions",
  "/beds": "Beds & wards",
  "/billing": "Billing & claims",
  "/analytics": "Analytics",
  "/audit": "Audit trail",
};
const money = (n = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
const dateLabel = (d: string) => {
  if (!d) return "—";
  const t = new Date(`${d}T12:00:00`);
  return t.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
function useLocationPath() {
  return window.location.pathname;
}
export function Dashboard({ user }: { user: User }) {
  const path = useLocationPath(),
    title = titles[path] || "Overview";
  const [overview, setOverview] = useState<Row | null>(null),
    [rows, setRows] = useState<Row[]>([]),
    [doctors, setDoctors] = useState<Row[]>([]),
    [patientDirectory, setPatientDirectory] = useState<Row[]>([]),
    [consultAppointment, setConsultAppointment] = useState<Row | null>(null),
    [search, setSearch] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [triage, setTriage] = useState<Row | null>(null),
    [selectedDoctor, setSelectedDoctor] = useState(""),
    [slots, setSlots] = useState<Row[]>([]),
    [form, setForm] = useState({
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      timeSlot: "",
      reason: "",
    }),
    [modal, setModal] = useState(false),
    [rescheduleId, setRescheduleId] = useState<string | null>(null),
    [socketState, setSocketState] = useState<"live" | "offline">("offline");
  const load = useCallback(async () => {
    setError("");
    try {
      if (user.role === "ADMIN" || (user.role === "DOCTOR" && path === "/analytics")) {
        const { data } = await api.get(
          user.role === "ADMIN" ? "/admin/analytics" : "/doctor/analytics",
        );
        setOverview(data.data);
      }
      const endpoint =
        path === "/appointments"
          ? "/appointments"
          : path === "/patients"
            ? user.role === "ADMIN"
              ? "/admin/users?role=PATIENT"
              : "/patients"
            : path === "/doctors"
              ? "/doctors"
              : path === "/records"
                ? "/records"
                : path === "/prescriptions"
                  ? "/prescriptions"
                  : path === "/beds"
                    ? "/admin/beds"
                    : path === "/billing"
                      ? "/bills"
                      : path === "/audit"
                        ? "/admin/audit"
                        : user.role === "PATIENT"
                          ? "/appointments"
                          : "/appointments";
      const { data } = await api.get(endpoint);
      setRows(data.data.items || []);
      if (path === "/beds") {
        const people = await api.get("/admin/users?role=PATIENT");
        setPatientDirectory(people.data.data.items || []);
      }
      if ((path === "/appointments" || path === "/") && user.role === "PATIENT") {
        const dr = await api.get("/doctors");
        setDoctors(dr.data.data.items || []);
      }
    } catch (e: any) {
      setError(e.response?.data?.error?.message || "Could not load workspace data.");
    }
  }, [user.role, path]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const base = (import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1").replace(
      /\/api\/v1\/?$/,
      "",
    );
    const token = JSON.parse(sessionStorage.getItem("carepulse-session") || "{}").token;
    const s: Socket = io(base, { auth: { token }, transports: ["websocket", "polling"] });
    s.on("connect", () => {
      setSocketState("live");
      if (selectedDoctor) s.emit("doctor:watch", selectedDoctor);
    });
    s.on("disconnect", () => setSocketState("offline"));
    s.on("slot:booked", () => {
      void loadSlots(selectedDoctor);
    });
    s.on("slot:released", () => {
      void loadSlots(selectedDoctor);
    });
    s.on("appointment:created", () => void load());
    s.on("bed:status-updated", () => {
      if (path === "/beds") void load();
    });
    return () => {
      s.disconnect();
    };
  }, [selectedDoctor, path, load, user.role, form.date]);
  async function loadSlots(id: string, date = form.date) {
    if (!id) return;
    try {
      const { data } = await api.get(`/appointments/availability/${id}`, { params: { date } });
      setSlots(data.data.slots);
    } catch (e: any) {
      setError(e.response?.data?.error?.message || "Unable to load availability.");
    }
  }
  useEffect(() => {
    if (selectedDoctor) void loadSlots(selectedDoctor);
  }, [selectedDoctor, form.date]);
  async function runTriage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const symptoms = new FormData(e.currentTarget).get("symptoms");
      const { data } = await api.post("/triage", { symptoms });
      setTriage(data.data);
      setNotice("Intake suggestion saved to your care history.");
    } catch (e: any) {
      setError(e.response?.data?.error?.message || "Triage could not be completed.");
    } finally {
      setBusy(false);
    }
  }
  function beginReschedule(a: Row) {
    setRescheduleId(a._id);
    setSelectedDoctor(a.doctorId?._id || a.doctorId);
    setForm({ date: a.date, timeSlot: "", reason: a.reason || "" });
    setModal(true);
  }
  async function book(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (rescheduleId) {
        await api.patch(`/appointments/${rescheduleId}/reschedule`, {
          date: form.date,
          timeSlot: form.timeSlot,
        });
        setNotice("Appointment rescheduled. The calendar update was sent live.");
      } else {
        await api.post("/appointments", {
          doctorId: selectedDoctor,
          ...form,
          department: doctors.find((d) => d._id === selectedDoctor)?.department,
          triageId: triage?.id,
        });
        setNotice("Appointment confirmed. Your doctor’s schedule updated live.");
      }
      setModal(false);
      setRescheduleId(null);
      setForm((f) => ({ ...f, timeSlot: "" }));
      await load();
    } catch (e: any) {
      setError(e.response?.data?.error?.message || "Booking failed. Please select another time.");
      await loadSlots(selectedDoctor);
    } finally {
      setBusy(false);
    }
  }
  async function cancel(id: string) {
    setBusy(true);
    try {
      await api.patch(`/appointments/${id}/cancel`);
      setNotice("Appointment cancelled and slot released.");
      await load();
    } catch (e: any) {
      setError(e.response?.data?.error?.message || "Unable to cancel appointment.");
    } finally {
      setBusy(false);
    }
  }
  async function createBed(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/admin/beds", Object.fromEntries(new FormData(e.currentTarget)));
      setNotice("Bed added to ward inventory.");
      await load();
    } catch (e: any) {
      setError(e.response?.data?.error?.message || "Could not add bed.");
    } finally {
      setBusy(false);
    }
  }
  async function downloadPdf(id: string) {
    try {
      const r = await api.get(`/prescriptions/${id}/pdf`, { responseType: "blob" });
      const u = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = u;
      a.download = `carepulse-prescription-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(u);
    } catch (e: any) {
      setError(e.response?.data?.error?.message || "PDF download failed.");
    }
  }
  const appointmentRows =
    path === "/"
      ? rows.filter(
          (a) =>
            ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(a.status) &&
            a.date >= new Date().toISOString().slice(0, 10),
        )
      : rows;
  const visible = useMemo(
    () => rows.filter((x) => JSON.stringify(x).toLowerCase().includes(search.toLowerCase())),
    [rows, search],
  );
  const name = user.name.split(" ")[0];
  const formattedToday = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {user.role === "PATIENT" ? "YOUR CARE" : "CARE OPERATIONS"}{" "}
            <span className="heading-sep">·</span> {formattedToday.toUpperCase()}
          </div>
          <h1>
            {path === "/"
              ? `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${name}`
              : title}
          </h1>
          <p>
            {path === "/"
              ? user.role === "PATIENT"
                ? "Your care plan and next steps, all in one place."
                : "Here is your hospital at a glance."
              : `Manage ${title.toLowerCase()} across CarePulse Medical.`}
          </p>
        </div>
        <div className="heading-actions">
          {user.role === "PATIENT" && (
            <button className="button button-primary" onClick={() => setModal(true)}>
              <Plus size={16} /> Book appointment
            </button>
          )}
          {user.role === "ADMIN" && path === "/beds" && (
            <a className="button button-primary" href="#add-bed">
              <Plus size={16} /> Add bed
            </a>
          )}
        </div>
      </div>
      {notice && (
        <div className="alert alert-success">
          <CheckCircle2 size={17} />
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={17} />
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}
      {path === "/" && user.role === "ADMIN" && (
        <>
          <div className="metric-grid">
            <Metric
              label="Registered patients"
              value={overview?.patients ?? "—"}
              icon={<Users />}
              tone="mint"
              detail="Across all departments"
            />
            <Metric
              label="Active doctors"
              value={overview?.doctors ?? "—"}
              icon={<Stethoscope />}
              tone="blue"
              detail="Clinical team"
            />
            <Metric
              label="Today's appointments"
              value={overview?.todayAppointments ?? "—"}
              icon={<CalendarDays />}
              tone="amber"
              detail={`${overview?.completed ?? 0} completed`}
            />
            <Metric
              label="Paid revenue"
              value={money(overview?.revenue)}
              icon={<CircleDollarSign />}
              tone="rose"
              detail="Recorded payments"
            />
          </div>
          <div className="overview-grid">
            <section className="panel activity-panel">
              <div className="panel-head">
                <div>
                  <h2>Appointment activity</h2>
                  <p>Bookings over the past seven days</p>
                </div>
                <span className="live-badge">
                  <span /> LIVE
                </span>
              </div>
              <div className="chart-area">
                {overview?.appointments?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={overview.appointments}>
                      <defs>
                        <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#458b7b" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#458b7b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e9eeec" vertical={false} />
                      <XAxis
                        dataKey="_id"
                        tickFormatter={(v) =>
                          new Date(`${v}T12:00:00`).toLocaleDateString("en", { weekday: "short" })
                        }
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                      <Tooltip />
                      <Area
                        dataKey="count"
                        name="Appointments"
                        stroke="#397b6d"
                        strokeWidth={2}
                        fill="url(#activityFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty
                    icon={<CalendarDays />}
                    title="No activity recorded"
                    detail="Appointment activity will appear here as bookings are created."
                  />
                )}
              </div>
            </section>
            <section className="panel occupancy-panel">
              <div className="panel-head">
                <div>
                  <h2>Bed occupancy</h2>
                  <p>Current facility status</p>
                </div>
                <BedDouble size={19} className="muted-icon" />
              </div>
              <div className="occupancy-number">
                {overview?.beds?.OCCUPIED || 0}
                <span> beds occupied</span>
              </div>
              <div className="occupancy-bar">
                <i
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        ((overview?.beds?.OCCUPIED || 0) /
                          Math.max(
                            1,
                            (Object.values(overview?.beds || {}) as number[]).reduce(
                              (a, b) => a + b,
                              0,
                            ),
                          )) *
                          100,
                      ),
                    )}%`,
                  }}
                />
              </div>
              <div className="bed-legend">
                <span>
                  <i className="legend-dot green" />
                  Available <b>{overview?.beds?.AVAILABLE || 0}</b>
                </span>
                <span>
                  <i className="legend-dot slate" />
                  Occupied <b>{overview?.beds?.OCCUPIED || 0}</b>
                </span>
                <span>
                  <i className="legend-dot amber" />
                  Maintenance <b>{overview?.beds?.MAINTENANCE || 0}</b>
                </span>
              </div>
              <a className="inline-link" href="/beds">
                View bed management <ArrowUpRight size={15} />
              </a>
            </section>
          </div>
          <section className="panel table-panel">
            <div className="panel-head">
              <div>
                <h2>Recent activity</h2>
                <p>Latest changes recorded in the audit trail</p>
              </div>
              <a className="inline-link" href="/audit">
                View audit trail <ChevronRight size={15} />
              </a>
            </div>
            <DataTable
              columns={["Activity", "Resource", "Performed by", "Time"]}
              rows={(overview?.recentActivity || []).map((x: Row) => [
                x.action,
                x.resource,
                x.actorId?.name || "System",
                new Date(x.createdAt).toLocaleString(),
              ])}
              emptyTitle="Nothing to report yet"
              emptyDetail="System activity appears here as your team uses CarePulse."
            />
          </section>
        </>
      )}
      {path === "/" && user.role !== "ADMIN" && (
        <>
          <div className="feature-grid">
            {user.role === "PATIENT" && (
              <section className="panel triage-panel">
                <div className="feature-kicker">
                  <Sparkles size={16} /> CARE INTAKE
                </div>
                <h2>Not sure where to start?</h2>
                <p>
                  Describe how you are feeling and get a suggested department to discuss with your
                  care team.
                </p>
                <form onSubmit={runTriage}>
                  <label className="visually-hidden" htmlFor="symptoms">
                    Describe your symptoms
                  </label>
                  <textarea
                    id="symptoms"
                    name="symptoms"
                    required
                    minLength={8}
                    maxLength={2000}
                    placeholder="Tell us what you have been experiencing…"
                  />
                  <button className="button button-primary" disabled={busy}>
                    {busy ? "Reviewing…" : "Get a care suggestion"}
                    <ChevronRight size={16} />
                  </button>
                </form>
                {triage && (
                  <div className="triage-result">
                    <div className="result-top">
                      <span className={`urgency ${triage.urgency?.toLowerCase()}`}>
                        {triage.urgency}
                      </span>
                      <span>{Math.round(triage.confidence * 100)}% confidence</span>
                    </div>
                    <b>
                      {triage.department} <span>·</span> {triage.specialist}
                    </b>
                    <p>{triage.reasoning}</p>
                    {triage.manualSelection && (
                      <p className="manual-note">
                        Please choose a department manually if you book.
                      </p>
                    )}
                    <small>{triage.disclaimer}</small>
                  </div>
                )}
                <div className="disclaimer-line">
                  <ShieldCheck size={15} /> This is not a medical diagnosis.
                </div>
              </section>
            )}
            <section className="panel next-panel">
              <div className="panel-head">
                <div>
                  <div className="feature-kicker">
                    {user.role === "DOCTOR" ? "YOUR CLINIC" : "YOUR NEXT STEP"}
                  </div>
                  <h2>{user.role === "DOCTOR" ? "Today’s schedule" : "Upcoming appointments"}</h2>
                </div>
                <CalendarDays className="muted-icon" />
              </div>
              {appointmentRows.length ? (
                <div className="upcoming-list">
                  {appointmentRows.slice(0, 4).map((a, i) => (
                    <div className="upcoming-item" key={a._id || i}>
                      <div className="date-block">
                        <b>{a.timeSlot || "—"}</b>
                        <small>{dateLabel(a.date)}</small>
                      </div>
                      <div className="appointment-copy">
                        <b>{a.doctorId?.name || a.patientId?.name || "Appointment"}</b>
                        <small>{a.department || a.doctorId?.department || "Care visit"}</small>
                      </div>
                      <span className={`status-badge ${(a.status || "scheduled").toLowerCase()}`}>
                        {(a.status || "scheduled").replace("_", " ")}
                      </span>
                      {["SCHEDULED", "CONFIRMED"].includes(a.status) && user.role === "PATIENT" && (
                        <>
                          <button className="text-button" onClick={() => beginReschedule(a)}>
                            Reschedule
                          </button>
                          <button className="text-button" onClick={() => cancel(a._id)}>
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  icon={<CalendarDays />}
                  title="No upcoming appointments"
                  detail="When a visit is booked, it will appear here."
                  action={
                    user.role === "PATIENT" ? (
                      <button className="button button-secondary" onClick={() => setModal(true)}>
                        Find a time
                      </button>
                    ) : undefined
                  }
                />
              )}
              <button
                className="button button-secondary button-full"
                onClick={() => (window.location.href = "/appointments")}
              >
                View appointments <ArrowUpRight size={15} />
              </button>
            </section>
          </div>
          <div className="info-strip">
            <div className="strip-icon">
              <ShieldCheck size={18} />
            </div>
            <div>
              <b>Care information, thoughtfully protected</b>
              <p>Your records are visible only to you and your authorized care team.</p>
            </div>
            <span className="live-badge">
              <span className={socketState === "live" ? "" : "offline"} />
              {socketState === "live" ? "LIVE AVAILABILITY" : "CONNECTING"}
            </span>
          </div>
        </>
      )}
      {path === "/appointments" && (
        <section className="panel table-panel">
          <div className="panel-head">
            <div>
              <h2>
                {user.role === "PATIENT"
                  ? "Your appointments"
                  : user.role === "DOCTOR"
                    ? "Your schedule"
                    : "All appointments"}
              </h2>
              <p>Appointment status and visit details</p>
            </div>
            {user.role === "PATIENT" && (
              <button className="button button-primary" onClick={() => setModal(true)}>
                <Plus size={16} /> Book appointment
              </button>
            )}
          </div>
          <SearchBox value={search} onChange={setSearch} placeholder="Search appointments" />
          <DataTable
            columns={["Patient", "Doctor", "Department", "Date", "Time", "Status", ""]}
            rows={visible.map((a) => [
              a.patientId?.name || user.name,
              a.doctorId?.name || "—",
              a.department || a.doctorId?.department || "—",
              dateLabel(a.date),
              a.timeSlot,
              <span className={`status-badge ${a.status?.toLowerCase()}`}>
                {a.status?.replace("_", " ")}
              </span>,
              ["SCHEDULED", "CONFIRMED"].includes(a.status) && user.role === "PATIENT" ? (
                <>
                  <button className="table-action" onClick={() => beginReschedule(a)}>
                    Reschedule
                  </button>
                  <button className="table-action" onClick={() => cancel(a._id)}>
                    Cancel
                  </button>
                </>
              ) : user.role === "DOCTOR" && ["SCHEDULED", "CONFIRMED"].includes(a.status) ? (
                <button className="table-action" onClick={() => setConsultAppointment(a)}>
                  Document visit
                </button>
              ) : null,
            ])}
            emptyTitle="No appointments found"
            emptyDetail="Your scheduled visits will appear here."
          />
        </section>
      )}
      {["/patients", "/doctors", "/records", "/prescriptions", "/billing", "/audit"].includes(
        path,
      ) && (
        <section className="panel table-panel">
          <div className="panel-head">
            <div>
              <h2>{title}</h2>
              <p>
                {path === "/audit"
                  ? "A traceable history of sensitive system activity."
                  : "Current records available to your account."}
              </p>
            </div>
            <button className="icon-button" onClick={() => void load()} aria-label="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder={`Search ${title.toLowerCase()}`}
          />
          {path === "/prescriptions" ? (
            <DataTable
              columns={["Patient", "Prescriber", "Issued", "Medications", "Verification", ""]}
              rows={visible.map((p) => [
                p.patientId?.name || user.name,
                p.doctorId?.name || "—",
                new Date(p.issuedAt || p.createdAt).toLocaleDateString(),
                p.items?.map((m: Row) => m.medicine).join(", ") || "—",
                <span className="status-badge completed">VERIFIED</span>,
                <button className="table-action" onClick={() => downloadPdf(p._id)}>
                  <Download size={14} /> PDF
                </button>,
              ])}
              emptyTitle="No prescriptions yet"
              emptyDetail="Prescriptions from your care team will be listed here."
            />
          ) : path === "/records" ? (
            <DataTable
              columns={["Patient", "Clinician", "Diagnosis", "Visit date", "Symptoms"]}
              rows={visible.map((x) => [
                x.patientId?.name || user.name,
                x.doctorId?.name || "—",
                x.diagnosis,
                new Date(x.createdAt).toLocaleDateString(),
                x.symptoms?.join(", ") || "—",
              ])}
              emptyTitle="No medical records"
              emptyDetail="Visit notes and diagnoses appear after a consultation."
            />
          ) : path === "/billing" ? (
            <BillingPanel user={user} rows={visible} reload={() => void load()} />
          ) : path === "/audit" ? (
            <DataTable
              columns={["Event", "Resource", "Actor", "Date", "Request ID"]}
              rows={visible.map((x) => [
                x.action,
                x.resource,
                x.actorId?.name || "System",
                new Date(x.createdAt).toLocaleString(),
                x.requestId || "—",
              ])}
              emptyTitle="No audit activity"
              emptyDetail="Access events will be recorded as sensitive workflows are used."
            />
          ) : (
            <DataTable
              columns={
                path === "/doctors"
                  ? ["Clinician", "Department", "Specialty"]
                  : ["Patient", "Email", "Joined"]
              }
              rows={visible.map((x) =>
                path === "/doctors"
                  ? [x.name, x.department || "—", x.specialty || "—"]
                  : [x.name, x.email, new Date(x.createdAt).toLocaleDateString()],
              )}
              emptyTitle={`No ${title.toLowerCase()} found`}
              emptyDetail="Try a different search or check back later."
            />
          )}
        </section>
      )}
      {path === "/beds" && (
        <>
          <div className="bed-summary">
            <Metric
              label="Total beds"
              value={rows.length}
              icon={<BedDouble />}
              tone="mint"
              detail="Facility inventory"
            />
            <Metric
              label="Available"
              value={rows.filter((x) => x.status === "AVAILABLE").length}
              icon={<CheckCircle2 />}
              tone="blue"
              detail="Ready for admission"
            />
            <Metric
              label="Occupied"
              value={rows.filter((x) => x.status === "OCCUPIED").length}
              icon={<Users />}
              tone="amber"
              detail="Currently assigned"
            />
          </div>
          <section className="panel table-panel">
            <div className="panel-head">
              <div>
                <h2>Ward inventory</h2>
                <p>Bed status by ward and bed number</p>
              </div>
            </div>
            <DataTable
              columns={["Bed", "Ward", "Type", "Patient", "Status", "Action"]}
              rows={rows.map((b) => [
                b.number,
                b.ward,
                b.type,
                b.patientId?.name || "—",
                <span className={`status-badge ${b.status?.toLowerCase()}`}>{b.status}</span>,
                <BedAction bed={b} patients={patientDirectory} onChange={() => void load()} />,
              ])}
              emptyTitle="No beds in inventory"
              emptyDetail="Create a bed below to begin managing facility capacity."
            />
          </section>
          <section className="panel form-panel" id="add-bed">
            <h2>Add a bed</h2>
            <p>Register a bed in the facility inventory.</p>
            <form className="inline-form" onSubmit={createBed}>
              <label>
                Ward
                <input name="ward" required placeholder="e.g. North" />
              </label>
              <label>
                Bed number
                <input name="number" required placeholder="e.g. N-03" />
              </label>
              <label>
                Bed type
                <select name="type">
                  <option>General</option>
                  <option>ICU</option>
                  <option>Observation</option>
                </select>
              </label>
              <button className="button button-primary" disabled={busy}>
                <Plus size={16} /> Add bed
              </button>
            </form>
          </section>
        </>
      )}
      {path === "/analytics" && (
        <section className="panel activity-panel">
          <div className="panel-head">
            <div>
              <h2>Operational overview</h2>
              <p>Metrics are aggregated from current hospital records.</p>
            </div>
            <button className="button button-secondary" onClick={() => void load()}>
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
          {overview ? (
            <>
              <div className="metric-grid nested-metrics">
                <Metric
                  label="Patients"
                  value={overview.patients}
                  icon={<Users />}
                  tone="mint"
                  detail="Registered"
                />
                <Metric
                  label="Doctors"
                  value={overview.doctors}
                  icon={<Stethoscope />}
                  tone="blue"
                  detail="Active accounts"
                />
                <Metric
                  label="Appointments today"
                  value={overview.todayAppointments}
                  icon={<CalendarDays />}
                  tone="amber"
                  detail="All statuses"
                />
                <Metric
                  label="Paid revenue"
                  value={money(overview.revenue)}
                  icon={<CircleDollarSign />}
                  tone="rose"
                  detail="Simulated billing"
                />
              </div>
              <div className="chart-area analytics-chart">
                {overview.appointments?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={overview.appointments}>
                      <CartesianGrid stroke="#e9eeec" vertical={false} />
                      <XAxis dataKey="_id" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Area dataKey="count" stroke="#397b6d" fill="#cde4dc" name="Appointments" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty
                    icon={<ChartNoAxesCombined />}
                    title="Not enough activity yet"
                    detail="Daily appointment trends will appear once bookings are recorded."
                  />
                )}
              </div>
            </>
          ) : (
            <Empty
              icon={<ChartNoAxesCombined />}
              title="Loading analytics"
              detail="Retrieving current operational metrics."
            />
          )}
        </section>
      )}
      {modal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setModal(false)}
        >
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="book-heading">
            <div className="modal-head">
              <div>
                <div className="eyebrow">NEW VISIT</div>
                <h2 id="book-heading">
                  {rescheduleId ? "Reschedule appointment" : "Book an appointment"}
                </h2>
                <p>Choose a clinician and an available time.</p>
              </div>
              <button
                className="icon-button"
                onClick={() => {
                  setModal(false);
                  setRescheduleId(null);
                }}
                aria-label="Close"
              >
                <X />
              </button>
            </div>
            <form onSubmit={book} className="form-stack">
              <label>
                Department or clinician
                <select
                  required
                  disabled={!!rescheduleId}
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                >
                  <option value="">Choose a clinician</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} · {d.department || "General Medicine"}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <input
                  required
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value, timeSlot: "" })}
                />
              </label>
              <div>
                <span className="form-label">
                  Available times{" "}
                  <span className={`live-badge ${socketState !== "live" ? "offline-text" : ""}`}>
                    <span className={socketState === "live" ? "" : "offline"} />
                    {socketState === "live" ? "LIVE" : "UPDATING"}
                  </span>
                </span>
                <div className="slot-grid">
                  {slots.map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      disabled={!s.available}
                      onClick={() => setForm({ ...form, timeSlot: s.time })}
                      className={`slot-button ${form.timeSlot === s.time ? "selected" : ""}`}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
                {selectedDoctor && slots.length === 0 && (
                  <small className="muted">Loading appointment slots…</small>
                )}
              </div>
              <label>
                Reason for visit{" "}
                <textarea
                  maxLength={500}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Optional note for your care team"
                />
              </label>
              <div className="modal-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => setModal(false)}
                >
                  Cancel
                </button>
                <button className="button button-primary" disabled={busy || !form.timeSlot}>
                  {busy ? "Saving…" : rescheduleId ? "Confirm reschedule" : "Confirm appointment"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {consultAppointment && (
        <ClinicalModal
          appointment={consultAppointment}
          onClose={() => setConsultAppointment(null)}
          onDone={() => {
            setConsultAppointment(null);
            void load();
          }}
        />
      )}
    </div>
  );
}
function Metric({
  label,
  value,
  icon,
  tone,
  detail,
}: {
  label: string;
  value: any;
  icon: any;
  tone: string;
  detail: string;
}) {
  return (
    <div className="metric">
      <div className="metric-top">
        <span>{label}</span>
        <span className={`metric-icon ${tone}`}>{icon}</span>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder: string;
}) {
  return (
    <div className="table-tools">
      <label className="search-box">
        <Search size={16} />
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      </label>
      <span className="result-count">Search current records</span>
    </div>
  );
}
function DataTable({
  columns,
  rows,
  emptyTitle,
  emptyDetail,
}: {
  columns: string[];
  rows: any[][];
  emptyTitle: string;
  emptyDetail: string;
}) {
  return rows.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j}>{v ?? "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty icon={<FileText />} title={emptyTitle} detail={emptyDetail} />
  );
}
function Empty({
  icon,
  title,
  detail,
  action,
}: {
  icon: any;
  title: string;
  detail: string;
  action?: any;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <b>{title}</b>
      <p>{detail}</p>
      {action}
    </div>
  );
}

function BillingPanel({ user, rows, reload }: { user: User; rows: Row[]; reload: () => void }) {
  const [claims, setClaims] = useState<Row[]>([]),
    [billId, setBillId] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    api
      .get(user.role === "ADMIN" ? "/admin/claims" : "/claims")
      .then(({ data }) => setClaims(data.data.items || []))
      .catch(() => setError("Unable to load insurance claims."));
  }, [user.role, rows.length]);
  async function submitClaim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = Object.fromEntries(new FormData(e.currentTarget));
      await api.post("/claims", { ...data, billId });
      setMessage("Claim submitted for review.");
      setBillId("");
      await api.get("/claims").then(({ data: d }) => setClaims(d.data.items || []));
    } catch (e: any) {
      setError(e.response?.data?.error?.message || "Could not submit claim.");
    } finally {
      setBusy(false);
    }
  }
  async function markPaid(id: string) {
    setBusy(true);
    try {
      await api.patch(`/admin/bills/${id}/payment`, { status: "PAID" });
      setMessage("Demo payment recorded. No real transaction was processed.");
      reload();
    } catch (e: any) {
      setError(e.response?.data?.error?.message || "Unable to update bill.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="panel table-panel billing-subpanel">
        <div className="panel-head">
          <div>
            <h2>{user.role === "ADMIN" ? "Hospital bills" : "Your bills"}</h2>
            <p>
              {user.role === "ADMIN"
                ? "Recorded charges and simulated payment status."
                : "Bills associated with your visits."}
            </p>
          </div>
        </div>
        {message && (
          <div className="alert alert-success">
            <CheckCircle2 size={16} />
            {message}
            <button onClick={() => setMessage("")} aria-label="Dismiss">
              <X size={15} />
            </button>
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}
        <DataTable
          columns={
            user.role === "ADMIN"
              ? ["Patient", "Date", "Items", "Amount", "Status", "Action"]
              : ["Date", "Items", "Amount", "Status", "Insurance"]
          }
          rows={rows.map((b) =>
            user.role === "ADMIN"
              ? [
                  b.patientId?.name || "—",
                  new Date(b.createdAt).toLocaleDateString(),
                  b.items?.map((i: Row) => i.description).join(", "),
                  money(b.total),
                  <span className={`status-badge ${b.status?.toLowerCase()}`}>{b.status}</span>,
                  b.status === "PAID" ? (
                    <span className="muted">Recorded</span>
                  ) : (
                    <button
                      className="table-action"
                      disabled={busy}
                      onClick={() => markPaid(b._id)}
                    >
                      Record demo payment
                    </button>
                  ),
                ]
              : [
                  new Date(b.createdAt).toLocaleDateString(),
                  b.items?.map((i: Row) => i.description).join(", "),
                  money(b.total),
                  <span className={`status-badge ${b.status?.toLowerCase()}`}>{b.status}</span>,
                  <button className="table-action" onClick={() => setBillId(b._id)}>
                    Submit claim
                  </button>,
                ],
          )}
          emptyTitle="No bills yet"
          emptyDetail="Charges linked to your visits will appear here."
        />
      </section>
      {user.role === "PATIENT" && billId && (
        <section className="panel form-panel claim-form">
          <div className="panel-head">
            <div>
              <h2>Submit an insurance claim</h2>
              <p>Claim submission is simulated for this demonstration.</p>
            </div>
            <button className="icon-button" onClick={() => setBillId("")} aria-label="Cancel claim">
              <X size={16} />
            </button>
          </div>
          <form className="inline-form" onSubmit={submitClaim}>
            <label>
              Insurance provider
              <input name="provider" required maxLength={100} placeholder="Provider name" />
            </label>
            <label>
              Policy number
              <input name="policyNumber" required maxLength={100} placeholder="Policy number" />
            </label>
            <button className="button button-primary" disabled={busy}>
              {busy ? "Submitting…" : "Submit claim"}
            </button>
          </form>
        </section>
      )}
      <section className="panel table-panel billing-subpanel">
        <div className="panel-head">
          <div>
            <h2>Insurance claims</h2>
            <p>Claim status tracked against submitted bills.</p>
          </div>
        </div>
        <DataTable
          columns={
            user.role === "ADMIN"
              ? ["Patient", "Provider", "Bill total", "Status", "Submitted"]
              : ["Provider", "Bill total", "Status", "Submitted"]
          }
          rows={claims.map((c) =>
            user.role === "ADMIN"
              ? [
                  c.patientId?.name || "—",
                  c.provider,
                  money(c.billId?.total),
                  <span className={`status-badge ${c.status?.toLowerCase()}`}>
                    {c.status?.replace("_", " ")}
                  </span>,
                  new Date(c.createdAt).toLocaleDateString(),
                ]
              : [
                  c.provider,
                  money(c.billId?.total),
                  <span className={`status-badge ${c.status?.toLowerCase()}`}>
                    {c.status?.replace("_", " ")}
                  </span>,
                  new Date(c.createdAt).toLocaleDateString(),
                ],
          )}
          emptyTitle="No insurance claims"
          emptyDetail="Submitted claims and review status will appear here."
        />
      </section>
    </>
  );
}

function ClinicalModal({
  appointment,
  onClose,
  onDone,
}: {
  appointment: Row;
  onClose: () => void;
  onDone: () => void;
}) {
  const [record, setRecord] = useState<Row | null>(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [verifyUrl, setVerifyUrl] = useState("");
  async function saveRecord(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const f = new FormData(e.currentTarget);
      const { data } = await api.post(`/records/${appointment._id}`, {
        diagnosis: f.get("diagnosis"),
        symptoms: String(f.get("symptoms") || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        notes: f.get("notes"),
      });
      setRecord(data.data.record);
      setMessage("Consultation note saved and appointment marked complete.");
    } catch (e: any) {
      setError(e.response?.data?.error?.message || "Could not save the consultation.");
    } finally {
      setBusy(false);
    }
  }
  async function issuePrescription(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const f = new FormData(e.currentTarget);
      const { data } = await api.post("/prescriptions", {
        recordId: record?._id || record?.id,
        items: [
          {
            medicine: f.get("medicine"),
            dosage: f.get("dosage"),
            frequency: f.get("frequency"),
            duration: f.get("duration"),
          },
        ],
        instructions: f.get("instructions"),
      });
      setVerifyUrl(data.data.verifyUrl);
      setMessage("Prescription issued. The patient can download a verified PDF.");
    } catch (e: any) {
      setError(e.response?.data?.error?.message || "Could not issue the prescription.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <section
        className="modal clinical-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consult-heading"
      >
        <div className="modal-head">
          <div>
            <div className="eyebrow">
              CONSULTATION · {appointment.date} · {appointment.timeSlot}
            </div>
            <h2 id="consult-heading">{record ? "Issue a prescription" : "Document visit"}</h2>
            <p>Patient: {appointment.patientId?.name || "Assigned patient"}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {message && (
          <div className="alert alert-success">
            <CheckCircle2 size={16} />
            {message}
          </div>
        )}
        {!record ? (
          <form className="form-stack" onSubmit={saveRecord}>
            <label>
              Diagnosis
              <input name="diagnosis" required maxLength={500} placeholder="Clinical assessment" />
            </label>
            <label>
              Symptoms
              <input name="symptoms" placeholder="Comma-separated symptoms" />
            </label>
            <label>
              Consultation notes
              <textarea name="notes" maxLength={5000} placeholder="Document findings and plan" />
            </label>
            <div className="modal-actions">
              <button className="button button-secondary" type="button" onClick={onClose}>
                Close
              </button>
              <button className="button button-primary" disabled={busy}>
                {busy ? "Saving…" : "Save clinical record"}
              </button>
            </div>
          </form>
        ) : (
          <form className="form-stack" onSubmit={issuePrescription}>
            <div className="clinical-patient">
              <b>Record saved</b>
              <small>{record.diagnosis}</small>
            </div>
            <label>
              Medicine
              <input name="medicine" required maxLength={120} placeholder="Medication name" />
            </label>
            <div className="clinical-fields">
              <label>
                Dosage
                <input name="dosage" required placeholder="e.g. 250 mg" />
              </label>
              <label>
                Frequency
                <input name="frequency" required placeholder="e.g. Twice daily" />
              </label>
              <label>
                Duration
                <input name="duration" required placeholder="e.g. 5 days" />
              </label>
            </div>
            <label>
              Instructions
              <textarea name="instructions" maxLength={2000} placeholder="Directions for use" />
            </label>
            {verifyUrl && (
              <div className="verification-url">
                <ShieldCheck size={16} />
                <span>QR verification URL generated</span>
                <button type="button" className="text-button" onClick={onDone}>
                  Finish
                </button>
              </div>
            )}
            <div className="modal-actions">
              <button className="button button-secondary" type="button" onClick={onDone}>
                {verifyUrl ? "Done" : "Finish without prescription"}
              </button>
              <button className="button button-primary" disabled={busy || !!verifyUrl}>
                {busy ? "Issuing…" : "Issue prescription"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
function BedAction({
  bed,
  patients,
  onChange,
}: {
  bed: Row;
  patients: Row[];
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function update(status: string, patientId?: string) {
    setBusy(true);
    setError("");
    try {
      await api.patch(`/admin/beds/${bed._id}/status`, { status, patientId });
      onChange();
    } catch (e: any) {
      setError(e.response?.data?.error?.message || "Bed update failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="bed-action">
      {bed.status === "OCCUPIED" ? (
        <button className="table-action" disabled={busy} onClick={() => update("AVAILABLE")}>
          Discharge
        </button>
      ) : bed.status === "MAINTENANCE" ? (
        <button className="table-action" disabled={busy} onClick={() => update("AVAILABLE")}>
          Mark available
        </button>
      ) : (
        <>
          <select
            aria-label={`Assign patient to ${bed.number}`}
            defaultValue=""
            disabled={busy}
            onChange={(e) => e.target.value && update("OCCUPIED", e.target.value)}
          >
            <option value="">Assign patient</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <button className="table-action" disabled={busy} onClick={() => update("MAINTENANCE")}>
            Maintenance
          </button>
        </>
      )}
      {error && <small className="bed-error">{error}</small>}
    </div>
  );
}
