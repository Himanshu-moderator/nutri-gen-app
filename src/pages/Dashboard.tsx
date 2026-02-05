import { motion } from "framer-motion";
import { Flame, TrendingUp, Award, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/components/AppLayout";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import CalorieRing from "@/components/CalorieRing";
import MacroCard from "@/components/MacroCard";
import MealCard from "@/components/MealCard";

const Dashboard = () => {
  const { user } = useAuth();
  const { profile, trialDaysRemaining } = useProfile();

  const caloriesConsumed = 1450;
  const calorieGoal = profile?.daily_calorie_target || 2000;
  const calorieProgress = Math.round((caloriesConsumed / calorieGoal) * 100);

  const macros = {
    protein: { current: 65, goal: 120, color: "protein" as const },
    carbs: { current: 180, goal: 250, color: "carbs" as const },
    fats: { current: 45, goal: 65, color: "fats" as const },
  };

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const trialDays = trialDaysRemaining();

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-4 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold">Hey, {firstName}! 👋</h1>
            <p className="text-muted-foreground text-sm">
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
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <CalorieRing
                  consumed={caloriesConsumed}
                  goal={calorieGoal}
                  size={140}
                />
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Daily Goal</p>
                    <p className="text-2xl font-bold">
                      {caloriesConsumed}{" "}
                      <span className="text-lg font-normal text-muted-foreground">
                        / {calorieGoal} cal
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-full gap-1.5">
                      <Plus className="h-4 w-4" />
                      Log Meal
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
          className="grid grid-cols-3 gap-3"
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
            <h2 className="text-lg font-semibold">Today's Meals</h2>
            <Button variant="ghost" size="sm" className="text-primary">
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
            />
            <MealCard
              type="lunch"
              name="Grilled Chicken Salad"
              calories={380}
              time="12:45 PM"
              logged
            />
            <MealCard
              type="dinner"
              name="Suggested: Salmon with Veggies"
              calories={550}
              time={profile?.dinner_time || "7:00 PM"}
              suggested
            />
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
              <Award className="h-10 w-10 opacity-90" />
              <div>
                <p className="font-semibold">You're doing amazing!</p>
                <p className="text-sm opacity-90">
                  You've hit your protein goal 5 days in a row 💪
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
