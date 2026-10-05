import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, Calendar, Search, ArrowLeft } from "lucide-react";
import { format, subDays, addDays, isToday, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/AppLayout";
import MealCard from "@/components/MealCard";
import RecipeDetailSheet from "@/components/RecipeDetailSheet";
import type { RecipeDetail } from "@/components/RecipeDetailSheet";
import { useMealLogs } from "@/hooks/useMealLogs";
import { usePantry } from "@/hooks/usePantry";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { findRecipe, rankRecipes } from "@/lib/recipes";
import { nextMealSlot } from "@/lib/nutrition";

const categories = ["All", "Breakfast", "Lunch", "Dinner", "Snack"];

const MealHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useProfile();
  const { logs, isLoading, error, addMeal, deleteMeal } = useMealLogs();
  const { items: pantryItems } = usePantry();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [recipeSheetOpen, setRecipeSheetOpen] = useState(false);
  const [recipeCanAdd, setRecipeCanAdd] = useState(false);

  const dayLogs = useMemo(
    () =>
      logs
        .filter((l) => isSameDay(new Date(l.logged_at), selectedDate))
        .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()),
    [logs, selectedDate]
  );

  const visibleLogs = useMemo(
    () =>
      dayLogs
        .filter((l) => activeCategory === "All" || l.meal_type === activeCategory.toLowerCase())
        .filter((l) => l.meal_name.toLowerCase().includes(searchQuery.trim().toLowerCase())),
    [dayLogs, activeCategory, searchQuery]
  );

  const totalCalories = dayLogs.reduce((sum, l) => sum + (l.calories ?? 0), 0);

  const groupedMeals = useMemo(() => {
    const groups: Record<string, typeof visibleLogs> = {};
    visibleLogs.forEach((meal) => {
      const key = meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1);
      (groups[key] ??= []).push(meal);
    });
    return groups;
  }, [visibleLogs]);

  // Ideas for today: best matches for the next meal, given diet and pantry.
  const ideas = useMemo(
    () =>
      rankRecipes({
        slot: nextMealSlot(),
        diets: profile?.dietary_preferences ?? [],
        pantryNames: pantryItems.map((p) => p.name),
      }).slice(0, 3),
    [profile?.dietary_preferences, pantryItems]
  );

  const addRecipe = async (recipe: RecipeDetail, type: string) => {
    try {
      await addMeal.mutateAsync({
        meal_name: recipe.name,
        meal_type: type,
        calories: recipe.calories,
        protein_g: recipe.macros.protein,
        carbs_g: recipe.macros.carbs,
        fats_g: recipe.macros.fats,
      });
      toast({ title: "Meal added! 🎉", description: `${recipe.name} logged as ${type}.` });
    } catch (err) {
      toast({
        title: "Couldn't add meal",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteMeal.mutateAsync(id);
      toast({ title: "Meal removed", description: `${name} was removed.` });
    } catch (err) {
      toast({
        title: "Couldn't remove meal",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const openRecipe = (name: string, canAdd: boolean) => {
    const recipe = findRecipe(name);
    if (!recipe) return;
    setSelectedRecipe(recipe);
    setRecipeCanAdd(canAdd);
    setRecipeSheetOpen(true);
  };

  const goToPrevDay = () => setSelectedDate((d) => subDays(d, 1));
  const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));
  const goToToday = () => setSelectedDate(new Date());

  const dateLabel = isToday(selectedDate) ? "Today" : format(selectedDate, "EEE, MMM d");

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4 space-y-5 max-w-3xl mx-auto">
        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground rounded-full"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Meal History</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Browse your meals across days</p>
        </motion.div>

        {/* Date Navigator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between bg-card rounded-2xl border p-3 shadow-sm"
        >
          <Button variant="ghost" size="icon" aria-label="Previous day" className="rounded-full" onClick={goToPrevDay}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="font-semibold text-sm sm:text-base">{dateLabel}</p>
            <p className="text-xs text-muted-foreground">{format(selectedDate, "MMMM d, yyyy")}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next day"
            className="rounded-full"
            onClick={goToNextDay}
            disabled={isToday(selectedDate)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </motion.div>

        {!isToday(selectedDate) && (
          <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={goToToday}>
            <Calendar className="h-3.5 w-3.5 mr-1.5" /> Jump to Today
          </Button>
        )}

        {/* Day summary */}
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold">{totalCalories} cal logged</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            {dayLogs.length} {dayLogs.length === 1 ? "meal" : "meals"}
          </span>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meals..."
            aria-label="Search meals"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl text-sm"
          />
        </div>

        {/* Grouped meals */}
        <div className="space-y-5">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground py-12">Loading your meals...</p>
          ) : error ? (
            <p className="text-center text-sm text-destructive py-12">
              We couldn't load your meals. Check your connection and refresh.
            </p>
          ) : Object.keys(groupedMeals).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">
                {dayLogs.length === 0
                  ? "No meals logged for this day."
                  : "No meals match your filters."}
              </p>
            </div>
          ) : (
            Object.entries(groupedMeals).map(([groupName, meals]) => (
              <motion.div key={groupName} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {groupName}
                </h3>
                <div className="space-y-2">
                  {meals.map((meal) => (
                    <MealCard
                      key={meal.id}
                      type={meal.meal_type}
                      name={meal.meal_name}
                      calories={meal.calories ?? 0}
                      time={format(new Date(meal.logged_at), "h:mm a")}
                      logged
                      onClick={() => openRecipe(meal.meal_name, false)}
                      onDelete={() => handleDelete(meal.id, meal.meal_name)}
                    />
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Ideas section */}
        {isToday(selectedDate) && ideas.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm sm:text-base font-semibold">Ideas for You</h3>
            </div>
            <div className="space-y-2">
              {ideas.map(({ id, recipe, pantryMatchNames }) => (
                <MealCard
                  key={id}
                  type={nextMealSlot()}
                  name={recipe.name}
                  calories={recipe.calories}
                  time="Anytime"
                  suggested
                  note={
                    pantryMatchNames.length > 0
                      ? `Uses ${pantryMatchNames.length} item${pantryMatchNames.length === 1 ? "" : "s"} from your pantry`
                      : undefined
                  }
                  onClick={() => openRecipe(recipe.name, true)}
                  onAddToToday={() => addRecipe(recipe, nextMealSlot())}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>

      <RecipeDetailSheet
        recipe={selectedRecipe}
        open={recipeSheetOpen}
        onOpenChange={setRecipeSheetOpen}
        showAddButton={recipeCanAdd}
        onAddToToday={() => {
          if (selectedRecipe) addRecipe(selectedRecipe, nextMealSlot());
          setRecipeSheetOpen(false);
        }}
      />
    </AppLayout>
  );
};

export default MealHistory;
