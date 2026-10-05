import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, isSameDay } from "date-fns";
import { Flame, Award, ChevronRight, Plus, Minus, Droplets, TrendingUp, ChevronDown, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useMealLogs } from "@/hooks/useMealLogs";
import { usePantry } from "@/hooks/usePantry";
import { useWater, WATER_GOAL } from "@/hooks/useWater";
import { useToast } from "@/hooks/use-toast";
import CalorieRing from "@/components/CalorieRing";
import MacroCard from "@/components/MacroCard";
import MealCard from "@/components/MealCard";
import AddMealSheet from "@/components/AddMealSheet";
import RecipeDetailSheet from "@/components/RecipeDetailSheet";
import type { RecipeDetail } from "@/components/RecipeDetailSheet";
import { findRecipe, rankRecipes, type MealSlot } from "@/lib/recipes";
import {
  currentStreak,
  macroTargets,
  nextMealSlot,
  weeklyAverageCalories,
} from "@/lib/nutrition";

const MAIN_MEALS = ["breakfast", "lunch", "dinner"] as const;

// "19:00:00" -> "7:00 PM"; falls back when the profile has no time set.
const mealTimeLabel = (time: string | null | undefined, fallback: string) => {
  const [h, m] = (time ?? "").split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return fallback;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return format(d, "h:mm a");
};

interface MealToAdd {
  name: string;
  calories: number;
  type: string;
  protein: number;
  carbs: number;
  fats: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { isDemo, signOut } = useAuth();
  const { profile, trialDaysRemaining } = useProfile();
  const { logs, isLoading: logsLoading, addMeal, deleteMeal, loadSamples } = useMealLogs();
  const { items: pantryItems } = usePantry();
  const water = useWater();
  const { toast } = useToast();

  const [addMealOpen, setAddMealOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [recipeSheetOpen, setRecipeSheetOpen] = useState(false);
  const [recipeCanAdd, setRecipeCanAdd] = useState(false);
  const [recipeSlot, setRecipeSlot] = useState<string>("lunch");
  const [showMacros, setShowMacros] = useState(true);

  const now = new Date();

  const todayLogs = useMemo(
    () =>
      logs
        .filter((l) => isSameDay(new Date(l.logged_at), new Date()))
        .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()),
    [logs]
  );

  const calorieGoal = profile?.daily_calorie_target || 2000;
  const targets = macroTargets(calorieGoal);
  const consumed = todayLogs.reduce((sum, l) => sum + (l.calories ?? 0), 0);
  const eaten = {
    protein: Math.round(todayLogs.reduce((s, l) => s + Number(l.protein_g ?? 0), 0)),
    carbs: Math.round(todayLogs.reduce((s, l) => s + Number(l.carbs_g ?? 0), 0)),
    fats: Math.round(todayLogs.reduce((s, l) => s + Number(l.fats_g ?? 0), 0)),
  };
  const remaining = calorieGoal - consumed;

  const streak = currentStreak(logs);
  const weeklyAvg = weeklyAverageCalories(logs);

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const trialDays = trialDaysRemaining();
  const trialEnded = !isDemo && !!profile && trialDays === 0 && !profile.is_subscribed;

  // Suggest the next main meal that hasn't been logged yet today.
  const suggestion = useMemo(() => {
    const slot = nextMealSlot();
    const logged = new Set(todayLogs.map((l) => l.meal_type));
    const start = MAIN_MEALS.indexOf(slot as (typeof MAIN_MEALS)[number]);
    // Late evening: suggest a snack instead of another main meal.
    const target: MealSlot | undefined =
      start === -1
        ? logged.has("snack")
          ? undefined
          : "snack"
        : MAIN_MEALS.slice(start).find((s) => !logged.has(s));
    if (!target) return null;
    const best = rankRecipes({
      slot: target,
      diets: profile?.dietary_preferences ?? [],
      pantryNames: pantryItems.map((p) => p.name),
      remainingCalories: Math.max(calorieGoal - consumed, 0),
    })[0];
    return best ? { slot: target, ...best } : null;
  }, [todayLogs, profile?.dietary_preferences, pantryItems, calorieGoal, consumed]);

  const handleMealAdded = async (meal: MealToAdd) => {
    await addMeal.mutateAsync({
      meal_name: meal.name,
      meal_type: meal.type,
      calories: meal.calories,
      protein_g: meal.protein,
      carbs_g: meal.carbs,
      fats_g: meal.fats,
    });
  };

