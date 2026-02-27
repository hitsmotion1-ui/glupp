"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAppStore } from "@/lib/store/useAppStore";
import { useFriends } from "@/lib/hooks/useFriends";
import { getLevel } from "@/lib/utils/xp";
import { UserPlus, Check, X, Users, Loader2 } from "lucide-react";

type FriendTab = "friends" | "requests";

export function FriendList() {
  const [tab, setTab] = useState<FriendTab>("friends");
  const setShowFriendSearch = useAppStore((s) => s.setShowFriendSearch);
  const openUserProfileModal = useAppStore((s) => s.openUserProfileModal);

  const { friends, requests, isLoading, acceptRequest, rejectRequest } =
    useFriends();

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

  if (isLoading) {
    return (
      <div className="px-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add friend button + tabs */}
      <div className="px-4 flex items-center gap-2">
        <button
          onClick={() => setShowFriendSearch(true)}
          className="flex items-center gap-2 px-4 py-2 bg-glupp-accent text-glupp-bg rounded-full text-sm font-medium hover:bg-glupp-accent/90 transition-colors"
        >
          <UserPlus size={16} />
          Ajouter
        </button>

        <div className="flex-1" />

        <Pill
          label="Amis"
          active={tab === "friends"}
          onClick={() => setTab("friends")}
        />
        <Pill
          label={`Demandes${requests.length > 0 ? ` (${requests.length})` : ""}`}
          active={tab === "requests"}
          onClick={() => setTab("requests")}
          color={requests.length > 0 ? "#E05252" : undefined}
        />
      </div>

      <AnimatePresence mode="wait">
        {tab === "friends" && (
          <motion.div
            key="friends"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="px-4 space-y-2"
          >
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-glupp-text-muted mx-auto mb-3" />
                <p className="text-sm text-glupp-text-muted">
                  Pas encore d'amis. Ajoutes-en !
                </p>
              </div>
            ) : (
              friends.map((f) => {
                const data = f.friend_data;
                const level = getLevel(data.xp);

                return (
                  <button
                    key={f.friendship_id}
                    onClick={() => openUserProfileModal(f.friend_id)}
                    className="w-full flex items-center gap-3 p-3 bg-glupp-card border border-glupp-border rounded-glupp hover:border-glupp-accent/30 transition-colors text-left"
                  >
                    <Avatar
                      url={data.avatar_url}
                      name={data.display_name || data.username}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-glupp-cream truncate">
                        {data.display_name || data.username}
                      </p>
                      <p className="text-xs text-glupp-text-muted">
                        {level.icon} Nv.{level.level} · {data.beers_tasted}{" "}
                        bières · {data.duels_played} duels
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </motion.div>
        )}

        {tab === "requests" && (
          <motion.div
            key="requests"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="px-4 space-y-2"
          >
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-glupp-text-muted">
                  Aucune demande en attente
                </p>
              </div>
            ) : (
              requests.map((r) => {
                const data = r.friend_data;
                const loading = loadingIds.has(r.friendship_id);
                const level = getLevel(data.xp);

                return (
                  <div
                    key={r.friendship_id}
                    className="flex items-center gap-3 p-3 bg-glupp-card border border-glupp-border rounded-glupp"
                  >
                    <Avatar
                      url={data.avatar_url}
                      name={data.display_name || data.username}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-glupp-cream truncate">
                        {data.display_name || data.username}
                      </p>
                      <p className="text-xs text-glupp-text-muted">
                        {level.icon} Nv.{level.level} · {data.beers_tasted}{" "}
                        bières
                      </p>
                    </div>

                    {loading ? (
                      <Loader2 size={20} className="animate-spin text-glupp-accent" />
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(r.friendship_id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-glupp-success/20 text-glupp-success hover:bg-glupp-success/30 transition-colors"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleReject(r.friendship_id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-glupp-error/20 text-glupp-error hover:bg-glupp-error/30 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
