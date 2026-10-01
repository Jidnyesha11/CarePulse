# HMS CarePulse 🏥

## Smart Hospital Management System

CarePulse is a full-stack hospital management system demo for coordinating appointments, patient
records, prescriptions, beds, billing simulations, and day-to-day hospital operations. It includes
role-based patient, doctor, and administrator workspaces, a versioned REST API, Socket.IO events,
and optional Gemini-assisted symptom routing.

> **Demo only:** CarePulse is not a certified clinical product and is not HIPAA-compliant. Do not
> use it for real patient data, diagnosis, treatment, or emergency care.

## Live deployment

| Service | URL |
| --- | --- |
| Patient and staff website | [https://carepulse-web.onrender.com](https://carepulse-web.onrender.com) |
| API service | [https://carepulse-api-35nz.onrender.com](https://carepulse-api-35nz.onrender.com/) |
| API health | [https://carepulse-api-35nz.onrender.com/api/v1/health](https://carepulse-api-35nz.onrender.com/api/v1/health) |
| Interactive API documentation | [https://carepulse-api-35nz.onrender.com/api/docs](https://carepulse-api-35nz.onrender.com/api/docs) |
| OpenAPI JSON | [https://carepulse-api-35nz.onrender.com/api/v1/openapi.json](https://carepulse-api-35nz.onrender.com/api/v1/openapi.json) |

The API is hosted on Render's free web-service plan and may take about a minute to wake after an
idle period. The frontend is a Render static site. Both are portfolio/demo deployments, not
production healthcare infrastructure.

## Project deliverables

- **Hospital management website:** responsive React and TypeScript application with patient,
  doctor, and administrator workspaces.
- **Admin dashboard:** operational overview, users, beds, bills, claims, audit events, and analytics.
- **REST APIs:** Express API under `/api/v1`, with interactive Swagger UI and an OpenAPI document.
- **Database design:** MongoDB/Mongoose models, relationships, validation, and indexes documented in
  [Database design](docs/DATABASE.md).
- **Deployment:** live Render links above and a Render Blueprint in [`render.yaml`](render.yaml).
- **Documentation:** local setup, API, database, deployment, and testing guides in [`docs/`](docs/).

## Features

### Patient workspace

- Create a patient account and sign in.
- Describe symptoms to receive cautious department/specialist routing and an urgency suggestion.
- Browse doctors and available slots; book, reschedule, and cancel appointments.
- View assigned clinical records and prescriptions, download prescription PDFs, and submit simulated
  insurance claims.
- Join a video visit for an eligible confirmed appointment.
- Use the patient portal in English, Hindi, or Marathi; language preference is stored in the browser.

### Doctor workspace

- Review assigned appointments and patient records available through care assignments.
- Update appointment status, document consultations, and issue prescriptions.
- Review doctor-level appointment analytics and join eligible video visits.

### Administrator workspace

- Review operational metrics and recent activity.
- Browse users and promote provisioned accounts to doctor roles.
- Manage ward beds and patient admission/discharge status.
- Create bills, record simulated payments, and review insurance claims.
- Inspect audit events and operational analytics, including busiest appointment hours, recorded
  diagnosis trends, no-show rate, and a directional seven-day booking estimate.

### Platform capabilities

- Short-lived JWT access tokens and HTTP-only refresh cookies.
- Server-side role checks, request validation, security headers, and login/triage rate limits.
- MongoDB persistence with indexes for appointment slots, beds, and prescriptions.
- Socket.IO signaling for live appointment/bed updates and video visits.
- Optional Gemini structured triage with safety rules and a constrained fallback when the provider
  is unavailable or not configured.
- Prescription PDFs with QR-code verification links.
- Audit records for key patient, administrative, and operational actions.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Redux Toolkit, React Router, Axios, Recharts, Socket.IO Client |
| Backend | Node.js, Express 5, Mongoose, Zod, JWT, Socket.IO |
| Database | MongoDB local or MongoDB Atlas |
| Optional AI | Google Gemini API |
| Deployment | Render Blueprint: Node web service and static site |

## Architecture

```text
Browser (React + TypeScript)
  ├── REST requests to /api/v1 ──┐
  └── Socket.IO connection ──────┤
                                 ▼
                       Express API (Node.js)
                  auth · appointments · triage
              clinical records · operations · signaling
                                 │
                                 ▼
                        MongoDB (Mongoose)
```

The Express server owns both the REST API and the Socket.IO connection. Domain routes, services, and
models live under `server/src/modules`. The frontend source is under `client/src`.

## Run locally

### Requirements

- Node.js 20 or newer and npm.
- A reachable MongoDB instance, local or MongoDB Atlas.
- A Gemini API key only if you want model-assisted triage; triage has a fallback without one.

### Configure environment

From the repository root in Windows PowerShell:

```powershell
Copy-Item server/.env.example server/.env
```

Edit `server/.env` and set:

- `MONGODB_URI` to your local MongoDB URL or Atlas connection string.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to separate, strong secret values.
- `CLIENT_URL=http://localhost:5173` and `COOKIE_SECURE=false` for local HTTP development.
- `GEMINI_API_KEY` only if you want Gemini-powered triage.

You can generate a secret locally with this command and run it twice to get two different values:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Keep `server/.env` private. It is ignored by Git and must not be committed.

### Install, seed, and start

```powershell
npm install
npm run seed   # optional; adds synthetic demo accounts and sample data
npm run dev
```

The development command starts both the API and Vite frontend. Open:

| Service | Local URL |
| --- | --- |
| Website | http://localhost:5173 |
| API base | http://localhost:4000/api/v1 |
| Health check | http://localhost:4000/api/v1/health |
| Swagger UI | http://localhost:4000/api/docs |
| OpenAPI JSON | http://localhost:4000/api/v1/openapi.json |

### Seed demo accounts

`npm run seed` creates synthetic sample data. Seeded accounts use the shared password
`CarePulseDemo26!`:

| Role | Email |
| --- | --- |
| Admin | `admin@carepulse.demo` |
| Doctor | `doctor@carepulse.demo` |
| Doctor | `doctor2@carepulse.demo` |
| Patient | `patient@carepulse.demo` |
| Patient | `patient2@carepulse.demo` |

These credentials are public and intended only for a disposable demo database. Do not seed real
patient data or leave these accounts enabled on a public deployment. A registration that fails after
account creation may still have created the user; try signing in before registering the same email
again.

## Useful commands

Run commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start API and frontend for local development |
| `npm run dev:server` | Start only the API |
| `npm run dev:client` | Start only the frontend |
| `npm run seed` | Add/update synthetic demo records in the configured database |
| `npm run format` | Format source, configuration, and documentation with Prettier |
| `npm run format:check` | Check Prettier formatting without changing files |
| `npm run lint` | Run ESLint on frontend and backend source/tests |
| `npm test` | Run backend unit and HTTP smoke checks |
| `npm run build` | Type-check and build the frontend for production |

There is no separate frontend test suite configured at this time.

## API overview

The API is versioned under `/api/v1`. Protected endpoints use
`Authorization: Bearer <access-token>`; successful login/registration also sets an HTTP-only refresh
cookie. Role authorization is enforced by the server, not only by frontend navigation.

| Area | Example endpoints |
| --- | --- |
| Health and authentication | `GET /health`, `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` |
| Triage | `POST /triage` |
| Appointments | `GET /appointments`, `GET /appointments/availability/:doctorId`, `POST /appointments`, `PATCH /appointments/:id/reschedule` |
| Clinical | `/records`, `/prescriptions`, `/doctors`, `/patients` |
| Billing and claims | `/bills`, `/claims`, `/admin/bills/:appointmentId` |
| Administration | `/admin/users`, `/admin/beds`, `/admin/audit`, `/admin/analytics` |

See the [complete endpoint reference](docs/API.md) or open the live [Swagger UI](https://carepulse-api-35nz.onrender.com/api/docs).

## Deploy on Render

The root [`render.yaml`](render.yaml) defines both deployed services and sets the API compute plan
to `free`. To deploy your own copy:

1. Push the repository to GitHub and connect it to Render.
2. Create a Blueprint from the repository and confirm `carepulse-api` is set to **Free**.
3. Create a MongoDB Atlas Free cluster and database user; allow the Render API to connect.
4. Set the API variables: `MONGODB_URI`, `CLIENT_URL`, `PUBLIC_API_URL`, and optionally
   `GEMINI_API_KEY`. The Blueprint generates the JWT secrets.
5. Set the frontend build variable `VITE_API_URL` to the API origin plus `/api/v1`.
6. Add the static-site rewrite `/*` → `/index.html` for React Router deep links.
7. Deploy, then check `/api/v1/health` and `/api/docs` on the API URL.

For exact variable values, CORS configuration, and troubleshooting, see the
[deployment guide](docs/DEPLOYMENT.md). Render's free API service sleeps after inactivity and has
limited compute, so the first request after it wakes can be slow. MongoDB Atlas Free clusters have
storage and operation limits; review its current [free-cluster limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/).

## Realtime and telemedicine notes

- Socket.IO uses the API origin, not the `/api/v1` path, and authenticates with the access token.
- Video media is peer-to-peer between the two appointment participants; CarePulse relays signaling
  only and does not record calls.
- The client uses public STUN only. No TURN relay is configured, so some restrictive networks may
  block calls. Camera/microphone permission and HTTPS are required outside localhost.
- The deployment runs one API instance. Horizontal scaling requires a shared Socket.IO adapter.

## Scope and safety

- This project is a portfolio demonstration, not a clinical product or a HIPAA-compliant system.
  Do not enter real patient information or rely on it for care decisions.
- Symptom routing is not diagnosis or treatment. Emergency symptoms require immediate local
  emergency services and qualified clinical care.
- Analytics estimates use simple historical averages; they are not validated predictive models or
  clinical recommendations.
- Billing and insurance workflows are simulations. No payment processor or insurer is connected.
- Email/SMS reminders, password reset, external file storage, and a TURN service are not implemented.
- Key patient navigation and common workflows are translated into English, Hindi, and Marathi;
  some system-generated and less common content may remain in English.

## Repository structure

```text
client/
  src/                    React and TypeScript application
server/
  src/
    modules/              Auth, appointments, clinical, operations, triage, and models
    middleware/           Authentication and role checks
    config/               Database connection
  test/                   Backend unit and HTTP smoke checks
docs/
  API.md                  REST API and Socket.IO reference
  DATABASE.md             MongoDB entities, relationships, and indexes
  DEPLOYMENT.md           Render and MongoDB deployment instructions
  TESTING.md              Checks and manual browser workflows
render.yaml               Render Blueprint for API and frontend
```

## Further documentation

- [REST API reference](docs/API.md)
- [Database design](docs/DATABASE.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Testing guide](docs/TESTING.md)