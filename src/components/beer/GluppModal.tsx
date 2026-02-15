"use client";

import { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { supabase } from "@/lib/supabase/client";
import type { Beer, Bar } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { beerEmoji } from "@/lib/utils/xp";
import { Camera, X, MapPin, Plus, ChevronDown } from "lucide-react";

interface GluppModalProps {
  onGlupped?: () => void;
}

export function GluppModal({ onGlupped }: GluppModalProps) {
  const { gluppModalBeerId, closeGluppModal, showXPToast } = useAppStore();
  const [beer, setBeer] = useState<Beer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bar state
  const [bars, setBars] = useState<Bar[]>([]);
  const [selectedBarId, setSelectedBarId] = useState<string | null>(null);
  const [showNewBar, setShowNewBar] = useState(false);
  const [newBarName, setNewBarName] = useState("");
  const [newBarCity, setNewBarCity] = useState("");
  const [barsLoading, setBarsLoading] = useState(false);

  // Fetch beer + bars when modal opens
  useEffect(() => {
    if (!gluppModalBeerId) {
      setBeer(null);
      setPhotoFile(null);
      setPhotoPreview(null);
      setSelectedBarId(null);
      setShowNewBar(false);
      setNewBarName("");
      setNewBarCity("");
      setError(null);
      return;
    }

    const fetchData = async () => {
      // Fetch beer
      const { data: beerData } = await supabase
        .from("beers")
        .select("*")
        .eq("id", gluppModalBeerId)
        .single();

      if (beerData) setBeer(beerData as Beer);

      // Fetch bars
      setBarsLoading(true);
      const { data: barsData } = await supabase
        .from("bars")
        .select("*")
        .order("name");

      if (barsData) setBars(barsData as Bar[]);
      setBarsLoading(false);
    };

    fetchData();
  }, [gluppModalBeerId]);

  // Handle photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove photo
  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle bar selection
  const handleBarChange = (value: string) => {
    if (value === "__new__") {
      setShowNewBar(true);
      setSelectedBarId(null);
    } else if (value === "") {
      setSelectedBarId(null);
      setShowNewBar(false);
    } else {
      setSelectedBarId(value);
      setShowNewBar(false);
    }
  };

  // Main submit
  const handleGlupp = async () => {
    if (!beer || !photoFile) return;
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu dois etre connecte.");
      setLoading(false);
      return;
    }

    try {
      // 1. Upload photo to Supabase Storage
      const timestamp = Date.now();
      const fileExt = photoFile.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${beer.id}_${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("glupp-photos")
        .upload(filePath, photoFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setError("Erreur upload photo : " + uploadError.message);
        setLoading(false);
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("glupp-photos").getPublicUrl(filePath);

      // 2. Create new bar if needed
      let barName: string | null = null;

      if (showNewBar && newBarName.trim()) {
        const { data: newBar, error: barError } = await supabase
          .from("bars")
          .insert({
            name: newBarName.trim(),
            city: newBarCity.trim() || null,
          })
          .select()
          .single();

        if (barError) {
          setError("Erreur creation bar : " + barError.message);
          setLoading(false);
          return;
        }

        barName = (newBar as Bar).name;
      } else if (selectedBarId) {
        const selectedBar = bars.find((b) => b.id === selectedBarId);
        barName = selectedBar?.name || null;
      }

      // 3. Register glupp
      const { data, error: rpcError } = await supabase.rpc("register_glupp", {
        p_user_id: user.id,
        p_beer_id: beer.id,
        p_photo_url: publicUrl,
        p_bar_name: barName,
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
    } catch (err) {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
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

        {/* Photo section */}
        <div>
          <label className="block text-sm text-glupp-text-soft mb-2">
            Photo de la biere *
          </label>

          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Photo biere"
                className="w-full h-40 object-cover rounded-glupp"
              />
              <button
                onClick={removePhoto}
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-glupp-border rounded-glupp text-glupp-text-muted hover:border-glupp-accent hover:text-glupp-accent transition-colors"
            >
              <Camera size={28} />
              <span className="text-sm">Prendre une photo</span>
              <span className="text-xs">Obligatoire pour valider</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        {/* Bar selection */}
        <div>
          <label className="block text-sm text-glupp-text-soft mb-2">
            <MapPin className="inline w-3.5 h-3.5 mr-1" />
            Ou tu l&apos;as bue ? (optionnel)
          </label>

          <div className="relative">
            <select
              value={showNewBar ? "__new__" : selectedBarId || ""}
              onChange={(e) => handleBarChange(e.target.value)}
              className="w-full px-4 py-3 bg-glupp-bg border border-glupp-border rounded-glupp text-glupp-cream appearance-none focus:outline-none focus:border-glupp-accent transition-colors"
            >
              <option value="">-- Aucun bar --</option>
              {bars.map((bar) => (
                <option key={bar.id} value={bar.id}>
                  {bar.name}
                  {bar.city ? ` (${bar.city})` : ""}
                </option>
              ))}
              <option value="__new__">+ Ajouter un bar</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-glupp-text-muted pointer-events-none" />
          </div>

          {/* New bar form */}
          {showNewBar && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={newBarName}
                onChange={(e) => setNewBarName(e.target.value)}
                placeholder="Nom du bar"
                className="w-full px-4 py-2.5 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
              />
              <input
                type="text"
                value={newBarCity}
                onChange={(e) => setNewBarCity(e.target.value)}
                placeholder="Ville (optionnel)"
                className="w-full px-4 py-2.5 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
              />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-glupp-error text-sm text-center">{error}</p>
        )}

        {/* Confirm button */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          onClick={handleGlupp}
          disabled={!photoFile || loading}
        >
          {photoFile ? "Confirmer le Glupp !" : "Photo requise"}
        </Button>
      </div>
    </Modal>
  );
}