  const addRecipeToToday = async (recipe: RecipeDetail, type: string) => {
    try {
      await handleMealAdded({
        name: recipe.name,
        calories: recipe.calories,
        type,
        protein: recipe.macros.protein,
        carbs: recipe.macros.carbs,
        fats: recipe.macros.fats,
      });
      toast({ title: "Meal added! 🎉", description: `${recipe.name} logged as ${type}.` });
    } catch (error) {
      toast({
        title: "Couldn't add meal",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteMeal.mutateAsync(id);
      toast({ title: "Meal removed", description: `${name} was removed.` });
    } catch (error) {
      toast({
        title: "Couldn't remove meal",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const openRecipe = (recipe: RecipeDetail | null, canAdd: boolean, slot: string = nextMealSlot()) => {
    if (!recipe) return;
    setSelectedRecipe(recipe);
    setRecipeCanAdd(canAdd);
    setRecipeSlot(slot);
    setRecipeSheetOpen(true);
  };

  const handleLoadSamples = async () => {
    try {
      await loadSamples.mutateAsync();
      toast({ title: "Sample meals loaded", description: "Explore your dashboard, history and streak." });
    } catch (error) {
      toast({
        title: "Couldn't load samples",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateAccount = async () => {
    await signOut();
    navigate("/auth?mode=signup");
  };

  const subtitle = isDemo
    ? "You're exploring the demo"
    : trialDays > 0
    ? `${trialDays} ${trialDays === 1 ? "day" : "days"} left in your free trial`
    : trialEnded
    ? "Your free trial has ended"
    : "Let's crush your goals today";

  const motivation = (() => {
    if (logs.length === 0) {
      return { title: "Let's get started!", text: "Log your first meal to start your streak." };
    }
    if (todayLogs.length === 0) {
      return {
        title: streak > 0 ? `Keep your ${streak}-day streak alive!` : "Ready for a fresh start?",
        text: "Nothing logged yet today. Add your first meal.",
      };
    }
    if (remaining < 0) {
      return {
        title: "Over today's goal",
        text: `You're ${Math.abs(remaining)} cal over. A lighter next meal or a walk can balance it out.`,
      };
    }
    if (streak >= 3) {
      return { title: `${streak}-day streak! 🔥`, text: `${remaining} cal left today. Keep going.` };
    }
    return { title: "You're doing great!", text: `${remaining} cal left to reach today's goal.` };
  })();

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4 space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Hey, {firstName}! 👋</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">{subtitle}</p>
          </div>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-default ${
                    streak > 0 ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Flame className="h-4 w-4" />
                  <span className="text-sm font-semibold">{streak}</span>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-medium">
                {streak > 0
                  ? `🔥 ${streak}-day streak! You've logged meals ${streak === 1 ? "today" : `${streak} days in a row`}.`
                  : "Log a meal today to start a streak."}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>

        {/* Demo banner */}
        {isDemo && (
          <Card className="border-info/30 bg-info/5">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-start gap-3 flex-1">
                <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Demo mode.</span> Everything here is editable
                  and stays in this browser only. Create an account to keep your own plan.
                </p>
              </div>
              <Button size="sm" className="gradient-primary text-primary-foreground" onClick={handleCreateAccount}>
                Create account
              </Button>
            </CardContent>
          </Card>
        )}

        {trialEnded && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Your 20-day free trial has ended.</span> Paid plans
              aren't available yet, so you can keep using NutriGen in the meantime.
            </CardContent>
          </Card>
        )}

        {/* Daily Goal Card with Macros inside */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-5 sm:p-7">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <CalorieRing consumed={consumed} goal={calorieGoal} size={130} />
                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <div>
                    <p className="text-sm text-muted-foreground">Daily Goal</p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {consumed}{" "}
                      <span className="text-base sm:text-lg font-normal text-muted-foreground">
                        / {calorieGoal} cal
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center sm:justify-start">
                    <Button size="sm" className="rounded-full gap-1.5" onClick={() => setAddMealOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Add a Meal
                    </Button>
                  </div>
                </div>
              </div>

              {/* Collapsible Macros */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <button
                  onClick={() => setShowMacros(!showMacros)}
                  className="flex items-center justify-between w-full mb-2"
                >
                  <span className="text-xs font-semibold text-muted-foreground">Macros</span>
                  <motion.div animate={{ rotate: showMacros ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {showMacros && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <MacroCard label="Protein" current={eaten.protein} goal={targets.protein} unit="g" color="protein" />
                        <MacroCard label="Carbs" current={eaten.carbs} goal={targets.carbs} unit="g" color="carbs" />
                        <MacroCard label="Fats" current={eaten.fats} goal={targets.fats} unit="g" color="fats" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Meals */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-semibold">Today's Meals</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary text-xs sm:text-sm"
              onClick={() => navigate("/meal-history")}
            >
              See All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {logsLoading && <p className="text-sm text-muted-foreground">Loading your meals...</p>}

            {!logsLoading && todayLogs.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-5 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No meals logged today yet. Add one, or pick the suggestion below.
                  </p>
                  {logs.length === 0 && !isDemo && (
                    <Button variant="outline" size="sm" onClick={handleLoadSamples} disabled={loadSamples.isPending}>
                      {loadSamples.isPending ? "Loading..." : "Load sample meals to explore"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {todayLogs.map((log) => (
              <MealCard
                key={log.id}
                type={log.meal_type}
                name={log.meal_name}
                calories={log.calories ?? 0}
                time={format(new Date(log.logged_at), "h:mm a")}
                logged
                onClick={() => openRecipe(findRecipe(log.meal_name), false)}
                onDelete={() => handleDelete(log.id, log.meal_name)}
              />
            ))}

            {suggestion && (
              <MealCard
                type={suggestion.slot}
                name={suggestion.recipe.name}
                calories={suggestion.recipe.calories}
                time={mealTimeLabel(
                  profile?.[`${suggestion.slot}_time` as "breakfast_time"],
                  format(now, "h:mm a")
                )}
                suggested
                note={
                  suggestion.pantryMatchNames.length > 0
                    ? `Uses ${suggestion.pantryMatchNames.length} item${
                        suggestion.pantryMatchNames.length === 1 ? "" : "s"
                      } from your pantry`
                    : undefined
                }
                onClick={() => openRecipe(suggestion.recipe, true, suggestion.slot)}
                onAddToToday={() => addRecipeToToday(suggestion.recipe, suggestion.slot)}
              />
            )}
          </div>
        </motion.div>

        {/* Quick Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card className="border shadow-soft">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-info/10 flex items-center justify-center">
                <Droplets className="h-4.5 w-4.5 text-info" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Water (glasses)</p>
                <p className="text-sm font-bold whitespace-nowrap">
                  {water.glasses} / {WATER_GOAL}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={water.remove}
                  disabled={water.glasses <= 0}
                  aria-label="Remove a glass of water"
                  className="w-7 h-7 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={water.add}
                  aria-label="Add a glass of water"
                  className="w-7 h-7 rounded-full bg-info/15 hover:bg-info/25 flex items-center justify-center transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-info" />
                </button>
              </div>
            </CardContent>
          </Card>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border shadow-soft cursor-default hover:shadow-soft-lg transition-shadow">
                  <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <TrendingUp className="h-4.5 w-4.5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">7-day Avg</p>
                      <p className="text-sm font-bold">
                        {weeklyAvg === null ? "No data yet" : `${weeklyAvg.toLocaleString()} cal`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                📊 Average daily intake over the last 7 days (days with logged meals)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>

        {/* Motivation Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="gradient-primary border-0 text-primary-foreground shadow-glow">
            <CardContent className="p-4 flex items-center gap-4">
              <Award className="h-8 w-8 sm:h-10 sm:w-10 opacity-90 shrink-0" />
              <div>
                <p className="font-semibold text-sm sm:text-base">{motivation.title}</p>
                <p className="text-xs sm:text-sm opacity-90">{motivation.text}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AddMealSheet open={addMealOpen} onOpenChange={setAddMealOpen} onMealAdded={handleMealAdded} />

      <RecipeDetailSheet
        recipe={selectedRecipe}
        open={recipeSheetOpen}
        onOpenChange={setRecipeSheetOpen}
        showAddButton={recipeCanAdd}
        onAddToToday={() => {
          if (selectedRecipe) {
            addRecipeToToday(selectedRecipe, recipeSlot);
            setRecipeSheetOpen(false);
          }
        }}
      />
    </AppLayout>
  );
};

export default Dashboard;
