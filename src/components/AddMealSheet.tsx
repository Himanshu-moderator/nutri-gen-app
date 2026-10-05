import { useEffect, useState } from "react";
import { nextMealSlot } from "@/lib/nutrition";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Flame, Clock, ChefHat, Coffee, Sun, Moon, Cookie, Sandwich, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import RecipeDetailSheet from "@/components/RecipeDetailSheet";
import { quickMealRecipes } from "@/data/mockRecipes";
import type { RecipeDetail } from "@/components/RecipeDetailSheet";

interface QuickMeal {
  id: string;
  name: string;
  emoji: string;
  calories: number;
  prepTime: number;
  protein: number;
  carbs: number;
  fats: number;
}

const mealTypes = [
  { value: "snack", label: "Snack", icon: Cookie, emoji: "🍪" },
  { value: "brunch", label: "Brunch", icon: Sandwich, emoji: "🥞" },
  { value: "breakfast", label: "Breakfast", icon: Coffee, emoji: "☕" },
  { value: "lunch", label: "Lunch", icon: Sun, emoji: "🌤️" },
  { value: "dinner", label: "Dinner", icon: Moon, emoji: "🌙" },
];

const quickMeals: QuickMeal[] = [
  { id: "q1", name: "Protein Shake", emoji: "🥤", calories: 180, prepTime: 2, protein: 25, carbs: 10, fats: 3 },
  { id: "q2", name: "Greek Yogurt & Berries", emoji: "🫐", calories: 150, prepTime: 3, protein: 12, carbs: 18, fats: 4 },
  { id: "q3", name: "Trail Mix", emoji: "🥜", calories: 220, prepTime: 1, protein: 6, carbs: 24, fats: 14 },
  { id: "q4", name: "Banana & Peanut Butter", emoji: "🍌", calories: 280, prepTime: 2, protein: 8, carbs: 34, fats: 16 },
  { id: "q5", name: "Avocado Toast", emoji: "🥑", calories: 320, prepTime: 5, protein: 8, carbs: 28, fats: 18 },
  { id: "q6", name: "Smoothie Bowl", emoji: "🥣", calories: 350, prepTime: 8, protein: 10, carbs: 52, fats: 8 },
  { id: "q7", name: "Hummus & Veggies", emoji: "🥕", calories: 160, prepTime: 3, protein: 6, carbs: 20, fats: 8 },
  { id: "q8", name: "Rice Cake with Almond Butter", emoji: "🍘", calories: 190, prepTime: 2, protein: 5, carbs: 22, fats: 10 },
  { id: "q9", name: "Egg & Cheese Wrap", emoji: "🌯", calories: 380, prepTime: 7, protein: 22, carbs: 30, fats: 18 },
  { id: "q10", name: "Fruit Salad", emoji: "🍇", calories: 120, prepTime: 5, protein: 2, carbs: 30, fats: 1 },
];

interface AddMealSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMealAdded?: (meal: { name: string; calories: number; type: string; protein: number; carbs: number; fats: number }) => void | Promise<void>;
}

