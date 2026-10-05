import { beforeEach, describe, expect, it } from "vitest";
import { daysUntilExpiry } from "./pantry";
import { clearOnboardingDraft, loadOnboardingDraft, saveOnboardingDraft } from "./onboardingDraft";
import { demoStore, endDemo, isDemoActive, startDemo } from "./demoStore";

describe("daysUntilExpiry", () => {
  const now = new Date(2026, 5, 10, 18, 30); // evening of 10 June 2026

  it("counts whole calendar days regardless of time of day", () => {
    expect(daysUntilExpiry("2026-06-10", now)).toBe(0);
    expect(daysUntilExpiry("2026-06-11", now)).toBe(1);
    expect(daysUntilExpiry("2026-06-20", now)).toBe(10);
  });

  it("goes negative once expired and is null without a date", () => {
    expect(daysUntilExpiry("2026-06-08", now)).toBe(-2);
    expect(daysUntilExpiry(null, now)).toBeNull();
    expect(daysUntilExpiry("not-a-date", now)).toBeNull();
  });
});

describe("onboarding draft", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips and clears", () => {
    expect(loadOnboardingDraft()).toBeNull();
    const draft = {
      health_goal: "build_muscle",
      dietary_preferences: ["vegan"],
      breakfast_time: "07:30",
      lunch_time: "12:00",
      dinner_time: "20:00",
    };
    saveOnboardingDraft(draft);
    expect(loadOnboardingDraft()).toEqual(draft);
    clearOnboardingDraft();
    expect(loadOnboardingDraft()).toBeNull();
  });

  it("ignores corrupt data", () => {
    localStorage.setItem("nutrigen_onboarding_draft", "{not json");
    expect(loadOnboardingDraft()).toBeNull();
    localStorage.setItem("nutrigen_onboarding_draft", JSON.stringify({ nope: true }));
    expect(loadOnboardingDraft()).toBeNull();
  });
});

describe("demo store", () => {
  beforeEach(() => {
    endDemo();
    localStorage.clear();
  });

  it("seeds a populated profile, meals and pantry from the onboarding draft", () => {
    startDemo({
      health_goal: "lose_weight",
      dietary_preferences: ["vegetarian"],
      breakfast_time: "07:00",
      lunch_time: "13:00",
      dinner_time: "20:00",
    });
    expect(isDemoActive()).toBe(true);
    expect(demoStore.getProfile().health_goal).toBe("lose_weight");
    expect(demoStore.getProfile().dietary_preferences).toEqual(["vegetarian"]);
    expect(demoStore.getMeals().length).toBeGreaterThanOrEqual(9);
    expect(demoStore.getPantry().length).toBeGreaterThan(5);
  });

  it("adds and removes meals and pantry items", () => {
    startDemo(null);
    const meals = demoStore.getMeals().length;
    const meal = demoStore.addMeal({
      meal_name: "Test",
      meal_type: "snack",
      calories: 100,
      protein_g: 1,
      carbs_g: 1,
      fats_g: 1,
    });
    expect(demoStore.getMeals()).toHaveLength(meals + 1);
    demoStore.deleteMeal(meal.id);
    expect(demoStore.getMeals()).toHaveLength(meals);

    const item = demoStore.addPantryItem({
      name: "Test item",
      category: "other",
      quantity: 1,
      unit: "pcs",
      expiry_date: null,
    });
    expect(demoStore.getPantry()[0].id).toBe(item.id);
    demoStore.deletePantryItem(item.id);
    expect(demoStore.getPantry().find((p) => p.id === item.id)).toBeUndefined();
  });

  it("clears everything when the demo ends", () => {
    startDemo(null);
    endDemo();
    expect(isDemoActive()).toBe(false);
    expect(demoStore.getMeals()).toEqual([]);
  });
});
