# Objectives

- Implement the automated ai video generation with Grok.
  - I will provide the Grok Imagine API key, you just place the placeholder API key name in `.env`.
  - The Grok Imagine video generation feature should be packaged in a single TypeScript class and used in every module.
- Implement automatic videos upload to Instagram.
  - I will provide the Instagram API key, you just place the placeholder API key name in `.env`.
  - The Instagram upload feature should be packaged in a single TypeScript class and used in every module.
- Implement the automatic video description generation for the Instagram with Gemini API.
  - I will provide the Gemini API key, you just place the placeholder API key name in `.env`.
  - The Gemini LLM feature should be packaged in a single TypeScript class and used in every module, so that when I pass this class method the prompt, it should return the response.

# Common Structure for the Instagram Accounts

- Each Instagram account has its corresponding folder in `src` folder, e.g. `daily-relaxation-rhythm`, `deep-relax-flow`, `the-revived-canvas`.
- Each Instagram account folder should expose simple API (functions), e.g. `generateVideos()`, `uploadOnIG()`.
  - Each execution of these functions should generate and upload batch of 20 videos.
- Each Instagram account folder contains two common folders: `videos-to-upload` and `videos-uploaded`. `videos-to-upload` folder is used to put the newly generated videos.`videos-uploaded` is used for the videos which are uploaded on the Instagram. The `the-revived-canvas` folder also contains `pics-todo` and `pics-used`. This is the only account that needs pictures (which I will provide), and based on these images it should generate the videos.
- Here is the prompt to use to generate
- `src/common` folder should be used for common reusable features.
