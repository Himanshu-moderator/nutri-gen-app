import { dayKey } from "@/lib/nutrition";

// Built-in knowledge of common foods: category, typical unit and how many days
// they keep. It powers "auto-fill" instantly and offline, and is the fallback
// whenever the AI service isn't reachable. First matching rule wins, so more
// specific rules come first.
interface Rule {
  words: string[];
  category: string;
  days: number | null;
  unit?: string;
}

const RULES: Rule[] = [
  { words: ["frozen", "ice cream"], category: "frozen", days: 90 },
  { words: ["canned", "tinned", "tin of"], category: "canned", days: 365 },
  { words: ["almond milk", "oat milk", "soy milk", "coconut milk", "juice"], category: "beverages", days: 7, unit: "bottle" },
  { words: ["coffee", "tea", "soda", "cola", "sparkling", "water"], category: "beverages", days: 180, unit: "bottle" },
  { words: ["milk"], category: "dairy", days: 7, unit: "bottle" },
  { words: ["yogurt", "yoghurt", "curd", "dahi", "kefir"], category: "dairy", days: 10, unit: "container" },
  { words: ["paneer", "cottage cheese", "cream"], category: "dairy", days: 7, unit: "container" },
  { words: ["cheese"], category: "dairy", days: 21, unit: "container" },
  { words: ["butter", "ghee"], category: "dairy", days: 30, unit: "container" },
  { words: ["egg"], category: "dairy", days: 21, unit: "pcs" },
  { words: ["salmon", "tuna", "fish", "prawn", "shrimp", "crab", "squid"], category: "seafood", days: 2, unit: "kg" },
  { words: ["chicken", "mutton", "lamb", "beef", "pork", "turkey", "bacon", "sausage", "mince", "ham"], category: "meat", days: 3, unit: "kg" },
  { words: ["bread", "bun", "tortilla", "roti", "naan", "pita", "bagel"], category: "grains", days: 5, unit: "bag" },
  { words: ["rice", "pasta", "flour", "atta", "oats", "quinoa", "noodle", "cereal", "couscous", "millet", "lentil", "dal", "chickpea", "rajma"], category: "grains", days: 365, unit: "kg" },
  { words: ["black pepper", "chilli powder", "chili powder", "turmeric", "cumin", "masala", "cinnamon", "oregano", "paprika", "spice", "salt", "cardamom", "clove"], category: "spices", days: 365 },
  { words: ["almond", "cashew", "peanut", "walnut", "pistachio", "raisin", "chips", "cracker", "biscuit", "cookie", "chocolate", "popcorn", "granola", "protein bar"], category: "snacks", days: 120, unit: "bag" },
  { words: ["sauce", "ketchup", "jam", "pickle", "puree", "hummus", "mayo", "mustard", "vinegar"], category: "canned", days: 180, unit: "bottle" },
  { words: ["spinach", "lettuce", "coriander", "cilantro", "mint", "parsley", "basil", "kale", "herb", "microgreen"], category: "vegetables", days: 4, unit: "bag" },
  { words: ["onion", "potato", "garlic", "pumpkin", "sweet potato", "squash"], category: "vegetables", days: 30, unit: "kg" },
  { words: ["ginger", "carrot", "beetroot", "celery", "radish"], category: "vegetables", days: 14, unit: "kg" },
  { words: ["tomato", "cucumber", "capsicum", "bell pepper", "chilli", "zucchini", "eggplant", "brinjal", "okra", "mushroom", "broccoli", "cauliflower", "cabbage", "peas", "beans", "corn", "asparagus", "vegetable"], category: "vegetables", days: 7, unit: "kg" },
  { words: ["banana", "mango", "avocado", "papaya", "berry", "strawberr", "blueberr", "raspberr"], category: "fruits", days: 5, unit: "pcs" },
  { words: ["apple", "orange", "lemon", "lime", "grape", "pear", "peach", "plum", "kiwi", "pomegranate", "pineapple", "melon", "fruit", "guava", "cherry"], category: "fruits", days: 10, unit: "pcs" },
  { words: ["oil", "honey", "sugar", "jaggery", "syrup"], category: "other", days: 365 },
];

export interface PantrySuggestion {
  category: string;
  unit: string;
  expiry_date: string | null;
  // False when we had no idea what the item is (category falls back to "other").
  recognised: boolean;
}

export const addDaysKey = (days: number, from: Date = new Date()): string => {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
  return dayKey(d);
};

export const suggestPantryDetails = (name: string, now: Date = new Date()): PantrySuggestion => {
  const lower = name.toLowerCase().trim();
  const rule = lower ? RULES.find((r) => r.words.some((w) => lower.includes(w))) : undefined;
  if (!rule) return { category: "other", unit: "pcs", expiry_date: null, recognised: false };
  return {
    category: rule.category,
    unit: rule.unit ?? "pcs",
    expiry_date: rule.days ? addDaysKey(rule.days, now) : null,
    recognised: true,
  };
};
