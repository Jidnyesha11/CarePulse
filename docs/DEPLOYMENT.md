# Deployment guide

CarePulse is configured for Render with the root `render.yaml`. It provisions two services from one Git repository:

- `carepulse-api`: Node web service rooted at `server/`.
- `carepulse-web`: static site rooted at `client/`.

## Before deployment

1. Push the repository to GitHub (or another Git provider supported by Render). Ensure `server/.env` is ignored and is not committed.
2. Create a dedicated MongoDB Atlas database and least-privilege database user. Use a fresh password and a separate demo database.
3. Allow the Render service's outbound IP ranges in the Atlas network access list. Avoid unrestricted network access where possible.
4. Run `npm run build` and `npm test` locally. To populate a demo database, set local `MONGODB_URI` to the same Atlas database and run `npm run seed` once. The seed contains synthetic users with a known shared password; only use it in a disposable demo database.

## Create the Render Blueprint

1. In Render, connect the Git provider account that has access to this repository.
2. Choose **New → Blueprint**, select the repository and deployment branch, and let Render load the root `render.yaml`.
3. Review both proposed services and their compute plans before deploying. `render.yaml` currently omits `plan` on the API service; Render's default for a new web service is a paid compute plan. Choose/set an appropriate plan deliberately and check the price shown in Render.
4. Provide the initial values for each `sync: false` variable:

| Service | Variable         | Value                                                                       |
| ------- | ---------------- | --------------------------------------------------------------------------- |
| API     | `MONGODB_URI`    | Atlas URI for the dedicated demo database                                   |
| API     | `CLIENT_URL`     | Exact frontend origin, e.g. `https://carepulse-web.onrender.com`            |
| API     | `PUBLIC_API_URL` | API origin only, e.g. `https://carepulse-api.onrender.com`                  |
| API     | `GEMINI_API_KEY` | New Gemini API key, or leave blank if the UI permits and using fallback     |
| Web     | `VITE_API_URL`   | API origin plus `/api/v1`, e.g. `https://carepulse-api.onrender.com/api/v1` |

Render generates `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` from the Blueprint. If Render assigns different service URLs (for example because a name is already taken), use the actual URLs shown in the dashboard and update all three URL values. `CLIENT_URL` must have no trailing slash. `VITE_API_URL` must end with `/api/v1`.

Render prompts for Blueprint `sync: false` values during initial creation; subsequent changes to those values are made in the service's Environment settings. The Vite variable is embedded at frontend build time, so redeploy the static site after changing `VITE_API_URL`.

## Post-deployment configuration

1. Wait for both services to finish deploying. The API Blueprint health check is `/api/v1/health`; inspect API logs if it does not pass.
2. Confirm API health at `https://<api-host>/api/v1/health` and interactive API docs at `https://<api-host>/api/docs`.
3. Confirm the API has the exact deployed frontend origin in `CLIENT_URL` and its own base origin in `PUBLIC_API_URL`.
4. Confirm `VITE_API_URL=https://<api-host>/api/v1` in the static site settings, save, then trigger a new frontend deploy.
5. In the static site **Redirects/Rewrites** settings, add `/*` → `/index.html` with action **Rewrite** to support React Router deep links and refreshes.
6. Visit the frontend URL, test patient registration/login, then verify role-specific workflows. Demo account access requires seeded data.
7. Replace the deployment URL placeholders in the root README with the real frontend and API URLs only after deployment succeeds.

## Secrets and demo data

- Never commit `.env`, database URIs, JWT secrets, or Gemini keys. Do not place secrets in `VITE_*` variables; frontend variables are visible to browser users.
- Rotate credentials that have been pasted into chats, tickets, source files, or logs.
- The seeded accounts share a publicly known demo password. Disable them or change their credentials before sharing a public demo.
- Do not seed real patient data. The project is not certified for regulated healthcare workloads.

## Platform constraints

- A free Render web service may sleep after inactivity, causing cold starts. Verify the chosen plan and current limits in Render before deployment.
- MongoDB Atlas must allow network connections from the deployed API service.
- Socket.IO events use one API process; scaling horizontally requires a shared adapter and compatible connection handling.
- Local filesystem files are not durable across redeploys. External uploads and reminders are not implemented.
- Billing and insurance actions are simulations, not payment or insurer integrations.
