"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
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

  useEffect(() => {
    const scanner = new Html5Qrcode("barcode-reader");
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (hasScanned.current) return;
          hasScanned.current = true;

          // Vibrate on scan if supported
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }

          scanner
            .stop()
            .then(() => {
              onScan(decodedText);
            })
            .catch(() => {
              onScan(decodedText);
            });
        },
        () => {
          // Ignore scan failures (no code in frame)
        }
      )
      .then(() => {
        setStarting(false);
      })
      .catch((err) => {
        setStarting(false);
        if (
          err.toString().includes("NotAllowedError") ||
          err.toString().includes("Permission")
        ) {
          setError("Acces a la camera refuse. Autorise la camera dans les parametres de ton navigateur.");
        } else if (
          err.toString().includes("NotFoundError") ||
          err.toString().includes("device")
        ) {
          setError("Aucune camera trouvee sur cet appareil.");
        } else {
          setError("Impossible de demarrer la camera. Verifie les permissions.");
        }
      });

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, [onScan]);

  const handleClose = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-5 h-5" />
          <span className="font-display font-semibold">Scanner un code-barres</span>
        </div>
        <button
          onClick={handleClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Scanner viewport */}
      <div className="flex-1 relative flex items-center justify-center">
        <div id="barcode-reader" className="w-full h-full" />

        {starting && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white">
              <div className="animate-spin w-8 h-8 border-2 border-glupp-accent border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm">Activation de la camera...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black p-6">
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
        <div className="p-4 bg-black/80 text-center">
          <p className="text-white/70 text-sm">
            Place le code-barres de la biere dans le cadre
          </p>
        </div>
      )}
    </div>
  );
}
