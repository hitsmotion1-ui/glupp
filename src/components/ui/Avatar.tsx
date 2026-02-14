interface AvatarProps {
  url?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-20 h-20 text-xl",
};

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 50%, 40%)`;
}

export function Avatar({ url, name, size = "md" }: AvatarProps) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white`}
      style={{ backgroundColor: hashColor(name) }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
