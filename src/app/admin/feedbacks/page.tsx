"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Check, Bug, Lightbulb, MessageSquare } from "lucide-react";

export function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  const fetchFeedbacks = async () => {
    const { data, error } = await supabase
      .from("feedbacks")
      .select("*, user:user_id(username, avatar_url)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFeedbacks(data);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const markAsResolved = async (id: string) => {
    await supabase.from("feedbacks").update({ status: "resolved" }).eq("id", id);
    fetchFeedbacks(); // On recharge la liste
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-glupp-cream mb-4">Retours utilisateurs</h2>
      
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