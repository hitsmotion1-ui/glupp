"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { useAvatars } from "@/lib/hooks/useAvatars";
import Image from "next/image";
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
  Check,
  Bell,
  BellRing,
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
      <div className="relative">
        <motion.div
          animate={{ rotate: [0, -8, 0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl"
        >
          📖
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute -top-1 -right-3 text-xl"
        >
          💡
        </motion.div>
      </div>
    ),
    title: "Parle comme un Gluppeur",
    description: "Ici, on a notre propre vocabulaire. Petit lexique express :",
    color: "#F0C460",
    features: [
      { icon: <span className="text-xs font-bold">G</span>, text: "Glupp — Une biere goutee et enregistree" },
      { icon: <Zap size={14} />, text: "Glupper — Ajouter une biere a ta collection" },
      { icon: <Users size={14} />, text: "Gluppeur — Toi ! Un membre de la communaute" },
      { icon: <Star size={14} />, text: "Beerdex — Ta collection complete de bieres" },
      { icon: <Trophy size={14} />, text: "Crew — Ton groupe de potes Gluppeurs" },
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
    description: "Compare tes bieres en duels pour creer TON classement personnel.",
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
    description: "Forme ton crew, compare vos collections, organisez vos sorties.",
    color: "#E08840",
    features: [
      { icon: <Users size={14} />, text: "Cree ou rejoins un crew" },
      { icon: <Star size={14} />, text: "Compare tes stats avec tes potes" },
      { icon: <MapPin size={14} />, text: "Planifie des sorties ensemble" },
    ],
  },
];

// Le slide avatar est l'avant-dernier, le slide notifications est le dernier
const TOTAL_SLIDES = STEPS.length + 2;
const AVATAR_SLIDE_INDEX = STEPS.length;
const NOTIF_SLIDE_INDEX = STEPS.length + 1;

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(1);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>("curieux");
  const [city, setCity] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [pushRequested, setPushRequested] = useState(false);
  const [pushGranted, setPushGranted] = useState(false);
  
  const { avatars, loading: avatarsLoading } = useAvatars(userId, 0);
  const freeAvatars = avatars.filter((a) => a.unlock_type === "free");

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        setUserId(user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("has_seen_onboarding, avatar_id")
          .eq("id", user.id)
          .single();

        if (profile && !profile.has_seen_onboarding) {
          if (profile.avatar_id) setSelectedAvatarId(profile.avatar_id);
          setShow(true);
        }
      } catch {
        // pas d'onboarding en cas d'erreur
      } finally {
        setLoading(false);
      }
    };
    checkOnboarding();
  }, []);

  // Autocomplétion ville via API Géo gouv
  useEffect(() => {
    if (city.length < 2) { setCitySuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${city}&fields=departement&boost=population&limit=5`);
        const data = await res.json();
        setCitySuggestions(data.map((c: any) => `${c.nom} (${c.departement?.code || ''})`));
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [city]);

  const handleEnablePush = async () => {
    setPushRequested(true);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;

      const padding = "=".repeat((4 - (vapidKey.length % 4)) % 4);
      const base64 = (vapidKey + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      const keyArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) keyArray[i] = rawData.charCodeAt(i);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyArray as BufferSource,
      });

      const subJson = subscription.toJSON();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("push_subscriptions").upsert({
          user_id: user.id,
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys!.p256dh!,
          auth: subJson.keys!.auth!,
        }, { onConflict: "user_id,endpoint" });
      }
      setPushGranted(true);
    } catch {
      // Permission refusée ou erreur — on continue
    }
  };

  const handleNext = () => {
    if (step < TOTAL_SLIDES - 1) {
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
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ 
            has_seen_onboarding: true, 
            avatar_id: selectedAvatarId,
            city: city.trim() || null,
          })
          .eq("id", user.id);
      }
    } catch {
      localStorage.setItem("glupp-onboarding-done", "true");
    }
    setShow(false);
  };

  if (loading || !show) return null;

  const isAvatarSlide = step === AVATAR_SLIDE_INDEX;
  const isNotifSlide = step === NOTIF_SLIDE_INDEX;
  const isLast = step === TOTAL_SLIDES - 1;
  const currentStep = (!isAvatarSlide && !isNotifSlide) ? STEPS[step] : null;
  const currentColor = isAvatarSlide ? "#E08840" : isNotifSlide ? "#4ECDC4" : currentStep!.color;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-glupp-bg flex flex-col"
      >
        {/* Skip */}
        <div className="flex justify-end p-4 h-14">
          {step > 0 && (
            <button onClick={handleFinish}
              className="text-xs text-glupp-text-muted hover:text-glupp-cream transition-colors px-3 py-1.5 rounded-full border border-glupp-border">
              Passer
            </button>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto">
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
              {isAvatarSlide ? (
                /* ═══ AVATAR SLIDE ═══ */
                <div>
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-5xl mb-4"
                  >
                    🎭
                  </motion.div>

                  <h2 className="font-display text-2xl font-bold mb-2 text-glupp-accent">
                    Choisis ton avatar
                  </h2>
                  <p className="text-glupp-text-soft text-sm leading-relaxed mb-6">
                    C&apos;est ta tete de Gluppeur ! Tu pourras en debloquer d&apos;autres en montant de niveau.
                  </p>

                  {avatarsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-2 border-glupp-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3 max-w-xs mx-auto">
                      {freeAvatars.map((avatar, i) => {
                        const isSelected = selectedAvatarId === avatar.id;
                        return (
                          <motion.button
                            key={avatar.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => setSelectedAvatarId(avatar.id)}
                            className="flex flex-col items-center gap-1"
                          >
                            <div
                              className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${
                                isSelected
                                  ? "border-glupp-accent ring-2 ring-glupp-accent/30 scale-110"
                                  : "border-glupp-border hover:border-glupp-accent/50"
                              }`}
                            >
                              <Image
                                src={`/avatars/${avatar.file_name}.png`}
                                alt={avatar.name}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-glupp-accent/20 flex items-center justify-center">
                                  <div className="w-5 h-5 rounded-full bg-glupp-accent flex items-center justify-center">
                                    <Check size={12} className="text-glupp-bg" />
                                  </div>
                                </div>
                              )}
                            </div>
                            <span className={`text-[10px] leading-tight ${
                              isSelected ? "text-glupp-accent font-semibold" : "text-glupp-text-muted"
                            }`}>
                              {avatar.name}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {/* Ville */}
                  <div className="mt-6 max-w-xs mx-auto text-left relative">
                    <label className="text-xs text-glupp-text-muted mb-1 block">📍 Ta ville</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => { setCity(e.target.value); setCitySuggestions([]); }}
                      placeholder="Ex: Nantes, Lyon, Paris..."
                      className="w-full px-3 py-2 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
                    />
                    {citySuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-glupp-card border border-glupp-border rounded-glupp overflow-hidden shadow-lg">
                        {citySuggestions.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => { setCity(s); setCitySuggestions([]); }}
                            className="w-full text-left px-3 py-2 text-sm text-glupp-cream hover:bg-glupp-accent/10 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-glupp-text-muted mt-1">Optionnel — pour trouver des Gluppeurs pres de chez toi</p>
                  </div>
                </div>
              ) : isNotifSlide ? (
                /* ═══ NOTIFICATION SLIDE ═══ */
                <div>
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    className="text-5xl mb-4"
                  >
                    {pushGranted ? "✅" : "🔔"}
                  </motion.div>

                  <h2 className="font-display text-2xl font-bold mb-2 text-[#4ECDC4]">
                    {pushGranted ? "Notifications activees !" : "Reste connecte !"}
                  </h2>
                  <p className="text-glupp-text-soft text-sm leading-relaxed mb-6">
                    {pushGranted 
                      ? "Tu seras prevenu quand quelqu'un reagit a tes glupps, commente ou te defie !"
                      : "Active les notifications pour ne rien rater : commentaires, reactions, badges, et plus encore."
                    }
                  </p>

                  {!pushGranted && (
                    <div className="space-y-3 mb-6">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left bg-[#4ECDC4]/8 border-[#4ECDC4]/20"
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#4ECDC4]/15 text-[#4ECDC4]">
                          <BellRing size={14} />
                        </div>
                        <span className="text-sm text-glupp-cream">Quand on commente ton glupp</span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left bg-[#4ECDC4]/8 border-[#4ECDC4]/20"
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#4ECDC4]/15 text-[#4ECDC4]">
                          <Trophy size={14} />
                        </div>
                        <span className="text-sm text-glupp-cream">Quand tu debloques un badge</span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left bg-[#4ECDC4]/8 border-[#4ECDC4]/20"
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#4ECDC4]/15 text-[#4ECDC4]">
                          <Users size={14} />
                        </div>
                        <span className="text-sm text-glupp-cream">Quand un ami te defie ou te tague</span>
                      </motion.div>
                    </div>
                  )}

                  {!pushGranted && !pushRequested && (
                    <button
                      onClick={handleEnablePush}
                      className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#4ECDC4] text-glupp-bg font-bold text-sm hover:bg-[#4ECDC4]/90 transition-colors"
                    >
                      <Bell size={16} />
                      Activer les notifications
                    </button>
                  )}

                  {pushRequested && !pushGranted && (
                    <p className="text-xs text-glupp-text-muted mt-2">
                      Pas de souci, tu pourras les activer plus tard dans les parametres.
                    </p>
                  )}

                  {pushGranted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="text-4xl"
                    >
                      🎉
                    </motion.div>
                  )}
                </div>
              ) : (
                /* ═══ REGULAR SLIDES ═══ */
                <>
                  <div
                    className="flex items-center justify-center mb-8 h-24"
                    style={{ filter: `drop-shadow(0 0 30px ${currentStep!.color}30)` }}
                  >
                    {currentStep!.icon}
                  </div>

                  <h2
                    className="font-display text-2xl font-bold mb-3"
                    style={{ color: currentStep!.color }}
                  >
                    {currentStep!.title}
                  </h2>

                  <p className="text-glupp-text-soft text-sm leading-relaxed mb-8">
                    {currentStep!.description}
                  </p>

                  {currentStep!.features && (
                    <div className="space-y-2.5">
                      {currentStep!.features.map((feature, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 + i * 0.1 }}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left"
                          style={{
                            backgroundColor: `${currentStep!.color}08`,
                            borderColor: `${currentStep!.color}20`,
                          }}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `${currentStep!.color}15`,
                              color: currentStep!.color,
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
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom navigation */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === step ? 24 : 8,
                  backgroundColor: i === step ? currentColor : "#3A3530",
                }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full"
              />
            ))}
          </div>

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

        <div className="pb-[env(safe-area-inset-bottom,0px)]" />
      </motion.div>
    </AnimatePresence>
  );
}
