import { describe, expect, it } from "vitest";
import {
  currentStreak,
  macroTargets,
  nextMealSlot,
  recommendedCalories,
  toDbMealType,
  weeklyAverageCalories,
} from "./nutrition";

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).toISOString();
const today = new Date(2026, 5, 10, 15); // 10 June 2026

describe("toDbMealType", () => {
  it("keeps valid types, maps brunch to breakfast, falls back to snack", () => {
    expect(toDbMealType("lunch")).toBe("lunch");
    expect(toDbMealType("brunch")).toBe("breakfast");
    expect(toDbMealType("meal")).toBe("snack");
  });
});

describe("macroTargets", () => {
  it("splits 2000 kcal as 30/40/30", () => {
    expect(macroTargets(2000)).toEqual({ protein: 150, carbs: 200, fats: 67 });
  });
});

describe("recommendedCalories", () => {
  const base = {
    weight_kg: 70,
    height_cm: 175,
    date_of_birth: "1996-06-10",
    gender: "male",
    activity_level: "moderately_active",
    health_goal: "maintain_weight",
  };

  it("estimates maintenance calories for a 30 year old man", () => {
    // BMR = 700 + 1093.75 - 150 + 5 = 1648.75; x1.55 = 2555.6 -> 2560
    expect(recommendedCalories(base, today)).toBe(2560);
  });

  it("subtracts for weight loss and never drops below 1200", () => {
    expect(recommendedCalories({ ...base, health_goal: "lose_weight" }, today)).toBe(2060);
    expect(
      recommendedCalories(
        { ...base, weight_kg: 40, height_cm: 150, gender: "female", activity_level: "sedentary", health_goal: "lose_weight" },
        today
      )
    ).toBe(1200);
  });

  it("returns null when body data is missing", () => {
    expect(recommendedCalories({ ...base, weight_kg: null }, today)).toBeNull();
    expect(recommendedCalories(null, today)).toBeNull();
  });
});

describe("currentStreak", () => {
  it("counts consecutive days including today", () => {
    const logs = [{ logged_at: at(2026, 6, 10) }, { logged_at: at(2026, 6, 9) }, { logged_at: at(2026, 6, 8) }];
    expect(currentStreak(logs, today)).toBe(3);
  });

  it("stays alive when today has no log yet", () => {
    const logs = [{ logged_at: at(2026, 6, 9) }, { logged_at: at(2026, 6, 8) }];
    expect(currentStreak(logs, today)).toBe(2);
  });

  it("breaks after a missed day and is zero with no logs", () => {
    expect(currentStreak([{ logged_at: at(2026, 6, 7) }], today)).toBe(0);
    expect(currentStreak([], today)).toBe(0);
  });

  it("counts several logs on one day once", () => {
    const logs = [{ logged_at: at(2026, 6, 10, 8) }, { logged_at: at(2026, 6, 10, 13) }];
    expect(currentStreak(logs, today)).toBe(1);
  });
});

describe("weeklyAverageCalories", () => {
  it("averages daily totals over days with logs in the last 7 days", () => {
    const logs = [
      { logged_at: at(2026, 6, 10, 8), calories: 400 },
      { logged_at: at(2026, 6, 10, 13), calories: 600 },
      { logged_at: at(2026, 6, 9), calories: 1500 },
      { logged_at: at(2026, 5, 1), calories: 9999 },
    ];
    expect(weeklyAverageCalories(logs, today)).toBe(1250);
  });

  it("returns null when nothing is logged", () => {
    expect(weeklyAverageCalories([], today)).toBeNull();
  });
});

describe("nextMealSlot", () => {
  it("picks a slot from the hour", () => {
    expect(nextMealSlot(new Date(2026, 5, 10, 8))).toBe("breakfast");
    expect(nextMealSlot(new Date(2026, 5, 10, 13))).toBe("lunch");
    expect(nextMealSlot(new Date(2026, 5, 10, 19))).toBe("dinner");
    expect(nextMealSlot(new Date(2026, 5, 10, 22))).toBe("snack");
  });
});
