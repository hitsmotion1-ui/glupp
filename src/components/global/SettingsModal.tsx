"use client";

import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/lib/store/useAppStore";
import { LogOut, Camera, Loader2, Save } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername?: string;
  currentAvatarUrl?: string | null;
  userId?: string;
}

export function SettingsModal({ isOpen, onClose, currentUsername, currentAvatarUrl, userId }: SettingsModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const showXPToast = useAppStore((s) => s.showXPToast);
  
  const [username, setUsername] = useState(currentUsername || "");
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mettre à jour l'état local si les props changent
  useEffect(() => {
    if (isOpen) {
      setUsername(currentUsername || "");
      setAvatarUrl(currentAvatarUrl || "");
    }
  }, [isOpen, currentUsername, currentAvatarUrl]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    queryClient.clear(); // On vide le cache
    router.push("/login"); // Redirection vers l'accueil/login
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      const file = event.target.files?.[0];
      if (!file || !userId) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}-${Math.random()}.${fileExt}`;

      // 1. Upload dans le bucket Supabase (assure-toi d'avoir un bucket "avatars" public)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (error) {
      console.error("Erreur d'upload:", error);
      alert("Erreur lors de l'envoi de l'image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({ 
          username, 
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (error) throw error;

      // Rafraîchir les données du profil dans l'app
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      
      showXPToast(0, "Profil mis à jour !"); // Petit toast de succès
      onClose();
    } catch (error) {
      console.error("Erreur de sauvegarde:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Paramètres">
      <div className="space-y-6 pb-4">
        
        {/* Photo de profil */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-glupp-card border-2 border-glupp-border relative">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl bg-glupp-bg">
                  👽
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" size={24} />
                </div>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 p-2 bg-glupp-accent text-white rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <Camera size={16} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <p className="text-xs text-glupp-text-muted">Changer la photo</p>
        </div>

        {/* Informations */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-glupp-text-soft mb-1">
              Pseudo
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-glupp-bg border border-glupp-border rounded-lg px-4 py-2 text-glupp-cream focus:outline-none focus:border-glupp-accent"
              placeholder="Ton pseudo..."
            />
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="pt-4 border-t border-glupp-border/50 flex flex-col gap-3">
          <Button 
            variant="primary" 
            className="w-full flex items-center justify-center gap-2"
            onClick={handleSave}
            disabled={isSaving || isUploading}
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Sauvegarder les modifications
          </Button>

          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-center gap-2 text-glupp-error hover:bg-glupp-error/10 hover:text-glupp-error transition-colors border border-glupp-error/20"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Se déconnecter
          </Button>
        </div>

      </div>
    </Modal>
  );
}