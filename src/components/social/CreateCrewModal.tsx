"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { useFriends } from "@/lib/hooks/useFriends";
import { useCrews } from "@/lib/hooks/useCrews";
import { Users, Check, Loader2, Plus } from "lucide-react";

interface CreateCrewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCrewModal({ isOpen, onClose }: CreateCrewModalProps) {
  const [name, setName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );

  const { friends } = useFriends();
  const { createCrew, creatingCrew } = useCrews();

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim() || name.trim().length < 2) return;
    try {
      await createCrew(name.trim(), Array.from(selectedMembers));
      setName("");
      setSelectedMembers(new Set());
      onClose();
    } catch (err) {
      console.error("create crew error:", err);
    }
  };

  const canCreate = name.trim().length >= 2 && !creatingCrew;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer un Crew">
      <div className="space-y-5 pb-4">
        {/* Crew name input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-glupp-text-soft uppercase tracking-wider">
            Nom du crew
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Les Brasseurs du Sud"
            maxLength={30}
            className="w-full px-4 py-3 bg-glupp-card-alt border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          />
          <p className="text-[10px] text-glupp-text-muted text-right">
            {name.length}/30
          </p>
        </div>

        {/* Select friends */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-glupp-text-soft uppercase tracking-wider">
            Inviter des amis ({selectedMembers.size} sélectionnés)
          </label>

          {friends.length === 0 ? (
            <div className="text-center py-6">
              <Users className="w-8 h-8 text-glupp-text-muted mx-auto mb-2" />
              <p className="text-xs text-glupp-text-muted">
                Ajoute des amis d'abord !
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {friends.map((friend) => {
                const data = friend.friend_data;
                const isSelected = selectedMembers.has(friend.friend_id);

                return (
                  <motion.button
                    key={friend.friend_id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleMember(friend.friend_id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-glupp border transition-all text-left ${
                      isSelected
                        ? "bg-glupp-accent/10 border-glupp-accent/40"
                        : "bg-glupp-card border-glupp-border hover:border-glupp-accent/20"
                    }`}
                  >
                    <Avatar
                      url={data.avatar_url}
                      name={data.display_name || data.username}
                      size="sm"
                    />
                    <span className="flex-1 text-sm font-medium text-glupp-cream truncate">
                      {data.display_name || data.username}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? "bg-glupp-accent border-glupp-accent"
                          : "border-glupp-border"
                      }`}
                    >
                      {isSelected && (
                        <Check size={12} className="text-glupp-bg" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Create button */}
        <button
          onClick={handleCreate}
          disabled={!canCreate}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-glupp-lg font-semibold text-sm transition-all ${
            canCreate
              ? "bg-glupp-accent text-glupp-bg hover:bg-glupp-accent/90 active:scale-[0.98]"
              : "bg-glupp-card-alt text-glupp-text-muted cursor-not-allowed"
          }`}
        >
          {creatingCrew ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Plus size={18} />
          )}
          {creatingCrew ? "Création..." : "Créer le crew"}
        </button>
      </div>
    </Modal>
  );
}
