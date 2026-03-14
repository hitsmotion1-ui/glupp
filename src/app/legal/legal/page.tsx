import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-glupp-bg text-glupp-cream p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/register" className="inline-flex items-center gap-2 text-glupp-text-muted hover:text-glupp-accent transition-colors mb-8">
          <ArrowLeft size={20} />
          Retour
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-glupp-card border border-glupp-border rounded-xl flex items-center justify-center">
            <FileText className="text-glupp-accent" size={24} />
          </div>
          <h1 className="font-display text-3xl font-bold text-glupp-cream">
            Mentions Légales
          </h1>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-glupp-text-soft bg-glupp-card border border-glupp-border rounded-2xl p-6 md:p-8">
          
          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">1. Éditeur de l'application</h2>
            <ul className="space-y-1">
              <li><strong className="text-glupp-cream">Nom :</strong> Mikael [NOM] — Entrepreneur individuel</li>
              <li><strong className="text-glupp-cream">Adresse :</strong> [ADRESSE], Les Herbiers, 85500, France</li>
              <li><strong className="text-glupp-cream">Email :</strong> contact@glupp.app</li>
              <li><strong className="text-glupp-cream">Directeur de la publication :</strong> Mikael [NOM]</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">2. Hébergement</h2>
            <ul className="space-y-2">
              <li>
                <strong className="text-glupp-cream">Frontend :</strong> Vercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723, USA — <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-glupp-accent hover:underline">vercel.com</a>
              </li>
              <li>
                <strong className="text-glupp-cream">Backend et base de données :</strong> Supabase Inc. — Région UE (Francfort, Allemagne) — <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-glupp-accent hover:underline">supabase.com</a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">3. Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu de l'application Glupp (structure, design, logo, textes, graphismes, code source) est la propriété exclusive de l'éditeur, sauf contenus générés par les utilisateurs. Toute reproduction, même partielle, est interdite sans autorisation préalable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">4. Données personnelles</h2>
            <p>
              Consultez notre <Link href="/legal/privacy" className="text-glupp-accent hover:underline">Politique de Confidentialité</Link> pour en savoir plus sur la gestion de vos données. Vous avez le droit d'introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-glupp-accent hover:underline">www.cnil.fr</a>).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">5. Message sanitaire</h2>
            <p className="text-glupp-accent font-medium mb-2">
              L'abus d'alcool est dangereux pour la santé, à consommer avec modération.
            </p>
            <p>
              L'application ne vend pas d'alcool et est strictement réservée aux personnes majeures.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">6. Conditions d'utilisation</h2>
            <p>
              En utilisant cette application, vous acceptez nos <Link href="/legal/terms" className="text-glupp-accent hover:underline">Conditions Générales d'Utilisation (CGU)</Link>.
            </p>
          </section>

          <p className="text-xs text-glupp-text-muted mt-8 pt-6 border-t border-glupp-border">
            Dernière mise à jour : Mars 2026
          </p>
        </div>
      </div>
    </div>
  );
}