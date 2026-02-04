import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrialPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial: () => void;
}

const TrialPopup = ({ isOpen, onClose, onStartTrial }: TrialPopupProps) => {
  const features = [
    { icon: Sparkles, text: "AI-powered meal suggestions" },
    { icon: Clock, text: "Smart pantry tracking" },
    { icon: Zap, text: "Personalized nutrition goals" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 sm:inset-x-auto"
            initial={{ opacity: 0, scale: 0.95, y: "-45%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, y: "-45%" }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative overflow-hidden rounded-3xl bg-card shadow-soft-lg">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Gradient header */}
              <div className="gradient-primary px-6 pb-8 pt-12 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm"
                >
                  <Sparkles className="h-8 w-8 text-white" />
                </motion.div>

                <motion.h2
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-2xl font-bold text-white"
                >
                  Welcome to NutriGen! 🎉
                </motion.h2>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm"
                >
                  <Clock className="h-4 w-4" />
                  Free for 20 days
                </motion.div>
              </div>

              {/* Content */}
              <div className="p-6">
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="mb-6 text-center text-muted-foreground"
                >
                  Get personalized meal plans powered by AI. No credit card required to start.
                </motion.p>

                {/* Features */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6 space-y-3"
                >
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <feature.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </motion.div>

                {/* Actions */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={onStartTrial}
                    className="w-full gradient-primary hover:opacity-90 text-white font-semibold py-6 rounded-xl text-base shadow-glow transition-all hover:shadow-glow-lg"
                  >
                    Start Free Trial
                  </Button>

                  <button
                    onClick={onClose}
                    className="w-full py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Maybe later
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TrialPopup;
