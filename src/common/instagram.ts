import { readFile, stat } from "node:fs/promises";
import { getEnv, getEnvInt, getEnvOptional } from "./env.js";
import { requestJson } from "./http.js";

type ContainerCreateResponse = { id: string };
type PublishResponse = { id: string };
type StatusResponse = {
  status_code?: "EXPIRED" | "ERROR" | "FINISHED" | "IN_PROGRESS" | "PUBLISHED";
};

export class InstagramReelsUploader {
  private readonly accessToken: string;
  private readonly igUserId: string;
  private readonly graphBaseUrl: string;
  private readonly apiVersion: string;
  private readonly pollIntervalMs: number;
  private readonly pollMaxAttempts: number;

  constructor(params?: {
    accessToken?: string;
    igUserId?: string;
    graphBaseUrl?: string;
    apiVersion?: string;
    pollIntervalMs?: number;
    pollMaxAttempts?: number;
  }) {
    this.accessToken = params?.accessToken ?? getEnv("INSTAGRAM_ACCESS_TOKEN");
    this.igUserId = params?.igUserId ?? getEnv("INSTAGRAM_IG_USER_ID");
    this.graphBaseUrl = (
      params?.graphBaseUrl ??
      getEnvOptional("INSTAGRAM_GRAPH_BASE_URL") ??
      "https://graph.facebook.com"
    ).replace(/\/$/, "");
    this.apiVersion =
      params?.apiVersion ?? getEnvOptional("INSTAGRAM_API_VERSION") ?? "v25.0";
    this.pollIntervalMs =
      params?.pollIntervalMs ??
      getEnvInt("INSTAGRAM_UPLOAD_POLL_INTERVAL_MS", 60000);
    this.pollMaxAttempts =
      params?.pollMaxAttempts ??
      getEnvInt("INSTAGRAM_UPLOAD_POLL_MAX_ATTEMPTS", 10);
  }

  async uploadReelFromFile(params: {
    filePath: string;
    caption: string;
  }): Promise<string> {
    const containerId = await this.createResumableContainer({
      caption: params.caption,
    });
    await this.uploadBytesToRupload({ containerId, filePath: params.filePath });
    await this.waitUntilFinished(containerId);
    return this.publishContainer(containerId);
  }

  private async createResumableContainer(params: {
    caption: string;
  }): Promise<string> {
    const url = `${this.graphBaseUrl}/${this.apiVersion}/${encodeURIComponent(this.igUserId)}/media`;
    const res = await requestJson<ContainerCreateResponse>(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        media_type: "REELS",
        caption: params.caption,
        upload_type: "resumable",
      }),
    });

    if (!res.id) throw new Error("Instagram /media response missing id");
    return res.id;
  }

  private async uploadBytesToRupload(params: {
    containerId: string;
    filePath: string;
  }): Promise<void> {
    const s = await stat(params.filePath);
    const bytes = await readFile(params.filePath);

    const url = `https://rupload.facebook.com/ig-api-upload/${this.apiVersion}/${encodeURIComponent(params.containerId)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `OAuth ${this.accessToken}`,
        offset: "0",
        file_size: String(s.size),
      },
      body: bytes,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => undefined);
      throw new Error(
        `Instagram rupload failed HTTP ${res.status}: ${text ?? ""}`,
      );
    }
  }

  private async waitUntilFinished(containerId: string): Promise<void> {
    for (let attempt = 1; attempt <= this.pollMaxAttempts; attempt++) {
      const status = await this.getContainerStatus(containerId);
      if (status === "FINISHED" || status === "PUBLISHED") return;
      if (status === "ERROR" || status === "EXPIRED") {
        throw new Error(
          `Instagram container status=${status} (containerId=${containerId})`,
        );
      }
      await sleep(this.pollIntervalMs);
    }
    throw new Error(
      `Instagram container did not finish after ${this.pollMaxAttempts} attempts (containerId=${containerId})`,
    );
  }

  private async getContainerStatus(
    containerId: string,
  ): Promise<StatusResponse["status_code"]> {
    const url = `${this.graphBaseUrl}/${this.apiVersion}/${encodeURIComponent(containerId)}?fields=status_code`;
    const res = await requestJson<StatusResponse>(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    return res.status_code;
  }

  private async publishContainer(containerId: string): Promise<string> {
    const url = `${this.graphBaseUrl}/${this.apiVersion}/${encodeURIComponent(this.igUserId)}/media_publish`;
    const res = await requestJson<PublishResponse>(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({ creation_id: containerId }),
    });
    if (!res.id)
      throw new Error("Instagram /media_publish response missing id");
    return res.id;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
