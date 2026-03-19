"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Nouveaux états pour la réinitialisation
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/duel");
  };

  const handleResetPassword = async () => {
    setError(null);
    setResetMessage(null);

    if (!email) {
      setError("Entre d'abord ton adresse email, puis clique sur 'Mot de passe oublié'.");
      return;
    }

    setIsResetting(true);
    
    // Appel à Supabase pour envoyer l'email de reset
    // On précise l'URL vers laquelle l'utilisateur sera redirigé après avoir cliqué sur le lien
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`, 
    });

    if (error) {
      setError(error.message);
    } else {
      setResetMessage("Si cette adresse email est connue, tu recevras un email pour réinitialiser ton mot de passe.");
    }
    
    setIsResetting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in zoom-in duration-300">
      <div>
        <label
          htmlFor="email"
          className="block text-sm text-glupp-text-soft mb-1"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-glupp-card border border-glupp-border rounded-glupp text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          placeholder="ton@email.com"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label
            htmlFor="password"
            className="block text-sm text-glupp-text-soft"
          >
            Mot de passe
          </label>
          {/* Bouton Mot de passe oublié */}
          <button 
            type="button" 
            onClick={handleResetPassword}
            disabled={isResetting}
            className="text-xs text-glupp-accent hover:underline disabled:opacity-50 transition-colors"
          >
            {isResetting ? "Envoi en cours..." : "Mot de passe oublié ?"}
          </button>
        </div>
        
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 bg-glupp-card border border-glupp-border rounded-glupp text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          placeholder="Mot de passe"
        />
      </div>

      {error && (
        <p className="text-glupp-error text-sm text-center bg-glupp-error/10 border border-glupp-error/20 p-2 rounded-md">
          {error}
        </p>
      )}

      {/* Message de succès pour le reset password */}
      {resetMessage && (
        <p className="text-glupp-success text-xs text-center bg-glupp-success/10 border border-glupp-success/20 p-3 rounded-md leading-relaxed">
          {resetMessage}
        </p>
      )}

      <Button type="submit" variant="primary" className="w-full mt-2" loading={loading}>
        Se connecter
      </Button>

      <p className="text-center text-sm text-glupp-text-soft mt-4">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-glupp-accent hover:underline font-medium">
          Inscription
        </Link>
      </p>

      {/* Message sanitaire auth */}
      <p className="text-[10px] text-glupp-text-muted text-center mt-6 leading-relaxed border-t border-glupp-border/50 pt-4">
        L'abus d'alcool est dangereux pour la santé, à consommer avec modération.<br />
        Réservé aux personnes majeures.
      </p>
    </form>
  );
}