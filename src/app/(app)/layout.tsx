import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/navigation/Header";
import { TabBar } from "@/components/navigation/TabBar";
import { GlobalModals } from "@/components/global/GlobalModals";
import { ErrorBoundary } from "@/components/global/ErrorBoundary";
import { AuthGuard } from "@/components/global/AuthGuard";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { HealthWarningFooter } from "@/components/global/HealthWarningFooter";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <QueryProvider>
      <AuthGuard>
        <div className="min-h-screen bg-glupp-bg flex flex-col">
          <Header />
          
          {/* 👈 On passe pb-20 à pb-24 pour laisser de la place au bandeau ET à la TabBar */}
          <main className="flex-1 pb-24 overflow-y-auto">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          
          {/* Le bandeau sanitaire inséré ici */}
          <HealthWarningFooter />
          
          <TabBar />
          <GlobalModals />
          <PWAInstallPrompt />
          <OnboardingFlow />
        </div>
      </AuthGuard>
    </QueryProvider>
  );
}