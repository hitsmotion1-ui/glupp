"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCrews } from "@/lib/hooks/useCrews";
import { useFriends } from "@/lib/hooks/useFriends";
import { useCrewEvents, type CrewEvent } from "@/lib/hooks/useCrewEvents";
import { useAppStore } from "@/lib/store/useAppStore";
import { useProfile } from "@/lib/hooks/useProfile";
import { formatNumber } from "@/lib/utils/xp";
import { getAvatarFileName } from "@/lib/utils/avatarHelper";
import { CreateCrewModal } from "./CreateCrewModal";
import { CreateEventModal } from "./CreateEventModal";
import { CheckinEventModal } from "./CheckinEventModal";
import {
  Users, Plus, Trophy, Crown, Zap, Mail, Check, X, LogOut, Loader2,
  UserMinus, UserPlus, Clock, ChevronDown, ChevronUp, CalendarDays,
  MapPin, HelpCircle, Camera, Info,
} from "lucide-react";

// ═══════════════════════════════════════════
// Crew Levels + Helpers
// ═══════════════════════════════════════════

const CREW_LEVELS = [
  { level: 1, name: "Bande de potes", min: 0 },
  { level: 2, name: "Confrerie", min: 500 },
  { level: 3, name: "Guilde", min: 2000 },
  { level: 4, name: "Ordre Sacre", min: 5000 },
  { level: 5, name: "Legende", min: 10000 },
];

function getCrewLevel(xp: number) {
  for (let i = CREW_LEVELS.length - 1; i >= 0; i--) { if (xp >= CREW_LEVELS[i].min) return CREW_LEVELS[i]; }
  return CREW_LEVELS[0];
}
function getCrewNextLevel(xp: number) {
  const c = getCrewLevel(xp); const idx = CREW_LEVELS.findIndex((l) => l.level === c.level);
  return idx < CREW_LEVELS.length - 1 ? CREW_LEVELS[idx + 1] : null;
}
function getCrewProgress(xp: number) {
  const c = getCrewLevel(xp); const n = getCrewNextLevel(xp);
  if (!n) return 100; return Math.round(((xp - c.min) / (n.min - c.min)) * 100);
}
function formatEventDate(dateStr: string) {
  const d = new Date(dateStr); const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const day = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  let relative = "";
  if (diffDays <= 0) relative = "Aujourd'hui";
  else if (diffDays === 1) relative = "Demain";
  else if (diffDays < 7) relative = `Dans ${diffDays} jours`;
  return { day, time, relative };
}
function isEventToday(dateStr: string) {
  const d = new Date(dateStr); const now = new Date();
  return d.toDateString() === now.toDateString();
}

// Helper pour passer l'avatar illustré au composant Avatar
function MemberAvatar({ profile, size = "sm" as const }: { profile: { avatar_url: string | null; avatar_id?: string | null; display_name: string; username: string }; size?: "sm" | "md" | "lg" }) {
  return (
    <Avatar
      url={profile.avatar_url}
      name={profile.display_name || profile.username}
      fileName={getAvatarFileName(profile.avatar_id)}
      size={size}
    />
  );
}

// ═══════════════════════════════════════════
// Event Card
// ═══════════════════════════════════════════

