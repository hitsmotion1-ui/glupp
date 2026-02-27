"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

interface OnboardingStep {
  emoji: string;
  title: string;
  description: string;
  color: string;
}

const STEPS: OnboardingStep[] = [
  {
    emoji: "🍺",
    title: "Bienvenue sur Glupp !",
    description:
      "Collectionne toutes les bières que tu goûtes, comme un Pokédex de la bière. Chaque gorgée compte !",
    color: "#E08840",
  },
  {
    emoji: "📸",
    title: "Scanne & Gluppe",
    description:
      "Scanne le code-barres ou cherche une bière pour l'ajouter à ta collection. Prends une photo pour gagner plus d'XP !",
    color: "#4ECDC4",
  },
  {
    emoji: "⚔️",
    title: "Duels de bières",
    description:
      "Compare tes bières goûtées en duels pour établir TON classement. Plus tu joues, plus le ranking s'affine.",
    color: "#A78BFA",
  },
  {
    emoji: "🏆",
    title: "Trophées & Niveaux",
    description:
      "Gagne de l'XP à chaque action et monte de niveau. Débloque des trophées en explorant de nouveaux styles !",
    color: "#F0C460",
  },
  {
    emoji: "👥",
    title: "Social & Crews",
    description:
      "Ajoute tes potes, forme des crews et comparez vos collections. Qui aura le plus de bières légendaires ?",
    color: "#E08840",
  },
];

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  useEffect(() => {
    const done = localStorage.getItem("glupp-onboarding-done");
    if (!done) {
      setShow(true);
    }
  }, []);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem("glupp-onboarding-done", "true");
    setShow(false);
  };

  if (!show) return null;

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-glupp-bg flex flex-col"
      >
        {/* Skip button */}
        <div className="flex justify-end p-4">
          <button
            onClick={handleFinish}
            className="text-xs text-glupp-text-muted hover:text-glupp-cream transition-colors px-3 py-1.5 rounded-full border border-glupp-border"
          >
            Passer
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="text-center max-w-sm"
            >
              {/* Emoji with glow */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className="text-7xl mb-8"
                style={{
                  filter: `drop-shadow(0 0 20px ${currentStep.color}40)`,
                }}
              >
                {currentStep.emoji}
              </motion.div>

              {/* Title */}
              <h2
                className="font-display text-2xl font-bold mb-4"
                style={{ color: currentStep.color }}
              >
                {currentStep.title}
              </h2>

              {/* Description */}
              <p className="text-glupp-text-soft text-sm leading-relaxed">
                {currentStep.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom navigation */}
        <div className="p-6 space-y-4">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === step ? 24 : 8,
                  backgroundColor:
                    i === step ? currentStep.color : "#3A3530",
                }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full"
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-3">
            {step > 0 && (
              <Button variant="ghost" onClick={handlePrev} className="flex-1">
                <ChevronLeft size={16} className="mr-1" />
                Retour
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleNext}
              className={step === 0 ? "w-full" : "flex-1"}
              size="lg"
            >
              {isLast ? (
                <>
                  <Sparkles size={16} className="mr-1.5" />
                  C&apos;est parti !
                </>
              ) : (
                <>
                  Suivant
                  <ChevronRight size={16} className="ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Safe area bottom */}
        <div className="pb-[env(safe-area-inset-bottom,0px)]" />
      </motion.div>
    </AnimatePresence>
  );
}
