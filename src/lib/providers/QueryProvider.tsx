"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // On utilise useState pour s'assurer que le QueryClient n'est instancié qu'une seule fois
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // C'EST ICI LA MAGIE : Les données restent en cache pendant 5 minutes.
            // Si on change d'onglet et qu'on revient, l'affichage sera instantané !
            staleTime: 5 * 60 * 1000, 
            gcTime: 10 * 60 * 1000, // Garde en mémoire pendant 10 minutes
            refetchOnWindowFocus: false, // Ne pas re-fetcher quand on quitte/revient sur la fenêtre
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}