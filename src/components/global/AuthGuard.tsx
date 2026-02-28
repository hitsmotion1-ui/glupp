"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

/**
 * Client-side auth guard — catches cases where the server-side
 * middleware passes but the session has since expired (e.g. PWA cache,
 * mobile background tab, stale service worker).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Check session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
      } else {
        setChecked(true);
      }
    });

    // Listen for auth state changes (sign out, token expired, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        if (event === "SIGNED_OUT") {
          router.replace("/login");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  // Don't render children until we've confirmed the session is valid
  if (!checked) {
    return (
      <div className="min-h-screen bg-glupp-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-glupp-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
