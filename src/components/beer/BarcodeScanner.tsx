"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, Camera, AlertTriangle, Bug, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Log system ─── */
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
  info: "ℹ️",
  warn: "⚠️",
  error: "❌",
  success: "✅",
};

/* ─── Component ─── */
interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const hasScanned = useRef(false);
  const mountedRef = useRef(true);
  const logIdRef = useRef(0);

  // Debug log state
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);

  const addLog = useCallback((level: LogLevel, message: string) => {
    const id = ++logIdRef.current;
    setLogs((prev) => [...prev.slice(-30), { id, level, message, timestamp: new Date() }]);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    addLog("info", "Initialisation du scanner...");

    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      addLog("error", "API MediaDevices non supportée par ce navigateur");
      setError("Ton navigateur ne supporte pas l'accès à la caméra.");
      setStarting(false);
      return;
    }
    addLog("info", "API MediaDevices disponible");

    // Check HTTPS
    if (location.protocol !== "https:" && location.hostname !== "localhost") {
      addLog("warn", `Protocole: ${location.protocol} — HTTPS requis pour la caméra`);
    } else {
      addLog("info", `Protocole: ${location.protocol} OK`);
    }

    const timer = setTimeout(() => {
      if (!mountedRef.current) return;

      const scannerId = "barcode-reader";
      const el = document.getElementById(scannerId);
      if (!el) {
        addLog("error", "Élément DOM #barcode-reader introuvable");
        setError("Erreur d'initialisation du scanner.");
        setStarting(false);
        return;
      }
      addLog("info", `Élément DOM trouvé (${el.offsetWidth}x${el.offsetHeight}px)`);

      const formats = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.QR_CODE,
      ];
      addLog("info", `Formats supportés: EAN-13, EAN-8, UPC-A, UPC-E, CODE-128, CODE-39, QR`);

      const scanner = new Html5Qrcode(scannerId, {
        formatsToSupport: formats,
        verbose: false,
      });
      scannerRef.current = scanner;
      addLog("info", "Instance Html5Qrcode créée");

      // Responsive qrbox
      const viewportWidth = window.innerWidth;
      const qrboxWidth = Math.min(280, viewportWidth - 60);
      const qrboxHeight = Math.round(qrboxWidth * 0.55);
      addLog("info", `QR box: ${qrboxWidth}x${qrboxHeight}px (viewport: ${viewportWidth}px)`);

      addLog("info", "Demande d'accès caméra...");

      let scanFrameCount = 0;

      scanner
        .start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: qrboxWidth, height: qrboxHeight },
            disableFlip: false,
          },
          (decodedText, result) => {
            if (hasScanned.current) return;
            hasScanned.current = true;

            const format = result?.result?.format?.formatName || "inconnu";
            addLog("success", `Code détecté! Format: ${format}, Valeur: ${decodedText}`);

            if (navigator.vibrate) {
              navigator.vibrate(100);
            }

            scanner
              .stop()
              .then(() => {
                addLog("info", "Scanner arrêté après détection");
                if (mountedRef.current) onScan(decodedText);
              })
              .catch(() => {
                if (mountedRef.current) onScan(decodedText);
              });
          },
          () => {
            // Count scan attempts (called each frame where no code is found)
            scanFrameCount++;
            if (scanFrameCount % 150 === 0) {
              // Log every ~10 seconds (15fps * 10s)
              if (mountedRef.current) {
                setScanAttempts(scanFrameCount);
                addLog("info", `${scanFrameCount} frames analysées, aucun code détecté`);
              }
            }
          }
        )
        .then(() => {
          if (mountedRef.current) {
            setStarting(false);
            setCameraReady(true);
            addLog("success", "Caméra activée et scanner prêt");

            // Log camera info
            try {
              const videoEl = document.querySelector("#barcode-reader video") as HTMLVideoElement;
              if (videoEl && videoEl.videoWidth) {
                addLog(
                  "info",
                  `Résolution vidéo: ${videoEl.videoWidth}x${videoEl.videoHeight}`
                );
              }
            } catch {
              // ignore
            }
          }
        })
        .catch((err: Error | string) => {
          if (!mountedRef.current) return;
          setStarting(false);
          const errStr = err.toString();
          addLog("error", `Échec démarrage caméra: ${errStr}`);

          if (
            errStr.includes("NotAllowedError") ||
            errStr.includes("Permission")
          ) {
            addLog("error", "Permission caméra refusée par l'utilisateur ou le navigateur");
            setError(
              "Accès à la caméra refusé. Autorise la caméra dans les paramètres de ton navigateur."
            );
          } else if (
            errStr.includes("NotFoundError") ||
            errStr.includes("device")
          ) {
            addLog("error", "Aucun périphérique caméra trouvé");
            setError("Aucune caméra trouvée sur cet appareil.");
          } else if (errStr.includes("NotReadableError")) {
            addLog("error", "Caméra en cours d'utilisation par une autre application");
            setError(
              "La caméra est utilisée par une autre application. Ferme les autres apps et réessaie."
            );
          } else if (errStr.includes("OverconstrainedError")) {
            addLog("error", "Contraintes caméra non satisfaites (facingMode: environment)");
            setError(
              "La caméra arrière n'est pas disponible. Essaie avec un autre appareil."
            );
          } else {
            addLog("error", `Erreur inconnue: ${errStr}`);
            setError(
              "Impossible de démarrer la caméra. Vérifie les permissions."
            );
          }
        });
    }, 300);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    addLog("info", "Fermeture du scanner par l'utilisateur");
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
      } catch {
        // ignore
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 shrink-0">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-5 h-5" />
          <span className="font-display font-semibold">
            Scanner un code-barres
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Debug toggle */}
          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`p-2 rounded-full transition-colors ${
              showDebug
                ? "bg-glupp-accent/30 text-glupp-accent"
                : "bg-white/10 hover:bg-white/20 text-white/60"
            }`}
            aria-label="Debug logs"
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
        <div
          id="barcode-reader"
          className="w-full h-full"
          style={{ minHeight: "300px" }}
        />

        {starting && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="text-center text-white">
              <div className="animate-spin w-8 h-8 border-2 border-glupp-accent border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm">Activation de la caméra...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black p-6 z-10">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-glupp-accent mx-auto mb-4" />
              <p className="text-white text-sm mb-6">{error}</p>
              <Button variant="primary" onClick={handleClose}>
                Fermer
              </Button>
            </div>
          </div>
        )}

        {/* Status indicators */}
        {!error && !starting && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full">
              <div
                className={`w-2 h-2 rounded-full ${
                  cameraReady ? "bg-green-400 animate-pulse" : "bg-red-400"
                }`}
              />
              <span className="text-[10px] text-white/80 font-medium">
                {cameraReady ? "Caméra active" : "En attente"}
              </span>
            </div>
            {scanAttempts > 0 && (
              <div className="px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full">
                <span className="text-[10px] text-white/60">
                  {scanAttempts} frames
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions or Debug panel */}
      <AnimatePresence mode="wait">
        {showDebug ? (
          <motion.div
            key="debug"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 shrink-0 max-h-[40vh] flex flex-col"
          >
            {/* Debug header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50">
              <div className="flex items-center gap-2">
                <Bug className="w-3.5 h-3.5 text-glupp-accent" />
                <span className="text-xs font-semibold text-white/90">
                  Debug Console
                </span>
                <span className="text-[10px] text-white/40">
                  ({logs.length} logs)
                </span>
              </div>
              <button
                onClick={() => setLogs([])}
                className="text-[10px] text-white/40 hover:text-white/70 transition-colors px-2 py-0.5 rounded bg-white/5"
              >
                Clear
              </button>
            </div>

            {/* Log entries */}
            <div className="flex-1 overflow-y-auto px-3 py-1.5 space-y-0.5 font-mono">
              {logs.length === 0 ? (
                <p className="text-[10px] text-white/30 py-2 text-center">
                  Aucun log
                </p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-1.5 py-0.5">
                    <span className="text-[10px] text-white/25 shrink-0 tabular-nums w-[52px]">
                      {log.timestamp.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    <span className="text-[10px] shrink-0">
                      {LOG_ICONS[log.level]}
                    </span>
                    <span
                      className={`text-[11px] leading-tight ${LOG_COLORS[log.level]}`}
                    >
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
            className="p-4 bg-black/80 text-center shrink-0"
          >
            {!error && (
              <p className="text-white/70 text-sm">
                Place le code-barres de la bière dans le cadre
              </p>
            )}
            {/* Mini status */}
            {!error && logs.length > 0 && (
              <button
                onClick={() => setShowDebug(true)}
                className="mt-1.5 text-[10px] text-white/30 hover:text-white/50 transition-colors"
              >
                {logs[logs.length - 1]?.message}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Override html5-qrcode internal styles */}
      <style jsx global>{`
        #barcode-reader {
          border: none !important;
        }
        #barcode-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #barcode-reader__dashboard {
          display: none !important;
        }
        #barcode-reader__header_message {
          display: none !important;
        }
        #barcode-reader img[alt="Info icon"] {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
