"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { useAppStore } from "@/lib/store/useAppStore";
import { useFriends } from "@/lib/hooks/useFriends";
import { getLevel } from "@/lib/utils/xp";
import { Search, UserPlus, Clock, UserCheck, Loader2 } from "lucide-react";

export function FriendSearchModal() {
  const showFriendSearch = useAppStore((s) => s.showFriendSearch);
  const setShowFriendSearch = useAppStore((s) => s.setShowFriendSearch);

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    sendRequest,
    sendingRequest,
  } = useFriends();

  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const handleSend = async (userId: string) => {
    try {
      await sendRequest(userId);
      setSentIds((prev) => new Set(prev).add(userId));
    } catch (err) {
      console.error("send request error:", err);
    }
  };

  const handleClose = () => {
    setShowFriendSearch(false);
    setSearchQuery("");
    setSentIds(new Set());
  };

  const getButtonState = (
    userId: string,
    friendshipStatus: string | null
  ) => {
    if (friendshipStatus === "accepted") {
      return {
        icon: <UserCheck size={16} />,
        label: "Amis",
        disabled: true,
        className: "text-glupp-success",
      };
    }
    if (friendshipStatus === "pending" || sentIds.has(userId)) {
      return {
        icon: <Clock size={16} />,
        label: "Envoyé",
        disabled: true,
        className: "text-glupp-text-muted",
      };
    }
    return {
      icon: sendingRequest ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <UserPlus size={16} />
      ),
      label: "Ajouter",
      disabled: sendingRequest,
      className: "text-glupp-accent",
    };
  };

  return (
    <Modal
      isOpen={showFriendSearch}
      onClose={handleClose}
      title="Rechercher des amis"
    >
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-glupp-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nom d'utilisateur..."
            autoFocus
            className="w-full pl-10 pr-4 py-3 bg-glupp-bg border border-glupp-border rounded-glupp text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          />
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto space-y-2">
          {searching && (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-glupp-accent mx-auto" />
            </div>
          )}

          {!searching &&
            searchQuery.length >= 2 &&
            searchResults.length === 0 && (
              <p className="text-center py-8 text-glupp-text-muted text-sm">
                Aucun utilisateur trouvé
              </p>
            )}

          {!searching && searchQuery.length < 2 && (
            <p className="text-center py-8 text-glupp-text-muted text-sm">
              Tape au moins 2 caractères
            </p>
          )}

          {searchResults.map((user) => {
            const level = getLevel(user.xp);
            const btn = getButtonState(user.id, user.friendship_status);

            return (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 bg-glupp-card-alt rounded-glupp"
              >
                <Avatar
                  url={user.avatar_url}
                  name={user.display_name || user.username}
                  size="md"
                />

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-glupp-cream truncate">
                    {user.display_name || user.username}
                  </p>
                  <p className="text-xs text-glupp-text-muted">
                    @{user.username} · {level.icon} Nv.{level.level} ·{" "}
                    {user.beers_tasted} bières
                  </p>
                </div>

                <button
                  onClick={() => handleSend(user.id)}
                  disabled={btn.disabled}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${btn.className} ${
                    btn.disabled ? "opacity-60" : "hover:bg-glupp-accent/10"
                  }`}
                >
                  {btn.icon}
                  {btn.label}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
