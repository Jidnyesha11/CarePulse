import { Link } from "react-router-dom";
import { HeartPulse, ShieldCheck } from "lucide-react";
import Footer from "../components/Footer";

export default function Privacy() {
  return (
    <div className="public-page">
      <nav className="public-nav">
        <Link to="/" className="footer-logo">
          <span className="mark">
            <HeartPulse size={18} />
          </span>
          CarePulse
        </Link>

        <div className="public-nav-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/login">Sign in</Link>
        </div>
      </nav>

      <section className="legal-hero">
        <div className="section-kicker">PRIVACY</div>

        <h1>Privacy & data protection</h1>

        <p>
          This page provides a privacy-policy template for the
          CarePulse capstone application. It should be reviewed
          and customized before real-world deployment.
        </p>
      </section>

      <main className="legal-content">
        <section>
          <h2>1. Information handled by CarePulse</h2>
          <p>
            Depending on enabled workflows, the application may
            process account information, appointment information,
            medical records, prescriptions, billing information
            and application audit events.
          </p>
        </section>

        <section>
          <h2>2. Authentication and access</h2>
          <p>
            CarePulse uses authenticated accounts and role-based
            access controls to determine which application
            resources a user can access.
          </p>
        </section>

        <section>
          <h2>3. AI-assisted features</h2>
          <p>
            AI features are intended to provide administrative,
            educational or triage assistance. They are not a
            replacement for professional clinical judgment.
          </p>
        </section>

        <section>
          <h2>4. Data security</h2>
          <p>
            The application includes security-oriented controls
            such as authentication, authorization, audit logging
            and server-side handling of AI credentials.
          </p>
        </section>

        <section>
          <h2>5. Production deployment</h2>
          <p>
            This capstone implementation is not a certified medical
            or regulatory compliance system. A real deployment
            requires appropriate privacy, security, regulatory,
            clinical and legal review.
          </p>
        </section>

        <div className="legal-notice">
          <ShieldCheck size={20} />
          <span>
            This document is an application template and should
            not be treated as legal advice.
          </span>
        </div>
      </main>

      <Footer />
    </div>
  );
}