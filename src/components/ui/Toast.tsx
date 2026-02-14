"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const typeStyles = {
  success: "bg-glupp-success/90 text-white",
  error: "bg-glupp-error/90 text-white",
  info: "bg-glupp-card border border-glupp-border text-glupp-cream",
};

export function Toast({
  message,
  type = "info",
  isVisible,
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-glupp text-sm font-medium shadow-glupp ${typeStyles[type]}`}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
