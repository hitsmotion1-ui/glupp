"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, XCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  
  const isPasswordValid = hasMinLength && hasNumber && hasSpecialChar;

  useEffect(() => {
    // Vérifier si on a bien une session de récupération active (le hash dans l'URL)
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if(!session){
             // Supabase a déjà lu le token dans l'URL et créé la session
             // Si la session est vide ici, il y a de fortes chances que supabase gère le token via l'event onAuthStateChange.
             // Pour l'instant on ne bloque pas brutalement.
        }
    }
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setIsSuccess(true);
      
      // On le redirige vers l'appli après quelques secondes
      setTimeout(() => {
        router.push("/profile"); 
      }, 3000);

    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors du changement de mot de passe.");
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

  if (isSuccess) {
    return (
      <div className="text-center space-y-6 py-8 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-glupp-success/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-glupp-success">
          <span className="text-4xl text-glupp-success"><CheckCircle2 size={40} /></span>
        </div>
        <h2 className="text-2xl font-display font-bold text-glupp-cream">Mot de passe changé !</h2>
        <div className="p-4 bg-glupp-card border border-glupp-border rounded-xl">
          <p className="text-glupp-text-soft text-sm leading-relaxed">
            Ton mot de passe a été mis à jour avec succès.<br/>
            Redirection en cours...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-glupp-cream mb-2">Nouveau mot de passe</h2>
        <p className="text-xs text-glupp-text-muted">Crée un nouveau mot de passe sécurisé pour ton compte Glupp.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm text-glupp-text-soft mb-1">
            Nouveau mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-glupp-card border border-glupp-border rounded-glupp text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
            placeholder="Nouveau mot de passe"
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
          disabled={!isPasswordValid || !passwordsMatch}
        >
          Valider le nouveau mot de passe
        </Button>
      </form>
    </div>
  );
}