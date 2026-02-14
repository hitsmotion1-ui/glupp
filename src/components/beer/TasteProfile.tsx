interface TasteProfileProps {
  bitter: number;
  sweet: number;
  fruity: number;
  body: number;
}

const dimensions = [
  { key: "bitter", label: "Amertume", color: "#E08840" },
  { key: "sweet", label: "Sucre", color: "#DCB04C" },
  { key: "fruity", label: "Fruite", color: "#4CAF50" },
  { key: "body", label: "Corps", color: "#8D7C6C" },
] as const;

export function TasteProfile({
  bitter,
  sweet,
  fruity,
  body,
}: TasteProfileProps) {
  const values = { bitter, sweet, fruity, body };

  return (
    <div className="space-y-2">
      {dimensions.map((dim) => (
        <div key={dim.key} className="flex items-center gap-3">
          <span className="text-xs text-glupp-text-soft w-20 text-right">
            {dim.label}
          </span>
          <div className="flex-1 h-2 bg-glupp-card-alt rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(values[dim.key] / 5) * 100}%`,
                backgroundColor: dim.color,
              }}
            />
          </div>
          <span className="text-xs text-glupp-text-muted w-4">
            {values[dim.key]}
          </span>
        </div>
      ))}
    </div>
  );
}
