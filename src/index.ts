import { loadEnv } from "./common/env.js";
import { getAccountModule } from "./common/registry.js";

function usage(): never {
  // eslint-disable-next-line no-console
  console.log(
    [
      "Usage:",
      "  node dist/index.js <account> <generate|upload>",
      "",
      "Accounts:",
      "  daily-relaxation-rhythm",
      "  deep-relax-flow",
      "  the-revived-canvas",
    ].join("\n"),
  );
  process.exit(1);
}

async function main() {
  loadEnv();

  const [, , accountName, action] = process.argv;
  if (!accountName || (action !== "generate" && action !== "upload")) {
    usage();
  }

  const account = getAccountModule(accountName);

  if (action === "generate") {
    await account.generateVideos();
    return;
  }

  await account.uploadOnIG();
}

await main();
