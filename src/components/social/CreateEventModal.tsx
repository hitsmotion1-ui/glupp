"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase/client";
import { useCrewEvents } from "@/lib/hooks/useCrewEvents";
import type { Bar } from "@/types";
import {
  CalendarDays,
  MapPin,
  Clock,
  Loader2,
  Send,
  Search,
  ChevronDown,
} from "lucide-react";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  crewId: string;
  crewName: string;
  prefillBarId?: string | null;
  prefillBarName?: string | null;
}

export function CreateEventModal({
  isOpen,
  onClose,
  crewId,
  crewName,
  prefillBarId,
  prefillBarName,
}: CreateEventModalProps) {
  const { createEvent, creatingEvent } = useCrewEvents(crewId);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [locationType, setLocationType] = useState<"bar" | "free">(
    prefillBarId ? "bar" : "bar"
  );
  const [selectedBarId, setSelectedBarId] = useState<string | null>(prefillBarId || null);
  const [selectedBarName, setSelectedBarName] = useState(prefillBarName || "");
  const [freeLocation, setFreeLocation] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Bars list
  const [bars, setBars] = useState<Bar[]>([]);
  const [barsLoading, setBarsLoading] = useState(false);

  // Fetch bars
  useEffect(() => {
    if (!isOpen) return;
    const fetchBars = async () => {
      setBarsLoading(true);
      const { data } = await supabase.from("bars").select("*").order("name");
      if (data) setBars(data as Bar[]);
      setBarsLoading(false);
    };
    fetchBars();
  }, [isOpen]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDate("");
      setTime("19:00");
      setLocationType(prefillBarId ? "bar" : "bar");
      setSelectedBarId(prefillBarId || null);
      setSelectedBarName(prefillBarName || "");
      setFreeLocation("");
      setDescription("");
      setError(null);
    }
  }, [isOpen, prefillBarId, prefillBarName]);

  // Min date = today
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Donne un titre a la sortie");
      return;
    }
    if (!date) {
      setError("Choisis une date");
      return;
    }

    setError(null);

    const eventDate = new Date(`${date}T${time}:00`).toISOString();

    try {
      await createEvent({
        crewId,
        title: title.trim(),
        eventDate,
        barId: locationType === "bar" ? selectedBarId : null,
        barName:
          locationType === "bar"
            ? selectedBarName ||
              bars.find((b) => b.id === selectedBarId)?.name ||
              null
            : null,
        location: locationType === "free" ? freeLocation.trim() || null : null,
        description: description.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const canSubmit = title.trim().length > 0 && date && !creatingEvent;

  const inputClass =
    "w-full px-3 py-2.5 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Planifier une sortie">
      <div className="space-y-4 pb-2">
        {/* Crew context */}
        <div className="flex items-center gap-2 px-3 py-2 bg-glupp-accent/10 border border-glupp-accent/20 rounded-glupp">
          <CalendarDays size={14} className="text-glupp-accent shrink-0" />
          <p className="text-xs text-glupp-accent">
            Tous les membres de <span className="font-semibold">{crewName}</span> seront notifies
          </p>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">
            Titre de la sortie *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Soiree decouverte IPA"
            maxLength={60}
            className={inputClass}
          />
        </div>

        {/* Date + Time */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-glupp-text-muted block mb-1">
              <CalendarDays size={11} className="inline mr-1" />
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              className={inputClass}
            />
          </div>
          <div className="w-28">
            <label className="text-xs text-glupp-text-muted block mb-1">
              <Clock size={11} className="inline mr-1" />
              Heure
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Location type */}
        <div>
          <label className="text-xs text-glupp-text-muted block mb-1.5">
            <MapPin size={11} className="inline mr-1" />
            Lieu
          </label>
          <div className="flex gap-2 mb-2">
            {(
              [
                { type: "bar" as const, label: "Choisir un bar", icon: "🍻" },
                { type: "free" as const, label: "Lieu libre", icon: "📍" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.type}
                onClick={() => setLocationType(opt.type)}
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

          {/* Bar selector */}
          {locationType === "bar" && (
            <div className="relative">
              <select
                value={selectedBarId || ""}
                onChange={(e) => {
                  setSelectedBarId(e.target.value || null);
                  const bar = bars.find((b) => b.id === e.target.value);
                  setSelectedBarName(bar?.name || "");
                }}
                className={`${inputClass} appearance-none`}
              >
                <option value="">-- Choisir un bar --</option>
                {bars.map((bar) => (
                  <option key={bar.id} value={bar.id}>
                    {bar.name}
                    {bar.city ? ` (${bar.city})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-glupp-text-muted pointer-events-none" />
            </div>
          )}

          {/* Free location */}
          {locationType === "free" && (
            <input
              type="text"
              value={freeLocation}
              onChange={(e) => setFreeLocation(e.target.value)}
              placeholder="Ex: Chez moi, Parc de la ville..."
              className={inputClass}
            />
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-glupp-text-muted block mb-1">
            Note (optionnel)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ramenez vos decouvertes !"
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-glupp">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-glupp-lg font-semibold text-sm transition-all ${
            canSubmit
              ? "bg-glupp-accent text-glupp-bg hover:bg-glupp-accent/90 active:scale-[0.98]"
              : "bg-glupp-card-alt text-glupp-text-muted cursor-not-allowed"
          }`}
        >
          {creatingEvent ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {creatingEvent ? "Envoi..." : "Envoyer l'invitation au crew"}
        </button>
      </div>
    </Modal>
  );
}
