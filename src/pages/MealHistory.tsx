import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, Calendar, Search, ArrowLeft } from "lucide-react";
import { format, subDays, addDays, isToday, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import MealCard from "@/components/MealCard";
import RecipeDetailSheet from "@/components/RecipeDetailSheet";
import { recipeDetails } from "@/data/mockRecipes";
import type { RecipeDetail } from "@/components/RecipeDetailSheet";

interface HistoryMeal {
  id: string;
  name: string;
  type: string;
  calories: number;
  time: string;
  logged: boolean;
  suggested?: boolean;
  date: Date;
}

// Mock history data across multiple days
const generateMockHistory = (): HistoryMeal[] => {
  const today = new Date();
  return [
    // Today
    { id: "t1", name: "Avocado Toast with Eggs", type: "breakfast", calories: 420, time: "8:30 AM", logged: true, date: today },
    { id: "t2", name: "Grilled Chicken Salad", type: "lunch", calories: 380, time: "12:45 PM", logged: true, date: today },
    { id: "t3", name: "Suggested: Salmon with Veggies", type: "dinner", calories: 550, time: "7:00 PM", logged: false, suggested: true, date: today },
    // Yesterday
    { id: "y1", name: "Smoothie Bowl", type: "breakfast", calories: 350, time: "9:00 AM", logged: true, date: subDays(today, 1) },
    { id: "y2", name: "Mediterranean Quinoa Bowl", type: "lunch", calories: 420, time: "1:00 PM", logged: true, date: subDays(today, 1) },
    { id: "y3", name: "Chicken Stir Fry", type: "dinner", calories: 450, time: "7:30 PM", logged: true, date: subDays(today, 1) },
    { id: "y4", name: "Greek Yogurt & Berries", type: "snack", calories: 150, time: "4:00 PM", logged: true, date: subDays(today, 1) },
    // 2 days ago
    { id: "d1", name: "Egg & Cheese Wrap", type: "breakfast", calories: 380, time: "8:00 AM", logged: true, date: subDays(today, 2) },
    { id: "d2", name: "Veggie Buddha Bowl", type: "lunch", calories: 350, time: "12:30 PM", logged: true, date: subDays(today, 2) },
    { id: "d3", name: "Thai Green Curry", type: "dinner", calories: 480, time: "8:00 PM", logged: true, date: subDays(today, 2) },
    // 3 days ago
    { id: "w1", name: "Banana & Peanut Butter", type: "snack", calories: 280, time: "10:00 AM", logged: true, date: subDays(today, 3) },
    { id: "w2", name: "Grilled Salmon with Asparagus", type: "lunch", calories: 380, time: "1:00 PM", logged: true, date: subDays(today, 3) },
    { id: "w3", name: "Beef Tacos with Guacamole", type: "dinner", calories: 520, time: "7:00 PM", logged: true, date: subDays(today, 3) },
  ];
};

const aiPickMeals: HistoryMeal[] = [
  { id: "ai1", name: "Mediterranean Quinoa Bowl", type: "lunch", calories: 420, time: "Anytime", logged: false, suggested: true, date: new Date() },
  { id: "ai2", name: "Grilled Salmon with Asparagus", type: "dinner", calories: 380, time: "Anytime", logged: false, suggested: true, date: new Date() },
  { id: "ai3", name: "Veggie Buddha Bowl", type: "lunch", calories: 350, time: "Anytime", logged: false, suggested: true, date: new Date() },
];

const categories = ["All", "Breakfast", "Lunch", "Dinner", "Snack", "Brunch"];

const MealHistory = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [recipeSheetOpen, setRecipeSheetOpen] = useState(false);
  const [showAddOnRecipe, setShowAddOnRecipe] = useState(false);

  const allMeals = useMemo(() => generateMockHistory(), []);

  const dayMeals = useMemo(() => {
    return allMeals
      .filter((m) => isSameDay(m.date, selectedDate))
      .filter((m) => activeCategory === "All" || m.type.toLowerCase() === activeCategory.toLowerCase())
      .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allMeals, selectedDate, activeCategory, searchQuery]);

  const totalCalories = dayMeals.filter((m) => m.logged).reduce((sum, m) => sum + m.calories, 0);

  const handleMealClick = (name: string, isLogged?: boolean) => {
    const recipe = recipeDetails[name];
    if (recipe) {
      setSelectedRecipe(recipe);
      setShowAddOnRecipe(!isLogged);
      setRecipeSheetOpen(true);
    }
  };

  const goToPrevDay = () => setSelectedDate((d) => subDays(d, 1));
  const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));
  const goToToday = () => setSelectedDate(new Date());

  const dateLabel = isToday(selectedDate)
    ? "Today"
    : format(selectedDate, "EEE, MMM d");

  // Group meals by type for the current day
  const groupedMeals = useMemo(() => {
    const groups: Record<string, HistoryMeal[]> = {};
    dayMeals.forEach((meal) => {
      const key = meal.type.charAt(0).toUpperCase() + meal.type.slice(1);
      if (!groups[key]) groups[key] = [];
      groups[key].push(meal);
    });
    return groups;
  }, [dayMeals]);

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
          <p className="text-muted-foreground text-xs sm:text-sm">
            Browse your meals across days
          </p>
        </motion.div>

        {/* Date Navigator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between bg-card rounded-2xl border p-3 shadow-sm"
        >
          <Button variant="ghost" size="icon" className="rounded-full" onClick={goToPrevDay}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="font-semibold text-sm sm:text-base">{dateLabel}</p>
            <p className="text-xs text-muted-foreground">{format(selectedDate, "MMMM d, yyyy")}</p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={goToNextDay} disabled={isToday(selectedDate)}>
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
          <span className="text-muted-foreground">{dayMeals.length} meals</span>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl text-sm"
          />
        </div>

        {/* Grouped meals */}
        <div className="space-y-5">
          {Object.keys(groupedMeals).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">No meals found for this day.</p>
            </div>
          ) : (
            Object.entries(groupedMeals).map(([groupName, meals]) => (
              <motion.div
                key={groupName}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{groupName}</h3>
                <div className="space-y-2">
                  {meals.map((meal) => (
                    <MealCard
                      key={meal.id}
                      type={meal.type as any}
                      name={meal.name}
                      calories={meal.calories}
                      time={meal.time}
                      logged={meal.logged}
                      suggested={meal.suggested}
                      onClick={() => handleMealClick(meal.name, meal.logged)}
                      onAddToToday={meal.suggested ? () => {} : undefined}
                    />
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* AI Picks section */}
        {isToday(selectedDate) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm sm:text-base font-semibold">AI Picks for You</h3>
            </div>
            <div className="space-y-2">
              {aiPickMeals.map((meal) => (
                <MealCard
                  key={meal.id}
                  type={meal.type as any}
                  name={meal.name}
                  calories={meal.calories}
                  time={meal.time}
                  suggested
                  onClick={() => handleMealClick(meal.name, true)}
                  onAddToToday={() => {}}
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
        showAddButton={showAddOnRecipe}
        onAddToToday={() => setRecipeSheetOpen(false)}
      />
    </AppLayout>
  );
};

export default MealHistory;
