"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          className="w-full px-4 py-3 bg-glupp-card border border-glupp-border rounded-glupp text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"
          placeholder="Mot de passe"
        />
      </div>

      {error && (
        <p className="text-glupp-error text-sm text-center">{error}</p>
      )}

      <Button type="submit" variant="primary" className="w-full" loading={loading}>
        Se connecter
      </Button>

      <p className="text-center text-sm text-glupp-text-soft">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-glupp-accent hover:underline">
          Inscription
        </Link>
      </p>
    </form>
  );
}
