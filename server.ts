import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import dotenv from "dotenv";
import { generateProductDescription, ProductInfoError } from "./src/lib/generateProductInfo.ts";
import { isGeminiConfigured } from "./src/lib/geminiClient.ts";

dotenv.config();

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required for checkout");
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || undefined;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === "production";

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", aiConfigured: isGeminiConfigured(process.env.GEMINI_API_KEY) });
  });

  // AI Product Generation
  app.post("/api/generate-product-info", async (req, res) => {
    try {
      const result = await generateProductDescription(req.body, {
        apiKey: process.env.GEMINI_API_KEY,
        model: GEMINI_MODEL,
        log: !isProduction,
      });
      res.json(result);
    } catch (error: unknown) {
      if (error instanceof ProductInfoError) {
        return res.status(error.status).json({ error: error.message });
      }
      const message = error instanceof Error ? error.message : "Okänt fel vid AI-generering";
      console.error("Gemini error:", error);
      res.status(500).json({ error: message });
    }
  });

  // Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { items, email } = req.body;

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: "Stripe secret key not configured" });
      }

      const stripe = getStripe();
      const lineItems = items.map((item: any) => {
        const sku = item.sku?.trim?.() || item.selectedVariant?.sku?.trim?.() || "";
        const variantLabel = item.selectedVariant?.label?.trim?.() || "";
        const name = variantLabel ? `${item.name} (${variantLabel})` : item.name;
        return {
          price_data: {
            currency: "sek",
            product_data: {
              name,
              images: item.imageUrl ? [item.imageUrl] : [],
              ...(sku ? { metadata: { sku } } : {}),
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        };
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${process.env.APP_URL || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/cart`,
        customer_email: email,
      });

      res.json({ id: session.id });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (${isProduction ? "production" : "development"})`);
  });
}

startServer();
