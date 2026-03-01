"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Beer, Send, CheckCircle, Camera, X } from "lucide-react";

interface SubmitBeerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillName?: string;
}

const STYLES = [
  "IPA", "NEIPA", "Double IPA", "Pale Ale", "Blonde", "Blanche",
  "Stout", "Porter", "Lager", "Pilsner", "Amber", "Red Ale",
  "Saison", "Tripel", "Dubbel", "Quadrupel", "Sour", "Lambic",
  "Gueuze", "Fruit Beer", "Wheat Beer", "Barley Wine", "Scotch Ale",
  "Biere de Garde", "Kolsch", "Hefeweizen", "Autre",
];

const COUNTRIES = [
  { code: "FR", flag: "🇫🇷", name: "France" },
  { code: "BE", flag: "🇧🇪", name: "Belgique" },
  { code: "DE", flag: "🇩🇪", name: "Allemagne" },
  { code: "US", flag: "🇺🇸", name: "Etats-Unis" },
  { code: "GB", flag: "🇬🇧", name: "Royaume-Uni" },
  { code: "IE", flag: "🇮🇪", name: "Irlande" },
  { code: "NL", flag: "🇳🇱", name: "Pays-Bas" },
  { code: "CZ", flag: "🇨🇿", name: "Tchequie" },
  { code: "JP", flag: "🇯🇵", name: "Japon" },
  { code: "MX", flag: "🇲🇽", name: "Mexique" },
  { code: "ES", flag: "🇪🇸", name: "Espagne" },
  { code: "IT", flag: "🇮🇹", name: "Italie" },
  { code: "NO", flag: "🇳🇴", name: "Norvege" },
  { code: "DK", flag: "🇩🇰", name: "Danemark" },
  { code: "AU", flag: "🇦🇺", name: "Australie" },
  { code: "XX", flag: "🌍", name: "Autre" },
];

export function SubmitBeerModal({ isOpen, onClose, prefillName }: SubmitBeerModalProps) {
  const [form, setForm] = useState({
    name: prefillName || "",
    brewery: "",
    style: "Blonde",
    country_code: "FR",
    abv: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === form.country_code) || COUNTRIES[0];

  const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_PHOTO_SIZE) {
      setError("La photo ne doit pas depasser 5 Mo");
      return;
    }

    setError(null);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoRemove = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.brewery.trim()) {
      setError("Le nom et la brasserie sont obligatoires");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecte");

      // Upload photo if provided
      let photoUrl: string | null = null;
      if (photo) {
        const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `beer-photos/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("submissions")
          .upload(path, photo);
        if (uploadError) throw new Error("Erreur upload photo: " + uploadError.message);
        photoUrl = supabase.storage.from("submissions").getPublicUrl(path).data.publicUrl;
      }

      const { error: insertError } = await supabase.from("submissions").insert({
        user_id: user.id,
        type: "beer",
        data: {
          name: form.name.trim(),
          brewery: form.brewery.trim(),
          style: form.style,
          country: selectedCountry.flag,
          country_code: form.country_code,
          abv: form.abv ? parseFloat(form.abv) : null,
          description: form.description.trim() || null,
          photo_url: photoUrl,
        },
      });

      if (insertError) throw new Error(insertError.message);

      // Notify admin (insert notification for all admins)
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_admin", true);

      if (admins) {
        for (const admin of admins) {
          await supabase.from("notifications").insert({
            user_id: admin.id,
            type: "admin_new_submission",
            title: "Nouvelle soumission biere",
            message: `${form.name.trim()} (${form.brewery.trim()})`,
            metadata: { submission_type: "beer", name: form.name.trim() },
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
    setForm({ name: prefillName || "", brewery: "", style: "Blonde", country_code: "FR", abv: "", description: "" });
    setSubmitted(false);
    setError(null);
    handlePhotoRemove();
    onClose();
  };

  if (submitted) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Soumission envoyee">
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
              +15 XP si ta biere est validee !
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Proposer une biere">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-glupp-accent/10 border border-glupp-accent/20 rounded-glupp">
          <Beer className="w-5 h-5 text-glupp-accent shrink-0" />
          <p className="text-xs text-glupp-text-soft">
            Ta biere n&apos;est pas dans notre base ? Propose-la et gagne +15 XP si elle est validee !
          </p>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Nom de la biere *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex: Chouffe Houblon"
            className="w-full px-3 py-2.5 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          />
        </div>

        {/* Brewery */}
        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Brasserie *</label>
          <input
            type="text"
            value={form.brewery}
            onChange={(e) => setForm((f) => ({ ...f, brewery: e.target.value }))}
            placeholder="Ex: Brasserie d'Achouffe"
            className="w-full px-3 py-2.5 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          />
        </div>

        {/* Style + Country */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-glupp-text-muted block mb-1">Style</label>
            <select
              value={form.style}
              onChange={(e) => setForm((f) => ({ ...f, style: e.target.value }))}
              className="w-full px-3 py-2.5 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream focus:outline-none focus:border-glupp-accent transition-colors"
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-glupp-text-muted block mb-1">Pays</label>
            <select
              value={form.country_code}
              onChange={(e) => setForm((f) => ({ ...f, country_code: e.target.value }))}
              className="w-full px-3 py-2.5 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream focus:outline-none focus:border-glupp-accent transition-colors"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ABV */}
        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Degre d&apos;alcool (%)</label>
          <input
            type="number"
            value={form.abv}
            onChange={(e) => setForm((f) => ({ ...f, abv: e.target.value }))}
            placeholder="Ex: 8.5"
            step="0.1"
            min="0"
            max="30"
            className="w-full px-3 py-2.5 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Description (optionnel)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Notes de degustation, particularites..."
            rows={2}
            className="w-full px-3 py-2.5 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors resize-none"
          />
        </div>

        {/* Photo (optional) */}
        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Photo (optionnel)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoSelect}
            className="hidden"
          />
          {photoPreview ? (
            <div className="relative inline-block">
              <img
                src={photoPreview}
                alt="Apercu"
                className="w-20 h-20 rounded-glupp object-cover border border-glupp-border"
              />
              <button
                type="button"
                onClick={handlePhotoRemove}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-400 transition-colors"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-glupp-bg border border-dashed border-glupp-border rounded-glupp text-sm text-glupp-text-muted hover:border-glupp-accent hover:text-glupp-cream transition-colors"
            >
              <Camera size={16} />
              Ajouter une photo
            </button>
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
