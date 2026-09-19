# Gemini Setup

1. Create a Gemini API key through Google AI Studio.
2. Copy `Backend/.env.example` to `Backend/.env`.
3. Set `GEMINI_API_KEY`.
4. Keep the key only in the backend environment.
5. Set the model names according to the models available to your account/project.
6. Start the backend and test `/api/v1/health`.
7. Open the AI page and test symptom triage or streaming generation.

The backend isolates provider-specific logic in `src/services/aiProvider.js`, so changing models later does not require changing controllers or frontend contracts.

Free-tier quota, model availability and rate limits are controlled by Google's current service terms and account eligibility.
