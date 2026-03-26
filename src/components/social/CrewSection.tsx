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
import { formatNumber } from "@/lib/utils/xp";
import { CreateCrewModal } from "./CreateCrewModal";
import { CreateEventModal } from "./CreateEventModal";
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
  UserMinus,
  UserPlus,
  Clock,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  MapPin,
  HelpCircle,
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

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const day = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  let relative = "";
  if (diffDays === 0) relative = "Aujourd'hui";
  else if (diffDays === 1) relative = "Demain";
  else if (diffDays < 7) relative = `Dans ${diffDays} jours`;

  return { day, time, relative };
}

// ═══════════════════════════════════════════
// Event Card Sub-component
// ═══════════════════════════════════════════

function EventCard({
  event,
  crewId,
  isCreator,
}: {
  event: CrewEvent;
  crewId: string;
  isCreator: boolean;
}) {
  const { respondToEvent, responding, cancelEvent, cancelling } = useCrewEvents(crewId);
  const { day, time, relative } = formatEventDate(event.event_date);

  const goingCount = event.responses.filter((r) => r.response === "going").length;
  const maybeCount = event.responses.filter((r) => r.response === "maybe").length;
  const notGoingCount = event.responses.filter((r) => r.response === "not_going").length;

  const responseButtons: { key: "going" | "maybe" | "not_going"; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
    { key: "going", label: "J'y suis", icon: <Check size={12} />, color: "text-green-400", bg: "bg-green-400/15 border-green-400/30" },
    { key: "maybe", label: "Peut-etre", icon: <HelpCircle size={12} />, color: "text-glupp-gold", bg: "bg-glupp-gold/15 border-glupp-gold/30" },
    { key: "not_going", label: "Pas dispo", icon: <X size={12} />, color: "text-glupp-text-muted", bg: "bg-glupp-border/30 border-glupp-border" },
  ];

  return (
    <div className="p-3 bg-glupp-card-alt border border-glupp-border rounded-glupp space-y-2.5">
      {/* Event header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-glupp-cream truncate">
            {event.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {(event.bar_name || event.location) && (
              <span className="flex items-center gap-1 text-[10px] text-glupp-accent">
                <MapPin size={10} />
                {event.bar_name || event.location}
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] text-glupp-text-muted">
              <CalendarDays size={10} />
              {day} a {time}
            </span>
          </div>
          {relative && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-glupp-accent/10 text-glupp-accent text-[9px] font-semibold rounded-full">
              {relative}
            </span>
          )}
        </div>
        {isCreator && (
          <button
            onClick={() => {
              if (window.confirm("Annuler cette sortie ?")) cancelEvent(event.id);
            }}
            disabled={cancelling}
            className="shrink-0 text-[10px] text-glupp-text-muted hover:text-red-400 transition-colors px-1.5 py-0.5"
          >
            {cancelling ? <Loader2 size={10} className="animate-spin" /> : "Annuler"}
          </button>
        )}
      </div>

      {/* Description */}
      {event.description && (
        <p className="text-[11px] text-glupp-text-muted">{event.description}</p>
      )}

      {/* Responses summary */}
      <div className="flex items-center gap-3 text-[10px]">
        {goingCount > 0 && (
          <span className="flex items-center gap-1 text-green-400">
            <Check size={10} /> {goingCount}
          </span>
        )}
        {maybeCount > 0 && (
          <span className="flex items-center gap-1 text-glupp-gold">
            <HelpCircle size={10} /> {maybeCount}
          </span>
        )}
        {notGoingCount > 0 && (
          <span className="flex items-center gap-1 text-glupp-text-muted">
            <X size={10} /> {notGoingCount}
          </span>
        )}
        {/* Avatars of people going */}
        <div className="flex items-center -space-x-1.5 ml-auto">
          {event.responses
            .filter((r) => r.response === "going")
            .slice(0, 4)
            .map((r) => (
              <div
                key={r.user_id}
                className="w-5 h-5 rounded-full border border-glupp-card-alt overflow-hidden"
                title={r.profile.display_name || r.profile.username}
              >
                <Avatar
                  url={r.profile.avatar_url}
                  name={r.profile.display_name || r.profile.username}
                  size="sm"
                />
              </div>
            ))}
        </div>
      </div>

      {/* Response buttons */}
      <div className="flex gap-1.5">
        {responseButtons.map((btn) => {
          const isSelected = event.my_response === btn.key;
          return (
            <button
              key={btn.key}
              onClick={() => respondToEvent(event.id, btn.key)}
              disabled={responding}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-glupp text-[11px] font-medium border transition-all ${
                isSelected
                  ? `${btn.bg} ${btn.color}`
                  : "border-glupp-border/50 text-glupp-text-muted hover:border-glupp-accent/30"
              }`}
            >
              {btn.icon}
              {btn.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

export function CrewSection() {
  const {
    crews,
    isLoading,
    invites,
    acceptInvite,
    acceptingInvite,
    declineInvite,
    leaveCrew,
    kickFromCrew,
    inviteToCrew,
  } = useCrews();
  const { friends } = useFriends();
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

  if (isLoading) {
    return (
      <div className="px-4 space-y-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-36" />
      </div>
    );
  }

  const handleAcceptInvite = async (crewId: string) => {
    setProcessingInviteId(crewId);
    try { await acceptInvite(crewId); } catch (err) { console.error(err); }
    finally { setProcessingInviteId(null); }
  };

  const handleDeclineInvite = async (crewId: string) => {
    setProcessingInviteId(crewId);
    try { await declineInvite(crewId); } catch (err) { console.error(err); }
    finally { setProcessingInviteId(null); }
  };

  const handleLeaveCrew = async (crewId: string, crewName: string) => {
    if (!window.confirm(`Quitter "${crewName}" ?`)) return;
    setLeavingCrewId(crewId);
    try { await leaveCrew(crewId); } catch (err) { console.error(err); }
    finally { setLeavingCrewId(null); }
  };

  const handleKick = async (crewId: string, userId: string, username: string, isPending: boolean) => {
    const action = isPending ? "Annuler l'invitation de" : "Retirer";
    if (!window.confirm(`${action} @${username} ?`)) return;
    setKickingUserId(userId);
    try { await kickFromCrew(crewId, userId); } catch (err) { console.error(err); }
    finally { setKickingUserId(null); }
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
              <span>{invites.length} invitation{invites.length > 1 ? "s" : ""} en attente</span>
            </div>
            {invites.map((invite) => {
              const isProcessing = processingInviteId === invite.crew_id;
              return (
                <motion.div key={invite.crew_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-glupp-accent/5 border border-glupp-accent/20 rounded-glupp-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold text-glupp-cream text-sm truncate">{invite.crew_name}</p>
                      <p className="text-[10px] text-glupp-text-muted mt-0.5">
                        Invite par @{invite.invited_by_username} · {invite.member_count} membre{invite.member_count > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => handleAcceptInvite(invite.crew_id)} disabled={isProcessing}
                        className="flex items-center gap-1 px-3 py-1.5 bg-glupp-accent text-glupp-bg rounded-glupp text-xs font-semibold hover:bg-glupp-accent/90 disabled:opacity-50 transition-colors">
                        {isProcessing && acceptingInvite ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Rejoindre
                      </button>
                      <button onClick={() => handleDeclineInvite(invite.crew_id)} disabled={isProcessing}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-glupp-card border border-glupp-border rounded-glupp text-xs text-glupp-text-muted hover:text-glupp-cream disabled:opacity-50 transition-colors">
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
            <p className="text-sm text-glupp-text-muted">Pas encore de crew</p>
            <p className="text-xs text-glupp-text-muted mt-1">Cree un crew avec tes amis !</p>
            <button onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-glupp-accent text-glupp-bg rounded-full text-sm font-semibold hover:bg-glupp-accent/90 transition-colors">
              <Plus size={16} /> Creer mon premier crew
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {crews.map((crew, i) => (
              <CrewCard
                key={crew.id}
                crew={crew}
                index={i}
                friends={friends}
                isLeaving={leavingCrewId === crew.id}
                isExpanded={expandedCrewId === crew.id}
                invitingToCrewId={invitingToCrewId}
                invitingUserId={invitingUserId}
                kickingUserId={kickingUserId}
                onToggleExpand={() => setExpandedCrewId(expandedCrewId === crew.id ? null : crew.id)}
                onToggleInvite={() => setInvitingToCrewId(invitingToCrewId === crew.id ? null : crew.id)}
                onLeave={() => handleLeaveCrew(crew.id, crew.name)}
                onKick={(userId, username, isPending) => handleKick(crew.id, userId, username, isPending)}
                onInvite={async (friendId) => {
                  setInvitingUserId(friendId);
                  try { await inviteToCrew(crew.id, friendId); } catch (err) { console.error(err); }
                  finally { setInvitingUserId(null); }
                }}
                onPlanEvent={() => { setEventModalCrewId(crew.id); setEventModalCrewName(crew.name); }}
                openUserProfileModal={openUserProfileModal}
              />
            ))}
          </div>
        )}
      </div>

      <CreateCrewModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />

      {/* Event creation modal */}
      {eventModalCrewId && (
        <CreateEventModal
          isOpen={!!eventModalCrewId}
          onClose={() => { setEventModalCrewId(null); setEventModalCrewName(""); }}
          crewId={eventModalCrewId}
          crewName={eventModalCrewName}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════
// Crew Card Sub-component
// ═══════════════════════════════════════════

function CrewCard({
  crew,
  index,
  friends,
  isLeaving,
  isExpanded,
  invitingToCrewId,
  invitingUserId,
  kickingUserId,
  onToggleExpand,
  onToggleInvite,
  onLeave,
  onKick,
  onInvite,
  onPlanEvent,
  openUserProfileModal,
}: {
  crew: ReturnType<typeof useCrews>["crews"][0];
  index: number;
  friends: ReturnType<typeof import("@/lib/hooks/useFriends").useFriends>["friends"];
  isLeaving: boolean;
  isExpanded: boolean;
  invitingToCrewId: string | null;
  invitingUserId: string | null;
  kickingUserId: string | null;
  onToggleExpand: () => void;
  onToggleInvite: () => void;
  onLeave: () => void;
  onKick: (userId: string, username: string, isPending: boolean) => void;
  onInvite: (friendId: string) => void;
  onPlanEvent: () => void;
  openUserProfileModal: (id: string) => void;
}) {
  const crewLevel = getCrewLevel(crew.xp);
  const crewNext = getCrewNextLevel(crew.xp);
  const crewProgress = getCrewProgress(crew.xp);
  const hasPending = crew.pending_members && crew.pending_members.length > 0;

  // Events for this crew
  const { events, isLoading: eventsLoading } = useCrewEvents(crew.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-4 bg-glupp-card border border-glupp-border rounded-glupp-lg space-y-3"
    >
      {/* Crew header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-display font-bold text-glupp-cream truncate">{crew.name}</h4>
            {crew.is_admin && (
              <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-glupp-gold/10 rounded text-[9px] font-semibold text-glupp-gold">
                <Crown size={9} /> Chef
              </span>
            )}
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

      {/* XP Progress */}
      {crewNext && (
        <ProgressBar value={crewProgress} height={4} color="#E08840"
          subLabel={`${formatNumber(crew.xp)} / ${formatNumber(crewNext.min)}`} />
      )}

      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Trophy size={12} className="text-glupp-gold" />
          <span className="text-xs text-glupp-text-muted">{crew.glupps_together} glupps</span>
        </div>
        <div className="flex items-center gap-1">
          <Users size={12} className="text-glupp-text-muted" />
          <span className="text-xs text-glupp-text-muted">{crew.member_count} membre{crew.member_count > 1 ? "s" : ""}</span>
        </div>
        {hasPending && crew.is_admin && (
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-glupp-accent" />
            <span className="text-xs text-glupp-accent">{crew.pending_members.length} en attente</span>
          </div>
        )}
      </div>

      {/* Members avatars */}
      <div className="flex items-center gap-1.5 pt-1">
        {(crew.members || []).slice(0, 6).map((member) => (
          <button key={member.user_id} onClick={() => openUserProfileModal(member.user_id)} className="relative"
            title={member.profile.display_name || member.profile.username}>
            <Avatar url={member.profile.avatar_url} name={member.profile.display_name || member.profile.username} size="sm" />
            {member.role === "admin" && <Crown size={8} className="absolute -top-0.5 -right-0.5 text-glupp-gold" />}
          </button>
        ))}
        {(crew.members || []).length > 6 && (
          <div className="w-8 h-8 rounded-full bg-glupp-card-alt border border-glupp-border flex items-center justify-center">
            <span className="text-[10px] text-glupp-text-muted font-medium">+{(crew.members || []).length - 6}</span>
          </div>
        )}
      </div>

      {/* ═══ Upcoming events ═══ */}
      {events.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[10px] text-glupp-text-muted uppercase tracking-wider font-semibold flex items-center gap-1">
            <CalendarDays size={10} /> Sorties a venir ({events.length})
          </p>
          {events.map((event) => (
            <EventCard key={event.id} event={event} crewId={crew.id} isCreator={event.created_by === crew.members?.find(m => m.role === "admin")?.user_id} />
          ))}
        </div>
      )}

      {/* Plan event button */}
      <button
        onClick={onPlanEvent}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-glupp-accent/30 rounded-glupp text-xs text-glupp-accent hover:bg-glupp-accent/5 hover:border-glupp-accent/50 transition-colors"
      >
        <CalendarDays size={14} />
        Planifier une sortie
      </button>

      {/* ═══ Admin panel ═══ */}
      {crew.is_admin && (
        <div className="pt-1 border-t border-glupp-border/50">
          <button onClick={onToggleExpand}
            className="flex items-center gap-1.5 text-xs text-glupp-text-muted hover:text-glupp-cream transition-colors w-full py-1">
            <Crown size={12} className="text-glupp-gold" />
            <span>Gerer le crew</span>
            {isExpanded ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
          </button>

          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.2 }} className="mt-2 space-y-2">
              {/* Accepted members */}
              <p className="text-[10px] text-glupp-text-muted uppercase tracking-wider font-semibold">Membres ({crew.members.length})</p>
              {crew.members.map((member) => (
                <div key={member.user_id} className="flex items-center gap-2.5 py-1.5">
                  <Avatar url={member.profile.avatar_url} name={member.profile.display_name || member.profile.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-glupp-cream truncate">{member.profile.display_name || member.profile.username}</p>
                    <p className="text-[10px] text-glupp-text-muted">{member.role === "admin" ? "Chef" : "Membre"}</p>
                  </div>
                  {member.role !== "admin" && (
                    <button onClick={() => onKick(member.user_id, member.profile.username, false)} disabled={kickingUserId === member.user_id}
                      className="shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] text-glupp-text-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50">
                      {kickingUserId === member.user_id ? <Loader2 size={10} className="animate-spin" /> : <UserMinus size={10} />} Retirer
                    </button>
                  )}
                </div>
              ))}

              {/* Pending */}
              {hasPending && (
                <>
                  <p className="text-[10px] text-glupp-accent uppercase tracking-wider font-semibold mt-3">Invitations en attente ({crew.pending_members.length})</p>
                  {crew.pending_members.map((member) => (
                    <div key={member.user_id} className="flex items-center gap-2.5 py-1.5">
                      <div className="relative">
                        <Avatar url={member.profile.avatar_url} name={member.profile.display_name || member.profile.username} size="sm" />
                        <Clock size={8} className="absolute -bottom-0.5 -right-0.5 text-glupp-accent bg-glupp-card rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-glupp-cream truncate">{member.profile.display_name || member.profile.username}</p>
                        <p className="text-[10px] text-glupp-accent">En attente de reponse</p>
                      </div>
                      <button onClick={() => onKick(member.user_id, member.profile.username, true)} disabled={kickingUserId === member.user_id}
                        className="shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] text-glupp-text-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50">
                        {kickingUserId === member.user_id ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />} Annuler
                      </button>
                    </div>
                  ))}
                </>
              )}

              {/* Invite a friend */}
              <div className="mt-3 pt-2 border-t border-glupp-border/30">
                <button onClick={onToggleInvite}
                  className="flex items-center gap-1.5 text-xs font-semibold text-glupp-accent hover:text-glupp-accent/80 transition-colors">
                  <UserPlus size={12} /> Inviter un ami
                </button>

                {invitingToCrewId === crew.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.15 }} className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                    {(() => {
                      const allCrewUserIds = new Set([
                        ...crew.members.map((m) => m.user_id),
                        ...(crew.pending_members || []).map((m) => m.user_id),
                      ]);
                      const availableFriends = friends.filter((f) => !allCrewUserIds.has(f.friend_id));

                      if (availableFriends.length === 0) {
                        return <p className="text-[10px] text-glupp-text-muted py-2 text-center">Tous tes amis sont deja dans le crew ou invites</p>;
                      }

                      return availableFriends.map((friend) => {
                        const data = friend.friend_data;
                        const isInviting = invitingUserId === friend.friend_id;
                        return (
                          <div key={friend.friend_id} className="flex items-center gap-2.5 py-1.5">
                            <Avatar url={data.avatar_url} name={data.display_name || data.username} size="sm" />
                            <p className="flex-1 text-xs font-medium text-glupp-cream truncate">{data.display_name || data.username}</p>
                            <button onClick={() => onInvite(friend.friend_id)} disabled={isInviting}
                              className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-glupp-accent/10 text-glupp-accent text-[10px] font-semibold rounded hover:bg-glupp-accent/20 disabled:opacity-50 transition-colors">
                              {isInviting ? <Loader2 size={10} className="animate-spin" /> : <UserPlus size={10} />} Inviter
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

      {/* Leave */}
      <div className="pt-1 border-t border-glupp-border/50">
        <button onClick={onLeave} disabled={isLeaving}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-glupp-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-glupp transition-colors disabled:opacity-50">
          {isLeaving ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
          Quitter le crew
        </button>
      </div>
    </motion.div>
  );
}
