"use client";

import { AdminFeedbacks } from "@/components/admin/AdminFeedbacks";
import { MessageSquarePlus } from "lucide-react";

export default function AdminFeedbacksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-glupp-border pb-4">
        <MessageSquarePlus size={28} className="text-glupp-accent" />
        <div>
          <h1 className="font-display text-2xl font-bold text-glupp-cream">
            Retours utilisateurs
          </h1>
          <p className="text-sm text-glupp-text-muted">
            Gère les bugs, suggestions et problèmes signalés par la communauté.
          </p>
        </div>
      </div>

      <AdminFeedbacks />
    </div>
  );
}