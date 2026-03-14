"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store/useAppStore";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import type { Beer } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { RarityBadge } from "./RarityBadge";
import { TasteProfile } from "./TasteProfile";
import { beerEmoji, formatNumber, RARITY_CONFIG } from "@/lib/utils/xp";
import {
  Lock,
  Zap,
  Calendar,
  MapPin,
  Camera,
  RotateCcw,
  Beer as BeerIcon,
  Pencil,
  Check,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Taste dimensions for user rating ──
const TASTE_DIMS = [
  { key: "bitter" as const, label: "Amertume", color: "#E08840", emoji: "🍺" },
  { key: "sweet" as const, label: "Sucre", color: "#DCB04C", emoji: "🍯" },
  { key: "fruity" as const, label: "Fruité", color: "#4CAF50", emoji: "🍓" },
  { key: "body" as const, label: "Corps", color: "#8D7C6C", emoji: "💪" },
];

interface UserTasteRating {
  bitter: number;
  sweet: number;
  fruity: number;
  body: number;
}

export function BeerModal() {
  const queryClient = useQueryClient();
  const { selectedBeerId, closeBeerModal, openGluppModal, showXPToast } = useAppStore();
  
  const [regluppLoading, setRegluppLoading] = useState(false);
  const [regluppDone, setRegluppDone] = useState(false);

  // ── User taste rating state ──
  const [editingTaste, setEditingTaste] = useState(false);
  const [tasteDraft, setTasteDraft] = useState<UserTasteRating>({
    bitter: 3,
    sweet: 3,
    fruity: 3,
    body: 3,
  });
  const [savingTaste, setSavingTaste] = useState(false);

  // 1. 🚀 REQUÊTE MISE EN CACHE : Les détails de la bière
  const { data: beer, isLoading: loadingBeer } = useQuery({
    queryKey: ["beer", selectedBeerId],
    enabled: !!selectedBeerId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beers")
        .select("*")
        .eq("id", selectedBeerId)
        .single();
      if (error) throw error;
      return data as Beer;
    },
  });

  // 2. 🚀 REQUÊTE MISE EN CACHE : Les données de l'utilisateur pour cette bière
  const { data: userBeerData, isLoading: loadingUserBeer, refetch: refetchUserBeer } = useQuery({
    queryKey: ["userBeer", selectedBeerId],
    enabled: !!selectedBeerId,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_beers")
        .select("id, tasted_at, photo_url, bar_name, glupp_count, user_taste_bitter, user_taste_sweet, user_taste_fruity, user_taste_body")
        .eq("user_id", user.id)
        .eq("beer_id", selectedBeerId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  const loading = loadingBeer || loadingUserBeer;
  const tasted = !!userBeerData;

  // Initialiser le "draft" du goût uniquement à l'ouverture de la modale ou au clic sur "Modifier"
  useEffect(() => {
    if (!editingTaste) return; // Ne met à jour les jauges que si on est en train d'éditer ou à l'ouverture

    if (userBeerData && userBeerData.user_taste_bitter != null) {
      setTasteDraft({
        bitter: userBeerData.user_taste_bitter,
        sweet: userBeerData.user_taste_sweet ?? 3,
        fruity: userBeerData.user_taste_fruity ?? 3,
        body: userBeerData.user_taste_body ?? 3,
      });
    } else if (beer) {
      setTasteDraft({
        bitter: beer.taste_bitter,
        sweet: beer.taste_sweet,
        fruity: beer.taste_fruity,
        body: beer.taste_body,
      });
    }
  }, [userBeerData, beer, editingTaste]);

  // Réinitialiser les états éphémères à la fermeture
  useEffect(() => {
    if (!selectedBeerId) {
      setRegluppDone(false);
      setEditingTaste(false);
    }
  }, [selectedBeerId]);

  // ── Save user taste rating ──
  const handleSaveTaste = useCallback(async () => {
    if (!beer) return;
    setSavingTaste(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSavingTaste(false);
      return;
    }

    const { error } = await supabase
      .from("user_beers")
      .update({
        user_taste_bitter: tasteDraft.bitter,
        user_taste_sweet: tasteDraft.sweet,
        user_taste_fruity: tasteDraft.fruity,
        user_taste_body: tasteDraft.body,
      })
      .eq("user_id", user.id)
      .eq("beer_id", beer.id);

    if (!error) {
      setEditingTaste(false); // On ferme la fenêtre d'édition
      await refetchUserBeer(); // On télécharge tes nouvelles notes
      
      // On force la mise à jour de la collection en arrière-plan
      queryClient.invalidateQueries({ queryKey: queryKeys.collection.all });
    }

    setSavingTaste(false);
  }, [beer, tasteDraft, refetchUserBeer, queryClient]);

  // Re-Glupp handler
  const handleReglupp = async () => {
    if (!beer) return;
    setRegluppLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setRegluppLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc("register_reglupp", {
      p_user_id: user.id,
      p_beer_id: beer.id,
    });

    if (!error && data) {
      const result = data as { xp_gained: number; glupp_count: number };
      if (result.xp_gained > 0) {
        showXPToast(result.xp_gained, "Re-Glupp !");
      }
      setRegluppDone(true);

      refetchUserBeer(); 
      queryClient.invalidateQueries({ queryKey: queryKeys.collection.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
      
      setTimeout(() => {
        closeBeerModal();
      }, 2000);
    }

    setRegluppLoading(false);
  };

  const regluppXP = (count: number): number => {
    if (count <= 1) return 5;
    if (count <= 3) return 3;
    if (count <= 6) return 2;
    if (count <= 10) return 1;
    return 0;
  };

  if (!selectedBeerId) return null;

  const rarityConfig = beer ? RARITY_CONFIG[beer.rarity as keyof typeof RARITY_CONFIG] : null;
  const xpBonus = rarityConfig?.xpBonus || 0;
  const isHighRarity = beer?.rarity === "epic" || beer?.rarity === "legendary";
  const gluppCount = userBeerData?.glupp_count ?? 1;
  const nextRegluppXP = regluppXP(gluppCount);

  return (
    <Modal
      isOpen={!!selectedBeerId}
      onClose={closeBeerModal}
      title={beer?.name || "Bière"}
    >
      {loading || !beer ? (
        <div className="py-12 flex flex-col items-center justify-center text-glupp-text-muted space-y-3">
           <Loader2 size={24} className="animate-spin text-glupp-accent" />
           <p className="text-sm">Décapsulage en cours...</p>
        </div>
      ) : !tasted ? (
        // ═══ LOCKED STATE ═══
        <div className="flex flex-col items-center text-center py-2 space-y-4">
          <div className="relative">
            <span className="text-6xl grayscale opacity-50">
              {beerEmoji(beer.style)}
            </span>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-glupp-card-alt border border-glupp-border flex items-center justify-center">
              <Lock size={14} className="text-glupp-text-muted" />
            </div>
          </div>

          <div>
            <p className="text-lg font-display font-bold text-glupp-cream">
              {beer.name}
            </p>
            <p className="text-sm text-glupp-text-muted">
              {beer.brewery}
            </p>
          </div>

          <div className="w-full bg-glupp-card-alt rounded-glupp p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-glupp-text-soft">Style</span>
              <span className="text-sm text-glupp-cream">{beer.style}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-glupp-text-soft">Pays</span>
              <span className="text-sm">{beer.country}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-glupp-text-soft">Rareté</span>
              <RarityBadge rarity={beer.rarity} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-glupp-text-soft">ABV</span>
              <span className="text-sm text-glupp-text-muted blur-[3px] select-none">
                {beer.abv || "5.2"}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-glupp-text-soft">ELO</span>
              <span className="text-sm text-glupp-text-muted blur-[3px] select-none">
                {beer.elo}
              </span>
            </div>
            <div>
              <p className="text-xs text-glupp-text-soft mb-2">Profil gustatif</p>
              <div className="blur-[4px] select-none pointer-events-none">
                <TasteProfile
                  bitter={beer.taste_bitter}
                  sweet={beer.taste_sweet}
                  fruity={beer.taste_fruity}
                  body={beer.taste_body}
                />
              </div>
            </div>
          </div>

          <div className="w-full bg-glupp-card-alt rounded-glupp p-3 flex items-center gap-2">
            <Lock size={14} className="text-glupp-text-muted shrink-0" />
            <p className="text-xs text-glupp-text-muted italic">
              Anecdote secrète
            </p>
          </div>

          <p className="text-sm text-glupp-text-soft max-w-xs leading-relaxed">
            Gluppe cette bière pour débloquer ses stats et son anecdote !
          </p>

          {isHighRarity && rarityConfig && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: `${rarityConfig.color}20`,
                color: rarityConfig.color,
              }}
            >
              <Zap size={14} />
              <span>+{xpBonus} XP bonus rareté !</span>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => {
              closeBeerModal();
              openGluppModal(beer.id);
            }}
          >
            🍺 Glupper cette bière !
          </Button>
        </div>
      ) : (
        // ═══ UNLOCKED STATE ═══
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <span className="text-5xl">{beerEmoji(beer.style)}</span>
            <div className="flex-1">
              <p className="text-sm text-glupp-text-soft">{beer.brewery}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span>{beer.country}</span>
                <span className="text-xs text-glupp-text-muted">
                  {beer.style}
                </span>
                <RarityBadge rarity={beer.rarity} />
              </div>
              {beer.region && (
                <p className="text-xs text-glupp-text-muted mt-1">
                  <MapPin size={10} className="inline mr-1" />
                  {beer.region}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Alcool", value: beer.abv ? `${beer.abv}%` : "N/A" },
              { label: "IBU", value: beer.ibu?.toString() || "N/A" },
              { label: "ELO", value: formatNumber(beer.elo) },
              { label: "Votes", value: formatNumber(beer.total_votes) },
            ].map((stat) => (
              <div key={stat.label} className="bg-glupp-card-alt rounded-glupp p-2 text-center">
                <p className="text-xs text-glupp-text-muted">{stat.label}</p>
                <p className="text-sm font-semibold text-glupp-cream">{stat.value}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-glupp-cream mb-3">Profil gustatif</h3>
            <TasteProfile
              bitter={beer.taste_bitter}
              sweet={beer.taste_sweet}
              fruity={beer.taste_fruity}
              body={beer.taste_body}
            />
          </div>

          {/* ── User Taste Rating ("Mon ressenti") ── */}
          <div className="bg-glupp-card-alt rounded-glupp p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-glupp-cream flex items-center gap-1.5">
                <span>🎯</span> Mon ressenti
              </h3>
              {!editingTaste ? (
                <button
                  onClick={() => setEditingTaste(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-glupp-accent hover:bg-glupp-accent/10 transition-colors"
                >
                  <Pencil size={10} />
                  {userBeerData?.user_taste_bitter != null ? "Modifier" : "Noter"}
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingTaste(false)}
                    className="px-2 py-1 rounded-md text-[10px] text-glupp-text-muted hover:bg-glupp-border/50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveTaste}
                    disabled={savingTaste}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] bg-glupp-accent text-glupp-bg font-medium hover:bg-glupp-accent/90 transition-colors disabled:opacity-50"
                  >
                    {savingTaste ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                    Sauver
                  </button>
                </div>
              )}
            </div>

            {editingTaste ? (
              <div className="space-y-2.5">
                {TASTE_DIMS.map((dim) => (
                  <div key={dim.key}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] text-glupp-text-soft flex items-center gap-1">
                        <span>{dim.emoji}</span> {dim.label}
                      </span>
                      <span className="text-[11px] font-bold tabular-nums" style={{ color: dim.color }}>
                        {tasteDraft[dim.key]}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1} max={5} step={1}
                      value={tasteDraft[dim.key]}
                      onChange={(e) => setTasteDraft((prev) => ({ ...prev, [dim.key]: parseInt(e.target.value) }))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${dim.color} 0%, ${dim.color} ${((tasteDraft[dim.key] - 1) / 4) * 100}%, rgba(58,53,48,0.6) ${((tasteDraft[dim.key] - 1) / 4) * 100}%, rgba(58,53,48,0.6) 100%)`,
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : userBeerData?.user_taste_bitter != null ? (
              <TasteProfile
                bitter={userBeerData.user_taste_bitter}
                sweet={userBeerData.user_taste_sweet!}
                fruity={userBeerData.user_taste_fruity!}
                body={userBeerData.user_taste_body!}
              />
            ) : (
              <p className="text-xs text-glupp-text-muted text-center py-2">
                Partage ton ressenti sur cette bière !
              </p>
            )}
          </div>

          {beer.fun_fact && (
            <div className="bg-glupp-card-alt rounded-glupp p-3">
              <p className="text-xs text-glupp-text-soft">
                <span className="mr-1">{beer.fun_fact_icon}</span>
                {beer.fun_fact}
              </p>
            </div>
          )}

          <div className="bg-glupp-card-alt rounded-glupp p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-glupp-success text-sm font-medium">
                <span>✓</span>
                <span>Dans ta collection</span>
              </div>
              {gluppCount > 1 && (
                <span className="text-xs text-glupp-accent font-mono">×{gluppCount}</span>
              )}
            </div>
            {userBeerData?.tasted_at && (
              <div className="flex items-center gap-2 text-xs text-glupp-text-muted">
                <Calendar size={12} />
                <span>Gluppé le {new Date(userBeerData.tasted_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
            )}
            {userBeerData?.bar_name && (
              <div className="flex items-center gap-2 text-xs text-glupp-text-muted">
                <MapPin size={12} />
                <span>{userBeerData.bar_name}</span>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {regluppDone ? (
              <motion.div
                key="done"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-glupp bg-glupp-success/15 border border-glupp-success/30 text-glupp-success text-sm font-medium"
              >
                <BeerIcon size={16} />
                <span>Re-Glupp enregistré ! ×{gluppCount}</span>
              </motion.div>
            ) : (
              <motion.div key="btn" initial={{ opacity: 1 }}>
                <button
                  onClick={handleReglupp}
                  disabled={regluppLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-glupp bg-glupp-card border border-glupp-border hover:border-glupp-accent text-glupp-cream text-sm font-medium transition-all disabled:opacity-50 active:scale-[0.97]"
                >
                  <RotateCcw size={16} className={regluppLoading ? "animate-spin" : ""} />
                  <span>{regluppLoading ? "En cours..." : `Re-Glupper cette bière`}</span>
                  {nextRegluppXP > 0 && (
                    <span className="text-xs text-glupp-accent font-mono ml-1">+{nextRegluppXP} XP</span>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Modal>
  );
}