import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateVideosForAccount,
  uploadVideosForAccount,
} from "../common/pipeline.js";
import { REVIVED_CANVAS_IMAGE_TO_VIDEO_PROMPT } from "../common/prompts.js";

const __filename = fileURLToPath(import.meta.url);
const accountRoot = path.dirname(__filename);

const config = {
  name: "the-revived-canvas",
  videosToUploadDir: path.join(accountRoot, "videos-to-upload"),
  videosUploadedDir: path.join(accountRoot, "videos-uploaded"),
  promptSeed: REVIVED_CANVAS_IMAGE_TO_VIDEO_PROMPT,
  mode: "image-to-video" as const,
  picsTodoDir: path.join(accountRoot, "pics-todo"),
  picsUsedDir: path.join(accountRoot, "pics-used"),
};

export async function generateVideos(): Promise<void> {
  await generateVideosForAccount(config);
}

export async function uploadOnIG(): Promise<void> {
  await uploadVideosForAccount(config);
}
