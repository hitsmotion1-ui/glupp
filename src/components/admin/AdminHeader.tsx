"use client";

import { ReactNode } from "react";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function AdminHeader({ title, subtitle, children }: AdminHeaderProps) {
  return (
    <header className="border-b border-[#3A3530] bg-[#1E1B16]/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-4 lg:px-8">
        {/* Left: title + subtitle */}
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-[#F5E6D3] truncate lg:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-[#A89888] truncate">{subtitle}</p>
          )}
        </div>

        {/* Right: action slot */}
        {children && (
          <div className="flex items-center gap-2 ml-4 shrink-0">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
