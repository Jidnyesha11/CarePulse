import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  HeartPulse,
  ShieldCheck,
  Mail,
  LockKeyhole,
} from "lucide-react";

export default function Footer({ authenticated = false }) {
  return (
    <footer className="site-footer">

      <div className="footer-main">

        {/* Brand */}
        <div className="footer-brand">

          <Link to="/" className="footer-logo">
            <span className="mark">
              <HeartPulse size={18} />
            </span>

            CarePulse
          </Link>

          <p>
            A connected hospital management platform bringing
            appointments, records, prescriptions, billing and
            intelligent assistance into one workspace.
          </p>

          <div className="footer-trust">
            <ShieldCheck size={15} />
            <span>
              Role-based access · Secure workflows
            </span>
          </div>

        </div>

        {/* Platform */}
        <div className="footer-column">

          <h4>PLATFORM</h4>

          {authenticated ? (
            <>
              <Link to="/dashboard">
                Dashboard
              </Link>

              <Link to="/appointments">
                Appointments
              </Link>

              <Link to="/records">
                Medical records
              </Link>

              <Link to="/ai">
                AI assistant
              </Link>
            </>
          ) : (
            <>
              <a href="/#features">
                Features
              </a>

              <a href="/#workflow">
                How it works
              </a>

              <a href="/#security">
                Security
              </a>

              <Link to="/login">
                Sign in
              </Link>
            </>
          )}

        </div>

        {/* Company */}
        <div className="footer-column">

          <h4>CAREPULSE</h4>

          <Link to="/about">
            About
          </Link>

          <Link to="/contact">
            Contact
          </Link>

          <Link to="/privacy">
            Privacy
          </Link>

          <Link to="/terms">
            Terms
          </Link>

        </div>

        {/* Application */}
        <div className="footer-column">

          <h4>QUICK ACCESS</h4>

          {authenticated ? (
            <>
              <Link to="/profile">
                My profile
              </Link>

              <Link to="/prescriptions">
                Prescriptions
              </Link>

              <Link to="/billing">
                Billing
              </Link>

              <Link to="/appointments">
                Appointments
              </Link>
            </>
          ) : (
            <>
              <Link to="/register">
                Create account
              </Link>

              <Link to="/login">
                Sign in
              </Link>

              <Link to="/contact">
                Contact
              </Link>

              <Link to="/about">
                Learn about CarePulse
              </Link>
            </>
          )}

        </div>

      </div>

      {/* Trust strip */}
      <div className="footer-security-strip">

        <div>
          <LockKeyhole size={16} />

          <span>
            Authentication and authorization are enforced at
            the application API layer.
          </span>
        </div>

        <Link to="/privacy">
          Privacy & security
          <ArrowUpRight size={14} />
        </Link>

      </div>

      {/* Bottom */}
      <div className="footer-bottom">

        <span>
          © {new Date().getFullYear()} CarePulse
          {" · "}
          Hospital Management System
        </span>

        <div className="footer-bottom-links">
          <Link to="/privacy">
            Privacy
          </Link>

          <Link to="/terms">
            Terms
          </Link>

          <Link to="/contact">
            Contact
          </Link>
        </div>

        <span>
          Portfolio / capstone platform
        </span>

      </div>

    </footer>
  );
}