"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

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

export interface EventCheckin {
  id: string;
  user_id: string;
  photo_url: string;
  tagged_user_ids: string[];
  created_at: string;
  profile: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

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
  checkins: EventCheckin[];
  my_response: string | null;
}

// ═══════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════

export function useCrewEvents(crewId: string | null) {
  const queryClient = useQueryClient();
  const showXPToast = useAppStore((s) => s.showXPToast);

  // ─── Fetch events ───
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["crew-events", crewId],
    queryFn: async () => {
      if (!crewId) return [];

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: eventsData, error } = await supabase
        .from("crew_events")
        .select("*, creator:profiles!created_by(username, display_name, avatar_url)")
        .eq("crew_id", crewId)
        .eq("status", "upcoming")
        .order("event_date", { ascending: true });

      if (error || !eventsData) return [];

      const eventIds = eventsData.map((e) => e.id);
      if (eventIds.length === 0) return [];

      // Fetch responses
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

      // Fetch checkins
      const { data: checkinsData } = await supabase
        .from("crew_event_checkins")
        .select("id, event_id, user_id, photo_url, tagged_user_ids, created_at, profile:profiles!user_id(username, display_name, avatar_url)")
        .in("event_id", eventIds);

      const checkinsByEvent = new Map<string, EventCheckin[]>();
      for (const c of checkinsData || []) {
        const list = checkinsByEvent.get(c.event_id) || [];
        list.push({
          id: c.id,
          user_id: c.user_id,
          photo_url: c.photo_url,
          tagged_user_ids: c.tagged_user_ids || [],
          created_at: c.created_at,
          profile: c.profile as unknown as EventCheckin["profile"],
        });
        checkinsByEvent.set(c.event_id, list);
      }

      return eventsData.map((event): CrewEvent => {
        const responses = responsesByEvent.get(event.id) || [];
        const myResponse = responses.find((r) => r.user_id === user.id);
        return {
          ...event,
          creator: event.creator as unknown as CrewEvent["creator"],
          responses,
          checkins: checkinsByEvent.get(event.id) || [],
          my_response: myResponse?.response || null,
        };
      });
    },
    enabled: !!crewId,
    staleTime: 30 * 1000,
  });

  // ─── Create event ───
  const createEventMutation = useMutation({
    mutationFn: async (params: {
      crewId: string;
      title: string;
      eventDate: string;
      barId?: string | null;
      barName?: string | null;
      location?: string | null;
      description?: string | null;
    }) => {
      const { data, error } = await supabase.rpc("create_crew_event", {
        p_crew_id: params.crewId,
        p_title: params.title,
        p_event_date: params.eventDate,
        p_bar_id: params.barId || null,
        p_bar_name: params.barName || null,
        p_location: params.location || null,
        p_description: params.description || null,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew-events", crewId] });
    },
  });

  // ─── Respond ───
  const respondMutation = useMutation({
    mutationFn: async ({ eventId, response }: { eventId: string; response: "going" | "maybe" | "not_going" }) => {
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

  // ─── Cancel ───
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

  // ─── Checkin (validate with photo) ───
  const checkinMutation = useMutation({
    mutationFn: async ({
      eventId,
      photoFile,
      taggedUserIds,
    }: {
      eventId: string;
      photoFile: File;
      taggedUserIds: string[];
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecte");

      // Upload photo
      const timestamp = Date.now();
      const fileExt = photoFile.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/crew-events/${eventId}_${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("glupp-photos")
        .upload(filePath, photoFile, { cacheControl: "3600", upsert: false });

      if (uploadError) throw new Error("Erreur upload photo: " + uploadError.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from("glupp-photos").getPublicUrl(filePath);

      // Call RPC
      const { data, error } = await supabase.rpc("checkin_crew_event", {
        p_event_id: eventId,
        p_photo_url: publicUrl,
        p_tagged_user_ids: taggedUserIds,
      });

      if (error) throw new Error(error.message);
      return data as { xp_gained: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["crew-events", crewId] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      if (data?.xp_gained) {
        showXPToast(data.xp_gained, "Sortie validee !");
      }
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

    checkinEvent: (eventId: string, photoFile: File, taggedUserIds: string[]) =>
      checkinMutation.mutateAsync({ eventId, photoFile, taggedUserIds }),
    checkingIn: checkinMutation.isPending,
  };
}