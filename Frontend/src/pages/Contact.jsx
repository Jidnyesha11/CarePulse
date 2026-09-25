import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  HeartPulse,
  MessageSquare,
  ShieldCheck,
  Mail,
} from "lucide-react";

import Footer from "../components/Footer";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

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
          <Link to="/contact" className="active">
            Contact
          </Link>
          <Link to="/login">Sign in</Link>
        </div>
      </nav>

      <section className="public-hero public-hero-small">
        <div className="section-kicker">CONTACT</div>

        <h1>Let's start a conversation.</h1>

        <p>
          Have a question about CarePulse? Send us a message using
          the form below.
        </p>
      </section>

      <section className="public-content">
        <div className="contact-layout">

          <div className="contact-info">

            <div className="contact-info-card">
              <div className="feature-icon">
                <MessageSquare size={21} />
              </div>

              <h3>General enquiries</h3>

              <p>
                Questions about the CarePulse platform, workflows,
                or project experience can be submitted through
                the contact form.
              </p>
            </div>

            <div className="contact-info-card">
              <div className="feature-icon">
                <ShieldCheck size={21} />
              </div>

              <h3>Security matters</h3>

              <p>
                Security and privacy requests should be handled
                through the organization's approved support process
                in a production deployment.
              </p>
            </div>

            <div className="contact-info-card">
              <div className="feature-icon">
                <Mail size={21} />
              </div>

              <h3>Contact information</h3>

              <p>
                Connect this section to your organization's verified
                email address and support channels before deployment.
              </p>
            </div>

          </div>

          <form
            className="contact-form card"
            onSubmit={handleSubmit}
          >
            <div className="card-head">
              <div>
                <h3>Send a message</h3>
                <p className="muted">
                  Tell us how we can help.
                </p>
              </div>
            </div>

            <label>Name</label>

            <input
              required
              name="name"
              placeholder="Your name"
            />

            <label>Email</label>

            <input
              required
              type="email"
              name="email"
              placeholder="you@example.com"
            />

            <label>Subject</label>

            <input
              required
              name="subject"
              placeholder="What is this about?"
            />

            <label>Message</label>

            <textarea
              required
              name="message"
              rows="6"
              placeholder="Write your message..."
            />

            {submitted && (
              <div className="success-message">
                Message captured successfully. Connect this form
                to your backend or support provider to process
                submissions.
              </div>
            )}

            <button className="primary" type="submit">
              Send message
              <ArrowRight size={16} />
            </button>
          </form>

        </div>
      </section>

      <Footer />
    </div>
  );
}