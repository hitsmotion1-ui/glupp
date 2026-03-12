"use client";

import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/lib/store/useAppStore";
import { LogOut, Camera, Loader2, Save, MapPin, Shield, User as UserIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername?: string;
  currentAvatarUrl?: string | null;
  userId?: string;
}

// 🌍 Liste des suggestions de villes (Tu peux en ajouter d'autres !)
const POPULAR_CITIES = [
  "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", 
  "Montpellier", "Strasbourg", "Bordeaux", "Lille", "Rennes", 
  "Reims", "Saint-Étienne", "Toulon", "Le Havre", "Grenoble", 
  "Dijon", "Angers", "Nîmes", "Clermont-Ferrand", "Aix-en-Provence",
  "Bruxelles", "Liège", "Namur", "Genève", "Lausanne", "Montréal", "Québec"
].sort();

export function SettingsModal({ isOpen, onClose, currentUsername, currentAvatarUrl, userId }: SettingsModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const showXPToast = useAppStore((s) => s.showXPToast);
  
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [city, setCity] = useState("");
  
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && userId) {
      setUsername(currentUsername || "");
      setAvatarUrl(currentAvatarUrl || "");
      setErrorMsg("");
      setSuccessMsg("");
      setNewPassword("");
      
      const fetchExtraData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) setEmail(user.email);

        const { data: profile } = await supabase
          .from("profiles")
          .select("city")
          .eq("id", userId)
          .single();
        if (profile?.city) setCity(profile.city);
      };
      fetchExtraData();
    }
  }, [isOpen, currentUsername, currentAvatarUrl, userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    router.push("/login");
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      setErrorMsg("");
      const file = event.target.files?.[0];
      if (!file || !userId) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
    } catch (error) {
      setErrorMsg("Erreur lors de l'envoi de l'image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    try {
      setIsSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      if (username !== currentUsername) {
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .ilike("username", username)
          .neq("id", userId)
          .single();

        if (existingUser) {
          setErrorMsg("Ce pseudo est déjà utilisé par un autre Glupper !");
          setIsSaving(false);
          return;
        }
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          username, 
          avatar_url: avatarUrl,
          city,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      let authMessage = "";
      if (activeTab === "security") {
        const updates: { email?: string; password?: string } = {};
        
        const { data: { user } } = await supabase.auth.getUser();
        if (email && email !== user?.email) updates.email = email;
        if (newPassword && newPassword.length >= 6) updates.password = newPassword;

        if (Object.keys(updates).length > 0) {
          const { error: authError } = await supabase.auth.updateUser(updates);
          if (authError) throw authError;
          
          if (updates.email) {
            authMessage = " Un lien de confirmation a été envoyé à ta nouvelle adresse email.";
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      
      setSuccessMsg("Modifications sauvegardées !" + authMessage);
      showXPToast(0, "Profil mis à jour");
      
      setTimeout(() => {
        if (!authMessage) onClose();
      }, 2000);

    } catch (error: any) {
      console.error("Erreur de sauvegarde:", error);
      setErrorMsg(error.message || "Une erreur est survenue.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Paramètres">
      <div className="space-y-6 pb-4">
        
        <div className="flex bg-glupp-bg rounded-lg p-1 border border-glupp-border">
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "profile" ? "bg-glupp-card text-glupp-cream shadow-sm" : "text-glupp-text-muted hover:text-glupp-text-soft"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            <UserIcon size={14} />
            Profil Public
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "security" ? "bg-glupp-card text-glupp-cream shadow-sm" : "text-glupp-text-muted hover:text-glupp-text-soft"
            }`}
            onClick={() => setActiveTab("security")}
          >
            <Shield size={14} />
            Sécurité
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-glupp-error/10 border border-glupp-error/30 rounded-lg text-xs text-glupp-error text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-glupp-success/10 border border-glupp-success/30 rounded-lg text-xs text-glupp-success text-center">
            {successMsg}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-glupp-card border-2 border-glupp-border relative">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl bg-glupp-bg">👽</div>
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
                <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-glupp-text-soft mb-1">Pseudo</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-glupp-bg border border-glupp-border rounded-lg px-4 py-2 text-glupp-cream focus:outline-none focus:border-glupp-accent"
                  placeholder="Ton pseudo..."
                />
              </div>
              
              {/* 🆕 CHAMP VILLE MODIFIÉ AVEC DATALIST ET COMMENTAIRE */}
              <div>
                <label className="block text-xs font-semibold text-glupp-text-soft mb-1 flex items-center gap-1">
                  <MapPin size={12} /> Ville
                </label>
                <input
                  type="text"
                  list="city-suggestions"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-glupp-bg border border-glupp-border rounded-lg px-4 py-2 text-glupp-cream focus:outline-none focus:border-glupp-accent"
                  placeholder="Ex: Paris, Lyon, Bordeaux..."
                />
                <datalist id="city-suggestions">
                  {POPULAR_CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <p className="text-[10px] text-glupp-accent/80 mt-1.5 flex items-center gap-1">
                  💡 Pratique pour voir les gluppers pas loin de chez toi !
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div>
              <label className="block text-xs font-semibold text-glupp-text-soft mb-1">Adresse Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-glupp-bg border border-glupp-border rounded-lg px-4 py-2 text-glupp-cream focus:outline-none focus:border-glupp-accent"
              />
              <p className="text-[10px] text-glupp-text-muted mt-1">
                Si tu modifies ton email, un lien de confirmation sera envoyé.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-glupp-text-soft mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-glupp-bg border border-glupp-border rounded-lg px-4 py-2 text-glupp-cream focus:outline-none focus:border-glupp-accent"
                placeholder="Laisser vide pour ne pas changer"
              />
            </div>
            
            <div className="pt-4 mt-4 border-t border-glupp-border/50">
              <Button 
                variant="ghost" 
                className="w-full flex items-center justify-center gap-2 text-glupp-error hover:bg-glupp-error/10 hover:text-glupp-error transition-colors border border-glupp-error/20"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Se déconnecter de cet appareil
              </Button>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-glupp-border/50">
          <Button 
            variant="primary" 
            className="w-full flex items-center justify-center gap-2"
            onClick={handleSave}
            disabled={isSaving || isUploading}
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Sauvegarder les modifications
          </Button>
        </div>

      </div>
    </Modal>
  );
}