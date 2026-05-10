import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(__dirname, "../../gemini.env.local") });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY not found in gemini.env.local");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const OUTPUT_DIR = resolve(__dirname, "../public/images");
const OUTPUT_FILE = resolve(OUTPUT_DIR, "monolith.png");

const PROMPT =
  "Abstract black glossy monolith, digital luxury noir style, deep shadows, minimalism, cinematic quality";

console.log("Generating image with Gemini 2.0 Flash...");

const response = await ai.models.generateContent({
  model: "gemini-3.1-flash-image-preview",
  contents: [{ role: "user", parts: [{ text: PROMPT }] }],
  config: { responseModalities: ["TEXT", "IMAGE"] },
});

let imageData = null;
let mimeType = "image/png";

for (const part of response.candidates?.[0]?.content?.parts ?? []) {
  if (part.inlineData?.data) {
    imageData = part.inlineData.data;
    mimeType = part.inlineData.mimeType ?? "image/png";
    break;
  }
}

if (!imageData) {
  console.error("No image in response. Text output:", response.text);
  process.exit(1);
}

const ext = mimeType.split("/")[1] ?? "png";
const outFile = OUTPUT_FILE.replace(/\.png$/, `.${ext}`);

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(outFile, Buffer.from(imageData, "base64"));

console.log(`Done! Saved to: ${outFile}`);
