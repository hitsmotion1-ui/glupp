"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface CrewEvent {
  id: string;
  crew_id: string;
  created_by: string;
  title: string;
  bar_id: string | null;
  bar_name: string | null;
  location: string | null;
  event_date: string;
  description: string | null;
  status: "upcoming" | "cancelled" | "past";
  created_at: string;
  creator?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  responses: EventResponse[];
  my_response: string | null;
}

export interface EventResponse {
  user_id: string;
  response: "going" | "maybe" | "not_going";
  responded_at: string;
  profile: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

// ═══════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════

export function useCrewEvents(crewId: string | null) {
  const queryClient = useQueryClient();

  // ─── Fetch events for a crew ───
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["crew-events", crewId],
    queryFn: async () => {
      if (!crewId) return [];

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch upcoming events
      const { data: eventsData, error } = await supabase
        .from("crew_events")
        .select("*, creator:profiles!created_by(username, display_name, avatar_url)")
        .eq("crew_id", crewId)
        .in("status", ["upcoming"])
        .order("event_date", { ascending: true });

      if (error || !eventsData) return [];

      // Fetch responses for all events
      const eventIds = eventsData.map((e) => e.id);
      if (eventIds.length === 0) return [];

      const { data: responsesData } = await supabase
        .from("crew_event_responses")
        .select("event_id, user_id, response, responded_at, profile:profiles!user_id(username, display_name, avatar_url)")
        .in("event_id", eventIds);

      const responsesByEvent = new Map<string, EventResponse[]>();
      for (const r of responsesData || []) {
        const list = responsesByEvent.get(r.event_id) || [];
        list.push({
          user_id: r.user_id,
          response: r.response as EventResponse["response"],
          responded_at: r.responded_at,
          profile: r.profile as unknown as EventResponse["profile"],
        });
        responsesByEvent.set(r.event_id, list);
      }

      return eventsData.map((event): CrewEvent => {
        const responses = responsesByEvent.get(event.id) || [];
        const myResponse = responses.find((r) => r.user_id === user.id);
        return {
          ...event,
          creator: event.creator as unknown as CrewEvent["creator"],
          responses,
          my_response: myResponse?.response || null,
        };
      });
    },
    enabled: !!crewId,
    staleTime: 30 * 1000,
  });

  // ─── Create event ───
  const createEventMutation = useMutation({
    mutationFn: async ({
      crewId,
      title,
      eventDate,
      barId,
      barName,
      location,
      description,
    }: {
      crewId: string;
      title: string;
      eventDate: string;
      barId?: string | null;
      barName?: string | null;
      location?: string | null;
      description?: string | null;
    }) => {
      const { data, error } = await supabase.rpc("create_crew_event", {
        p_crew_id: crewId,
        p_title: title,
        p_event_date: eventDate,
        p_bar_id: barId || null,
        p_bar_name: barName || null,
        p_location: location || null,
        p_description: description || null,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew-events", crewId] });
    },
  });

  // ─── Respond to event ───
  const respondMutation = useMutation({
    mutationFn: async ({
      eventId,
      response,
    }: {
      eventId: string;
      response: "going" | "maybe" | "not_going";
    }) => {
      const { error } = await supabase.rpc("respond_crew_event", {
        p_event_id: eventId,
        p_response: response,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew-events", crewId] });
    },
  });

  // ─── Cancel event ───
  const cancelMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.rpc("cancel_crew_event", {
        p_event_id: eventId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew-events", crewId] });
    },
  });

  return {
    events,
    isLoading,

    createEvent: (params: {
      crewId: string;
      title: string;
      eventDate: string;
      barId?: string | null;
      barName?: string | null;
      location?: string | null;
      description?: string | null;
    }) => createEventMutation.mutateAsync(params),
    creatingEvent: createEventMutation.isPending,

    respondToEvent: (eventId: string, response: "going" | "maybe" | "not_going") =>
      respondMutation.mutateAsync({ eventId, response }),
    responding: respondMutation.isPending,

    cancelEvent: (eventId: string) => cancelMutation.mutateAsync(eventId),
    cancelling: cancelMutation.isPending,
  };
}
