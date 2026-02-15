"use client";

import { useState, useCallback } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { supabase } from "@/lib/supabase/client";
import { BeerModal } from "@/components/beer/BeerModal";
import { GluppModal } from "@/components/beer/GluppModal";
import { BarcodeScanner } from "@/components/beer/BarcodeScanner";
import { XPToast } from "@/components/gamification/XPToast";
import { CelebrationOverlay } from "@/components/gamification/CelebrationOverlay";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Plus, ScanLine, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { beerEmoji } from "@/lib/utils/xp";
import type { Beer } from "@/types";

export function GlobalModals() {
  const openBeerModal = useAppStore((s) => s.openBeerModal);
  const openGluppModal = useAppStore((s) => s.openGluppModal);

  // Scanner & Search from store (shared with Header)
  const showScanner = useAppStore((s) => s.showScanner);
  const setShowScanner = useAppStore((s) => s.setShowScanner);
  const showSearch = useAppStore((s) => s.showSearch);
  const setShowSearch = useAppStore((s) => s.setShowSearch);

  // FAB menu
  const [fabOpen, setFabOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Beer[]>([]);
  const [searching, setSearching] = useState(false);

  // Toast
  const [scanToast, setScanToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Check if beer is already tasted
  const checkTasted = useCallback(async (beerId: string): Promise<boolean> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from("user_beers")
      .select("id")
      .eq("user_id", user.id)
      .eq("beer_id", beerId)
      .maybeSingle();
    return !!data;
  }, []);

  // Barcode scan handler
  const handleBarcodeScan = async (barcode: string) => {
    setShowScanner(false);

    const { data, error } = await supabase
      .from("beers")
      .select("*")
      .eq("barcode", barcode)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      setScanToast({ message: "Erreur lors de la recherche.", type: "error" });
      return;
    }

    if (data) {
      const beer = data as Beer;
      const tasted = await checkTasted(beer.id);
      if (tasted) {
        openBeerModal(beer.id);
        setScanToast({
          message: `${beer.name} — deja dans ta collection !`,
          type: "info",
        });
      } else {
        openGluppModal(beer.id);
      }
    } else {
      setScanToast({
        message: `Code-barres non reconnu. Essaie la recherche.`,
        type: "error",
      });
    }
  };

  // Search handler
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const { data } = await supabase
      .from("beers")
      .select("*")
      .eq("is_active", true)
      .or(
        `name.ilike.%${query}%,brewery.ilike.%${query}%,style.ilike.%${query}%`
      )
      .order("elo", { ascending: false })
      .limit(10);

    if (data) setSearchResults(data as Beer[]);
    setSearching(false);
  };

  // Select beer from search
  const handleSelectBeer = async (beer: Beer) => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);

    const tasted = await checkTasted(beer.id);
    if (tasted) {
      openBeerModal(beer.id);
      setScanToast({
        message: `${beer.name} — deja dans ta collection !`,
        type: "info",
      });
    } else {
      openGluppModal(beer.id);
    }
  };

  return (
    <>
      {/* Global Modals */}
      <BeerModal />
      <GluppModal />
      <XPToast />
      <CelebrationOverlay />

      {/* FAB (Floating Action Button) */}
      <div className="fixed bottom-20 right-4 z-50 pb-[env(safe-area-inset-bottom,0px)]">
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="flex flex-col gap-2 mb-3"
            >
              {/* Scanner option */}
              <button
                onClick={() => {
                  setFabOpen(false);
                  setShowScanner(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-glupp-card border border-glupp-border rounded-full shadow-glupp text-sm text-glupp-cream hover:border-glupp-accent transition-colors whitespace-nowrap ml-auto"
              >
                <ScanLine className="w-4 h-4 text-glupp-accent" />
                Scanner
              </button>

              {/* Search option */}
              <button
                onClick={() => {
                  setFabOpen(false);
                  setShowSearch(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-glupp-card border border-glupp-border rounded-full shadow-glupp text-sm text-glupp-cream hover:border-glupp-accent transition-colors whitespace-nowrap ml-auto"
              >
                <Search className="w-4 h-4 text-glupp-accent" />
                Chercher
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB button */}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className={`flex items-center justify-center w-14 h-14 rounded-full shadow-glupp-accent transition-all ml-auto ${
            fabOpen
              ? "bg-glupp-card border border-glupp-border rotate-45"
              : "bg-glupp-accent"
          }`}
        >
          <Plus
            className={`w-7 h-7 transition-colors ${
              fabOpen ? "text-glupp-cream" : "text-glupp-bg"
            }`}
          />
        </button>
      </div>

      {/* Close FAB when clicking elsewhere */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* Scanner overlay */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Search modal */}
      <Modal
        isOpen={showSearch}
        onClose={() => {
          setShowSearch(false);
          setSearchQuery("");
          setSearchResults([]);
        }}
        title="Chercher une biere"
      >
        <div className="space-y-3">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-glupp-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Nom, brasserie ou style..."
              autoFocus
              className="w-full pl-10 pr-4 py-3 bg-glupp-bg border border-glupp-border rounded-glupp text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
            />
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto space-y-1">
            {searching && (
              <p className="text-center py-4 text-glupp-text-muted text-sm">
                Recherche...
              </p>
            )}

            {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <p className="text-center py-4 text-glupp-text-muted text-sm">
                Aucune biere trouvee.
              </p>
            )}

            {searchResults.map((beer) => (
              <button
                key={beer.id}
                onClick={() => handleSelectBeer(beer)}
                className="w-full flex items-center gap-3 p-3 bg-glupp-card-alt rounded-glupp hover:bg-glupp-border/30 transition-colors text-left"
              >
                <span className="text-2xl">{beerEmoji(beer.style)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-glupp-cream text-sm truncate">
                    {beer.name}
                  </p>
                  <p className="text-xs text-glupp-text-muted truncate">
                    {beer.brewery} {beer.country}
                  </p>
                </div>
                <span className="text-xs text-glupp-text-muted shrink-0">
                  {beer.style}
                </span>
              </button>
            ))}

            {!searching && searchQuery.length < 2 && (
              <p className="text-center py-4 text-glupp-text-muted text-sm">
                Tape au moins 2 caracteres...
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Scan result toast */}
      <Toast
        message={scanToast?.message || ""}
        type={scanToast?.type}
        isVisible={!!scanToast}
        onClose={() => setScanToast(null)}
      />
    </>
  );
}
