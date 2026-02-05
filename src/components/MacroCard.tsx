import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

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

  return (
    <Card className="border shadow-sm">
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
  );
};

export default MacroCard;
