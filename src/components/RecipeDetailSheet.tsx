import { motion } from "framer-motion";
import { X, Clock, ChefHat, Flame, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface RecipeStep {
  step: number;
  instruction: string;
}

interface RecipeDetail {
  name: string;
  emoji: string;
  calories: number;
  prepTime: number;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  ingredients: string[];
  steps: RecipeStep[];
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  tags: string[];
}

interface RecipeDetailSheetProps {
  recipe: RecipeDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToToday?: () => void;
  showAddButton?: boolean;
}

const difficultyColors = {
  Easy: "text-secondary bg-secondary/10",
  Medium: "text-warning bg-warning/10",
  Hard: "text-destructive bg-destructive/10",
};

const RecipeDetailSheet = ({ recipe, open, onOpenChange }: RecipeDetailSheetProps) => {
  if (!recipe) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {/* Hero Section */}
          <div className="gradient-primary px-6 pt-8 pb-6 text-center relative">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-primary-foreground sr-only">{recipe.name}</SheetTitle>
            </SheetHeader>
            <div className="text-6xl mb-3">{recipe.emoji}</div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary-foreground mb-2">{recipe.name}</h2>
            <p className="text-primary-foreground/80 text-sm max-w-md mx-auto">{recipe.description}</p>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-1.5 bg-primary-foreground/20 rounded-full px-3 py-1.5 text-primary-foreground text-sm">
                <Flame className="h-4 w-4" />
                <span className="font-medium">{recipe.calories} cal</span>
              </div>
              <div className="flex items-center gap-1.5 bg-primary-foreground/20 rounded-full px-3 py-1.5 text-primary-foreground text-sm">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{recipe.prepTime} min</span>
              </div>
              <div className="flex items-center gap-1.5 bg-primary-foreground/20 rounded-full px-3 py-1.5 text-primary-foreground text-sm">
                <Users className="h-4 w-4" />
                <span className="font-medium">{recipe.servings} serving{recipe.servings > 1 ? "s" : ""}</span>
              </div>
              <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${difficultyColors[recipe.difficulty]}`}>
                <ChefHat className="h-3.5 w-3.5" />
                {recipe.difficulty}
              </span>
            </div>
          </div>

          <div className="px-5 sm:px-6 py-6 space-y-6 max-w-2xl mx-auto">
            {/* Macros */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-2xl bg-info/10">
                <p className="text-xs text-muted-foreground mb-1">Protein</p>
                <p className="text-lg font-bold text-info">{recipe.macros.protein}g</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-warning/10">
                <p className="text-xs text-muted-foreground mb-1">Carbs</p>
                <p className="text-lg font-bold text-warning">{recipe.macros.carbs}g</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-accent/10">
                <p className="text-xs text-muted-foreground mb-1">Fats</p>
                <p className="text-lg font-bold text-accent">{recipe.macros.fats}g</p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <span key={tag} className="text-xs px-3 py-1.5 bg-muted rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>

            {/* Ingredients */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Ingredients</h3>
              <div className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <span className="text-sm">{ingredient}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Instructions</h3>
              <div className="space-y-3">
                {recipe.steps.map((step) => (
                  <div key={step.step} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                      {step.step}
                    </div>
                    <p className="text-sm leading-relaxed pt-1.5 flex-1">{step.instruction}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom spacing for safe area */}
            <div className="h-4" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export { type RecipeDetail };
export default RecipeDetailSheet;
