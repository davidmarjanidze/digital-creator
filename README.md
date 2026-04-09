# digital-creator

Automates:

- Video generation via xAI Grok Imagine
- Caption/description generation via Gemini
- Uploading Reels to Instagram via Instagram Graph API

## Setup

1. Create a `.env` from `.env.example` and fill in keys.
2. Install deps: `npm i`

## Run

- Generate 20 videos:
  - `npm run generate:daily`
  - `npm run generate:deep`
  - `npm run generate:canvas`
- Upload up to 20 videos:
  - `npm run upload:daily`
  - `npm run upload:deep`
  - `npm run upload:canvas`

Generated videos land in each account’s `videos-to-upload/` and are moved to `videos-uploaded/` after a successful upload.
