import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Award, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const { user } = useAuth();
  const { profile, trialDaysRemaining } = useProfile();
  const [addMealOpen, setAddMealOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [recipeSheetOpen, setRecipeSheetOpen] = useState(false);

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

  const handleMealCardClick = (mealName: string) => {
    const recipe = recipeDetails[mealName];
    if (recipe) {
      setSelectedRecipe(recipe);
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
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 bg-secondary/10 text-secondary px-3 py-1.5 rounded-full"
          >
            <Flame className="h-4 w-4" />
            <span className="text-sm font-semibold">7</span>
          </motion.div>
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
              onClick={() => handleMealCardClick("Avocado Toast with Eggs")}
            />
            <MealCard
              type="lunch"
              name="Grilled Chicken Salad"
              calories={380}
              time="12:45 PM"
              logged
              onClick={() => handleMealCardClick("Grilled Chicken Salad")}
            />
            <MealCard
              type="dinner"
              name="Suggested: Salmon with Veggies"
              calories={550}
              time={profile?.dinner_time || "7:00 PM"}
              suggested
              onClick={() => handleMealCardClick("Suggested: Salmon with Veggies")}
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

        {/* Motivation Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="gradient-primary border-0 text-primary-foreground">
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
        showAddButton
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
