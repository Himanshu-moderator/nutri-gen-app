// Demo mode: lets anyone explore every feature without an account. All data
// lives in this browser's localStorage and mirrors the shape of the real
// Supabase tables, so the same screens work for both.

import { subDays, addDays } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import type { OnboardingDraft } from "@/lib/onboardingDraft";

export type DemoProfile = Tables<"profiles">;
export type MealLog = Tables<"meal_logs">;
export type PantryItem = Tables<"pantry_items">;

export const DEMO_USER_ID = "demo-user";

const FLAG = "nutrigen_demo";
const PROFILE = "nutrigen_demo_profile";
const MEALS = "nutrigen_demo_meals";
const PANTRY = "nutrigen_demo_pantry";

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore: demo simply won't persist
  }
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const isDemoActive = () => {
  try {
    return localStorage.getItem(FLAG) === "1";
  } catch {
    return false;
  }
};

const isoAt = (day: Date, hours: number, minutes = 0) => {
  const d = new Date(day);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

const sampleMeals = (): MealLog[] => {
  const now = new Date();
  const m = (
    daysAgo: number,
    hours: number,
    meal_type: string,
    meal_name: string,
    calories: number,
    protein_g: number,
    carbs_g: number,
    fats_g: number
  ): MealLog => ({
    id: uid(),
    user_id: DEMO_USER_ID,
    logged_at: isoAt(subDays(now, daysAgo), hours),
    meal_type,
    meal_name,
    calories,
    protein_g,
    carbs_g,
    fats_g,
    notes: null,
  });

  const rows: MealLog[] = [
    m(1, 8, "breakfast", "Smoothie Bowl", 350, 10, 52, 8),
    m(1, 13, "lunch", "Mediterranean Quinoa Bowl", 420, 22, 52, 14),
    m(1, 19, "dinner", "Chicken Stir Fry", 450, 38, 30, 20),
    m(2, 8, "breakfast", "Egg & Cheese Wrap", 380, 22, 30, 18),
    m(2, 13, "lunch", "Veggie Buddha Bowl", 350, 14, 48, 12),
    m(2, 20, "dinner", "Thai Green Curry", 480, 26, 40, 24),
    m(3, 10, "snack", "Banana & Peanut Butter", 280, 8, 34, 16),
    m(3, 13, "lunch", "Grilled Salmon with Asparagus", 380, 36, 8, 22),
    m(3, 19, "dinner", "Beef Tacos with Guacamole", 520, 32, 40, 26),
  ];

  // Today: only meals whose time has already passed, so the demo never shows
  // a meal logged in the future.
  if (now.getHours() >= 9) {
    rows.push(m(0, 8, "breakfast", "Avocado Toast with Eggs", 420, 18, 35, 26));
  }
  if (now.getHours() >= 14) {
    rows.push(m(0, 13, "lunch", "Grilled Chicken Salad", 380, 42, 12, 18));
  }
  return rows;
};

const samplePantry = (): PantryItem[] => {
  const today = new Date();
  const item = (
    name: string,
    category: string,
    quantity: number,
    unit: string,
    expiresInDays: number | null
  ): PantryItem => ({
    id: uid(),
    user_id: DEMO_USER_ID,
    name,
    category,
    quantity,
    unit,
    expiry_date:
      expiresInDays === null
        ? null
        : addDays(today, expiresInDays).toISOString().slice(0, 10),
    added_at: new Date().toISOString(),
    image_url: null,
  });

  return [
    item("Chicken Breast", "meat", 2, "lbs", 2),
    item("Salmon Fillet", "seafood", 1, "lbs", 1),
    item("Avocados", "fruits", 4, "pcs", 3),
    item("Spinach", "vegetables", 1, "bag", 4),
    item("Greek Yogurt", "dairy", 1, "container", 7),
    item("Eggs", "dairy", 12, "pcs", 10),
    item("Brown Rice", "grains", 2, "lbs", null),
    item("Quinoa", "grains", 1, "bag", null),
    item("Olive Oil", "other", 1, "bottle", null),
  ];
};

const defaultProfile = (draft: OnboardingDraft | null): DemoProfile => {
  const now = new Date().toISOString();
  return {
    id: DEMO_USER_ID,
    user_id: DEMO_USER_ID,
    full_name: "Demo User",
    avatar_url: null,
    height_cm: 172,
    weight_kg: 70,
    date_of_birth: "1996-01-15",
    gender: "prefer_not_to_say",
    activity_level: "moderately_active",
    health_goal: draft?.health_goal || "improve_health",
    dietary_preferences: draft?.dietary_preferences ?? [],
    allergies: [],
    breakfast_time: draft?.breakfast_time || "08:00",
    lunch_time: draft?.lunch_time || "12:30",
    dinner_time: draft?.dinner_time || "19:00",
    daily_calorie_target: 2000,
    trial_started_at: now,
    trial_ends_at: addDays(new Date(), 20).toISOString(),
    is_subscribed: false,
    onboarding_completed: true,
    created_at: now,
    updated_at: now,
  };
};

export const startDemo = (draft: OnboardingDraft | null) => {
  write(PROFILE, defaultProfile(draft));
  write(MEALS, sampleMeals());
  write(PANTRY, samplePantry());
  try {
    localStorage.setItem(FLAG, "1");
  } catch {
    // ignore
  }
};

export const endDemo = () => {
  try {
    [FLAG, PROFILE, MEALS, PANTRY].forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
};

export const demoStore = {
  getProfile: (): DemoProfile => read<DemoProfile>(PROFILE, defaultProfile(null)),

  updateProfile: (updates: Partial<DemoProfile>): DemoProfile => {
    const next = { ...demoStore.getProfile(), ...updates, updated_at: new Date().toISOString() };
    write(PROFILE, next);
    return next;
  },

  getMeals: (): MealLog[] => read<MealLog[]>(MEALS, []),

  addMeal: (meal: Omit<MealLog, "id" | "user_id" | "logged_at" | "notes"> & { logged_at?: string; notes?: string | null }): MealLog => {
    const row: MealLog = {
      id: uid(),
      user_id: DEMO_USER_ID,
      logged_at: meal.logged_at ?? new Date().toISOString(),
      notes: meal.notes ?? null,
      meal_name: meal.meal_name,
      meal_type: meal.meal_type,
      calories: meal.calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fats_g: meal.fats_g,
    };
    write(MEALS, [...demoStore.getMeals(), row]);
    return row;
  },

  deleteMeal: (id: string) => {
    write(MEALS, demoStore.getMeals().filter((m) => m.id !== id));
  },

  getPantry: (): PantryItem[] => read<PantryItem[]>(PANTRY, []),

  addPantryItem: (
    item: Pick<PantryItem, "name" | "category" | "quantity" | "unit" | "expiry_date">
  ): PantryItem => {
    const row: PantryItem = {
      id: uid(),
      user_id: DEMO_USER_ID,
      added_at: new Date().toISOString(),
      image_url: null,
      ...item,
    };
    write(PANTRY, [row, ...demoStore.getPantry()]);
    return row;
  },

  deletePantryItem: (id: string) => {
    write(PANTRY, demoStore.getPantry().filter((p) => p.id !== id));
  },
};

// Sample data that real (signed-in) users can optionally load from empty
// states, so reviewers can see the app populated without typing everything.
export const samplePantryRows = () =>
  samplePantry().map(({ name, category, quantity, unit, expiry_date }) => ({
    name,
    category,
    quantity,
    unit,
    expiry_date,
  }));

export const sampleMealRows = () =>
  sampleMeals().map(
    ({ meal_name, meal_type, calories, protein_g, carbs_g, fats_g, logged_at }) => ({
      meal_name,
      meal_type,
      calories,
      protein_g,
      carbs_g,
      fats_g,
      logged_at,
    })
  );

export const COMMON_PANTRY_ITEMS: Array<{
  name: string;
  category: string;
  quantity: number;
  unit: string;
}> = [
  { name: "Eggs", category: "dairy", quantity: 12, unit: "pcs" },
  { name: "Milk", category: "dairy", quantity: 1, unit: "bottle" },
  { name: "Chicken Breast", category: "meat", quantity: 1, unit: "lbs" },
  { name: "Rice", category: "grains", quantity: 1, unit: "bag" },
  { name: "Bananas", category: "fruits", quantity: 6, unit: "pcs" },
  { name: "Spinach", category: "vegetables", quantity: 1, unit: "bag" },
  { name: "Tomatoes", category: "vegetables", quantity: 4, unit: "pcs" },
  { name: "Olive Oil", category: "other", quantity: 1, unit: "bottle" },
];
