"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Check, Bug, Lightbulb, MessageSquare, AlertCircle } from "lucide-react";

export function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setErrorMsg(null);
    
    try {
      // 1. On récupère les feedbacks de manière brute (sans jointure risquée)
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

      // 2. On récupère les identifiants uniques des utilisateurs
      const userIds = [...new Set(feedbacksData.map((f) => f.user_id))];

      // 3. On va chercher leurs infos dans ta table profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      // (Même si on ne trouve pas les profils, on veut quand même afficher les messages)
      const profilesMap = new Map((profilesData || []).map((p) => [p.id, p]));

      // 4. On assemble le tout
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
    fetchFeedbacks(); // On recharge la liste
  };

  if (loading) {
    return <div className="text-glupp-text-muted animate-pulse">Chargement des messages...</div>;
  }

  if (errorMsg) {
    return (
      <div className="p-4 bg-glupp-error/10 border border-glupp-error rounded-glupp text-glupp-error flex items-center gap-2">
        <AlertCircle size={20} />
        <p>Erreur : {errorMsg}</p>
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="p-8 text-center bg-glupp-card border border-glupp-border rounded-glupp">
        <MessageSquare size={32} className="mx-auto text-glupp-text-muted mb-3" />
        <p className="text-glupp-cream font-semibold">Aucun retour pour le moment</p>
        <p className="text-sm text-glupp-text-muted">La communauté n'a encore rien signalé.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">      
      {feedbacks.map((f) => (
        <div key={f.id} className={`p-4 rounded-glupp border ${f.status === 'resolved' ? 'bg-glupp-success/5 border-glupp-success/20 opacity-60' : 'bg-glupp-card border-glupp-border'}`}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              {f.type === 'bug' && <Bug size={16} className="text-glupp-error" />}
              {f.type === 'suggestion' && <Lightbulb size={16} className="text-glupp-accent" />}
              {f.type === 'problem' && <MessageSquare size={16} className="text-glupp-gold" />}
              <span className="text-sm font-semibold text-glupp-cream">
                {f.user?.username || "Anonyme"}
              </span>
              <span className="text-xs text-glupp-text-muted">
                {new Date(f.created_at).toLocaleDateString()}
              </span>
            </div>
            
            {f.status === 'pending' && (
              <button 
                onClick={() => markAsResolved(f.id)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-glupp-success/10 text-glupp-success hover:bg-glupp-success/20 transition-colors"
              >
                <Check size={12} />
                Marquer traité
              </button>
            )}
            {f.status === 'resolved' && (
               <span className="text-xs text-glupp-success flex items-center gap-1"><Check size={12}/> Traité</span>
            )}
          </div>
          <p className="text-sm text-glupp-text-soft mt-2 whitespace-pre-wrap">{f.message}</p>
        </div>
      ))}
    </div>
  );
}