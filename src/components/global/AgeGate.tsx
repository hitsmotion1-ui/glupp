"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Beer, AlertTriangle } from "lucide-react";

export function AgeGate() {
  // On initialise à true pour éviter que la modale clignote pendant le chargement
  const [isVerified, setIsVerified] = useState(true); 
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // On vérifie côté client si l'utilisateur a déjà validé son âge
    const verified = localStorage.getItem("glupp_age_verified");
    if (!verified) {
      setIsVerified(false);
    }
  }, []);

  const handleYes = () => {
    localStorage.setItem("glupp_age_verified", "true");
    setIsVerified(true);
  };

  const handleNo = () => {
    setShowError(true);
  };

  // Si l'âge est vérifié, le composant ne retourne rien (invisible)
  if (isVerified) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#141210]/95 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-[#1E1B16] border border-[#3A3530] rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
      >
        <div className="w-16 h-16 bg-[#E08840]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#E08840]/20">
          <Beer size={32} className="text-[#E08840]" />
        </div>

        <h1 className="font-display text-2xl font-bold text-[#F5E6D3] mb-2">
          Bienvenue sur Glupp !
        </h1>

        <AnimatePresence mode="wait">
          {showError ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="space-y-4"
            >
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-left">
                <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-[#A89888] leading-relaxed">
                  Désolé, cette application est strictement réservée aux personnes majeures. Reviens dans quelques années !
                </p>
              </div>
              <button 
                onClick={() => setShowError(false)} 
                className="text-sm text-[#E08840] hover:underline"
              >
                Retour
              </button>
            </motion.div>
          ) : (
            <motion.div key="ask" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-[#A89888] mb-8 text-sm leading-relaxed">
                Pour accéder à l'application, tu dois certifier avoir l'âge légal pour consommer de l'alcool dans ton pays de résidence.
              </p>

              <div className="space-y-3 mb-6">
                <button
                  onClick={handleYes}
                  className="w-full py-3 rounded-xl bg-[#E08840] text-[#141210] font-bold text-lg hover:bg-[#DCB04C] transition-colors"
                >
                  J'ai plus de 18 ans
                </button>
                <button
                  onClick={handleNo}
                  className="w-full py-3 rounded-xl bg-[#141210] border border-[#3A3530] text-[#A89888] font-medium hover:text-[#F5E6D3] hover:border-[#6B6050] transition-colors"
                >
                  Je suis mineur
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-4 border-t border-[#3A3530]/50 mt-2">
          <p className="text-[10px] text-[#6B6050] uppercase tracking-wider font-semibold leading-relaxed">
            L'abus d'alcool est dangereux pour la santé, à consommer avec modération.
          </p>
        </div>
      </motion.div>
    </div>
  );
}