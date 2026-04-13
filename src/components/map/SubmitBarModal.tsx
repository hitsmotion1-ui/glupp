"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MapPin, Send, CheckCircle, Navigation, Search, Loader2 } from "lucide-react";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
  };
}

interface SubmitBarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubmitBarModal({ isOpen, onClose }: SubmitBarModalProps) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    geo_lat: "",
    geo_lng: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Autocomplétion Nominatim
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [geocoded, setGeocoded] = useState(false);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=5&accept-language=fr&countrycodes=fr,be,de,ch,lu`
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      }
      setSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-update search query when name or city changes
  useEffect(() => {
    if (!geocoded && (form.name.length >= 2 || form.city.length >= 2)) {
      setSearchQuery(`${form.name} ${form.city}`.trim());
    }
  }, [form.name, form.city, geocoded]);

  const selectSuggestion = (result: NominatimResult) => {
    const addr = result.address || {};
    const city = addr.city || addr.town || addr.village || "";
    const road = addr.road || "";
    const houseNumber = addr.house_number || "";
    const address = [houseNumber, road].filter(Boolean).join(" ");

    setForm({
      name: form.name, // On garde le nom saisi par l'user
      address: address || form.address,
      city: city || form.city,
      geo_lat: result.lat,
      geo_lng: result.lon,
    });
    setSuggestions([]);
    setGeocoded(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Le nom du bar est obligatoire");
      return;
    }

    // Si pas géocodé, tenter un géocodage automatique
    if (!form.geo_lat || !form.geo_lng) {
      try {
        const q = `${form.name} ${form.address} ${form.city}`.trim();
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&accept-language=fr`
        );
        const data = await res.json();
        if (data?.length > 0) {
          setForm((f) => ({
            ...f,
            geo_lat: data[0].lat,
            geo_lng: data[0].lon,
          }));
        }
      } catch { /* continue without geocoding */ }
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecte");

      const { error: insertError } = await supabase.from("submissions").insert({
        user_id: user.id,
        type: "bar",
        data: {
          name: form.name.trim(),
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          geo_lat: form.geo_lat ? parseFloat(form.geo_lat) : null,
          geo_lng: form.geo_lng ? parseFloat(form.geo_lng) : null,
        },
      });

      if (insertError) throw new Error(insertError.message);

      // Notify admins
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_admin", true);

      if (admins) {
        for (const admin of admins) {
          await supabase.from("notifications").insert({
            user_id: admin.id,
            type: "admin_new_submission",
            title: "Nouveau bar propose",
            message: `${form.name.trim()}${form.city.trim() ? ` (${form.city.trim()})` : ""}`,
            metadata: { submission_type: "bar", name: form.name.trim() },
          });
        }
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm({ name: "", address: "", city: "", geo_lat: "", geo_lng: "" });
    setSubmitted(false);
    setError(null);
    setSuggestions([]);
    setSearchQuery("");
    setGeocoded(false);
    onClose();
  };

  if (submitted) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Bar propose">
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-glupp-cream text-lg">Merci !</h3>
            <p className="text-sm text-glupp-text-muted mt-1">
              Ta proposition &quot;{form.name}&quot; est en cours de validation.
              Tu recevras une notification quand elle sera traitee.
            </p>
            <p className="text-xs text-glupp-accent mt-2">
              +10 XP si ton bar est valide !
            </p>
          </div>
          <Button variant="primary" onClick={handleClose}>
            Compris
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Proposer un bar">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-glupp-accent/10 border border-glupp-accent/20 rounded-glupp">
          <MapPin className="w-5 h-5 text-glupp-accent shrink-0" />
          <p className="text-xs text-glupp-text-soft">
            Tu connais un bar qui n&apos;est pas sur la carte ? Propose-le et gagne +10 XP s&apos;il est valide !
          </p>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Nom du bar *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setGeocoded(false); }}
            placeholder="Ex: Le Hop Corner"
            className="w-full px-3 py-2.5 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          />
        </div>

        {/* City */}
        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Ville *</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => { setForm((f) => ({ ...f, city: e.target.value })); setGeocoded(false); }}
            placeholder="Ex: Nantes, Lyon, Clermont-Ferrand..."
            className="w-full px-3 py-2.5 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          />
        </div>

        {/* Suggestions Nominatim */}
        {suggestions.length > 0 && !geocoded && (
          <div className="border border-glupp-border rounded-glupp overflow-hidden bg-glupp-card">
            <div className="px-3 py-1.5 bg-glupp-bg border-b border-glupp-border">
              <p className="text-[10px] text-glupp-text-muted flex items-center gap-1">
                <Search size={10} />
                Suggestions — clique pour selectionner
              </p>
            </div>
            {suggestions.map((s) => (
              <button
                key={s.place_id}
                type="button"
                onClick={() => selectSuggestion(s)}
                className="w-full text-left px-3 py-2.5 text-sm text-glupp-cream hover:bg-glupp-accent/10 transition-colors border-b border-glupp-border/30 last:border-0"
              >
                <p className="text-xs text-glupp-cream truncate">{s.display_name}</p>
              </button>
            ))}
          </div>
        )}

        {searching && (
          <p className="text-[10px] text-glupp-text-muted flex items-center gap-1.5">
            <Loader2 size={10} className="animate-spin" />
            Recherche en cours...
          </p>
        )}

        {/* Address */}
        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Adresse</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="Ex: 12 Rue de la Biere"
            className="w-full px-3 py-2.5 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          />
        </div>

        {/* Geocoding status */}
        {geocoded && form.geo_lat && (
          <p className="text-[10px] text-green-400 flex items-center gap-1.5">
            <Navigation size={10} />
            Position trouvee — le bar sera bien place sur la carte
          </p>
        )}
        {!geocoded && form.name.length >= 2 && form.city.length >= 2 && !searching && suggestions.length === 0 && (
          <p className="text-[10px] text-glupp-text-muted flex items-center gap-1.5">
            <MapPin size={10} />
            Aucun resultat — le bar sera localise automatiquement a la validation
          </p>
        )}

        {error && (
          <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-glupp">{error}</p>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={handleClose}>
            Annuler
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit} disabled={submitting || !form.name.trim()}>
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                <Send size={14} className="mr-1.5" />
                Proposer
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
