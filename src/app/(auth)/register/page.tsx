"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, XCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isAdult, setIsAdult] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // 👈 Nouvel état pour l'écran de succès

  const hasMinLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  
  const isPasswordValid = hasMinLength && hasNumber && hasSpecialChar;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAdult || !acceptTerms) {
      setError("Tu dois accepter les conditions et certifier ton âge.");
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setError("Le pseudo doit faire entre 3 et 20 caractères.");
      return;
    }

    if (!isPasswordValid) {
      setError("Le mot de passe ne respecte pas tous les critères de sécurité.");
      return;
    }

    if (!passwordsMatch) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      // 1. Vérifier si le pseudo existe déjà
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", username)
        .maybeSingle();

      if (existingUser) {
        setError("Ce pseudo est déjà utilisé. Choisis-en un autre !");
        setLoading(false);
        return;
      }

      // 2. Créer le compte
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: username,
            age_verified: true, 
            terms_accepted: true
          },
        },
      });

      if (signUpError) {
        // Supabase renvoie une erreur spécifique si l'email existe déjà
        if (signUpError.message.includes("already registered") || signUpError.message.includes("unique")) {
          setError("Cet email est déjà utilisé. Essaie de te connecter.");
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      // 3. Afficher l'écran de succès pour demander de vérifier les emails
      setIsSuccess(true);
    } catch (err: any) {
      setError("Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const PasswordRule = ({ isValid, text }: { isValid: boolean, text: string }) => (
    <div className={`flex items-center gap-1.5 text-xs ${isValid ? "text-glupp-success" : "text-glupp-text-muted"}`}>
      {isValid ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      <span>{text}</span>
    </div>
  );

  // 👈 Écran de succès affiché après l'inscription
  if (isSuccess) {
    return (
      <div className="text-center space-y-6 py-8 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-glupp-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-glupp-accent">
          <span className="text-4xl">🍻</span>
        </div>
        <h2 className="text-2xl font-display font-bold text-glupp-cream">Génial !</h2>
        <div className="p-4 bg-glupp-card border border-glupp-border rounded-xl">
          <p className="text-glupp-text-soft text-sm leading-relaxed">
            Ton compte a été créé avec succès.<br/><br/>
            <strong className="text-glupp-cream">Va vérifier tes emails</strong> et clique sur le lien pour confirmer ton compte et pouvoir te connecter !
          </p>
        </div>
        <Button 
          variant="primary" 
          className="w-full mt-4" 
          onClick={() => router.push("/login")}
        >
          Aller se connecter
        </Button>
      </div>
    );
  }

  // 👇 Le formulaire normal si on n'est pas en succès
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm text-glupp-text-soft mb-1">
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
        <label htmlFor="email" className="block text-sm text-glupp-text-soft mb-1">
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
        <label htmlFor="password" className="block text-sm text-glupp-text-soft mb-1">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 bg-glupp-card border border-glupp-border rounded-glupp text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          placeholder="Créer un mot de passe"
        />
        
        <div className="mt-2 p-3 bg-glupp-bg/50 rounded-lg space-y-1.5 border border-glupp-border/50">
          <PasswordRule isValid={hasMinLength} text="Au moins 8 caractères" />
          <PasswordRule isValid={hasNumber} text="Au moins 1 chiffre" />
          <PasswordRule isValid={hasSpecialChar} text="Au moins 1 caractère spécial (!@#...)" />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm text-glupp-text-soft mb-1">
          Confirmer le mot de passe
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className={`w-full px-4 py-3 bg-glupp-card border rounded-glupp text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none transition-colors ${
            confirmPassword.length > 0 
              ? (passwordsMatch ? "border-glupp-success focus:border-glupp-success" : "border-glupp-error focus:border-glupp-error")
              : "border-glupp-border focus:border-glupp-accent"
          }`}
          placeholder="Répéter le mot de passe"
        />
        {confirmPassword.length > 0 && !passwordsMatch && (
          <p className="text-glupp-error text-xs mt-1">Les mots de passe ne correspondent pas.</p>
        )}
      </div>

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
            J'accepte les <Link href="/legal/terms" target="_blank" className="text-glupp-accent hover:underline">Conditions d'Utilisation</Link> et la <Link href="/legal/privacy" target="_blank" className="text-glupp-accent hover:underline">Politique de Confidentialité</Link>.
          </span>
        </label>
      </div>

      {error && (
        <p className="text-glupp-error text-sm text-center bg-glupp-error/10 border border-glupp-error/20 p-2 rounded-md">
          {error}
        </p>
      )}

      <Button 
        type="submit" 
        variant="primary" 
        className="w-full mt-2" 
        loading={loading}
        disabled={!isAdult || !acceptTerms || !isPasswordValid || !passwordsMatch}
      >
        Créer mon compte
      </Button>

      <p className="text-center text-sm text-glupp-text-soft mt-4">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-glupp-accent hover:underline font-medium">
          Se connecter
        </Link>
      </p>

      {/* 🆕 Message sanitaire auth */}
      <p className="text-[10px] text-glupp-text-muted text-center mt-6 leading-relaxed border-t border-glupp-border/50 pt-4">
        L'abus d'alcool est dangereux pour la santé, à consommer avec modération.<br />
        Réservé aux personnes majeures.
      </p>
    </form>
  );
}