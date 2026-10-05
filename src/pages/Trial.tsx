import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { loadOnboardingDraft } from "@/lib/onboardingDraft";

const features = [
  { icon: Sparkles, text: "Meal suggestions matched to your goals and pantry" },
  { icon: Clock, text: "Pantry tracking with expiry alerts" },
  { icon: Zap, text: "Calorie and macro targets built around you" },
];

// Shown right after onboarding: the free trial begins when the account is
// created, so this page leads into sign-up.
const Trial = () => {
  const navigate = useNavigate();
  const { user, loading, startDemoMode } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate("/dashboard", { replace: true });
    } else if (!loadOnboardingDraft()) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleDemo = () => {
    startDemoMode();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to onboarding"
          onClick={() => navigate("/onboarding")}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-soft-lg"
        >
          <div className="gradient-primary px-6 pb-8 pt-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Your plan is ready! 🎉</h1>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              <Clock className="h-4 w-4" />
              Free for 20 days
            </div>
          </div>

          <div className="p-6">
            <p className="mb-6 text-center text-muted-foreground">
              Create your account to save your preferences and start your free trial.
              No credit card required.
            </p>

            <div className="mb-6 space-y-3">
              {features.map((feature) => (
                <div
                  key={feature.text}
                  className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => navigate("/auth?mode=signup")}
              className="w-full gradient-primary hover:opacity-90 text-white font-semibold py-6 rounded-xl text-base shadow-glow"
            >
              Start Free Trial
            </Button>

            <div className="mt-4 flex flex-col items-center gap-2 text-sm">
              <button
                onClick={() => navigate("/auth?mode=login")}
                className="text-primary hover:underline font-medium"
              >
                Already have an account? Sign in
              </button>
              <button
                onClick={handleDemo}
                className="text-muted-foreground hover:text-foreground hover:underline"
              >
                Just looking? Try the demo
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Trial;