const AddMealSheet = ({ open, onOpenChange, onMealAdded }: AddMealSheetProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("snack");
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [recipeSheetOpen, setRecipeSheetOpen] = useState(false);
  const [pendingMeal, setPendingMeal] = useState<QuickMeal | null>(null);
  const { toast } = useToast();

  const filteredMeals = quickMeals.filter((meal) =>
    meal.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({ name: "", calories: "", protein: "", carbs: "", fats: "" });
  const [saving, setSaving] = useState(false);

  // Start on the meal that fits the time of day each time the sheet opens.
  useEffect(() => {
    if (open) {
      setSelectedType(nextMealSlot());
      setShowCustom(false);
    }
  }, [open]);

  const logMeal = async (meal: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }) => {
    if (saving) return;
    setSaving(true);
    try {
      await onMealAdded?.({ ...meal, type: selectedType });
      toast({
        title: "Meal added! 🎉",
        description: `${meal.name} (${meal.calories} cal) added as ${selectedType}`,
      });
      setRecipeSheetOpen(false);
      onOpenChange(false);
      setSearchQuery("");
      setPendingMeal(null);
      setCustom({ name: "", calories: "", protein: "", carbs: "", fats: "" });
    } catch (error) {
      toast({
        title: "Couldn't add meal",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddMeal = (meal: QuickMeal) =>
    logMeal({
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
    });

  const handleAddCustom = () => {
    const calories = Number(custom.calories);
    const name = custom.name.trim();
    if (!name || !Number.isFinite(calories) || calories <= 0 || calories > 5000) {
      toast({
        title: "Check the details",
        description: "Give the meal a name and calories between 1 and 5000.",
        variant: "destructive",
      });
      return;
    }
    const grams = (v: string) => Math.max(0, Math.min(Number(v) || 0, 500));
    logMeal({
      name,
      calories,
      protein: grams(custom.protein),
      carbs: grams(custom.carbs),
      fats: grams(custom.fats),
    });
  };

  const handleViewRecipe = (meal: QuickMeal) => {
    const recipe = quickMealRecipes[meal.name];
    if (recipe) {
      setSelectedRecipe(recipe);
      setPendingMeal(meal);
      setRecipeSheetOpen(true);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl p-0 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="px-5 sm:px-6 pt-6 pb-4 space-y-5">
              <SheetHeader>
                <SheetTitle className="text-xl font-bold text-left">Add a Meal</SheetTitle>
                <p className="text-sm text-muted-foreground text-left">
                  Pick a meal type and search for recipes
                </p>
              </SheetHeader>

              {/* Meal Type Selector */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                {mealTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                      selectedType === type.value
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <span>{type.emoji}</span>
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>

              {/* Results */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {searchQuery ? "Search Results" : "Popular Picks"}
                </p>
                <AnimatePresence mode="popLayout">
                  {filteredMeals.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm">No meals found. Try a different search.</p>
                    </div>
                  ) : (
                    filteredMeals.map((meal, index) => (
                      <motion.div
                        key={meal.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card
                          className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                          onClick={() => handleViewRecipe(meal)}
                        >
                          <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                            <div className="text-3xl sm:text-4xl shrink-0">{meal.emoji}</div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-base truncate">{meal.name}</h3>
                              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Flame className="h-3.5 w-3.5 text-primary" />
                                  {meal.calories} cal
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {meal.prepTime}m
                                </span>
                              </div>
                              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                                <span>P: {meal.protein}g</span>
                                <span>C: {meal.carbs}g</span>
                                <span>F: {meal.fats}g</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="rounded-full h-9 w-9 sm:h-10 sm:w-10 bg-primary/10 text-primary hover:bg-primary/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddMeal(meal);
                                }}
                              >
                                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Custom meal */}
              <div className="rounded-2xl border border-dashed border-border p-4 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustom((v) => !v);
                    if (!showCustom && searchQuery && !custom.name) {
                      setCustom((c) => ({ ...c, name: searchQuery }));
                    }
                  }}
                  className="flex w-full items-center justify-between text-sm font-medium"
                >
                  <span>Can't find it? Add your own meal</span>
                  <Plus className={`h-4 w-4 transition-transform ${showCustom ? "rotate-45" : ""}`} />
                </button>
                {showCustom && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Meal name"
                      aria-label="Meal name"
                      value={custom.name}
                      maxLength={80}
                      onChange={(e) => setCustom({ ...custom, name: e.target.value })}
                    />
                    <div className="grid grid-cols-4 gap-2">
                      {([
                        ["calories", "Calories"],
                        ["protein", "Protein g"],
                        ["carbs", "Carbs g"],
                        ["fats", "Fats g"],
                      ] as const).map(([field, label]) => (
                        <Input
                          key={field}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          placeholder={label}
                          aria-label={label}
                          value={custom[field]}
                          onChange={(e) => setCustom({ ...custom, [field]: e.target.value })}
                        />
                      ))}
                    </div>
                    <Button className="w-full" onClick={handleAddCustom} disabled={saving}>
                      {saving ? "Adding..." : `Log as ${selectedType}`}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <RecipeDetailSheet
        recipe={selectedRecipe}
        open={recipeSheetOpen}
        onOpenChange={setRecipeSheetOpen}
        showAddButton
        onAddToToday={() => {
          if (pendingMeal) handleAddMeal(pendingMeal);
        }}
      />
    </>
  );
};

export default AddMealSheet;