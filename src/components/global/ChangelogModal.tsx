"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { X, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  features: Array<{ icon: string; text: string }>;
  created_at: string;
}

export function ChangelogModal() {
  const [changelog, setChangelog] = useState<ChangelogEntry | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const checkChangelog = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Récupérer la dernière version
        const { data: latest } = await supabase
          .from("changelogs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!latest) return;

        // Récupérer la version vue par l'user
        const { data: profile } = await supabase
          .from("profiles")
          .select("last_seen_version")
          .eq("id", user.id)
          .single();

        // Si pas la même version, afficher le changelog
        if (!profile?.last_seen_version || profile.last_seen_version !== latest.version) {
          setChangelog(latest as ChangelogEntry);
          setShow(true);
        }
      } catch {
        // Silently fail
      }
    };

    // Petit délai pour ne pas bloquer le chargement
    const timer = setTimeout(checkChangelog, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = async () => {
    setShow(false);

    if (changelog) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("profiles")
            .update({ last_seen_version: changelog.version })
            .eq("id", user.id);
        }
      } catch {
        // Silently fail
      }
    }
  };

  return (
    <AnimatePresence>
      {show && changelog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 30 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[#1E1B16] border border-[#3A3530] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header with gradient */}
            <div className="relative px-6 pt-8 pb-6 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[#E08840]/10 to-transparent" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#E08840]/5 rounded-full blur-[80px]" />
              
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 p-1.5 text-[#6B6050] hover:text-[#F5E6D3] transition-colors rounded-lg hover:bg-[#3A3530]"
              >
                <X size={18} />
              </button>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="relative inline-block mb-3"
              >
                <Sparkles size={32} className="text-[#E08840]" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-display text-xl font-bold text-[#F5E6D3] relative"
              >
                {changelog.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xs text-[#6B6050] mt-1"
              >
                Version {changelog.version}
              </motion.p>
            </div>

            {/* Description */}
            <div className="px-6 pb-3">
              <p className="text-sm text-[#A89888] text-center leading-relaxed">
                {changelog.description}
              </p>
            </div>

            {/* Features list */}
            <div className="px-6 pb-6 space-y-2">
              {changelog.features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className="flex items-start gap-3 px-3 py-2.5 bg-[#141210] rounded-xl border border-[#3A3530]/50"
                >
                  <span className="text-base shrink-0 mt-0.5">{feature.icon}</span>
                  <p className="text-xs text-[#F5E6D3] leading-relaxed">{feature.text}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="px-6 pb-6">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleClose}
              >
                C&apos;est note !
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
