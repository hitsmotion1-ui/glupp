import { Crown, Sparkles, Clock, Trophy } from "lucide-react";

export default function RankingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ── ICÔNE CENTRALE AVEC BADGE ── */}
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-[#1E1B16] border-2 border-[#E08840]/30 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(224,136,64,0.15)]">
          <Crown size={48} className="text-[#F0C460]" />
        </div>
        <div className="absolute -top-2 -right-2 bg-[#1E1B16] border-2 border-[#3A3530] rounded-full p-2 animate-bounce shadow-xl">
          <Clock size={20} className="text-[#E08840]" />
        </div>
      </div>
      
      {/* ── TITRE ET TEXTE ── */}
      <h1 className="font-display text-4xl font-bold text-[#F7F3EE] mb-4">
        Le Classement
      </h1>
      
      <p className="text-[#A89888] max-w-md mx-auto mb-10 text-lg leading-relaxed">
        Prépare-toi à affronter les meilleurs Gluppers ! Le système de compétition mondiale est en cours de création.
      </p>

      {/* ── PETITE CARTE "CE QUI ARRIVE" ── */}
      <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl p-6 max-w-sm w-full mx-auto text-left shadow-lg">
        <h3 className="font-semibold text-[#F7F3EE] flex items-center gap-2 mb-4 border-b border-[#3A3530] pb-3">
          <Sparkles size={18} className="text-[#E08840]" />
          Fonctionnalités à venir
        </h3>
        
        <ul className="text-sm text-[#8C8273] space-y-4">
          <li className="flex items-start gap-3">
            <div className="mt-0.5 bg-[#14120F] border border-[#3A3530] p-1.5 rounded-md text-[#F0C460]">
              <Trophy size={14} />
            </div>
            <div>
              <span className="block text-[#E8E1D5] font-medium mb-0.5">Classement Global</span>
              Compare ton XP avec tous les utilisateurs de l'application.
            </div>
          </li>
          
          <li className="flex items-start gap-3">
            <div className="mt-0.5 bg-[#14120F] border border-[#3A3530] p-1.5 rounded-md text-[#4ECDC4]">
              <Crown size={14} />
            </div>
            <div>
              <span className="block text-[#E8E1D5] font-medium mb-0.5">Ligues Mensuelles</span>
              Gagne ta place de Bronze à Légende à chaque saison.
            </div>
          </li>
        </ul>
      </div>

    </div>
  );
}