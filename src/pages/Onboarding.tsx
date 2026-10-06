import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Target, Apple, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { clearOnboardingDraft, loadOnboardingDraft, saveOnboardingDraft } from "@/lib/onboardingDraft";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils";

const steps = [
  {
    id: "goals",
    title: "What's your goal?",
    subtitle: "We'll personalize your experience",
    icon: Target,
  },
  {
    id: "diet",
    title: "Dietary preferences",
    subtitle: "Any restrictions we should know?",
    icon: Apple,
  },
  {
    id: "meals",
    title: "Meal times",
    subtitle: "When do you usually eat?",
    icon: Clock,
  },
  {
    id: "ready",
    title: "You're all set!",
    subtitle: "Let's start your journey",
    icon: Sparkles,
  },
];

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

const mealTimes = [
  { key: "breakfast_time", label: "Breakfast", default: "08:00" },
  { key: "lunch_time", label: "Lunch", default: "12:30" },
  { key: "dinner_time", label: "Dinner", default: "19:00" },
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [times, setTimes] = useState({
    breakfast_time: "08:00",
    lunch_time: "12:30",
    dinner_time: "19:00",
  });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  // Visitors without an account answer first; their answers are kept and saved
  // to their profile once they sign up.
  const isGuest = !user;

  useEffect(() => {
    const draft = loadOnboardingDraft();
    if (!draft) return;
    setSelectedGoal(draft.health_goal);
    setSelectedDiets(draft.dietary_preferences);
    setTimes({
      breakfast_time: draft.breakfast_time,
      lunch_time: draft.lunch_time,
      dinner_time: draft.dinner_time,
    });
  }, []);
  const { toast } = useToast();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (isGuest) {
      saveOnboardingDraft({
        health_goal: selectedGoal,
        dietary_preferences: selectedDiets,
        ...times,
      });
      navigate("/trial");
      return;
    }
    setLoading(true);
    try {
      await updateProfile.mutateAsync({
        health_goal: selectedGoal,
        dietary_preferences: selectedDiets,
        breakfast_time: times.breakfast_time,
        lunch_time: times.lunch_time,
        dinner_time: times.dinner_time,
        onboarding_completed: true,
      });
      clearOnboardingDraft();
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to save preferences"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDiet = (diet: string) => {
    setSelectedDiets((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!selectedGoal;
      case 1:
        return true; // Diet is optional
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          {(currentStep > 0 || isGuest) && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Back"
              onClick={currentStep > 0 ? handleBack : () => navigate("/")}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1 flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col px-6"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-4"
            >
              <StepIcon className="h-8 w-8 text-primary-foreground" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">{steps[currentStep].title}</h1>
            <p className="text-muted-foreground">{steps[currentStep].subtitle}</p>
          </div>

          {/* Content */}
          <div className="flex-1">
            {currentStep === 0 && (
              <div className="grid gap-3">
                {healthGoals.map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => setSelectedGoal(goal.value)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                      selectedGoal === goal.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-2xl">{goal.emoji}</span>
                    <span className="font-medium flex-1 text-left">{goal.label}</span>
                    {selectedGoal === goal.value && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {currentStep === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {dietaryPreferences.map((diet) => (
                  <button
                    key={diet.value}
                    onClick={() => toggleDiet(diet.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      selectedDiets.includes(diet.value)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-2xl">{diet.emoji}</span>
                    <span className="text-sm font-medium">{diet.label}</span>
                  </button>
                ))}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                {mealTimes.map((meal) => (
                  <div
                    key={meal.key}
                    className="flex items-center justify-between p-4 rounded-2xl border border-border"
                  >
                    <span className="font-medium">{meal.label}</span>
                    <input
                      type="time"
                      value={times[meal.key as keyof typeof times]}
                      onChange={(e) =>
                        setTimes({ ...times, [meal.key]: e.target.value })
                      }
                      className="bg-muted rounded-lg px-3 py-2 text-foreground"
                    />
                  </div>
                ))}
              </div>
            )}

            {currentStep === 3 && (
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="text-6xl"
                >
                  🎉
                </motion.div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">Your profile is ready!</p>
                  <p className="text-muted-foreground">
                    We've personalized NutriGen based on your preferences.
                    {isGuest
                      ? " Next, start your free trial so your plan is saved to your account."
                      : " Start exploring meal suggestions tailored just for you."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="py-6">
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="w-full gradient-primary text-primary-foreground h-14 text-base font-semibold rounded-2xl"
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={loading}
                className="w-full gradient-primary text-primary-foreground h-14 text-base font-semibold rounded-2xl"
              >
                {loading ? "Setting up..." : isGuest ? "Continue" : "Get Started"}
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;
