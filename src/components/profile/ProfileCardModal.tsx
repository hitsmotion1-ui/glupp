"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2, Check } from "lucide-react";
import { getLevel } from "@/lib/utils/xp";

interface ProfileCardData {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  avatarFileName: string | null;
  xp: number;
  beersTasted: number;
  duelsPlayed: number;
  photosTaken: number;
  customTitle: string | null;
  customTitleIcon: string | null;
  trophyCount: number;
  topBeer: { name: string; brewery: string; elo: number } | null;
}

interface ProfileCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ProfileCardData;
}

function ProfileCardVisual({ data }: { data: ProfileCardData }) {
  const level = getLevel(data.xp);

  return (
    <div
      style={{
        width: 340,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "linear-gradient(180deg, #1E1B16 0%, #1A1714 50%, #141210 100%)",
        overflow: "hidden",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        position: "relative",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "32px 24px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          border: "2px solid rgba(224,136,64,0.3)",
          background: "rgba(224,136,64,0.15)",
          marginBottom: 12,
          overflow: "hidden",
          flexShrink: 0,
        }}>
          {data.avatarFileName ? (
            <img src={`https://glupp.fr/avatars/${data.avatarFileName}.png`} alt="" style={{ width: 80, height: 80, objectFit: "cover", display: "block" }} crossOrigin="anonymous" />
          ) : data.avatarUrl ? (
            <img src={data.avatarUrl} alt="" style={{ width: 80, height: 80, objectFit: "cover", display: "block" }} crossOrigin="anonymous" />
          ) : (
            <div style={{ width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: "#E08840" }}>{(data.displayName || data.username)[0]?.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Name */}
        <div style={{ fontSize: 20, fontWeight: 900, color: "white", marginBottom: 2, textAlign: "center" }}>
          {data.displayName || data.username}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 12, textAlign: "center" }}>
          @{data.username}
        </div>

        {/* Title badge — inline-flex pour centrage parfait dans html2canvas */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "5px 14px",
          borderRadius: 20,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          fontSize: 12,
          fontWeight: 600,
          color: "#E08840",
          whiteSpace: "nowrap",
        }}>
          {data.customTitleIcon || level.icon} {data.customTitle || level.title}
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: "0 20px 16px", display: "flex", gap: 8 }}>
        {[
          { icon: "🍺", value: data.beersTasted, label: "BIERES" },
          { icon: "⚔️", value: data.duelsPlayed, label: "DUELS" },
          { icon: "📸", value: data.photosTaken, label: "PHOTOS" },
          { icon: "🏆", value: data.trophyCount, label: "TROPHEES" },
        ].map((stat, i) => (
          <div key={i} style={{
            flex: 1, textAlign: "center",
            padding: "10px 4px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
          }}>
            <div style={{ fontSize: 14, marginBottom: 2 }}>{stat.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "white" }}>{stat.value}</div>
            <div style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", letterSpacing: 1, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Top beer */}
      {data.topBeer && (
        <div style={{
          margin: "0 20px 16px",
          padding: "12px 16px",
          borderRadius: 12,
          background: "rgba(240,196,96,0.06)",
          border: "1px solid rgba(240,196,96,0.12)",
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 10, marginRight: 4 }}>👑</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#F0C460", letterSpacing: 1, textTransform: "uppercase" as const }}>Ma biere #1</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "white", lineHeight: 1.3 }}>
            {data.topBeer.name}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
            {data.topBeer.brewery}
          </div>
        </div>
      )}

      {/* XP bar */}
      <div style={{ margin: "0 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Niveau {level.level}</span>
          <span style={{ fontSize: 9, color: "#E08840", fontWeight: 700 }}>{data.xp} XP</span>
        </div>
        <div style={{
          width: "100%", height: 6,
          background: "rgba(255,255,255,0.05)",
          borderRadius: 3, overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            background: "#E08840",
            borderRadius: 3,
            width: `${Math.min(100, (data.xp % 1000) / 10)}%`,
          }} />
        </div>
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
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.12)", fontStyle: "italic" }}>Every glupp counts.</span>
      </div>
    </div>
  );
}

export function ProfileCardModal({ isOpen, onClose, data }: ProfileCardModalProps) {
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
      a.download = `glupp-${data.username}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setDownloading(false);
  };

  const handleShare = async () => {
    const blob = await generateImage();
    if (blob && navigator.share) {
      try {
        const file = new File([blob], "glupp-profile.png", { type: "image/png" });
        await navigator.share({
          title: `${data.displayName || data.username} sur Glupp`,
          text: `${data.beersTasted} bieres, ${data.duelsPlayed} duels — rejoins-moi sur glupp.fr ! 🍺`,
          files: [file],
        });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(`Decouvre mon profil Glupp ! ${data.beersTasted} bieres, ${data.duelsPlayed} duels 🍺 glupp.fr`);
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
              <ProfileCardVisual data={data} />
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

export { type ProfileCardData };
