"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2, Check } from "lucide-react";

interface MilestoneData {
  type: "beers" | "level" | "trophy" | "countries" | "streak";
  title: string;
  subtitle: string;
  value: string | number;
  icon: string;
  color: string;
  username: string;
}

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MilestoneData;
}

function MilestoneVisual({ data }: { data: MilestoneData }) {
  return (
    <div style={{
      width: 340, borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.1)",
      background: "linear-gradient(180deg, #1E1B16 0%, #141210 100%)",
      overflow: "hidden", position: "relative",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Content */}
      <div style={{ padding: "48px 24px 40px", textAlign: "center", position: "relative" }}>
        {/* Icon */}
        <div style={{ fontSize: 56, marginBottom: 16 }}>{data.icon}</div>

        {/* Value */}
        <div style={{ fontSize: 48, fontWeight: 900, color: data.color, letterSpacing: -1, lineHeight: 1 }}>
          {data.value}
        </div>

        {/* Title */}
        <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginTop: 14 }}>
          {data.title}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
          {data.subtitle}
        </div>

        {/* Username */}
        <div style={{
          display: "inline-flex", alignItems: "center",
          padding: "6px 16px", borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)",
          marginTop: 24,
        }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>@{data.username}</span> sur Glupp
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "12px 24px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: "#E08840", letterSpacing: -0.5 }}>Glupp</span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", fontStyle: "italic" }}>Every glupp counts.</span>
      </div>
    </div>
  );
}

export function MilestoneModal({ isOpen, onClose, data }: MilestoneModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#141210",
        scale: 2,
        useCORS: true,
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
      a.download = `glupp-milestone-${data.type}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setDownloading(false);
  };

  const handleShare = async () => {
    const blob = await generateImage();
    if (blob && navigator.share) {
      try {
        const file = new File([blob], "glupp-milestone.png", { type: "image/png" });
        await navigator.share({
          title: data.title,
          text: `${data.title} — ${data.subtitle} 🍺 Rejoins-moi sur glupp.fr`,
          files: [file],
        });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(`${data.title} sur Glupp ! 🍺 Rejoins-moi sur glupp.fr`);
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
              <MilestoneVisual data={data} />
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

            <button onClick={onClose} className="text-xs text-white/30 hover:text-white/50 transition-colors">Fermer</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const MILESTONE_CONFIGS = {
  beers: (count: number, username: string): MilestoneData => ({
    type: "beers", value: count, username,
    title: `${count} bieres gluppees !`,
    subtitle: count >= 100 ? "Un vrai Titan de la biere" : count >= 50 ? "Collectionneur confirme" : count >= 25 ? "L'aventure continue" : "Ca commence bien !",
    icon: count >= 100 ? "👑" : count >= 50 ? "🏆" : count >= 25 ? "🍻" : "🍺",
    color: count >= 100 ? "#F0C460" : count >= 50 ? "#A78BFA" : count >= 25 ? "#E08840" : "#4ECDC4",
  }),
  level: (level: number, title: string, username: string): MilestoneData => ({
    type: "level", value: `Nv.${level}`, username,
    title: `${title} atteint !`,
    subtitle: "Un nouveau palier dans l'aventure Glupp",
    icon: level >= 6 ? "👑" : level >= 4 ? "⭐" : "🎖️",
    color: level >= 6 ? "#F0C460" : level >= 4 ? "#A78BFA" : "#E08840",
  }),
  trophy: (name: string, emoji: string, username: string): MilestoneData => ({
    type: "trophy", value: emoji, username,
    title: "Trophee debloque !",
    subtitle: name,
    icon: "🏆",
    color: "#F0C460",
  }),
  countries: (count: number, username: string): MilestoneData => ({
    type: "countries", value: count, username,
    title: `${count} pays decouverts !`,
    subtitle: "Globe-trotter de la biere",
    icon: "🌍",
    color: "#4ECDC4",
  }),
};

export { type MilestoneData };
