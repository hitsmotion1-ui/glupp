"use client";

import { useEffect, useRef, useState } from "react";
import type { Bar } from "@/types";

// Leaflet is client-only — dynamic import prevents SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let L: any = null;

interface LeafletMapProps {
  bars: (Bar & { distance?: number })[];
  userLocation: { lat: number; lng: number } | null;
  center: { lat: number; lng: number };
  zoom: number;
  onBarSelect: (barId: string) => void;
  selectedBarId: string | null;
}

export function LeafletMap({
  bars,
  userLocation,
  center,
  zoom,
  onBarSelect,
  selectedBarId,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  // Initialize leaflet
  useEffect(() => {
    let cancelled = false;

    const initLeaflet = async () => {
      if (L) {
        setReady(true);
        return;
      }

      try {
        const leaflet = await import("leaflet");
        if (!cancelled) {
          L = leaflet.default || leaflet;
          setReady(true);
        }
      } catch (err) {
        console.error("Failed to load Leaflet:", err);
      }
    };

    initLeaflet();
    return () => { cancelled = true; };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!ready || !L || !mapRef.current || mapInstanceRef.current) return;
    const leaflet = L;

    const map = leaflet.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark tile layer (matches Glupp theme)
    leaflet.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
        subdomains: "abcd",
      }
    ).addTo(map);

    // Zoom control on the right
    leaflet.control.zoom({ position: "topright" }).addTo(map);

    mapInstanceRef.current = map;
    markersRef.current = leaflet.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Update center when userLocation changes
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;
    mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 14, { animate: true });
  }, [userLocation]);

  // Update markers
  useEffect(() => {
    if (!ready || !L || !markersRef.current || !mapInstanceRef.current) return;
    const leaflet = L;

    markersRef.current.clearLayers();

    // User location marker
    if (userLocation) {
      const userIcon = leaflet.divIcon({
        className: "glupp-user-marker",
        html: `<div style="width:16px;height:16px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.5);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      leaflet.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(markersRef.current);
    }

    // Bar markers
    const layerGroup = markersRef.current;
    bars.forEach((bar) => {
      if (!bar.geo_lat || !bar.geo_lng) return;

      const isSelected = bar.id === selectedBarId;
      const color = isSelected ? "#E08840" : "#F0C460";
      const size = isSelected ? 32 : 24;

      const barIcon = leaflet.divIcon({
        className: "glupp-bar-marker",
        html: `<div style="
          width:${size}px;height:${size}px;
          background:${color};
          border:2px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.6)'};
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
          cursor:pointer;
          transition:all 0.2s;
          font-size:${isSelected ? 16 : 12}px;
        ">
          <span>${bar.is_verified ? "&#127866;" : "&#127867;"}</span>
        </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = leaflet.marker([bar.geo_lat, bar.geo_lng], { icon: barIcon });
      marker.on("click", () => onBarSelect(bar.id));

      // Tooltip
      const distText = bar.distance
        ? ` - ${bar.distance < 1 ? `${Math.round(bar.distance * 1000)}m` : `${bar.distance.toFixed(1)}km`}`
        : "";
      marker.bindTooltip(
        `<strong>${bar.name}</strong>${distText}`,
        {
          direction: "top",
          offset: [0, -size / 2 - 4],
          className: "glupp-tooltip",
        }
      );

      marker.addTo(layerGroup);
    });
  }, [bars, userLocation, selectedBarId, onBarSelect, ready]);

  // Pan to selected bar
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedBarId) return;
    const bar = bars.find((b) => b.id === selectedBarId);
    if (bar?.geo_lat && bar?.geo_lng) {
      mapInstanceRef.current.panTo([bar.geo_lat, bar.geo_lng], { animate: true });
    }
  }, [selectedBarId, bars]);

  if (!ready) {
    return (
      <div className="w-full h-full bg-glupp-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-glupp-accent border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-xs text-glupp-text-muted">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={mapRef} className="w-full h-full" />
      <style jsx global>{`
        .glupp-bar-marker {
          background: transparent !important;
          border: none !important;
        }
        .glupp-user-marker {
          background: transparent !important;
          border: none !important;
        }
        .glupp-tooltip {
          background: #1E1B16 !important;
          color: #F5E6D3 !important;
          border: 1px solid #3A3530 !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
          font-size: 12px !important;
          font-family: var(--font-body), sans-serif !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        }
        .glupp-tooltip .leaflet-tooltip-tip {
          border-top-color: #1E1B16 !important;
        }
        .leaflet-control-zoom a {
          background: #1E1B16 !important;
          color: #F5E6D3 !important;
          border-color: #3A3530 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #2A2520 !important;
        }
      `}</style>
    </>
  );
}
