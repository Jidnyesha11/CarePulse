# Implemented features

- Socket.IO appointment and bed change events; MongoDB unique active-slot index prevents double booking.
- Rule-based no-show risk from historical no-show ratio.
- Reminder endpoint with Nodemailer SMTP or safe console fallback.
- PDFKit prescriptions with QRCode verification URL and public verification endpoint.
- Central audit logging with actor/action/entity/timestamp/IP/user-agent.
- Bed/resource availability with live events.
- Telemedicine browser camera/microphone room; extend Socket.IO with WebRTC signaling for multi-party calls.
- Insurance claim lifecycle.
- MongoDB aggregation for peak appointment hours and diagnosis trends.
- OpenAI-compatible streaming clinical drafting endpoint using server-side credentials and SSE.
- Automated backend tests, frontend Vitest test and GitHub Actions CI.
