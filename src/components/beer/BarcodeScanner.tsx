"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Camera, AlertTriangle, Bug, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

/* --- Types --- */
type LogLevel = "info" | "warn" | "error" | "success";

interface ScanLog {
  id: number;
  level: LogLevel;
  message: string;
  timestamp: Date;
}

const LOG_COLORS: Record<LogLevel, string> = {
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
  success: "text-green-400",
};

const LOG_ICONS: Record<LogLevel, string> = {
  info: "\u2139\ufe0f",
  warn: "\u26a0\ufe0f",
  error: "\u274c",
  success: "\u2705",
};

/* --- Extend Window for BarcodeDetector --- */
interface DetectedBarcode {
  rawValue: string;
  format: string;
  boundingBox: DOMRectReadOnly;
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (opts?: { formats: string[] }): {
        detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>;
      };
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

/* --- Component --- */
interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionLoopRef = useRef<number | null>(null);
  const hasScanned = useRef(false);
  const mountedRef = useRef(true);
  const logIdRef = useRef(0);

  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [scanMode, setScanMode] = useState<"native" | "zxing" | null>(null);

  // Debug log
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  // Manual entry
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");

  // html5-qrcode fallback ref
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5ScannerRef = useRef<any>(null);

  const addLog = useCallback((level: LogLevel, message: string) => {
    const id = ++logIdRef.current;
    setLogs((prev) => [...prev.slice(-50), { id, level, message, timestamp: new Date() }]);
  }, []);

  // ─── Stop everything ──────────────────────────────────────
  const cleanup = useCallback(() => {
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (html5ScannerRef.current) {
      try {
        if (html5ScannerRef.current.isScanning) {
          html5ScannerRef.current.stop().catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  }, []);

  // ─── Manual submit ────────────────────────────────────────
  const handleManualSubmit = () => {
    const code = manualBarcode.trim();
    if (!code || hasScanned.current) return;
    hasScanned.current = true;
    addLog("success", `Code saisi manuellement: ${code}`);
    cleanup();
    onScan(code);
  };

  // ─── Handle detected barcode ──────────────────────────────
  const handleDetected = useCallback(
    (code: string, format: string) => {
      if (hasScanned.current) return;
      hasScanned.current = true;
      addLog("success", `Code detecte! Format: ${format}, Valeur: ${code}`);
      if (navigator.vibrate) navigator.vibrate(100);
      cleanup();
      onScan(code);
    },
    [addLog, cleanup, onScan]
  );

  // ─── Start native BarcodeDetector ─────────────────────────
  const startNativeDetector = useCallback(
    async (video: HTMLVideoElement) => {
      if (!window.BarcodeDetector) return false;

      // Check which formats are supported
      let supportedFormats: string[] = [];
      try {
        if (window.BarcodeDetector.getSupportedFormats) {
          supportedFormats = await window.BarcodeDetector.getSupportedFormats();
        }
      } catch {
        // ignore
      }

      const wantedFormats = [
        "ean_13", "ean_8", "upc_a", "upc_e",
        "code_128", "code_39", "qr_code",
      ];
      const formats = supportedFormats.length > 0
        ? wantedFormats.filter((f) => supportedFormats.includes(f))
        : wantedFormats;

      if (formats.length === 0) {
        addLog("warn", "BarcodeDetector: aucun format supporte");
        return false;
      }

      addLog("info", `BarcodeDetector natif: formats [${formats.join(", ")}]`);

      try {
        const detector = new window.BarcodeDetector!({ formats });
        let frameCount = 0;

        const detectFrame = async () => {
          if (!mountedRef.current || hasScanned.current) return;

          try {
            const barcodes = await detector.detect(video);
            if (barcodes.length > 0) {
              handleDetected(barcodes[0].rawValue, barcodes[0].format);
              return;
            }
          } catch {
            // frame decode error — skip
          }

          frameCount++;
          if (frameCount % 100 === 0 && mountedRef.current) {
            setScanAttempts(frameCount);
            addLog("info", `${frameCount} frames analysees (natif)`);
          }

          // ~5 detections per second — plenty for barcode
          detectionLoopRef.current = requestAnimationFrame(() => {
            setTimeout(detectFrame, 200);
          });
        };

        // Start detection loop
        detectFrame();
        setScanMode("native");
        addLog("success", "BarcodeDetector natif actif (5 scans/s)");
        return true;
      } catch (err) {
        addLog("warn", `BarcodeDetector init echoue: ${err}`);
        return false;
      }
    },
    [addLog, handleDetected]
  );

  // ─── Start html5-qrcode fallback ─────────────────────────
  const startHtml5Fallback = useCallback(async () => {
    addLog("info", "Fallback html5-qrcode (ZXing)...");
    setScanMode("zxing");

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

      const formats = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.QR_CODE,
      ];

      const scanner = new Html5Qrcode("barcode-fallback", {
        formatsToSupport: formats,
        verbose: false,
        useBarCodeDetectorIfSupported: false,
      });
      html5ScannerRef.current = scanner;

      let frameCount = 0;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, disableFlip: false },
        (decodedText, result) => {
          const format = result?.result?.format?.formatName || "inconnu";
          handleDetected(decodedText, format);
        },
        () => {
          frameCount++;
          if (frameCount % 100 === 0 && mountedRef.current) {
            setScanAttempts(frameCount);
            addLog("info", `${frameCount} frames analysees (ZXing)`);
          }
        }
      );

      setCameraReady(true);
      setStarting(false);
      addLog("success", "Camera ZXing active (10fps)");
    } catch (err) {
      const errStr = String(err);
      addLog("error", `ZXing fallback echoue: ${errStr}`);
      handleCameraError(errStr);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addLog, handleDetected]);

