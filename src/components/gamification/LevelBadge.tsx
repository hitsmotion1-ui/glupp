import { getLevel } from "@/lib/utils/xp";

interface LevelBadgeProps {
  xp: number;
  showTitle?: boolean;
}

export function LevelBadge({ xp, showTitle = true }: LevelBadgeProps) {
  const level = getLevel(xp);

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="text-lg">{level.icon}</span>
      {showTitle && (
        <span className="text-sm font-medium text-glupp-cream">
          {level.title}
        </span>
      )}
      <span className="text-xs text-glupp-text-muted">Nv.{level.level}</span>
    </div>
  );
}
