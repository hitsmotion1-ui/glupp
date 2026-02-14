"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store/useAppStore";

export function XPToast() {
  const { xpToast, clearXPToast } = useAppStore();

  useEffect(() => {
    if (xpToast) {
      const timer = setTimeout(clearXPToast, 1500);
      return () => clearTimeout(timer);
    }
  }, [xpToast, clearXPToast]);

  return (
    <AnimatePresence>
      {xpToast && (
        <motion.div
          initial={{ scale: 0.5, y: 20, opacity: 0 }}
          animate={{ scale: 1.2, y: -30, opacity: 1 }}
          exit={{ scale: 1, y: -60, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[70] pointer-events-none"
        >
          <div className="bg-glupp-accent text-white px-5 py-2 rounded-glupp-lg shadow-glupp-accent font-display font-bold text-lg whitespace-nowrap">
            +{xpToast.amount} XP {xpToast.label}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
