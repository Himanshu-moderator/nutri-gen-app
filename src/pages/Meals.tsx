import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Clock, ChefHat, Flame, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/AppLayout";
import { useProfile } from "@/hooks/useProfile";
import RecipeDetailSheet from "@/components/RecipeDetailSheet";
import { recipeDetails } from "@/data/mockRecipes";
import type { RecipeDetail } from "@/components/RecipeDetailSheet";

interface MealSuggestion {
  id: string;
  name: string;
  calories: number;
  prepTime: number;
  difficulty: "Easy" | "Medium" | "Hard";
  image: string;
  tags: string[];
}

const mockMeals: MealSuggestion[] = [
  { id: "1", name: "Mediterranean Quinoa Bowl", calories: 420, prepTime: 25, difficulty: "Easy", image: "🥗", tags: ["High Protein", "Vegetarian"] },
  { id: "2", name: "Grilled Salmon with Asparagus", calories: 380, prepTime: 30, difficulty: "Medium", image: "🐟", tags: ["Omega-3", "Low Carb"] },
  { id: "3", name: "Chicken Stir Fry", calories: 450, prepTime: 20, difficulty: "Easy", image: "🍳", tags: ["High Protein", "Quick"] },
  { id: "4", name: "Veggie Buddha Bowl", calories: 350, prepTime: 15, difficulty: "Easy", image: "🥙", tags: ["Vegan", "Fiber Rich"] },
  { id: "5", name: "Beef Tacos with Guacamole", calories: 520, prepTime: 35, difficulty: "Medium", image: "🌮", tags: ["Mexican", "High Protein"] },
  { id: "6", name: "Thai Green Curry", calories: 480, prepTime: 40, difficulty: "Hard", image: "🍛", tags: ["Spicy", "Thai"] },
];

const difficultyColors = {
  Easy: "text-secondary bg-secondary/10",
  Medium: "text-warning bg-warning/10",
  Hard: "text-destructive bg-destructive/10",
};

const Meals = () => {
  const [activeTab, setActiveTab] = useState("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const { profile } = useProfile();
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [recipeSheetOpen, setRecipeSheetOpen] = useState(false);

  const filteredMeals = mockMeals
    .filter((meal) => meal.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((meal) => difficultyFilter === "All" || meal.difficulty === difficultyFilter);

  const handleMealClick = (mealName: string) => {
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
        >
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Meal Ideas</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Personalized suggestions based on your pantry
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
          className="flex gap-2"
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

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full h-11 sm:h-12 p-1 bg-muted rounded-xl">
              <TabsTrigger value="breakfast" className="flex-1 rounded-lg text-xs sm:text-sm">
                Breakfast
              </TabsTrigger>
              <TabsTrigger value="lunch" className="flex-1 rounded-lg text-xs sm:text-sm">
                Lunch
              </TabsTrigger>
              <TabsTrigger value="dinner" className="flex-1 rounded-lg text-xs sm:text-sm">
                Dinner
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4 space-y-3 sm:space-y-4">
              {/* AI Suggestion */}
              <Card className="gradient-primary border-0 text-primary-foreground overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary-foreground/20 rounded-xl shrink-0">
                      <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold mb-1 text-sm sm:text-base">AI Recommendation</p>
                      <p className="text-xs sm:text-sm opacity-90 mb-3">
                        Based on your pantry and goals, try this{" "}
                        {activeTab === "breakfast"
                          ? "energizing breakfast"
                          : activeTab === "lunch"
                          ? "balanced lunch"
                          : "satisfying dinner"}
                        !
                      </p>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground text-xs sm:text-sm"
                      >
                        Generate Meal
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Meal List */}
              <AnimatePresence mode="popLayout">
                {filteredMeals.map((meal, index) => (
                  <motion.div
                    key={meal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                      onClick={() => handleMealClick(meal.name)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="text-3xl sm:text-4xl shrink-0">{meal.image}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base mb-1 truncate">
                              {meal.name}
                            </h3>
                            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-2 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                                {meal.calories} cal
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                {meal.prepTime} min
                              </span>
                              <span
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  difficultyColors[meal.difficulty]
                                }`}
                              >
                                <ChefHat className="h-3 w-3" />
                                {meal.difficulty}
                              </span>
                            </div>
                            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                              {meal.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-0.5 sm:py-1 bg-muted rounded-full"
                                >
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
      />
    </AppLayout>
  );
};

export default Meals;
