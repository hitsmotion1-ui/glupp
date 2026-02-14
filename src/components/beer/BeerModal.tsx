"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { supabase } from "@/lib/supabase/client";
import type { Beer } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { RarityBadge } from "./RarityBadge";
import { TasteProfile } from "./TasteProfile";
import { beerEmoji, formatNumber } from "@/lib/utils/xp";

export function BeerModal() {
  const { selectedBeerId, closeBeerModal, openGluppModal } = useAppStore();
  const [beer, setBeer] = useState<Beer | null>(null);
  const [tasted, setTasted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedBeerId) {
      setBeer(null);
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
          .select("id")
          .eq("user_id", user.id)
          .eq("beer_id", selectedBeerId)
          .maybeSingle();

        setTasted(!!userBeer);
      }

      setLoading(false);
    };

    fetchBeer();
  }, [selectedBeerId]);

  if (!beer) return null;

  return (
    <Modal
      isOpen={!!selectedBeerId}
      onClose={closeBeerModal}
      title={beer.name}
    >
      {loading ? (
        <div className="py-8 text-center text-glupp-text-muted">
          Chargement...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-4">
            <span className="text-5xl">{beerEmoji(beer.style)}</span>
            <div className="flex-1">
              <p className="text-sm text-glupp-text-soft">{beer.brewery}</p>
              <div className="flex items-center gap-2 mt-1">
                <span>{beer.country}</span>
                <span className="text-xs text-glupp-text-muted">
                  {beer.style}
                </span>
                <RarityBadge rarity={beer.rarity} />
              </div>
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

          {/* CTA */}
          {!tasted && (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => {
                closeBeerModal();
                openGluppModal(beer.id);
              }}
            >
              Glupper cette biere !
            </Button>
          )}

          {tasted && (
            <div className="text-center py-2">
              <span className="text-glupp-success text-sm">
                Deja dans ta collection
              </span>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
