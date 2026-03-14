"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // 👈 Nouveaux états pour les cases à cocher légales
  const [isAdult, setIsAdult] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 👈 Vérifications légales
    if (!isAdult) {
      setError("Tu dois avoir plus de 18 ans pour utiliser Glupp.");
      return;
    }
    
    if (!acceptTerms) {
      setError("Tu dois accepter les conditions d'utilisation.");
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setError("Le pseudo doit faire entre 3 et 20 caractères.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: username,
          // 👈 Tu peux même stocker cette validation dans la BDD pour te protéger
          age_verified: true, 
          terms_accepted: true
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/duel");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="username"
          className="block text-sm text-glupp-text-soft mb-1"
        >
          Pseudo
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={20}
          className="w-full px-4 py-3 bg-glupp-card border border-glupp-border rounded-glupp text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          placeholder="TonPseudo"
        />
      </div>

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
        <label
          htmlFor="password"
          className="block text-sm text-glupp-text-soft mb-1"
        >
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-3 bg-glupp-card border border-glupp-border rounded-glupp text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          placeholder="Min. 6 caractères"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm text-glupp-text-soft mb-1"
        >
          Confirmer le mot de passe
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full px-4 py-3 bg-glupp-card border border-glupp-border rounded-glupp text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          placeholder="Confirmer"
        />
      </div>

      {/* 👈 Les cases légales (Checkboxes) */}
      <div className="pt-2 pb-1 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center mt-0.5">
            <input 
              type="checkbox" 
              checked={isAdult}
              onChange={(e) => setIsAdult(e.target.checked)}
              className="peer appearance-none w-5 h-5 border-2 border-glupp-border rounded bg-glupp-bg checked:bg-glupp-accent checked:border-glupp-accent transition-colors cursor-pointer" 
            />
            <svg className="absolute w-3 h-3 left-1 pointer-events-none opacity-0 peer-checked:opacity-100 text-glupp-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm text-glupp-text-soft group-hover:text-glupp-cream transition-colors leading-tight">
            Je certifie avoir plus de 18 ans et l'âge légal pour consommer de l'alcool dans mon pays de résidence.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center mt-0.5">
            <input 
              type="checkbox" 
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="peer appearance-none w-5 h-5 border-2 border-glupp-border rounded bg-glupp-bg checked:bg-glupp-accent checked:border-glupp-accent transition-colors cursor-pointer" 
            />
            <svg className="absolute w-3 h-3 left-1 pointer-events-none opacity-0 peer-checked:opacity-100 text-glupp-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm text-glupp-text-soft group-hover:text-glupp-cream transition-colors leading-tight">
            J'accepte les <Link href="/legal/terms" className="text-glupp-accent hover:underline">Conditions d'Utilisation</Link> et la <Link href="/legal/privacy" className="text-glupp-accent hover:underline">Politique de Confidentialité</Link>.
          </span>
        </label>
      </div>

      {error && (
        <p className="text-glupp-error text-sm text-center bg-glupp-error/10 border border-glupp-error/20 p-2 rounded-md">
          {error}
        </p>
      )}

      {/* 👈 Le bouton est disabled tant que les deux cases ne sont pas cochées */}
      <Button 
        type="submit" 
        variant="primary" 
        className="w-full mt-2" 
        loading={loading}
        disabled={!isAdult || !acceptTerms}
      >
        Créer mon compte
      </Button>

      <p className="text-center text-sm text-glupp-text-soft mt-4">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-glupp-accent hover:underline font-medium">
          Se connecter
        </Link>
      </p>
    </form>
  );
}