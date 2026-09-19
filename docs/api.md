# CarePulse API

Base path: `/api/v1`

### Auth
POST `/auth/register`, POST `/auth/login`, POST `/auth/refresh`, POST `/auth/logout`, GET `/auth/me`

### Doctors
GET `/doctors`
GET `/doctors/:doctorId/availability?date=YYYY-MM-DD`

### Appointments
GET `/appointments`
POST `/appointments`
PATCH `/appointments/:id/status`
POST `/appointments/:id/cancel`

### Medical records
GET `/records/:patientId`
POST `/records`

### Prescriptions
GET `/prescriptions`
POST `/prescriptions`
GET `/prescriptions/verify/:code`

### Billing
GET `/bills`
POST `/bills`
POST `/bills/:id/pay`

### Beds
GET `/beds`
PATCH `/beds/:id`

### AI
POST `/ai/triage`
POST `/ai/generate/stream`

The streaming endpoint returns `text/event-stream` with `start`, `delta`, `done`, and `error` events.

### Admin
GET `/admin/analytics`
GET `/admin/users`
PATCH `/admin/users/:id/status`
PATCH `/admin/users/:id/role`
GET `/admin/doctors`
GET `/admin/audit-logs`
