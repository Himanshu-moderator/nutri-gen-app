import { motion } from "framer-motion";
import { Utensils } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center gradient-primary"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 300);
      }}
    >
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.3, 
          ease: [0.16, 1, 0.3, 1] 
        }}
      >
        {/* Logo Icon */}
        <motion.div
          className="relative"
          initial={{ rotate: -20 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-glow-lg">
            <Utensils className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-white/30"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{ 
              duration: 0.6, 
              ease: "easeOut",
              repeat: 0
            }}
          />
        </motion.div>

        {/* Brand Name */}
        <motion.h1
          className="text-4xl font-bold text-white tracking-tight"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          NutriGen
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="text-white/80 text-sm font-medium"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          Eat smarter, not harder
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
