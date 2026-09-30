# CarePulse REST API reference

The Express API is versioned under `/api/v1`. When the server is running locally, interactive Swagger UI is available at `http://localhost:4000/api/docs` and the current OpenAPI document at `http://localhost:4000/api/v1/openapi.json`.

The generated OpenAPI document currently covers only core routes. This reference summarizes all route groups currently mounted by the application; route source and Zod schemas remain authoritative for request fields and detailed response shapes.

## Authentication and response conventions

- Protected endpoints use `Authorization: Bearer <access-token>`.
- Successful login/register returns an access token and sets a refresh token in an HTTP-only cookie scoped to `/api/v1/auth`.
- JSON responses use a shared success/error envelope from `server/src/utils/http.js`.
- Protected operations enforce roles on the server. The UI's role-specific navigation is not a security boundary.
- Validation failures return `400`; authentication/authorization failures use `401`/`403`; missing records use `404`; conflicts such as a taken appointment slot use `409`.

## Endpoint map

`Auth` means a valid session is required. `Patient`, `Doctor`, and `Admin` refer to the corresponding server role. Some authenticated list endpoints scope returned records to the signed-in user.

### Health and authentication

| Method | Path             | Access               | Purpose                                                      |
| ------ | ---------------- | -------------------- | ------------------------------------------------------------ |
| GET    | `/health`        | Public               | API health response                                          |
| POST   | `/auth/register` | Public               | Register a patient account; clients cannot register as admin |
| POST   | `/auth/login`    | Public, rate limited | Sign in and receive access token + refresh cookie            |
| POST   | `/auth/refresh`  | Refresh cookie       | Rotate/refresh the access session                            |
| POST   | `/auth/logout`   | Public               | Clear the refresh cookie                                     |
| GET    | `/auth/me`       | Auth                 | Return current user summary                                  |

### Triage and appointments

| Method | Path                                   | Access                        | Purpose                                                          |
| ------ | -------------------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| POST   | `/triage`                              | Patient, rate limited         | Create symptom-routing result; not a diagnosis                   |
| GET    | `/appointments`                        | Auth                          | List appointments, scoped for patient/doctor; admin can view all |
| GET    | `/appointments/availability/:doctorId` | Auth                          | Get available slots for a doctor; optional `date` query          |
| POST   | `/appointments`                        | Patient                       | Book an available future slot                                    |
| PATCH  | `/appointments/:id/cancel`             | Patient/assigned doctor/Admin | Cancel an eligible appointment, subject to ownership checks      |
| PATCH  | `/appointments/:id/reschedule`         | Patient                       | Reschedule an eligible appointment                               |
| PATCH  | `/appointments/:id/status`             | Doctor/Admin                  | Set an allowed appointment status                                |

### Clinical, doctors, bills, and claims

| Method | Path                          | Access                         | Purpose                                                             |
| ------ | ----------------------------- | ------------------------------ | ------------------------------------------------------------------- |
| GET    | `/doctor/analytics`           | Doctor                         | Appointment summary for the current doctor                          |
| GET    | `/records`                    | Auth                           | List records scoped by role                                         |
| POST   | `/records/:appointmentId`     | Doctor assigned to appointment | Create/update visit note and complete appointment                   |
| GET    | `/prescriptions`              | Auth                           | List prescriptions scoped by role                                   |
| POST   | `/prescriptions`              | Doctor                         | Issue prescription for a record owned by doctor                     |
| GET    | `/prescriptions/verify/:code` | Public                         | Verify a prescription code; returns limited authenticity details    |
| GET    | `/prescriptions/:id/pdf`      | Auth                           | Download an authorized prescription PDF                             |
| GET    | `/doctors`                    | Auth                           | Search doctor directory; optional `department` and `search` queries |
| GET    | `/patients`                   | Doctor/Admin                   | View patient directory; doctor results are assignment-scoped        |
| GET    | `/bills`                      | Patient/Admin                  | List bills scoped to patient or all bills for admin                 |
| GET    | `/claims`                     | Patient/Admin                  | List claims scoped to patient or all claims for admin               |
| POST   | `/claims`                     | Patient                        | Submit a simulated insurance claim for the patient's bill           |

### Administration and operations

| Method | Path                          | Access | Purpose                                                                |
| ------ | ----------------------------- | ------ | ---------------------------------------------------------------------- |
| GET    | `/admin/beds`                 | Admin  | List beds                                                              |
| POST   | `/admin/beds`                 | Admin  | Add a bed                                                              |
| PATCH  | `/admin/beds/:id/status`      | Admin  | Change bed status and admission assignment                             |
| GET    | `/admin/audit`                | Admin  | Browse paginated audit events                                          |
| GET    | `/admin/analytics`            | Admin  | Dashboard counts, appointment trends, beds, revenue, recent activity   |
| GET    | `/admin/users`                | Admin  | Browse user directory, optionally filtered by role                     |
| POST   | `/admin/users/:id/doctors`    | Admin  | Promote an existing user to doctor and set department/specialty        |
| GET    | `/admin/claims`               | Admin  | List claims with patient and bill summaries                            |
| POST   | `/admin/bills/:appointmentId` | Admin  | Create a bill for an appointment; default demo charge if no line items |
| PATCH  | `/admin/bills/:id/payment`    | Admin  | Record simulated payment (`status: PAID`)                              |

## Real-time events

Socket.IO uses the API origin (without `/api/v1`) and authenticates with the access token in the connection `auth` payload. Events currently used include appointment slot booked/released/created/rescheduled and bed status updated. The in-memory Socket.IO setup is intended for a single API instance; horizontal scaling needs a shared adapter and deployment configuration.

## Example requests

Register a patient:

```http
POST /api/v1/auth/register
Content-Type: application/json

{"name":"Sample Patient","email":"patient@example.test","password":"Use-A-Unique-Password-123!"}
```

Book an appointment (send the returned access token as a bearer token):

```http
POST /api/v1/appointments
Authorization: Bearer <access-token>
Content-Type: application/json

{"doctorId":"<doctor-object-id>","date":"YYYY-MM-DD","timeSlot":"10:30","department":"Cardiology","reason":"Follow-up"}
```

Use synthetic information only. See [Testing](TESTING.md) for a role-based manual walkthrough and [Database design](DATABASE.md) for the collections and relationships.
