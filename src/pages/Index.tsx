import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import TrialPopup from "@/components/TrialPopup";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [hasSeenTrial, setHasSeenTrial] = useState(false);

  useEffect(() => {
    const trialSeen = localStorage.getItem("nutrigen_trial_seen");
    if (trialSeen) {
      setHasSeenTrial(true);
    }
  }, []);

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

      {!showSplash && (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold gradient-text mb-4">
              NutriGen
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Your AI-powered meal planning companion is coming soon.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              ✨ Phase 1 Complete - Splash & Trial Popup
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
