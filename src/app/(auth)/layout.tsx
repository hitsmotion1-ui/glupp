import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-glupp-bg flex flex-col items-center justify-center px-6 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* 🆕 Remplacement du texte par le logo */}
          <Image 
            src="/logo.svg" 
            alt="Logo Glupp" 
            width={140}   // Tu pourras ajuster cette valeur selon la largeur de ton logo
            height={48}   // Tu pourras ajuster cette valeur selon la hauteur de ton logo
            priority      // Demande à Next.js de charger cette image en priorité
            className="mx-auto mb-3 object-contain" 
          />
          <p className="text-glupp-text-soft text-sm">Every gulp counts.</p>
        </div>
        {children}
      </div>
    </div>
  );
}