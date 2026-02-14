import { RARITY_CONFIG, type Rarity } from "@/lib/utils/xp";

interface RarityBadgeProps {
  rarity: Rarity;
}

export function RarityBadge({ rarity }: RarityBadgeProps) {
  const config = RARITY_CONFIG[rarity];

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{
        backgroundColor: `${config.color}20`,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  );
}
