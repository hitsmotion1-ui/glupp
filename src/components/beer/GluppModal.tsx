"use client";

import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store/useAppStore";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import type { Beer, Bar } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { beerEmoji, RARITY_CONFIG, type Rarity } from "@/lib/utils/xp";
import { RarityBadge } from "./RarityBadge";
import {
  Camera,
  X,
  MapPin,
  ChevronDown,
  Navigation,
  Zap,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";

export function GluppModal() {
  const queryClient = useQueryClient();
  const { gluppModalBeerId, closeGluppModal, showXPToast, triggerCelebration } =
    useAppStore();
  const [beer, setBeer] = useState<Beer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Geolocation state
  const [geoLat, setGeoLat] = useState<number | null>(null);
  const [geoLng, setGeoLng] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

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
      setGeoLat(null);
      setGeoLng(null);
      setGeoError(null);
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

  // Geolocation
  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geoloc non supportee");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLat(position.coords.latitude);
        setGeoLng(position.coords.longitude);
        setGeoLoading(false);
      },
      () => {
        setGeoError("Position refusee");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Remove geolocation
  const removeGeo = () => {
    setGeoLat(null);
    setGeoLng(null);
    setGeoError(null);
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

  // XP preview calculation
  const computeXPPreview = () => {
    let xp = 5; // base scan
    if (photoFile && geoLat) xp = 40; // photo + geo
    else if (photoFile) xp = 20; // photo only

    // Rarity bonus
    const rarity = beer?.rarity as Rarity;
    if (rarity === "rare") xp += 10;
    else if (rarity === "epic") xp += 30;
    else if (rarity === "legendary") xp += 50;

    return xp;
  };

  // Main submit
  const handleGlupp = async () => {
    if (!beer) return;
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
      let photoUrl: string | null = null;

      // 1. Upload photo if provided
      if (photoFile) {
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
          // Storage bucket might not exist yet — continue without photo
          console.warn("Photo upload failed:", uploadError.message);
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from("glupp-photos").getPublicUrl(filePath);
          photoUrl = publicUrl;
        }
      }

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

        if (!barError && newBar) {
          barName = (newBar as Bar).name;
        }
      } else if (selectedBarId) {
        const selectedBar = bars.find((b) => b.id === selectedBarId);
        barName = selectedBar?.name || null;
      }

      // 3. Register glupp
      const { data, error: rpcError } = await supabase.rpc("register_glupp", {
        p_user_id: user.id,
        p_beer_id: beer.id,
        p_photo_url: photoUrl,
        p_geo_lat: geoLat,
        p_geo_lng: geoLng,
        p_bar_name: barName,
      });

      if (rpcError) {
        setError(rpcError.message);
        setLoading(false);
        return;
      }

      const result = data as { xp_gained: number; rarity: string };
      showXPToast(result.xp_gained, "Glupp !");
      triggerCelebration();
      closeGluppModal();

      // Cascade invalidation
      queryClient.invalidateQueries({ queryKey: queryKeys.collection.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.duel.tastedBeers });
      queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.beers.all });
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  if (!beer) return null;

  const rarityConfig = RARITY_CONFIG[beer.rarity as Rarity];
  const xpPreview = computeXPPreview();

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
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-glupp-cream truncate">
              {beer.name}
            </p>
            <p className="text-xs text-glupp-text-muted">
              {beer.brewery} {beer.country}
            </p>
          </div>
          <RarityBadge rarity={beer.rarity} />
        </div>

        {/* XP Preview */}
        <motion.div
          key={xpPreview}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-glupp text-sm font-semibold"
          style={{
            backgroundColor: `${rarityConfig.color}15`,
            color: rarityConfig.color,
          }}
        >
          <Zap size={16} />
          <span>+{xpPreview} XP</span>
          {!photoFile && (
            <span className="text-xs font-normal opacity-70">
              (+{geoLat ? 35 : 15} avec photo)
            </span>
          )}
          {photoFile && !geoLat && (
            <span className="text-xs font-normal opacity-70">
              (+20 avec position)
            </span>
          )}
        </motion.div>

        {/* Photo section — optional */}
        <div>
          <label className="flex items-center justify-between text-sm text-glupp-text-soft mb-2">
            <span>
              <Camera size={14} className="inline mr-1.5" />
              Photo
            </span>
            <span className="text-[10px] text-glupp-accent">+15 XP</span>
          </label>

          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Photo biere"
                className="w-full h-36 object-cover rounded-glupp"
              />
              <button
                onClick={removePhoto}
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-glupp-success/80 rounded-full text-white text-[10px]">
                <CheckCircle size={10} />
                Photo ajoutee
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 py-3 px-4 border border-dashed border-glupp-border rounded-glupp text-glupp-text-muted hover:border-glupp-accent hover:text-glupp-accent transition-colors"
            >
              <Camera size={22} />
              <div className="text-left">
                <p className="text-sm">Prendre une photo</p>
                <p className="text-[10px] opacity-60">Optionnel mais recommande</p>
              </div>
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

        {/* Geolocation — optional */}
        <div>
          <label className="flex items-center justify-between text-sm text-glupp-text-soft mb-2">
            <span>
              <Navigation size={14} className="inline mr-1.5" />
              Position
            </span>
            <span className="text-[10px] text-glupp-accent">
              {photoFile ? "+20 XP" : "+0 XP"}
            </span>
          </label>

          {geoLat && geoLng ? (
            <div className="flex items-center justify-between px-4 py-2.5 bg-glupp-success/10 border border-glupp-success/30 rounded-glupp">
              <div className="flex items-center gap-2 text-sm text-glupp-success">
                <CheckCircle size={14} />
                <span>Position enregistree</span>
              </div>
              <button
                onClick={removeGeo}
                className="text-glupp-text-muted hover:text-glupp-cream transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={requestGeolocation}
              disabled={geoLoading}
              className="w-full flex items-center gap-3 py-2.5 px-4 border border-dashed border-glupp-border rounded-glupp text-glupp-text-muted hover:border-glupp-accent hover:text-glupp-accent transition-colors disabled:opacity-50"
            >
              <MapPin size={18} />
              <span className="text-sm">
                {geoLoading
                  ? "Localisation..."
                  : geoError || "Ajouter ma position"}
              </span>
            </button>
          )}
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
              className="w-full px-4 py-2.5 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream appearance-none focus:outline-none focus:border-glupp-accent transition-colors"
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
                className="w-full px-4 py-2 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
              />
              <input
                type="text"
                value={newBarCity}
                onChange={(e) => setNewBarCity(e.target.value)}
                placeholder="Ville (optionnel)"
                className="w-full px-4 py-2 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
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
          disabled={loading}
        >
          Confirmer le Glupp ! (+{xpPreview} XP)
        </Button>
      </div>
    </Modal>
  );
}
