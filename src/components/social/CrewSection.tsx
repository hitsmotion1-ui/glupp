"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCrews } from "@/lib/hooks/useCrews";
import { useFriends } from "@/lib/hooks/useFriends";
import { useCrewEvents, type CrewEvent } from "@/lib/hooks/useCrewEvents";
import { useAppStore } from "@/lib/store/useAppStore";
import { supabase } from "@/lib/supabase/client";
import { formatNumber } from "@/lib/utils/xp";
import { CreateCrewModal } from "./CreateCrewModal";
import { CreateEventModal } from "./CreateEventModal";
import { Users, Plus, Trophy, Crown, Zap, Mail, Check, X, LogOut, Loader2, UserMinus, UserPlus, Clock, ChevronDown, ChevronUp, CalendarDays, MapPin, HelpCircle, Camera, Trash2 } from "lucide-react";

const CREW_LEVELS = [
  { level: 1, name: "Bande de potes", min: 0 },
  { level: 2, name: "Confrerie", min: 500 },
  { level: 3, name: "Guilde", min: 2000 },
  { level: 4, name: "Ordre Sacre", min: 5000 },
  { level: 5, name: "Legende", min: 10000 },
];

function getCrewLevel(xp: number) { for (let i = CREW_LEVELS.length - 1; i >= 0; i--) { if (xp >= CREW_LEVELS[i].min) return CREW_LEVELS[i]; } return CREW_LEVELS[0]; }
function getCrewNextLevel(xp: number) { const c = getCrewLevel(xp); const i = CREW_LEVELS.findIndex((l) => l.level === c.level); return i < CREW_LEVELS.length - 1 ? CREW_LEVELS[i + 1] : null; }
function getCrewProgress(xp: number) { const c = getCrewLevel(xp); const n = getCrewNextLevel(xp); if (!n) return 100; return Math.round(((xp - c.min) / (n.min - c.min)) * 100); }

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr); const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const day = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  let relative = ""; if (diffDays <= 0) relative = "Aujourd'hui"; else if (diffDays === 1) relative = "Demain"; else if (diffDays < 7) relative = `Dans ${diffDays}j`;
  return { day, time, relative };
}

