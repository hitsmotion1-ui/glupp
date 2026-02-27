"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // Check if user dismissed recently
    const dismissed = localStorage.getItem("glupp-pwa-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      // Don't show for 7 days after dismissal
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Show after a short delay to not be intrusive
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // For iOS (no beforeinstallprompt), show manual instructions after delay
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    if (isIOS && !standalone) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
        setInstallPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("glupp-pwa-dismissed", Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-24 left-4 right-4 z-[60] bg-glupp-card border border-glupp-accent/30 rounded-glupp-lg p-4 shadow-glupp-accent"
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full text-glupp-text-muted hover:text-glupp-cream transition-colors"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-glupp bg-glupp-accent/15 flex items-center justify-center shrink-0">
            <Smartphone size={20} className="text-glupp-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-glupp-cream text-sm mb-1">
              Installe Glupp !
            </h3>
            <p className="text-xs text-glupp-text-soft leading-relaxed mb-3">
              {isIOS
                ? "Appuie sur le bouton Partager puis \"Sur l'écran d'accueil\" pour installer Glupp."
                : "Ajoute Glupp sur ton écran d'accueil pour une expérience optimale."}
            </p>

            {!isIOS && installPrompt && (
              <Button variant="primary" size="sm" onClick={handleInstall}>
                <Download size={14} className="mr-1.5" />
                Installer
              </Button>
            )}

            {isIOS && (
              <div className="flex items-center gap-2 px-3 py-2 bg-glupp-bg rounded-glupp text-xs text-glupp-text-soft">
                <span>📤</span>
                <span>
                  Partager → &quot;Sur l&apos;écran d&apos;accueil&quot;
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
