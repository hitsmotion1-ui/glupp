import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-glupp-bg text-glupp-cream p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/register" className="inline-flex items-center gap-2 text-glupp-text-muted hover:text-glupp-accent transition-colors mb-8">
          <ArrowLeft size={20} />
          Retour à l&apos;inscription
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-glupp-card border border-glupp-border rounded-xl flex items-center justify-center">
            <Lock className="text-glupp-accent" size={24} />
          </div>
          <h1 className="font-display text-3xl font-bold text-glupp-cream">
            Politique de Confidentialité
          </h1>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-glupp-text-soft bg-glupp-card border border-glupp-border rounded-2xl p-6 md:p-8">
          
          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement des données personnelles collectées via l&apos;application Glupp est :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-glupp-cream">Identité :</strong> Mikael [NOM DE FAMILLE] — Entrepreneur individuel</li>
              <li><strong className="text-glupp-cream">Adresse :</strong> [ADRESSE], Les Herbiers, 85500, France</li>
              <li><strong className="text-glupp-cream">Email de contact :</strong> contact@glupp.app</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">2. Données collectées</h2>
            <p>
              Dans le cadre de l&apos;utilisation de Glupp, nous collectons les catégories de données suivantes :
            </p>
            
            <h3 className="text-base font-semibold text-glupp-cream mt-4 mb-2">Données d&apos;inscription (obligatoires)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Adresse email</li>
              <li>Pseudonyme (nom d&apos;utilisateur)</li>
              <li>Mot de passe (stocké sous forme chiffrée, jamais en clair)</li>
            </ul>

            <h3 className="text-base font-semibold text-glupp-cream mt-4 mb-2">Données de profil (facultatives)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Photo de profil</li>
              <li>Nom d&apos;affichage</li>
            </ul>

            <h3 className="text-base font-semibold text-glupp-cream mt-4 mb-2">Données d&apos;utilisation (générées par votre activité)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Bières dégustées (&laquo;&nbsp;Glupps&nbsp;&raquo;), votes de duels, classements personnels</li>
              <li>Photos de dégustations associées à vos Glupps</li>
              <li>Bières proposées à l&apos;ajout dans la base communautaire</li>
              <li>Statistiques de progression (XP, niveau, trophées)</li>
              <li>Interactions sociales (amis, crews, tags)</li>
            </ul>

            <h3 className="text-base font-semibold text-glupp-cream mt-4 mb-2">Données de géolocalisation (facultatives)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nom du bar ou lieu associé manuellement à un Glupp</li>
              <li>Coordonnées GPS au moment d&apos;un Glupp, uniquement si vous activez explicitement cette option</li>
            </ul>
            <p className="mt-2 text-glupp-accent font-medium">
              Nous ne traquons jamais votre position en arrière-plan. La géolocalisation n&apos;est activée qu&apos;au moment précis d&apos;un Glupp et uniquement avec votre accord explicite.
            </p>

            <h3 className="text-base font-semibold text-glupp-cream mt-4 mb-2">Données techniques</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Adresse IP (à des fins de sécurité et de prévention des abus)</li>
              <li>Type de navigateur et système d&apos;exploitation (à des fins de compatibilité)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">3. Base légale du traitement</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD), le traitement de vos données repose sur les bases légales suivantes :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong className="text-glupp-cream">Exécution du contrat</strong> (article 6.1.b du RGPD) : les données d&apos;inscription et d&apos;utilisation sont nécessaires à la fourniture du service Glupp (créer votre compte, afficher votre collection, calculer vos classements).
              </li>
              <li>
                <strong className="text-glupp-cream">Consentement</strong> (article 6.1.a du RGPD) : la collecte de votre géolocalisation et de vos photos de dégustations repose sur votre consentement explicite, que vous pouvez retirer à tout moment.
              </li>
              <li>
                <strong className="text-glupp-cream">Intérêt légitime</strong> (article 6.1.f du RGPD) : la collecte de données techniques (adresse IP, type de navigateur) est justifiée par notre intérêt légitime à assurer la sécurité de l&apos;Application et à prévenir les abus.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">4. Utilisation de vos données</h2>
            <p>
              Vos données sont utilisées exclusivement pour :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Créer et gérer votre compte utilisateur.</li>
              <li>Afficher votre profil, votre collection et vos activités au sein de la communauté.</li>
              <li>Calculer vos classements personnels, vos statistiques, vos trophées et votre progression.</li>
              <li>Alimenter les classements communautaires (duels ELO).</li>
              <li>Modérer les contenus signalés et les bières proposées.</li>
              <li>Sécuriser votre compte (réinitialisation de mot de passe, détection d&apos;accès suspect).</li>
              <li>Améliorer l&apos;Application (statistiques d&apos;usage anonymisées).</li>
            </ul>
            <p className="mt-3 text-glupp-accent font-medium">
              Nous ne vendons, ne louons et ne cédons aucune de vos données personnelles à des tiers, que ce soit à des fins publicitaires, commerciales ou autres.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">5. Partage de données</h2>
            <p>
              Vos données personnelles ne sont partagées qu&apos;avec les prestataires techniques strictement nécessaires au fonctionnement de l&apos;Application :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-glupp-cream">Supabase Inc.</strong> — Hébergement de la base de données, authentification et stockage des fichiers.</li>
              <li><strong className="text-glupp-cream">Vercel Inc.</strong> — Hébergement du site web et diffusion du contenu.</li>
            </ul>
            <p className="mt-2">
              Ces prestataires agissent en tant que sous-traitants et sont contractuellement tenus de traiter vos données conformément au RGPD et uniquement selon nos instructions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">6. Hébergement et transferts hors UE</h2>
            <p>
              La base de données Glupp est hébergée par Supabase sur des serveurs situés dans la <strong className="text-glupp-cream">région UE (Francfort, Allemagne)</strong>. Vos données personnelles sont donc stockées au sein de l&apos;Union européenne.
            </p>
            <p className="mt-2">
              Le frontend de l&apos;Application est hébergé par Vercel, dont certains serveurs de diffusion (CDN) peuvent être situés hors de l&apos;UE, notamment aux États-Unis. Vercel bénéficie du cadre de protection des données UE-États-Unis (EU-US Data Privacy Framework). Seuls des fichiers statiques (code de l&apos;application, images d&apos;interface) transitent par ces serveurs, pas vos données personnelles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">7. Sécurité des données</h2>
            <p>
              Nous mettons en œuvre les mesures de sécurité suivantes pour protéger vos données :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Chiffrement des connexions (HTTPS/TLS).</li>
              <li>Mots de passe hachés avec des algorithmes robustes (bcrypt) — jamais stockés en clair.</li>
              <li>Politiques de sécurité au niveau des lignes de base de données (Row Level Security) garantissant que chaque utilisateur ne peut accéder et modifier que ses propres données.</li>
              <li>Accès restreint aux données de production, limité au seul administrateur.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">8. Cookies et traceurs</h2>
            <p>
              Glupp utilise uniquement des <strong className="text-glupp-cream">cookies strictement nécessaires</strong> au fonctionnement de l&apos;Application :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-glupp-cream">Cookie de session d&apos;authentification :</strong> permet de maintenir votre connexion active. Expire à la déconnexion ou après une période d&apos;inactivité.</li>
            </ul>
            <p className="mt-2">
              Nous n&apos;utilisons <strong className="text-glupp-cream">aucun cookie publicitaire, aucun traceur analytique tiers</strong> (pas de Google Analytics, pas de Facebook Pixel, pas de solution de tracking tierce). Nous ne faisons aucun profilage publicitaire.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">9. Durée de conservation</h2>
            <p>
              Vos données personnelles sont conservées selon les durées suivantes :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong className="text-glupp-cream">Compte actif :</strong> vos données sont conservées tant que votre compte est actif.
              </li>
              <li>
                <strong className="text-glupp-cream">Compte inactif :</strong> si votre compte reste inactif pendant une durée de 24 mois consécutifs, nous vous enverrons un email vous invitant à confirmer votre souhait de conserver votre compte. Sans réponse dans les 30 jours, le compte sera supprimé.
              </li>
              <li>
                <strong className="text-glupp-cream">Suppression de compte :</strong> à la suppression de votre compte, vos données personnelles sont effacées dans un délai maximum de 30 jours. Les votes ELO anonymisés et les fiches bières que vous avez proposées (après validation) sont conservés dans la base communautaire sans lien avec votre identité.
              </li>
              <li>
                <strong className="text-glupp-cream">Données techniques :</strong> les logs de sécurité (adresses IP) sont conservés pendant 12 mois maximum, conformément aux obligations légales.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">10. Vos droits (RGPD)</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants sur vos données personnelles :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong className="text-glupp-cream">Droit d&apos;accès :</strong> vous pouvez obtenir la confirmation que vos données sont traitées et en obtenir une copie.
              </li>
              <li>
                <strong className="text-glupp-cream">Droit de rectification :</strong> vous pouvez modifier vos informations personnelles à tout moment depuis votre profil dans l&apos;Application.
              </li>
              <li>
                <strong className="text-glupp-cream">Droit d&apos;effacement (droit à l&apos;oubli) :</strong> vous pouvez supprimer l&apos;intégralité de votre compte, de vos photos et de vos données depuis les paramètres de l&apos;Application. Cette action est irréversible.
              </li>
              <li>
                <strong className="text-glupp-cream">Droit à la portabilité :</strong> vous pouvez demander à recevoir vos données personnelles dans un format structuré, couramment utilisé et lisible par machine (JSON).
              </li>
              <li>
                <strong className="text-glupp-cream">Droit d&apos;opposition :</strong> vous pouvez vous opposer au traitement de vos données fondé sur l&apos;intérêt légitime. En cas d&apos;opposition, nous cesserons le traitement sauf motif légitime impérieux.
              </li>
              <li>
                <strong className="text-glupp-cream">Droit à la limitation du traitement :</strong> vous pouvez demander la suspension du traitement de vos données dans certains cas prévus par le RGPD.
              </li>
              <li>
                <strong className="text-glupp-cream">Retrait du consentement :</strong> lorsque le traitement repose sur votre consentement (géolocalisation, photos), vous pouvez le retirer à tout moment sans que cela affecte la licéité du traitement effectué avant le retrait.
              </li>
            </ul>
            <p className="mt-3">
              Pour exercer vos droits, vous pouvez utiliser les fonctionnalités disponibles dans l&apos;Application (modification de profil, suppression de compte) ou nous contacter à l&apos;adresse <strong className="text-glupp-cream">contact@glupp.app</strong>. Nous nous engageons à répondre dans un délai maximum de 30 jours.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">11. Réclamation auprès de la CNIL</h2>
            <p>
              Si vous estimez que le traitement de vos données personnelles constitue une violation du RGPD, vous avez le droit d&apos;introduire une réclamation auprès de la Commission Nationale de l&apos;Informatique et des Libertés (CNIL) :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-glupp-cream">Site web :</strong> www.cnil.fr</li>
              <li><strong className="text-glupp-cream">Adresse :</strong> CNIL — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07</li>
              <li><strong className="text-glupp-cream">Téléphone :</strong> 01 53 73 22 22</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">12. Protection des mineurs</h2>
            <p>
              Glupp est une application réservée aux personnes majeures. Nous ne collectons sciemment aucune donnée relative à des mineurs. Si nous apprenons qu&apos;un mineur a créé un compte, celui-ci sera immédiatement supprimé et toutes les données associées seront effacées.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-glupp-cream mb-3">13. Modifications de la politique</h2>
            <p>
              La présente politique de confidentialité peut être mise à jour pour refléter des évolutions de l&apos;Application ou des obligations légales. En cas de modification substantielle, vous serez informé par notification dans l&apos;Application. La version en vigueur est toujours accessible depuis les paramètres de l&apos;Application.
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
