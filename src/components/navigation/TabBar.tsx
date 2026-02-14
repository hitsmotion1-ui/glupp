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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-glupp-bg/95 backdrop-blur-lg border-t border-glupp-border pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center h-16">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
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
