"use client";

import { Users } from "lucide-react";

export default function SocialPage() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-glupp-accent/15 flex items-center justify-center mb-4">
        <Users size={32} className="text-glupp-accent" />
      </div>
      <h2 className="font-display text-xl font-bold text-glupp-cream mb-2">
        Social
      </h2>
      <p className="text-sm text-glupp-text-muted max-w-xs">
        Retrouve tes amis, compare vos collections et defiez-vous en duel !
      </p>
      <div className="mt-6 px-4 py-2 bg-glupp-card border border-glupp-border rounded-glupp">
        <span className="text-xs text-glupp-text-soft">
          Bientot disponible
        </span>
      </div>
    </div>
  );
}
