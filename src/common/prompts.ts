export const DAILY_RELAXATION_RHYTHM_SEED =
  "Generate similar ai video generation prompt, but drastically different shapes, movement, still cosmos, but different kind of elements, different kinds or colors, many cosmic granular particles.\n\nReturn ONLY a JSON array of 20 strings (no markdown, no commentary). Each string must be a single xAI Grok Imagine video prompt for vertical 9:16. Do not include any people, silhouettes, text, UI, or logos.";

export const DEEP_RELAX_FLOW_SEED =
  "Generate similar AI video generation prompt (deep emerald / lime greens, yellows, soft materials, slow glacial motion, relaxing ASMR vibe).\n\nReturn ONLY a JSON array of 20 strings (no markdown, no commentary). Each string must be a single xAI Grok Imagine video prompt for vertical 9:16. Do not include any people, text, UI, or logos.";

export const REVIVED_CANVAS_IMAGE_TO_VIDEO_PROMPT =
  "Animate the provided image into a calm, artistic, loop-friendly vertical video. Use subtle camera movement, gentle parallax, and soft motion that preserves the original composition. No text, no UI, no logos.";

export const CAPTION_PROMPT_TEMPLATE = (
  accountName: string,
  videoPrompt: string,
) =>
  `Write a short Instagram Reel caption (1-2 sentences) for the account "${accountName}". Keep it calm, relaxing, and non-clickbait. Add 5-8 relevant hashtags.\n\nVideo prompt:\n${videoPrompt}`;
