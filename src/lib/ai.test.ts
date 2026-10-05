import { afterEach, describe, expect, it, vi } from "vitest";
import { autofillItems, normalizeItems, normalizeSuggestions } from "./ai";
import { suggestPantryDetails } from "./shelfLife";
import { handleRequest } from "../../supabase/functions/nutrigen-ai/handler";

const invoke = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke } } }));

const NOW = new Date(2026, 5, 10, 12, 0);

describe("suggestPantryDetails", () => {
  it("knows common foods and their shelf life", () => {
    expect(suggestPantryDetails("Fresh Spinach", NOW)).toMatchObject({
      category: "vegetables",
      expiry_date: "2026-06-14",
      recognised: true,
    });
    expect(suggestPantryDetails("Whole milk", NOW)).toMatchObject({ category: "dairy", unit: "bottle" });
    expect(suggestPantryDetails("Almond milk", NOW).category).toBe("beverages");
    expect(suggestPantryDetails("Basmati rice", NOW)).toMatchObject({ category: "grains", expiry_date: "2027-06-10" });
    expect(suggestPantryDetails("Frozen peas", NOW).category).toBe("frozen");
  });

  it("falls back to 'other' with no expiry for unknown items", () => {
    expect(suggestPantryDetails("Mystery thing", NOW)).toEqual({
      category: "other",
      unit: "pcs",
      expiry_date: null,
      recognised: false,
    });
    expect(suggestPantryDetails("   ", NOW).recognised).toBe(false);
  });
});

describe("normalizeItems", () => {
  it("validates category/unit, clamps quantity and converts shelf life to a date", () => {
    const items = normalizeItems(
      {
        items: [
          { name: " Tomatoes ", category: "vegetables", quantity: 6, unit: "pcs", shelf_life_days: 7 },
          { name: "tomatoes", category: "vegetables", quantity: 1, unit: "pcs", shelf_life_days: 7 },
          { name: "Milk", category: "weird", quantity: -4, unit: "gallons", shelf_life_days: 0 },
          { name: "", category: "other", quantity: 1, unit: "pcs", shelf_life_days: 1 },
          null,
        ],
      },
      NOW
    );
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({ name: "Tomatoes", category: "vegetables", unit: "pcs", quantity: 6, expiry_date: "2026-06-17" });
    // bad category/unit fall back to the built-in guess; quantity clamps to 0.1
    expect(items[1]).toMatchObject({ name: "Milk", category: "dairy", unit: "bottle", quantity: 0.1, expiry_date: "2026-06-17" });
  });

  it("returns an empty list for garbage", () => {
    expect(normalizeItems(undefined)).toEqual([]);
    expect(normalizeItems({ items: "nope" })).toEqual([]);
  });
});

describe("normalizeSuggestions", () => {
  const good = {
    name: "Spinach omelette",
    emoji: "🍳",
    description: "Quick.",
    reason: "Uses your spinach.",
    calories: 320,
    protein_g: 22,
    carbs_g: 6,
    fats_g: 24,
    prep_minutes: 10,
    servings: 1,
    difficulty: "Easy",
    ingredients: ["2 eggs", "spinach"],
    steps: ["Whisk eggs", "Cook with spinach"],
    uses_from_pantry: ["Spinach"],
  };

  it("maps to the recipe shape the UI uses", () => {
    const [s] = normalizeSuggestions({ suggestions: [good] });
    expect(s.recipe).toMatchObject({
      name: "Spinach omelette",
      calories: 320,
      prepTime: 10,
      macros: { protein: 22, carbs: 6, fats: 24 },
      steps: [
        { step: 1, instruction: "Whisk eggs" },
        { step: 2, instruction: "Cook with spinach" },
      ],
    });
    expect(s.reason).toBe("Uses your spinach.");
  });

  it("drops unusable entries", () => {
    expect(
      normalizeSuggestions({
        suggestions: [
          { ...good, calories: 0 },
          { ...good, ingredients: [] },
          { ...good, name: "" },
          { ...good, calories: 99999 },
        ],
      })
    ).toEqual([]);
  });
});

describe("edge function handler", () => {
  const post = (body: unknown) =>
    new Request("http://x/nutrigen-ai", { method: "POST", body: JSON.stringify(body) });

  afterEach(() => vi.unstubAllGlobals());

  it("answers 503 when no key is configured", async () => {
    const res = await handleRequest(post({ action: "enrich", names: ["milk"] }), { apiKey: undefined });
    expect(res.status).toBe(503);
  });

  it("rejects bad input before calling the AI", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const env = { apiKey: "k" };
    expect((await handleRequest(post({ action: "nope" }), env)).status).toBe(400);
    expect((await handleRequest(post({ action: "enrich", names: [] }), env)).status).toBe(400);
    expect((await handleRequest(post({ action: "scan", image: "abc", mimeType: "text/html" }), env)).status).toBe(400);
    expect((await handleRequest(post({ action: "scan", image: "x".repeat(6_000_001), mimeType: "image/jpeg" }), env)).status).toBe(413);
    expect((await handleRequest(new Request("http://x", { method: "GET" }), env)).status).toBe(405);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls Gemini with the key in a header and returns the parsed JSON", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"items":[{"name":"Milk"}]}' }] } }] }))
    );
    vi.stubGlobal("fetch", fetchSpy);
    const res = await handleRequest(post({ action: "enrich", names: ["Milk"] }), { apiKey: "secret-key" });
    expect(await res.json()).toEqual({ items: [{ name: "Milk" }] });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).not.toContain("secret-key");
    expect((init as RequestInit).headers).toMatchObject({ "x-goog-api-key": "secret-key" });
  });

  it("retries a temporary 503 from Gemini", async () => {
    const ok = new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"items":[]}' }] } }] }));
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(ok);
    vi.stubGlobal("fetch", fetchSpy);
    const res = await handleRequest(post({ action: "enrich", names: ["Milk"] }), { apiKey: "k", retryDelayMs: 1 });
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("maps upstream rate limits to 429 without leaking details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("quota details", { status: 429 })));
    const res = await handleRequest(post({ action: "enrich", names: ["Milk"] }), { apiKey: "k" });
    expect(res.status).toBe(429);
    expect(JSON.stringify(await res.json())).not.toContain("quota details");
  });
});

describe("autofillItems", () => {
  afterEach(() => invoke.mockReset());

  it("fills known foods instantly without calling the AI", async () => {
    const [milk] = await autofillItems(["Milk"]);
    expect(milk).toMatchObject({ name: "Milk", category: "dairy" });
    expect(invoke).not.toHaveBeenCalled();
  });

  it("asks the AI only about unfamiliar foods and keeps the user's names", async () => {
    invoke.mockResolvedValue({
      data: { items: [{ name: "Gochujang", category: "canned", quantity: 1, unit: "bottle", shelf_life_days: 180 }] },
      error: null,
    });
    const out = await autofillItems(["Milk", "Gochujang"]);
    expect(invoke).toHaveBeenCalledWith("nutrigen-ai", { body: { action: "enrich", names: ["Gochujang"] } });
    expect(out[0].category).toBe("dairy");
    expect(out[1]).toMatchObject({ name: "Gochujang", category: "canned" });
  });

  it("falls back to generic defaults when the AI is down", async () => {
    invoke.mockResolvedValue({ data: null, error: { context: { status: 404 } } });
    const [item] = await autofillItems(["Zzyzx"]);
    expect(item).toMatchObject({ name: "Zzyzx", category: "other", expiry_date: null });
  });
});
