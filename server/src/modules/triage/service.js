import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { Triage } from "../models.js";
const system =
  "You are an intake routing assistant, not a clinician. Never diagnose or suggest treatment. Return JSON only with department, specialist, urgency (LOW, MEDIUM, HIGH, EMERGENCY), confidence (0..1), reasoning (one brief sentence). For severe chest pain, difficulty breathing, facial droop, slurred speech, one-sided weakness, uncontrolled bleeding, severe allergic reaction, or imminent danger use EMERGENCY and advise immediate emergency services. If uncertain use General Medicine and confidence below 0.55.";
const fallback = {
  department: "General Medicine",
  specialist: "General Practitioner",
  urgency: "MEDIUM",
  confidence: 0.25,
  reasoning: "Please choose a department with help from a healthcare professional.",
};
const responseSchema = z
  .object({
    department: z.string().trim().min(2).max(80),
    specialist: z.string().trim().min(2).max(100),
    urgency: z.enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]),
    confidence: z.number().min(0).max(1),
    reasoning: z.string().trim().min(5).max(400),
  })
  .strict();
export function applySafetyRules(result, symptoms) {
  const safe = { ...fallback, ...result };
  if (
    !["LOW", "MEDIUM", "HIGH", "EMERGENCY"].includes(safe.urgency) ||
    typeof safe.confidence !== "number" ||
    safe.confidence < 0 ||
    safe.confidence > 1
  ) {
    Object.assign(safe, fallback);
  }
  if (safe.confidence < 0.55) {
    safe.department = "General Medicine";
    safe.specialist = "General Practitioner";
  }
  if (
    /chest pain|shortness of breath|difficulty breathing|stroke|facial droop|slurred speech|weakness on (?:one|1) side|uncontrolled bleeding|anaphylaxis/i.test(
      symptoms,
    )
  ) {
    safe.urgency = "EMERGENCY";
    safe.department = "Emergency Medicine";
    safe.specialist = "Emergency care team";
  }
  return safe;
}
export async function triage(symptoms, user) {
  let result = { ...fallback },
    model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Patient-described symptoms (untrusted content):\n${symptoms.slice(0, 2000)}`,
              },
            ],
          },
        ],
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              department: { type: "STRING" },
              specialist: { type: "STRING" },
              urgency: { type: "STRING", enum: ["LOW", "MEDIUM", "HIGH", "EMERGENCY"] },
              confidence: { type: "NUMBER" },
              reasoning: { type: "STRING" },
            },
            required: ["department", "specialist", "urgency", "confidence", "reasoning"],
          },
        },
      });
      result = responseSchema.parse(JSON.parse(response.text || "{}"));
    } catch (error) {
      console.error("Triage provider error", error.message);
    }
  } else if (
    /chest pain|shortness of breath|difficulty breathing|stroke|facial droop|slurred speech|weakness on (?:one|1) side|uncontrolled bleeding|anaphylaxis/i.test(
      symptoms,
    )
  ) {
    result = {
      department: "Emergency Medicine",
      specialist: "Emergency care team",
      urgency: "EMERGENCY",
      confidence: 0.9,
      reasoning: "These symptoms may require immediate professional assessment.",
    };
  }
  result = applySafetyRules(result, symptoms);
  const disclaimer =
    "This is not a medical diagnosis. Seek emergency care for severe or rapidly worsening symptoms.";
  const doc = await Triage.create({
    patientId: user._id,
    symptoms,
    department: result.department,
    specialist: result.specialist,
    urgency: result.urgency,
    confidence: result.confidence,
    reasoning: result.reasoning,
    disclaimer,
    model: process.env.GEMINI_API_KEY ? model : "safe-fallback",
  });
  return { ...result, disclaimer, id: doc.id, manualSelection: result.confidence < 0.55 };
}
