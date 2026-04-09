import { getEnv, getEnvInt, getEnvOptional } from "./env.js";
import { downloadToFile, requestJson } from "./http.js";

type StartResponse = { request_id: string };
type PollResponse = {
  status: "pending" | "done" | "expired" | "failed";
  video?: { url?: string; duration?: number; respect_moderation?: boolean };
};

export class GrokImagineVideoGenerator {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly pollIntervalMs: number;
  private readonly pollTimeoutMs: number;

  constructor(params?: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    pollIntervalMs?: number;
    pollTimeoutMs?: number;
  }) {
    this.apiKey = params?.apiKey ?? getEnv("XAI_API_KEY");
    this.baseUrl = (
      params?.baseUrl ??
      getEnvOptional("XAI_BASE_URL") ??
      "https://api.x.ai"
    ).replace(/\/$/, "");
    this.model =
      params?.model ??
      getEnvOptional("XAI_VIDEO_MODEL") ??
      "grok-imagine-video";
    this.pollIntervalMs =
      params?.pollIntervalMs ?? getEnvInt("XAI_VIDEO_POLL_INTERVAL_MS", 5000);
    this.pollTimeoutMs =
      params?.pollTimeoutMs ??
      getEnvInt("XAI_VIDEO_POLL_TIMEOUT_MS", 15 * 60 * 1000);
  }

  async generateToFile(params: {
    prompt: string;
    outFilePath: string;
    durationSeconds?: number;
    aspectRatio?: string;
    resolution?: "480p" | "720p";
    imageUrl?: string;
  }): Promise<{ videoUrl: string; requestId: string }> {
    const requestId = await this.start(params);
    const videoUrl = await this.pollUntilDone(requestId);
    await downloadToFile(videoUrl, params.outFilePath);
    return { videoUrl, requestId };
  }

  async start(params: {
    prompt: string;
    durationSeconds?: number;
    aspectRatio?: string;
    resolution?: "480p" | "720p";
    imageUrl?: string;
  }): Promise<string> {
    const url = `${this.baseUrl}/v1/videos/generations`;
    const duration =
      params.durationSeconds ?? getEnvInt("XAI_VIDEO_DURATION_SECONDS", 10);
    const aspectRatio =
      params.aspectRatio ?? getEnvOptional("XAI_VIDEO_ASPECT_RATIO") ?? "9:16";
    const resolution =
      params.resolution ??
      (getEnvOptional("XAI_VIDEO_RESOLUTION") as "480p" | "720p" | undefined) ??
      "720p";

    const body: Record<string, unknown> = {
      model: this.model,
      prompt: params.prompt,
      duration,
      aspect_ratio: aspectRatio,
      resolution,
    };
    if (params.imageUrl) body.image_url = params.imageUrl;

    const res = await requestJson<StartResponse>(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.request_id) throw new Error("xAI response missing request_id");
    return res.request_id;
  }

  async pollUntilDone(requestId: string): Promise<string> {
    const started = Date.now();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (Date.now() - started > this.pollTimeoutMs) {
        throw new Error(
          `xAI video generation timed out after ${this.pollTimeoutMs}ms (request_id=${requestId})`,
        );
      }
      const res = await this.get(requestId);
      if (res.status === "done") {
        const url = res.video?.url;
        if (!url) throw new Error("xAI poll response missing video.url");
        return url;
      }
      if (res.status === "failed")
        throw new Error(
          `xAI video generation failed (request_id=${requestId})`,
        );
      if (res.status === "expired")
        throw new Error(
          `xAI video generation expired (request_id=${requestId})`,
        );
      await sleep(this.pollIntervalMs);
    }
  }

  async get(requestId: string): Promise<PollResponse> {
    const url = `${this.baseUrl}/v1/videos/${encodeURIComponent(requestId)}`;
    return requestJson<PollResponse>(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
