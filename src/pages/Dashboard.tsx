import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, Award, ChevronRight, Plus, Droplets, TrendingUp, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import CalorieRing from "@/components/CalorieRing";
import MacroCard from "@/components/MacroCard";
import MealCard from "@/components/MealCard";
import AddMealSheet from "@/components/AddMealSheet";
import RecipeDetailSheet from "@/components/RecipeDetailSheet";
import { recipeDetails } from "@/data/mockRecipes";
import type { RecipeDetail } from "@/components/RecipeDetailSheet";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, trialDaysRemaining } = useProfile();
  const [addMealOpen, setAddMealOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [recipeSheetOpen, setRecipeSheetOpen] = useState(false);
  const [selectedMealLogged, setSelectedMealLogged] = useState(false);
  const [waterGlasses, setWaterGlasses] = useState(5);

  const [extraCalories, setExtraCalories] = useState(0);
  const [extraMeals, setExtraMeals] = useState<Array<{ name: string; calories: number; type: string }>>([]);
  const [extraMacros, setExtraMacros] = useState({ protein: 0, carbs: 0, fats: 0 });

  const baseCalories = 1450;
  const caloriesConsumed = baseCalories + extraCalories;
  const calorieGoal = profile?.daily_calorie_target || 2000;

  const macros = {
    protein: { current: 65 + extraMacros.protein, goal: 120, color: "protein" as const },
    carbs: { current: 180 + extraMacros.carbs, goal: 250, color: "carbs" as const },
    fats: { current: 45 + extraMacros.fats, goal: 65, color: "fats" as const },
  };

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const trialDays = trialDaysRemaining();

  const handleMealAdded = (meal: { name: string; calories: number; type: string; protein: number; carbs: number; fats: number }) => {
    setExtraCalories((prev) => prev + meal.calories);
    setExtraMeals((prev) => [...prev, meal]);
    setExtraMacros((prev) => ({
      protein: prev.protein + meal.protein,
      carbs: prev.carbs + meal.carbs,
      fats: prev.fats + meal.fats,
    }));
  };

  const handleMealCardClick = (mealName: string, isLogged: boolean = false) => {
    const recipe = recipeDetails[mealName];
    if (recipe) {
      setSelectedRecipe(recipe);
      setSelectedMealLogged(isLogged);
      setRecipeSheetOpen(true);
    }
  };

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
            <p className="text-muted-foreground text-xs sm:text-sm">
              {trialDays > 0
                ? `${trialDays} days left in your trial`
                : "Let's crush your goals today"}
            </p>
          </div>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 bg-secondary/10 text-secondary px-3 py-1.5 rounded-full cursor-default"
                >
                  <Flame className="h-4 w-4" />
                  <span className="text-sm font-semibold">7</span>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-medium">
                🔥 7-day streak! You've logged meals every day for a week.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>

        {/* Calorie Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <CalorieRing
                  consumed={caloriesConsumed}
                  goal={calorieGoal}
                  size={120}
                />
                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <div>
                    <p className="text-sm text-muted-foreground">Daily Goal</p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {caloriesConsumed}{" "}
                      <span className="text-base sm:text-lg font-normal text-muted-foreground">
                        / {calorieGoal} cal
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center sm:justify-start">
                    <Button
                      size="sm"
                      className="rounded-full gap-1.5"
                      onClick={() => setAddMealOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add a Meal
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Macros */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-2 sm:gap-3"
        >
          <MacroCard
            label="Protein"
            current={macros.protein.current}
            goal={macros.protein.goal}
            unit="g"
            color="protein"
          />
          <MacroCard
            label="Carbs"
            current={macros.carbs.current}
            goal={macros.carbs.goal}
            unit="g"
            color="carbs"
          />
          <MacroCard
            label="Fats"
            current={macros.fats.current}
            goal={macros.fats.goal}
            unit="g"
            color="fats"
          />
        </motion.div>

        {/* Today's Meals */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-semibold">Today's Meals</h2>
            <Button variant="ghost" size="sm" className="text-primary text-xs sm:text-sm" onClick={() => navigate("/meal-history")}>
              See All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            <MealCard
              type="breakfast"
              name="Avocado Toast with Eggs"
              calories={420}
              time="8:30 AM"
              logged
              onClick={() => handleMealCardClick("Avocado Toast with Eggs", true)}
            />
            <MealCard
              type="lunch"
              name="Grilled Chicken Salad"
              calories={380}
              time="12:45 PM"
              logged
              onClick={() => handleMealCardClick("Grilled Chicken Salad", true)}
            />
            <MealCard
              type="dinner"
              name="Suggested: Salmon with Veggies"
              calories={550}
              time={profile?.dinner_time || "7:00 PM"}
              suggested
              onClick={() => handleMealCardClick("Suggested: Salmon with Veggies", false)}
              onAddToToday={() => {
                handleMealAdded({
                  name: "Salmon with Veggies",
                  calories: 550,
                  type: "dinner",
                  protein: 45,
                  carbs: 35,
                  fats: 22,
                });
              }}
            />
            {/* Dynamically added meals */}
            {extraMeals.map((meal, index) => (
              <MealCard
                key={`extra-${index}`}
                type={meal.type as "breakfast" | "lunch" | "dinner" | "snack"}
                name={meal.name}
                calories={meal.calories}
                time="Just now"
                logged
              />
            ))}
          </div>
        </motion.div>

        {/* Quick Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-2 gap-3"
        >
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border shadow-soft cursor-default hover:shadow-soft-lg transition-shadow">
                  <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-info/10 flex items-center justify-center">
                      <Droplets className="h-4.5 w-4.5 text-info" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Water</p>
                      <p className="text-sm font-bold">{waterGlasses} / 8 glasses</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setWaterGlasses((prev) => Math.min(prev + 1, 8))}
                      disabled={waterGlasses >= 8}
                      className="w-7 h-7 rounded-full bg-info/15 hover:bg-info/25 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-3.5 w-3.5 text-info" />
                    </motion.button>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                💧 {waterGlasses >= 8 ? "Great job! You've hit your water goal!" : `${8 - waterGlasses} more glasses to go!`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border shadow-soft cursor-default hover:shadow-soft-lg transition-shadow">
                  <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <TrendingUp className="h-4.5 w-4.5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Weekly Avg</p>
                      <p className="text-sm font-bold">1,820 cal</p>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">📊 Your average daily intake this week</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>

        {/* Motivation Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="gradient-primary border-0 text-primary-foreground shadow-glow">
            <CardContent className="p-4 flex items-center gap-4">
              <Award className="h-8 w-8 sm:h-10 sm:w-10 opacity-90 shrink-0" />
              <div>
                <p className="font-semibold text-sm sm:text-base">You're doing amazing!</p>
                <p className="text-xs sm:text-sm opacity-90">
                  You've hit your protein goal 5 days in a row 💪
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AddMealSheet
        open={addMealOpen}
        onOpenChange={setAddMealOpen}
        onMealAdded={handleMealAdded}
      />

      <RecipeDetailSheet
        recipe={selectedRecipe}
        open={recipeSheetOpen}
        onOpenChange={setRecipeSheetOpen}
        showAddButton={!selectedMealLogged}
        onAddToToday={() => {
          if (selectedRecipe) {
            handleMealAdded({
              name: selectedRecipe.name,
              calories: selectedRecipe.calories,
              type: "meal",
              protein: selectedRecipe.macros.protein,
              carbs: selectedRecipe.macros.carbs,
              fats: selectedRecipe.macros.fats,
            });
            setRecipeSheetOpen(false);
          }
        }}
      />
    </AppLayout>
  );
};

export default Dashboard;
