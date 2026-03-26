"use client";

import { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { useCrewEvents, type CrewEvent, type EventResponse } from "@/lib/hooks/useCrewEvents";
import {
  Camera,
  X,
  Check,
  Loader2,
  Users,
  Zap,
} from "lucide-react";

interface CheckinEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CrewEvent;
  crewId: string;
  crewMembers: Array<{
    user_id: string;
    profile: { username: string; display_name: string; avatar_url: string | null };
  }>;
}

export function CheckinEventModal({
  isOpen,
  onClose,
  event,
  crewId,
  crewMembers,
}: CheckinEventModalProps) {
  const { checkinEvent, checkingIn } = useCrewEvents(crewId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [taggedIds, setTaggedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

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

  const toggleTag = (userId: string) => {
    setTaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!photoFile) {
      setError("Une photo est obligatoire pour valider la sortie");
      return;
    }
    setError(null);
    try {
      await checkinEvent(event.id, photoFile, Array.from(taggedIds));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleClose = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setTaggedIds(new Set());
    setError(null);
    onClose();
  };

  const xpPreview = 20 + taggedIds.size * 0; // L'user qui checkin gagne 20, les tagués gagnent 10 chacun côté serveur

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Valider la sortie">
      <div className="space-y-4 pb-2">
        {/* Event reminder */}
        <div className="px-3 py-2 bg-glupp-accent/10 border border-glupp-accent/20 rounded-glupp">
          <p className="text-sm font-semibold text-glupp-cream">{event.title}</p>
          {(event.bar_name || event.location) && (
            <p className="text-[10px] text-glupp-accent mt-0.5">{event.bar_name || event.location}</p>
          )}
        </div>

        {/* Photo */}
        <div>
          <label className="flex items-center justify-between text-sm text-glupp-text-soft mb-2">
            <span>
              <Camera size={14} className="inline mr-1.5" />
              Photo de groupe
              <span className="ml-1.5 text-[10px] text-glupp-error font-medium uppercase">obligatoire</span>
            </span>
            <span className="text-[10px] text-glupp-accent font-medium">+20 XP</span>
          </label>

          {photoPreview ? (
            <div className="relative">
              <img src={photoPreview} alt="Photo de groupe" className="w-full h-40 object-cover rounded-glupp" />
              <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors">
                <X size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 py-4 px-4 border border-dashed border-glupp-border rounded-glupp text-glupp-text-muted hover:border-glupp-accent hover:text-glupp-accent transition-colors">
              <Camera size={24} />
              <div className="text-left">
                <p className="text-sm">Prendre une photo de groupe</p>
                <p className="text-[10px] opacity-60">Immortalisez ce moment entre Gluppeurs !</p>
              </div>
            </button>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
        </div>

        {/* Tag members */}
        <div>
          <label className="flex items-center gap-1.5 text-sm text-glupp-text-soft mb-2">
            <Users size={14} />
            Qui est present ? ({taggedIds.size} tagues)
            <span className="text-[10px] text-glupp-accent font-medium ml-auto">+10 XP chacun</span>
          </label>

          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {crewMembers.map((member) => {
              const isTagged = taggedIds.has(member.user_id);
              return (
                <button
                  key={member.user_id}
                  onClick={() => toggleTag(member.user_id)}
                  className={`w-full flex items-center gap-2.5 p-2 rounded-glupp border transition-all text-left ${
                    isTagged
                      ? "bg-glupp-accent/10 border-glupp-accent/40"
                      : "bg-glupp-card border-glupp-border hover:border-glupp-accent/20"
                  }`}
                >
                  <Avatar url={member.profile.avatar_url} name={member.profile.display_name || member.profile.username} size="sm" />
                  <span className="flex-1 text-xs font-medium text-glupp-cream truncate">
                    {member.profile.display_name || member.profile.username}
                  </span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    isTagged ? "bg-glupp-accent border-glupp-accent" : "border-glupp-border"
                  }`}>
                    {isTagged && <Check size={12} className="text-glupp-bg" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* XP Preview */}
        <div className="flex items-center justify-between px-3 py-2 bg-glupp-gold/10 rounded-glupp">
          <span className="text-xs text-glupp-gold flex items-center gap-1">
            <Zap size={12} /> XP gagnes
          </span>
          <span className="text-sm font-bold text-glupp-gold">+{xpPreview} XP</span>
        </div>

        {/* Error */}
        {error && <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-glupp">{error}</p>}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!photoFile || checkingIn}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-glupp-lg font-semibold text-sm transition-all ${
            photoFile && !checkingIn
              ? "bg-glupp-accent text-glupp-bg hover:bg-glupp-accent/90 active:scale-[0.98]"
              : "bg-glupp-card-alt text-glupp-text-muted cursor-not-allowed"
          }`}
        >
          {checkingIn ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Camera size={16} />
          )}
          {checkingIn ? "Publication..." : "Valider et publier sur le feed"}
        </button>
      </div>
    </Modal>
  );
}
