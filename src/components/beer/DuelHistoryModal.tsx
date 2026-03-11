"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Crown, Swords, Loader2 } from "lucide-react";
import { beerEmoji } from "@/lib/utils/xp";

interface DuelHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DuelHistoryModal({ isOpen, onClose }: DuelHistoryModalProps) {
  // On récupère les 10 derniers duels avec les infos des bières
  const { data: history, isLoading } = useQuery({
    queryKey: ["duel_history_details"],
    enabled: isOpen, // Ne lance la requête que si la modale est ouverte !
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // 1. On récupère les IDs des derniers duels
      const { data: duels, error } = await supabase
        .from("duels")
        .select("id, created_at, winner_id, beer_a_id, beer_b_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error || !duels) return [];

      // 2. On récupère le nom et le style des bières concernées
      const beerIds = new Set<string>();
      duels.forEach((d) => {
        beerIds.add(d.beer_a_id);
        beerIds.add(d.beer_b_id);
      });

      const { data: beers } = await supabase
        .from("beers")
        .select("id, name, brewery, style")
        .in("id", Array.from(beerIds));

      const beerMap = new Map(beers?.map((b) => [b.id, b]) || []);

      // 3. On assemble le tout
      return duels.map((d) => ({
        ...d,
        beerA: beerMap.get(d.beer_a_id),
        beerB: beerMap.get(d.beer_b_id),
      }));
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Historique des duels">
      <div className="space-y-3 pb-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-glupp-text-muted">
            <Loader2 size={24} className="animate-spin mb-2 text-glupp-accent" />
            <p className="text-sm">Recherche dans les archives...</p>
          </div>
        ) : history && history.length > 0 ? (
          history.map((duel) => {
            const aWon = duel.winner_id === duel.beer_a_id;
            const bWon = duel.winner_id === duel.beer_b_id;

            return (
              <div key={duel.id} className="bg-glupp-card-alt border border-glupp-border rounded-glupp p-3">
                <div className="flex justify-between items-center text-[10px] text-glupp-text-muted mb-2 pb-2 border-b border-glupp-border/50">
                  <span>
                    {new Date(duel.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                  <Swords size={12} />
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  {/* Bière A */}
                  <div className={`flex-1 text-center p-2 rounded-md ${aWon ? "bg-glupp-accent/10 border border-glupp-accent/30" : "opacity-50 grayscale"}`}>
                    <div className="text-2xl mb-1 relative inline-block">
                      {beerEmoji(duel.beerA?.style || "Standard")}
                      {aWon && <Crown size={14} className="text-glupp-gold absolute -top-2 -right-2 rotate-12" />}
                    </div>
                    <p className={`text-xs font-bold truncate ${aWon ? "text-glupp-cream" : "text-glupp-text-muted"}`}>
                      {duel.beerA?.name || "Bière inconnue"}
                    </p>
                  </div>

                  <span className="text-xs font-bold text-glupp-text-muted px-1">VS</span>

                  {/* Bière B */}
                  <div className={`flex-1 text-center p-2 rounded-md ${bWon ? "bg-glupp-accent/10 border border-glupp-accent/30" : "opacity-50 grayscale"}`}>
                    <div className="text-2xl mb-1 relative inline-block">
                      {beerEmoji(duel.beerB?.style || "Standard")}
                      {bWon && <Crown size={14} className="text-glupp-gold absolute -top-2 -right-2 rotate-12" />}
                    </div>
                    <p className={`text-xs font-bold truncate ${bWon ? "text-glupp-cream" : "text-glupp-text-muted"}`}>
                      {duel.beerB?.name || "Bière inconnue"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-glupp-text-muted text-sm">
            Aucun duel joué récemment. L'arène t'attend !
          </div>
        )}
      </div>
    </Modal>
  );
}