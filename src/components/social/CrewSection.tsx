"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCrews } from "@/lib/hooks/useCrews";
import { useAppStore } from "@/lib/store/useAppStore";
import { formatNumber } from "@/lib/utils/xp";
import { CreateCrewModal } from "./CreateCrewModal";
import {
  Users,
  Plus,
  Trophy,
  Crown,
  Zap,
  Mail,
  Check,
  X,
  LogOut,
  Loader2,
  UserPlus,
} from "lucide-react";

// ═══════════════════════════════════════════
// Crew Levels
// ═══════════════════════════════════════════

const CREW_LEVELS = [
  { level: 1, name: "Bande de potes", min: 0 },
  { level: 2, name: "Confrerie", min: 500 },
  { level: 3, name: "Guilde", min: 2000 },
  { level: 4, name: "Ordre Sacre", min: 5000 },
  { level: 5, name: "Legende", min: 10000 },
];

function getCrewLevel(xp: number) {
  for (let i = CREW_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= CREW_LEVELS[i].min) return CREW_LEVELS[i];
  }
  return CREW_LEVELS[0];
}

function getCrewNextLevel(xp: number) {
  const current = getCrewLevel(xp);
  const idx = CREW_LEVELS.findIndex((l) => l.level === current.level);
  return idx < CREW_LEVELS.length - 1 ? CREW_LEVELS[idx + 1] : null;
}

function getCrewProgress(xp: number) {
  const current = getCrewLevel(xp);
  const next = getCrewNextLevel(xp);
  if (!next) return 100;
  return Math.round(((xp - current.min) / (next.min - current.min)) * 100);
}

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

