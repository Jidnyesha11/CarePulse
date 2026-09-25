# HMS — Hospital Management System

Modern MERN healthcare capstone with Socket.IO live doctor slots and beds, no-show risk/reminders, QR-verifiable PDF prescriptions, audit trails, resource management, telemedicine room, insurance claims, analytics, tests and CI/CD.

## Run
Backend:
`cd Backend && npm install && copy .env.example .env && npm run seed && npm run dev`

Frontend:
`cd Frontend && npm install && copy .env.example .env && npm run dev`

Demo: `admin@hms.local / Admin@12345`, `doctor@hms.local / Doctor@12345`, `patient@hms.local / Patient@12345`.

Optional real OpenAI-compatible provider:
`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`. API credentials stay on the backend.
Optional SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.

Educational project only; real healthcare deployment requires jurisdiction-specific privacy/security/compliance review.
