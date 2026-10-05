import { recipeDetails, quickMealRecipes } from "@/data/mockRecipes";
import type { RecipeDetail } from "@/components/RecipeDetailSheet";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export interface LibraryRecipe {
  id: string;
  mealTypes: MealSlot[];
  recipe: RecipeDetail;
}

// Which meals each built-in recipe suits.
const SLOTS: Record<string, MealSlot[]> = {
  "Avocado Toast with Eggs": ["breakfast"],
  "Grilled Chicken Salad": ["lunch"],
  "Suggested: Salmon with Veggies": ["dinner"],
  "Mediterranean Quinoa Bowl": ["lunch"],
  "Grilled Salmon with Asparagus": ["lunch", "dinner"],
  "Chicken Stir Fry": ["lunch", "dinner"],
  "Veggie Buddha Bowl": ["lunch", "dinner"],
  "Beef Tacos with Guacamole": ["dinner"],
  "Thai Green Curry": ["dinner"],
  "Protein Shake": ["breakfast", "snack"],
  "Greek Yogurt & Berries": ["breakfast", "snack"],
  "Trail Mix": ["snack"],
  "Banana & Peanut Butter": ["breakfast", "snack"],
  "Avocado Toast": ["breakfast", "snack"],
  "Smoothie Bowl": ["breakfast"],
  "Hummus & Veggies": ["snack"],
  "Rice Cake with Almond Butter": ["snack"],
  "Egg & Cheese Wrap": ["breakfast", "lunch"],
  "Fruit Salad": ["breakfast", "snack"],
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const RECIPE_LIBRARY: LibraryRecipe[] = [
  ...Object.entries(recipeDetails),
  ...Object.entries(quickMealRecipes),
].map(([key, recipe]) => ({
  id: slug(recipe.name),
  mealTypes: SLOTS[key] ?? ["snack"],
  recipe,
}));

// Finds a recipe by its library key or display name (case-insensitive), so
// logged meals can show their recipe preview.
export const findRecipe = (name: string): RecipeDetail | null => {
  const needle = name.trim().toLowerCase();
  const direct = [recipeDetails, quickMealRecipes]
    .flatMap((group) => Object.entries(group))
    .find(([key, r]) => key.toLowerCase() === needle || r.name.toLowerCase() === needle);
  return direct ? direct[1] : null;
};

// ---------------------------------------------------------------- diets

const MEAT = /\b(chicken|beef|pork|bacon|ham|turkey|lamb|sausage)\b/;
const FISH = /\b(salmon|fish|tuna|shrimp|prawns?|anchov\w*)\b/;
const EGG = /\beggs?\b/;
const HONEY = /\bhoney\b/;
const DAIRY_WORD = /\b(cheese|yogurt|yoghurt|milk|butter|cream|whey)\b/;
const NOT_DAIRY = /\b(almond|coconut|oat|soy|peanut|cocoa)\s+(milk|butter)\b/g;
const GLUTEN = /\b(bread|sourdough|flour|pasta|noodles?|soy sauce|granola|wheat|couscous|barley)\b/;
const NON_HALAL = /\b(pork|bacon|ham|wine|beer|rum|gelatin)\b/;

const ingredientText = (r: RecipeDetail) => r.ingredients.join(" | ").toLowerCase();

const hasDairy = (text: string) => DAIRY_WORD.test(text.replace(NOT_DAIRY, ""));

const hasGluten = (text: string) =>
  GLUTEN.test(text) || /\bflour tortilla\b/.test(text) || /\btortilla\b/.test(text.replace(/\bcorn tortillas?\b/g, ""));

const RULES: Record<string, (r: RecipeDetail, text: string) => boolean> = {
  vegetarian: (_r, t) => !MEAT.test(t) && !FISH.test(t),
  vegan: (_r, t) => !MEAT.test(t) && !FISH.test(t) && !EGG.test(t) && !HONEY.test(t) && !hasDairy(t),
  dairy_free: (_r, t) => !hasDairy(t),
  gluten_free: (_r, t) => !hasGluten(t),
  keto: (r) => r.macros.carbs <= 20,
  halal: (_r, t) => !NON_HALAL.test(t),
};

// Diets we can actually check against recipe data. Others (paleo, kosher)
// would need certification-level data, so we say so instead of guessing.
export const SUPPORTED_DIETS = Object.keys(RULES);

export const unsupportedDiets = (diets: string[]) => diets.filter((d) => !(d in RULES));

export const matchesDiets = (recipe: RecipeDetail, diets: string[]): boolean => {
  const text = ingredientText(recipe);
  return diets.every((d) => !(d in RULES) || RULES[d](recipe, text));
};

// -------------------------------------------------------------- pantry

const singular = (word: string) =>
  word.length > 3 && word.endsWith("es") && !word.endsWith("ies") && /(ch|sh|x|s|o)es$/.test(word)
    ? word.slice(0, -2)
    : word.length > 3 && word.endsWith("s") && !word.endsWith("ss")
    ? word.slice(0, -1)
    : word;

const tokens = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .map(singular);

const PLANT_PHRASE = /\b(almond|coconut|oat|soy|peanut)\s+(milk|butter)\b/;

// Pantry items (by name) that appear in the recipe's ingredient list.
export const pantryMatches = (recipe: RecipeDetail, pantryNames: string[]): string[] => {
  const ingredientTokenSets = recipe.ingredients.map((line) => ({
    tokens: new Set(tokens(line)),
    plantPhrase: PLANT_PHRASE.test(line.toLowerCase()),
  }));

  return pantryNames.filter((name) => {
    const itemTokens = tokens(name);
    if (itemTokens.length === 0) return false;
    const plain = name.trim().toLowerCase();
    return ingredientTokenSets.some(({ tokens: t, plantPhrase }) => {
      // "milk" in the pantry shouldn't count for almond or coconut milk.
      if (plantPhrase && (plain === "milk" || plain === "butter")) return false;
      return itemTokens.every((tok) => t.has(tok));
    });
  });
};

// ------------------------------------------------------ recommendations

export interface RankedRecipe extends LibraryRecipe {
  pantryMatchNames: string[];
  fitsCalories: boolean;
}

interface RankOptions {
  slot?: MealSlot;
  diets?: string[];
  pantryNames?: string[];
  remainingCalories?: number | null;
  preferPantry?: boolean;
}

// Recipes for a meal slot, filtered by diet and ordered so the best fit
// comes first: uses more of the pantry, then fits the remaining calories.
export const rankRecipes = ({
  slot,
  diets = [],
  pantryNames = [],
  remainingCalories = null,
  preferPantry = true,
}: RankOptions): RankedRecipe[] => {
  const ranked = RECIPE_LIBRARY.filter((item) => !slot || item.mealTypes.includes(slot))
    .filter((item) => matchesDiets(item.recipe, diets))
    .map((item, index) => ({
      ...item,
      index,
      pantryMatchNames: pantryMatches(item.recipe, pantryNames),
      fitsCalories: remainingCalories === null || item.recipe.calories <= remainingCalories,
    }));

  ranked.sort((a, b) => {
    if (a.fitsCalories !== b.fitsCalories) return a.fitsCalories ? -1 : 1;
    if (preferPantry && a.pantryMatchNames.length !== b.pantryMatchNames.length) {
      return b.pantryMatchNames.length - a.pantryMatchNames.length;
    }
    return a.index - b.index;
  });

  return ranked.map(({ index: _index, ...rest }) => rest);
};
