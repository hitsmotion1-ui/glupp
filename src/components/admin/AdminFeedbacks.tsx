"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAdmin } from "@/lib/hooks/useAdmin"; // 👈 On importe ton hook d'administration
import { Check, Bug, Lightbulb, MessageSquare, AlertCircle, Gift, Loader2 } from "lucide-react";

export function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 🆕 Outils pour donner de l'XP
  const { awardXP } = useAdmin();
  const [rewardingId, setRewardingId] = useState<string | null>(null); // Quel feedback on est en train de récompenser
  const [xpAmount, setXpAmount] = useState<string>("50"); // Montant par défaut
  const [isSubmittingXp, setIsSubmittingXp] = useState(false);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setErrorMsg(null);
    
    try {
      const { data: feedbacksData, error: feedbacksError } = await supabase
        .from("feedbacks")
        .select("*")
        .order("created_at", { ascending: false });

      if (feedbacksError) throw feedbacksError;

      if (!feedbacksData || feedbacksData.length === 0) {
        setFeedbacks([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(feedbacksData.map((f) => f.user_id))];

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const profilesMap = new Map((profilesData || []).map((p) => [p.id, p]));

      const enrichedFeedbacks = feedbacksData.map((f) => ({
        ...f,
        user: profilesMap.get(f.user_id) || { username: "Utilisateur inconnu" },
      }));

      setFeedbacks(enrichedFeedbacks);
    } catch (err: any) {
      console.error("Erreur de récupération :", err);
      setErrorMsg(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const markAsResolved = async (id: string) => {
    await supabase.from("feedbacks").update({ status: "resolved" }).eq("id", id);
    fetchFeedbacks(); 
  };

// 🆕 Fonction pour valider le don d'XP ET notifier l'utilisateur
  const handleAwardXP = async (userId: string, feedbackId: string) => {
    const amount = Number(xpAmount);
    if (!amount || isNaN(amount) || amount <= 0) return;

    setIsSubmittingXp(true);
    try {
      // 1. On donne l'XP via ta fonction existante
      await awardXP(userId, amount, "Récompense pour un feedback pertinent");
      
      // 2. On crée une activité (notification in-app) pour l'utilisateur
      // Assure-toi que la structure correspond bien à ta table 'activities'
      const { error: activityError } = await supabase
        .from('activities')
        .insert([{
          user_id: userId,
          type: 'glupp', // Ou un type spécial genre 'reward' ou 'admin_message' si tu en as un
          data: { 
            message: `L'équipe t'a récompensé de ${amount} XP pour ton retour ! Merci de nous aider à améliorer l'appli 🍻` 
          }
        }]);

      if (activityError) {
        console.warn("L'XP a été donné, mais la notification a échoué :", activityError);
      }

      // 3. (Optionnel) On marque le feedback comme traité
      await supabase.from("feedbacks").update({ status: "resolved" }).eq("id", feedbackId);

      alert(`${amount} XP ont bien été envoyés à l'utilisateur !`);
      setRewardingId(null); 
      fetchFeedbacks(); // On recharge pour voir le statut "Traité"
      
    } catch (error) {
      console.error("Erreur XP:", error);
      alert("Une erreur est survenue lors de l'attribution de l'XP.");
    } finally {
      setIsSubmittingXp(false);
    }
  };

  if (feedbacks.length === 0) {
    return (
      <div className="p-8 text-center bg-[#1E1B16] border border-[#3A3530] rounded-xl">
        <MessageSquare size={32} className="mx-auto text-[#6B6050] mb-3" />
        <p className="text-[#E8E1D5] font-semibold">Aucun retour pour le moment</p>
        <p className="text-sm text-[#8C8273]">La communauté n'a encore rien signalé.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">      
      {feedbacks.map((f) => (
        <div key={f.id} className={`p-4 rounded-xl border ${f.status === 'resolved' ? 'bg-[#10B981]/5 border-[#10B981]/20 opacity-70' : 'bg-[#1E1B16] border-[#3A3530]'}`}>
          <div className="flex justify-between items-start mb-2">
            
            {/* Infos de gauche */}
            <div className="flex items-center gap-2">
              {f.type === 'bug' && <Bug size={16} className="text-red-500" />}
              {f.type === 'suggestion' && <Lightbulb size={16} className="text-[#4ECDC4]" />}
              {f.type === 'problem' && <MessageSquare size={16} className="text-[#F0C460]" />}
              <span className="text-sm font-semibold text-[#E8E1D5]">
                {f.user?.username || "Anonyme"}
              </span>
              <span className="text-xs text-[#8C8273]">
                {new Date(f.created_at).toLocaleDateString()}
              </span>
            </div>
            
            {/* Boutons d'actions de droite */}
            <div className="flex items-center gap-2">
              
              {/* Le module de récompense XP */}
              {rewardingId === f.id ? (
                <div className="flex items-center gap-1 bg-[#14120F] border border-[#3A3530] rounded-lg p-1">
                  <input 
                    type="number" 
                    value={xpAmount} 
                    onChange={(e) => setXpAmount(e.target.value)}
                    className="w-14 bg-transparent text-sm text-center text-[#E8E1D5] outline-none"
                    placeholder="XP"
                  />
                  <button 
                    onClick={() => handleAwardXP(f.user_id, f.id)}
                    disabled={isSubmittingXp}
                    className="px-2 py-1 bg-[#E08840] text-[#1E1B16] text-xs font-bold rounded hover:bg-opacity-90 disabled:opacity-50"
                  >
                    {isSubmittingXp ? <Loader2 size={12} className="animate-spin" /> : "OK"}
                  </button>
                  <button 
                    onClick={() => setRewardingId(null)}
                    className="px-2 py-1 text-xs text-[#8C8273] hover:text-[#E8E1D5]"
                  >
                    X
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { setRewardingId(f.id); setXpAmount("50"); }}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-[#E08840]/10 text-[#E08840] hover:bg-[#E08840]/20 transition-colors"
                  title="Récompenser ce retour avec de l'XP"
                >
                  <Gift size={12} />
                  Récompenser
                </button>
              )}

              {/* Le bouton Marquer comme traité */}
              {f.status === 'pending' && (
                <button 
                  onClick={() => markAsResolved(f.id)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 transition-colors"
                >
                  <Check size={12} />
                  Marquer traité
                </button>
              )}
              {f.status === 'resolved' && (
                 <span className="text-xs text-[#10B981] flex items-center gap-1"><Check size={12}/> Traité</span>
              )}

            </div>
          </div>
          <p className="text-sm text-[#A89888] mt-2 whitespace-pre-wrap">{f.message}</p>
        </div>
      ))}
    </div>
  );
}
