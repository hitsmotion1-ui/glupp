"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { MessageSquare, Bug, Lightbulb, CheckCircle2, Loader2 } from "lucide-react";

export function FeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [type, setType] = useState<"bug" | "suggestion" | "problem">("suggestion");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      const { error } = await supabase
        .from("feedbacks")
        .insert([{ user_id: user.id, type, message }]);

      if (error) throw error;
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setMessage("");
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de l'envoi :", error);
      alert("Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Donner mon avis">
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle2 size={48} className="text-glupp-success mb-4" />
          <h3 className="text-lg font-bold text-glupp-cream">Merci !</h3>
          <p className="text-sm text-glupp-text-muted mt-2">
            Ton message a bien été envoyé. Nous allons regarder ça de près !
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setType("bug")}
              className={`flex flex-col items-center p-3 rounded-glupp border transition-colors ${
                type === "bug" ? "bg-glupp-error/20 border-glupp-error text-glupp-error" : "bg-glupp-card border-glupp-border text-glupp-text-muted hover:bg-glupp-card-alt"
              }`}
            >
              <Bug size={20} className="mb-1" />
              <span className="text-xs font-medium">Bug</span>
            </button>
            <button
              type="button"
              onClick={() => setType("suggestion")}
              className={`flex flex-col items-center p-3 rounded-glupp border transition-colors ${
                type === "suggestion" ? "bg-glupp-accent/20 border-glupp-accent text-glupp-accent" : "bg-glupp-card border-glupp-border text-glupp-text-muted hover:bg-glupp-card-alt"
              }`}
            >
              <Lightbulb size={20} className="mb-1" />
              <span className="text-xs font-medium">Idée</span>
            </button>
            <button
              type="button"
              onClick={() => setType("problem")}
              className={`flex flex-col items-center p-3 rounded-glupp border transition-colors ${
                type === "problem" ? "bg-glupp-gold/20 border-glupp-gold text-glupp-gold" : "bg-glupp-card border-glupp-border text-glupp-text-muted hover:bg-glupp-card-alt"
              }`}
            >
              <MessageSquare size={20} className="mb-1" />
              <span className="text-xs font-medium">Autre</span>
            </button>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Explique-nous tout en détails..."
            className="w-full h-32 bg-glupp-card border border-glupp-border rounded-glupp p-3 text-sm text-glupp-cream placeholder-glupp-text-muted focus:outline-none focus:border-glupp-accent resize-none"
            required
          />

          <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting || !message.trim()}>
            {isSubmitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Envoyer"}
          </Button>
        </form>
      )}
    </Modal>
  );
}