import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Clock, ChefHat, Flame, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/AppLayout";
import { useProfile } from "@/hooks/useProfile";
import { usePantry } from "@/hooks/usePantry";
import { useMealLogs } from "@/hooks/useMealLogs";
import { useToast } from "@/hooks/use-toast";
import { PREFER_PANTRY_KEY, useLocalPreference } from "@/hooks/useLocalPreference";
import RecipeDetailSheet from "@/components/RecipeDetailSheet";
import AiMealIdeas from "@/components/AiMealIdeas";
import type { RecipeDetail } from "@/components/RecipeDetailSheet";
import { rankRecipes, unsupportedDiets, type MealSlot } from "@/lib/recipes";

const difficultyColors = {
  Easy: "text-secondary bg-secondary/10",
  Medium: "text-warning bg-warning/10",
  Hard: "text-destructive bg-destructive/10",
};

const dietLabel = (diet: string) => diet.replace(/_/g, " ");

const Meals = () => {
  const [activeTab, setActiveTab] = useState<MealSlot>("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const [matchDiet, setMatchDiet] = useState(true);
  const [preferPantry] = useLocalPreference(PREFER_PANTRY_KEY, true);
  const { profile } = useProfile();
  const { items: pantryItems } = usePantry();
  const { addMeal } = useMealLogs();
  const { toast } = useToast();
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [recipeSheetOpen, setRecipeSheetOpen] = useState(false);

  const diets = useMemo(() => profile?.dietary_preferences ?? [], [profile?.dietary_preferences]);
  const pantryNames = useMemo(() => pantryItems.map((p) => p.name), [pantryItems]);
  const cannotFilter = unsupportedDiets(diets);

  const ranked = useMemo(
    () =>
      rankRecipes({
        slot: activeTab,
        diets: matchDiet ? diets : [],
        pantryNames,
        preferPantry,
      }),
    [activeTab, matchDiet, diets, pantryNames, preferPantry]
  );

  const filtered = ranked
    .filter(({ recipe }) => recipe.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    .filter(({ recipe }) => difficultyFilter === "All" || recipe.difficulty === difficultyFilter);

  const topPick = ranked[0];

  const openRecipe = (recipe: RecipeDetail) => {
    setSelectedRecipe(recipe);
    setRecipeSheetOpen(true);
  };

  const addToToday = async (recipe: RecipeDetail) => {
    try {
      await addMeal.mutateAsync({
        meal_name: recipe.name,
        meal_type: activeTab,
        calories: recipe.calories,
        protein_g: recipe.macros.protein,
        carbs_g: recipe.macros.carbs,
        fats_g: recipe.macros.fats,
      });
      toast({ title: "Meal added! 🎉", description: `${recipe.name} logged as ${activeTab}.` });
    } catch (error) {
      toast({
        title: "Couldn't add meal",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const pickReason = topPick
    ? topPick.pantryMatchNames.length > 0
      ? `It uses ${topPick.pantryMatchNames.length} item${topPick.pantryMatchNames.length === 1 ? "" : "s"} from your pantry (${topPick.pantryMatchNames
          .slice(0, 3)
          .join(", ")}).`
      : matchDiet && diets.length > 0
      ? `It fits your ${diets.map(dietLabel).join(", ")} preferences.`
      : "A balanced, popular choice for this meal."
    : "";

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4 space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Meal Ideas</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Matched to your diet and what's in your pantry
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search meals..."
            aria-label="Search meals"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-12 h-11 sm:h-12 rounded-xl"
          />
        </motion.div>

        {/* Difficulty Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 flex-wrap"
        >
          {(["All", "Easy", "Medium", "Hard"] as const).map((level) => (
            <Button
              key={level}
              variant={difficultyFilter === level ? "default" : "outline"}
              size="sm"
              className="rounded-full text-xs"
              onClick={() => setDifficultyFilter(level)}
            >
              {level === "Easy" && "🟢 "}
              {level === "Medium" && "🟡 "}
              {level === "Hard" && "🔴 "}
              {level}
            </Button>
          ))}
        </motion.div>

        {/* Diet match */}
        {diets.length > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
            <div className="pr-3">
              <p className="text-sm font-medium">Match my diet</p>
              <p className="text-xs text-muted-foreground">
                {diets.map(dietLabel).join(", ")}
                {cannotFilter.length > 0 &&
                  ` · we can't verify ${cannotFilter.map(dietLabel).join(" or ")} yet`}
              </p>
            </div>
            <Switch checked={matchDiet} onCheckedChange={setMatchDiet} aria-label="Match my diet" />
          </div>
        )}

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MealSlot)}>
            <TabsList className="w-full h-11 sm:h-12 p-1 bg-muted rounded-xl">
              {(["breakfast", "lunch", "dinner", "snack"] as const).map((slot) => (
                <TabsTrigger key={slot} value={slot} className="flex-1 rounded-lg text-xs sm:text-sm capitalize">
                  {slot}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-4 space-y-3 sm:space-y-4">
              <AiMealIdeas
                key={activeTab}
                slot={activeTab}
                onOpen={openRecipe}
                onAdd={addToToday}
                adding={addMeal.isPending}
              />

              {/* Smart pick */}
              {topPick && (
                <Card className="gradient-primary border-0 text-primary-foreground overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary-foreground/20 rounded-xl shrink-0">
                        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold mb-1 text-sm sm:text-base">Top pick for {activeTab}</p>
                        <p className="text-sm font-medium truncate">
                          {topPick.recipe.emoji} {topPick.recipe.name}
                        </p>
                        <p className="text-xs sm:text-sm opacity-90 mb-3">{pickReason}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground text-xs sm:text-sm"
                            onClick={() => openRecipe(topPick.recipe)}
                          >
                            View recipe
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-xs sm:text-sm"
                            onClick={() => addToToday(topPick.recipe)}
                            disabled={addMeal.isPending}
                          >
                            Add to today
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Meal List */}
              {filtered.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center text-sm text-muted-foreground">
                    No {activeTab} ideas match your filters.
                    {matchDiet && diets.length > 0 && " Try turning off “Match my diet”."}
                  </CardContent>
                </Card>
              )}
              <AnimatePresence mode="popLayout">
                {filtered.map(({ id, recipe, pantryMatchNames }, index) => (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: Math.min(index, 8) * 0.05 }}
                  >
                    <Card
                      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                      onClick={() => openRecipe(recipe)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="text-3xl sm:text-4xl shrink-0">{recipe.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base mb-1 truncate">{recipe.name}</h3>
                            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-2 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                                {recipe.calories} cal
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                {recipe.prepTime} min
                              </span>
                              <span
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  difficultyColors[recipe.difficulty]
                                }`}
                              >
                                <ChefHat className="h-3 w-3" />
                                {recipe.difficulty}
                              </span>
                            </div>
                            {pantryMatchNames.length > 0 && (
                              <p className="flex items-center gap-1 text-xs text-secondary mb-2">
                                <Check className="h-3.5 w-3.5" />
                                You have {pantryMatchNames.slice(0, 3).join(", ")}
                                {pantryMatchNames.length > 3 ? ` +${pantryMatchNames.length - 3} more` : ""}
                              </p>
                            )}
                            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                              {recipe.tags.map((tag) => (
                                <span key={tag} className="text-xs px-2 py-0.5 sm:py-1 bg-muted rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      <RecipeDetailSheet
        recipe={selectedRecipe}
        open={recipeSheetOpen}
        onOpenChange={setRecipeSheetOpen}
        showAddButton
        onAddToToday={() => {
          if (selectedRecipe) addToToday(selectedRecipe);
          setRecipeSheetOpen(false);
        }}
      />
    </AppLayout>
  );
};

export default Meals;
