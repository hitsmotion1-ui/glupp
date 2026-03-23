import Image from 'next/image';

interface AvatarProps {
  avatarId: string;
  fileName: string; // Nécessaire pour construire le chemin
  size?: 'sm' | 'md' | 'lg';
  showBorder?: boolean;
  onClick?: () => void;
  className?: string;
  fallbackInitial?: string; // Pour gérer l'ancien comportement si avatar non trouvé
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
};

export default function Avatar({ avatarId, fileName, size = 'md', showBorder, onClick, className = '', fallbackInitial }: AvatarProps) {
  // Gestion simple du fallback si on n'a pas encore le fileName de l'avatar en DB
  if (!fileName) {
      return (
          <div className={`${sizeClasses[size]} rounded-full bg-glupp-accent text-white flex items-center justify-center font-bold ${className}`} onClick={onClick}>
              {fallbackInitial || '?'}
          </div>
      )
  }

  return (
    <div 
      className={`relative rounded-full overflow-hidden ${sizeClasses[size]} ${showBorder ? 'border-2 border-glupp-gold' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <Image
        src={`/avatars/${fileName}.png`}
        alt={`Avatar ${avatarId}`}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}