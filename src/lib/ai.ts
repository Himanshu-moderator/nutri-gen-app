import { supabase } from "@/integrations/supabase/client";
import type { RecipeDetail } from "@/components/RecipeDetailSheet";
import { addDaysKey, suggestPantryDetails } from "@/lib/shelfLife";

// Client for the `nutrigen-ai` Supabase edge function (Gemini runs there so no
// API key ever reaches the browser). Every caller must cope with AiUnavailableError
// and keep working without AI.

export const PANTRY_CATEGORIES = [
  "fruits", "vegetables", "dairy", "meat", "seafood", "grains",
  "spices", "beverages", "snacks", "frozen", "canned", "other",
] as const;
export const PANTRY_UNITS = ["pcs", "lbs", "kg", "oz", "container", "bag", "bottle"] as const;

export class AiUnavailableError extends Error {
  constructor(message = "AI isn't available right now.") {
    super(message);
    this.name = "AiUnavailableError";
  }
}

export interface DetectedItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiry_date: string | null;
}

const invokeAi = async (body: Record<string, unknown>): Promise<unknown> => {
  const { data, error } = await supabase.functions.invoke("nutrigen-ai", { body });
  if (!error) return data;

  let status = 0;
  let message = "";
  const ctx = (error as { context?: Response }).context;
  if (ctx && typeof ctx.status === "number") {
    status = ctx.status;
    try {
      message = (await ctx.json())?.error ?? "";
    } catch {
      // body wasn't JSON
    }
  }
  // Not deployed (404), not configured (503), or unreachable: treat as "AI is off".
  if (status === 0 || status === 404 || status === 503) throw new AiUnavailableError();
  throw new Error(message || "The AI couldn't help with that. Please try again.");
};

const toNumber = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// Turns the model's answer into safe, UI-ready items: valid category/unit,
// bounded quantity, and an expiry date computed from the shelf life.
export const normalizeItems = (raw: unknown, now: Date = new Date()): DetectedItem[] => {
  const list = (raw as { items?: unknown })?.items;
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: DetectedItem[] = [];
  for (const entry of list.slice(0, 30)) {
    const e = (entry ?? {}) as Record<string, unknown>;
    const name = typeof e.name === "string" ? e.name.trim().slice(0, 60) : "";
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    const guess = suggestPantryDetails(name, now);
    const category = (PANTRY_CATEGORIES as readonly string[]).includes(String(e.category))
      ? String(e.category)
      : guess.category;
    const unit = (PANTRY_UNITS as readonly string[]).includes(String(e.unit)) ? String(e.unit) : guess.unit;
    const quantity = Math.min(Math.max(toNumber(e.quantity, 1), 0.1), 999);
    const days = Math.round(toNumber(e.shelf_life_days, 0));
    out.push({
      name,
      category,
      unit,
      quantity: Math.round(quantity * 100) / 100,
      expiry_date: days > 0 && days <= 3650 ? addDaysKey(days, now) : guess.expiry_date,
    });
  }
  return out;
};

const fileToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Couldn't read that photo."));
    reader.readAsDataURL(blob);
  });

// Shrinks big phone photos before upload (faster, cheaper, under the size limit).
const prepareImage = async (file: File): Promise<{ data: string; mimeType: string }> => {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (blob) return { data: await fileToBase64(blob), mimeType: "image/jpeg" };
  } catch {
    // fall through to sending the original
  }
  if (file.size > 4_000_000) throw new Error("That photo is too large. Try a smaller one.");
  return { data: await fileToBase64(file), mimeType: file.type || "image/jpeg" };
};

export const scanPantryPhoto = async (file: File): Promise<DetectedItem[]> => {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  const image = await prepareImage(file);
  const raw = await invokeAi({ action: "scan", image: image.data, mimeType: image.mimeType });
  return normalizeItems(raw);
};