  // ─── Camera error handler ─────────────────────────────────
  const handleCameraError = (errStr: string) => {
    setStarting(false);
    if (errStr.includes("NotAllowedError") || errStr.includes("Permission")) {
      setError("Acces a la camera refuse. Autorise la camera dans les parametres de ton navigateur.");
    } else if (errStr.includes("NotFoundError") || errStr.includes("device")) {
      setError("Aucune camera trouvee sur cet appareil.");
    } else if (errStr.includes("NotReadableError")) {
      setError("La camera est utilisee par une autre application.");
    } else if (errStr.includes("OverconstrainedError")) {
      setError("Camera arriere non disponible. Essaie avec un autre appareil.");
    } else {
      setError("Impossible de demarrer la camera. Verifie les permissions.");
    }
  };

  // ─── Main init ────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    addLog("info", "Initialisation du scanner...");

    if (!navigator.mediaDevices?.getUserMedia) {
      addLog("error", "API MediaDevices non supportee");
      setError("Ton navigateur ne supporte pas la camera.");
      setStarting(false);
      return;
    }

    const hasBarcodeDetector = "BarcodeDetector" in window;
    addLog("info", `BarcodeDetector natif: ${hasBarcodeDetector ? "OUI" : "NON"}`);
    addLog("info", `Protocole: ${location.protocol}`);

    const timer = setTimeout(async () => {
      if (!mountedRef.current) return;

      // ── Strategy A: Native BarcodeDetector + manual camera stream ──
      if (hasBarcodeDetector) {
        addLog("info", "Strategie: BarcodeDetector natif + camera HD");
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
              // @ts-expect-error - focusMode is valid but not in all TS defs
              focusMode: { ideal: "continuous" },
            },
            audio: false,
          });

          if (!mountedRef.current) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          streamRef.current = stream;
          const video = videoRef.current;
          if (!video) {
            addLog("error", "Element video introuvable");
            setError("Erreur d'initialisation.");
            setStarting(false);
            return;
          }

          video.srcObject = stream;
          await video.play();

          // Log video info
          const track = stream.getVideoTracks()[0];
          const settings = track.getSettings() as MediaTrackSettings & { focusMode?: string };
          addLog("info", `Camera: ${settings.width}x${settings.height} ${settings.facingMode || ""}`);
          if (settings.focusMode) {
            addLog("info", `Focus: ${settings.focusMode}`);
          }

          setCameraReady(true);
          setStarting(false);

