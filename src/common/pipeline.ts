import { readFile } from "node:fs/promises";
import path from "node:path";
import { getEnv, getEnvInt, getEnvOptional } from "./env.js";
import {
  ensureDir,
  fileToDataUri,
  listFiles,
  moveFile,
  moveSidecarJson,
  readSidecarJson,
  timestampedName,
  writeSidecarJson,
} from "./fs.js";
import { GeminiClient, extractJsonArray } from "./gemini.js";
import { GrokImagineVideoGenerator } from "./grok.js";
import { InstagramReelsUploader } from "./instagram.js";
import { CAPTION_PROMPT_TEMPLATE } from "./prompts.js";

export type AccountConfig = {
  name: string;
  videosToUploadDir: string;
  videosUploadedDir: string;
  promptSeed: string;
  promptSeedFilePath?: string;
  mode: "text-to-video" | "image-to-video";
  picsTodoDir?: string;
  picsUsedDir?: string;
  instagram?: {
    accessTokenEnvVar: string;
    igUserIdEnvVar: string;
  };
};

export function getBatchSize(): number {
  return getEnvInt("BATCH_SIZE", 20);
}

export function createClients() {
  return {
    gemini: new GeminiClient(),
    grok: new GrokImagineVideoGenerator(),
  };
}

export async function generateVideosForAccount(
  config: AccountConfig,
): Promise<void> {
  const { gemini, grok } = createClients();
  const batchSize = getBatchSize();

  await ensureDir(config.videosToUploadDir);

  const items = await getGenerationItems({ config, gemini, batchSize });
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const fileName = timestampedName(config.name, i + 1, "mp4");
    const outPath = path.join(config.videosToUploadDir, fileName);

    // eslint-disable-next-line no-console
    console.log(`[${config.name}] generating ${i + 1}/${items.length}`);

    if (item.imageDataUri) {
      const result = await grok.generateToFile({
        prompt: item.prompt,
        imageUrl: item.imageDataUri,
        outFilePath: outPath,
        aspectRatio: "9:16",
        resolution: "720p",
      });
      await writeSidecarJson(outPath, {
        prompt: item.prompt,
        requestId: result.requestId,
        videoUrl: result.videoUrl,
      });
    } else {
      const result = await grok.generateToFile({
        prompt: item.prompt,
        outFilePath: outPath,
        aspectRatio: "9:16",
        resolution: "720p",
      });
      await writeSidecarJson(outPath, {
        prompt: item.prompt,
        requestId: result.requestId,
        videoUrl: result.videoUrl,
      });
    }
  }
}

export async function uploadVideosForAccount(
  config: AccountConfig,
): Promise<void> {
  const { gemini } = createClients();
  const instagram = createInstagramClient(config);
  const batchSize = getBatchSize();

  await ensureDir(config.videosToUploadDir);
  await ensureDir(config.videosUploadedDir);

  const candidates = (await listFiles(config.videosToUploadDir)).filter((p) =>
    p.toLowerCase().endsWith(".mp4"),
  );
  const toUpload = candidates.slice(0, batchSize);

  for (let i = 0; i < toUpload.length; i++) {
    const filePath = toUpload[i]!;
    // eslint-disable-next-line no-console
    console.log(
      `[${config.name}] uploading ${i + 1}/${toUpload.length}: ${path.basename(filePath)}`,
    );

    const sidecar = await readSidecarJson<{ prompt?: string }>(filePath);
    const videoPrompt =
      sidecar?.prompt ?? `Local file: ${path.basename(filePath)}`;
    const caption = await gemini.generateText(
      CAPTION_PROMPT_TEMPLATE(config.name, videoPrompt),
    );
    const mediaId = await instagram.uploadReelFromFile({ filePath, caption });
    const newFilePath = await moveFile(filePath, config.videosUploadedDir);
    await moveSidecarJson(filePath, newFilePath);
    await writeSidecarJson(newFilePath, {
      ...(sidecar ?? {}),
      prompt: videoPrompt,
      caption,
      mediaId,
    });
  }
}

function createInstagramClient(config: AccountConfig): InstagramReelsUploader {
  const accessToken = config.instagram
    ? (getEnvOptional(config.instagram.accessTokenEnvVar) ??
      getEnv("INSTAGRAM_ACCESS_TOKEN"))
    : getEnv("INSTAGRAM_ACCESS_TOKEN");

  const igUserId = config.instagram
    ? (getEnvOptional(config.instagram.igUserIdEnvVar) ??
      getEnv("INSTAGRAM_IG_USER_ID"))
    : getEnv("INSTAGRAM_IG_USER_ID");

  return new InstagramReelsUploader({ accessToken, igUserId });
}

type GenerationItem = { prompt: string; imageDataUri?: string };

async function getGenerationItems(params: {
  config: AccountConfig;
  gemini: GeminiClient;
  batchSize: number;
}): Promise<GenerationItem[]> {
  const { config, gemini, batchSize } = params;

  if (config.mode === "text-to-video") {
    const seed = config.promptSeedFilePath
      ? await readFile(config.promptSeedFilePath, "utf8")
      : config.promptSeed;
    const request = `${seed}\n\nMake sure the JSON array has exactly ${batchSize} items.`;
    const raw = await gemini.generateText(request);
    const arr = extractJsonArray(raw).map((x) => String(x));
    return arr.slice(0, batchSize).map((prompt) => ({ prompt }));
  }

  if (!config.picsTodoDir || !config.picsUsedDir) {
    throw new Error(
      `[${config.name}] image-to-video mode requires picsTodoDir and picsUsedDir`,
    );
  }

  await ensureDir(config.picsTodoDir);
  await ensureDir(config.picsUsedDir);

  const images = (await listFiles(config.picsTodoDir)).filter((p) =>
    /\.(png|jpg|jpeg)$/i.test(p),
  );
  const chosen = images.slice(0, batchSize);
  if (chosen.length === 0) {
    throw new Error(`[${config.name}] No images found in pics-todo`);
  }

  const items: GenerationItem[] = [];
  for (const imgPath of chosen) {
    const dataUri = await fileToDataUri(imgPath);
    items.push({ prompt: config.promptSeed, imageDataUri: dataUri });
  }

  for (const imgPath of chosen) {
    await moveFile(imgPath, config.picsUsedDir);
  }

  return items;
}
