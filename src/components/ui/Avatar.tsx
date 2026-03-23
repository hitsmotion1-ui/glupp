interface AvatarProps {
  url?: string | null;
  name?: string; // Rendu optionnel au cas où on n'a que le fileName
  size?: "sm" | "md" | "lg";
  fileName?: string | null; // 🆕 Pour les nouveaux avatars illustrés
  onClick?: () => void;     // 🆕 Pour rendre l'avatar cliquable (ex: ouvrir le modal)
  className?: string;       // 🆕 Pour ajouter des styles spécifiques (ex: bordures)
  showBorder?: boolean;     // 🆕 Pour afficher une bordure dorée quand sélectionné
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

export function Avatar({ 
  url, 
  name = "?", 
  size = "md", 
  fileName, 
  onClick, 
  className = "",
  showBorder = false
}: AvatarProps) {
  
  // Classes de base partagées par tous les rendus
  const baseClasses = `${sizes[size]} rounded-full flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer transition-transform hover:scale-105' : ''} ${showBorder ? 'border-2 border-glupp-gold ring-2 ring-glupp-gold/30' : ''} ${className}`;

  // 1. Priorité aux nouveaux avatars illustrés
  if (fileName) {
    return (
      <img
        src={`/avatars/${fileName}.png`}
        alt={name !== "?" ? name : "Avatar"}
        className={`${baseClasses} object-cover`}
        onClick={onClick}
      />
    );
  }

  // 2. Fallback sur l'ancienne URL (ex: image uploadée ou Google Auth)
  if (url) {
    return (
      <img
        src={url}
        alt={name !== "?" ? name : "Avatar"}
        className={`${baseClasses} object-cover`}
        onClick={onClick}
      />
    );
  }

  // 3. Fallback final sur les initiales colorées
  return (
    <div
      className={`${baseClasses} font-bold text-white overflow-hidden`}
      style={{ backgroundColor: hashColor(name) }}
      onClick={onClick}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}