function EventCard({
  event, crewId, currentUserId, isCrewAdmin, crewMembers, onCheckin,
}: {
  event: CrewEvent; crewId: string; currentUserId: string; isCrewAdmin: boolean;
  crewMembers: Array<{ user_id: string; profile: { username: string; display_name: string; avatar_url: string | null; avatar_id: string | null } }>;
  onCheckin: (event: CrewEvent) => void;
}) {
  const { respondToEvent, responding, cancelEvent, cancelling } = useCrewEvents(crewId);
  const { day, time, relative } = formatEventDate(event.event_date);
  const canCancel = event.created_by === currentUserId || isCrewAdmin;
  const today = isEventToday(event.event_date);
  const hasCheckins = event.checkins && event.checkins.length > 0;
  const alreadyCheckedIn = event.checkins?.some((c) => c.user_id === currentUserId);

  const goingCount = event.responses.filter((r) => r.response === "going").length;
  const maybeCount = event.responses.filter((r) => r.response === "maybe").length;

  const responseButtons: { key: "going" | "maybe" | "not_going"; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
    { key: "going", label: "J'y suis", icon: <Check size={12} />, color: "text-green-400", bg: "bg-green-400/15 border-green-400/30" },
    { key: "maybe", label: "Peut-etre", icon: <HelpCircle size={12} />, color: "text-glupp-gold", bg: "bg-glupp-gold/15 border-glupp-gold/30" },
    { key: "not_going", label: "Pas dispo", icon: <X size={12} />, color: "text-glupp-text-muted", bg: "bg-glupp-border/30 border-glupp-border" },
  ];

  return (
    <div className="p-3 bg-glupp-card-alt border border-glupp-border rounded-glupp space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-glupp-cream truncate">{event.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {(event.bar_name || event.location) && (
              <span className="flex items-center gap-1 text-[10px] text-glupp-accent"><MapPin size={10} /> {event.bar_name || event.location}</span>
            )}
            <span className="flex items-center gap-1 text-[10px] text-glupp-text-muted"><CalendarDays size={10} /> {day} a {time}</span>
          </div>
          {event.creator && (
            <p className="text-[9px] text-glupp-text-muted mt-1">
              Organise par <span className="text-glupp-cream">{event.creator.display_name || event.creator.username}</span>
            </p>
          )}
          {relative && (
            <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-semibold rounded-full ${
              today ? "bg-green-400/15 text-green-400" : "bg-glupp-accent/10 text-glupp-accent"
            }`}>
              {relative}
            </span>
          )}
        </div>
        {canCancel && (
          <button onClick={() => { if (window.confirm("Annuler cette sortie ?")) cancelEvent(event.id); }}
            disabled={cancelling} className="shrink-0 text-[10px] text-glupp-text-muted hover:text-red-400 transition-colors px-1.5 py-0.5">
            {cancelling ? <Loader2 size={10} className="animate-spin" /> : "Annuler"}
          </button>
        )}
      </div>

      {event.description && <p className="text-[11px] text-glupp-text-muted">{event.description}</p>}

      {/* Responses */}
      <div className="flex items-center gap-3 text-[10px]">
        {goingCount > 0 && <span className="flex items-center gap-1 text-green-400"><Check size={10} /> {goingCount}</span>}
        {maybeCount > 0 && <span className="flex items-center gap-1 text-glupp-gold"><HelpCircle size={10} /> {maybeCount}</span>}
        <div className="flex items-center -space-x-1.5 ml-auto">
          {event.responses.filter((r) => r.response === "going").slice(0, 5).map((r) => (
            <div key={r.user_id} className="w-5 h-5 rounded-full border border-glupp-card-alt overflow-hidden"
              title={r.profile.display_name || r.profile.username}>
              <Avatar url={r.profile.avatar_url} name={r.profile.display_name || r.profile.username} size="sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Response buttons — locked after a checkin */}
      {hasCheckins ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-400/10 border border-green-400/30 rounded-glupp">
          <Check size={12} className="text-green-400 shrink-0" />
          <p className="text-[10px] text-green-400">Sortie validee !</p>
        </div>
      ) : (
        <div className="flex gap-1.5">
          {responseButtons.map((btn) => {
            const isSelected = event.my_response === btn.key;
            return (
              <button key={btn.key} onClick={() => respondToEvent(event.id, btn.key)} disabled={responding}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-glupp text-[11px] font-medium border transition-all ${
                  isSelected ? `${btn.bg} ${btn.color}` : "border-glupp-border/50 text-glupp-text-muted hover:border-glupp-accent/30"
                }`}>
                {btn.icon} {btn.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Checkins photos */}
      {event.checkins && event.checkins.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[9px] text-glupp-text-muted uppercase tracking-wider font-semibold flex items-center gap-1">
            <Camera size={9} /> Photos de la sortie ({event.checkins.length})
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {event.checkins.map((c) => (
              <div key={c.id} className="shrink-0 relative">
                <img src={c.photo_url} alt="Photo de groupe" className="w-24 h-24 rounded-glupp object-cover border border-glupp-border" />
                <div className="absolute bottom-1 left-1 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded-full">
                  <span className="text-[8px] text-white">{c.profile.username}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validate button — only on event day + only if going + not already checked in */}
      {event.my_response === "going" && today && !alreadyCheckedIn && (
        <button onClick={() => onCheckin(event)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-400/10 border border-green-400/30 rounded-glupp text-xs font-medium text-green-400 hover:bg-green-400/15 transition-colors">
          <Camera size={14} /> Valider la sortie avec une photo (+20 XP)
        </button>
      )}

      {/* Already checked in message */}
      {alreadyCheckedIn && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-400/10 border border-green-400/30 rounded-glupp">
          <Camera size={12} className="text-green-400 shrink-0" />
          <p className="text-[10px] text-green-400">Tu as deja valide cette sortie</p>
        </div>
      )}

      {/* Info message if going but not today */}
      {event.my_response === "going" && !today && (
        <div className="flex items-center gap-2 px-3 py-2 bg-glupp-card border border-glupp-border/50 rounded-glupp">
          <Info size={12} className="text-glupp-text-muted shrink-0" />
          <p className="text-[10px] text-glupp-text-muted">
            Tu pourras valider la sortie avec une photo de groupe le jour J
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

export function CrewSection() {
  const { crews, isLoading, invites, acceptInvite, acceptingInvite, declineInvite, leaveCrew, kickFromCrew, inviteToCrew } = useCrews();
  const { friends } = useFriends();
  const { profile } = useProfile();
  const openUserProfileModal = useAppStore((s) => s.openUserProfileModal);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [leavingCrewId, setLeavingCrewId] = useState<string | null>(null);
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);
  const [kickingUserId, setKickingUserId] = useState<string | null>(null);
  const [expandedCrewId, setExpandedCrewId] = useState<string | null>(null);
  const [invitingToCrewId, setInvitingToCrewId] = useState<string | null>(null);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [eventModalCrewId, setEventModalCrewId] = useState<string | null>(null);
  const [eventModalCrewName, setEventModalCrewName] = useState("");
  const [checkinEvent, setCheckinEvent] = useState<{ event: CrewEvent; crewId: string; members: any[] } | null>(null);

  const currentUserId = profile?.id || "";

  if (isLoading) {
    return <div className="px-4 space-y-3"><Skeleton className="h-8 w-32" /><Skeleton className="h-36" /></div>;
  }

  const handleAcceptInvite = async (crewId: string) => {
    setProcessingInviteId(crewId); try { await acceptInvite(crewId); } catch {} finally { setProcessingInviteId(null); }
  };
  const handleDeclineInvite = async (crewId: string) => {
    setProcessingInviteId(crewId); try { await declineInvite(crewId); } catch {} finally { setProcessingInviteId(null); }
  };
  const handleLeaveCrew = async (crewId: string, crewName: string) => {
    if (!window.confirm(`Quitter "${crewName}" ?`)) return;
    setLeavingCrewId(crewId); try { await leaveCrew(crewId); } catch {} finally { setLeavingCrewId(null); }
  };
  const handleKick = async (crewId: string, userId: string, username: string, isPending: boolean) => {
    if (!window.confirm(`${isPending ? "Annuler l'invitation de" : "Retirer"} @${username} ?`)) return;
    setKickingUserId(userId); try { await kickFromCrew(crewId, userId); } catch {} finally { setKickingUserId(null); }
  };

  return (
    <>
      <div className="space-y-4 px-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-glupp-text-soft uppercase tracking-wider">Tes Crews</h3>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-glupp-accent text-glupp-bg rounded-full text-xs font-medium hover:bg-glupp-accent/90 transition-colors">
            <Plus size={14} /> Creer
          </button>
        </div>

        {/* Invites */}
        {invites.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-glupp-accent"><Mail size={14} /> {invites.length} invitation{invites.length > 1 ? "s" : ""} en attente</div>
            {invites.map((inv) => {
              const isP = processingInviteId === inv.crew_id;
              return (
                <motion.div key={inv.crew_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-glupp-accent/5 border border-glupp-accent/20 rounded-glupp-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold text-glupp-cream text-sm truncate">{inv.crew_name}</p>
                      <p className="text-[10px] text-glupp-text-muted mt-0.5">Invite par @{inv.invited_by_username} · {inv.member_count} membre{inv.member_count > 1 ? "s" : ""}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => handleAcceptInvite(inv.crew_id)} disabled={isP}
                        className="flex items-center gap-1 px-3 py-1.5 bg-glupp-accent text-glupp-bg rounded-glupp text-xs font-semibold disabled:opacity-50 transition-colors">
                        {isP && acceptingInvite ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Rejoindre
                      </button>
                      <button onClick={() => handleDeclineInvite(inv.crew_id)} disabled={isP}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-glupp-card border border-glupp-border rounded-glupp text-xs text-glupp-text-muted disabled:opacity-50 transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Crews */}
        {crews.length === 0 && invites.length === 0 ? (
          <div className="text-center py-10">
            <Users className="w-10 h-10 text-glupp-text-muted mx-auto mb-3" />
            <p className="text-sm text-glupp-text-muted">Pas encore de crew</p>
            <button onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-glupp-accent text-glupp-bg rounded-full text-sm font-semibold transition-colors">
              <Plus size={16} /> Creer mon premier crew
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {crews.map((crew, i) => {
              const crewLevel = getCrewLevel(crew.xp);
              const crewNext = getCrewNextLevel(crew.xp);
              const crewProgress = getCrewProgress(crew.xp);
              const hasPending = crew.pending_members && crew.pending_members.length > 0;
              const isExpanded = expandedCrewId === crew.id;

              return (
                <motion.div key={crew.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-4 bg-glupp-card border border-glupp-border rounded-glupp-lg space-y-3">

                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-glupp-cream truncate">{crew.name}</h4>
                        {crew.is_admin && <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-glupp-gold/10 rounded text-[9px] font-semibold text-glupp-gold"><Crown size={9} /> Chef</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-glupp-accent font-medium">{crewLevel.name}</span>
                        <span className="text-[10px] text-glupp-text-muted">Nv.{crewLevel.level}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-glupp-accent/10 rounded-full shrink-0">
                      <Zap size={12} className="text-glupp-accent" />
                      <span className="text-xs font-bold text-glupp-accent">{formatNumber(crew.xp)} XP</span>
                    </div>
                  </div>

                  {crewNext && <ProgressBar value={crewProgress} height={4} color="#E08840" subLabel={`${formatNumber(crew.xp)} / ${formatNumber(crewNext.min)}`} />}

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1"><Trophy size={12} className="text-glupp-gold" /><span className="text-xs text-glupp-text-muted">{crew.glupps_together} glupps</span></div>
                    <div className="flex items-center gap-1"><Users size={12} className="text-glupp-text-muted" /><span className="text-xs text-glupp-text-muted">{crew.member_count} membre{crew.member_count > 1 ? "s" : ""}</span></div>
                    {hasPending && crew.is_admin && <div className="flex items-center gap-1"><Clock size={12} className="text-glupp-accent" /><span className="text-xs text-glupp-accent">{crew.pending_members.length} en attente</span></div>}
                  </div>

                  {/* Members with illustrated avatars */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {(crew.members || []).slice(0, 6).map((m) => (
                      <button key={m.user_id} onClick={() => openUserProfileModal(m.user_id)} className="relative"
                        title={m.profile.display_name || m.profile.username}>
                        <MemberAvatar profile={m.profile} size="sm" />
                        {m.role === "admin" && <Crown size={8} className="absolute -top-0.5 -right-0.5 text-glupp-gold" />}
                      </button>
                    ))}
                    {(crew.members || []).length > 6 && (
                      <div className="w-8 h-8 rounded-full bg-glupp-card-alt border border-glupp-border flex items-center justify-center">
                        <span className="text-[10px] text-glupp-text-muted font-medium">+{crew.members.length - 6}</span>
                      </div>
                    )}
                  </div>

                  {/* Events */}
                  <CrewEventsSection crewId={crew.id} currentUserId={currentUserId} isCrewAdmin={crew.is_admin} crewMembers={crew.members}
                    onCheckin={(event) => setCheckinEvent({ event, crewId: crew.id, members: crew.members })} />

                  {/* Plan event */}
                  <button onClick={() => { setEventModalCrewId(crew.id); setEventModalCrewName(crew.name); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-glupp-accent/30 rounded-glupp text-xs text-glupp-accent hover:bg-glupp-accent/5 transition-colors">
                    <CalendarDays size={14} /> Planifier une sortie
                  </button>

                  {/* Admin panel */}
                  {crew.is_admin && (
                    <div className="pt-1 border-t border-glupp-border/50">
                      <button onClick={() => setExpandedCrewId(isExpanded ? null : crew.id)}
                        className="flex items-center gap-1.5 text-xs text-glupp-text-muted hover:text-glupp-cream transition-colors w-full py-1">
                        <Crown size={12} className="text-glupp-gold" /> <span>Gerer le crew</span>
                        {isExpanded ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
                      </button>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.2 }} className="mt-2 space-y-2">
                          <p className="text-[10px] text-glupp-text-muted uppercase tracking-wider font-semibold">Membres ({crew.members.length})</p>
                          {crew.members.map((m) => (
                            <div key={m.user_id} className="flex items-center gap-2.5 py-1.5">
                              <MemberAvatar profile={m.profile} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-glupp-cream truncate">{m.profile.display_name || m.profile.username}</p>
                                <p className="text-[10px] text-glupp-text-muted">{m.role === "admin" ? "Chef" : "Membre"}</p>
                              </div>
                              {m.role !== "admin" && (
                                <button onClick={() => handleKick(crew.id, m.user_id, m.profile.username, false)} disabled={kickingUserId === m.user_id}
                                  className="shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] text-glupp-text-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50">
                                  {kickingUserId === m.user_id ? <Loader2 size={10} className="animate-spin" /> : <UserMinus size={10} />} Retirer
                                </button>
                              )}
                            </div>
                          ))}
                          {hasPending && (
                            <>
                              <p className="text-[10px] text-glupp-accent uppercase tracking-wider font-semibold mt-3">En attente ({crew.pending_members.length})</p>
                              {crew.pending_members.map((m) => (
                                <div key={m.user_id} className="flex items-center gap-2.5 py-1.5">
                                  <div className="relative">
                                    <MemberAvatar profile={m.profile} size="sm" />
                                    <Clock size={8} className="absolute -bottom-0.5 -right-0.5 text-glupp-accent bg-glupp-card rounded-full" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-glupp-cream truncate">{m.profile.display_name || m.profile.username}</p>
                                    <p className="text-[10px] text-glupp-accent">En attente</p>
                                  </div>
                                  <button onClick={() => handleKick(crew.id, m.user_id, m.profile.username, true)} disabled={kickingUserId === m.user_id}
                                    className="shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] text-glupp-text-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50">
                                    {kickingUserId === m.user_id ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />} Annuler
                                  </button>
                                </div>
                              ))}
                            </>
                          )}
                          <div className="mt-3 pt-2 border-t border-glupp-border/30">
                            <button onClick={() => setInvitingToCrewId(invitingToCrewId === crew.id ? null : crew.id)}
                              className="flex items-center gap-1.5 text-xs font-semibold text-glupp-accent"><UserPlus size={12} /> Inviter un ami</button>
                            {invitingToCrewId === crew.id && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                                {(() => {
                                  const ids = new Set([...crew.members.map(m => m.user_id), ...(crew.pending_members || []).map(m => m.user_id)]);
                                  const avail = friends.filter(f => !ids.has(f.friend_id));
                                  if (avail.length === 0) return <p className="text-[10px] text-glupp-text-muted py-2 text-center">Tous tes amis sont deja dans le crew</p>;
                                  return avail.map(f => {
                                    const d = f.friend_data; const inv = invitingUserId === f.friend_id;
                                    return (
                                      <div key={f.friend_id} className="flex items-center gap-2.5 py-1.5">
                                        <Avatar url={d.avatar_url} name={d.display_name || d.username} size="sm" />
                                        <p className="flex-1 text-xs font-medium text-glupp-cream truncate">{d.display_name || d.username}</p>
                                        <button onClick={async () => { setInvitingUserId(f.friend_id); try { await inviteToCrew(crew.id, f.friend_id); } catch {} finally { setInvitingUserId(null); } }}
                                          disabled={inv} className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-glupp-accent/10 text-glupp-accent text-[10px] font-semibold rounded disabled:opacity-50 transition-colors">
                                          {inv ? <Loader2 size={10} className="animate-spin" /> : <UserPlus size={10} />} Inviter
                                        </button>
                                      </div>
                                    );
                                  });
                                })()}
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  <div className="pt-1 border-t border-glupp-border/50">
                    <button onClick={() => handleLeaveCrew(crew.id, crew.name)} disabled={leavingCrewId === crew.id}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-glupp-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-glupp transition-colors disabled:opacity-50">
                      {leavingCrewId === crew.id ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />} Quitter le crew
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <CreateCrewModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      {eventModalCrewId && (
        <CreateEventModal isOpen={!!eventModalCrewId} onClose={() => { setEventModalCrewId(null); setEventModalCrewName(""); }}
          crewId={eventModalCrewId} crewName={eventModalCrewName} />
      )}
      {checkinEvent && (
        <CheckinEventModal isOpen={!!checkinEvent} onClose={() => setCheckinEvent(null)}
          event={checkinEvent.event} crewId={checkinEvent.crewId} crewMembers={checkinEvent.members} />
      )}
    </>
  );
}

// Sub-component to load events per crew (avoids hook rules issues)
function CrewEventsSection({ crewId, currentUserId, isCrewAdmin, crewMembers, onCheckin }: {
  crewId: string; currentUserId: string; isCrewAdmin: boolean;
  crewMembers: Array<{ user_id: string; profile: { username: string; display_name: string; avatar_url: string | null; avatar_id: string | null } }>;
  onCheckin: (event: CrewEvent) => void;
}) {
  const { events } = useCrewEvents(crewId);
  if (events.length === 0) return null;

  const upcoming = events.filter((e) => !e.checkins || e.checkins.length === 0);
  const validated = events.filter((e) => e.checkins && e.checkins.length > 0);

  return (
    <div className="space-y-3 pt-1">
      {/* Upcoming — full cards */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-glupp-text-muted uppercase tracking-wider font-semibold flex items-center gap-1">
            <CalendarDays size={10} /> A venir ({upcoming.length})
          </p>
          {upcoming.map((event) => (
            <EventCard key={event.id} event={event} crewId={crewId} currentUserId={currentUserId}
              isCrewAdmin={isCrewAdmin} crewMembers={crewMembers} onCheckin={onCheckin} />
          ))}
        </div>
      )}

      {/* Validated — compact carousel */}
      {validated.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-glupp-text-muted uppercase tracking-wider font-semibold flex items-center gap-1">
            <Check size={10} className="text-green-400" /> Sorties validees ({validated.length})
          </p>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
            {validated.map((event) => {
              const photo = event.checkins?.[0]?.photo_url;
              const goingCount = event.responses.filter((r) => r.response === "going").length;
              const { relative } = formatEventDate(event.event_date);
              return (
                <div key={event.id} className="shrink-0 w-36">
                  {/* Photo thumbnail */}
                  {photo ? (
                    <div className="relative w-36 h-24 rounded-glupp overflow-hidden mb-1.5">
                      <img src={photo} alt={event.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-1.5 left-1.5 right-1.5">
                        <p className="text-[10px] font-semibold text-white truncate">{event.title}</p>
                      </div>
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 bg-green-400/90 rounded-full">
                        <Check size={8} className="text-white" />
                        <span className="text-[8px] text-white font-semibold">{goingCount}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-36 h-24 rounded-glupp bg-glupp-card-alt border border-glupp-border flex items-center justify-center mb-1.5">
                      <div className="text-center">
                        <p className="text-[10px] font-semibold text-glupp-cream truncate px-2">{event.title}</p>
                        <div className="flex items-center justify-center gap-0.5 mt-1">
                          <Check size={8} className="text-green-400" />
                          <span className="text-[8px] text-green-400">{goingCount}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Bar name + date */}
                  <p className="text-[9px] text-glupp-text-muted truncate">
                    {event.bar_name || event.location || ""}
                  </p>
                  {event.creator && (
                    <p className="text-[8px] text-glupp-text-muted truncate">
                      par {event.creator.display_name || event.creator.username}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
