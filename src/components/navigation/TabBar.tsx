"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords, Trophy, Grid3X3, User } from "lucide-react";

const tabs = [
  { href: "/duel", label: "Duel", icon: Swords },
  { href: "/ranking", label: "Classement", icon: Trophy },
  { href: "/collection", label: "Collection", icon: Grid3X3 },
  { href: "/profile", label: "Profil", icon: User },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-glupp-bg/95 backdrop-blur-lg border-t border-glupp-border">
      <div
        className="flex items-center justify-around h-16"
        style={{ paddingBottom: "var(--safe-area-bottom)" }}
      >
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                isActive
                  ? "text-glupp-accent"
                  : "text-glupp-text-muted hover:text-glupp-text-soft"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
