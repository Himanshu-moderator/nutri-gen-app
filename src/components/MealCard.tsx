import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Coffee, Sun, Moon, Cookie, Sandwich, Plus, ChevronDown, ChevronUp, Clock, Flame, Trash2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { findRecipe } from "@/lib/recipes";

interface MealCardProps {
  type: "breakfast" | "lunch" | "dinner" | "snack" | string;
  name: string;
  calories: number;
  time: string;
  logged?: boolean;
  suggested?: boolean;
  onClick?: () => void;
  onAddToToday?: () => void;
  onDelete?: () => void;
  note?: string;
}

const typeIcons: Record<string, LucideIcon> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
  brunch: Sandwich,
};

const typeLabels: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  brunch: "Brunch",
};

const MealCard = ({ type, name, calories, time, logged, suggested, onClick, onAddToToday, onDelete, note }: MealCardProps) => {
  const Icon = typeIcons[type] || Cookie;
  const isUpcoming = !logged;
  const [expanded, setExpanded] = useState(false);

  // Find recipe for preview
  const recipe = findRecipe(name);

  const handleTogglePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <motion.div
      layout
      className={cn(
        "rounded-2xl border transition-all overflow-hidden",
        logged && "bg-muted/30 border-border/50",
        isUpcoming && !suggested && "bg-card border-border shadow-md",
        suggested && "border-primary/40 bg-gradient-to-r from-primary/5 to-primary/10 shadow-lg ring-1 ring-primary/20"
      )}
    >
      {/* Main row */}
      <div
        className={cn(
          "flex items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer",
        )}
        onClick={onClick}
      >
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0",
            logged ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
          )}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn(
              "text-xs font-medium",
              logged ? "text-muted-foreground" : "text-primary"
            )}>
              {typeLabels[type] || type}
            </p>
            {suggested && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                Suggested
              </span>
            )}
            {logged && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                ✓ Done
              </span>
            )}
          </div>
          <p className={cn(
            "font-medium text-sm sm:text-base truncate",
            logged ? "text-muted-foreground" : "text-foreground"
          )}>{name}</p>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span>{calories} cal</span>
            <span>•</span>
            <span>{time}</span>
          </div>
          {note && <p className="text-xs text-primary mt-0.5">{note}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {logged ? (
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary/20 text-secondary">
              <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          ) : onAddToToday ? (
            <Button
              size="sm"
              variant="default"
              className="rounded-full gap-1 text-xs h-8 px-3"
              onClick={(e) => {
                e.stopPropagation();
                onAddToToday();
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          ) : null}
          {logged && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              aria-label={`Remove ${name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {recipe && (
            <button
              onClick={handleTogglePreview}
              className="p-1.5 rounded-full hover:bg-muted/60 text-muted-foreground transition-colors"
              aria-label="Toggle recipe preview"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Inline recipe preview */}
      <AnimatePresence>
        {expanded && recipe && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className={cn(
              "px-4 pb-4 pt-1 border-t",
              logged ? "border-border/30 bg-muted/20" : "border-border/50 bg-card/50"
            )}>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{recipe.description}</p>
              {/* Quick macros */}
              <div className="flex gap-3 mb-2">
                <span className="text-xs font-medium text-info">P: {recipe.macros.protein}g</span>
                <span className="text-xs font-medium text-warning">C: {recipe.macros.carbs}g</span>
                <span className="text-xs font-medium text-accent">F: {recipe.macros.fats}g</span>
              </div>
              {/* Key ingredients preview */}
              <div className="flex flex-wrap gap-1 mb-2">
                {recipe.ingredients.slice(0, 4).map((ing, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                    {ing.length > 20 ? ing.slice(0, 20) + "…" : ing}
                  </span>
                ))}
                {recipe.ingredients.length > 4 && (
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                    +{recipe.ingredients.length - 4} more
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{recipe.prepTime} min</span>
                  <span className="flex items-center gap-1"><Flame className="h-3 w-3" />{recipe.calories} cal</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-primary h-7 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                  }}
                >
                  Full Recipe →
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MealCard;
