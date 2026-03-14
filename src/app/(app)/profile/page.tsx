"use client";

import { useState } from "react";
import Link from "next/link"; // 👈 Import de Link ajouté
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile } from "@/lib/hooks/useProfile";
import { useCollection } from "@/lib/hooks/useCollection";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { ProgressionTree } from "@/components/gamification/ProgressionTree";
import { TrophyGrid } from "@/components/social/TrophyGrid";
import { FriendList } from "@/components/social/FriendList";
import { FriendSearchModal } from "@/components/social/FriendSearchModal";
import { CrewSection } from "@/components/social/CrewSection";
import { SettingsModal } from "@/components/global/SettingsModal";
import { FeedbackModal } from "@/components/settings/FeedbackModal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Swords,
  Beer,
  Camera,
  LogOut,
  ChevronDown,
  ChevronUp,
  Trophy,
  Users,
  Shield,
  Globe,
  Settings,
  MessageSquarePlus,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/xp";

type Section = "progression" | "trophies" | "friends" | "crews" | "passport";

export default function ProfilePage() {
  const { signOut } = useAuth();
  const { profile, loading, level, nextLevel, progress } = useProfile();
  const { allBeers, tastedIds } = useCollection();
  const [openSections, setOpenSections] = useState<Set<Section>>(new Set());
  
  // États pour les modales
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const toggleSection = (section: Section) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

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
        <p className="text-5xl">:(</p>
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

  // Beer passport data
  const passportData = (() => {
    const byCountry = new Map<string, { code: string; country: string; total: number; tasted: number }>();
    for (const b of allBeers) {
      const entry = byCountry.get(b.country_code) || {
        code: b.country_code,
        country: b.country,
        total: 0,
        tasted: 0,
      };
      entry.total++;
      if (tastedIds.has(b.id)) entry.tasted++;
      byCountry.set(b.country_code, entry);
    }
    return Array.from(byCountry.values()).sort((a, b) => b.total - a.total);
  })();

  const FLAG_MAP: Record<string, string> = {
    FR: "\u{1F1EB}\u{1F1F7}", BE: "\u{1F1E7}\u{1F1EA}", DE: "\u{1F1E9}\u{1F1EA}",
    US: "\u{1F1FA}\u{1F1F8}", GB: "\u{1F1EC}\u{1F1E7}", IE: "\u{1F1EE}\u{1F1EA}",
    NL: "\u{1F1F3}\u{1F1F1}", CZ: "\u{1F1E8}\u{1F1FF}", JP: "\u{1F1EF}\u{1F1F5}",
    MX: "\u{1F1F2}\u{1F1FD}", ES: "\u{1F1EA}\u{1F1F8}", IT: "\u{1F1EE}\u{1F1F9}",
    NO: "\u{1F1F3}\u{1F1F4}", DK: "\u{1F1E9}\u{1F1F0}", AU: "\u{1F1E6}\u{1F1FA}",
  };

  return (
    <div className="py-6 px-4 space-y-6 pb-24">
      {/* Header avec titre et bouton Paramètres */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-glupp-cream">
          Mon Profil
        </h1>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-glupp-text-muted hover:text-glupp-cream hover:bg-glupp-card rounded-full transition-colors"
        >
          <Settings size={24} />
        </button>
      </div>

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

      {/* Bouton Feedback */}
      <div>
        <Button 
          variant="secondary" 
          className="w-full flex items-center justify-center gap-2 border border-glupp-border text-glupp-text-muted hover:text-glupp-cream hover:bg-glupp-card-alt"
          onClick={() => setIsFeedbackOpen(true)}
        >
          <MessageSquarePlus size={18} />
          Donner mon avis / Signaler un bug
        </Button>
      </div>

      {/* Progression — collapsible */}
      <CollapsibleSection
        title="Progression"
        icon={<ChevronDown size={16} />}
        isOpen={openSections.has("progression")}
        onToggle={() => toggleSection("progression")}
      >
        <ProgressionTree xp={profile.xp} />
      </CollapsibleSection>

      {/* Trophies — collapsible */}
      <CollapsibleSection
        title="Trophees"
        icon={<Trophy size={16} className="text-glupp-gold" />}
        isOpen={openSections.has("trophies")}
        onToggle={() => toggleSection("trophies")}
      >
        <TrophyGrid />
      </CollapsibleSection>

      {/* Friends — collapsible */}
      <CollapsibleSection
        title="Mes Amis"
        icon={<Users size={16} className="text-glupp-accent" />}
        isOpen={openSections.has("friends")}
        onToggle={() => toggleSection("friends")}
      >
        <FriendList />
      </CollapsibleSection>

      {/* Crews — collapsible */}
      <CollapsibleSection
        title="Mes Crews"
        icon={<Shield size={16} className="text-glupp-rare" />}
        isOpen={openSections.has("crews")}
        onToggle={() => toggleSection("crews")}
      >
        <CrewSection />
      </CollapsibleSection>

      {/* Beer Passport — collapsible */}
      <CollapsibleSection
        title="Beer Passport"
        icon={<Globe size={16} className="text-glupp-success" />}
        isOpen={openSections.has("passport")}
        onToggle={() => toggleSection("passport")}
      >
        <div className="space-y-2">
          {passportData.map((entry) => {
            const pct = entry.total > 0 ? Math.round((entry.tasted / entry.total) * 100) : 0;
            return (
              <div key={entry.code} className="flex items-center gap-3">
                <span className="text-lg shrink-0">
                  {FLAG_MAP[entry.code] || "\u{1F30D}"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-0.5">
                    <span className="text-xs font-medium text-glupp-cream truncate">
                      {entry.country}
                    </span>
                    <span className="text-[10px] text-glupp-text-muted shrink-0">
                      {entry.tasted}/{entry.total}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-glupp-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-glupp-accent rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {passportData.length === 0 && (
            <p className="text-xs text-glupp-text-muted text-center py-4">
              Gluppe des bieres pour remplir ton passport !
            </p>
          )}
        </div>
      </CollapsibleSection>

      {/* 🆕 Section Légale & Footer Profil */}
      <div className="mt-8 pt-6 border-t border-glupp-border flex flex-col items-center space-y-4">
        <p className="text-xs text-glupp-text-muted text-center px-4 leading-relaxed">
          L'abus d'alcool est dangereux pour la santé, à consommer avec modération.
        </p>
        
        <div className="flex items-center justify-center gap-2 text-xs text-glupp-text-muted flex-wrap">
          <Link href="/legal/terms" className="hover:text-glupp-accent underline transition-colors">CGU</Link>
          <span>·</span>
          <Link href="/legal/privacy" className="hover:text-glupp-accent underline transition-colors">Confidentialité</Link>
          <span>·</span>
          <Link href="/legal" className="hover:text-glupp-accent underline transition-colors">Mentions légales</Link>
        </div>
        
        <p className="text-[10px] text-glupp-text-muted font-mono mt-1">
          Glupp v1.0 · Réservé aux personnes majeures
        </p>

        {/* Bouton de déconnexion */}
        <Button
          variant="ghost"
          className="text-glupp-error hover:bg-glupp-error/10 w-full mt-2"
          onClick={signOut}
        >
          <LogOut size={16} className="mr-2" />
          Se déconnecter
        </Button>
      </div>

      {/* Friend Search Modal */}
      <FriendSearchModal />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUsername={profile.username}
        currentAvatarUrl={profile.avatar_url}
        userId={profile.id}
      />

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />
    </div>
  );
}

/* ─── Collapsible Section ─── */
function CollapsibleSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2 text-sm font-semibold text-glupp-cream"
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        {isOpen ? (
          <ChevronUp size={18} className="text-glupp-text-muted" />
        ) : (
          <ChevronDown size={18} className="text-glupp-text-muted" />
        )}
      </button>
      {isOpen && <div className="pb-2">{children}</div>}
    </div>
  );
}