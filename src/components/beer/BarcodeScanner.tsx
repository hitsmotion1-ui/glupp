"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, Camera, AlertTriangle, Bug, Flashlight, FlashlightOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

/* --- Log system --- */
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

/* --- Component --- */
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
    setLogs((prev) => [...prev.slice(-50), { id, level, message, timestamp: new Date() }]);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    addLog("info", "Initialisation du scanner...");

    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      addLog("error", "API MediaDevices non supportee par ce navigateur");
      setError("Ton navigateur ne supporte pas l'acces a la camera.");
      setStarting(false);
      return;
    }
    addLog("info", "API MediaDevices disponible");

    // Check HTTPS
    if (location.protocol !== "https:" && location.hostname !== "localhost") {
      addLog("warn", `Protocole: ${location.protocol} -- HTTPS requis pour la camera`);
    } else {
      addLog("info", `Protocole: ${location.protocol} OK`);
    }

    // Check native BarcodeDetector API
    const hasBarcodeDetector = "BarcodeDetector" in window;
    addLog("info", `BarcodeDetector API native: ${hasBarcodeDetector ? "OUI" : "NON (fallback ZXing)"}`);

    const timer = setTimeout(() => {
      if (!mountedRef.current) return;

      const scannerId = "barcode-reader";
      const el = document.getElementById(scannerId);
      if (!el) {
        addLog("error", "Element DOM #barcode-reader introuvable");
        setError("Erreur d'initialisation du scanner.");
        setStarting(false);
        return;
      }
      addLog("info", `Element DOM trouve (${el.offsetWidth}x${el.offsetHeight}px)`);

      const formats = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.QR_CODE,
      ];
      addLog("info", `Formats: EAN-13, EAN-8, UPC-A, UPC-E, CODE-128, CODE-39, QR`);

      const scanner = new Html5Qrcode(scannerId, {
        formatsToSupport: formats,
        verbose: false,
        useBarCodeDetectorIfSupported: true,
      });
      scannerRef.current = scanner;
      addLog("info", "Instance Html5Qrcode creee (useBarCodeDetector: true)");

      // Use a function for qrbox that returns dimensions based on viewport
      // Scan a LARGE area — almost the entire viewport
      const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
        const width = Math.floor(viewfinderWidth * 0.9);
        const height = Math.floor(viewfinderHeight * 0.7);
        return { width, height };
      };
      addLog("info", `QR box: 90% x 70% du viewfinder (zone large)`);

      addLog("info", "Demande d'acces camera...");

      let scanFrameCount = 0;

      scanner
        .start(
          { facingMode: "environment" },
          {
            fps: 30,
            qrbox: qrboxFunction,
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (decodedText, result) => {
            if (hasScanned.current) return;
            hasScanned.current = true;

            const format = result?.result?.format?.formatName || "inconnu";
            addLog("success", `Code detecte! Format: ${format}, Valeur: ${decodedText}`);

            if (navigator.vibrate) {
              navigator.vibrate(100);
            }

            scanner
              .stop()
              .then(() => {
                addLog("info", "Scanner arrete apres detection");
                if (mountedRef.current) onScan(decodedText);
              })
              .catch(() => {
                if (mountedRef.current) onScan(decodedText);
              });
          },
          () => {
            // Count scan attempts (called each frame where no code is found)
            scanFrameCount++;
            if (scanFrameCount % 300 === 0) {
              // Log every ~10 seconds (30fps * 10s)
              if (mountedRef.current) {
                setScanAttempts(scanFrameCount);
                addLog("info", `${scanFrameCount} frames analysees, aucun code detecte`);
              }
            }
          }
        )
        .then(() => {
          if (mountedRef.current) {
            setStarting(false);
            setCameraReady(true);
            addLog("success", "Camera activee et scanner pret (30fps, zone large)");

            // Log camera info
            try {
              const videoEl = document.querySelector("#barcode-reader video") as HTMLVideoElement;
              if (videoEl && videoEl.videoWidth) {
                addLog(
                  "info",
                  `Resolution video: ${videoEl.videoWidth}x${videoEl.videoHeight}`
                );

                // Check actual scan region vs video resolution
                const scanW = Math.floor(videoEl.videoWidth * 0.9);
                const scanH = Math.floor(videoEl.videoHeight * 0.7);
                addLog("info", `Zone de scan effective: ${scanW}x${scanH}px`);
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
          addLog("error", `Echec demarrage camera: ${errStr}`);

          if (
            errStr.includes("NotAllowedError") ||
            errStr.includes("Permission")
          ) {
            addLog("error", "Permission camera refusee par l'utilisateur ou le navigateur");
            setError(
              "Acces a la camera refuse. Autorise la camera dans les parametres de ton navigateur."
            );
          } else if (
            errStr.includes("NotFoundError") ||
            errStr.includes("device")
          ) {
            addLog("error", "Aucun peripherique camera trouve");
            setError("Aucune camera trouvee sur cet appareil.");
          } else if (errStr.includes("NotReadableError")) {
            addLog("error", "Camera en cours d'utilisation par une autre application");
            setError(
              "La camera est utilisee par une autre application. Ferme les autres apps et reessaie."
            );
          } else if (errStr.includes("OverconstrainedError")) {
            addLog("error", "Contraintes camera non satisfaites (facingMode: environment)");
            setError(
              "La camera arriere n'est pas disponible. Essaie avec un autre appareil."
            );
          } else {
            addLog("error", `Erreur inconnue: ${errStr}`);
            setError(
              "Impossible de demarrer la camera. Verifie les permissions."
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
              <p className="text-sm">Activation de la camera...</p>
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
                {cameraReady ? "Camera active" : "En attente"}
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

        {/* Scan guide overlay - thin horizontal line to show scan area */}
        {!error && !starting && cameraReady && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
            <div className="w-[85%] relative">
              {/* Animated scan line */}
              <motion.div
                animate={{ y: [-30, 30] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                className="h-0.5 bg-glupp-accent/80 shadow-[0_0_8px_rgba(224,136,64,0.5)]"
              />
              {/* Corner markers */}
              <div className="absolute -top-16 -left-2 w-6 h-6 border-t-2 border-l-2 border-glupp-accent/60 rounded-tl-lg" />
              <div className="absolute -top-16 -right-2 w-6 h-6 border-t-2 border-r-2 border-glupp-accent/60 rounded-tr-lg" />
              <div className="absolute top-12 -left-2 w-6 h-6 border-b-2 border-l-2 border-glupp-accent/60 rounded-bl-lg" />
              <div className="absolute top-12 -right-2 w-6 h-6 border-b-2 border-r-2 border-glupp-accent/60 rounded-br-lg" />
            </div>
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
                Place le code-barres de la biere dans le cadre
              </p>
            )}
            {/* Mini status */}
            {!error && scanAttempts > 200 && (
              <p className="mt-1.5 text-[10px] text-yellow-400/70">
                Essaie de rapprocher ou eloigner la camera du code-barres
              </p>
            )}
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
        /* Hide the shaded region to make the scan area cleaner */
        #barcode-reader__scan_region {
          min-height: 0 !important;
        }
        #barcode-reader__scan_region > br {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
