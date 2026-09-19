import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { AppError } from "../utils/http.js";

let client;

function getClient() {
  if (!env.geminiKey) {
    throw new AppError("Gemini AI is not configured. Add GEMINI_API_KEY to Backend/.env", 503, "AI_NOT_CONFIGURED");
  }
  client ||= new GoogleGenAI({ apiKey: env.geminiKey });
  return client;
}

const SYSTEM = `You are CarePulse AI, an assistant inside a hospital management platform.
You may help with administrative, educational and patient-communication tasks.
Never diagnose, prescribe medication, or replace a clinician.
Keep medical explanations clear and cautious. For clinical emergencies, advise immediate professional care.`;

export async function streamGeneration({ prompt, type, onDelta }) {
  const ai = getClient();
  const stream = await ai.models.generateContentStream({
    model: env.geminiModel,
    config: {
      systemInstruction: `${SYSTEM}
Content type: ${type}.`
    },
    contents: prompt
  });

  let result = "";
  for await (const chunk of stream) {
    const text = chunk.text || "";
    if (text) {
      result += text;
      await onDelta(text);
    }
  }

  return { result, model: env.geminiModel };
}

export async function triageSymptoms(symptoms) {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: env.triageModel,
    config: {
      systemInstruction: `${SYSTEM}
For symptom triage, return ONLY valid JSON with:
department: practical department/specialist,
urgency: one of routine, soon, urgent, emergency,
confidence: number from 0 to 1,
disclaimer: a short statement that this is not a medical diagnosis.
If symptoms may represent an emergency, use emergency.`
    },
    contents: symptoms
  });

  try {
    const x = JSON.parse(response.text || "{}");
    return {
      department: String(x.department || "General Medicine"),
      urgency: ["routine", "soon", "urgent", "emergency"].includes(x.urgency) ? x.urgency : "routine",
      confidence: Math.max(0, Math.min(1, Number(x.confidence) || 0)),
      disclaimer: "This is not a medical diagnosis. Seek professional medical care for clinical decisions."
    };
  } catch {
    throw new AppError("Gemini returned an invalid triage response", 502, "AI_INVALID_RESPONSE");
  }
}
