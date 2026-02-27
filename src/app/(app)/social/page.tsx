"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pill } from "@/components/ui/Pill";
import { ActivityFeed } from "@/components/social/ActivityFeed";
import { FriendList } from "@/components/social/FriendList";
import { FriendSearchModal } from "@/components/social/FriendSearchModal";
import { TrophyGrid } from "@/components/social/TrophyGrid";
import { CrewSection } from "@/components/social/CrewSection";
import { LiveFeed } from "@/components/social/LiveFeed";
import { GluppOfWeekBanner } from "@/components/gamification/GluppOfWeekBanner";
import { Rss, Users, Trophy, Shield, Wifi } from "lucide-react";

type SocialTab = "feed" | "friends" | "trophies" | "crews" | "live";

const TAB_CONFIG: Array<{ id: SocialTab; label: string; icon: React.ReactNode }> = [
  { id: "feed", label: "Fil", icon: <Rss size={14} /> },
  { id: "live", label: "Live", icon: <Wifi size={14} /> },
  { id: "friends", label: "Amis", icon: <Users size={14} /> },
  { id: "trophies", label: "Trophées", icon: <Trophy size={14} /> },
  { id: "crews", label: "Crews", icon: <Shield size={14} /> },
];

export default function SocialPage() {
  const [tab, setTab] = useState<SocialTab>("feed");
  return (
    <div className="pb-24">
      {/* GOTW Banner */}
      <div className="px-4 pt-4 pb-2">
        <GluppOfWeekBanner />
      </div>

      {/* Page header */}
      <div className="px-4 pt-2 pb-3">
        <h1 className="font-display text-2xl font-bold text-glupp-cream">
          Social
        </h1>
      </div>

      {/* Tab bar */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {TAB_CONFIG.map((t) => (
            <Pill
              key={t.id}
              label={t.label}
              active={tab === t.id}
              onClick={() => setTab(t.id)}
            />
          ))}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "feed" && (
          <motion.div
            key="feed"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
          >
            <ActivityFeed />
          </motion.div>
        )}

        {tab === "live" && (
          <motion.div
            key="live"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
            className="px-4"
          >
            <LiveFeed />
          </motion.div>
        )}

        {tab === "friends" && (
          <motion.div
            key="friends"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
          >
            <FriendList />
          </motion.div>
        )}

        {tab === "trophies" && (
          <motion.div
            key="trophies"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
          >
            <TrophyGrid />
          </motion.div>
        )}

        {tab === "crews" && (
          <motion.div
            key="crews"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
          >
            <CrewSection />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friend search modal (reads from store) */}
      <FriendSearchModal />
    </div>
  );
}
