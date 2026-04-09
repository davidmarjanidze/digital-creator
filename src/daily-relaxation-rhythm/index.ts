import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateVideosForAccount,
  uploadVideosForAccount,
} from "../common/pipeline.js";
import { DAILY_RELAXATION_RHYTHM_SEED } from "../common/prompts.js";

const __filename = fileURLToPath(import.meta.url);
const accountRoot = path.dirname(__filename);
const repoRoot = path.resolve(accountRoot, "..", "..");

const config = {
  name: "daily-relaxation-rhythm",
  videosToUploadDir: path.join(accountRoot, "videos-to-upload"),
  videosUploadedDir: path.join(accountRoot, "videos-uploaded"),
  promptSeed: DAILY_RELAXATION_RHYTHM_SEED,
  promptSeedFilePath: path.join(
    repoRoot,
    "specs",
    "prompts",
    "daily-relaxation-rhythm-gemini.txt",
  ),
  mode: "text-to-video" as const,
};

export async function generateVideos(): Promise<void> {
  await generateVideosForAccount(config);
}

export async function uploadOnIG(): Promise<void> {
  await uploadVideosForAccount(config);
}
