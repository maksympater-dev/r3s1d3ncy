import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../gemini.env.local") });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const models = await ai.models.list();
for await (const model of models) {
  if (model.supportedActions?.includes("generateImages") || model.name?.includes("imagen")) {
    console.log(model.name, "|", model.supportedActions?.join(", "));
  }
}
console.log("\nAll models:");
const all = await ai.models.list();
for await (const m of all) {
  console.log(m.name);
}
