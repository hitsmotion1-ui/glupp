"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Beer,
  MapPin,
  Inbox,
  Users,
  Settings,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/beers", label: "Bi\u00e8res", icon: Beer, exact: false },
  { href: "/admin/bars", label: "Bars", icon: MapPin, exact: false },
  {
    href: "/admin/submissions",
    label: "Soumissions",
    icon: Inbox,
    exact: false,
    badge: true,
  },
  { href: "/admin/users", label: "Utilisateurs", icon: Users, exact: false },
  {
    href: "/admin/settings",
    label: "Param\u00e8tres",
    icon: Settings,
    exact: false,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Fetch pending submissions count
  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const res = await fetch("/api/admin/submissions/count");
        if (res.ok) {
          const data = await res.json();
          setPendingCount(data.count ?? 0);
        }
      } catch {
        // Silently fail — badge will just not show
      }
    }
    fetchPendingCount();
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-[#3A3530]">
        <div className="w-8 h-8 rounded-lg bg-[#E08840] flex items-center justify-center">
          <Beer size={18} className="text-[#141210]" />
        </div>
        <div>
          <span className="font-display text-lg font-bold text-[#F5E6D3]">
            GLUPP
          </span>
          <span className="ml-1.5 text-xs font-medium text-[#E08840]">
            Admin
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150
                ${
                  active
                    ? "bg-[#E08840]/10 text-[#E08840] border-l-2 border-[#E08840] pl-[10px]"
                    : "text-[#A89888] hover:text-[#F5E6D3] hover:bg-[#1E1B16] border-l-2 border-transparent pl-[10px]"
                }
              `}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.2 : 1.8}
                className="shrink-0"
              />
              <span className="flex-1">{item.label}</span>
              {item.badge && pendingCount > 0 && (
                <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 bg-[#E08840] text-[#141210] text-[10px] font-bold rounded-full">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Separator + Back link */}
      <div className="px-3 pb-4">
        <div className="border-t border-[#3A3530] mb-3" />
        <Link
          href="/duel"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#A89888] hover:text-[#F5E6D3] hover:bg-[#1E1B16] transition-all duration-150"
        >
          <ArrowLeft size={18} strokeWidth={1.8} className="shrink-0" />
          <span>Retour \u00e0 l&apos;app</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-[#1E1B16] border border-[#3A3530] text-[#F5E6D3] hover:bg-[#3A3530] transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#1E1B16] border-r border-[#3A3530] h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-in panel */}
          <aside className="relative w-64 h-full bg-[#1E1B16] border-r border-[#3A3530] shadow-2xl animate-slide-in-left">
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-lg text-[#A89888] hover:text-[#F5E6D3] hover:bg-[#3A3530] transition-colors"
              aria-label="Fermer le menu"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Inline keyframes for mobile slide-in animation */}
      <style jsx global>{`
        @keyframes slide-in-left {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
