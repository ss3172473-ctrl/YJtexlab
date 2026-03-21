import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_DIR = path.join(ROOT, "public", "hero", "generated");
const GEMINI_NODE_MODULES =
  process.env.GEMINI_CLI_NODE_MODULES ??
  "/Users/leesungjun/.nvm/versions/node/v24.13.0/lib/node_modules/@google/gemini-cli/node_modules";

const IMAGE_MODEL = "imagen-3.0-generate-002";
const LOCATION = "global";

const PROMPTS = [
  {
    slug: "fabric-01",
    title: "Sea Glass Patch",
    prompt:
      "Natural editorial macro photograph of teal woven fabric with gentle organic folds and a centered beige circular textile patch. The weave must look tactile and ultra sharp, with soft daylight and realistic thread detail. No text, no hands, no products, no CGI, 16:9 composition.",
  },
  {
    slug: "fabric-02",
    title: "Mineral Fold",
    prompt:
      "High-resolution textile photograph of a cool green woven cloth spread across the frame, with subtle diagonal folds and a centered sand-colored circular fabric patch. Quiet studio light, extremely crisp fibers, natural color, premium textile catalog feeling, 16:9 composition, no text.",
  },
  {
    slug: "fabric-03",
    title: "Natural Grid Weave",
    prompt:
      "Photoreal macro shot of woven fabric in muted teal and ivory threads, softly draped with calm depth and a centered circular linen patch. The shot should feel natural, premium, and editorial, with sharp surface detail and no artificial gloss. 16:9 frame, no text, no props.",
  },
  {
    slug: "fabric-04",
    title: "Soft Tension",
    prompt:
      "Premium textile close-up showing a refined teal weave with soft tension lines and a centered beige circular textile insert. Realistic daylight, visible thread structure, subtle shadow transitions, very sharp and tactile, clean 16:9 layout, no typography or branding.",
  },
  {
    slug: "fabric-05",
    title: "Quiet Surface",
    prompt:
      "Natural woven fabric photograph with soft sculptural folds, teal and cream yarn texture, and a centered circular patch cut from a slightly warmer neutral fabric. Editorial product-less composition, sharp fibers, restrained light, realistic surface variation, 16:9, no text.",
  },
  {
    slug: "fabric-06",
    title: "Calm Studio Cloth",
    prompt:
      "Ultra-detailed textile macro in a calm green-teal palette, wide cloth folds moving across a 16:9 frame, with a centered oat-colored circular fabric patch. The weave should be crisp and believable, under soft studio daylight, with a natural premium material mood. No text.",
  },
  {
    slug: "fabric-07",
    title: "Thread Relief",
    prompt:
      "Editorial fabric still life without objects: only woven cloth filling the full frame, natural folds, teal threads over a pale base, and a centered circular patch in warm beige linen. Very sharp thread definition, balanced contrast, subtle realism, 16:9 aspect ratio, no text.",
  },
  {
    slug: "fabric-08",
    title: "Woven Horizon",
    prompt:
      "Photoreal premium textile image inspired by high-end fabric photography: teal woven cloth with natural movement, broad soft folds, and a centered sand-beige circular patch. Threads must stay crisp and tactile, light should feel real and quiet, full 16:9 frame, no text or branding.",
  },
];

function moduleUrl(relativePath) {
  return pathToFileURL(path.join(GEMINI_NODE_MODULES, relativePath)).href;
}

async function loadGeminiAuth() {
  const oauthModule = await import(
    moduleUrl("@google/gemini-cli-core/dist/src/code_assist/oauth2.js")
  );
  const setupModule = await import(
    moduleUrl("@google/gemini-cli-core/dist/src/code_assist/setup.js")
  );
  const contentGeneratorModule = await import(
    moduleUrl("@google/gemini-cli-core/dist/src/core/contentGenerator.js")
  );

  return {
    getOauthClient: oauthModule.getOauthClient,
    setupUser: setupModule.setupUser,
    AuthType: contentGeneratorModule.AuthType,
  };
}

function createConfigStub() {
  return {
    getProxy: () => undefined,
    isBrowserLaunchSuppressed: () => true,
    getAcpMode: () => false,
    getValidationHandler: () => undefined,
  };
}

async function getVertexContext() {
  const { getOauthClient, setupUser, AuthType } = await loadGeminiAuth();
  const client = await getOauthClient(AuthType.LOGIN_WITH_GOOGLE, createConfigStub());
  const user = await setupUser(client, undefined, {});
  const accessTokenResult = await client.getAccessToken();
  const accessToken =
    typeof accessTokenResult === "string" ? accessTokenResult : accessTokenResult?.token;

  if (!accessToken) {
    throw new Error("No Google access token returned from the local Gemini OAuth client.");
  }

  return {
    accessToken,
    projectId: user.projectId,
  };
}

async function generateImage({ accessToken, projectId }, prompt) {
  const url =
    `https://aiplatform.googleapis.com/v1beta1/projects/${projectId}` +
    `/locations/${LOCATION}/publishers/google/models/${IMAGE_MODEL}:predict`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      instances: [{ prompt: prompt.prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: "16:9",
        outputOptions: {
          mimeType: "image/png",
        },
        includeRaiReason: true,
      },
    }),
  });

  const bodyText = await response.text();
  if (!response.ok) {
    let detail = bodyText;
    try {
      const parsed = JSON.parse(bodyText);
      detail = parsed?.error?.message ?? bodyText;
    } catch {}

    throw new Error(detail);
  }

  const payload = JSON.parse(bodyText);
  const base64 =
    payload?.predictions?.[0]?.bytesBase64Encoded ??
    payload?.predictions?.[0]?.image?.bytesBase64Encoded;

  if (!base64) {
    throw new Error(`No image payload returned for ${prompt.slug}.`);
  }

  const filePath = path.join(OUTPUT_DIR, `${prompt.slug}.png`);
  await fs.writeFile(filePath, Buffer.from(base64, "base64"));

  return {
    title: prompt.title,
    filePath,
  };
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const vertexContext = await getVertexContext();
  const results = [];

  for (const prompt of PROMPTS) {
    const result = await generateImage(vertexContext, prompt);
    results.push({
      slug: prompt.slug,
      title: result.title,
      prompt: prompt.prompt,
      file: path.relative(ROOT, result.filePath),
    });
    console.log(`Generated ${prompt.slug}`);
  }

  const manifestPath = path.join(OUTPUT_DIR, "manifest.json");
  await fs.writeFile(`${manifestPath}`, JSON.stringify(results, null, 2));
  console.log(`Saved ${path.relative(ROOT, manifestPath)}`);
}

main().catch((error) => {
  const message = String(error?.message ?? error);

  if (message.includes("Vertex AI API has not been used")) {
    console.error(
      [
        "Vertex AI API is disabled for the current Gemini project.",
        "Open this URL once, wait a few minutes, then rerun the script:",
        "https://console.developers.google.com/apis/api/aiplatform.googleapis.com/overview?project=chrome-cirrus-tzsgc",
      ].join("\n"),
    );
    process.exit(1);
  }

  if (message.includes("insufficient authentication scopes")) {
    console.error(
      "The current local Gemini OAuth token does not include the scopes needed for image generation.",
    );
    process.exit(1);
  }

  console.error(message);
  process.exit(1);
});
