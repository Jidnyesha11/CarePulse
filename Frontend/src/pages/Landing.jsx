import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, ShieldCheck, Sparkles, Activity, Clock3, HeartPulse } from "lucide-react";

export default function Landing() {
  return <div className="landing">
    <nav className="landing-nav">
      <div className="brand"><span className="mark"><HeartPulse size={20}/></span>CarePulse</div>
      <div className="nav-links"><a href="#features">Platform</a><a href="#workflow">How it works</a><a href="#security">Security</a></div>
      <div className="nav-actions"><Link to="/login" className="text-link">Sign in</Link><Link to="/register" className="nav-cta">Get started <ArrowRight size={16}/></Link></div>
    </nav>
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><span className="pulse-dot"/> MODERN CARE OPERATIONS</div>
        <h1>Healthcare, <span>connected.</span><br/>Care, made simpler.</h1>
        <p>CarePulse brings appointments, clinical records, prescriptions, billing and intelligent assistance into one calm, secure workspace for hospitals and clinics.</p>
        <div className="hero-actions"><Link to="/register" className="hero-btn">Start your care journey <ArrowRight size={17}/></Link><a href="#features" className="secondary-btn">Explore platform</a></div>
        <div className="trust-row"><span><ShieldCheck size={16}/> Role-based access</span><span><Activity size={16}/> Live availability</span><span><Sparkles size={16}/> Gemini AI</span></div>
      </div>
      <div className="hero-visual">
        <div className="orb orb-one"/><div className="orb orb-two"/>
        <div className="dashboard-preview">
          <div className="preview-top"><span className="mini-brand">CarePulse</span><span className="mini-status">● Live</span></div>
          <div className="preview-title">Good morning, Aarav</div>
          <div className="preview-sub">Here’s what needs your attention today.</div>
          <div className="preview-stats"><div><small>Next visit</small><b>10:30 AM</b><span>Dr. Maya Sharma</span></div><div><small>Outstanding</small><b>₹1,240</b><span>2 invoices</span></div></div>
          <div className="preview-card"><div className="preview-icon"><CalendarDays size={17}/></div><div><b>Cardiology consultation</b><span>Today · 10:30 AM · Room 204</span></div><span className="confirmed">Confirmed</span></div>
          <div className="preview-card soft"><div className="preview-icon ai"><Sparkles size={17}/></div><div><b>CarePulse AI</b><span>Need help understanding your next steps?</span></div></div>
        </div>
      </div>
    </section>
    <section id="features" className="feature-section">
      <div className="section-kicker">ONE PLATFORM · THREE EXPERIENCES</div>
      <h2>Designed around the people<br/>who deliver and receive care.</h2>
      <div className="feature-grid">
        <Feature icon={<CalendarDays/>} title="Frictionless scheduling" text="See real doctor availability and book conflict-free appointments without phone calls."/>
        <Feature icon={<ShieldCheck/>} title="Privacy by design" text="Role-aware APIs and audit trails keep sensitive records available only to authorized people."/>
        <Feature icon={<Sparkles/>} title="Helpful intelligence" text="Gemini-powered triage and streaming assistance add a thoughtful AI layer without replacing clinicians."/>
      </div>
    </section>
    <section id="workflow" className="workflow-section"><div><div className="section-kicker">A CALMER WORKFLOW</div><h2>From booking to billing,<br/>everything stays connected.</h2></div><div className="workflow-steps"><Step n="01" t="Discover" d="Find the right doctor and live slot."/><Step n="02" t="Coordinate" d="Book and manage appointments in real time."/><Step n="03" t="Care" d="Keep records and prescriptions together."/><Step n="04" t="Close the loop" d="Track invoices and operational insights."/></div></section>
    <section id="security" className="security-banner"><ShieldCheck/><div><b>Built for sensitive workflows.</b><span>JWT authentication, API-level RBAC, audit logging and server-side AI credentials form the security baseline.</span></div></section>
    <footer>CarePulse · Hospital Management System · Portfolio / capstone platform</footer>
  </div>
}
function Feature({icon,title,text}){return <article className="feature-card"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>}
function Step({n,t,d}){return <div className="step"><span>{n}</span><div><b>{t}</b><p>{d}</p></div></div>}
