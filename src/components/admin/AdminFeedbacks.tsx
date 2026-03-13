"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAdmin } from "@/lib/hooks/useAdmin";
import { Check, Bug, Lightbulb, MessageSquare, AlertCircle, Gift, Loader2 } from "lucide-react";

export function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { awardXP } = useAdmin();
  const [rewardingId, setRewardingId] = useState<string | null>(null);
  const [xpAmount, setXpAmount] = useState<string>("50");
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

  const handleAwardXP = async (userId: string, feedbackId: string) => {
    const amount = Number(xpAmount);
    if (!amount || isNaN(amount) || amount <= 0) return;

    setIsSubmittingXp(true);
    try {
      await awardXP(userId, amount, "Récompense pour un feedback pertinent");
      
      const { error: activityError } = await supabase
        .from('activities')
        .insert([{
          user_id: userId,
          type: 'glupp',
          data: { 
            message: `L'équipe t'a récompensé de ${amount} XP pour ton retour ! Merci de nous aider à améliorer l'appli 🍻` 
          }
        }]);

      if (activityError) {
        console.warn("L'XP a été donné, mais la notification a échoué :", activityError);
      }

      await supabase.from("feedbacks").update({ status: "resolved" }).eq("id", feedbackId);

      alert(`${amount} XP ont bien été envoyés à l'utilisateur !`);
      setRewardingId(null); 
      fetchFeedbacks(); 
      
    } catch (error) {
      console.error("Erreur XP:", error);
      alert("Une erreur est survenue lors de l'attribution de l'XP.");
    } finally {
      setIsSubmittingXp(false);
    }
  };

  if (loading) {
    return <div className="text-[#8C8273] animate-pulse">Chargement des messages...</div>;
  }

  if (errorMsg) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 flex items-center gap-2">
        <AlertCircle size={20} />
        <p>Erreur : {errorMsg}</p>
      </div>
    );
  }

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
          
          {/* 🛠️ MODIFICATION : flex-col sur mobile, flex-row sur écran plus grand */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
            
            {/* Infos de gauche */}
            <div className="flex items-center gap-2 flex-wrap">
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
            
            {/* Boutons d'actions de droite (qui passeront en dessous sur mobile) */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              
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