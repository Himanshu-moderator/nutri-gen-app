import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Save, Target, Apple, Clock, Loader2, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AppLayout from "@/components/AppLayout";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

const healthGoals = [
  { value: "lose_weight", label: "Lose Weight", emoji: "🏃" },
  { value: "maintain_weight", label: "Maintain Weight", emoji: "⚖️" },
  { value: "gain_weight", label: "Gain Weight", emoji: "💪" },
  { value: "build_muscle", label: "Build Muscle", emoji: "🏋️" },
  { value: "improve_health", label: "Improve Health", emoji: "❤️" },
];

const dietaryPreferences = [
  { value: "vegetarian", label: "Vegetarian", emoji: "🥗" },
  { value: "vegan", label: "Vegan", emoji: "🌱" },
  { value: "keto", label: "Keto", emoji: "🥑" },
  { value: "paleo", label: "Paleo", emoji: "🍖" },
  { value: "gluten_free", label: "Gluten Free", emoji: "🌾" },
  { value: "dairy_free", label: "Dairy Free", emoji: "🥛" },
  { value: "halal", label: "Halal", emoji: "☪️" },
  { value: "kosher", label: "Kosher", emoji: "✡️" },
];

const Preferences = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();

  const [selectedGoal, setSelectedGoal] = useState("");
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [calorieTarget, setCalorieTarget] = useState("2000");
  const [times, setTimes] = useState({
    breakfast_time: "08:00",
    lunch_time: "12:30",
    dinner_time: "19:00",
  });
  const [aiPantryMeals, setAiPantryMeals] = useState(true);
  const [budgetMode, setBudgetMode] = useState(false);
  const [weeklyBudget, setWeeklyBudget] = useState("50");
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile) {
      setSelectedGoal(profile.health_goal || "");
      setSelectedDiets(profile.dietary_preferences || []);
      setCalorieTarget(profile.daily_calorie_target?.toString() || "2000");
      setTimes({
        breakfast_time: profile.breakfast_time?.slice(0, 5) || "08:00",
        lunch_time: profile.lunch_time?.slice(0, 5) || "12:30",
        dinner_time: profile.dinner_time?.slice(0, 5) || "19:00",
      });
    }
  }, [profile]);

  const checkChanges = () => {
    if (!profile) return false;
    return (
      selectedGoal !== (profile.health_goal || "") ||
      JSON.stringify(selectedDiets.sort()) !== JSON.stringify((profile.dietary_preferences || []).sort()) ||
      calorieTarget !== (profile.daily_calorie_target?.toString() || "2000") ||
      times.breakfast_time !== (profile.breakfast_time?.slice(0, 5) || "08:00") ||
      times.lunch_time !== (profile.lunch_time?.slice(0, 5) || "12:30") ||
      times.dinner_time !== (profile.dinner_time?.slice(0, 5) || "19:00")
    );
  };

  useEffect(() => {
    setHasChanges(checkChanges());
  }, [selectedGoal, selectedDiets, calorieTarget, times, profile]);

  const toggleDiet = (diet: string) => {
    setSelectedDiets((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        health_goal: selectedGoal || null,
        dietary_preferences: selectedDiets,
        daily_calorie_target: parseInt(calorieTarget) || 2000,
        breakfast_time: times.breakfast_time,
        lunch_time: times.lunch_time,
        dinner_time: times.dinner_time,
      });
      toast({ title: "Preferences saved!", description: "Your health goals and preferences have been updated." });
      setShowConfirm(false);
      navigate("/profile");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-8 space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Preferences</h1>
        </motion.div>

        {/* Health Goal */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Health Goal</h3>
              </div>
              <div className="grid gap-2">
                {healthGoals.map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => setSelectedGoal(goal.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      selectedGoal === goal.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="text-xl">{goal.emoji}</span>
                    <span className="font-medium flex-1">{goal.label}</span>
                    {selectedGoal === goal.value && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Dietary Preferences */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Apple className="h-5 w-5 text-secondary" />
                <h3 className="font-semibold">Dietary Preferences</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {dietaryPreferences.map((diet) => (
                  <button
                    key={diet.value}
                    onClick={() => toggleDiet(diet.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      selectedDiets.includes(diet.value)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="text-xl">{diet.emoji}</span>
                    <span className="text-xs font-medium">{diet.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Calorie Target */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Daily Calorie Target</h3>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={calorieTarget}
                  onChange={(e) => setCalorieTarget(e.target.value)}
                  className="text-center text-lg font-bold max-w-32"
                  min={800}
                  max={6000}
                />
                <span className="text-muted-foreground">kcal / day</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Meal Times */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-5 w-5 text-accent" />
                <h3 className="font-semibold">Meal Times</h3>
              </div>
              {[
                { key: "breakfast_time", label: "Breakfast" },
                { key: "lunch_time", label: "Lunch" },
                { key: "dinner_time", label: "Dinner" },
              ].map((meal) => (
                <div key={meal.key} className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <Label className="font-medium">{meal.label}</Label>
                  <input
                    type="time"
                    value={times[meal.key as keyof typeof times]}
                    onChange={(e) => setTimes({ ...times, [meal.key]: e.target.value })}
                    className="bg-muted rounded-lg px-3 py-2 text-foreground text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={!hasChanges}
            className="w-full gradient-primary text-primary-foreground h-14 text-base font-semibold rounded-2xl disabled:opacity-50"
          >
            <Save className="mr-2 h-5 w-5" />
            Save Preferences
          </Button>
          {!hasChanges && (
            <p className="text-center text-xs text-muted-foreground mt-2">No changes to save</p>
          )}
        </motion.div>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Save changes?</AlertDialogTitle>
              <AlertDialogDescription>
                Your health goal, dietary preferences, calorie target, and meal times will be updated. This will affect your meal suggestions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {saving ? "Saving..." : "Confirm & Save"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Preferences;
