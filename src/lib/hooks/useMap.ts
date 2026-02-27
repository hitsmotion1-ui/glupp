"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import type { Bar, BarBeer } from "@/types";

interface MapState {
  center: { lat: number; lng: number };
  zoom: number;
  userLocation: { lat: number; lng: number } | null;
  locationError: string | null;
  loadingLocation: boolean;
}

export function useMap() {
  const queryClient = useQueryClient();

  const [mapState, setMapState] = useState<MapState>({
    center: { lat: 48.8566, lng: 2.3522 }, // Paris default
    zoom: 13,
    userLocation: null,
    locationError: null,
    loadingLocation: true,
  });

  // Get user geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setMapState((s) => ({
        ...s,
        locationError: "Géolocalisation non supportée",
        loadingLocation: false,
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMapState((s) => ({
          ...s,
          center: loc,
          userLocation: loc,
          loadingLocation: false,
        }));
      },
      (err) => {
        let msg = "Impossible d'obtenir ta position.";
        if (err.code === 1) msg = "Permission de localisation refusée.";
        if (err.code === 2) msg = "Position indisponible.";
        if (err.code === 3) msg = "Délai de localisation dépassé.";
        setMapState((s) => ({
          ...s,
          locationError: msg,
          loadingLocation: false,
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // Fetch all bars
  const {
    data: bars = [],
    isLoading: loadingBars,
  } = useQuery({
    queryKey: queryKeys.bars.all,
    queryFn: async () => {
      const allBars: Bar[] = [];
      let from = 0;
      const batchSize = 1000;

      while (true) {
        const { data, error } = await supabase
          .from("bars")
          .select("*")
          .range(from, from + batchSize - 1)
          .order("name");

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) break;
        allBars.push(...(data as Bar[]));
        if (data.length < batchSize) break;
        from += batchSize;
      }

      return allBars;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch bar's beer menu
  const getBarBeers = useCallback(async (barId: string): Promise<BarBeer[]> => {
    const { data, error } = await supabase
      .from("bar_beers")
      .select("*, beer:beers(*)")
      .eq("bar_id", barId)
      .order("votes", { ascending: false });

    if (error) throw new Error(error.message);
    return (data as BarBeer[]) || [];
  }, []);

  // Add a bar
  const addBarMutation = useMutation({
    mutationFn: async (bar: {
      name: string;
      address?: string;
      city?: string;
      geo_lat?: number;
      geo_lng?: number;
    }) => {
      const { data, error } = await supabase
        .from("bars")
        .insert(bar)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Bar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bars.all });
    },
  });

  // Calculate distance between two points (km)
  const getDistance = useCallback(
    (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  // Bars sorted by distance from user
  const nearbyBars = mapState.userLocation
    ? [...bars]
        .filter((b) => b.geo_lat && b.geo_lng)
        .map((bar) => ({
          ...bar,
          distance: getDistance(
            mapState.userLocation!.lat,
            mapState.userLocation!.lng,
            bar.geo_lat!,
            bar.geo_lng!
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
    : [];

  return {
    bars,
    nearbyBars,
    loadingBars,
    mapState,
    setMapState,
    getBarBeers,
    addBar: addBarMutation.mutateAsync,
    addingBar: addBarMutation.isPending,
  };
}
