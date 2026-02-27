"use client";

import { useRef, useEffect } from "react";
import { ActivityItem } from "./ActivityItem";
import { Skeleton } from "@/components/ui/Skeleton";
import { useActivities } from "@/lib/hooks/useActivities";
import { Rss } from "lucide-react";

export function ActivityFeed() {
  const {
    activities,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useActivities();

  // Infinite scroll with IntersectionObserver
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-3 px-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 rounded-full bg-glupp-accent/10 flex items-center justify-center mx-auto mb-4">
          <Rss className="w-7 h-7 text-glupp-accent" />
        </div>
        <h3 className="font-display font-semibold text-glupp-cream mb-2">
          Ton fil est vide
        </h3>
        <p className="text-sm text-glupp-text-muted max-w-[250px] mx-auto">
          Ajoute des amis et gluppe des bières pour voir l'activité ici !
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-4">
      {activities.map((activity, i) => (
        <ActivityItem key={activity.id} activity={activity} index={i} />
      ))}

      {/* Load more sentinel */}
      <div ref={loadMoreRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}
    </div>
  );
}
