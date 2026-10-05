import { describe, expect, it } from "vitest";
import { RECIPE_LIBRARY, findRecipe, matchesDiets, pantryMatches, rankRecipes, unsupportedDiets } from "./recipes";

const byName = (name: string) => {
  const found = RECIPE_LIBRARY.find((r) => r.recipe.name === name);
  if (!found) throw new Error(`missing recipe ${name}`);
  return found.recipe;
};

describe("diet filtering", () => {
  it("vegetarian excludes meat and fish but keeps eggs and dairy", () => {
    expect(matchesDiets(byName("Grilled Chicken Salad"), ["vegetarian"])).toBe(false);
    expect(matchesDiets(byName("Salmon with Roasted Veggies"), ["vegetarian"])).toBe(false);
    expect(matchesDiets(byName("Avocado Toast with Eggs"), ["vegetarian"])).toBe(true);
    expect(matchesDiets(byName("Mediterranean Quinoa Bowl"), ["vegetarian"])).toBe(true);
  });

  it("vegan also excludes eggs, dairy and honey", () => {
    expect(matchesDiets(byName("Avocado Toast with Eggs"), ["vegan"])).toBe(false);
    expect(matchesDiets(byName("Mediterranean Quinoa Bowl"), ["vegan"])).toBe(false); // feta
    expect(matchesDiets(byName("Greek Yogurt & Berries"), ["vegan"])).toBe(false);
    expect(matchesDiets(byName("Hummus & Veggies"), ["vegan"])).toBe(true);
    expect(matchesDiets(byName("Smoothie Bowl"), ["vegan"])).toBe(true);
    expect(matchesDiets(byName("Smoothie Bowl"), ["gluten_free"])).toBe(false); // granola
  });

  it("plant milks and nut butters are not dairy", () => {
    expect(matchesDiets(byName("Banana & Peanut Butter"), ["dairy_free"])).toBe(true);
    expect(matchesDiets(byName("Trail Mix"), ["dairy_free"])).toBe(true);
    expect(matchesDiets(byName("Egg & Cheese Wrap"), ["dairy_free"])).toBe(false);
  });

  it("gluten free treats corn tortillas as fine and flour tortillas as not", () => {
    expect(matchesDiets(byName("Beef Tacos with Guacamole"), ["gluten_free"])).toBe(true);
    expect(matchesDiets(byName("Egg & Cheese Wrap"), ["gluten_free"])).toBe(false);
    expect(matchesDiets(byName("Avocado Toast with Eggs"), ["gluten_free"])).toBe(false);
  });

  it("keto uses a carb limit, and combined diets must all pass", () => {
    expect(matchesDiets(byName("Grilled Chicken Salad"), ["keto"])).toBe(true);
    expect(matchesDiets(byName("Smoothie Bowl"), ["keto"])).toBe(false);
    expect(matchesDiets(byName("Grilled Chicken Salad"), ["keto", "vegetarian"])).toBe(false);
  });

  it("reports diets it cannot verify", () => {
    expect(unsupportedDiets(["vegan", "paleo", "kosher"])).toEqual(["paleo", "kosher"]);
    expect(matchesDiets(byName("Grilled Chicken Salad"), ["paleo"])).toBe(true);
  });
});

describe("pantryMatches", () => {
  it("matches names across plurals and word order", () => {
    const recipe = byName("Avocado Toast with Eggs");
    expect(pantryMatches(recipe, ["Eggs", "Avocados", "Olive Oil", "Brown Rice"]).sort()).toEqual(
      ["Avocados", "Eggs", "Olive Oil"].sort()
    );
  });

  it("does not treat plant milks as milk", () => {
    expect(pantryMatches(byName("Protein Shake"), ["Milk"])).toEqual([]);
    expect(pantryMatches(byName("Protein Shake"), ["Almond Milk"])).toEqual(["Almond Milk"]);
  });
});

describe("rankRecipes", () => {
  it("only returns recipes for the slot and diet", () => {
    const dinners = rankRecipes({ slot: "dinner", diets: ["vegetarian"] });
    expect(dinners.length).toBeGreaterThan(0);
    expect(dinners.every((r) => r.mealTypes.includes("dinner"))).toBe(true);
    expect(dinners.every((r) => matchesDiets(r.recipe, ["vegetarian"]))).toBe(true);
  });

  it("puts recipes that use more pantry items first", () => {
    const ranked = rankRecipes({ slot: "dinner", pantryNames: ["Salmon Fillet", "Olive Oil", "Garlic"] });
    expect(ranked[0].recipe.name).toMatch(/Salmon/);
    expect(ranked[0].pantryMatchNames.length).toBeGreaterThanOrEqual(2);
  });

  it("prefers recipes that fit the remaining calories", () => {
    const ranked = rankRecipes({ slot: "dinner", remainingCalories: 400 });
    const firstOver = ranked.findIndex((r) => !r.fitsCalories);
    const lastFit = ranked.map((r) => r.fitsCalories).lastIndexOf(true);
    expect(firstOver === -1 || firstOver > lastFit).toBe(true);
  });
});

describe("findRecipe", () => {
  it("finds recipes by key or display name", () => {
    expect(findRecipe("Suggested: Salmon with Veggies")?.name).toBe("Salmon with Roasted Veggies");
    expect(findRecipe("salmon with roasted veggies")?.name).toBe("Salmon with Roasted Veggies");
    expect(findRecipe("Unknown meal")).toBeNull();
  });
});
