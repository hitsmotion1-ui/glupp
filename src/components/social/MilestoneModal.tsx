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
    <div
      className="relative w-[340px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#1E1B16] to-[#141210] shadow-2xl"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: data.color }}
      />

      {/* Content */}
      <div className="relative px-6 pt-10 pb-8 flex flex-col items-center text-center">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
          className="text-6xl mb-4"
        >
          {data.icon}
        </motion.div>

        {/* Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p
            className="text-5xl font-black tracking-tight"
            style={{ color: data.color }}
          >
            {data.value}
          </p>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-3"
        >
          <h3 className="text-lg font-bold text-white">{data.title}</h3>
          <p className="text-xs text-white/40 mt-1">{data.subtitle}</p>
        </motion.div>

        {/* Username */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/5"
        >
          <p className="text-xs text-white/50">
            <span className="font-semibold text-white/70">@{data.username}</span> sur Glupp
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-sm font-black tracking-tight text-[#E08840]">Glupp</span>
        <p className="text-[9px] text-white/20 italic">Every glupp counts.</p>
      </div>

      {/* Decorative particles */}
      {["🍺", "⭐", "🏆", "🎖️"].map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-lg opacity-10"
          style={{
            top: `${15 + i * 20}%`,
            left: i % 2 === 0 ? "8%" : "85%",
          }}
          animate={{
            y: [0, -8, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        >
          {emoji}
        </motion.div>
      ))}
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
    } catch {
      return null;
    }
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
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div ref={cardRef}>
              <MilestoneVisual data={data} />
            </div>

            <div className="flex items-center gap-3 w-full max-w-[340px]">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#E08840] text-white font-bold text-sm hover:bg-[#E08840]/90 transition-colors"
              >
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                {copied ? "Copié !" : "Partager"}
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white/80 font-medium text-sm hover:bg-white/15 transition-colors border border-white/10"
              >
                <Download size={16} />
                {downloading ? "..." : "Sauver"}
              </button>
            </div>

            <button onClick={onClose} className="text-xs text-white/30 hover:text-white/50 transition-colors">
              Passer
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Helper pour créer les milestones standards
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
    title: `Trophee debloque !`,
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
