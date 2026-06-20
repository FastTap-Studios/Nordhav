import { generateProductDescription, ProductInfoError } from "../../src/lib/generateProductInfo";

interface Env {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const result = await generateProductDescription(body, {
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL,
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof ProductInfoError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Okänt fel vid AI-generering";
    console.error("Gemini error:", error);
    return Response.json({ error: message }, { status: 500 });
  }
};
