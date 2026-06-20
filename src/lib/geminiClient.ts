export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export async function generateGeminiText(options: {
  apiKey: string;
  model?: string;
  prompt: string;
  systemInstruction?: string;
}): Promise<string> {
  const model = options.model?.trim() || DEFAULT_GEMINI_MODEL;
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: options.prompt }] }],
  };

  if (options.systemInstruction) {
    body.systemInstruction = { parts: [{ text: options.systemInstruction }] };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(options.apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || `Gemini API svarade ${res.status}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!text) {
    throw new Error("AI returnerade ingen text. Försök igen.");
  }

  return text;
}

export function isGeminiConfigured(apiKey: string | null | undefined): boolean {
  return Boolean(apiKey?.trim());
}