export function CrewSection() {
  const {
    crews,
    isLoading,
    invites,
    loadingInvites,
    acceptInvite,
    acceptingInvite,
    declineInvite,
    decliningInvite,
    leaveCrew,
    leavingCrew,
  } = useCrews();
  const openUserProfileModal = useAppStore((s) => s.openUserProfileModal);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [leavingCrewId, setLeavingCrewId] = useState<string | null>(null);
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="px-4 space-y-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    );
  }

  const handleAcceptInvite = async (crewId: string) => {
    setProcessingInviteId(crewId);
    try {
      await acceptInvite(crewId);
    } catch (err) {
      console.error("Accept invite error:", err);
    } finally {
      setProcessingInviteId(null);
    }
  };

  const handleDeclineInvite = async (crewId: string) => {
    setProcessingInviteId(crewId);
    try {
      await declineInvite(crewId);
    } catch (err) {
      console.error("Decline invite error:", err);
    } finally {
      setProcessingInviteId(null);
    }
  };

  const handleLeaveCrew = async (crewId: string, crewName: string) => {
    if (!window.confirm(`Quitter "${crewName}" ? Tu pourras etre reinvite plus tard.`)) return;
    setLeavingCrewId(crewId);
    try {
      await leaveCrew(crewId);
    } catch (err) {
      console.error("Leave crew error:", err);
    } finally {
      setLeavingCrewId(null);
    }
  };

  return (
    <>
      <div className="space-y-4 px-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-glupp-text-soft uppercase tracking-wider">
            Tes Crews
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-glupp-accent text-glupp-bg rounded-full text-xs font-medium hover:bg-glupp-accent/90 transition-colors"
          >
            <Plus size={14} />
            Creer
          </button>
        </div>

        {/* ═══ Pending invites ═══ */}
        {invites.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-glupp-accent">
              <Mail size={14} />
              <span>
                {invites.length} invitation{invites.length > 1 ? "s" : ""} en attente
              </span>
            </div>

            {invites.map((invite) => {
              const isProcessing = processingInviteId === invite.crew_id;
              return (
                <motion.div
                  key={invite.crew_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-glupp-accent/5 border border-glupp-accent/20 rounded-glupp-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold text-glupp-cream text-sm truncate">
                        {invite.crew_name}
                      </p>
                      <p className="text-[10px] text-glupp-text-muted mt-0.5">
                        Invite par @{invite.invited_by_username} · {invite.member_count} membre{invite.member_count > 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleAcceptInvite(invite.crew_id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1 px-3 py-1.5 bg-glupp-accent text-glupp-bg rounded-glupp text-xs font-semibold hover:bg-glupp-accent/90 disabled:opacity-50 transition-colors"
                      >
                        {isProcessing && acceptingInvite ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                        Rejoindre
                      </button>
                      <button
                        onClick={() => handleDeclineInvite(invite.crew_id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-glupp-card border border-glupp-border rounded-glupp text-xs text-glupp-text-muted hover:text-glupp-cream hover:border-glupp-text-muted disabled:opacity-50 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ═══ Crews list ═══ */}
        {crews.length === 0 && invites.length === 0 ? (
          <div className="text-center py-10">
            <Users className="w-10 h-10 text-glupp-text-muted mx-auto mb-3" />
            <p className="text-sm text-glupp-text-muted">
              Pas encore de crew
            </p>
            <p className="text-xs text-glupp-text-muted mt-1">
              Cree un crew avec tes amis pour gagner de l&apos;XP ensemble !
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-glupp-accent text-glupp-bg rounded-full text-sm font-semibold hover:bg-glupp-accent/90 transition-colors"
            >
              <Plus size={16} />
              Creer mon premier crew
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {crews.map((crew, i) => {
              const crewLevel = getCrewLevel(crew.xp);
              const crewNext = getCrewNextLevel(crew.xp);
              const crewProgress = getCrewProgress(crew.xp);
              const isLeaving = leavingCrewId === crew.id;

              return (
                <motion.div
                  key={crew.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 bg-glupp-card border border-glupp-border rounded-glupp-lg space-y-3"
                >
                  {/* Crew header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="font-display font-bold text-glupp-cream truncate">
                        {crew.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-glupp-accent font-medium">
                          {crewLevel.name}
                        </span>
                        <span className="text-[10px] text-glupp-text-muted">
                          Nv.{crewLevel.level}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 px-2 py-1 bg-glupp-accent/10 rounded-full">
                        <Zap size={12} className="text-glupp-accent" />
                        <span className="text-xs font-bold text-glupp-accent">
                          {formatNumber(crew.xp)} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* XP Progress */}
                  {crewNext && (
                    <ProgressBar
                      value={crewProgress}
                      height={4}
                      color="#E08840"
                      subLabel={`${formatNumber(crew.xp)} / ${formatNumber(crewNext.min)}`}
                    />
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Trophy size={12} className="text-glupp-gold" />
                      <span className="text-xs text-glupp-text-muted">
                        {crew.glupps_together} glupps
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={12} className="text-glupp-text-muted" />
                      <span className="text-xs text-glupp-text-muted">
                        {crew.member_count || crew.members?.length || 0}{" "}
                        membres
                      </span>
                    </div>
                  </div>

                  {/* Members */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {(crew.members || []).slice(0, 6).map((member) => (
                      <button
                        key={member.user_id}
                        onClick={() =>
                          openUserProfileModal(member.user_id)
                        }
                        className="relative"
                        title={
                          member.profile.display_name ||
                          member.profile.username
                        }
                      >
                        <Avatar
                          url={member.profile.avatar_url}
                          name={
                            member.profile.display_name ||
                            member.profile.username
                          }
                          size="sm"
                        />
                        {member.role === "admin" && (
                          <Crown
                            size={8}
                            className="absolute -top-0.5 -right-0.5 text-glupp-gold"
                          />
                        )}
                      </button>
                    ))}
                    {(crew.members || []).length > 6 && (
                      <div className="w-8 h-8 rounded-full bg-glupp-card-alt border border-glupp-border flex items-center justify-center">
                        <span className="text-[10px] text-glupp-text-muted font-medium">
                          +{(crew.members || []).length - 6}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-glupp-border/50">
                    <button
                      onClick={() => handleLeaveCrew(crew.id, crew.name)}
                      disabled={isLeaving}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-glupp-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-glupp transition-colors disabled:opacity-50"
                    >
                      {isLeaving ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <LogOut size={12} />
                      )}
                      Quitter
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <CreateCrewModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
