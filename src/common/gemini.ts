import { getEnv, getEnvOptional } from "./env.js";
import { requestJson } from "./http.js";

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

export class GeminiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(params?: { apiKey?: string; baseUrl?: string; model?: string }) {
    this.apiKey = params?.apiKey ?? getEnv("GEMINI_API_KEY");
    this.baseUrl = (
      params?.baseUrl ??
      getEnvOptional("GEMINI_BASE_URL") ??
      "https://generativelanguage.googleapis.com/v1beta"
    ).replace(/\/$/, "");
    this.model =
      params?.model ?? getEnvOptional("GEMINI_MODEL") ?? "gemini-2.0-flash";
  }

  async generateText(prompt: string): Promise<string> {
    const url = `${this.baseUrl}/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const res = await requestJson<GeminiGenerateContentResponse>(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    const text =
      res.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ??
      "";
    return text.trim();
  }
}

export function extractJsonArray(text: string): unknown[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemini response did not contain a JSON array");
  }
  const json = text.slice(start, end + 1);
  const parsed = JSON.parse(json) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Parsed Gemini JSON was not an array");
  }
  return parsed;
}
