import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import TrialPopup from "@/components/TrialPopup";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [hasSeenTrial, setHasSeenTrial] = useState(false);

  useEffect(() => {
    // Check if user has already seen the trial popup
    const trialSeen = localStorage.getItem("nutrigen_trial_seen");
    if (trialSeen) {
      setHasSeenTrial(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    // Show trial popup if user hasn't seen it
    if (!hasSeenTrial) {
      setTimeout(() => setShowTrialPopup(true), 100);
    }
  };

  // Trial popup only has start trial - no close option

  const handleStartTrial = () => {
    setShowTrialPopup(false);
    localStorage.setItem("nutrigen_trial_seen", "true");
    localStorage.setItem("nutrigen_trial_started", new Date().toISOString());
    setHasSeenTrial(true);
    // TODO: Navigate to onboarding
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Splash Screen */}
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen onComplete={handleSplashComplete} />
        )}
      </AnimatePresence>

      {/* Trial Popup */}
      <TrialPopup
        isOpen={showTrialPopup}
        onClose={handleTrialClose}
        onStartTrial={handleStartTrial}
      />

      {/* Main Content - Placeholder for now */}
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