          // Start native detector
          const nativeOk = await startNativeDetector(video);
          if (!nativeOk) {
            addLog("warn", "BarcodeDetector natif echoue, fallback ZXing...");
            // Stop native stream, use html5-qrcode instead
            stream.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            await startHtml5Fallback();
          }
        } catch (err) {
          if (!mountedRef.current) return;
          const errStr = String(err);
          addLog("error", `Camera HD echouee: ${errStr}`);
          // Try html5-qrcode fallback
          addLog("info", "Tentative fallback ZXing...");
          await startHtml5Fallback();
        }
      } else {
        // ── Strategy B: html5-qrcode (ZXing) fallback ──
        await startHtml5Fallback();
      }
    }, 300);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    addLog("info", "Fermeture du scanner");
    cleanup();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top,1rem))] bg-black/80 shrink-0">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-5 h-5" />
          <span className="font-display font-semibold">Scanner</span>
          {scanMode && (
            <span className="text-[10px] text-white/40 bg-white/10 px-1.5 py-0.5 rounded">
              {scanMode === "native" ? "Natif" : "ZXing"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManualEntry(!showManualEntry)}
            className={`p-2 rounded-full transition-colors ${
              showManualEntry ? "bg-glupp-accent/30 text-glupp-accent" : "bg-white/10 hover:bg-white/20 text-white/60"
            }`}
            aria-label="Saisie manuelle"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`p-2 rounded-full transition-colors ${
              showDebug ? "bg-glupp-accent/30 text-glupp-accent" : "bg-white/10 hover:bg-white/20 text-white/60"
            }`}
            aria-label="Debug"
          >
            <Bug className="w-4 h-4" />
          </button>
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Scanner viewport */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {/* Native video element (used by Strategy A) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${scanMode === "zxing" ? "hidden" : ""}`}
        />

        {/* html5-qrcode fallback container (used by Strategy B) */}
        <div
          id="barcode-fallback"
          className={`w-full h-full absolute inset-0 ${scanMode === "native" || scanMode === null ? "hidden" : ""}`}
          style={{ minHeight: "300px" }}
        />

        {/* Loading */}
        {starting && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="text-center text-white">
              <div className="animate-spin w-8 h-8 border-2 border-glupp-accent border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm">Activation de la camera...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black p-6 z-10">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-glupp-accent mx-auto mb-4" />
              <p className="text-white text-sm mb-4">{error}</p>
              <p className="text-white/40 text-xs mb-6">
                Tu peux aussi saisir le code manuellement
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="primary" onClick={() => { setError(null); setShowManualEntry(true); }}>
                  Saisir le code
                </Button>
                <Button variant="ghost" onClick={handleClose}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Status indicators */}
        {!error && !starting && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full">
              <div className={`w-2 h-2 rounded-full ${cameraReady ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
              <span className="text-[10px] text-white/80 font-medium">
                {cameraReady ? "Camera active" : "En attente"}
              </span>
            </div>
            {scanAttempts > 0 && (
              <div className="px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full">
                <span className="text-[10px] text-white/60">{scanAttempts} frames</span>
              </div>
            )}
          </div>
        )}

        {/* Scan guide overlay */}
        {!error && !starting && cameraReady && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
            <div className="w-[85%] h-[25%] relative">
              <motion.div
                animate={{ y: ["-50%", "50%"] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                className="absolute left-0 right-0 top-1/2 h-0.5 bg-glupp-accent/80 shadow-[0_0_8px_rgba(224,136,64,0.5)]"
              />
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-glupp-accent/60 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-glupp-accent/60 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-glupp-accent/60 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-glupp-accent/60 rounded-br-lg" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className="shrink-0">
        {/* Manual entry */}
        <AnimatePresence>
          {showManualEntry && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#1E1B16] border-t border-[#3A3530] px-4 py-3"
            >
              <p className="text-[11px] text-white/50 mb-2">Saisis le code-barres :</p>
              <form onSubmit={(e) => { e.preventDefault(); handleManualSubmit(); }} className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Ex: 5411551080222"
                  autoFocus
                  className="flex-1 px-3 py-2.5 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-glupp-accent transition-colors font-mono"
                />
                <button
                  type="submit"
                  disabled={!manualBarcode.trim()}
                  className="px-5 py-2.5 bg-glupp-accent text-[#141210] font-semibold text-sm rounded-lg hover:bg-glupp-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  OK
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Debug or instructions */}
        <AnimatePresence mode="wait">
          {showDebug ? (
            <motion.div
              key="debug"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 max-h-[40vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50">
                <div className="flex items-center gap-2">
                  <Bug className="w-3.5 h-3.5 text-glupp-accent" />
                  <span className="text-xs font-semibold text-white/90">Debug</span>
                  <span className="text-[10px] text-white/40">({logs.length})</span>
                </div>
                <button
                  onClick={() => setLogs([])}
                  className="text-[10px] text-white/40 hover:text-white/70 transition-colors px-2 py-0.5 rounded bg-white/5"
                >
                  Clear
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-1.5 space-y-0.5 font-mono">
                {logs.length === 0 ? (
                  <p className="text-[10px] text-white/30 py-2 text-center">Aucun log</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-1.5 py-0.5">
                      <span className="text-[10px] text-white/25 shrink-0 tabular-nums w-[52px]">
                        {log.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                      <span className="text-[10px] shrink-0">{LOG_ICONS[log.level]}</span>
                      <span className={`text-[11px] leading-tight ${LOG_COLORS[log.level]}`}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="instructions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-black/80 text-center"
            >
              {!error && (
                <p className="text-white/70 text-sm">
                  Place le code-barres dans le cadre
                </p>
              )}
              {!error && scanAttempts > 50 && !showManualEntry && (
                <button
                  onClick={() => setShowManualEntry(true)}
                  className="mt-2 text-xs text-glupp-accent/80 hover:text-glupp-accent transition-colors"
                >
                  Ca ne marche pas ? Saisir le code manuellement
                </button>
              )}
              {!error && scanAttempts > 0 && scanAttempts <= 50 && (
                <p className="mt-1.5 text-[10px] text-white/40">
                  Rapproche ou eloigne la camera...
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Override html5-qrcode styles (only for ZXing fallback) */}
      <style jsx global>{`
        #barcode-fallback {
          border: none !important;
        }
        #barcode-fallback video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #barcode-fallback__dashboard,
        #barcode-fallback__header_message,
        #barcode-fallback img[alt="Info icon"] {
          display: none !important;
        }
        #barcode-fallback__scan_region {
          min-height: 0 !important;
        }
        #barcode-fallback__scan_region > br {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
