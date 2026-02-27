"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface LiveEvent {
  id: string;
  type: "glupp" | "duel" | "trophy" | "level_up";
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  beerName: string | null;
  beerStyle: string | null;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

const MAX_EVENTS = 50;

export function useLiveFeed() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const addEvent = useCallback((event: LiveEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
  }, []);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    try {
      channel = supabase
        .channel("glupp-live", {
          config: { broadcast: { self: true } },
        })
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "activities",
          },
          async (payload) => {
            try {
              const activity = payload.new;
              if (!activity) return;

              const { data: profile } = await supabase
                .from("profiles")
                .select("username, display_name, avatar_url")
                .eq("id", activity.user_id)
                .single();

              let beerName: string | null = null;
              let beerStyle: string | null = null;
              if (activity.beer_id) {
                const { data: beer } = await supabase
                  .from("beers")
                  .select("name, style")
                  .eq("id", activity.beer_id)
                  .single();
                if (beer) {
                  beerName = beer.name;
                  beerStyle = beer.style;
                }
              }

              const event: LiveEvent = {
                id: activity.id,
                type: activity.type,
                userId: activity.user_id,
                username: profile?.username || "?",
                displayName: profile?.display_name || profile?.username || "?",
                avatarUrl: profile?.avatar_url || null,
                beerName,
                beerStyle,
                metadata: activity.metadata || {},
                timestamp: new Date(activity.created_at),
              };

              addEvent(event);
            } catch (err) {
              console.error("LiveFeed event processing error:", err);
            }
          }
        )
        .subscribe((status) => {
          setConnected(status === "SUBSCRIBED");
        });

      channelRef.current = channel;
    } catch (err) {
      console.error("LiveFeed init error:", err);
    }

    return () => {
      if (channel) {
        try { channel.unsubscribe(); } catch { /* ignore */ }
      }
    };
  }, [addEvent]);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      setConnected(false);
    }
  }, []);

  return {
    events,
    connected,
    disconnect,
  };
}
