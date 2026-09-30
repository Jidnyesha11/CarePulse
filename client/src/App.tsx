import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, User } from "./store";
import { clearSession, setSession } from "./store";
import { api } from "./api";
import { Dashboard } from "./Dashboard";

const nav = [
  ["Overview", LayoutDashboard, "/"],
  ["Appointments", CalendarDays, "/appointments"],
  ["Patients", Users, "/patients"],
  ["Doctors", Stethoscope, "/doctors"],
  ["Medical records", ClipboardList, "/records"],
  ["Prescriptions", FileText, "/prescriptions"],
  ["Beds & wards", BedDouble, "/beds"],
  ["Billing & claims", Activity, "/billing"],
  ["Analytics", ChartNoAxesCombined, "/analytics"],
  ["Audit trail", ShieldCheck, "/audit"],
] as const;
function Login() {
  const dispatch = useDispatch(),
    navigate = useNavigate();
  const [register, setRegister] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const { data } = await api.post(
        `/auth/${register ? "register" : "login"}`,
        Object.fromEntries(form),
      );
      dispatch(setSession({ user: data.data.user, token: data.data.accessToken }));
      navigate("/");
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          "Unable to sign in. Check your details and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-shell">
      <div className="login-aside">
        <div className="brand brand-light">
          <span className="brand-mark">
            <HeartPulse size={22} />
          </span>
          <span>carepulse</span>
        </div>
        <div>
          <div className="eyebrow light-text">HOSPITAL OPERATIONS PLATFORM</div>
          <h1>
            Care, connected.
            <br />
            Operations, in sync.
          </h1>
          <p>One clear view of the work that keeps care moving.</p>
        </div>
        <div className="login-foot">Secure workflows · Thoughtful care · Better visibility</div>
      </div>
      <section className="login-panel">
        <div className="login-card">
          <span className="eyebrow">WELCOME TO CAREPULSE</span>
          <h2>{register ? "Create your account" : "Sign in to your workspace"}</h2>
          <p className="muted">
            {register
              ? "Register as a patient to get started."
              : "Access your hospital workspace securely."}
          </p>
          <form onSubmit={submit} className="form-stack">
            {register && (
              <label>
                Full name
                <input required name="name" autoComplete="name" placeholder="Your name" />
              </label>
            )}
            <label>
              Email address
              <input
                required
                type="email"
                name="email"
                autoComplete="email"
                placeholder="name@hospital.com"
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                minLength={8}
                name="password"
                autoComplete={register ? "new-password" : "current-password"}
                placeholder="At least 8 characters"
              />
            </label>
            {register && <input type="hidden" name="role" value="PATIENT" />}
            {error && (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            )}
            <button className="button button-primary button-full" disabled={busy}>
              {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
            </button>
          </form>
          <div className="auth-switch">
            {register ? "Already have access?" : "New to CarePulse?"}{" "}
            <button
              className="text-button"
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Sign in" : "Create an account"}
            </button>
          </div>
          <div className="trust-note">
            <ShieldCheck size={16} /> Your information is protected with role-based access.
          </div>
        </div>
      </section>
    </main>
  );
}
function Shell({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const location = useLocation(),
    dispatch = useDispatch(),
    navigate = useNavigate();
  const patientItems = [
    "Overview",
    "Appointments",
    "Doctors",
    "Medical records",
    "Prescriptions",
    "Billing & claims",
  ];
  const doctorItems = [
    "Overview",
    "Appointments",
    "Patients",
    "Medical records",
    "Prescriptions",
    "Analytics",
  ];
  const allowed = nav.filter(
    ([label]) =>
      user.role === "ADMIN" ||
      (user.role === "DOCTOR" ? doctorItems : patientItems).includes(label),
  );
  const active = nav.find(([, , to]) => to === location.pathname)?.[0] || "Overview";
  async function signOut() {
    try {
      await api.post("/auth/logout");
    } catch {}
    dispatch(clearSession());
    navigate("/login");
  }
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <HeartPulse size={22} />
          </span>
          <span>carepulse</span>
          <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <X />
          </button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <div className="hospital-picker">
          <span className="hospital-icon">CP</span>
          <span>
            <b>CarePulse Medical</b>
            <small>Central campus</small>
          </span>
          <span className="chevron">⌄</span>
        </div>
        <nav className="side-nav" aria-label="Main navigation">
          <div className="nav-caption">CARE DELIVERY</div>
          {allowed.slice(0, 6).map(([name, Icon, to]) => (
            <Link
              key={name}
              onClick={() => setOpen(false)}
              className={`nav-link ${active === name ? "active" : ""}`}
              to={to}
            >
              <Icon size={17} />
              <span>{name}</span>
              {name === "Appointments" && <span className="nav-dot" />}
            </Link>
          ))}
          {user.role === "ADMIN" && (
            <>
              <div className="nav-caption nav-caption-gap">OPERATIONS</div>
              {allowed.slice(6).map(([name, Icon, to]) => (
                <Link
                  key={name}
                  onClick={() => setOpen(false)}
                  className={`nav-link ${active === name ? "active" : ""}`}
                  to={to}
                >
                  <Icon size={17} />
                  <span>{name}</span>
                </Link>
              ))}
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="system-status">
            <span>CarePulse · demo workspace</span>
          </div>
          <div className="profile">
            <div className="avatar">
              {user.name
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="profile-copy">
              <b>{user.name}</b>
              <small>
                {user.role.toLowerCase()} {user.department ? `· ${user.department}` : ""}
              </small>
            </div>
            <button
              className="icon-button"
              onClick={signOut}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      {open && <button className="scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-button menu-trigger"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            CarePulse <span>/</span> <b>{active}</b>
          </div>
          <div className="topbar-right">
            <button className="search-shortcut" aria-label="Search">
              <Search size={16} />
              <span>Search</span>
              <kbd>⌘ K</kbd>
            </button>
            <div className="top-avatar">{user.name[0].toUpperCase()}</div>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="*" element={<Dashboard user={user} />} />
        </Routes>
      </main>
    </div>
  );
}
function Landing() {
  return (
    <main className="landing">
      <header className="landing-nav">
        <Link className="brand landing-brand" to="/">
          <span className="brand-mark">
            <HeartPulse size={22} />
          </span>
          <span>carepulse</span>
        </Link>
        <nav>
          <a href="#platform">Platform</a>
          <a href="#workflows">Workflows</a>
          <a href="#trust">Trust & safety</a>
        </nav>
        <Link className="button button-primary" to="/login">
          Sign in <ArrowUpRight size={15} />
        </Link>
      </header>
      <section className="landing-hero">
        <div className="landing-copy">
          <div className="eyebrow">
            <span className="hero-pip" /> HOSPITAL OPERATIONS PLATFORM
          </div>
          <h1>Intelligent hospital operations, connected around every patient.</h1>
          <p>
            CarePulse brings care teams, appointments, clinical records and hospital resources into
            one considered workspace.
          </p>
          <div className="landing-actions">
            <Link className="button button-primary" to="/login">
              Explore CarePulse <ArrowUpRight size={16} />
            </Link>
            <a className="text-link" href="#platform">
              Discover the platform <ChevronRight size={15} />
            </a>
          </div>
          <div className="landing-proof">
            <span>
              <ShieldCheck size={16} /> Role-aware access
            </span>
            <span>
              <Activity size={16} /> Live availability
            </span>
            <span>
              <FileText size={16} /> Traceable records
            </span>
          </div>
        </div>
        <div className="workflow-art" aria-label="CarePulse patient journey">
          <div className="workflow-top">
            <span className="workflow-logo">
              <HeartPulse size={17} />
            </span>
            <span>CONNECTED CARE JOURNEY</span>
            <span className="secure-pill">
              <ShieldCheck size={12} /> SECURE
            </span>
          </div>
          <div className="journey-line">
            <i />
          </div>
          <div className="journey-step">
            <span className="journey-icon mint-bg">
              <Sparkles size={16} />
            </span>
            <div>
              <b>Understand symptoms</b>
              <small>AI assisted intake · clinician-led care</small>
            </div>
            <span className="step-num">01</span>
          </div>
          <div className="journey-step">
            <span className="journey-icon blue-bg">
              <CalendarDays size={16} />
            </span>
            <div>
              <b>Find a time to visit</b>
              <small>Live appointment availability</small>
            </div>
            <span className="step-num">02</span>
          </div>
          <div className="journey-step">
            <span className="journey-icon sand-bg">
              <Stethoscope size={16} />
            </span>
            <div>
              <b>Coordinate the visit</b>
              <small>Care team · records · prescription</small>
            </div>
            <span className="step-num">03</span>
          </div>
          <div className="journey-step">
            <span className="journey-icon sage-bg">
              <BedDouble size={16} />
            </span>
            <div>
              <b>Support hospital operations</b>
              <small>Resources · billing · audit trail</small>
            </div>
            <span className="step-num">04</span>
          </div>
          <div className="workflow-note">
            <span className="status-pip" /> Designed to keep each step connected and traceable
          </div>
        </div>
      </section>
      <section className="landing-trust" id="trust">
        <span>BUILT FOR THE PEOPLE WHO KEEP CARE MOVING</span>
        <div>
          <b>Patient-first access</b>
          <b>Clear operational visibility</b>
          <b>Accountable clinical workflows</b>
        </div>
      </section>
      <section className="landing-features" id="platform">
        <div className="section-lead">
          <div className="eyebrow">ONE CONNECTED PLATFORM</div>
          <h2>Clarity for every care interaction.</h2>
          <p>
            From first question to follow-up, information stays connected to the people responsible
            for the next step.
          </p>
        </div>
        <div className="feature-cards">
          <article>
            <span className="feature-icon mint-bg">
              <Sparkles />
            </span>
            <h3>Thoughtful intake</h3>
            <p>
              Structured symptom routing supports a conversation with the care team, with clear
              limits and safety guidance.
            </p>
          </article>
          <article>
            <span className="feature-icon blue-bg">
              <CalendarDays />
            </span>
            <h3>Responsive scheduling</h3>
            <p>
              Clinicians and patients see live slot changes as appointments are booked and released.
            </p>
          </article>
          <article>
            <span className="feature-icon sand-bg">
              <FileText />
            </span>
            <h3>Connected clinical work</h3>
            <p>
              Records, prescriptions and verification stay linked to the visit with a reviewable
              access trail.
            </p>
          </article>
          <article>
            <span className="feature-icon sage-bg">
              <ChartNoAxesCombined />
            </span>
            <h3>Operational insight</h3>
            <p>
              Administrators see current appointments, resources and recorded billing activity in
              one workspace.
            </p>
          </article>
        </div>
      </section>
      <section className="landing-cta" id="workflows">
        <div>
          <div className="eyebrow light-text">A BETTER VIEW OF THE WHOLE JOURNEY</div>
          <h2>Make the next step clear.</h2>
          <p>
            Bring your care workflow into focus with role-based views for patients, clinicians and
            hospital administrators.
          </p>
        </div>
        <Link className="button landing-cta-button" to="/login">
          Enter CarePulse <ArrowUpRight size={16} />
        </Link>
      </section>
      <footer className="landing-footer">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <HeartPulse size={20} />
          </span>
          <span>carepulse</span>
        </Link>
        <span>CarePulse · Intelligent hospital operations</span>
        <span>Portfolio demonstration · Not for emergency or clinical use</span>
      </footer>
    </main>
  );
}
export default function App() {
  const user = useSelector((s: RootState) => s.auth.user);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(!!sessionStorage.getItem("carepulse-session"));
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/auth/me");
        if (!cancelled) dispatch(setSession({ user: data.data.user, token: useSelectorToken() }));
      } catch {
        if (!cancelled) dispatch(clearSession());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    function useSelectorToken() {
      try {
        return JSON.parse(sessionStorage.getItem("carepulse-session") || "{}").token || null;
      } catch {
        return null;
      }
    }
    void restore();
    return () => {
      cancelled = true;
    };
  }, []);
  if (loading)
    return (
      <div className="boot-screen">
        <div className="brand-mark">
          <HeartPulse />
        </div>
        <span>Loading workspace</span>
      </div>
    );
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={user ? <Shell user={user} /> : <Landing />} />
    </Routes>
  );
}
