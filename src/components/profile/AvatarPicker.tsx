import { AvatarData } from '@/lib/hooks/useAvatars';
import Image from 'next/image';

const BG_COLORS = [
  { id: 'none', color: 'transparent', label: 'Aucun' },
  { id: 'amber', color: '#E08840', label: 'Ambre' },
  { id: 'gold', color: '#F0C460', label: 'Or' },
  { id: 'teal', color: '#4ECDC4', label: 'Turquoise' },
  { id: 'purple', color: '#A78BFA', label: 'Violet' },
  { id: 'red', color: '#EF4444', label: 'Rouge' },
  { id: 'green', color: '#22C55E', label: 'Vert' },
  { id: 'blue', color: '#3B82F6', label: 'Bleu' },
  { id: 'pink', color: '#EC4899', label: 'Rose' },
  { id: 'slate', color: '#64748B', label: 'Ardoise' },
];

interface AvatarPickerProps {
  avatars: AvatarData[];
  currentAvatarId: string;
  currentBgColor?: string;
  onSelectAvatar: (avatarId: string) => void;
  onSelectBgColor?: (color: string) => void;
  onClose: () => void;
}

export default function AvatarPicker({ 
  avatars, 
  currentAvatarId, 
  currentBgColor,
  onSelectAvatar, 
  onSelectBgColor,
  onClose 
}: AvatarPickerProps) {
  const handleSelect = (avatar: AvatarData) => {
    if (avatar.isUnlocked) {
      onSelectAvatar(avatar.id);
      onClose();
    }
  };

  const handleBgColor = (color: string) => {
    if (onSelectBgColor) {
      onSelectBgColor(color === 'transparent' ? '' : color);
    }
  };

  return (
    <div className="flex flex-col w-full max-h-[85vh]">
      {/* HEADER */}
      <div className="p-4 pb-3 shrink-0 border-b border-glupp-border/30">
        <h2 className="text-xl font-bold text-center text-glupp-cream">Choisis ton avatar</h2>
      </div>

      {/* ZONE SCROLLABLE */}
      <div className="p-4 pb-12 overflow-y-auto overscroll-contain flex-1">
        
        {/* ── Couleur de fond ── */}
        {onSelectBgColor && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-glupp-text-soft mb-3 border-b border-glupp-border pb-1">── Couleur de fond ──</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {BG_COLORS.map((bg) => {
                const isActive = bg.color === 'transparent' 
                  ? (!currentBgColor || currentBgColor === '' || currentBgColor === 'transparent')
                  : currentBgColor === bg.color;
                return (
                  <button
                    key={bg.id}
                    onClick={() => handleBgColor(bg.color)}
                    className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'scale-110' : 'opacity-70 hover:opacity-100'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        isActive ? 'border-glupp-gold ring-2 ring-glupp-gold/30' : 'border-glupp-border'
                      }`}
                      style={{ 
                        backgroundColor: bg.color === 'transparent' ? '#1E1B16' : bg.color,
                      }}
                    >
                      {bg.color === 'transparent' && (
                        <div className="w-full h-full flex items-center justify-center text-glupp-text-muted text-xs">✕</div>
                      )}
                    </div>
                    <span className="text-[8px] text-glupp-text-muted">{bg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Disponibles ── */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-glupp-text-soft mb-3 border-b border-glupp-border pb-1">── Disponibles ──</h3>
          <div className="grid grid-cols-4 gap-4">
            {avatars.filter(a => a.isUnlocked).map((avatar) => (
              <div key={avatar.id} className="flex flex-col items-center" onClick={() => handleSelect(avatar)}>
                <div className={`rounded-full relative overflow-hidden border-2 cursor-pointer transition-all
                  ${currentAvatarId === avatar.id ? 'border-glupp-gold ring-2 ring-glupp-gold/30' : 'border-transparent hover:border-glupp-accent'}`}
                  style={currentAvatarId === avatar.id && currentBgColor && currentBgColor !== 'transparent'
                    ? { padding: '2px', background: currentBgColor }
                    : undefined
                  }
                >
                   <div className="w-16 h-16 relative overflow-hidden rounded-full">
                     <Image src={`/avatars/${avatar.file_name}.png`} alt={avatar.name} fill className="object-cover" />
                   </div>
                </div>
                <span className="text-xs text-glupp-text-soft text-center mt-1">{avatar.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── À débloquer ── */}
        <div>
          <h3 className="text-sm font-semibold text-glupp-text-soft mb-3 border-b border-glupp-border pb-1">── À débloquer ──</h3>
          <div className="grid grid-cols-4 gap-4">
            {avatars.filter(a => !a.isUnlocked).map((avatar) => (
               <div key={avatar.id} className="flex flex-col items-center" onClick={() => handleSelect(avatar)}>
               <div className="w-16 h-16 rounded-full relative overflow-hidden border-2 border-dashed border-glupp-border grayscale opacity-40 cursor-not-allowed">
                  <Image src={`/avatars/${avatar.file_name}.png`} alt={avatar.name} fill className="object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="text-xl">🔒</span>
                  </div>
               </div>
               <span className="text-[10px] text-glupp-text-muted text-center mt-1 truncate w-full">{avatar.unlockHint}</span>
             </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
