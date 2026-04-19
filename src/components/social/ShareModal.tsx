"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2, Check } from "lucide-react";
import { beerEmoji } from "@/lib/utils/xp";
import type { Rarity } from "@/types";

interface BeerCardData {
  beerName: string;
  brewery: string;
  style: string;
  country: string;
  rarity: Rarity;
  xpGained: number;
  photoUrl: string | null;
  barName: string | null;
  username: string;
  avatarUrl: string | null;
  level: { icon: string; level: number; title: string };
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BeerCardData;
}

const RARITY_COLORS: Record<string, { bg1: string; bg2: string; border: string; badge: string; badgeText: string; label: string }> = {
  common: { bg1: "#2A2520", bg2: "#1E1B16", border: "rgba(107,96,80,0.5)", badge: "rgba(255,255,255,0.1)", badgeText: "rgba(255,255,255,0.6)", label: "Commune" },
  rare: { bg1: "#1a2540", bg2: "#0f1a30", border: "rgba(59,130,246,0.5)", badge: "rgba(59,130,246,0.3)", badgeText: "#93C5FD", label: "Rare" },
  epic: { bg1: "#2a1a40", bg2: "#1a1030", border: "rgba(167,139,250,0.5)", badge: "rgba(167,139,250,0.3)", badgeText: "#C4B5FD", label: "Epique" },
  legendary: { bg1: "#3a2a10", bg2: "#2a1a00", border: "rgba(245,158,11,0.5)", badge: "rgba(245,158,11,0.3)", badgeText: "#FCD34D", label: "Legendaire" },
};

function BeerCardVisual({ data }: { data: BeerCardData }) {
  const rc = RARITY_COLORS[data.rarity] || RARITY_COLORS.common;

  return (
    <div style={{
      width: 340, borderRadius: 16,
      border: `2px solid ${rc.border}`,
      background: `linear-gradient(180deg, ${rc.bg1} 0%, ${rc.bg2} 100%)`,
      overflow: "hidden", position: "relative",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(224,136,64,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", marginRight: 8,
          }}>
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
            ) : (
              <span style={{ fontSize: 12, fontWeight: 700, color: "#E08840" }}>{data.username[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{data.username}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{data.level.icon} {data.level.title}</div>
          </div>
        </div>
        <div style={{
          padding: "4px 10px", borderRadius: 20,
          background: "rgba(224,136,64,0.15)", border: "1px solid rgba(224,136,64,0.3)",
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#E08840" }}>+{data.xpGained} XP</span>
        </div>
      </div>

      {/* Photo */}
      {data.photoUrl ? (
        <div style={{ margin: "0 16px", height: 176, borderRadius: 12, overflow: "hidden", position: "relative" }}>
          <img src={data.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }} />
          <div style={{ position: "absolute", bottom: 8, left: 8 }}>
            <span style={{
              padding: "2px 8px", borderRadius: 20,
              fontSize: 9, fontWeight: 700,
              background: rc.badge, color: rc.badgeText,
              border: `1px solid ${rc.border}`,
            }}>{rc.label}</span>
          </div>
        </div>
      ) : (
        <div style={{ margin: "0 16px", height: 128, borderRadius: 12, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 48 }}>{beerEmoji(data.style)}</span>
        </div>
      )}

      {/* Beer info */}
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "flex-start" }}>
        <span style={{ fontSize: 24, marginRight: 10, marginTop: 2 }}>{beerEmoji(data.style)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "white", lineHeight: 1.2 }}>{data.beerName}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{data.brewery}</div>
        </div>
      </div>

      {/* Details */}
      <div style={{ padding: "0 20px 12px", fontSize: 10, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center" }}>
        <span>{data.country}</span>
        <span style={{ margin: "0 6px" }}>·</span>
        <span>{data.style}</span>
        {data.barName && (
          <>
            <span style={{ margin: "0 6px" }}>·</span>
            <span>📍 {data.barName}</span>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "12px 20px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: "#E08840", letterSpacing: -0.5 }}>Glupp</span>
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", margin: "0 6px" }}>·</span>
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)" }}>glupp.fr</span>
        </div>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>Every glupp counts.</span>
      </div>
    </div>
  );
}

export function ShareModal({ isOpen, onClose, data }: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    } catch { return null; }
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    const blob = await generateImage();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `glupp-${data.beerName.toLowerCase().replace(/\s+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setDownloading(false);
  };

  const handleShare = async () => {
    const blob = await generateImage();
    if (blob && navigator.share) {
      try {
        const file = new File([blob], "glupp-beer-card.png", { type: "image/png" });
        await navigator.share({
          title: `${data.beerName} sur Glupp`,
          text: `Je viens de glupper ${data.beerName} ! 🍺 Rejoins-moi sur glupp.fr`,
          files: [file],
        });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(`Je viens de glupper ${data.beerName} sur Glupp ! 🍺 Rejoins-moi sur glupp.fr`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 30 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-5 max-w-sm w-full"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>

            <div ref={cardRef}>
              <BeerCardVisual data={data} />
            </div>

            <div className="flex items-center gap-3 w-full max-w-[340px]">
              <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#E08840] text-white font-bold text-sm hover:bg-[#E08840]/90 transition-colors">
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                {copied ? "Copie !" : "Partager"}
              </button>
              <button onClick={handleDownload} disabled={downloading} className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white/80 font-medium text-sm hover:bg-white/15 transition-colors border border-white/10">
                <Download size={16} />
                {downloading ? "..." : "Sauver"}
              </button>
            </div>

            <button onClick={onClose} className="text-xs text-white/30 hover:text-white/50 transition-colors">Passer</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { type BeerCardData };
