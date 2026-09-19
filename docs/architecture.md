# CarePulse Architecture

CarePulse uses a modular monolith: one Node/Express deployment with bounded modules for authentication, appointments, records, prescriptions, billing, beds, AI, realtime events and auditing.

## Security
React sends a short-lived JWT access token. Express authenticates it and then applies role middleware. Refresh tokens are httpOnly cookies. UI hiding is not treated as authorization.

## Appointment consistency
A MongoDB unique compound index on doctor/date/timeSlot for active statuses protects the booking boundary. Duplicate-key errors become HTTP 409 SLOT_CONFLICT.

## Realtime
Socket.IO namespace `/appointments` lets clients watch a doctor's room. Booking and cancellation emit slot events.

## AI
`services/aiProvider.js` is the provider boundary. It uses the Google GenAI SDK and supports any compatible base URL. Streaming uses the Responses API stream and maps output deltas to Server-Sent Events.

## Sensitive data
Medical record, prescription, bill, appointment, bed and AI operations create audit entries. CarePulse is a demo architecture and not a certified healthcare/compliance system.
