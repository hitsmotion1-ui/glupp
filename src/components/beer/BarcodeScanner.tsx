"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, Camera, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

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

  useEffect(() => {
    mountedRef.current = true;

    // Small delay to ensure DOM element is rendered
    const timer = setTimeout(() => {
      if (!mountedRef.current) return;

      const scannerId = "barcode-reader";
      const el = document.getElementById(scannerId);
      if (!el) {
        setError("Erreur d'initialisation du scanner.");
        setStarting(false);
        return;
      }

      const scanner = new Html5Qrcode(scannerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });
      scannerRef.current = scanner;

      // Responsive qrbox
      const viewportWidth = window.innerWidth;
      const qrboxWidth = Math.min(280, viewportWidth - 60);
      const qrboxHeight = Math.round(qrboxWidth * 0.55);

      scanner
        .start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: qrboxWidth, height: qrboxHeight },
            disableFlip: false,
          },
          (decodedText) => {
            if (hasScanned.current) return;
            hasScanned.current = true;

            if (navigator.vibrate) {
              navigator.vibrate(100);
            }

            scanner
              .stop()
              .then(() => {
                if (mountedRef.current) onScan(decodedText);
              })
              .catch(() => {
                if (mountedRef.current) onScan(decodedText);
              });
          },
          () => {
            // Ignore scan failures
          }
        )
        .then(() => {
          if (mountedRef.current) setStarting(false);
        })
        .catch((err: Error | string) => {
          if (!mountedRef.current) return;
          setStarting(false);
          const errStr = err.toString();
          if (
            errStr.includes("NotAllowedError") ||
            errStr.includes("Permission")
          ) {
            setError(
              "Accès à la caméra refusé. Autorise la caméra dans les paramètres de ton navigateur."
            );
          } else if (
            errStr.includes("NotFoundError") ||
            errStr.includes("device")
          ) {
            setError("Aucune caméra trouvée sur cet appareil.");
          } else {
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
        <button
          onClick={handleClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
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
      </div>

      {/* Instructions */}
      {!error && (
        <div className="p-4 bg-black/80 text-center shrink-0">
          <p className="text-white/70 text-sm">
            Place le code-barres de la bière dans le cadre
          </p>
        </div>
      )}

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
