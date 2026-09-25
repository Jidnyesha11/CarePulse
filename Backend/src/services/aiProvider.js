import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

const ai = apiKey
  ? new GoogleGenAI({ apiKey })
  : null;

const MODEL =
  process.env.GEMINI_TRIAGE_MODEL ||
  process.env.GEMINI_MODEL ||
  "gemini-2.5-flash";

function getAI() {
  if (!ai) {
    throw new Error(
      "GEMINI_API_KEY is missing. Check Backend/.env and restart the backend."
    );
  }

  return ai;
}

async function generateWithRetry(contents, config = {}, attempts = 2) {
  const client = getAI();

  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await client.models.generateContent({
        model: MODEL,
        contents,
        config,
      });
    } catch (error) {
      lastError = error;

      console.error(
        `Gemini request failed (attempt ${attempt}/${attempts}):`,
        error?.message || error
      );

      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  throw lastError;
}

export async function triageSymptoms({
  symptoms,
  age,
  gender,
  medicalHistory,
}) {
  const prompt = `
You are the CarePulse AI clinical triage assistant.

This is informational guidance only and NOT a medical diagnosis.

Patient:
Age: ${age || "Not provided"}
Gender: ${gender || "Not provided"}
Medical history: ${medicalHistory || "Not provided"}

Symptoms:
${symptoms}

Return ONLY valid JSON in exactly this structure:

{
  "urgency": "low",
  "confidence": 75,
  "summary": "Brief explanation",
  "possibleConditions": [
    "Possibility 1",
    "Possibility 2"
  ],
  "recommendedActions": [
    "Action 1",
    "Action 2"
  ],
  "redFlags": [
    "Red flag 1"
  ],
  "department": "General Medicine",
  "disclaimer": "This is informational guidance and not a medical diagnosis."
}

Rules:
- urgency must be one of: low, medium, high, emergency
- confidence must be a number from 0 to 100
- department should be the most relevant hospital department
- Do not claim a diagnosis.
- If emergency warning signs are present, clearly recommend immediate emergency medical care.
`;

  const response = await generateWithRetry(
    prompt,
    {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
    2
  );

  const text = response?.text || "";

  try {
    const parsed = JSON.parse(text);

    return {
      urgency: parsed.urgency || "medium",
      confidence:
        typeof parsed.confidence === "number"
          ? parsed.confidence
          : 50,
      summary: parsed.summary || "",
      possibleConditions: Array.isArray(parsed.possibleConditions)
        ? parsed.possibleConditions
        : [],
      recommendedActions: Array.isArray(parsed.recommendedActions)
        ? parsed.recommendedActions
        : [],
      redFlags: Array.isArray(parsed.redFlags)
        ? parsed.redFlags
        : [],
      department: parsed.department || "General Medicine",
      disclaimer:
        parsed.disclaimer ||
        "This is informational guidance and not a medical diagnosis.",
    };
  } catch (error) {
    console.error("Failed to parse Gemini triage response:", text);

    return {
      urgency: "medium",
      confidence: 50,
      summary: text || "Unable to generate a structured assessment.",
      possibleConditions: [],
      recommendedActions: [
        "Consult a qualified healthcare professional.",
      ],
      redFlags: [],
      department: "General Medicine",
      disclaimer:
        "This is informational guidance and not a medical diagnosis.",
    };
  }
}

/*
 * Normal generation.
 * We are keeping this non-streaming for reliability.
 */
export async function generateContent(prompt) {
  const response = await generateWithRetry(
    prompt,
    {
      temperature: 0.7,
    },
    2
  );

  return response?.text || "";
}

/*
 * Kept for compatibility with your existing controller.
 */
export async function streamGeneration(prompt, onChunk) {
  const text = await generateContent(prompt);

  if (typeof onChunk === "function" && text) {
    await onChunk(text);
  }

  return text;
}