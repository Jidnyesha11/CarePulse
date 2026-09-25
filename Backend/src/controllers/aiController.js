import {
  triageSymptoms,
  generateContent,
} from "../services/aiProvider.js";

export async function triage(req, res) {
  try {
    const {
      symptoms,
      age,
      gender,
      medicalHistory,
    } = req.body;

    if (!symptoms || !String(symptoms).trim()) {
      return res.status(400).json({
        success: false,
        message: "Symptoms are required.",
      });
    }

    const result = await triageSymptoms({
      symptoms: String(symptoms).trim(),
      age,
      gender,
      medicalHistory,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "AI TRIAGE ERROR:",
      error?.message || error
    );

    return res.status(503).json({
      success: false,
      message: "AI triage service is temporarily unavailable.",
      error:
        process.env.NODE_ENV === "development"
          ? error?.message
          : undefined,
    });
  }
}

export async function generate(req, res) {
  try {
    const { prompt } = req.body;

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required.",
      });
    }

    const result = await generateContent(
      String(prompt).trim()
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "AI GENERATE ERROR:",
      error?.message || error
    );

    return res.status(503).json({
      success: false,
      message: "AI generation service is temporarily unavailable.",
      error:
        process.env.NODE_ENV === "development"
          ? error?.message
          : undefined,
    });
  }
}