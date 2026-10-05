// Supabase edge function: NutriGen's AI features (pantry photo scan, auto-fill of
// category/expiry, and meal suggestions). The Gemini key is a server secret:
//   supabase secrets set GEMINI_API_KEY=...        (optional: GEMINI_MODEL=...)
import { handleRequest } from "./handler.ts";

Deno.serve((req) =>
  handleRequest(req, {
    apiKey: Deno.env.get("GEMINI_API_KEY"),
    model: Deno.env.get("GEMINI_MODEL"),
  })
);
