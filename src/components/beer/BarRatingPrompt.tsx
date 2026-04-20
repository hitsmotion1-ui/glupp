"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { StarRating } from "@/components/ui/StarRating";
import { MapPin, Check } from "lucide-react";

interface BarRatingPromptProps {
  barName: string;
  userId: string;
  onDone: (xpBonus: number) => void;
}

export function BarRatingPrompt({ barName, userId, onDone }: BarRatingPromptProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleRate = async (value: number) => {
    setRating(value);
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.rpc("rate_bar", {
        p_user_id: user.id,
        p_bar_name: barName,
        p_rating: value,
      });
      setSaved(true);
      setTimeout(() => {
        onDone(data?.xp_bonus || 0);
      }, 800);
    } catch {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-glupp-success/10 border border-glupp-success/20 rounded-glupp">
        <Check size={14} className="text-glupp-success" />
        <span className="text-xs text-glupp-success">Merci pour ta note !</span>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 bg-glupp-card-alt border border-glupp-border rounded-glupp">
      <div className="flex items-center gap-1.5 mb-2">
        <MapPin size={12} className="text-glupp-accent" />
        <span className="text-xs text-glupp-text-soft font-medium">Note ce bar</span>
        <span className="text-[10px] text-glupp-accent ml-auto">+5 XP</span>
      </div>
      <p className="text-xs text-glupp-text-muted mb-2">{barName}</p>
      <StarRating value={rating} onChange={handleRate} size={24} />
    </div>
  );
}
