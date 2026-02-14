"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import type { Beer } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { beerEmoji } from "@/lib/utils/xp";

interface GluppModalProps {
  onGlupped?: () => void;
}

export function GluppModal({ onGlupped }: GluppModalProps) {
  const { gluppModalBeerId, closeGluppModal, showXPToast } = useAppStore();
  const [beer, setBeer] = useState<Beer | null>(null);
  const [barName, setBarName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gluppModalBeerId) {
      setBeer(null);
      setBarName("");
      setError(null);
      return;
    }

    const fetchBeer = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("beers")
        .select("*")
        .eq("id", gluppModalBeerId)
        .single();

      if (data) setBeer(data as Beer);
    };

    fetchBeer();
  }, [gluppModalBeerId]);

  const handleGlupp = async () => {
    if (!beer) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu dois etre connecte.");
      setLoading(false);
      return;
    }

    const { data, error: rpcError } = await supabase.rpc("register_glupp", {
      p_user_id: user.id,
      p_beer_id: beer.id,
      p_bar_name: barName || null,
    });

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    const result = data as { xp_gained: number; rarity: string };
    showXPToast(result.xp_gained, "Glupp !");
    closeGluppModal();
    onGlupped?.();
    setLoading(false);
  };

  if (!beer) return null;

  return (
    <Modal
      isOpen={!!gluppModalBeerId}
      onClose={closeGluppModal}
      title="Glupper !"
    >
      <div className="space-y-4">
        {/* Beer preview */}
        <div className="flex items-center gap-3 bg-glupp-card-alt rounded-glupp p-3">
          <span className="text-3xl">{beerEmoji(beer.style)}</span>
          <div>
            <p className="font-semibold text-glupp-cream">{beer.name}</p>
            <p className="text-xs text-glupp-text-muted">
              {beer.brewery} {beer.country}
            </p>
          </div>
        </div>

        {/* Bar name (optional) */}
        <div>
          <label
            htmlFor="barName"
            className="block text-sm text-glupp-text-soft mb-1"
          >
            Ou tu l&apos;as bue ? (optionnel)
          </label>
          <input
            id="barName"
            type="text"
            value={barName}
            onChange={(e) => setBarName(e.target.value)}
            className="w-full px-4 py-3 bg-glupp-bg border border-glupp-border rounded-glupp text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
            placeholder="Nom du bar..."
          />
        </div>

        {error && (
          <p className="text-glupp-error text-sm text-center">{error}</p>
        )}

        {/* Confirm */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          onClick={handleGlupp}
        >
          Confirmer le Glupp !
        </Button>
      </div>
    </Modal>
  );
}
