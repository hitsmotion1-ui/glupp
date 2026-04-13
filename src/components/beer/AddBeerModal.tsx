"use client";

import { useState, useMemo, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAddBeer, type AddBeerInput, type DuplicateCandidate } from "@/lib/hooks/useAddBeer";
import { useAppStore } from "@/lib/store/useAppStore";
import { supabase } from "@/lib/supabase/client";
import { BEER_STYLES } from "@/lib/utils/beerDefaults";
import { getRegionSuggestions } from "@/lib/utils/regionSuggestions";
import { beerEmoji } from "@/lib/utils/xp";
import { Beer, Send, CheckCircle, ChevronDown, Search, Loader2, AlertTriangle, Camera, X, Clock, MapPin, Navigation } from "lucide-react";

const COUNTRIES = [
  { code: "FR", flag: "\u{1F1EB}\u{1F1F7}", name: "France" },
  { code: "BE", flag: "\u{1F1E7}\u{1F1EA}", name: "Belgique" },
  { code: "DE", flag: "\u{1F1E9}\u{1F1EA}", name: "Allemagne" },
  { code: "US", flag: "\u{1F1FA}\u{1F1F8}", name: "Etats-Unis" },
  { code: "GB", flag: "\u{1F1EC}\u{1F1E7}", name: "Royaume-Uni" },
  { code: "IE", flag: "\u{1F1EE}\u{1F1EA}", name: "Irlande" },
  { code: "NL", flag: "\u{1F1F3}\u{1F1F1}", name: "Pays-Bas" },
  { code: "CZ", flag: "\u{1F1E8}\u{1F1FF}", name: "Tchequie" },
  { code: "JP", flag: "\u{1F1EF}\u{1F1F5}", name: "Japon" },
  { code: "MX", flag: "\u{1F1F2}\u{1F1FD}", name: "Mexique" },
  { code: "ES", flag: "\u{1F1EA}\u{1F1F8}", name: "Espagne" },
  { code: "IT", flag: "\u{1F1EE}\u{1F1F9}", name: "Italie" },
  { code: "NO", flag: "\u{1F1F3}\u{1F1F4}", name: "Norvege" },
  { code: "DK", flag: "\u{1F1E9}\u{1F1F0}", name: "Danemark" },
  { code: "AU", flag: "\u{1F1E6}\u{1F1FA}", name: "Australie" },
  { code: "CA", flag: "\u{1F1E8}\u{1F1E6}", name: "Canada" },
  { code: "PL", flag: "\u{1F1F5}\u{1F1F1}", name: "Pologne" },
  { code: "AT", flag: "\u{1F1E6}\u{1F1F9}", name: "Autriche" },
  { code: "SE", flag: "\u{1F1F8}\u{1F1EA}", name: "Suede" },
  { code: "PT", flag: "\u{1F1F5}\u{1F1F9}", name: "Portugal" },
  { code: "BR", flag: "\u{1F1E7}\u{1F1F7}", name: "Bresil" },
  { code: "CH", flag: "\u{1F1E8}\u{1F1ED}", name: "Suisse" },
  { code: "NZ", flag: "\u{1F1F3}\u{1F1FF}", name: "Nouvelle-Zelande" },
  { code: "CN", flag: "\u{1F1E8}\u{1F1F3}", name: "Chine" },
  { code: "VN", flag: "\u{1F1FB}\u{1F1F3}", name: "Vietnam" },
  { code: "TH", flag: "\u{1F1F9}\u{1F1ED}", name: "Thailande" },
];

interface AddBeerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillName?: string;
  prefillBarcode?: string | null;
}

