import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase/client"; // 🆕 Import corrigé

export interface AvatarData {
  id: string;
  name: string;
  emoji: string;
  description: string;
  file_name: string;
  unlock_type: 'free' | 'level' | 'trophy';
  unlock_value: string | null;
  sort_order: number;
  isUnlocked?: boolean;
  unlockHint?: string;
}

const XP_LEVELS = [
  { level: 1, min: 0 },
  { level: 2, min: 300 },
  { level: 3, min: 1000 },
  { level: 4, min: 2500 },
  { level: 5, min: 5000 },
  { level: 6, min: 10000 },
  { level: 7, min: 20000 },
];

export function getLevel(xp: number): number {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].min) return XP_LEVELS[i].level;
  }
  return 1;
}

export function useAvatars(userId: string | undefined, userXp: number = 0) {
  const [avatars, setAvatars] = useState<AvatarData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAvatarsAndStatus() {
      if (!userId) return;
      setLoading(true);

      try {
        // 1. Récupérer tous les avatars
        const { data: allAvatars, error: avatarsError } = await supabase
          .from('avatars')
          .select('*')
          .order('sort_order', { ascending: true });

        if (avatarsError) throw avatarsError;

        // 2. Récupérer les trophées débloqués de l'utilisateur
        const { data: userTrophies, error: trophiesError } = await supabase
          .from('user_trophies')
          .select('trophy_id')
          .eq('user_id', userId)
          .eq('completed', true);

        if (trophiesError) throw trophiesError;

        const unlockedTrophyIds = userTrophies.map(t => t.trophy_id);
        const currentLevel = getLevel(userXp);

        // 3. Calculer le statut de chaque avatar
        const processedAvatars = allAvatars.map((avatar) => {
          let isUnlocked = false;
          let unlockHint = '';

          if (avatar.unlock_type === 'free') {
            isUnlocked = true;
          } else if (avatar.unlock_type === 'level') {
            const requiredLevel = parseInt(avatar.unlock_value || '0', 10);
            isUnlocked = currentLevel >= requiredLevel;
            unlockHint = `Niveau ${requiredLevel}`;
          } else if (avatar.unlock_type === 'trophy') {
            isUnlocked = unlockedTrophyIds.includes(avatar.unlock_value);
            // Ici, vous pourriez mapper 'unlock_value' vers un nom de trophée plus lisible
            unlockHint = `Trophée requis`; 
          }

          return { ...avatar, isUnlocked, unlockHint };
        });

        setAvatars(processedAvatars);
      } catch (error) {
        console.error("Erreur lors de la récupération des avatars:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAvatarsAndStatus();
  }, [userId, userXp]); // 🆕 Retrait de supabase des dépendances (il est importé statiquement)

  return { avatars, loading };
}