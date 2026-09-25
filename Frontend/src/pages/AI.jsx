import { useState } from "react";
import {
  Brain,
  Sparkles,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import api from "../api";

export default function AI() {
  // -------------------------
  // TRIAGE
  // -------------------------

  const [symptoms, setSymptoms] = useState("");
  const [triageResult, setTriageResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // -------------------------
  // GENERATOR
  // -------------------------

  const [prompt, setPrompt] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");

  const handleAnalyze = async (event) => {
    event.preventDefault();

    if (!symptoms.trim()) {
      setError("Please enter symptoms first.");
      return;
    }

    try {
      setError("");
      setAnalyzing(true);
      setTriageResult(null);

      const response = await api.post("/ai/triage", {
        symptoms: symptoms.trim(),
      });

      setTriageResult(
        response.data?.data || response.data
      );
    } catch (error) {
      console.error("Triage error:", error);

      setError(
        error?.response?.data?.message ||
          "AI triage is temporarily unavailable."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerate = async (event) => {
  event.preventDefault();

  if (!prompt.trim()) {
    setError("Please enter a prompt first.");
    return;
  }

  try {
    setError("");
    setGeneratedText("");
    setGenerating(true);

    const token = localStorage.getItem("accessToken");

    const response = await fetch(
      "http://localhost:5000/api/v1/ai/generate/stream",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          prompt: prompt.trim(),
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();

      throw new Error(
        text || `Request failed with ${response.status}`
      );
    }

    if (!response.body) {
      throw new Error("AI stream is not available.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let result = "";

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, {
        stream: true,
      });

      result += chunk;

      // Handle SSE data lines
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data:")) {
          const data = line
            .replace(/^data:\s*/, "")
            .trim();

          if (!data || data === "[DONE]") {
            continue;
          }

          try {
            const parsed = JSON.parse(data);

            const text =
              parsed.text ||
              parsed.content ||
              parsed.delta ||
              "";

            if (text) {
              setGeneratedText((previous) => previous + text);
            }
          } catch {
            // Some servers send plain text chunks.
            setGeneratedText(
              (previous) => previous + data
            );
          }
        }
      }
    }

    // Fallback if the backend returned plain text
    if (!result.includes("data:") && result.trim()) {
      setGeneratedText(result);
    }
  } catch (error) {
    console.error("Generate error:", error);

    setError(
      error?.message ||
        "AI generation is temporarily unavailable."
    );
  } finally {
    setGenerating(false);
  }
};

  const confidence = Number(
    triageResult?.confidence
  );

  return (
    <div className="page-container">

      <div className="page-header">
        <div>
          <p className="eyebrow">
            CarePulse Intelligence
          </p>

          <h1>AI Assistant</h1>

          <p className="page-subtitle">
            AI-powered clinical assistance for
            symptom triage and healthcare content.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* =========================
          TRIAGE
      ========================== */}

      <section className="card">

        <div className="card-header">
          <div>
            <h2>
              <Brain size={20} />
              AI Symptom Triage
            </h2>

            <p>
              Get informational guidance about
              symptoms before booking an appointment.
            </p>
          </div>
        </div>

        <form onSubmit={handleAnalyze}>

          <div className="form-group">

            <label>
              Symptoms
            </label>

            <textarea
              value={symptoms}
              onChange={(event) =>
                setSymptoms(event.target.value)
              }
              placeholder="Describe the patient's symptoms..."
              rows={5}
            />

          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <Loader2
                  size={17}
                  className="spin"
                />
                Analyzing...
              </>
            ) : (
              <>
                <Brain size={17} />
                Analyze
              </>
            )}
          </button>

        </form>

        {triageResult && (
          <div className="ai-result">

            <div className="result-header">

              <div>
                <h3>
                  Triage Assessment
                </h3>

                <p>
                  {triageResult.summary}
                </p>
              </div>

              <span
                className={`status-badge status-${String(
                  triageResult.urgency || "medium"
                ).toLowerCase()}`}
              >
                {triageResult.urgency || "medium"}
              </span>

            </div>

            <div className="ai-result-grid">

              <div>
                <strong>
                  Confidence
                </strong>

                <span>
                  {Number.isFinite(confidence)
                    ? `${Math.round(confidence)}%`
                    : "Not available"}
                </span>
              </div>

              <div>
                <strong>
                  Suggested Department
                </strong>

                <span>
                  {triageResult.department ||
                    "General Medicine"}
                </span>
              </div>

            </div>

            {triageResult.possibleConditions?.length >
              0 && (
              <div className="result-section">

                <h4>
                  Possible Conditions
                </h4>

                <ul>
                  {triageResult.possibleConditions.map(
                    (item, index) => (
                      <li key={index}>
                        {item}
                      </li>
                    )
                  )}
                </ul>

              </div>
            )}

            {triageResult.recommendedActions?.length >
              0 && (
              <div className="result-section">

                <h4>
                  Recommended Actions
                </h4>

                <ul>
                  {triageResult.recommendedActions.map(
                    (item, index) => (
                      <li key={index}>
                        {item}
                      </li>
                    )
                  )}
                </ul>

              </div>
            )}

            {triageResult.redFlags?.length >
              0 && (
              <div className="result-section">

                <h4>
                  Red Flags
                </h4>

                <ul>
                  {triageResult.redFlags.map(
                    (item, index) => (
                      <li key={index}>
                        {item}
                      </li>
                    )
                  )}
                </ul>

              </div>
            )}

            <p className="ai-disclaimer">
              {triageResult.disclaimer ||
                "This is informational guidance and not a medical diagnosis."}
            </p>

          </div>
        )}

      </section>

      {/* =========================
          GENERATOR
      ========================== */}

      <section className="card">

        <div className="card-header">

          <div>
            <h2>
              <Sparkles size={20} />
              Streaming Assistant
            </h2>

            <p>
              Ask for patient-friendly healthcare
              administration content, clinical summaries, or
              educational materials.
            </p>
          </div>

        </div>

        <form onSubmit={handleGenerate}>

          <div className="form-group">

            <label>
              Prompt
            </label>

            <textarea
              value={prompt}
              onChange={(event) =>
                setPrompt(event.target.value)
              }
              placeholder="Example: Explain hypertension in simple language for a patient."
              rows={5}
            />

          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2
                  size={17}
                  className="spin"
                />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={17} />
                Generate
              </>
            )}
          </button>

        </form>

        {generatedText && (
          <div className="ai-result">

            <div className="result-header">
              <h3>
                Generated Content
              </h3>
            </div>

            <div className="generated-content">
              {generatedText}
            </div>

          </div>
        )}

      </section>

    </div>
  );
}