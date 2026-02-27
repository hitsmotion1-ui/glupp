"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { ScanLine, Search, Bell } from "lucide-react";

export function Header() {
  const setShowScanner = useAppStore((s) => s.setShowScanner);
  const setShowSearch = useAppStore((s) => s.setShowSearch);
  const setShowNotifications = useAppStore((s) => s.setShowNotifications);
  const notificationCount = useAppStore((s) => s.notificationCount);

  // Initialize the hook to keep count synced
  useNotifications();

  return (
    <header className="sticky top-0 z-40 bg-glupp-bg/95 backdrop-blur-lg border-b border-glupp-border">
      <div className="flex items-center justify-between px-4 h-14">
        <h1 className="font-display text-xl font-bold text-glupp-accent">
          Glupp
        </h1>
        <div className="flex items-center gap-2">
          {/* Scan button */}
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-glupp-accent/15 border border-glupp-accent/30 text-glupp-accent hover:bg-glupp-accent/25 transition-colors"
            aria-label="Scanner"
          >
            <ScanLine size={18} />
          </button>

          {/* Search button */}
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-glupp-card border border-glupp-border text-glupp-text-soft hover:text-glupp-accent hover:border-glupp-accent/50 transition-colors"
            aria-label="Rechercher"
          >
            <Search size={18} />
          </button>

          {/* Notifications button */}
          <button
            onClick={() => setShowNotifications(true)}
            className="relative flex items-center justify-center w-9 h-9 rounded-full bg-glupp-card border border-glupp-border text-glupp-text-soft hover:text-glupp-accent hover:border-glupp-accent/50 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {/* Red badge */}
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-glupp-error rounded-full border-2 border-glupp-bg">
                <span className="text-[9px] font-bold text-white leading-none">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
