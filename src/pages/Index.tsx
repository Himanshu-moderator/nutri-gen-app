import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import SplashScreen from "@/components/SplashScreen";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const SPLASH_KEY = "nutrigen_splash_seen";

const features = [
  { emoji: "🍽️", text: "Meal suggestions matched to your goals" },
  { emoji: "📊", text: "Track calories & macros" },
  { emoji: "🥗", text: "Smart pantry with expiry alerts" },
  { emoji: "🔥", text: "Build a logging streak" },
];

// Flow for new visitors: splash -> welcome -> onboarding -> free trial ->
// sign up. Returning users can sign in, and anyone can try the demo.
const Index = () => {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return sessionStorage.getItem(SPLASH_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const { user, loading, startDemoMode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Signed-in visitors skip straight to the app.
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSplashComplete = () => {
    try {
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {
      // ignore
    }
    setShowSplash(false);
  };

  const handleDemo = () => {
    startDemoMode();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      </AnimatePresence>

      {!showSplash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center"
        >
          <div className="max-w-md space-y-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center shadow-xl"
            >
              <Sparkles className="h-12 w-12 text-primary-foreground" />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-4xl font-bold gradient-text mb-3">NutriGen</h1>
              <p className="text-muted-foreground text-lg">
                Your meal planning companion. Eat smarter, feel better.
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid gap-3 text-left"
            >
              {features.map((feature) => (
                <div
                  key={feature.text}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                >
                  <span className="text-xl">{feature.emoji}</span>
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <Button
                onClick={() => navigate("/onboarding")}
                className="w-full gradient-primary text-primary-foreground h-14 text-base font-semibold rounded-2xl"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                onClick={handleDemo}
                className="w-full h-12 rounded-2xl text-base"
              >
                Try the demo
              </Button>
              <button
                onClick={() => navigate("/auth?mode=login")}
                className="text-sm text-primary hover:underline font-medium"
              >
                I already have an account
              </button>
              <p className="text-xs text-muted-foreground">
                20-day free trial • No credit card required
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Index;
