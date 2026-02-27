import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/navigation/Header";
import { TabBar } from "@/components/navigation/TabBar";
import { GlobalModals } from "@/components/global/GlobalModals";
import { ErrorBoundary } from "@/components/global/ErrorBoundary";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

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
    <div className="min-h-screen bg-glupp-bg flex flex-col">
      <Header />
      <main className="flex-1 pb-20 overflow-y-auto">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <TabBar />
      <GlobalModals />
      <PWAInstallPrompt />
      <OnboardingFlow />
    </div>
  );
}
