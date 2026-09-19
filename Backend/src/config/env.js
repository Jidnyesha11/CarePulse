import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshSecret: process.env.REFRESH_TOKEN_SECRET,
  refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  geminiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  triageModel: process.env.GEMINI_TRIAGE_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash"
};

for (const [key, value] of Object.entries(env)) {
  if (["mongoUri", "jwtSecret", "refreshSecret"].includes(key) && !value) {
    throw new Error(`${key} is missing from environment`);
  }
}
