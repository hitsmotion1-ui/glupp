"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAppStore } from "@/lib/store/useAppStore";
import { useFriends } from "@/lib/hooks/useFriends";
import { getLevel } from "@/lib/utils/xp";
import { UserPlus, Check, X, Users, Loader2, Clock, UserMinus, XCircle } from "lucide-react";

type FriendTab = "friends" | "requests";

export function FriendList() {
  const [tab, setTab] = useState<FriendTab>("friends");
  const setShowFriendSearch = useAppStore((s) => s.setShowFriendSearch);
  const openUserProfileModal = useAppStore((s) => s.openUserProfileModal);

  const { friends, requests, sentRequests, isLoading, acceptRequest, rejectRequest, cancelRequest, removeFriend } =
    useFriends();

  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleAccept = async (friendshipId: string) => {
    setLoadingIds((prev) => new Set(prev).add(friendshipId));
    setActionError(null);
    try {
      await acceptRequest(friendshipId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur lors de l'acceptation");
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
    setActionError(null);
    try {
      await rejectRequest(friendshipId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur lors du refus");
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(friendshipId);
        return next;
      });
    }
  };

  const handleCancel = async (friendshipId: string) => {
    setLoadingIds((prev) => new Set(prev).add(friendshipId));
    setConfirmCancelId(null);
    setActionError(null);
    try {
      await cancelRequest(friendshipId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur lors de l'annulation");
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(friendshipId);
        return next;
      });
    }
  };

  const handleRemove = async (friendshipId: string) => {
    setLoadingIds((prev) => new Set(prev).add(friendshipId));
    setConfirmRemoveId(null);
    try {
      await removeFriend(friendshipId);
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
          label={`Demandes${requests.length + sentRequests.length > 0 ? ` (${requests.length + sentRequests.length})` : ""}`}
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
                const isRemoving = loadingIds.has(f.friendship_id);
                const isConfirming = confirmRemoveId === f.friendship_id;

                return (
                  <div
                    key={f.friendship_id}
                    className="flex items-center gap-3 p-3 bg-glupp-card border border-glupp-border rounded-glupp transition-colors"
                  >
                    {/* Clickable profile area */}
                    <button
                      onClick={() => {
                        setConfirmRemoveId(null);
                        openUserProfileModal(f.friend_id);
                      }}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                    >
                      <Avatar
                        url={data.avatar_url}
                        name={data.display_name || data.username}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-glupp-cream truncate">
                          {data.display_name || data.username}
                        </p>
                        <p className="text-xs text-glupp-text-muted">
                          {level.icon} Nv.{level.level} · {data.beers_tasted}{" "}
                          bières · {data.duels_played} duels
                        </p>
                      </div>
                    </button>

                    {/* Remove button / confirmation */}
                    {isRemoving ? (
                      <Loader2 size={18} className="animate-spin text-glupp-text-muted shrink-0" />
                    ) : isConfirming ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-glupp-text-muted">Retirer ?</span>
                        <button
                          onClick={() => handleRemove(f.friendship_id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-glupp-error/20 text-glupp-error hover:bg-glupp-error/30 transition-colors"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmRemoveId(null)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-glupp-card-alt text-glupp-text-muted hover:bg-glupp-border transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemoveId(f.friendship_id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-glupp-text-muted hover:text-glupp-error hover:bg-glupp-error/10 transition-colors shrink-0"
                        title="Retirer cet ami"
                      >
                        <UserMinus size={16} />
                      </button>
                    )}
                  </div>
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
            {requests.length === 0 && sentRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-glupp-text-muted">
                  Aucune demande en attente
                </p>
              </div>
            ) : (
              <>
                {/* Error banner */}
                {actionError && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-glupp bg-glupp-error/10 border border-glupp-error/30 text-xs text-glupp-error">
                    <XCircle size={14} className="shrink-0" />
                    <span>{actionError}</span>
                    <button
                      onClick={() => setActionError(null)}
                      className="ml-auto shrink-0 hover:opacity-70"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Received requests - with accept/reject/cancel buttons */}
                {requests.length > 0 && (
                  <>
                    <p className="text-xs font-medium text-glupp-text-muted uppercase tracking-wide">
                      Demandes reçues
                    </p>
                    {requests.map((r) => {
                      const data = r.friend_data;
                      const loading = loadingIds.has(r.friendship_id);
                      const level = getLevel(data.xp);
                      // initiated_by === null means legacy row — both can cancel
                      const canCancel = r.initiated_by === null;
                      const isConfirmingCancel = confirmCancelId === r.friendship_id;

                      return (
                        <div
                          key={r.friendship_id}
                          className="flex items-center gap-3 p-3 bg-glupp-card border border-glupp-border rounded-glupp"
                        >
                          <button
                            onClick={() => openUserProfileModal(r.friend_id)}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                          >
                            <Avatar
                              url={data.avatar_url}
                              name={data.display_name || data.username}
                              size="md"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-glupp-cream truncate">
                                {data.display_name || data.username}
                              </p>
                              <p className="text-xs text-glupp-text-muted">
                                {level.icon} Nv.{level.level} · {data.beers_tasted}{" "}
                                bières
                              </p>
                            </div>
                          </button>

                          {loading ? (
                            <Loader2 size={20} className="animate-spin text-glupp-accent shrink-0" />
                          ) : isConfirmingCancel ? (
                            /* Cancel confirmation (for legacy NULL rows) */
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-xs text-glupp-text-muted">Annuler ?</span>
                              <button
                                onClick={() => handleCancel(r.friendship_id)}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-glupp-error/20 text-glupp-error hover:bg-glupp-error/30 transition-colors"
                                title="Confirmer l'annulation"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => setConfirmCancelId(null)}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-glupp-card-alt text-glupp-text-muted hover:bg-glupp-border transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleAccept(r.friendship_id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-glupp-success/20 text-glupp-success hover:bg-glupp-success/30 transition-colors"
                                title="Accepter"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => handleReject(r.friendship_id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-glupp-error/20 text-glupp-error hover:bg-glupp-error/30 transition-colors"
                                title="Refuser"
                              >
                                <X size={16} />
                              </button>
                              {/* Cancel button — shown when we don't know who initiated */}
                              {canCancel && (
                                <button
                                  onClick={() => setConfirmCancelId(r.friendship_id)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full text-glupp-text-muted hover:text-glupp-error hover:bg-glupp-error/10 transition-colors"
                                  title="Annuler cette demande"
                                >
                                  <Clock size={15} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Sent requests - cancelable */}
                {sentRequests.length > 0 && (
                  <>
                    <p className="text-xs font-medium text-glupp-text-muted uppercase tracking-wide mt-3">
                      Demandes envoyées
                    </p>
                    {sentRequests.map((r) => {
                      const data = r.friend_data;
                      const level = getLevel(data.xp);
                      const loading = loadingIds.has(r.friendship_id);
                      const isConfirming = confirmCancelId === r.friendship_id;

                      return (
                        <div
                          key={r.friendship_id}
                          className="flex items-center gap-3 p-3 bg-glupp-card border border-glupp-border rounded-glupp"
                        >
                          <button
                            onClick={() => {
                              setConfirmCancelId(null);
                              openUserProfileModal(r.friend_id);
                            }}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                          >
                            <Avatar
                              url={data.avatar_url}
                              name={data.display_name || data.username}
                              size="md"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-glupp-cream truncate">
                                {data.display_name || data.username}
                              </p>
                              <p className="text-xs text-glupp-text-muted">
                                {level.icon} Nv.{level.level} · {data.beers_tasted}{" "}
                                bières
                              </p>
                            </div>
                          </button>

                          {loading ? (
                            <Loader2 size={18} className="animate-spin text-glupp-text-muted shrink-0" />
                          ) : isConfirming ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-xs text-glupp-text-muted">Annuler ?</span>
                              <button
                                onClick={() => handleCancel(r.friendship_id)}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-glupp-error/20 text-glupp-error hover:bg-glupp-error/30 transition-colors"
                                title="Confirmer l'annulation"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => setConfirmCancelId(null)}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-glupp-card-alt text-glupp-text-muted hover:bg-glupp-border transition-colors"
                                title="Garder la demande"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmCancelId(r.friendship_id)}
                              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-glupp-text-muted border border-glupp-border hover:text-glupp-error hover:border-glupp-error/40 hover:bg-glupp-error/10 transition-colors"
                              title="Annuler la demande d'ami"
                            >
                              <Clock size={12} />
                              <span>En attente</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
