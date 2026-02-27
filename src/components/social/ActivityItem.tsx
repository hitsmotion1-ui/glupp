"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { RarityBadge } from "@/components/beer/RarityBadge";
import { useAppStore } from "@/lib/store/useAppStore";
import { beerEmoji } from "@/lib/utils/xp";
import { Swords, Trophy, TrendingUp, Camera } from "lucide-react";
import type { ActivityEntry } from "@/lib/hooks/useActivities";
import type { Rarity } from "@/types";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}j`;
  const weeks = Math.floor(days / 7);
  return `${weeks}sem`;
}

function GluppContent({ activity }: { activity: ActivityEntry }) {
  const openBeerModal = useAppStore((s) => s.openBeerModal);
  const meta = activity.metadata as Record<string, unknown>;
  const isReglupp = !!meta.reglupp;
  const xp = (meta.xp as number) || 0;

  return (
    <div className="space-y-1.5">
      <p className="text-sm text-glupp-cream">
        {isReglupp ? "a re-gluppé" : "a gluppé"}{" "}
        {activity.beer_data ? (
          <button
            onClick={() => openBeerModal(activity.beer_data!.id)}
            className="font-semibold text-glupp-accent hover:underline"
          >
            {beerEmoji(activity.beer_data.style)} {activity.beer_data.name}
          </button>
        ) : (
          <span className="font-semibold">une bière</span>
        )}
        {isReglupp && typeof meta.count === "number" && (
          <span className="text-glupp-text-muted"> (×{meta.count})</span>
        )}
      </p>

      {typeof meta.bar === "string" && (
        <p className="text-xs text-glupp-text-muted">
          📍 {meta.bar}
        </p>
      )}

      {activity.tagged_users.length > 0 && (
        <p className="text-xs text-glupp-text-muted">
          avec{" "}
          {activity.tagged_users
            .map((u) => u.display_name || u.username)
            .join(", ")}
        </p>
      )}

      <div className="flex items-center gap-2">
        {activity.beer_data && (
          <RarityBadge rarity={activity.beer_data.rarity as Rarity} />
        )}
        {xp > 0 && (
          <span className="text-xs font-medium text-glupp-accent">
            +{xp} XP
          </span>
        )}
        {activity.photo_url && (
          <Camera size={12} className="text-glupp-rarity-rare" />
        )}
      </div>
    </div>
  );
}

function DuelContent({ activity }: { activity: ActivityEntry }) {
  const openBeerModal = useAppStore((s) => s.openBeerModal);
  const meta = activity.metadata as Record<string, unknown>;
  const xp = (meta.xp as number) || 0;

  return (
    <div className="space-y-1.5">
      <p className="text-sm text-glupp-cream">
        <Swords size={14} className="inline text-glupp-accent mr-1" />
        a choisi{" "}
        {activity.beer_data ? (
          <button
            onClick={() => openBeerModal(activity.beer_data!.id)}
            className="font-semibold text-glupp-accent hover:underline"
          >
            {activity.beer_data.name}
          </button>
        ) : (
          "une bière"
        )}{" "}
        en duel
      </p>
      {xp > 0 && (
        <span className="text-xs font-medium text-glupp-accent">
          +{xp} XP
        </span>
      )}
    </div>
  );
}

function TrophyContent({ activity }: { activity: ActivityEntry }) {
  const meta = activity.metadata as Record<string, unknown>;

  return (
    <div className="space-y-1.5">
      <p className="text-sm text-glupp-cream">
        <Trophy size={14} className="inline text-glupp-gold mr-1" />
        a débloqué le trophée{" "}
        <span className="font-semibold text-glupp-gold">
          {(meta.trophy_name as string) || "un trophée"}
        </span>
      </p>
      {typeof meta.xp === "number" && (
        <span className="text-xs font-medium text-glupp-gold">
          +{meta.xp} XP
        </span>
      )}
    </div>
  );
}

function LevelUpContent({ activity }: { activity: ActivityEntry }) {
  const meta = activity.metadata as Record<string, unknown>;

  return (
    <div className="space-y-1.5">
      <p className="text-sm text-glupp-cream">
        <TrendingUp size={14} className="inline text-glupp-success mr-1" />
        est passé au niveau{" "}
        <span className="font-semibold text-glupp-gold">
          {String(meta.level_name || `Niveau ${Number(meta.level) || "?"}`)}
        </span>{" "}
        {String(meta.level_icon || "")}
      </p>
    </div>
  );
}

export function ActivityItem({
  activity,
  index = 0,
}: {
  activity: ActivityEntry;
  index?: number;
}) {
  const openUserProfileModal = useAppStore((s) => s.openUserProfileModal);

  const content = useMemo(() => {
    switch (activity.activity_type) {
      case "glupp":
        return <GluppContent activity={activity} />;
      case "duel":
        return <DuelContent activity={activity} />;
      case "trophy":
        return <TrophyContent activity={activity} />;
      case "level_up":
        return <LevelUpContent activity={activity} />;
      default:
        return (
          <p className="text-sm text-glupp-text-muted">
            Activité {activity.activity_type}
          </p>
        );
    }
  }, [activity]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.3 }}
      className="p-3 bg-glupp-card border border-glupp-border rounded-glupp"
    >
      <div className="flex gap-3">
        <button onClick={() => openUserProfileModal(activity.user_id)}>
          <Avatar
            url={activity.user_data.avatar_url}
            name={activity.user_data.display_name || activity.user_data.username}
            size="sm"
          />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <button
              onClick={() => openUserProfileModal(activity.user_id)}
              className="font-semibold text-sm text-glupp-cream hover:text-glupp-accent transition-colors truncate"
            >
              {activity.user_data.display_name || activity.user_data.username}
            </button>
            <span className="text-[10px] text-glupp-text-muted shrink-0">
              {timeAgo(activity.created_at)}
            </span>
          </div>
          {content}
        </div>
      </div>
    </motion.div>
  );
}
