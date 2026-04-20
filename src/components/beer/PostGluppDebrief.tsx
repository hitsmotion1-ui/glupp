"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store/useAppStore";
import { StarRating } from "@/components/ui/StarRating";
import { X, ChevronRight, MapPin, Beer, Sparkles } from "lucide-react";

interface PostGluppDebriefProps {
  isOpen: boolean;
  onClose: () => void;
  beerId: string;
  beerName: string;
  barName: string | null;
}

type Step = "beer" | "bar" | "done";

const TASTE_DIMS = [
  { key: "bitter" as const, label: "Amertume", emoji: "🍺", color: "#E08840" },
  { key: "sweet" as const, label: "Sucré", emoji: "🍯", color: "#DCB04C" },
  { key: "fruity" as const, label: "Fruité", emoji: "🍓", color: "#4CAF50" },
  { key: "body" as const, label: "Corps", emoji: "💪", color: "#8D7C6C" },
];

const BAR_CRITERIA = [
  { key: "ambiance", label: "Ambiance", emoji: "🎶" },
  { key: "service", label: "Service", emoji: "🤝" },
  { key: "selection", label: "Sélection bières", emoji: "🍺" },
];

export function PostGluppDebrief({ isOpen, onClose, beerId, beerName, barName }: PostGluppDebriefProps) {
  const queryClient = useQueryClient();
  const showXPToast = useAppStore((s) => s.showXPToast);

  const hasBar = !!barName && !barName.startsWith("Sur place");
  const [step, setStep] = useState<Step>("beer");

  // Beer rating state
  const [beerRating, setBeerRating] = useState<number | null>(null);
  const [taste, setTaste] = useState({ bitter: 3, sweet: 3, fruity: 3, body: 3 });
  const [showTaste, setShowTaste] = useState(false);
  const [savingBeer, setSavingBeer] = useState(false);

  // Bar rating state
  const [barRating, setBarRating] = useState<number | null>(null);
  const [barCriteria, setBarCriteria] = useState<Record<string, number | null>>({
    ambiance: null, service: null, selection: null,
  });
  const [savingBar, setSavingBar] = useState(false);

  const totalXpEarned = (beerRating ? 5 : 0) + (barRating ? 5 : 0);

  const handleSaveBeerRating = async () => {
    if (!beerRating) { goNext(); return; }
    setSavingBeer(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Note étoiles
      const { data } = await supabase.rpc("rate_beer", {
        p_user_id: user.id, p_beer_id: beerId, p_rating: beerRating,
      });
      if (data?.xp_bonus > 0) showXPToast(data.xp_bonus, "Note !");

      // Profil gustatif si rempli
      if (showTaste) {
        await supabase.from("user_beers").update({
          user_taste_bitter: taste.bitter,
          user_taste_sweet: taste.sweet,
          user_taste_fruity: taste.fruity,
          user_taste_body: taste.body,
        }).eq("user_id", user.id).eq("beer_id", beerId);
      }

      queryClient.invalidateQueries({ queryKey: ["daily-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["beer", beerId] });
      queryClient.invalidateQueries({ queryKey: ["userBeer", beerId] });
    } catch { /* ignore */ }
    setSavingBeer(false);
    goNext();
  };

  const handleSaveBarRating = async () => {
    if (!barRating || !barName) { handleFinish(); return; }
    setSavingBar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.rpc("rate_bar", {
        p_user_id: user.id,
        p_bar_name: barName,
        p_rating: barRating,
        p_ambiance: barCriteria.ambiance,
        p_service: barCriteria.service,
        p_selection: barCriteria.selection,
      });
      if (data?.xp_bonus > 0) showXPToast(data.xp_bonus, "Bar noté !");

      queryClient.invalidateQueries({ queryKey: ["daily-challenges"] });
    } catch { /* ignore */ }
    setSavingBar(false);
    handleFinish();
  };

  const goNext = () => {
    if (hasBar) setStep("bar");
    else handleFinish();
  };

  const handleFinish = () => {
    setStep("done");
    setTimeout(onClose, 600);
  };

  const handleSkip = () => {
    if (step === "beer") goNext();
    else handleFinish();
  };

  // Calculer la note globale du bar depuis les critères
  const updateBarGlobal = (key: string, value: number) => {
    const updated = { ...barCriteria, [key]: value };
    setBarCriteria(updated);
    const values = Object.values(updated).filter((v): v is number => v !== null);
    if (values.length > 0) {
      setBarRating(Math.round(values.reduce((a, b) => a + b, 0) / values.length));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && step !== "done" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={handleSkip}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#1E1B16] border border-[#3A3530] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#E08840]" />
                <h3 className="text-sm font-bold text-[#F5E6D3]">
                  {step === "beer" ? "Ton avis sur cette biere" : "Ton avis sur ce bar"}
                </h3>
              </div>
              <button onClick={handleSkip} className="p-1 text-[#6B6050] hover:text-[#F5E6D3] transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Step indicator */}
            <div className="px-5 mb-4">
              <div className="flex gap-1.5">
                <div className={`flex-1 h-1 rounded-full ${step === "beer" ? "bg-[#E08840]" : "bg-[#E08840]/30"}`} />
                {hasBar && (
                  <div className={`flex-1 h-1 rounded-full ${step === "bar" ? "bg-[#E08840]" : "bg-[#3A3530]"}`} />
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* ═══ Step 1: Rate beer ═══ */}
              {step === "beer" && (
                <motion.div
                  key="beer"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="px-5 pb-5 space-y-4"
                >
                  <div className="text-center">
                    <p className="text-xs text-[#A89888] mb-3">{beerName}</p>
                    <StarRating value={beerRating} onChange={setBeerRating} size={32} />
                    {!beerRating && (
                      <p className="text-[10px] text-[#6B6050] mt-2">+5 XP pour ta premiere note !</p>
                    )}
                  </div>

                  {/* Toggle profil gustatif */}
                  {beerRating && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                      <button
                        type="button"
                        onClick={() => setShowTaste(!showTaste)}
                        className="w-full text-left text-xs text-[#E08840] hover:underline mb-2"
                      >
                        {showTaste ? "▾ Masquer le profil gustatif" : "▸ Affiner mon profil gustatif (optionnel)"}
                      </button>

                      {showTaste && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-3 p-3 bg-[#141210] rounded-xl border border-[#3A3530]/50"
                        >
                          {TASTE_DIMS.map((dim) => (
                            <div key={dim.key}>
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[11px] text-[#A89888] flex items-center gap-1">
                                  <span>{dim.emoji}</span> {dim.label}
                                </span>
                                <span className="text-[11px] font-bold tabular-nums" style={{ color: dim.color }}>
                                  {taste[dim.key].toFixed(1)}
                                </span>
                              </div>
                              <input
                                type="range" min={0} max={5} step={0.5}
                                value={taste[dim.key]}
                                onChange={(e) => {
                                  const v = Math.max(1, parseFloat(e.target.value));
                                  setTaste((p) => ({ ...p, [dim.key]: v }));
                                }}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, ${dim.color} 0%, ${dim.color} ${(taste[dim.key] / 5) * 100}%, rgba(58,53,48,0.6) ${(taste[dim.key] / 5) * 100}%, rgba(58,53,48,0.6) 100%)`,
                                }}
                              />
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={handleSkip} className="flex-1 py-2.5 text-xs text-[#6B6050] hover:text-[#A89888] transition-colors">
                      Passer
                    </button>
                    <button
                      onClick={handleSaveBeerRating}
                      disabled={savingBeer}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#E08840] text-[#16130E] font-semibold text-xs rounded-xl hover:bg-[#E08840]/90 transition-colors disabled:opacity-50"
                    >
                      {savingBeer ? (
                        <div className="w-3 h-3 border-2 border-[#16130E] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          {hasBar ? "Suivant" : "Valider"}
                          {hasBar && <ChevronRight size={14} />}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ═══ Step 2: Rate bar ═══ */}
              {step === "bar" && (
                <motion.div
                  key="bar"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="px-5 pb-5 space-y-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={14} className="text-[#E08840]" />
                    <p className="text-xs text-[#A89888]">{barName}</p>
                  </div>

                  {/* Critères détaillés */}
                  <div className="space-y-3">
                    {BAR_CRITERIA.map((c) => (
                      <div key={c.key} className="flex items-center justify-between">
                        <span className="text-xs text-[#A89888] flex items-center gap-1.5">
                          <span>{c.emoji}</span> {c.label}
                        </span>
                        <StarRating
                          value={barCriteria[c.key]}
                          onChange={(v) => updateBarGlobal(c.key, v)}
                          size={20}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Note globale calculée */}
                  {barRating && (
                    <div className="flex items-center justify-between p-3 bg-[#141210] rounded-xl border border-[#3A3530]/50">
                      <span className="text-xs font-semibold text-[#F5E6D3]">Note globale</span>
                      <div className="flex items-center gap-2">
                        <StarRating value={barRating} readonly size={18} />
                        <span className="text-sm font-bold text-[#E08840]">{barRating}/5</span>
                      </div>
                    </div>
                  )}

                  {!barRating && (
                    <p className="text-[10px] text-[#6B6050] text-center">+5 XP pour ta premiere note de bar !</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={handleSkip} className="flex-1 py-2.5 text-xs text-[#6B6050] hover:text-[#A89888] transition-colors">
                      Passer
                    </button>
                    <button
                      onClick={handleSaveBarRating}
                      disabled={savingBar}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#E08840] text-[#16130E] font-semibold text-xs rounded-xl hover:bg-[#E08840]/90 transition-colors disabled:opacity-50"
                    >
                      {savingBar ? (
                        <div className="w-3 h-3 border-2 border-[#16130E] border-t-transparent rounded-full animate-spin" />
                      ) : "Valider"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
