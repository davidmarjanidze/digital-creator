import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AccountConfig } from "./pipeline.js";
import {
  generateVideosForAccount,
  uploadVideosForAccount,
} from "./pipeline.js";
import {
  DAILY_RELAXATION_RHYTHM_SEED,
  DEEP_RELAX_FLOW_SEED,
  REVIVED_CANVAS_IMAGE_TO_VIDEO_PROMPT,
} from "./prompts.js";

export type AccountModule = {
  generateVideos(): Promise<void>;
  uploadOnIG(): Promise<void>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function makeAccount(config: AccountConfig): AccountModule {
  return {
    generateVideos: () => generateVideosForAccount(config),
    uploadOnIG: () => uploadVideosForAccount(config),
  };
}

export function getAccountModule(name: string): AccountModule {
  const accountRoot = path.join(repoRoot, "src", name);
  if (name === "daily-relaxation-rhythm") {
    return makeAccount({
      name,
      videosToUploadDir: path.join(accountRoot, "videos-to-upload"),
      videosUploadedDir: path.join(accountRoot, "videos-uploaded"),
      promptSeed: DAILY_RELAXATION_RHYTHM_SEED,
      promptSeedFilePath: path.join(
        repoRoot,
        "specs",
        "prompts",
        "daily-relaxation-rhythm-gemini.txt",
      ),
      instagram: {
        accessTokenEnvVar: "INSTAGRAM_DAILY_ACCESS_TOKEN",
        igUserIdEnvVar: "INSTAGRAM_DAILY_IG_USER_ID",
      },
      mode: "text-to-video",
    });
  }
  if (name === "deep-relax-flow") {
    return makeAccount({
      name,
      videosToUploadDir: path.join(accountRoot, "videos-to-upload"),
      videosUploadedDir: path.join(accountRoot, "videos-uploaded"),
      promptSeed: DEEP_RELAX_FLOW_SEED,
      promptSeedFilePath: path.join(
        repoRoot,
        "specs",
        "prompts",
        "deep-relax-flow-gemini.txt",
      ),
      instagram: {
        accessTokenEnvVar: "INSTAGRAM_DEEP_ACCESS_TOKEN",
        igUserIdEnvVar: "INSTAGRAM_DEEP_IG_USER_ID",
      },
      mode: "text-to-video",
    });
  }
  if (name === "the-revived-canvas") {
    return makeAccount({
      name,
      videosToUploadDir: path.join(accountRoot, "videos-to-upload"),
      videosUploadedDir: path.join(accountRoot, "videos-uploaded"),
      promptSeed: REVIVED_CANVAS_IMAGE_TO_VIDEO_PROMPT,
      mode: "image-to-video",
      instagram: {
        accessTokenEnvVar: "INSTAGRAM_CANVAS_ACCESS_TOKEN",
        igUserIdEnvVar: "INSTAGRAM_CANVAS_IG_USER_ID",
      },
      picsTodoDir: path.join(accountRoot, "pics-todo"),
      picsUsedDir: path.join(accountRoot, "pics-used"),
    });
  }

  throw new Error(`Unknown account: ${name}`);
}
