import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MacroCardProps {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: "protein" | "carbs" | "fats";
}

const colorMap = {
  protein: "bg-info",
  carbs: "bg-warning",
  fats: "bg-accent",
};

const MacroCard = ({ label, current, goal, unit, color }: MacroCardProps) => {
  const progress = Math.min((current / goal) * 100, 100);
  const remaining = Math.max(goal - current, 0);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="border shadow-soft hover:shadow-soft-lg transition-all cursor-default">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-lg font-bold mb-2">
                {current}
                <span className="text-xs font-normal text-muted-foreground">
                  /{goal}{unit}
                </span>
              </p>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${colorMap[color]}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {remaining > 0
            ? `${remaining}${unit} of ${label.toLowerCase()} remaining today`
            : `🎉 ${label} goal reached!`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MacroCard;
