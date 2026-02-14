"use client";

interface PillProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  color?: string;
}

export function Pill({ label, active = false, onClick, color }: PillProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
        active
          ? "bg-glupp-accent text-white"
          : "bg-glupp-card text-glupp-text-soft border border-glupp-border hover:border-glupp-text-muted"
      }`}
      style={active && color ? { backgroundColor: color } : undefined}
    >
      {label}
    </button>
  );
}
