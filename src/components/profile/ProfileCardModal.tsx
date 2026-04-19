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
      {/* Header — block layout, pas de flex column pour éviter les bugs html2canvas */}
      <div style={{ padding: "32px 24px 16px" }}>

        {/* Avatar — centré via block + margin auto */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          border: "2px solid rgba(224,136,64,0.3)",
          background: "rgba(224,136,64,0.15)",
          marginLeft: "auto", marginRight: "auto", marginBottom: 12,
          overflow: "hidden",
          display: "block",
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

        {/* Name — textAlign center sur des block divs, le plus stable dans html2canvas */}
        <div style={{ fontSize: 20, fontWeight: 900, color: "white", marginBottom: 2, textAlign: "center", lineHeight: 1.2 }}>
          {data.displayName || data.username}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 12, textAlign: "center", lineHeight: 1.2 }}>
          @{data.username}
        </div>

        {/* Title badge — hauteur fixe + flex pour centrage vertical parfait dans html2canvas */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            display: "inline-flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            height: 28,
            paddingLeft: 14,
            paddingRight: 14,
            paddingTop: 0,
            paddingBottom: 0,
            borderRadius: 20,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: 12,
            fontWeight: 600,
            color: "#E08840",
            whiteSpace: "nowrap",
            lineHeight: "28px",
            verticalAlign: "middle",
            boxSizing: "border-box" as const,
          }}>
            <span style={{ display: "inline-block", verticalAlign: "middle", lineHeight: 1, marginTop: 0, marginBottom: 0 }}>
              {data.customTitleIcon || level.icon}
            </span>
            <span style={{ display: "inline-block", verticalAlign: "middle", lineHeight: 1, marginLeft: 5, marginTop: 0, marginBottom: 0 }}>
              {data.customTitle || level.title}
            </span>
          </div>
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
    const level = getLevel(data.xp);
    const DPR = 2;
    const W = 340;

    // ── helpers ──────────────────────────────────────────────────────────────
    function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }

    function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = "left") {
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = "middle";
      ctx.fillText(text, x, y);
    }

    // ── compute dynamic height ────────────────────────────────────────────────
    let H = 32 + 80 + 12 + 28 + 4 + 20 + 16 + 28 + 16; // header top + avatar + gap + name + gap + @user + gap + badge + gap
    H += 16 + 72 + 16;   // stats section
    if (data.topBeer) H += 80 + 16; // top beer card
    H += 16 + 32 + 16;   // xp bar section
    H += 44;             // footer

    const canvas = document.createElement("canvas");
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(DPR, DPR);

    // ── background gradient ───────────────────────────────────────────────────
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1E1B16");
    bg.addColorStop(0.5, "#1A1714");
    bg.addColorStop(1, "#141210");
    roundRect(ctx, 0, 0, W, H, 16);
    ctx.fillStyle = bg;
    ctx.fill();
    // card border
    roundRect(ctx, 0, 0, W, H, 16);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();

    let y = 32;

    // ── avatar ────────────────────────────────────────────────────────────────
    const avatarSize = 80;
    const avatarX = (W - avatarSize) / 2;
    // circle clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // try to load avatar image
    let avatarLoaded = false;
    const avatarSrc = data.avatarFileName
      ? `https://glupp.fr/avatars/${data.avatarFileName}.png`
      : data.avatarUrl || null;

    if (avatarSrc) {
      try {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => { ctx.drawImage(img, avatarX, y, avatarSize, avatarSize); avatarLoaded = true; resolve(); };
          img.onerror = () => resolve();
          img.src = avatarSrc;
        });
      } catch { /* fallback */ }
    }

    if (!avatarLoaded) {
      ctx.fillStyle = "rgba(224,136,64,0.15)";
      ctx.fillRect(avatarX, y, avatarSize, avatarSize);
      drawText(ctx, (data.displayName || data.username)[0]?.toUpperCase() || "?",
        avatarX + avatarSize / 2, y + avatarSize / 2, "bold 28px system-ui", "#E08840", "center");
    }
    ctx.restore();

    // avatar ring
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(224,136,64,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    y += avatarSize + 14;

    // ── display name ──────────────────────────────────────────────────────────
    drawText(ctx, data.displayName || data.username, W / 2, y, "900 20px system-ui", "#ffffff", "center");
    y += 22;
    drawText(ctx, `@${data.username}`, W / 2, y, "400 12px system-ui", "rgba(255,255,255,0.4)", "center");
    y += 20;

    // ── title badge ───────────────────────────────────────────────────────────
    const badgeText = `${data.customTitleIcon || level.icon} ${data.customTitle || level.title}`;
    ctx.font = "600 12px system-ui";
    const badgeTextW = ctx.measureText(badgeText).width;
    const badgePadX = 14;
    const badgeH = 26;
    const badgeW = badgeTextW + badgePadX * 2;
    const badgeX = (W - badgeW) / 2;

    roundRect(ctx, badgeX, y, badgeW, badgeH, 13);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();
    roundRect(ctx, badgeX, y, badgeW, badgeH, 13);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // text centered inside badge — textBaseline middle = parfait
    ctx.font = "600 12px system-ui";
    ctx.fillStyle = "#E08840";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, W / 2, y + badgeH / 2);

    y += badgeH + 16;

    // ── stats ─────────────────────────────────────────────────────────────────
    const stats = [
      { icon: "🍺", value: data.beersTasted, label: "BIERES" },
      { icon: "⚔️", value: data.duelsPlayed, label: "DUELS" },
      { icon: "📸", value: data.photosTaken, label: "PHOTOS" },
      { icon: "🏆", value: data.trophyCount, label: "TROPHEES" },
    ];
    const statPad = 20;
    const statGap = 8;
    const statW = (W - statPad * 2 - statGap * 3) / 4;
    const statH = 72;

    stats.forEach((stat, i) => {
      const sx = statPad + i * (statW + statGap);
      roundRect(ctx, sx, y, statW, statH, 12);
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fill();

      const cx = sx + statW / 2;
      ctx.font = "14px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(stat.icon, cx, y + 14);

      drawText(ctx, String(stat.value), cx, y + 34, "900 18px system-ui", "#ffffff", "center");
      drawText(ctx, stat.label, cx, y + 56, "400 7px system-ui", "rgba(255,255,255,0.3)", "center");
    });

    y += statH + 16;

    // ── top beer ──────────────────────────────────────────────────────────────
    if (data.topBeer) {
      const beerCardH = 72;
      roundRect(ctx, 20, y, W - 40, beerCardH, 12);
      ctx.fillStyle = "rgba(240,196,96,0.06)";
      ctx.fill();
      roundRect(ctx, 20, y, W - 40, beerCardH, 12);
      ctx.strokeStyle = "rgba(240,196,96,0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = "10px system-ui";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("👑", 32, y + 16);

      drawText(ctx, "MA BIERE #1", 47, y + 16, "700 9px system-ui", "#F0C460");
      drawText(ctx, data.topBeer.name, 32, y + 38, "700 14px system-ui", "#ffffff");
      drawText(ctx, data.topBeer.brewery, 32, y + 57, "400 10px system-ui", "rgba(255,255,255,0.4)");

      y += beerCardH + 16;
    }

    // ── XP bar ────────────────────────────────────────────────────────────────
    drawText(ctx, `Niveau ${level.level}`, 20, y + 6, "400 9px system-ui", "rgba(255,255,255,0.3)");
    drawText(ctx, `${data.xp} XP`, W - 20, y + 6, "700 9px system-ui", "#E08840", "right");
    y += 16;

    const barH = 6;
    roundRect(ctx, 20, y, W - 40, barH, 3);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();

    const barFill = Math.min(1, (data.xp % 1000) / 1000) * (W - 40);
    if (barFill > 0) {
      roundRect(ctx, 20, y, barFill, barH, 3);
      ctx.fillStyle = "#E08840";
      ctx.fill();
    }

    y += barH + 16;

    // ── footer ────────────────────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    y += 14;

    drawText(ctx, "Glupp", 20, y + 8, "900 14px system-ui", "#E08840");
    drawText(ctx, "·", 56, y + 8, "400 8px system-ui", "rgba(255,255,255,0.2)", "center");
    drawText(ctx, "glupp.fr", 66, y + 8, "400 8px system-ui", "rgba(255,255,255,0.2)");
    drawText(ctx, "Every glupp counts.", W - 20, y + 8, "italic 400 8px system-ui", "rgba(255,255,255,0.12)", "right");

    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }, [data]);

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
