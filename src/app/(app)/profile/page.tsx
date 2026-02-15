"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile } from "@/lib/hooks/useProfile";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { ProgressionTree } from "@/components/gamification/ProgressionTree";
import { Skeleton } from "@/components/ui/Skeleton";
import { Swords, Beer, Camera, LogOut, ChevronDown, ChevronUp } from "lucide-react";
import { formatNumber } from "@/lib/utils/xp";

export default function ProfilePage() {
  const { signOut } = useAuth();
  const { profile, loading, level, nextLevel, progress } = useProfile();
  const [showProgression, setShowProgression] = useState(false);

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-20 h-20 rounded-full" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-16 px-4 text-center space-y-4">
        <p className="text-5xl">😕</p>
        <h2 className="font-display text-lg font-bold text-glupp-cream">
          Profil introuvable
        </h2>
        <p className="text-sm text-glupp-text-muted">
          Ton profil n&apos;a pas pu etre charge. Verifie que la base de donnees est configuree.
        </p>
        <Button
          variant="ghost"
          className="text-glupp-error"
          onClick={signOut}
        >
          <LogOut size={16} className="mr-2" />
          Se deconnecter
        </Button>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 space-y-6 pb-24">
      {/* Avatar + Info */}
      <div className="flex flex-col items-center text-center">
        <Avatar
          url={profile.avatar_url}
          name={profile.display_name || profile.username}
          size="lg"
        />
        <h2 className="font-display text-lg font-bold text-glupp-cream mt-3">
          {profile.display_name || profile.username}
        </h2>
        <p className="text-sm text-glupp-text-muted">@{profile.username}</p>

        {/* Level */}
        <div className="mt-2">
          <LevelBadge xp={profile.xp} />
        </div>
      </div>

      {/* XP Progress — enhanced */}
      <div className="bg-glupp-card rounded-glupp-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-glupp-cream">
            {level.icon} {level.title}
          </span>
          <span className="text-xs text-glupp-text-muted">
            {formatNumber(profile.xp)} XP
          </span>
        </div>
        <ProgressBar
          value={progress}
          label=""
          subLabel={
            nextLevel
              ? `${formatNumber(profile.xp)} / ${formatNumber(nextLevel.min)} XP pour le prochain niveau`
              : "Niveau maximum atteint !"
          }
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <Swords size={20} className="mx-auto text-glupp-accent mb-1" />
          <p className="font-display text-xl font-bold text-glupp-cream">
            {profile.duels_played}
          </p>
          <p className="text-[10px] text-glupp-text-muted">Duels</p>
        </Card>
        <Card className="p-4 text-center">
          <Beer size={20} className="mx-auto text-glupp-gold mb-1" />
          <p className="font-display text-xl font-bold text-glupp-cream">
            {profile.beers_tasted}
          </p>
          <p className="text-[10px] text-glupp-text-muted">Bieres</p>
        </Card>
        <Card className="p-4 text-center">
          <Camera size={20} className="mx-auto text-glupp-rare mb-1" />
          <p className="font-display text-xl font-bold text-glupp-cream">
            {profile.photos_taken}
          </p>
          <p className="text-[10px] text-glupp-text-muted">Photos</p>
        </Card>
      </div>

      {/* Progression Tree — collapsible */}
      <div>
        <button
          onClick={() => setShowProgression(!showProgression)}
          className="w-full flex items-center justify-between py-2 text-sm font-semibold text-glupp-cream"
        >
          <span>Progression</span>
          {showProgression ? (
            <ChevronUp size={18} className="text-glupp-text-muted" />
          ) : (
            <ChevronDown size={18} className="text-glupp-text-muted" />
          )}
        </button>
        {showProgression && <ProgressionTree xp={profile.xp} />}
      </div>

      {/* Trophies placeholder */}
      <div className="bg-glupp-card rounded-glupp p-4 text-center">
        <p className="text-sm text-glupp-text-soft mb-1">🏆 Trophees</p>
        <p className="text-xs text-glupp-text-muted">
          Bientot disponible — continue a glupper !
        </p>
      </div>

      {/* Sign Out — small, at the bottom */}
      <div className="pt-8">
        <button
          onClick={signOut}
          className="flex items-center justify-center gap-2 mx-auto text-xs text-glupp-text-muted hover:text-glupp-error transition-colors"
        >
          <LogOut size={14} />
          Se deconnecter
        </button>
      </div>
    </div>
  );
}
