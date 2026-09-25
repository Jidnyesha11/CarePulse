import { Link } from "react-router-dom";
import { HeartPulse, FileText } from "lucide-react";
import Footer from "../components/Footer";

export default function Terms() {
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
        <div className="section-kicker">TERMS</div>

        <h1>Terms of use</h1>

        <p>
          This page provides a terms-of-use template for the
          CarePulse capstone application and should be reviewed
          before real-world deployment.
        </p>
      </section>

      <main className="legal-content">
        <section>
          <h2>1. Platform purpose</h2>
          <p>
            CarePulse is a hospital management application designed
            to demonstrate digital workflows for administrators,
            doctors and patients.
          </p>
        </section>

        <section>
          <h2>2. User accounts</h2>
          <p>
            Users are responsible for maintaining the confidentiality
            of their account credentials and using the platform
            within the permissions associated with their role.
          </p>
        </section>

        <section>
          <h2>3. Clinical information</h2>
          <p>
            Information displayed by the platform should not be
            interpreted as independent medical advice. Clinical
            decisions remain the responsibility of appropriately
            qualified healthcare professionals.
          </p>
        </section>

        <section>
          <h2>4. AI functionality</h2>
          <p>
            AI-generated content may contain errors or omissions.
            Important information should be verified by an
            appropriately qualified professional.
          </p>
        </section>

        <section>
          <h2>5. Availability and deployment</h2>
          <p>
            The capstone implementation is provided as a software
            demonstration. Production use requires appropriate
            infrastructure, security, monitoring, backup,
            privacy safeguards and organizational policies.
          </p>
        </section>

        <div className="legal-notice">
          <FileText size={20} />

          <span>
            Have the final terms reviewed by the appropriate
            organization and legal professionals before production use.
          </span>
        </div>
      </main>

      <Footer />
    </div>
  );
}