"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.length < 3 || username.length > 20) {
      setError("Le pseudo doit faire entre 3 et 20 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caracteres.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: username,
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
          placeholder="Min. 6 caracteres"
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

      {error && (
        <p className="text-glupp-error text-sm text-center">{error}</p>
      )}

      <Button type="submit" variant="primary" className="w-full" loading={loading}>
        Creer mon compte
      </Button>

      <p className="text-center text-sm text-glupp-text-soft">
        Deja un compte ?{" "}
        <Link href="/login" className="text-glupp-accent hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
