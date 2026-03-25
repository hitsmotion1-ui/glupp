"use client";

import { useState, useMemo, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAddBeer, type AddBeerInput, type DuplicateCandidate } from "@/lib/hooks/useAddBeer";
import { useAppStore } from "@/lib/store/useAppStore";
import { BEER_STYLES } from "@/lib/utils/beerDefaults";
import { getRegionSuggestions } from "@/lib/utils/regionSuggestions";
import { beerEmoji } from "@/lib/utils/xp";
import { Beer, Send, CheckCircle, ChevronDown, Search, Loader2, AlertTriangle, Camera, X } from "lucide-react";

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

  // ── Form state ──
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

  // ── Duplicate state ──
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [showDuplicateCheck, setShowDuplicateCheck] = useState(false);
  const [checkedDuplicates, setCheckedDuplicates] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedBeerId, setSubmittedBeerId] = useState<string | null>(null);

  // ── Dropdown states ──
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [styleSearch, setStyleSearch] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  // Reset
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
      setSubmittedBeerId(null);
      setWantsToGlupp(false);
    }
  }, [isOpen, prefillName, prefillBarcode]);

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
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

      if (wantsToGlupp && beer) {
        handleClose();
        setTimeout(() => {
          openGluppModal(beer.id);
        }, 300);
        return;
      }

      setSubmittedBeerId(beer?.id || null);
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
    setSubmittedBeerId(null);
    setWantsToGlupp(false);
    setShowStylePicker(false);
    setShowCountryPicker(false);
    onClose();
  };

  const inputClass = "w-full px-3 py-2.5 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors";

  // ═══ SUCCESS SCREEN ═══
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
          <Button variant="primary" onClick={handleClose}>Compris</Button>
        </div>
      </Modal>
    );
  }

  // ═══ DUPLICATE CHECK SCREEN ═══
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

  // ═══ MAIN FORM ═══
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Proposer une biere">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-glupp-accent/10 border border-glupp-accent/20 rounded-glupp">
          <Beer className="w-5 h-5 text-glupp-accent shrink-0" />
          <p className="text-xs text-glupp-text-soft">Propose une biere a Glupp ! L&apos;equipe la validera et tu gagneras +10 XP immediatement.</p>
        </div>

        {/* ── Nom ── */}
        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Nom de la biere *</label>
          <input type="text" value={name} onChange={(e) => { setName(e.target.value); setCheckedDuplicates(false); }} placeholder="Ex: Chouffe Houblon" className={inputClass} />
        </div>

        {/* ── Brasserie ── */}
        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Brasserie *</label>
          <input type="text" value={brewery} onChange={(e) => { setBrewery(e.target.value); setCheckedDuplicates(false); }} placeholder="Ex: Brasserie d'Achouffe" className={inputClass} />
        </div>

        {/* ── Style ── */}
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
                  <button key={s} type="button" onClick={() => { setStyle(s); setShowStylePicker(false); setStyleSearch(""); }} className={`w-full text-left px-3 py-2 text-sm transition-colors ${style === s ? "bg-glupp-accent/10 text-glupp-accent" : "text-glupp-cream hover:bg-glupp-border/30"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Pays ── */}
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

        {/* ── Région ── */}
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

        {/* ── ABV ── */}
        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Taux d&apos;alcool (optionnel)</label>
          <div className="relative w-32">
            <input type="number" value={abv} onChange={(e) => setAbv(e.target.value)} placeholder="8.0" step="0.1" min="0" max="30" className={`${inputClass} pr-12`} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-glupp-text-muted">% vol</span>
          </div>
        </div>

        {/* ── Code-barres ── */}
        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Code-barres (optionnel)</label>
          <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Ex: 5411551080222" className={inputClass} />
        </div>

        {/* ── Commentaire ── */}
        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">Commentaire / Notes (optionnel)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Un detail a nous preciser sur cette biere ?" rows={2} className={`${inputClass} resize-none`} />
        </div>

        {/* ── Toggle Glupper ── */}
        <div className="p-3 bg-glupp-accent/10 border border-glupp-accent/20 rounded-glupp">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="text-lg">🍺</span>
              <div>
                <p className="text-sm font-medium text-glupp-cream">Glupper cette biere maintenant</p>
                <p className="text-[10px] text-glupp-text-muted">
                  {wantsToGlupp 
                    ? "La photo sera obligatoire pour valider le glupp" 
                    : "Tu pourras la glupper plus tard depuis ta collection"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWantsToGlupp(!wantsToGlupp)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                wantsToGlupp ? "bg-glupp-accent" : "bg-glupp-border"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  wantsToGlupp ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        </div>

        {/* ── Photo ── */}
        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">
            Photo {wantsToGlupp ? (
              <span className="text-glupp-error font-medium">(obligatoire pour glupper)</span>
            ) : "(optionnel)"}
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
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
            </label>
          )}
        </div>

        {/* ── Error ── */}
        {error && <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-glupp">{error}</p>}

        {/* ── Buttons ── */}
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" className="flex-1" onClick={handleClose}>Annuler</Button>
          <Button 
            variant="primary" 
            className="flex-1" 
            onClick={handleSubmit} 
            disabled={adding || !name.trim() || !brewery.trim() || (wantsToGlupp && !photoFile)}
          >
            {adding ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                <Send size={14} className="mr-1.5" />
                {wantsToGlupp ? "Proposer et Glupper !" : "Proposer a Glupp"}
              </>
            )}
          </Button>
        </div>
        <p className="text-center text-xs text-glupp-text-muted pb-2">
          {wantsToGlupp 
            ? "+10 XP proposition · +25 XP validation · +15 XP photo · +20 XP position" 
            : "+10 XP immediatement · +25 XP quand validee"}
        </p>
      </div>
    </Modal>
  );
}
