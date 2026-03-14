"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId?: string;
  reportedUserId: string;
}

const REPORT_REASONS = [
  "Contenu inapproprié ou offensant",
  "Incitation à la consommation excessive",
  "Spam ou arnaque",
  "Harcèlement ou intimidation",
  "Photo indécente ou choquante"
];

export function ReportModal({ isOpen, onClose, activityId, reportedUserId }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReport = async () => {
    if (!selectedReason) return;
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      const { error } = await supabase.from("reports").insert([{
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        activity_id: activityId || null,
        reason: selectedReason
      }]);

      if (error) throw error;

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedReason("");
        onClose();
      }, 2000);

    } catch (error) {
      console.error("Erreur lors du signalement :", error);
      alert("Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Signaler ce contenu">
      <div className="p-2">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
            <CheckCircle size={48} className="text-glupp-success mb-4" />
            <h3 className="text-lg font-bold text-glupp-cream mb-2">Signalement envoyé</h3>
            <p className="text-sm text-glupp-text-soft">
              Merci ! Notre équipe de modération va examiner ce contenu au plus vite.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-glupp-card border border-glupp-border rounded-lg">
              <AlertTriangle size={20} className="text-glupp-gold shrink-0 mt-0.5" />
              <p className="text-xs text-glupp-text-soft leading-relaxed">
                Le signalement est anonyme. L'utilisateur ne saura pas que tu as signalé son contenu. En cas d'urgence, n'hésite pas à nous contacter directement.
              </p>
            </div>

            <div className="space-y-2 mt-4">
              <p className="text-sm font-semibold text-glupp-cream mb-2">Pourquoi signales-tu ce contenu ?</p>
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors border ${
                    selectedReason === reason 
                      ? "bg-glupp-accent/10 border-glupp-accent text-glupp-accent" 
                      : "bg-glupp-bg border-glupp-border text-glupp-cream hover:border-glupp-text-muted"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="pt-4 mt-2 border-t border-glupp-border/50 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={onClose} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button 
                variant="primary" 
                className="flex-1 bg-red-500 hover:bg-red-600 text-white" 
                onClick={handleReport}
                disabled={!selectedReason || isSubmitting}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Envoyer"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}