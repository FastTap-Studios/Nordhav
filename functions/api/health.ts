import { isGeminiConfigured } from "../../src/lib/geminiClient";

interface Env {
  GEMINI_API_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return Response.json({
    status: "ok",
    aiConfigured: isGeminiConfigured(env.GEMINI_API_KEY),
  });
};
