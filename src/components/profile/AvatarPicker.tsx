import { AvatarData } from '@/lib/hooks/useAvatars';
import Image from 'next/image';

interface AvatarPickerProps {
  avatars: AvatarData[];
  currentAvatarId: string;
  onSelectAvatar: (avatarId: string) => void;
  onClose: () => void;
}

export default function AvatarPicker({ avatars, currentAvatarId, onSelectAvatar, onClose }: AvatarPickerProps) {
  
  const handleSelect = (avatar: AvatarData) => {
    if (avatar.isUnlocked) {
      onSelectAvatar(avatar.id);
      onClose();
    } else {
      // Afficher un toast : `Atteins le ${avatar.unlockHint} pour débloquer ${avatar.name} ${avatar.emoji}`
      console.log(`Verrouillé: ${avatar.unlockHint}`); 
    }
  };

  return (
    <div className="p-4 bg-glupp-bg rounded-t-2xl">
      <h2 className="text-xl font-bold mb-4 text-center">Choisis ton avatar</h2>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-glupp-text-soft mb-3 border-b border-glupp-border pb-1">── Disponibles ──</h3>
        <div className="grid grid-cols-4 gap-4">
          {avatars.filter(a => a.isUnlocked).map((avatar) => (
            <div key={avatar.id} className="flex flex-col items-center" onClick={() => handleSelect(avatar)}>
              <div className={`w-16 h-16 rounded-full relative overflow-hidden border-2 cursor-pointer transition-all
                ${currentAvatarId === avatar.id ? 'border-glupp-gold ring-2 ring-glupp-gold/30' : 'border-transparent hover:border-glupp-accent'}`}
              >
                 <Image src={`/avatars/${avatar.file_name}.png`} alt={avatar.name} fill className="object-cover" />
              </div>
              <span className="text-xs text-glupp-text-soft text-center mt-1">{avatar.name}</span>
            </div>
          ))}
        </div>
      </div>

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
  );
}