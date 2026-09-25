import { Link } from "react-router-dom";
import {
  ArrowRight,
  HeartPulse,
  ShieldCheck,
  Users,
  Activity,
  Sparkles,
} from "lucide-react";

import Footer from "../components/Footer";

export default function About() {
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
          <Link to="/about" className="active">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/login">Sign in</Link>
        </div>

      </nav>

      <section className="public-hero">

        <div className="section-kicker">
          ABOUT CAREPULSE
        </div>

        <h1>
          One connected workspace
          <br />
          for modern care operations.
        </h1>

        <p>
          CarePulse is a hospital management system designed to
          connect administrative, clinical and patient workflows
          through a single digital experience.
        </p>

        <div className="public-actions">
          <Link to="/register" className="hero-btn">
            Get started
            <ArrowRight size={16} />
          </Link>

          <Link to="/contact" className="secondary-btn">
            Contact
          </Link>
        </div>

      </section>

      <section className="public-content">

        <div className="public-info-grid">

          <article className="public-info-card">
            <div className="feature-icon">
              <Users size={21} />
            </div>

            <h3>Designed around people</h3>

            <p>
              Separate experiences for administrators, doctors
              and patients help each role focus on the workflows
              that matter to them.
            </p>
          </article>

          <article className="public-info-card">
            <div className="feature-icon">
              <Activity size={21} />
            </div>

            <h3>Connected workflows</h3>

            <p>
              Appointments, medical records, prescriptions,
              billing and operational information are connected
              through a shared platform.
            </p>
          </article>

          <article className="public-info-card">
            <div className="feature-icon">
              <Sparkles size={21} />
            </div>

            <h3>Responsible AI layer</h3>

            <p>
              Gemini-powered assistance can support administrative
              and educational workflows while keeping clinical
              decisions with qualified professionals.
            </p>
          </article>

          <article className="public-info-card">
            <div className="feature-icon">
              <ShieldCheck size={21} />
            </div>

            <h3>Security-aware foundation</h3>

            <p>
              Authentication, role-based authorization and audit
              logging form the application's security baseline.
            </p>
          </article>

        </div>

      </section>

      <Footer />

    </div>
  );
}