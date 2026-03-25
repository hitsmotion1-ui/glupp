"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ScanLine,
  Swords,
  Trophy,
  Users,
  Camera,
  MapPin,
  Zap,
  Star,
} from "lucide-react";

// ═══════════════════════════════════════════
// Steps config
// ═══════════════════════════════════════════

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  features?: { icon: React.ReactNode; text: string }[];
}

const STEPS: OnboardingStep[] = [
  {
    icon: (
      <div className="relative">
        <span className="text-6xl">🍺</span>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-2 -right-2 text-2xl"
        >
          ✨
        </motion.div>
      </div>
    ),
    title: "Bienvenue sur Glupp !",
    description: "Ton Beerdex personnel. Chaque gorgee compte.",
    color: "#E08840",
    features: [
      { icon: <ScanLine size={14} />, text: "Scanne ou cherche une biere" },
      { icon: <Camera size={14} />, text: "Prends une photo pour +15 XP" },
      { icon: <Star size={14} />, text: "Collectionne-les toutes" },
    ],
  },
  {
    icon: (
      <div className="relative flex items-center gap-3">
        <motion.div
          animate={{ x: [0, 8, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-5xl"
        >
          🍻
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
          className="text-3xl"
        >
          ⚡
        </motion.div>
      </div>
    ),
    title: "Gluppe & Gagne",
    description: "Chaque action te rapporte de l'XP. Monte de niveau !",
    color: "#4ECDC4",
    features: [
      { icon: <Zap size={14} />, text: "Glupp = +5 XP de base" },
      { icon: <Camera size={14} />, text: "Photo = +15 XP bonus" },
      { icon: <MapPin size={14} />, text: "Position = +20 XP bonus" },
    ],
  },
  {
    icon: (
      <div className="flex items-center gap-1">
        <motion.div
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="text-5xl"
        >
          ⚔️
        </motion.div>
      </div>
    ),
    title: "Duels de bieres",
    description:
      "Compare tes bieres en duels pour creer TON classement personnel.",
    color: "#A78BFA",
    features: [
      { icon: <Swords size={14} />, text: "2 bieres, 1 choix" },
      { icon: <Trophy size={14} />, text: "Ton top se construit duel apres duel" },
      { icon: <Zap size={14} />, text: "+10 XP par duel" },
    ],
  },
  {
    icon: (
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="text-5xl"
        >
          🏆
        </motion.div>
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
          className="text-3xl"
        >
          🎖️
        </motion.div>
      </div>
    ),
    title: "Trophees & Niveaux",
    description: "7 niveaux a debloquer. Des dizaines de trophees a collecter.",
    color: "#F0C460",
    features: [
      { icon: <Star size={14} />, text: "Du Neophyte au Titan" },
      { icon: <Trophy size={14} />, text: "Trophees par style, pays, rarete" },
      { icon: <Sparkles size={14} />, text: "Avatars exclusifs a debloquer" },
    ],
  },
  {
    icon: (
      <div className="flex items-center">
        <motion.div
          animate={{ x: [-4, 4, -4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-5xl"
        >
          👥
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-3xl -ml-2"
        >
          🍻
        </motion.div>
      </div>
    ),
    title: "Potes & Crews",
    description:
      "Forme ton crew, compare vos collections, organisez vos sorties.",
    color: "#E08840",
    features: [
      { icon: <Users size={14} />, text: "Cree ou rejoins un crew" },
      { icon: <Star size={14} />, text: "Compare tes stats avec tes potes" },
      { icon: <MapPin size={14} />, text: "Planifie des sorties ensemble" },
    ],
  },
];

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(1);

  // Verifier dans la base de donnees si l'onboarding a deja ete vu
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("has_seen_onboarding")
          .eq("id", user.id)
          .single();

        if (profile && !profile.has_seen_onboarding) {
          setShow(true);
        }
      } catch {
        // En cas d'erreur, on n'affiche pas l'onboarding
      } finally {
        setLoading(false);
      }
    };

    checkOnboarding();
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

  const handleFinish = async () => {
    // Marquer comme vu dans la base de donnees
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ has_seen_onboarding: true })
          .eq("id", user.id);
      }
    } catch {
      // Fallback localStorage si l'update echoue
      localStorage.setItem("glupp-onboarding-done", "true");
    }

    setShow(false);
  };

  if (loading || !show) return null;

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
        {/* Skip button — visible a partir du step 2 */}
        <div className="flex justify-end p-4 h-14">
          {step > 0 && (
            <button
              onClick={handleFinish}
              className="text-xs text-glupp-text-muted hover:text-glupp-cream transition-colors px-3 py-1.5 rounded-full border border-glupp-border"
            >
              Passer
            </button>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -80 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="text-center max-w-sm w-full"
            >
              {/* Icon area with glow */}
              <div
                className="flex items-center justify-center mb-8 h-24"
                style={{
                  filter: `drop-shadow(0 0 30px ${currentStep.color}30)`,
                }}
              >
                {currentStep.icon}
              </div>

              {/* Title */}
              <h2
                className="font-display text-2xl font-bold mb-3"
                style={{ color: currentStep.color }}
              >
                {currentStep.title}
              </h2>

              {/* Description */}
              <p className="text-glupp-text-soft text-sm leading-relaxed mb-8">
                {currentStep.description}
              </p>

              {/* Feature pills */}
              {currentStep.features && (
                <div className="space-y-2.5">
                  {currentStep.features.map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.1 }}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left"
                      style={{
                        backgroundColor: `${currentStep.color}08`,
                        borderColor: `${currentStep.color}20`,
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${currentStep.color}15`,
                          color: currentStep.color,
                        }}
                      >
                        {feature.icon}
                      </div>
                      <span className="text-sm text-glupp-cream">
                        {feature.text}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
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
