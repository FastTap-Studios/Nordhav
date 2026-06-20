import type { AiDescriptionTheme, CategoryVariantMode } from "../types";
import {
  buildAiDescriptionPrompt,
  genericAiSystemInstruction,
  normalizeShopSettings,
  resolveEffectiveAiTheme,
} from "./aiDescription";
import { generateGeminiText } from "./geminiClient";

export interface GenerateProductInfoInput {
  title?: unknown;
  category?: unknown;
  categoryVariantMode?: unknown;
  aiDescriptionTheme?: unknown;
  aiDescriptionCustomPrompt?: unknown;
}

export interface GenerateProductInfoResult {
  description: string;
  themeUsed: AiDescriptionTheme;
}

export class ProductInfoError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ProductInfoError";
    this.status = status;
  }
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
    console.log(`[AI] theme=${effectiveTheme} category="${category}" variant=${variantMode ?? "n/a"}`);
  }

  const description = await generateGeminiText({
    apiKey,
    model: config.model,
    prompt,
    systemInstruction,
  });

  return { description, themeUsed: effectiveTheme };
}
