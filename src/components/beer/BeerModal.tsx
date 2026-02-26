"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function BeerModal() {
  const queryClient = useQueryClient();
  const { selectedBeerId, closeBeerModal, openGluppModal, showXPToast } =
    useAppStore();
  const [beer, setBeer] = useState<Beer | null>(null);
  const [tasted, setTasted] = useState(false);
  const [userBeerData, setUserBeerData] = useState<{
    tasted_at?: string;
    photo_url?: string;
    bar_name?: string;
    glupp_count?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [regluppLoading, setRegluppLoading] = useState(false);
  const [regluppDone, setRegluppDone] = useState(false);

  useEffect(() => {
    if (!selectedBeerId) {
      setBeer(null);
      setUserBeerData(null);
      setRegluppDone(false);
      return;
    }

    const fetchBeer = async () => {
      setLoading(true);
      const { data: beerData } = await supabase
        .from("beers")
        .select("*")
        .eq("id", selectedBeerId)
        .single();

      if (beerData) {
        setBeer(beerData as Beer);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: userBeer } = await supabase
          .from("user_beers")
          .select("id, tasted_at, photo_url, bar_name, glupp_count")
          .eq("user_id", user.id)
          .eq("beer_id", selectedBeerId)
          .maybeSingle();

        setTasted(!!userBeer);
        if (userBeer) {
          setUserBeerData({
            tasted_at: userBeer.tasted_at,
            photo_url: userBeer.photo_url,
            bar_name: userBeer.bar_name,
            glupp_count: userBeer.glupp_count ?? 1,
          });
        }
      }

      setLoading(false);
    };

    fetchBeer();
  }, [selectedBeerId]);

  // Re-Glupp handler
  const handleReglupp = async () => {
    if (!beer) return;
    setRegluppLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      setUserBeerData((prev) =>
        prev ? { ...prev, glupp_count: result.glupp_count } : prev
      );
      setRegluppDone(true);

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: queryKeys.collection.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
    }

    setRegluppLoading(false);
  };

  // XP for next re-glupp
  const regluppXP = (count: number): number => {
    if (count <= 1) return 3;
    if (count <= 3) return 2;
    if (count <= 10) return 1;
    return 0;
  };

  if (!beer) return null;

  const rarityConfig = RARITY_CONFIG[beer.rarity as keyof typeof RARITY_CONFIG];
  const xpBonus = rarityConfig?.xpBonus || 0;
  const isHighRarity = beer.rarity === "epic" || beer.rarity === "legendary";
  const gluppCount = userBeerData?.glupp_count ?? 1;
  const nextRegluppXP = regluppXP(gluppCount);

  return (
    <Modal
      isOpen={!!selectedBeerId}
      onClose={closeBeerModal}
      title={tasted ? beer.name : beer.name}
    >
      {loading ? (
        <div className="py-8 text-center text-glupp-text-muted">
          Chargement...
        </div>
      ) : !tasted ? (
        // ═══ LOCKED STATE — Teaser with name visible ═══
        <div className="flex flex-col items-center text-center py-2 space-y-4">
          {/* Emoji en grayscale + cadenas */}
          <div className="relative">
            <span className="text-6xl grayscale opacity-50">
              {beerEmoji(beer.style)}
            </span>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-glupp-card-alt border border-glupp-border flex items-center justify-center">
              <Lock size={14} className="text-glupp-text-muted" />
            </div>
          </div>

          {/* Nom visible + brasserie cachée */}
          <div>
            <p className="text-lg font-display font-bold text-glupp-cream">
              {beer.name}
            </p>
            <p className="text-sm text-glupp-text-muted">
              {beer.brewery}
            </p>
          </div>

          {/* Infos teaser — style, pays, rareté visibles, stats floutées */}
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
              <span className="text-xs text-glupp-text-soft">Rarete</span>
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

            {/* Profil gustatif flouté */}
            <div>
              <p className="text-xs text-glupp-text-soft mb-2">
                Profil gustatif
              </p>
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

          {/* Fun fact caché */}
          <div className="w-full bg-glupp-card-alt rounded-glupp p-3 flex items-center gap-2">
            <Lock size={14} className="text-glupp-text-muted shrink-0" />
            <p className="text-xs text-glupp-text-muted italic">
              Anecdote secrete
            </p>
          </div>

          {/* Accroche */}
          <p className="text-sm text-glupp-text-soft max-w-xs leading-relaxed">
            Gluppe cette biere pour debloquer ses stats et son anecdote secrete
            !
          </p>

          {/* Bonus rareté */}
          {isHighRarity && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: `${rarityConfig.color}20`,
                color: rarityConfig.color,
              }}
            >
              <Zap size={14} />
              <span>+{xpBonus} XP bonus rarete !</span>
            </div>
          )}

          {/* CTA */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => {
              closeBeerModal();
              openGluppModal(beer.id);
            }}
          >
            🍺 Glupper cette biere !
          </Button>
        </div>
      ) : (
        // ═══ UNLOCKED STATE — Full detail + Re-Glupp ═══
        <div className="space-y-4">
          {/* Header */}
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

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                label: "Alcool",
                value: beer.abv ? `${beer.abv}%` : "N/A",
              },
              {
                label: "IBU",
                value: beer.ibu?.toString() || "N/A",
              },
              {
                label: "ELO",
                value: formatNumber(beer.elo),
              },
              {
                label: "Votes",
                value: formatNumber(beer.total_votes),
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-glupp-card-alt rounded-glupp p-2 text-center"
              >
                <p className="text-xs text-glupp-text-muted">{stat.label}</p>
                <p className="text-sm font-semibold text-glupp-cream">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Taste Profile */}
          <div>
            <h3 className="text-sm font-semibold text-glupp-cream mb-3">
              Profil gustatif
            </h3>
            <TasteProfile
              bitter={beer.taste_bitter}
              sweet={beer.taste_sweet}
              fruity={beer.taste_fruity}
              body={beer.taste_body}
            />
          </div>

          {/* Fun Fact */}
          {beer.fun_fact && (
            <div className="bg-glupp-card-alt rounded-glupp p-3">
              <p className="text-xs text-glupp-text-soft">
                <span className="mr-1">{beer.fun_fact_icon}</span>
                {beer.fun_fact}
              </p>
            </div>
          )}

          {/* Glupp info */}
          <div className="bg-glupp-card-alt rounded-glupp p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-glupp-success text-sm font-medium">
                <span>✓</span>
                <span>Dans ta collection</span>
              </div>
              {gluppCount > 1 && (
                <span className="text-xs text-glupp-accent font-mono">
                  ×{gluppCount}
                </span>
              )}
            </div>
            {userBeerData?.tasted_at && (
              <div className="flex items-center gap-2 text-xs text-glupp-text-muted">
                <Calendar size={12} />
                <span>
                  Gluppe le{" "}
                  {new Date(userBeerData.tasted_at).toLocaleDateString(
                    "fr-FR",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </span>
              </div>
            )}
            {userBeerData?.bar_name && (
              <div className="flex items-center gap-2 text-xs text-glupp-text-muted">
                <MapPin size={12} />
                <span>{userBeerData.bar_name}</span>
              </div>
            )}
            {userBeerData?.photo_url && (
              <div className="flex items-center gap-2 text-xs text-glupp-text-muted">
                <Camera size={12} />
                <span>Photo prise</span>
              </div>
            )}
          </div>

          {/* Re-Glupp button */}
          <AnimatePresence mode="wait">
            {regluppDone ? (
              <motion.div
                key="done"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-glupp bg-glupp-success/15 border border-glupp-success/30 text-glupp-success text-sm font-medium"
              >
                <BeerIcon size={16} />
                <span>Re-Glupp enregistre ! ×{gluppCount}</span>
              </motion.div>
            ) : (
              <motion.div key="btn" initial={{ opacity: 1 }}>
                <button
                  onClick={handleReglupp}
                  disabled={regluppLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-glupp bg-glupp-card border border-glupp-border hover:border-glupp-accent text-glupp-cream text-sm font-medium transition-all disabled:opacity-50 active:scale-[0.97]"
                >
                  <RotateCcw
                    size={16}
                    className={regluppLoading ? "animate-spin" : ""}
                  />
                  <span>
                    {regluppLoading
                      ? "En cours..."
                      : `Re-Glupper cette biere`}
                  </span>
                  {nextRegluppXP > 0 && (
                    <span className="text-xs text-glupp-accent font-mono ml-1">
                      +{nextRegluppXP} XP
                    </span>
                  )}
                </button>
                <p className="text-center text-[10px] text-glupp-text-muted mt-1">
                  Tu la rebois ? Enregistre-le !
                  {nextRegluppXP === 0 && " (XP max atteint)"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Modal>
  );
}
