"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { supabase } from "@/lib/supabase/client";
import type { Beer } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { RarityBadge } from "./RarityBadge";
import { TasteProfile } from "./TasteProfile";
import { beerEmoji, formatNumber, RARITY_CONFIG } from "@/lib/utils/xp";
import { Lock, Zap, Calendar, MapPin, Camera } from "lucide-react";

export function BeerModal() {
  const { selectedBeerId, closeBeerModal, openGluppModal } = useAppStore();
  const [beer, setBeer] = useState<Beer | null>(null);
  const [tasted, setTasted] = useState(false);
  const [userBeerData, setUserBeerData] = useState<{
    tasted_at?: string;
    photo_url?: string;
    bar_name?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedBeerId) {
      setBeer(null);
      setUserBeerData(null);
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
          .select("id, tasted_at, photo_url, bar_name")
          .eq("user_id", user.id)
          .eq("beer_id", selectedBeerId)
          .maybeSingle();

        setTasted(!!userBeer);
        if (userBeer) {
          setUserBeerData({
            tasted_at: userBeer.tasted_at,
            photo_url: userBeer.photo_url,
            bar_name: userBeer.bar_name,
          });
        }
      }

      setLoading(false);
    };

    fetchBeer();
  }, [selectedBeerId]);

  if (!beer) return null;

  const rarityConfig = RARITY_CONFIG[beer.rarity as keyof typeof RARITY_CONFIG];
  const xpBonus = rarityConfig?.xpBonus || 0;
  const isHighRarity = beer.rarity === "epic" || beer.rarity === "legendary";

  return (
    <Modal
      isOpen={!!selectedBeerId}
      onClose={closeBeerModal}
      title={tasted ? beer.name : "Biere mysterieuse"}
    >
      {loading ? (
        <div className="py-8 text-center text-glupp-text-muted">
          Chargement...
        </div>
      ) : !tasted ? (
        // ═══ LOCKED STATE — Teaser ═══
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

          {/* Titre mystère */}
          <div>
            <p className="text-lg font-display font-bold text-glupp-cream">
              Biere Mysterieuse
            </p>
            <p className="text-sm text-glupp-text-muted">
              ??? &bull; ??? Brewery
            </p>
          </div>

          {/* Infos teaser — style, pays, rareté visibles */}
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
            Gluppe cette biere pour decouvrir son nom, ses stats et son anecdote
            secrete !
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
        // ═══ UNLOCKED STATE — Full detail ═══
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
            <div className="flex items-center gap-2 text-glupp-success text-sm font-medium">
              <span>✓</span>
              <span>Dans ta collection</span>
            </div>
            {userBeerData?.tasted_at && (
              <div className="flex items-center gap-2 text-xs text-glupp-text-muted">
                <Calendar size={12} />
                <span>
                  Gluppe le{" "}
                  {new Date(userBeerData.tasted_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
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
        </div>
      )}
    </Modal>
  );
}
