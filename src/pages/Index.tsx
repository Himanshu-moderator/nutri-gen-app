import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import SplashScreen from "@/components/SplashScreen";
import TrialPopup from "@/components/TrialPopup";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [hasSeenTrial, setHasSeenTrial] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const trialSeen = localStorage.getItem("nutrigen_trial_seen");
    if (trialSeen) {
      setHasSeenTrial(true);
    }
  }, []);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleSplashComplete = () => {
    setShowSplash(false);
    if (!hasSeenTrial) {
      setTimeout(() => setShowTrialPopup(true), 100);
    }
  };

  const handleStartTrial = () => {
    setShowTrialPopup(false);
    localStorage.setItem("nutrigen_trial_seen", "true");
    localStorage.setItem("nutrigen_trial_started", new Date().toISOString());
    setHasSeenTrial(true);
    // Navigate to auth after trial popup
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen onComplete={handleSplashComplete} />
        )}
      </AnimatePresence>

      <TrialPopup
        isOpen={showTrialPopup}
        onStartTrial={handleStartTrial}
      />

      {!showSplash && hasSeenTrial && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
        >
          <div className="max-w-md space-y-8">
            {/* Logo */}
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
              <h1 className="text-4xl font-bold gradient-text mb-3">
                NutriGen
              </h1>
              <p className="text-muted-foreground text-lg">
                Your AI-powered meal planning companion. Eat smarter, feel better.
              </p>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid gap-3 text-left"
            >
              {[
                { emoji: "🍽️", text: "Personalized meal suggestions" },
                { emoji: "📊", text: "Track calories & macros" },
                { emoji: "🥗", text: "Smart pantry management" },
                { emoji: "🤖", text: "AI-powered recommendations" },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                >
                  <span className="text-xl">{feature.emoji}</span>
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <Button
                onClick={() => navigate("/auth")}
                className="w-full gradient-primary text-primary-foreground h-14 text-base font-semibold rounded-2xl"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
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