function EventCard({ event, crewId, crewMembers, currentUserId, isCrewAdmin }: {
  event: CrewEvent; crewId: string;
  crewMembers: Array<{ user_id: string; profile: { username: string; display_name: string; avatar_url: string | null } }>;
  currentUserId: string; isCrewAdmin: boolean;
}) {
  const { respondToEvent, responding, cancelEvent, cancelling, checkinEvent, checkingIn } = useCrewEvents(crewId);
  const { day, time, relative } = formatEventDate(event.event_date);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCheckin, setShowCheckin] = useState(false);
  const [taggedIds, setTaggedIds] = useState<Set<string>>(new Set());

  const goingCount = event.responses.filter((r) => r.response === "going").length;
  const maybeCount = event.responses.filter((r) => r.response === "maybe").length;
  const isCreator = event.created_by === currentUserId;
  const canCancel = isCreator || isCrewAdmin;

  const responseButtons: { key: "going" | "maybe" | "not_going"; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
    { key: "going", label: "J'y suis", icon: <Check size={12} />, color: "text-green-400", bg: "bg-green-400/15 border-green-400/30" },
    { key: "maybe", label: "Peut-etre", icon: <HelpCircle size={12} />, color: "text-glupp-gold", bg: "bg-glupp-gold/15 border-glupp-gold/30" },
    { key: "not_going", label: "Pas dispo", icon: <X size={12} />, color: "text-glupp-text-muted", bg: "bg-glupp-border/30 border-glupp-border" },
  ];

  const handleCheckinPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try { await checkinEvent(event.id, file, Array.from(taggedIds)); setShowCheckin(false); setTaggedIds(new Set()); }
    catch (err) { console.error("Checkin error:", err); }
  };

  const toggleTag = (userId: string) => { setTaggedIds((prev) => { const n = new Set(prev); if (n.has(userId)) n.delete(userId); else n.add(userId); return n; }); };

  return (
    <div className="p-3 bg-glupp-card-alt border border-glupp-border rounded-glupp space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-glupp-cream truncate">{event.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {(event.bar_name || event.location) && (<span className="flex items-center gap-1 text-[10px] text-glupp-accent"><MapPin size={10} /> {event.bar_name || event.location}</span>)}
            <span className="flex items-center gap-1 text-[10px] text-glupp-text-muted"><CalendarDays size={10} /> {day} a {time}</span>
          </div>
          <p className="text-[9px] text-glupp-text-muted mt-1">Organise par <span className="font-medium text-glupp-cream">{event.creator?.display_name || event.creator?.username || "Inconnu"}</span></p>
          {relative && (<span className="inline-block mt-1 px-2 py-0.5 bg-glupp-accent/10 text-glupp-accent text-[9px] font-semibold rounded-full">{relative}</span>)}
        </div>
        {canCancel && (
          <button onClick={() => { if (window.confirm("Annuler cette sortie ?")) cancelEvent(event.id); }} disabled={cancelling}
            className="shrink-0 p-1.5 text-glupp-text-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-colors" title="Annuler">
            {cancelling ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        )}
      </div>
      {event.description && <p className="text-[11px] text-glupp-text-muted">{event.description}</p>}
      <div className="flex items-center gap-3 text-[10px]">
        {goingCount > 0 && <span className="flex items-center gap-1 text-green-400"><Check size={10} /> {goingCount}</span>}
        {maybeCount > 0 && <span className="flex items-center gap-1 text-glupp-gold"><HelpCircle size={10} /> {maybeCount}</span>}
        <div className="flex items-center -space-x-1.5 ml-auto">
          {event.responses.filter((r) => r.response === "going").slice(0, 5).map((r) => (
            <div key={r.user_id} className="w-5 h-5 rounded-full border border-glupp-card-alt overflow-hidden" title={r.profile.display_name || r.profile.username}>
              <Avatar url={r.profile.avatar_url} name={r.profile.display_name || r.profile.username} size="sm" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5">
        {responseButtons.map((btn) => {
          const sel = event.my_response === btn.key;
          return (<button key={btn.key} onClick={() => respondToEvent(event.id, btn.key)} disabled={responding}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-glupp text-[11px] font-medium border transition-all ${sel ? `${btn.bg} ${btn.color}` : "border-glupp-border/50 text-glupp-text-muted hover:border-glupp-accent/30"}`}>
            {btn.icon} {btn.label}
          </button>);
        })}
      </div>
      {event.checkins.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-glupp-border/30">
          <p className="text-[9px] text-glupp-text-muted uppercase tracking-wider font-semibold flex items-center gap-1"><Camera size={9} /> Photos ({event.checkins.length})</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {event.checkins.map((c) => (
              <div key={c.id} className="shrink-0 relative">
                <img src={c.photo_url} alt="" className="w-20 h-20 rounded-glupp object-cover border border-glupp-border" />
                <div className="absolute bottom-1 left-1 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded-full">
                  <span className="text-[8px] text-white">{c.profile?.username}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {event.my_response === "going" && (
        <div className="pt-1 border-t border-glupp-border/30">
          {!showCheckin ? (
            <button onClick={() => setShowCheckin(true)} className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-green-400/30 rounded-glupp text-xs text-green-400 hover:bg-green-400/5 transition-colors">
              <Camera size={14} /> Valider la sortie (+20 XP)
            </button>
          ) : (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="space-y-2">
              <p className="text-[10px] text-glupp-text-muted">Tague les presents :</p>
              <div className="flex flex-wrap gap-1.5">
                {crewMembers.filter((m) => m.user_id !== currentUserId).map((member) => {
                  const tagged = taggedIds.has(member.user_id);
                  return (<button key={member.user_id} onClick={() => toggleTag(member.user_id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] border transition-all ${tagged ? "bg-green-400/15 border-green-400/30 text-green-400" : "border-glupp-border text-glupp-text-muted"}`}>
                    <Avatar url={member.profile.avatar_url} name={member.profile.display_name || member.profile.username} size="sm" className="!w-4 !h-4" />
                    {member.profile.display_name || member.profile.username} {tagged && <Check size={8} />}
                  </button>);
                })}
              </div>
              <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()} disabled={checkingIn}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-glupp text-xs font-semibold hover:bg-green-500/90 disabled:opacity-50 transition-colors">
                  {checkingIn ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />} {checkingIn ? "Envoi..." : "Photo de groupe"}
                </button>
                <button onClick={() => { setShowCheckin(false); setTaggedIds(new Set()); }} className="px-3 py-2.5 bg-glupp-card border border-glupp-border rounded-glupp text-xs text-glupp-text-muted"><X size={14} /></button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCheckinPhoto} />
              <p className="text-[9px] text-glupp-text-muted text-center">+20 XP toi · +10 XP/tague · +15 XP crew</p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

function CrewCard({ crew, index, friends, isLeaving, isExpanded, invitingToCrewId, invitingUserId, kickingUserId, currentUserId, onToggleExpand, onToggleInvite, onLeave, onKick, onInvite, onPlanEvent, openUserProfileModal }: {
  crew: any; index: number; friends: any[]; isLeaving: boolean; isExpanded: boolean;
  invitingToCrewId: string | null; invitingUserId: string | null; kickingUserId: string | null; currentUserId: string;
  onToggleExpand: () => void; onToggleInvite: () => void; onLeave: () => void;
  onKick: (userId: string, username: string, isPending: boolean) => void;
  onInvite: (friendId: string) => void; onPlanEvent: () => void; openUserProfileModal: (id: string) => void;
}) {
  const crewLevel = getCrewLevel(crew.xp);
  const crewNext = getCrewNextLevel(crew.xp);
  const crewProgress = getCrewProgress(crew.xp);
  const hasPending = crew.pending_members && crew.pending_members.length > 0;
  const { events } = useCrewEvents(crew.id);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="p-4 bg-glupp-card border border-glupp-border rounded-glupp-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-display font-bold text-glupp-cream truncate">{crew.name}</h4>
            {crew.is_admin && (<span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-glupp-gold/10 rounded text-[9px] font-semibold text-glupp-gold"><Crown size={9} /> Chef</span>)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-glupp-accent font-medium">{crewLevel.name}</span>
            <span className="text-[10px] text-glupp-text-muted">Nv.{crewLevel.level}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-glupp-accent/10 rounded-full shrink-0">
          <Zap size={12} className="text-glupp-accent" /><span className="text-xs font-bold text-glupp-accent">{formatNumber(crew.xp)} XP</span>
        </div>
      </div>
      {crewNext && <ProgressBar value={crewProgress} height={4} color="#E08840" subLabel={`${formatNumber(crew.xp)} / ${formatNumber(crewNext.min)}`} />}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1"><Trophy size={12} className="text-glupp-gold" /><span className="text-xs text-glupp-text-muted">{crew.glupps_together} glupps</span></div>
        <div className="flex items-center gap-1"><Users size={12} className="text-glupp-text-muted" /><span className="text-xs text-glupp-text-muted">{crew.member_count} membre{crew.member_count > 1 ? "s" : ""}</span></div>
        {hasPending && crew.is_admin && (<div className="flex items-center gap-1"><Clock size={12} className="text-glupp-accent" /><span className="text-xs text-glupp-accent">{crew.pending_members.length} en attente</span></div>)}
      </div>
      <div className="flex items-center gap-1.5 pt-1">
        {(crew.members || []).slice(0, 6).map((member: any) => (
          <button key={member.user_id} onClick={() => openUserProfileModal(member.user_id)} className="relative" title={member.profile.display_name || member.profile.username}>
            <Avatar url={member.profile.avatar_url} name={member.profile.display_name || member.profile.username} size="sm" />
            {member.role === "admin" && <Crown size={8} className="absolute -top-0.5 -right-0.5 text-glupp-gold" />}
          </button>
        ))}
        {(crew.members || []).length > 6 && (<div className="w-8 h-8 rounded-full bg-glupp-card-alt border border-glupp-border flex items-center justify-center"><span className="text-[10px] text-glupp-text-muted font-medium">+{(crew.members || []).length - 6}</span></div>)}
      </div>
      {events.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[10px] text-glupp-text-muted uppercase tracking-wider font-semibold flex items-center gap-1"><CalendarDays size={10} /> Sorties ({events.length})</p>
          {events.map((event: CrewEvent) => (<EventCard key={event.id} event={event} crewId={crew.id} crewMembers={crew.members} currentUserId={currentUserId} isCrewAdmin={crew.is_admin} />))}
        </div>
      )}
      <button onClick={onPlanEvent} className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-glupp-accent/30 rounded-glupp text-xs text-glupp-accent hover:bg-glupp-accent/5 hover:border-glupp-accent/50 transition-colors">
        <CalendarDays size={14} /> Planifier une sortie
      </button>
      {crew.is_admin && (
        <div className="pt-1 border-t border-glupp-border/50">
          <button onClick={onToggleExpand} className="flex items-center gap-1.5 text-xs text-glupp-text-muted hover:text-glupp-cream transition-colors w-full py-1">
            <Crown size={12} className="text-glupp-gold" /> <span>Gerer le crew</span> {isExpanded ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
          </button>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.2 }} className="mt-2 space-y-2">
              <p className="text-[10px] text-glupp-text-muted uppercase tracking-wider font-semibold">Membres ({crew.members.length})</p>
              {crew.members.map((member: any) => (
                <div key={member.user_id} className="flex items-center gap-2.5 py-1.5">
                  <Avatar url={member.profile.avatar_url} name={member.profile.display_name || member.profile.username} size="sm" />
                  <div className="flex-1 min-w-0"><p className="text-xs font-medium text-glupp-cream truncate">{member.profile.display_name || member.profile.username}</p><p className="text-[10px] text-glupp-text-muted">{member.role === "admin" ? "Chef" : "Membre"}</p></div>
                  {member.role !== "admin" && (<button onClick={() => onKick(member.user_id, member.profile.username, false)} disabled={kickingUserId === member.user_id}
                    className="shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] text-glupp-text-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50">
                    {kickingUserId === member.user_id ? <Loader2 size={10} className="animate-spin" /> : <UserMinus size={10} />} Retirer</button>)}
                </div>
              ))}
              {hasPending && (<>
                <p className="text-[10px] text-glupp-accent uppercase tracking-wider font-semibold mt-3">En attente ({crew.pending_members.length})</p>
                {crew.pending_members.map((member: any) => (
                  <div key={member.user_id} className="flex items-center gap-2.5 py-1.5">
                    <div className="relative"><Avatar url={member.profile.avatar_url} name={member.profile.display_name || member.profile.username} size="sm" /><Clock size={8} className="absolute -bottom-0.5 -right-0.5 text-glupp-accent bg-glupp-card rounded-full" /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs font-medium text-glupp-cream truncate">{member.profile.display_name || member.profile.username}</p><p className="text-[10px] text-glupp-accent">En attente</p></div>
                    <button onClick={() => onKick(member.user_id, member.profile.username, true)} disabled={kickingUserId === member.user_id}
                      className="shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] text-glupp-text-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50">
                      {kickingUserId === member.user_id ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />} Annuler</button>
                  </div>
                ))}
              </>)}
              <div className="mt-3 pt-2 border-t border-glupp-border/30">
                <button onClick={onToggleInvite} className="flex items-center gap-1.5 text-xs font-semibold text-glupp-accent hover:text-glupp-accent/80 transition-colors"><UserPlus size={12} /> Inviter un ami</button>
                {invitingToCrewId === crew.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.15 }} className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                    {(() => {
                      const allIds = new Set([...crew.members.map((m: any) => m.user_id), ...(crew.pending_members || []).map((m: any) => m.user_id)]);
                      const available = friends.filter((f: any) => !allIds.has(f.friend_id));
                      if (available.length === 0) return <p className="text-[10px] text-glupp-text-muted py-2 text-center">Tous tes amis sont deja dans le crew</p>;
                      return available.map((friend: any) => {
                        const data = friend.friend_data;
                        return (<div key={friend.friend_id} className="flex items-center gap-2.5 py-1.5">
                          <Avatar url={data.avatar_url} name={data.display_name || data.username} size="sm" />
                          <p className="flex-1 text-xs font-medium text-glupp-cream truncate">{data.display_name || data.username}</p>
                          <button onClick={() => onInvite(friend.friend_id)} disabled={invitingUserId === friend.friend_id}
                            className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-glupp-accent/10 text-glupp-accent text-[10px] font-semibold rounded hover:bg-glupp-accent/20 disabled:opacity-50 transition-colors">
                            {invitingUserId === friend.friend_id ? <Loader2 size={10} className="animate-spin" /> : <UserPlus size={10} />} Inviter</button>
                        </div>);
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
        <button onClick={onLeave} disabled={isLeaving} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-glupp-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-glupp transition-colors disabled:opacity-50">
          {isLeaving ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />} Quitter le crew
        </button>
      </div>
    </motion.div>
  );
}

export function CrewSection() {
  const { crews, isLoading, invites, acceptInvite, acceptingInvite, declineInvite, leaveCrew, kickFromCrew, inviteToCrew } = useCrews();
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
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setCurrentUserId(user.id); });
  }, []);

  if (isLoading) return <div className="px-4 space-y-3"><Skeleton className="h-8 w-32" /><Skeleton className="h-36" /></div>;

  const handleAcceptInvite = async (crewId: string) => { setProcessingInviteId(crewId); try { await acceptInvite(crewId); } catch {} finally { setProcessingInviteId(null); } };
  const handleDeclineInvite = async (crewId: string) => { setProcessingInviteId(crewId); try { await declineInvite(crewId); } catch {} finally { setProcessingInviteId(null); } };
  const handleLeaveCrew = async (crewId: string, name: string) => { if (!window.confirm(`Quitter "${name}" ?`)) return; setLeavingCrewId(crewId); try { await leaveCrew(crewId); } catch {} finally { setLeavingCrewId(null); } };
  const handleKick = async (crewId: string, userId: string, username: string, isPending: boolean) => { if (!window.confirm(`${isPending ? "Annuler l'invitation de" : "Retirer"} @${username} ?`)) return; setKickingUserId(userId); try { await kickFromCrew(crewId, userId); } catch {} finally { setKickingUserId(null); } };

  return (
    <>
      <div className="space-y-4 px-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-glupp-text-soft uppercase tracking-wider">Tes Crews</h3>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-glupp-accent text-glupp-bg rounded-full text-xs font-medium hover:bg-glupp-accent/90 transition-colors"><Plus size={14} /> Creer</button>
        </div>
        {invites.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-glupp-accent"><Mail size={14} /><span>{invites.length} invitation{invites.length > 1 ? "s" : ""}</span></div>
            {invites.map((invite) => {
              const proc = processingInviteId === invite.crew_id;
              return (<motion.div key={invite.crew_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-glupp-accent/5 border border-glupp-accent/20 rounded-glupp-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1"><p className="font-display font-bold text-glupp-cream text-sm truncate">{invite.crew_name}</p><p className="text-[10px] text-glupp-text-muted mt-0.5">Par @{invite.invited_by_username} · {invite.member_count} membre{invite.member_count > 1 ? "s" : ""}</p></div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => handleAcceptInvite(invite.crew_id)} disabled={proc} className="flex items-center gap-1 px-3 py-1.5 bg-glupp-accent text-glupp-bg rounded-glupp text-xs font-semibold disabled:opacity-50 transition-colors">{proc && acceptingInvite ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Rejoindre</button>
                    <button onClick={() => handleDeclineInvite(invite.crew_id)} disabled={proc} className="px-2.5 py-1.5 bg-glupp-card border border-glupp-border rounded-glupp text-xs text-glupp-text-muted disabled:opacity-50"><X size={12} /></button>
                  </div>
                </div>
              </motion.div>);
            })}
          </div>
        )}
        {crews.length === 0 && invites.length === 0 ? (
          <div className="text-center py-10">
            <Users className="w-10 h-10 text-glupp-text-muted mx-auto mb-3" /><p className="text-sm text-glupp-text-muted">Pas encore de crew</p>
            <button onClick={() => setShowCreateModal(true)} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-glupp-accent text-glupp-bg rounded-full text-sm font-semibold hover:bg-glupp-accent/90 transition-colors"><Plus size={16} /> Creer mon premier crew</button>
          </div>
        ) : (
          <div className="space-y-3">
            {crews.map((crew, i) => (<CrewCard key={crew.id} crew={crew} index={i} friends={friends} currentUserId={currentUserId}
              isLeaving={leavingCrewId === crew.id} isExpanded={expandedCrewId === crew.id}
              invitingToCrewId={invitingToCrewId} invitingUserId={invitingUserId} kickingUserId={kickingUserId}
              onToggleExpand={() => setExpandedCrewId(expandedCrewId === crew.id ? null : crew.id)}
              onToggleInvite={() => setInvitingToCrewId(invitingToCrewId === crew.id ? null : crew.id)}
              onLeave={() => handleLeaveCrew(crew.id, crew.name)}
              onKick={(userId, username, isPending) => handleKick(crew.id, userId, username, isPending)}
              onInvite={async (friendId) => { setInvitingUserId(friendId); try { await inviteToCrew(crew.id, friendId); } catch {} finally { setInvitingUserId(null); } }}
              onPlanEvent={() => { setEventModalCrewId(crew.id); setEventModalCrewName(crew.name); }}
              openUserProfileModal={openUserProfileModal}
            />))}
          </div>
        )}
      </div>
      <CreateCrewModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      {eventModalCrewId && (<CreateEventModal isOpen={!!eventModalCrewId} onClose={() => { setEventModalCrewId(null); setEventModalCrewName(""); }} crewId={eventModalCrewId} crewName={eventModalCrewName} />)}
    </>
  );
}
