"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Share2, Copy, Check, Loader2 } from "lucide-react";

interface InviteButtonProps {
  userId: string;
  variant?: "primary" | "compact";
  className?: string;
}

export function InviteButton({ userId, variant = "primary", className = "" }: InviteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleInvite = async () => {
    setLoading(true);
    try {
      // Générer ou récupérer le code
      const { data: code, error } = await supabase.rpc("get_or_create_referral_code", {
        p_user_id: userId,
      });

      if (error) throw error;

      const inviteUrl = `https://glupp.fr/invite/${code}`;
      const shareText = "Rejoins-moi sur Glupp ! Collectionne des bieres, defie tes potes et gagne de l'XP. 🍻";

      // Essayer le Web Share API (natif sur mobile)
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Glupp - Invitation",
            text: shareText,
            url: inviteUrl,
          });
          return;
        } catch (shareError) {
          // L'utilisateur a annulé ou le share a échoué — fallback copie
          if ((shareError as Error).name === "AbortError") return;
        }
      }

      // Fallback : copier dans le presse-papier
      await navigator.clipboard.writeText(`${shareText}\n${inviteUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Erreur invitation:", err);
    } finally {
      setLoading(false);
    }
  };

  if (variant === "compact") {
    return (
      <button
        onClick={handleInvite}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          copied
            ? "bg-green-500/15 text-green-400"
            : "bg-glupp-accent/10 text-glupp-accent hover:bg-glupp-accent/20"
        } disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : copied ? (
          <Check size={12} />
        ) : (
          <Share2 size={12} />
        )}
        {copied ? "Lien copie !" : "Inviter"}
      </button>
    );
  }

  return (
    <button
      onClick={handleInvite}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
        copied
          ? "bg-green-500/15 border border-green-500/30 text-green-400"
          : "bg-glupp-accent/10 border border-glupp-accent/30 text-glupp-accent hover:bg-glupp-accent/15"
      } disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : copied ? (
        <>
          <Check size={16} />
          Lien copie !
        </>
      ) : (
        <>
          <Share2 size={16} />
          Inviter un ami (+50 XP)
        </>
      )}
    </button>
  );
}