// Category, unit and expiry for typed names. Foods we already know are filled
// instantly from built-in knowledge; only unfamiliar ones go to the AI. If the AI
// is unreachable they get the generic defaults, so auto-fill never blocks the user.
export const autofillItems = async (names: string[]): Promise<DetectedItem[]> => {
  const clean = names.map((n) => n.trim()).filter(Boolean);
  const local = clean.map((name) => {
    const g = suggestPantryDetails(name);
    return { item: { name, category: g.category, unit: g.unit, quantity: 1, expiry_date: g.expiry_date }, known: g.recognised };
  });
  const unknown = clean.filter((_, i) => !local[i].known);
  if (unknown.length === 0) return local.map((l) => l.item);

  let byName = new Map<string, DetectedItem>();
  try {
    const raw = await invokeAi({ action: "enrich", names: unknown });
    const rawList = ((raw as { items?: unknown[] })?.items ?? []) as unknown[];
    // Keep the user's own names and order; take the AI's details by position.
    byName = new Map(
      unknown.flatMap((name, i): [string, DetectedItem][] => {
        const [hit] = normalizeItems({ items: [rawList[i]] });
        return hit ? [[name, { ...hit, name }]] : [];
      })
    );
  } catch {
    // keep the generic defaults
  }
  return local.map((l) => byName.get(l.item.name) ?? l.item);
};

export interface SuggestionContext {
  slot: string;
  diets: string[];
  goal: string | null;
  caloriesLeft: number | null;
  pantry: string[];
  expiring: string[];
}

export interface AiSuggestion {
  recipe: RecipeDetail;
  reason: string;
  usesFromPantry: string[];
}

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;

export const normalizeSuggestions = (raw: unknown): AiSuggestion[] => {
  const list = (raw as { suggestions?: unknown })?.suggestions;
  if (!Array.isArray(list)) return [];
  const strings = (v: unknown, max: number) =>
    (Array.isArray(v) ? v : []).filter((x): x is string => typeof x === "string" && x.trim() !== "").slice(0, max);
  const out: AiSuggestion[] = [];
  for (const entry of list.slice(0, 5)) {
    const e = (entry ?? {}) as Record<string, unknown>;
    const name = typeof e.name === "string" ? e.name.trim().slice(0, 80) : "";
    const ingredients = strings(e.ingredients, 12);
    const steps = strings(e.steps, 10);
    if (!name || ingredients.length === 0 || steps.length === 0) continue;
    const calories = Math.round(toNumber(e.calories, 0));
    if (calories <= 0 || calories > 3000) continue;
    out.push({
      reason: typeof e.reason === "string" ? e.reason.trim().slice(0, 200) : "",
      usesFromPantry: strings(e.uses_from_pantry, 12),
      recipe: {
        name,
        emoji: typeof e.emoji === "string" && e.emoji.trim() ? e.emoji.trim().slice(0, 4) : "🍽️",
        calories,
        prepTime: Math.min(Math.max(Math.round(toNumber(e.prep_minutes, 15)), 1), 240),
        servings: Math.min(Math.max(Math.round(toNumber(e.servings, 1)), 1), 12),
        difficulty: (DIFFICULTIES as readonly string[]).includes(String(e.difficulty))
          ? (e.difficulty as RecipeDetail["difficulty"])
          : "Easy",
        description: typeof e.description === "string" ? e.description.trim().slice(0, 300) : "",
        ingredients,
        steps: steps.map((instruction, i) => ({ step: i + 1, instruction })),
        macros: {
          protein: Math.max(0, Math.round(toNumber(e.protein_g, 0))),
          carbs: Math.max(0, Math.round(toNumber(e.carbs_g, 0))),
          fats: Math.max(0, Math.round(toNumber(e.fats_g, 0))),
        },
        tags: ["AI idea"],
      },
    });
  }
  return out;
};

export const suggestMeals = async (ctx: SuggestionContext): Promise<AiSuggestion[]> => {
  const raw = await invokeAi({
    action: "suggest",
    slot: ctx.slot,
    diets: ctx.diets,
    goal: ctx.goal,
    caloriesLeft: ctx.caloriesLeft,
    pantry: ctx.pantry,
    expiring: ctx.expiring,
  });
  const suggestions = normalizeSuggestions(raw);
  if (suggestions.length === 0) throw new Error("The AI didn't come up with usable ideas. Try again.");
  return suggestions;
};
