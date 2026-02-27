"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAppStore } from "@/lib/store/useAppStore";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useFriends } from "@/lib/hooks/useFriends";
import { UserPlus, AtSign, Bell, Check, X, Loader2 } from "lucide-react";
import { useState } from "react";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  const weeks = Math.floor(days / 7);
  return `il y a ${weeks}sem`;
}

export function NotificationModal() {
  const showNotifications = useAppStore((s) => s.showNotifications);
  const setShowNotifications = useAppStore((s) => s.setShowNotifications);
  const openUserProfileModal = useAppStore((s) => s.openUserProfileModal);

  const { notifications, isLoading } = useNotifications();
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

  return (
    <Modal
      isOpen={showNotifications}
      onClose={() => setShowNotifications(false)}
      title="Notifications"
    >
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
            Tes notifications apparaîtront ici
          </p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {notifications.map((notif, i) => (
              <motion.div
                key={notif.notif_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: Math.min(i * 0.04, 0.2) }}
                className="flex items-start gap-3 p-3 bg-glupp-card border border-glupp-border rounded-glupp"
              >
                {/* Icon type indicator */}
                <div className="relative">
                  <button
                    onClick={() => {
                      openUserProfileModal(notif.data.from_user.id);
                      setShowNotifications(false);
                    }}
                  >
                    <Avatar
                      url={notif.data.from_user.avatar_url}
                      name={
                        notif.data.from_user.display_name ||
                        notif.data.from_user.username
                      }
                      size="sm"
                    />
                  </button>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ${
                      notif.notif_type === "friend_request"
                        ? "bg-glupp-accent"
                        : "bg-glupp-rarity-rare"
                    }`}
                  >
                    {notif.notif_type === "friend_request" ? (
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
                        openUserProfileModal(notif.data.from_user.id);
                        setShowNotifications(false);
                      }}
                      className="font-semibold hover:text-glupp-accent transition-colors"
                    >
                      {notif.data.from_user.display_name ||
                        notif.data.from_user.username}
                    </button>{" "}
                    {notif.notif_type === "friend_request"
                      ? "veut être ton ami"
                      : `t'a mentionné${
                          notif.data.beer
                            ? ` dans un glupp de ${notif.data.beer.name}`
                            : ""
                        }`}
                  </p>
                  <p className="text-[10px] text-glupp-text-muted mt-0.5">
                    {timeAgo(notif.created_at)}
                  </p>
                </div>

                {/* Actions for friend requests */}
                {notif.notif_type === "friend_request" &&
                  notif.data.friendship_id && (
                    <div className="flex gap-1.5 shrink-0">
                      {loadingIds.has(notif.data.friendship_id) ? (
                        <Loader2
                          size={18}
                          className="animate-spin text-glupp-accent"
                        />
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              handleAccept(notif.data.friendship_id!)
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-glupp-success/20 text-glupp-success hover:bg-glupp-success/30 transition-colors"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() =>
                              handleReject(notif.data.friendship_id!)
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-glupp-error/20 text-glupp-error hover:bg-glupp-error/30 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </>
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
