import { motion } from "framer-motion";
import { Check, Sparkles, Coffee, Sun, Moon, Cookie, Sandwich } from "lucide-react";
import { cn } from "@/lib/utils";

interface MealCardProps {
  type: "breakfast" | "lunch" | "dinner" | "snack" | string;
  name: string;
  calories: number;
  time: string;
  logged?: boolean;
  suggested?: boolean;
  onClick?: () => void;
}

const typeIcons: Record<string, any> = {
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

const MealCard = ({ type, name, calories, time, logged, suggested, onClick }: MealCardProps) => {
  const Icon = typeIcons[type] || Cookie;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border transition-colors cursor-pointer",
        logged && "bg-muted/50 border-transparent",
        suggested && "border-primary/30 bg-primary/5"
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0",
          logged ? "bg-secondary/20 text-secondary" : "bg-primary/10 text-primary"
        )}
      >
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {typeLabels[type] || type}
          </p>
          {suggested && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              AI Pick
            </span>
          )}
        </div>
        <p className="font-medium text-sm sm:text-base truncate">{name}</p>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <span>{calories} cal</span>
          <span>•</span>
          <span>{time}</span>
        </div>
      </div>
      {logged && (
        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary text-secondary-foreground shrink-0">
          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
      )}
    </motion.div>
  );
};

export default MealCard;
