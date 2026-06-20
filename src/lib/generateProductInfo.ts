import type { AiDescriptionTheme, CategoryVariantMode } from "../types";
import {
  buildAiDescriptionPrompt,
  buildImproveDescriptionPrompt,
  genericAiSystemInstruction,
  improveDescriptionSystemInstruction,
  normalizeShopSettings,
  resolveEffectiveAiTheme,
} from "./aiDescription";
import { generateGeminiText } from "./geminiClient";

export type ProductDescriptionAiMode = "generate" | "improve";

export interface GenerateProductInfoInput {
  mode?: unknown;
  title?: unknown;
  category?: unknown;
  categoryVariantMode?: unknown;
  aiDescriptionTheme?: unknown;
  aiDescriptionCustomPrompt?: unknown;
  existingDescription?: unknown;
}

export interface GenerateProductInfoResult {
  description: string;
  mode: ProductDescriptionAiMode;
  themeUsed?: AiDescriptionTheme;
}

export class ProductInfoError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ProductInfoError";
    this.status = status;
  }
}

function parseMode(value: unknown): ProductDescriptionAiMode {
  return value === "improve" ? "improve" : "generate";
}

export async function generateProductDescription(
  input: GenerateProductInfoInput,
  config: { apiKey: string | null | undefined; model?: string; log?: boolean }
): Promise<GenerateProductInfoResult> {
  const apiKey = config.apiKey?.trim();
  if (!apiKey) {
    throw new ProductInfoError(
      "GEMINI_API_KEY saknas. Lägg till nyckeln i .env (lokal) eller Cloudflare Pages Secrets (produktion).",
      503
    );
  }

  const mode = parseMode(input.mode);
  const existingDescription = String(input.existingDescription ?? "").trim();

  if (mode === "improve") {
    if (!existingDescription) {
      throw new ProductInfoError("Skriv en beskrivning först som AI kan förbättra.", 400);
    }

    if (config.log) {
      console.log("[AI] mode=improve (text polish only)");
    }

    const description = await generateGeminiText({
      apiKey,
      model: config.model,
      prompt: buildImproveDescriptionPrompt(existingDescription),
      systemInstruction: improveDescriptionSystemInstruction(),
    });

    return { description, mode };
  }

  const title = String(input.title ?? "").trim();
  const category = String(input.category ?? "").trim();
  if (!title || !category) {
    throw new ProductInfoError("Ange produktnamn och kategori.", 400);
  }

  const aiSettings = normalizeShopSettings({
    aiDescriptionTheme: input.aiDescriptionTheme as AiDescriptionTheme | undefined,
    aiDescriptionCustomPrompt:
      typeof input.aiDescriptionCustomPrompt === "string" ? input.aiDescriptionCustomPrompt : undefined,
  });
  const variantMode = input.categoryVariantMode as CategoryVariantMode | undefined;
  const effectiveTheme = resolveEffectiveAiTheme(aiSettings, category, variantMode);
  const prompt = buildAiDescriptionPrompt(title, category, aiSettings, variantMode);
  const systemInstruction =
    effectiveTheme === "generic" ? genericAiSystemInstruction(category, variantMode) : undefined;

  if (config.log) {
    console.log(
      `[AI] mode=generate theme=${effectiveTheme} category="${category}" variant=${variantMode ?? "n/a"}`
    );
  }

  const description = await generateGeminiText({
    apiKey,
    model: config.model,
    prompt,
    systemInstruction,
  });

  return { description, themeUsed: effectiveTheme, mode };
}
