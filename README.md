# CarePulse HMS

CarePulse is a full-stack hospital management demo for coordinating patient access, appointments, clinical documentation, and hospital operations. It includes a responsive React website, role-aware dashboards, a versioned Express REST API, MongoDB persistence, and a Render Blueprint for deployment.

> **Project status:** The app and deployment configuration are in this repository. A public deployment has not yet been completed. Replace the placeholder below after deploying.
>
> **Live website:** `https://<your-carepulse-frontend>.onrender.com`  
> **API health:** `https://<your-carepulse-api>.onrender.com/api/v1/health`

CarePulse is a portfolio/demo application. It is not certified HIPAA-compliant, is not intended for real patient care, and must not store real patient data. AI triage is routing support only, not diagnosis or treatment. Billing and insurance flows are simulations.

## Project deliverables

| Deliverable                 | Included                                                                                                        |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Hospital management website | React + TypeScript frontend with patient, doctor, and administrator workspaces                                  |
| Admin dashboard             | Operations overview, user directory, bed inventory, billing, claims, analytics, and audit trail                 |
| REST APIs                   | Express API under `/api/v1`; route overview in [API reference](docs/API.md) and interactive docs at `/api/docs` |
| Database design             | MongoDB/Mongoose model and relationship guide in [Database design](docs/DATABASE.md)                            |
| Deployment link             | Placeholder above; fill it in after creating the Render services                                                |
| Documentation               | Setup, API, database, deployment, and testing guides in `docs/`                                                 |

## Features

### Patient workspace

- Register and sign in as a patient.
- Submit symptom descriptions for cautious department routing, with a clear disclaimer and emergency keyword handling.
- Browse doctors and appointment availability; book, reschedule, and cancel appointments.
- View clinical records and prescriptions, download prescription PDFs, and submit simulated insurance claims.

### Doctor workspace

- View assigned appointments and patient directory entries associated with care assignments.
- Update appointment status, document consultations, and issue prescriptions.
- View doctor-level appointment analytics.

### Administrator workspace

- Review dashboard metrics and recent activity.
- Browse users, promote provisioned accounts to doctor role, and review audit events.
- Manage ward beds and patient admission/discharge status.
- Create bills, record simulated payments, and review insurance claims.

### Platform capabilities

- Short-lived access JWTs and HTTP-only refresh cookies.
- Server-side role checks, request validation, login/triage rate limits, and security headers.
- MongoDB persistence with unique indexes for appointment slots, beds, and prescriptions.
- Socket.IO events for appointment availability and bed status updates.
- Optional Gemini structured triage with a constrained fallback when the provider is unavailable or not configured.
- QR verification links on prescription PDFs.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Redux Toolkit, React Router, Axios, Recharts, Socket.IO client
- **Backend:** Node.js, Express 5, Mongoose, Zod, JWT, Socket.IO
- **Database:** MongoDB local or MongoDB Atlas
- **Optional AI:** Google Gemini API
- **Deployment:** Render Blueprint (`render.yaml`), with one Node web service and one static site

## Architecture

```text
Browser (React + TypeScript)
  ├── REST /api/v1 ───────────────┐
  └── Socket.IO ──────────────────┤
                                  ▼
                         Express API (Node.js)
                    auth · appointments · triage
                  clinical records · operations
                                  │
                                  ▼
                         MongoDB (Mongoose)
```

Domain routes and models are under `server/src/modules`. The database entities and key indexes are documented in [docs/DATABASE.md](docs/DATABASE.md). Endpoint groups and access notes are in [docs/API.md](docs/API.md).

## Requirements

- Node.js 20 or newer and npm
- A reachable MongoDB database (local MongoDB or MongoDB Atlas)
- Gemini API key only if you want model-assisted triage; the app has a limited fallback without it

## Local setup (Windows PowerShell)

From the project root:

```powershell
Copy-Item server/.env.example server/.env
```

Edit `server/.env` and set `MONGODB_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` to appropriate values. Keep `COOKIE_SECURE=false` for local HTTP development. The `.env` file is ignored by Git; never commit or share it.

Install and start:

```powershell
npm install
npm run seed   # optional: adds synthetic demo users and sample records
npm run dev
```

The seed uses a known shared demo password (`CarePulseDemo26!`). Use only with a disposable/demo database. If the seed fails, see [Testing and troubleshooting](docs/TESTING.md).

Local URLs:

| Resource             | URL                                       |
| -------------------- | ----------------------------------------- |
| Frontend             | http://localhost:5173                     |
| API base             | http://localhost:4000/api/v1              |
| Health check         | http://localhost:4000/api/v1/health       |
| Interactive API docs | http://localhost:4000/api/docs            |
| OpenAPI JSON         | http://localhost:4000/api/v1/openapi.json |

## Useful commands

```powershell
npm install       # install root and workspace dependencies
npm run dev       # run frontend and API together
npm run dev:client
npm run dev:server
npm run seed      # add/update synthetic demo records in configured database
npm test          # run server checks
npm run build     # TypeScript check and production frontend build
```

See [docs/TESTING.md](docs/TESTING.md) for verification steps and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Render setup.

## Deployment

The root-level `render.yaml` defines `carepulse-api` (Node web service) and `carepulse-web` (static site). Create a GitHub repository, push this project, then create a **Blueprint** in Render from that repository. Configure the secrets and URLs described in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

The Blueprint currently leaves the API compute plan unspecified. Check the plan and price Render shows before confirming deployment; Render's documented default for a new web service is a paid plan. Free services have limitations, including sleeping after inactivity. The React single-page app also needs a Render rewrite rule (`/*` → `/index.html`) for direct visits to client-side routes.

After deployment, replace the live URL placeholders at the top of this README with the URLs shown on the Render service pages. A placeholder is not evidence that a deployment exists.

## Security and scope

- This project is **not** certified HIPAA-compliant and is not a clinical product. Do not use it for diagnosis, treatment, emergencies, or real patient information.
- Gemini output is constrained and safety-checked, but it is not medical advice. Always use a qualified clinician for care decisions; emergency symptoms require immediate local emergency services.
- Demo seed accounts share a known password. Disable or change them before making a demo publicly accessible.
- Payment recording and claims are simulations; there is no payment processor, insurer connection, or real money movement.
- Email/SMS delivery, password reset, external file storage, and horizontally scaled Socket.IO are not implemented.
- See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment constraints and [docs/TESTING.md](docs/TESTING.md) for the checks this repository supports.

## Repository map

```text
client/                 React + TypeScript user interface
server/src/modules/     API domains, services, routes, and Mongoose models
server/test/             Automated server checks
docs/API.md               REST endpoint reference
docs/DATABASE.md          Data model and relationship reference
docs/DEPLOYMENT.md        Render and MongoDB deployment guide
docs/TESTING.md           Local validation and manual walkthrough
render.yaml               Render Blueprint for API and frontend
```
