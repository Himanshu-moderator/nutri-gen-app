import { format, subDays, startOfDay, endOfDay } from "date-fns";

export const DB_MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type DbMealType = (typeof DB_MEAL_TYPES)[number];

// The meal_logs table only accepts four meal types, while the UI also offers
// "brunch". Brunch is stored as breakfast so logging never fails.
export const toDbMealType = (type: string): DbMealType => {
  if ((DB_MEAL_TYPES as readonly string[]).includes(type)) return type as DbMealType;
  if (type === "brunch") return "breakfast";
  return "snack";
};

export const dayKey = (date: Date) => format(date, "yyyy-MM-dd");

export const dayBounds = (date: Date) => ({
  from: startOfDay(date).toISOString(),
  to: endOfDay(date).toISOString(),
});

export interface MacroTotals {
  protein: number;
  carbs: number;
  fats: number;
}

// Split of daily calories across macros: 30% protein, 40% carbs, 30% fat.
export const macroTargets = (calorieTarget: number): MacroTotals => ({
  protein: Math.round((calorieTarget * 0.3) / 4),
  carbs: Math.round((calorieTarget * 0.4) / 4),
  fats: Math.round((calorieTarget * 0.3) / 9),
});

interface BodyProfile {
  weight_kg: number | null;
  height_cm: number | null;
  date_of_birth: string | null;
  gender: string | null;
  activity_level: string | null;
  health_goal: string | null;
}

const ACTIVITY_MULTIPLIER: Record<string, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

const GOAL_ADJUSTMENT: Record<string, number> = {
  lose_weight: -500,
  gain_weight: 400,
  build_muscle: 300,
  maintain_weight: 0,
  improve_health: 0,
};

const ageFrom = (dob: string, now: Date) => {
  const birth = new Date(dob);
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
};

// Mifflin-St Jeor estimate scaled by activity level and nudged by goal.
// Returns null until the profile has enough information to be meaningful.
export const recommendedCalories = (
  profile: BodyProfile | null | undefined,
  now: Date = new Date()
): number | null => {
  if (!profile) return null;
  const { weight_kg, height_cm, date_of_birth, gender, activity_level, health_goal } = profile;
  if (!weight_kg || !height_cm || !date_of_birth) return null;

  const age = ageFrom(date_of_birth, now);
  if (!Number.isFinite(age) || age < 10 || age > 110) return null;

  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  const sexOffset = gender === "male" ? 5 : gender === "female" ? -161 : -78;
  const bmr = base + sexOffset;

  const multiplier = ACTIVITY_MULTIPLIER[activity_level ?? ""] ?? 1.375;
  const adjustment = GOAL_ADJUSTMENT[health_goal ?? ""] ?? 0;
  const target = bmr * multiplier + adjustment;

  return Math.max(1200, Math.round(target / 10) * 10);
};

interface LoggedAt {
  logged_at: string;
}

export const currentStreak = (logs: LoggedAt[], today: Date = new Date()): number => {
  const days = new Set(logs.map((l) => dayKey(new Date(l.logged_at))));
  let cursor = today;
  // A streak stays alive until a full day passes without logging, so start
  // from yesterday when nothing has been logged yet today.
  if (!days.has(dayKey(cursor))) cursor = subDays(cursor, 1);

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
};

interface CalorieLog extends LoggedAt {
  calories: number | null;
}

// Average calories per day over the last 7 days, counting only days with logs.
export const weeklyAverageCalories = (
  logs: CalorieLog[],
  today: Date = new Date()
): number | null => {
  const windowStart = startOfDay(subDays(today, 6)).getTime();
  const totals = new Map<string, number>();
  for (const log of logs) {
    const at = new Date(log.logged_at);
    if (at.getTime() < windowStart || at.getTime() > endOfDay(today).getTime()) continue;
    const key = dayKey(at);
    totals.set(key, (totals.get(key) ?? 0) + (log.calories ?? 0));
  }
  if (totals.size === 0) return null;
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  return Math.round(sum / totals.size);
};

export const nextMealSlot = (now: Date = new Date()): "breakfast" | "lunch" | "dinner" | "snack" => {
  const h = now.getHours();
  if (h < 10) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 21) return "dinner";
  return "snack";
};
