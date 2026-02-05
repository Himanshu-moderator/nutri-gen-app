import { motion } from "framer-motion";
import { Check, Sparkles, Coffee, Sun, Moon, Cookie } from "lucide-react";
import { cn } from "@/lib/utils";

interface MealCardProps {
  type: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  calories: number;
  time: string;
  logged?: boolean;
  suggested?: boolean;
}

const typeIcons = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

const typeLabels = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const MealCard = ({ type, name, calories, time, logged, suggested }: MealCardProps) => {
  const Icon = typeIcons[type];

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border transition-colors cursor-pointer",
        logged && "bg-muted/50 border-transparent",
        suggested && "border-primary/30 bg-primary/5"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-12 h-12 rounded-xl",
          logged ? "bg-secondary/20 text-secondary" : "bg-primary/10 text-primary"
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {typeLabels[type]}
          </p>
          {suggested && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              AI Pick
            </span>
          )}
        </div>
        <p className="font-medium truncate">{name}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{calories} cal</span>
          <span>•</span>
          <span>{time}</span>
        </div>
      </div>
      {logged && (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground">
          <Check className="h-4 w-4" />
        </div>
      )}
    </motion.div>
  );
};

export default MealCard;
