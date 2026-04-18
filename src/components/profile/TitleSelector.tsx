"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { getLevel, XP_LEVELS } from "@/lib/utils/xp";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Check, Crown, Trophy, Star } from "lucide-react";
import { motion } from "framer-motion";

interface TitleOption {
  type: "level" | "trophy" | "custom";
  title: string;
  icon: string;
  locked?: boolean;
}

interface TitleSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentXp: number;
  currentTitle: string | null;
  onTitleChanged: () => void;
}

export function TitleSelector({ isOpen, onClose, userId, currentXp, currentTitle, onTitleChanged }: TitleSelectorProps) {
  const queryClient = useQueryClient();
  const [selectedTitle, setSelectedTitle] = useState<string | null>(currentTitle);
  const [saving, setSaving] = useState(false);

  const currentLevel = getLevel(currentXp);

  // Charger les titres de trophées
  const { data: trophyTitles = [] } = useQuery({
    queryKey: ["available-titles", userId],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_available_titles", { p_user_id: userId });
      return (data || []) as Array<{ type: string; title: string; icon: string }>;
    },
    enabled: isOpen,
  });

  // Construire la liste des titres disponibles
  const titles: TitleOption[] = [];

  // Titre par défaut (niveau actuel)
  titles.push({
    type: "level",
    title: currentLevel.title,
    icon: currentLevel.icon,
  });

  // Titres des niveaux débloqués (tous les niveaux <= actuel)
  for (const lvl of XP_LEVELS) {
    if (lvl.level < currentLevel.level && lvl.level > 0) {
      titles.push({
        type: "level",
        title: lvl.title,
        icon: lvl.icon,
      });
    }
  }

  // Titres des trophées
  for (const t of trophyTitles) {
    titles.push({
      type: "trophy",
      title: t.title,
      icon: t.icon,
    });
  }

  const activeTitle = selectedTitle || currentLevel.title;

  const handleSave = async () => {
    setSaving(true);
    try {
      // null = revenir au titre de niveau par défaut
      const titleToSave = selectedTitle === currentLevel.title ? null : selectedTitle;
      const selectedOption = titles.find(t => t.title === selectedTitle);
      const iconToSave = titleToSave ? (selectedOption?.icon || null) : null;
      
      const { error } = await supabase
        .from("profiles")
        .update({ custom_title: titleToSave, custom_title_icon: iconToSave })
        .eq("id", userId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      onTitleChanged();
      onClose();
    } catch (err) {
      console.error("Erreur titre:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choisis ton titre">
      <div className="space-y-4">
        <p className="text-xs text-glupp-text-muted">
          Ton titre s&apos;affiche sous ton nom. Debloque de nouveaux titres en montant de niveau ou en gagnant des trophees.
        </p>

        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
          {titles.map((t, i) => {
            const isActive = activeTitle === t.title;
            return (
              <motion.button
                key={`${t.type}-${t.title}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedTitle(t.title)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-glupp border transition-all text-left ${
                  isActive
                    ? "border-glupp-accent bg-glupp-accent/10"
                    : "border-glupp-border bg-glupp-bg hover:border-glupp-accent/30"
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isActive ? "text-glupp-accent" : "text-glupp-cream"}`}>
                    {t.title}
                  </p>
                  <p className="text-[10px] text-glupp-text-muted">
                    {t.type === "level" ? "Titre de niveau" : "Trophée"}
                  </p>
                </div>
                {isActive && (
                  <Check size={16} className="text-glupp-accent shrink-0" />
                )}
              </motion.button>
            );
          })}
        </div>

        {titles.length === 0 && (
          <div className="text-center py-6">
            <Trophy size={24} className="text-glupp-text-muted mx-auto mb-2" />
            <p className="text-xs text-glupp-text-muted">Debloque des trophees pour obtenir plus de titres !</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSave} loading={saving}>
            Appliquer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
