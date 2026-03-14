"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import {
  AlertTriangle,
  CheckCircle,
  Trash2,
  X,
  ExternalLink,
  Loader2,
  ShieldAlert
} from "lucide-react";

export default function AdminReportsPage() {
  const queryClient = useQueryClient();

  // 1. Récupération des signalements
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          id,
          reason,
          status,
          created_at,
          reporter:profiles!reporter_id(username, display_name),
          reported:profiles!reported_user_id(username, display_name),
          activity:activities(id, photo_url, type)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // 2. Action : Marquer comme "Résolu" ou "Ignoré"
  const updateStatusMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string, status: string }) => {
      const { error } = await supabase
        .from("reports")
        .update({ status })
        .eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
    }
  });

  // 3. Action : Supprimer l'activité + Marquer comme résolu
  const deleteActivityMutation = useMutation({
    mutationFn: async ({ activityId, reportId }: { activityId: string, reportId: string }) => {
      // D'abord on supprime le glupp (utilise ta fonction RPC si tu en as une, ou un simple delete)
      const { error: deleteError } = await supabase.rpc("admin_delete_glupp", { p_activity_id: activityId });
      if (deleteError) throw deleteError;

      // Ensuite on ferme le signalement
      const { error: updateError } = await supabase
        .from("reports")
        .update({ status: "resolved" })
        .eq("id", reportId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "activities"] });
    }
  });

  return (
    <div className="min-h-screen bg-[#141210]">
      <AdminHeader
        title="Signalements"
        subtitle={`${reports.filter(r => r.status === 'pending').length} signalement(s) en attente`}
      />

      <div className="px-6 py-6 lg:px-8 space-y-4">
        <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl overflow-hidden">
          
          {/* En-tête du tableau */}
          <div className="hidden lg:grid grid-cols-[100px_1fr_1fr_120px_160px] gap-3 px-4 py-3 border-b border-[#3A3530] text-[10px] font-semibold uppercase tracking-wider text-[#6B6050] bg-[#141210]/50">
            <span>Statut</span>
            <span>Signalé par / Contre</span>
            <span>Raison</span>
            <span>Date</span>
            <span className="text-right">Actions</span>
          </div>

          {isLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#E08840]" /></div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ShieldAlert size={36} strokeWidth={1.2} className="mb-2 text-[#3A3530]" />
              <p className="text-sm text-[#6B6050]">Aucun signalement pour le moment. Tout va bien !</p>
            </div>
          ) : (
            <div className="divide-y divide-[#3A3530]/50">
              {reports.map((report: any) => {
                const isPending = report.status === "pending";
                const reporterName = report.reporter?.display_name || report.reporter?.username || "Utilisateur supprimé";
                const reportedName = report.reported?.display_name || report.reported?.username || "Utilisateur supprimé";

                return (
                  <div key={report.id} className={`flex flex-col lg:grid lg:grid-cols-[100px_1fr_1fr_120px_160px] gap-3 px-4 py-3 items-center transition-colors ${isPending ? 'bg-[#3A3530]/10' : 'opacity-60'}`}>
                    
                    {/* Statut */}
                    <div className="w-full lg:w-auto flex items-center gap-2">
                      {isPending ? (
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-500/20 text-red-500 flex items-center gap-1 border border-red-500/30">
                          <AlertTriangle size={10} /> À traiter
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-green-500/10 text-green-500 flex items-center gap-1 border border-green-500/20">
                          <CheckCircle size={10} /> {report.status === 'resolved' ? 'Résolu' : 'Ignoré'}
                        </span>
                      )}
                    </div>

                    {/* Utilisateurs */}
                    <div className="w-full lg:w-auto text-sm min-w-0">
                      <p className="text-[#6B6050] truncate text-xs">Par: <span className="text-[#A89888]">@{reporterName}</span></p>
                      <p className="text-[#F5E6D3] truncate font-medium mt-0.5">Contre: @{reportedName}</p>
                    </div>

                    {/* Raison & Contenu */}
                    <div className="w-full lg:w-auto text-sm">
                      <p className="text-red-400 font-medium mb-1">{report.reason}</p>
                      {report.activity?.photo_url && (
                        <a 
                          href={report.activity.photo_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#141210] border border-[#3A3530] text-[#E08840] hover:bg-[#3A3530] text-xs transition-colors"
                        >
                          <ExternalLink size={12} />
                          Voir la photo signalée
                        </a>
                      )}
                    </div>

                    {/* Date */}
                    <div className="w-full lg:w-auto text-xs text-[#6B6050]">
                      {new Date(report.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute:"2-digit" })}
                    </div>

                    {/* Actions */}
                    <div className="w-full lg:w-auto flex items-center lg:justify-end gap-2">
                      {isPending && (
                        <>
                          <button
                            onClick={() => updateStatusMutation.mutate({ reportId: report.id, status: "dismissed" })}
                            className="px-2 py-1.5 text-xs rounded-md bg-[#141210] border border-[#3A3530] text-[#A89888] hover:text-white hover:border-[#6B6050] transition-colors"
                            title="Ignorer ce signalement (Fausse alerte)"
                          >
                            Ignorer
                          </button>

                          {report.activity?.id && (
                            <button
                              onClick={() => {
                                if (window.confirm("Supprimer définitivement ce Glupp et clôturer le signalement ?")) {
                                  deleteActivityMutation.mutate({ activityId: report.activity.id, reportId: report.id });
                                }
                              }}
                              disabled={deleteActivityMutation.isPending}
                              className="px-2 py-1.5 text-xs rounded-md bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1"
                              title="Supprimer le post"
                            >
                              <Trash2 size={12} />
                              Supprimer le post
                            </button>
                          )}
                        </>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}