export function AddBeerModal({ isOpen, onClose, prefillName, prefillBarcode }: AddBeerModalProps) {
  const { addBeer, adding, checkDuplicates } = useAddBeer();
  const openGluppModal = useAppStore((s) => s.openGluppModal);

  const [name, setName] = useState(prefillName || "");
  const [brewery, setBrewery] = useState("");
  const [style, setStyle] = useState("Blonde Ale");
  const [countryCode, setCountryCode] = useState("FR");
  const [region, setRegion] = useState("");
  const [abv, setAbv] = useState("");
  const [barcode, setBarcode] = useState(prefillBarcode || "");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wantsToGlupp, setWantsToGlupp] = useState(false);

  // Localisation pour le glupp
  type LocationType = "bar" | "onsite" | null;
  const [locationType, setLocationType] = useState<LocationType>(null);
  const [geoLat, setGeoLat] = useState<number | null>(null);
  const [geoLng, setGeoLng] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoCity, setGeoCity] = useState<string | null>(null);
  const [selectedBarId, setSelectedBarId] = useState<string | null>(null);
  const [showNewBar, setShowNewBar] = useState(false);
  const [newBarName, setNewBarName] = useState("");
  const [newBarCity, setNewBarCity] = useState("");
  const [onsiteLabel, setOnsiteLabel] = useState("");
  const [bars, setBars] = useState<Array<{ id: string; name: string; city: string | null; geo_lat: number | null; geo_lng: number | null }>>([]);

  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [showDuplicateCheck, setShowDuplicateCheck] = useState(false);
  const [checkedDuplicates, setCheckedDuplicates] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [showStylePicker, setShowStylePicker] = useState(false);
  const [styleSearch, setStyleSearch] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(prefillName || "");
      setBarcode(prefillBarcode || "");
      setDescription("");
      setBrewery("");
      setStyle("Blonde Ale");
      setCountryCode("FR");
      setRegion("");
      setAbv("");
      setPhotoFile(null);
      setPhotoPreview(null);
      setError(null);
      setDuplicates([]);
      setShowDuplicateCheck(false);
      setCheckedDuplicates(false);
      setSubmitted(false);
      setWantsToGlupp(false);
      setLocationType(null);
      setGeoLat(null);
      setGeoLng(null);
      setGeoLoading(false);
      setGeoError(null);
      setGeoCity(null);
      setSelectedBarId(null);
      setShowNewBar(false);
      setNewBarName("");
      setNewBarCity("");
      setOnsiteLabel("");
    }
  }, [isOpen, prefillName, prefillBarcode]);

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];

  // Charger les bars quand l'user choisit "Dans un bar"
  useEffect(() => {
    if (locationType === "bar" && bars.length === 0) {
      supabase.from("bars").select("id, name, city, geo_lat, geo_lng").order("name").then(({ data }) => {
        if (data) setBars(data);
      });
    }
  }, [locationType, bars.length]);

  // Demander la géolocalisation quand l'user choisit un type de localisation
  useEffect(() => {
    if (wantsToGlupp && locationType && !geoLat && !geoLoading) {
      setGeoLoading(true);
      setGeoError(null);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setGeoLat(pos.coords.latitude);
          setGeoLng(pos.coords.longitude);
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=fr`);
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || null;
            setGeoCity(city);
          } catch { /* ignore */ }
          setGeoLoading(false);
        },
        () => {
          setGeoError("Localisation refusée");
          setGeoLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [wantsToGlupp, locationType, geoLat, geoLoading]);
  const regionSuggestions = useMemo(() => getRegionSuggestions(countryCode), [countryCode]);

  const filteredStyles = useMemo(() => {
    if (!styleSearch.trim()) return BEER_STYLES;
    const q = styleSearch.toLowerCase();
    return BEER_STYLES.filter((s) => s.toLowerCase().includes(q));
  }, [styleSearch]);

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRIES;
    const q = countrySearch.toLowerCase();
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [countrySearch]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("La photo ne doit pas depasser 5 Mo");
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !brewery.trim()) {
      setError("Le nom et la brasserie sont obligatoires");
      return;
    }

    if (wantsToGlupp && !photoFile) {
      setError("La photo est obligatoire pour glupper la biere");
      return;
    }

    if (!checkedDuplicates) {
      const found = await checkDuplicates(name, brewery);
      if (found.length > 0) {
        setDuplicates(found);
        setShowDuplicateCheck(true);
        setCheckedDuplicates(true);
        return;
      }
      setCheckedDuplicates(true);
    }

    setError(null);
    try {
      const input: AddBeerInput = {
        name: name.trim(),
        brewery: brewery.trim(),
        style,
        country: selectedCountry.flag,
        country_code: countryCode,
        region: region.trim() || undefined,
        abv: abv ? parseFloat(abv) : null,
        barcode: barcode.trim() || undefined,
        description: description.trim() || undefined,
        imageFile: photoFile,
      };

      const beer = await addBeer(input);

      // Si l'user veut glupper, enregistrer le glupp en pending
      if (wantsToGlupp && beer) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Upload photo
          let photoUrl: string | null = null;
          if (photoFile) {
            const timestamp = Date.now();
            const fileExt = photoFile.name.split(".").pop() || "jpg";
            const filePath = `${user.id}/${beer.id}_${timestamp}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
              .from("glupp-photos")
              .upload(filePath, photoFile, { cacheControl: "3600", upsert: false });
            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage.from("glupp-photos").getPublicUrl(filePath);
              photoUrl = publicUrl;
            }
          }

          // Déterminer la localisation
          let finalGeoLat = geoLat;
          let finalGeoLng = geoLng;
          let barName: string | null = null;

          if (locationType === "bar") {
            if (showNewBar && newBarName.trim()) {
              // Géocoder le nouveau bar
              let barLat: number | null = null;
              let barLng: number | null = null;
              try {
                const geoQuery = `${newBarName.trim()} ${newBarCity.trim() || ""}`.trim();
                const geoResp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(geoQuery)}&format=json&limit=1&accept-language=fr`);
                const geoData = await geoResp.json();
                if (geoData?.length > 0) {
                  barLat = parseFloat(geoData[0].lat);
                  barLng = parseFloat(geoData[0].lon);
                }
              } catch { /* ignore */ }

              const { data: newBar } = await supabase
                .from("bars")
                .insert({ name: newBarName.trim(), city: newBarCity.trim() || null, geo_lat: barLat, geo_lng: barLng })
                .select()
                .single();
              if (newBar) {
                barName = newBar.name;
                if (barLat && barLng) { finalGeoLat = barLat; finalGeoLng = barLng; }
              }
            } else if (selectedBarId) {
              const bar = bars.find(b => b.id === selectedBarId);
              barName = bar?.name || null;
              if (bar?.geo_lat && bar?.geo_lng) { finalGeoLat = bar.geo_lat; finalGeoLng = bar.geo_lng; }
            }
          } else if (locationType === "onsite") {
            barName = `Sur place${onsiteLabel ? ` (${onsiteLabel})` : geoCity ? ` (${geoCity})` : ""}`;
          }

          // Enregistrer le glupp (XP sera attribuée à la validation via approve_beer_and_credit_xp)
          const { error: rpcError } = await supabase.rpc("register_glupp", {
            p_user_id: user.id,
            p_beer_id: beer.id,
            p_photo_url: photoUrl,
            p_geo_lat: finalGeoLat,
            p_geo_lng: finalGeoLng,
            p_bar_name: barName,
          });

          if (rpcError) {
            console.warn("Glupp registration deferred:", rpcError.message);
          }
        }
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  };

  const handleConfirmNew = async () => {
    setShowDuplicateCheck(false);
    setDuplicates([]);
    await handleSubmit();
  };

  const handleSelectDuplicate = (beer: DuplicateCandidate) => {
    handleClose();
    openGluppModal(beer.id);
  };

  const handleClose = () => {
    setName(prefillName || "");
    setBarcode(prefillBarcode || "");
    setDescription("");
    setBrewery("");
    setStyle("Blonde Ale");
    setCountryCode("FR");
    setRegion("");
    setAbv("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setError(null);
    setDuplicates([]);
    setShowDuplicateCheck(false);
    setCheckedDuplicates(false);
    setSubmitted(false);
    setWantsToGlupp(false);
    setLocationType(null);
    setGeoLat(null);
    setGeoLng(null);
    setGeoLoading(false);
    setGeoError(null);
    setGeoCity(null);
    setSelectedBarId(null);
    setShowNewBar(false);
    setNewBarName("");
    setNewBarCity("");
    setOnsiteLabel("");
    setShowStylePicker(false);
    setShowCountryPicker(false);
    onClose();
  };

  const inputClass = "w-full px-3 py-2.5 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors";

  if (submitted) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Biere proposee !">
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-glupp-cream text-lg">Merci !</h3>
            <p className="text-sm text-glupp-text-muted mt-1">Ta proposition &quot;{name}&quot; est en cours de validation.</p>
            <p className="text-xs text-glupp-accent mt-2">+10 XP</p>
          </div>
          {wantsToGlupp && (
            <div className="flex items-center gap-3 p-3 bg-glupp-accent/10 border border-glupp-accent/20 rounded-glupp text-left">
              <Clock size={18} className="text-glupp-accent shrink-0" />
              <div>
                <p className="text-sm font-medium text-glupp-cream">Glupp en attente</p>
                <p className="text-xs text-glupp-text-muted mt-0.5">
                  Ta biere sera gluppee automatiquement des que l&apos;equipe l&apos;aura validee. Tu recevras une notification !
                </p>
              </div>
            </div>
          )}
          <Button variant="primary" onClick={handleClose}>Compris</Button>
        </div>
      </Modal>
    );
  }

  if (showDuplicateCheck && duplicates.length > 0) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Biere similaire trouvee">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-glupp">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
            <p className="text-xs text-glupp-text-soft">Cette biere existe peut-etre deja dans Glupp :</p>
          </div>
          <div className="space-y-2">
            {duplicates.map((d) => (
              <button key={d.id} onClick={() => handleSelectDuplicate(d)} className="w-full flex items-center gap-3 p-3 bg-glupp-card-alt rounded-glupp hover:bg-glupp-border/30 transition-colors text-left">
                <span className="text-2xl">{beerEmoji(d.style)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-glupp-cream text-sm truncate">{d.name}</p>
                  <p className="text-xs text-glupp-text-muted truncate">{d.brewery} {d.country}</p>
                </div>
                <span className="text-xs text-glupp-accent shrink-0">Glupper</span>
              </button>
            ))}
          </div>
          <div className="border-t border-glupp-border pt-3">
            <button onClick={handleConfirmNew} disabled={adding} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-glupp-accent/15 border border-glupp-accent/30 rounded-glupp text-sm text-glupp-accent hover:bg-glupp-accent/25 transition-colors">
              {adding ? <Loader2 size={14} className="animate-spin" /> : "Non, c'est une nouvelle biere"}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Proposer une biere">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-glupp-accent/10 border border-glupp-accent/20 rounded-glupp">
          <Beer className="w-5 h-5 text-glupp-accent shrink-0" />
          <p className="text-xs text-glupp-text-soft">Propose une biere a Glupp ! L&apos;equipe la validera et tu gagneras +10 XP immediatement.</p>
        </div>

        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Nom de la biere *</label>
          <input type="text" value={name} onChange={(e) => { setName(e.target.value); setCheckedDuplicates(false); }} placeholder="Ex: Chouffe Houblon" className={inputClass} />
        </div>

        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Brasserie *</label>
          <input type="text" value={brewery} onChange={(e) => { setBrewery(e.target.value); setCheckedDuplicates(false); }} placeholder="Ex: Brasserie d'Achouffe" className={inputClass} />
        </div>

        <div className="relative">
          <label className="text-xs text-glupp-text-muted block mb-1">Style *</label>
          <button type="button" onClick={() => { setShowStylePicker(!showStylePicker); setShowCountryPicker(false); }} className={`${inputClass} flex items-center justify-between`}>
            <span>{style}</span>
            <ChevronDown size={14} className="text-glupp-text-muted" />
          </button>
          {showStylePicker && (
            <div className="absolute z-50 mt-1 w-full bg-glupp-card border border-glupp-border rounded-glupp shadow-xl max-h-64 overflow-hidden">
              <div className="p-2 border-b border-glupp-border">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-glupp-text-muted" />
                  <input type="text" value={styleSearch} onChange={(e) => setStyleSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-7 pr-2 py-1.5 bg-glupp-bg border border-glupp-border rounded text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent" autoFocus />
                </div>
              </div>
              <div className="overflow-y-auto max-h-48">
                {filteredStyles.map((s) => (
                  <button key={s} type="button" onClick={() => { setStyle(s); setShowStylePicker(false); setStyleSearch(""); }} className={`w-full text-left px-3 py-2 text-sm transition-colors ${style === s ? "bg-glupp-accent/10 text-glupp-accent" : "text-glupp-cream hover:bg-glupp-border/30"}`}>{s}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <label className="text-xs text-glupp-text-muted block mb-1">Pays *</label>
          <button type="button" onClick={() => { setShowCountryPicker(!showCountryPicker); setShowStylePicker(false); }} className={`${inputClass} flex items-center justify-between`}>
            <span><span className="text-lg mr-2">{selectedCountry.flag}</span>{selectedCountry.name}</span>
            <ChevronDown size={14} className="text-glupp-text-muted" />
          </button>
          {showCountryPicker && (
            <div className="absolute z-50 mt-1 w-full bg-glupp-card border border-glupp-border rounded-glupp shadow-xl max-h-64 overflow-hidden">
              <div className="p-2 border-b border-glupp-border">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-glupp-text-muted" />
                  <input type="text" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-7 pr-2 py-1.5 bg-glupp-bg border border-glupp-border rounded text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent" autoFocus />
                </div>
              </div>
              <div className="overflow-y-auto max-h-48">
                {filteredCountries.map((c) => (
                  <button key={c.code} type="button" onClick={() => { setCountryCode(c.code); setShowCountryPicker(false); setCountrySearch(""); setRegion(""); }} className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${countryCode === c.code ? "bg-glupp-accent/10 text-glupp-accent" : "text-glupp-cream hover:bg-glupp-border/30"}`}>
                    <span className="text-lg">{c.flag}</span><span>{c.name}</span><span className="text-xs text-glupp-text-muted ml-auto">{c.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Region (optionnel)</label>
          <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Ex: Vendee, Baviere..." className={inputClass} />
          {regionSuggestions.length > 0 && !region && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {regionSuggestions.slice(0, 8).map((r) => (
                <button key={r} type="button" onClick={() => setRegion(r)} className="px-2.5 py-1 rounded-full bg-glupp-card-alt border border-glupp-border text-xs text-glupp-text-soft hover:border-glupp-accent hover:text-glupp-accent transition-colors">{r}</button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Taux d&apos;alcool (optionnel)</label>
          <div className="relative w-32">
            <input type="number" value={abv} onChange={(e) => setAbv(e.target.value)} placeholder="8.0" step="0.1" min="0" max="30" className={`${inputClass} pr-12`} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-glupp-text-muted">% vol</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Code-barres (optionnel)</label>
          <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Ex: 5411551080222" className={inputClass} />
        </div>

        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Commentaire / Notes (optionnel)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Un detail a nous preciser sur cette biere ?" rows={2} className={`${inputClass} resize-none`} />
        </div>

        <div className="p-3 bg-glupp-accent/10 border border-glupp-accent/20 rounded-glupp">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="text-lg">🍺</span>
              <div>
                <p className="text-sm font-medium text-glupp-cream">Glupper cette biere maintenant</p>
                <p className="text-[10px] text-glupp-text-muted">
                  {wantsToGlupp
                    ? "Le glupp sera valide des que l'equipe aura approuve ta biere"
                    : "Tu pourras la glupper plus tard depuis ta collection"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWantsToGlupp(!wantsToGlupp)}
              className={`relative w-11 h-6 rounded-full transition-colors ${wantsToGlupp ? "bg-glupp-accent" : "bg-glupp-border"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${wantsToGlupp ? "translate-x-[22px]" : "translate-x-0.5"}`} />
            </button>
          </label>
        </div>

        {/* Localisation si glupp activé */}
        {wantsToGlupp && (
          <div className="space-y-2">
            <label className="text-xs text-glupp-text-muted block">📍 Ou es-tu ?</label>
            <div className="flex gap-2">
              {[
                { type: "bar" as LocationType, label: "Dans un bar", icon: "🍻" },
                { type: "onsite" as LocationType, label: "Sur place", icon: "📍" },
              ].map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setLocationType(locationType === opt.type ? null : opt.type)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-glupp border text-xs transition-all ${
                    locationType === opt.type
                      ? "border-glupp-accent bg-glupp-accent/10 text-glupp-cream"
                      : "border-glupp-border bg-glupp-bg text-glupp-text-muted hover:border-glupp-accent/50"
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Sélecteur de bar */}
            {locationType === "bar" && (
              <div className="space-y-2">
                <select
                  value={showNewBar ? "__new__" : selectedBarId || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__new__") { setShowNewBar(true); setSelectedBarId(null); }
                    else if (v === "") { setSelectedBarId(null); setShowNewBar(false); }
                    else { setSelectedBarId(v); setShowNewBar(false); }
                  }}
                  className="w-full px-3 py-2 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream appearance-none focus:outline-none focus:border-glupp-accent"
                >
                  <option value="">-- Choisir un bar --</option>
                  {bars.map((bar) => (
                    <option key={bar.id} value={bar.id}>{bar.name}{bar.city ? ` (${bar.city})` : ""}</option>
                  ))}
                  <option value="__new__">+ Ajouter un bar</option>
                </select>
                {showNewBar && (
                  <div className="space-y-2">
                    <input type="text" value={newBarName} onChange={(e) => setNewBarName(e.target.value)} placeholder="Nom du bar" className="w-full px-3 py-2 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent" />
                    <input type="text" value={newBarCity} onChange={(e) => setNewBarCity(e.target.value)} placeholder="Ville" className="w-full px-3 py-2 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent" />
                  </div>
                )}
              </div>
            )}

            {/* Sur place — lieu libre */}
            {locationType === "onsite" && (
              <input
                type="text"
                value={onsiteLabel || geoCity || ""}
                onChange={(e) => setOnsiteLabel(e.target.value)}
                placeholder="Chez un pote, festival, maison... (optionnel)"
                className="w-full px-3 py-2 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent"
              />
            )}

            {/* Indicateur GPS */}
            {locationType && (
              <div className="flex items-center gap-2 px-3 py-1.5 text-[10px]">
                <MapPin size={12} className={geoLat ? "text-glupp-success" : geoLoading ? "text-glupp-accent animate-pulse" : "text-glupp-text-muted"} />
                {geoLoading ? (
                  <span className="text-glupp-text-muted">Localisation en cours...</span>
                ) : geoLat ? (
                  <span className="text-glupp-success">Position enregistree {geoCity && `(${geoCity})`} — +20 XP</span>
                ) : geoError ? (
                  <span className="text-glupp-text-muted">{geoError}</span>
                ) : null}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">
            Photo {wantsToGlupp ? (<span className="text-glupp-error font-medium">(obligatoire pour glupper)</span>) : "(optionnel)"}
          </label>
          {photoPreview ? (
            <div className="relative inline-block">
              <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-glupp object-cover border border-glupp-border" />
              <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center">
                <X size={12} className="text-white" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 px-3 py-2.5 bg-glupp-bg border border-glupp-border border-dashed rounded-glupp cursor-pointer hover:border-glupp-accent transition-colors">
              <Camera size={16} className="text-glupp-text-muted" />
              <span className="text-sm text-glupp-text-muted">Prendre une photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          )}
        </div>

        {error && <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-glupp">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button variant="ghost" className="flex-1" onClick={handleClose}>Annuler</Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit} disabled={adding || !name.trim() || !brewery.trim() || (wantsToGlupp && !photoFile)}>
            {adding ? (<Loader2 size={14} className="animate-spin" />) : (<><Send size={14} className="mr-1.5" />{wantsToGlupp ? "Proposer et Glupper !" : "Proposer a Glupp"}</>)}
          </Button>
        </div>
        <p className="text-center text-xs text-glupp-text-muted pb-2">
          {wantsToGlupp ? "+10 XP proposition · Glupp auto a la validation" : "+10 XP immediatement · +25 XP quand validee"}
        </p>
      </div>
    </Modal>
  );
}
