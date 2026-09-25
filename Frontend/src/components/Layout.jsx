import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  Activity,
  CalendarDays,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Pill,
  Receipt,
  ShieldCheck,
  UserRound,
  BedDouble,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../auth";
import Footer from "./Footer";

const links = {
  admin: [
    ["/dashboard", "Dashboard", LayoutDashboard],
    ["/appointments", "Appointments", CalendarDays],
    ["/beds", "Beds", BedDouble],
    ["/billing", "Billing", Receipt],
    ["/admin", "Administration", ShieldCheck],
  ],

  doctor: [
    ["/dashboard", "Dashboard", LayoutDashboard],
    ["/appointments", "Appointments", CalendarDays],
    ["/records", "Medical Records", FileText],
    ["/prescriptions", "Prescriptions", Pill],
    ["/ai", "AI Assistant", Sparkles],
  ],

  patient: [
    ["/dashboard", "Dashboard", LayoutDashboard],
    ["/appointments", "Appointments", CalendarDays],
    ["/records", "Medical Records", FileText],
    ["/prescriptions", "Prescriptions", Pill],
    ["/billing", "Billing", Receipt],
    ["/ai", "AI Triage", Sparkles],
  ],
};

const roleNames = {
  admin: "Administrator",
  doctor: "Doctor",
  patient: "Patient",
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userLinks = links[user?.role] || [];

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className="app-sidebar">

        <div className="sidebar-brand">
          <div className="brand">
            <span className="mark">
              <HeartPulse size={20} />
            </span>

            <span>CarePulse</span>
          </div>
        </div>

        <div className="sidebar-role">
          <Activity size={14} />
          <span>
            {roleNames[user?.role] || user?.role}
          </span>
        </div>

        <div className="sidebar-section-label">
          WORKSPACE
        </div>

        <nav className="sidebar-nav">

          {userLinks.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? "nav active" : "nav"
              }
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}

        </nav>

        <div className="sidebar-bottom">

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive ? "nav active" : "nav"
            }
          >
            <UserRound size={17} />
            <span>Profile</span>
          </NavLink>

          <button
            type="button"
            className="nav sidebar-signout"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            <span>Sign out</span>
          </button>

        </div>

      </aside>

      {/* MAIN COLUMN */}
      <div className="app-content-column">

        {/* HEADER */}
        <header className="app-header">

          <div className="header-copy">
            <small>CARE MANAGEMENT PLATFORM</small>

            <h1>
              Good to see you,{" "}
              {user?.name?.split(" ")[0] || "there"}
            </h1>
          </div>

          <div className="header-user">

            <div className="header-user-copy">
              <strong>{user?.name}</strong>

              <span>
                {roleNames[user?.role] || user?.role}
              </span>
            </div>

            <div className="avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "C"}
            </div>

          </div>

        </header>

        {/* MOBILE NAV */}
        <div className="mobile-app-nav">

          {userLinks.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive
                  ? "mobile-app-link active"
                  : "mobile-app-link"
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive
                ? "mobile-app-link active"
                : "mobile-app-link"
            }
          >
            <UserRound size={16} />
            <span>Profile</span>
          </NavLink>

        </div>

        {/* PAGE */}
        <main className="app-page-content">
          <Outlet />
        </main>

        {/* GLOBAL FOOTER */}
        <Footer authenticated />

      </div>

    </div>
  );
}