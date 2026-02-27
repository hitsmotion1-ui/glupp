"use client";

import { useLiveFeed, type LiveEvent } from "@/lib/hooks/useLiveFeed";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Swords, Trophy, TrendingUp } from "lucide-react";
import { beerEmoji } from "@/lib/utils/xp";

function LiveEventCard({ event }: { event: LiveEvent }) {
  const timeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 10) return "à l'instant";
    if (seconds < 60) return `il y a ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `il y a ${hours}h`;
  };

  const getEventContent = () => {
    switch (event.type) {
      case "glupp":
        return {
          icon: beerEmoji(event.beerStyle || ""),
          text: (
            <>
              a gluppé{" "}
              <span className="text-glupp-cream font-medium">
                {event.beerName}
              </span>
            </>
          ),
          color: "text-glupp-accent",
        };
      case "duel":
        return {
          icon: "⚔️",
          text: "a voté dans un duel",
          color: "text-glupp-rare",
        };
      case "trophy":
        return {
          icon: "🏆",
          text: (
            <>
              a débloqué un trophée :{" "}
              <span className="text-glupp-gold font-medium">
                {String(event.metadata?.trophy_name || "???")}
              </span>
            </>
          ),
          color: "text-glupp-gold",
        };
      case "level_up":
        return {
          icon: "⬆️",
          text: (
            <>
              est passé niveau{" "}
              <span className="text-glupp-epic font-medium">
                {String(event.metadata?.level_name || "???")}
              </span>
            </>
          ),
          color: "text-glupp-epic",
        };
      default:
        return {
          icon: "🍺",
          text: "a fait quelque chose",
          color: "text-glupp-text-soft",
        };
    }
  };

  const content = getEventContent();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: "auto" }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div className="flex items-center gap-2.5 py-2 px-3 bg-glupp-card-alt/50 rounded-glupp">
        <Avatar
          url={event.avatarUrl}
          name={event.displayName}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-glupp-text-soft leading-snug">
            <span className="text-glupp-cream font-medium">
              {event.displayName}
            </span>{" "}
            {content.text}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-sm">{content.icon}</span>
          <span className="text-[9px] text-glupp-text-muted whitespace-nowrap">
            {timeAgo(event.timestamp)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function LiveFeed() {
  const { events, connected } = useLiveFeed();

  return (
    <div className="space-y-3">
      {/* Connection status */}
      <div className="flex items-center gap-2 px-1">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            connected
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {connected ? (
            <>
              <Wifi size={12} />
              <span>En direct</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </>
          ) : (
            <>
              <WifiOff size={12} />
              <span>Connexion...</span>
            </>
          )}
        </div>
        {events.length > 0 && (
          <span className="text-[10px] text-glupp-text-muted">
            {events.length} événement{events.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Live events list */}
      <div className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <p className="text-3xl mb-2">📡</p>
              <p className="text-sm text-glupp-text-soft">
                En attente d&apos;activité en direct...
              </p>
              <p className="text-[10px] text-glupp-text-muted mt-1">
                Les événements apparaîtront ici en temps réel
              </p>
            </motion.div>
          ) : (
            events.map((event) => (
              <LiveEventCard key={event.id} event={event} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
