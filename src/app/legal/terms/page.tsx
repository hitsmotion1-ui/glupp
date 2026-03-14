import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-glupp-bg text-glupp-cream p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/register" className="inline-flex items-center gap-2 text-glupp-text-muted hover:text-glupp-accent transition-colors mb-8">
          <ArrowLeft size={20} />
          Retour à l&apos;inscription
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-glupp-card border border-glupp-border rounded-xl flex items-center justify-center">
            <Shield className="text-glupp-accent" size={24} />
          </div>
          <h1 className="font-display text-3xl font-bold text-glupp-cream">
            Conditions Générales d&apos;Utilisation
          </h1>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-glupp-text-soft bg-glupp-card border border-glupp-border rounded-2xl p-6 md:p-8">
          
          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">1. Éditeur de l&apos;application</h2>
            <p>
              L&apos;application Glupp (ci-après &laquo;&nbsp;l&apos;Application&nbsp;&raquo;) est éditée par :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-glupp-cream">Responsable :</strong> Mikael [NOM DE FAMILLE] — Entrepreneur individuel</li>
              <li><strong className="text-glupp-cream">Adresse :</strong> [ADRESSE], Les Herbiers, 85500, France</li>
              <li><strong className="text-glupp-cream">Email :</strong> contact@glupp.app</li>
              <li><strong className="text-glupp-cream">Directeur de la publication :</strong> Mikael [NOM DE FAMILLE]</li>
              <li><strong className="text-glupp-cream">Hébergement :</strong> Vercel Inc. (frontend) — 440 N Barranca Ave #4133, Covina, CA 91723, USA. Supabase Inc. (backend et données) — région UE (Francfort, Allemagne).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">2. Objet de l&apos;application</h2>
            <p>
              Glupp est une application communautaire dédiée aux amateurs de bières. Elle permet à ses utilisateurs de référencer leurs dégustations (&laquo;&nbsp;Glupps&nbsp;&raquo;), de participer à des classements par duels, de constituer une collection personnelle de bières découvertes, et d&apos;interagir avec une communauté de passionnés.
            </p>
            <p className="mt-2">
              L&apos;Application ne vend pas de bière ni d&apos;alcool sous quelque forme que ce soit.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">3. Accès et âge légal</h2>
            <p className="text-glupp-accent font-medium mb-2">
              L&apos;utilisation de Glupp est strictement réservée aux personnes majeures.
            </p>
            <p>
              En créant un compte, vous certifiez sur l&apos;honneur avoir au moins 18 ans et avoir l&apos;âge légal requis pour la consommation d&apos;alcool dans votre pays de résidence. L&apos;éditeur se réserve le droit de demander une vérification d&apos;âge à tout moment. Tout compte suspecté d&apos;appartenir à une personne mineure sera immédiatement et définitivement supprimé sans préavis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">4. Loi Évin et consommation responsable</h2>
            <p>
              Conformément à la législation française (Loi n°91-32 du 10 janvier 1991 dite &laquo;&nbsp;Loi Évin&nbsp;&raquo;) et aux lois en vigueur en matière de santé publique :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>L&apos;abus d&apos;alcool est dangereux pour la santé. À consommer avec modération.</li>
              <li>L&apos;Application n&apos;incite en aucun cas à la consommation excessive d&apos;alcool.</li>
              <li>Les systèmes de niveaux et d&apos;expérience (XP) récompensent exclusivement la diversité des découvertes, la qualité des contributions à la base de données (photos, informations) et l&apos;interaction sociale — jamais la quantité ou la fréquence de consommation.</li>
              <li>Aucune mécanique de l&apos;Application (streaks, défis, bonus) n&apos;est conçue pour encourager une consommation quotidienne ou régulière d&apos;alcool.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">5. Inscription et compte utilisateur</h2>
            <p>
              L&apos;inscription est gratuite et nécessite une adresse email valide, un pseudonyme et un mot de passe. Chaque utilisateur est responsable de la confidentialité de ses identifiants de connexion. En cas d&apos;utilisation non autorisée de votre compte, vous devez en informer l&apos;éditeur immédiatement.
            </p>
            <p className="mt-2">
              L&apos;éditeur se réserve le droit de suspendre ou supprimer un compte en cas de violation des présentes CGU, sans obligation de préavis ni d&apos;indemnisation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">6. Gratuité et services premium</h2>
            <p>
              L&apos;utilisation de Glupp est actuellement gratuite. L&apos;éditeur se réserve le droit de proposer à l&apos;avenir des fonctionnalités premium payantes, qui feront l&apos;objet de conditions spécifiques et d&apos;une information préalable. Les fonctionnalités disponibles au moment de votre inscription resteront accessibles gratuitement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">7. Contenu généré par les utilisateurs</h2>
            <p>
              Vous êtes seul responsable des contenus (textes, photos, commentaires) que vous publiez sur Glupp. Vous vous engagez à ne pas publier de contenus :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Incitant à l&apos;ivresse ou présentant des personnes en état d&apos;ébriété manifeste.</li>
              <li>Violents, haineux, racistes, sexistes, homophobes ou discriminatoires.</li>
              <li>Pornographiques, diffamatoires ou portant atteinte à la vie privée d&apos;autrui.</li>
              <li>Contrefaisants ou portant atteinte aux droits de propriété intellectuelle de tiers.</li>
              <li>Constituant du spam, de la publicité non autorisée ou de la désinformation.</li>
            </ul>
            <p className="mt-2">
              L&apos;équipe de modération se réserve le droit de supprimer tout contenu enfreignant ces règles et de suspendre ou bannir l&apos;utilisateur concerné. Un bouton de signalement est disponible sur chaque publication.
            </p>
            <p className="mt-2">
              En publiant du contenu sur Glupp, vous accordez à l&apos;éditeur une licence non exclusive, gratuite et mondiale d&apos;utilisation de ce contenu dans le cadre du fonctionnement et de la promotion de l&apos;Application. Cette licence prend fin à la suppression du contenu ou de votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">8. Modération des bières ajoutées</h2>
            <p>
              Les bières proposées par les utilisateurs sont soumises à validation par l&apos;équipe Glupp avant d&apos;être rendues visibles à l&apos;ensemble de la communauté. L&apos;éditeur se réserve le droit de refuser, modifier ou supprimer toute fiche bière à sa discrétion, notamment en cas d&apos;informations incorrectes, de doublons ou de contenu inapproprié.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">9. Propriété intellectuelle</h2>
            <p>
              La structure générale de l&apos;Application, son code source, son design, ses textes, graphismes, logos (notamment le logo Glupp) et l&apos;ensemble des éléments la composant sont la propriété exclusive de l&apos;éditeur et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle.
            </p>
            <p className="mt-2">
              Toute reproduction, représentation, modification ou exploitation non autorisée de tout ou partie de l&apos;Application est interdite et constituerait une contrefaçon sanctionnée par le Code de la propriété intellectuelle.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">10. Responsabilité et garanties</h2>
            <p>
              L&apos;Application est fournie &laquo;&nbsp;en l&apos;état&nbsp;&raquo;. L&apos;éditeur s&apos;efforce d&apos;assurer la disponibilité et le bon fonctionnement de Glupp, mais ne garantit pas un accès ininterrompu, exempt d&apos;erreurs ou sécurisé à tout moment.
            </p>
            <p className="mt-2">
              L&apos;éditeur ne saurait être tenu responsable :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Des contenus publiés par les utilisateurs.</li>
              <li>De l&apos;exactitude des informations relatives aux bières (taux d&apos;alcool, ingrédients, disponibilité).</li>
              <li>Des interruptions temporaires liées à la maintenance ou à des causes techniques indépendantes de sa volonté.</li>
              <li>De tout dommage direct ou indirect résultant de l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser l&apos;Application.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">11. Suppression de compte</h2>
            <p>
              Vous pouvez supprimer votre compte à tout moment depuis les paramètres de l&apos;Application. La suppression entraîne l&apos;effacement définitif et irréversible de :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Vos données personnelles (email, pseudonyme, photo de profil).</li>
              <li>Votre collection de bières, vos duels et votre historique d&apos;activité.</li>
              <li>Vos photos de dégustations.</li>
            </ul>
            <p className="mt-2">
              Les contributions anonymisées au classement global des bières (votes ELO) pourront être conservées sous forme agrégée, sans lien avec votre identité. Les bières que vous avez proposées et qui ont été validées resteront dans la base de données communautaire.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">12. Modification des CGU</h2>
            <p>
              L&apos;éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications substantielles par notification dans l&apos;Application. La poursuite de l&apos;utilisation de Glupp après notification vaut acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">13. Loi applicable et juridiction</h2>
            <p>
              Les présentes CGU sont régies par le droit français. En cas de litige relatif à l&apos;interprétation ou à l&apos;exécution des présentes, les parties s&apos;efforceront de trouver une solution amiable. À défaut, les tribunaux compétents du ressort de La Roche-sur-Yon (Vendée) seront seuls compétents.
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
