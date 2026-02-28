"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAppStore } from "@/lib/store/useAppStore";
import {
  useNotifications,
  type UnifiedNotification,
} from "@/lib/hooks/useNotifications";
import { useFriends } from "@/lib/hooks/useFriends";
import {
  UserPlus,
  AtSign,
  Bell,
  Check,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  Zap,
  Beer,
  MapPin,
  Megaphone,
  Eye,
} from "lucide-react";
import { useState } from "react";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "a l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  const weeks = Math.floor(days / 7);
  return `il y a ${weeks}sem`;
}

// ─── Persistent notification card ──────────────────────────────

function PersistentNotifCard({
  notif,
  onMarkRead,
}: {
  notif: UnifiedNotification;
  onMarkRead: (id: string) => void;
}) {
  const p = notif.persistent!;

  const configMap: Record<
    string,
    {
      icon: typeof Bell;
      iconBg: string;
      iconColor: string;
      accentBorder: string;
    }
  > = {
    submission_approved: {
      icon: CheckCircle2,
      iconBg: "bg-green-500/15",
      iconColor: "text-green-500",
      accentBorder: "border-l-green-500",
    },
    submission_rejected: {
      icon: XCircle,
      iconBg: "bg-red-500/15",
      iconColor: "text-red-500",
      accentBorder: "border-l-red-500",
    },
    xp_reward: {
      icon: Zap,
      iconBg: "bg-[#F0C460]/15",
      iconColor: "text-[#F0C460]",
      accentBorder: "border-l-[#F0C460]",
    },
    admin_new_submission: {
      icon: Megaphone,
      iconBg: "bg-[#E08840]/15",
      iconColor: "text-[#E08840]",
      accentBorder: "border-l-[#E08840]",
    },
    system: {
      icon: Bell,
      iconBg: "bg-glupp-accent/15",
      iconColor: "text-glupp-accent",
      accentBorder: "border-l-glupp-accent",
    },
  };

  const config = configMap[p.type] || configMap.system;
  const Icon = config.icon;
  const typeSubIcon =
    p.metadata?.type === "beer"
      ? Beer
      : p.metadata?.type === "bar"
        ? MapPin
        : null;

  return (
    <div
      className={`relative flex items-start gap-3 p-3 bg-glupp-card border border-glupp-border rounded-glupp border-l-2 ${config.accentBorder} ${
        !p.is_read ? "bg-glupp-accent/5" : ""
      }`}
    >
      {/* Icon */}
      <div className="relative shrink-0">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center ${config.iconBg}`}
        >
          <Icon size={18} className={config.iconColor} />
        </div>
        {typeSubIcon && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-glupp-card flex items-center justify-center">
            {typeSubIcon === Beer ? (
              <Beer size={9} className="text-[#E08840]" />
            ) : (
              <MapPin size={9} className="text-[#4ECDC4]" />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-glupp-cream">{p.title}</p>
        {p.message && (
          <p className="text-xs text-glupp-text-muted mt-0.5 leading-relaxed">
            {p.message}
          </p>
        )}
        {Number(p.metadata?.xp_gained) > 0 && (
          <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-[#F0C460]/15 text-[10px] font-bold text-[#F0C460]">
            <Zap size={9} />+{String(p.metadata.xp_gained)} XP
          </span>
        )}
        {Number(p.metadata?.xp_amount) > 0 && !p.metadata?.xp_gained && (
          <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-[#F0C460]/15 text-[10px] font-bold text-[#F0C460]">
            <Zap size={9} />+{String(p.metadata.xp_amount)} XP
          </span>
        )}
        <p className="text-[10px] text-glupp-text-muted mt-0.5">
          {timeAgo(p.created_at)}
        </p>
      </div>

      {/* Mark as read */}
      {!p.is_read && (
        <button
          onClick={() => onMarkRead(p.id)}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-glupp-text-muted hover:text-glupp-cream hover:bg-glupp-border/50 transition-colors"
          title="Marquer comme lu"
        >
          <Eye size={12} />
        </button>
      )}

      {/* Unread dot */}
      {!p.is_read && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-glupp-accent" />
      )}
    </div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────

export function NotificationModal() {
  const showNotifications = useAppStore((s) => s.showNotifications);
  const setShowNotifications = useAppStore((s) => s.setShowNotifications);
  const openUserProfileModal = useAppStore((s) => s.openUserProfileModal);

  const { notifications, isLoading, markAsRead, markAllAsRead } =
    useNotifications();
  const { acceptRequest, rejectRequest } = useFriends();
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const handleAccept = async (friendshipId: string) => {
    setLoadingIds((prev) => new Set(prev).add(friendshipId));
    try {
      await acceptRequest(friendshipId);
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(friendshipId);
        return next;
      });
    }
  };

  const handleReject = async (friendshipId: string) => {
    setLoadingIds((prev) => new Set(prev).add(friendshipId));
    try {
      await rejectRequest(friendshipId);
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(friendshipId);
        return next;
      });
    }
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <Modal
      isOpen={showNotifications}
      onClose={() => setShowNotifications(false)}
      title="Notifications"
    >
      {/* Mark all as read button */}
      {hasUnread && !isLoading && (
        <button
          onClick={markAllAsRead}
          className="mb-3 text-xs text-glupp-accent hover:underline"
        >
          Tout marquer comme lu
        </button>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-10 h-10 text-glupp-text-muted mx-auto mb-3" />
          <p className="text-sm text-glupp-text-muted">
            Aucune notification
          </p>
          <p className="text-xs text-glupp-text-muted mt-1">
            Tes notifications apparaitront ici
          </p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {notifications.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: Math.min(i * 0.04, 0.2) }}
              >
                {notif.kind === "persistent" ? (
                  <PersistentNotifCard
                    notif={notif}
                    onMarkRead={markAsRead}
                  />
                ) : (
                  /* Legacy notification (friend request / activity tag) */
                  <div className="flex items-start gap-3 p-3 bg-glupp-card border border-glupp-border rounded-glupp">
                    {/* Icon type indicator */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          openUserProfileModal(
                            notif.legacy!.data.from_user.id
                          );
                          setShowNotifications(false);
                        }}
                      >
                        <Avatar
                          url={notif.legacy!.data.from_user.avatar_url}
                          name={
                            notif.legacy!.data.from_user.display_name ||
                            notif.legacy!.data.from_user.username
                          }
                          size="sm"
                        />
                      </button>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ${
                          notif.type === "friend_request"
                            ? "bg-glupp-accent"
                            : "bg-glupp-rarity-rare"
                        }`}
                      >
                        {notif.type === "friend_request" ? (
                          <UserPlus size={9} className="text-glupp-bg" />
                        ) : (
                          <AtSign size={9} className="text-glupp-bg" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-glupp-cream">
                        <button
                          onClick={() => {
                            openUserProfileModal(
                              notif.legacy!.data.from_user.id
                            );
                            setShowNotifications(false);
                          }}
                          className="font-semibold hover:text-glupp-accent transition-colors"
                        >
                          {notif.legacy!.data.from_user.display_name ||
                            notif.legacy!.data.from_user.username}
                        </button>{" "}
                        {notif.type === "friend_request"
                          ? "veut etre ton ami"
                          : `t'a mentionne${
                              notif.legacy!.data.beer
                                ? ` dans un glupp de ${notif.legacy!.data.beer.name}`
                                : ""
                            }`}
                      </p>
                      <p className="text-[10px] text-glupp-text-muted mt-0.5">
                        {timeAgo(notif.created_at)}
                      </p>
                    </div>

                    {/* Actions for friend requests */}
                    {notif.type === "friend_request" &&
                      notif.legacy!.data.friendship_id && (
                        <div className="flex gap-1.5 shrink-0">
                          {loadingIds.has(
                            notif.legacy!.data.friendship_id!
                          ) ? (
                            <Loader2
                              size={18}
                              className="animate-spin text-glupp-accent"
                            />
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  handleAccept(
                                    notif.legacy!.data.friendship_id!
                                  )
                                }
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-glupp-success/20 text-glupp-success hover:bg-glupp-success/30 transition-colors"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  handleReject(
                                    notif.legacy!.data.friendship_id!
                                  )
                                }
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-glupp-error/20 text-glupp-error hover:bg-glupp-error/30 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </Modal>
  );
}
