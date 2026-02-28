"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MapPin, Send, CheckCircle, Navigation } from "lucide-react";

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
  const [locating, setLocating] = useState(false);

  // Auto-detect location on open
  useEffect(() => {
    if (isOpen && !form.geo_lat && !form.geo_lng) {
      detectLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          geo_lat: pos.coords.latitude.toFixed(7),
          geo_lng: pos.coords.longitude.toFixed(7),
        }));
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Le nom du bar est obligatoire");
      return;
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
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex: Le Hop Corner"
            className="w-full px-3 py-2.5 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          />
        </div>

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

        {/* City */}
        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Ville</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            placeholder="Ex: Les Herbiers"
            className="w-full px-3 py-2.5 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          />
        </div>

        {/* GPS */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-glupp-text-muted">Coordonnees GPS</label>
            <button
              onClick={detectLocation}
              disabled={locating}
              className="flex items-center gap-1 text-xs text-glupp-accent hover:text-glupp-accent/80 transition-colors"
            >
              <Navigation size={10} />
              {locating ? "Detection..." : "Ma position"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={form.geo_lat}
              onChange={(e) => setForm((f) => ({ ...f, geo_lat: e.target.value }))}
              placeholder="Latitude"
              className="w-full px-3 py-2 bg-glupp-bg border border-glupp-border rounded-glupp text-xs text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
            />
            <input
              type="text"
              value={form.geo_lng}
              onChange={(e) => setForm((f) => ({ ...f, geo_lng: e.target.value }))}
              placeholder="Longitude"
              className="w-full px-3 py-2 bg-glupp-bg border border-glupp-border rounded-glupp text-xs text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
            />
          </div>
          {form.geo_lat && form.geo_lng && (
            <p className="text-[10px] text-green-400 mt-1">
              Position detectee
            </p>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-glupp">{error}</p>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={handleClose}>
            Annuler
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <div className="animate-spin w-4 h-4 border-2 border-glupp-bg border-t-transparent rounded-full" />
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
