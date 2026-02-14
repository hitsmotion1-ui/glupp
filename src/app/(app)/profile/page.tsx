"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile } from "@/lib/hooks/useProfile";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Swords, Beer, Camera, LogOut } from "lucide-react";
import { formatNumber } from "@/lib/utils/xp";

export default function ProfilePage() {
  const { signOut } = useAuth();
  const { profile, loading, level, nextLevel, progress } = useProfile();

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
    <div className="py-6 px-4 space-y-6">
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

      {/* XP Progress */}
      <div>
        <ProgressBar
          value={progress}
          label={`${level.icon} ${level.title}`}
          subLabel={
            nextLevel
              ? `${formatNumber(profile.xp)} / ${formatNumber(nextLevel.min)} XP`
              : `${formatNumber(profile.xp)} XP (MAX)`
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

      {/* Sign Out */}
      <div className="pt-4">
        <Button
          variant="ghost"
          className="w-full text-glupp-error"
          onClick={signOut}
        >
          <LogOut size={16} className="mr-2" />
          Se deconnecter
        </Button>
      </div>
    </div>
  );
}
