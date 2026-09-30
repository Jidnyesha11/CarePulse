# Testing

Run `npm test` for deterministic unit checks. Run `npm run build` for TypeScript and production-bundle verification. For API smoke checks, start MongoDB, configure `server/.env`, run `npm run seed`, start with `npm run dev`, then open `/api/docs` and `/api/v1/health`.

Suggested manual workflow:

1. Sign in as a patient and submit a symptom description; verify disclaimer and conservative low-confidence handling.
2. Open a doctor availability calendar and book a slot. Open the same calendar in a second session and observe slot changes without refreshing.
3. Attempt to book the same slot from a second session and verify HTTP 409.
4. Sign in as a doctor, document an assigned consultation, issue a prescription, and verify the record and prescription appear for the patient.
5. Download a prescription PDF and scan its QR code to open the public verification endpoint. Confirm it reveals prescription authenticity/details without patient identity.
6. Sign in as admin and inspect database-derived dashboard counts, bed inventory, admit/discharge a patient, check claims and audit events, and record a simulated bill payment.

These integration steps require a running database and are not represented as completed merely by the unit or build checks.
