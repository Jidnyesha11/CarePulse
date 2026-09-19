# CarePulse — Intelligent Hospital Management System

A polished MERN hospital platform for Admin, Doctor and Patient workflows. It includes JWT/RBAC, appointment conflict prevention, Socket.IO live availability, medical records, prescriptions with QR verification, billing, beds, audit logs, Gemini AI symptom triage, Gemini streaming generation, analytics, automated tests and CI/CD configuration.

## Product direction

CarePulse is designed as a calm, clinical, premium operations product: high information density without visual clutter, strong hierarchy, responsive layouts, clear status states and safety-first AI interactions.

## Run locally

Backend:
```bash
cd Backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

Frontend:
```bash
cd Frontend
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173.

## Demo accounts

- admin@carepulse.local / Admin@12345
- doctor@carepulse.local / Doctor@12345
- patient@carepulse.local / Patient@12345

## Gemini

Create a Gemini API key and configure the backend:

```env
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TRIAGE_MODEL=gemini-2.5-flash
```

The browser never receives the Gemini key. The backend uses the Google GenAI SDK. The streaming endpoint is:

`POST /api/v1/ai/generate/stream`

It emits SSE events: `start`, `delta`, `done`, `error`.

The triage assistant is an educational routing aid, not a diagnosis or prescription system.

## Deployment

- Render: `render.yaml`
- Vercel: `vercel.json`
- GitHub Actions: `.github/workflows/ci.yml`
- MongoDB local: `docker-compose.yml`

CarePulse is a portfolio/capstone system, not a certified medical device or compliance-certified healthcare platform. Real deployment requires formal security, privacy, regulatory and clinical review.
