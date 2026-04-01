"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Users, Sparkles, Beer, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  // Sauvegarder le code de parrainage en localStorage
  useEffect(() => {
    if (code) {
      localStorage.setItem("glupp-referral-code", code);
    }
  }, [code]);

  return (
    <div className="min-h-screen bg-[#141210] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center space-y-6">
        {/* Logo */}
        <Image
          src="/logo.svg"
          alt="Glupp"
          width={120}
          height={40}
          priority
          className="mx-auto"
        />

        {/* Invite hero */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="w-20 h-20 bg-[#E08840]/20 rounded-full flex items-center justify-center mx-auto border-2 border-[#E08840]/40"
        >
          <span className="text-4xl">🍻</span>
        </motion.div>

        <div>
          <h1 className="font-display text-2xl font-bold text-[#F5E6D3] mb-2">
            Un ami t&apos;invite sur Glupp !
          </h1>
          <p className="text-sm text-[#A89888] leading-relaxed">
            Rejoins la communaute des Gluppeurs. Collectionne des bieres, defie tes potes, et gagne de l&apos;XP !
          </p>
        </div>

        {/* Features */}
        <div className="space-y-2.5">
          {[
            { icon: <Beer size={14} />, text: "Collectionne toutes les bieres que tu goutes", color: "#E08840" },
            { icon: <Trophy size={14} />, text: "Debloque des trophees et monte de niveau", color: "#F0C460" },
            { icon: <Users size={14} />, text: "Rejoins le crew de ton ami automatiquement", color: "#4ECDC4" },
            { icon: <Sparkles size={14} />, text: "+25 XP offerts pour ton inscription", color: "#A78BFA" },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left"
              style={{
                backgroundColor: `${f.color}08`,
                borderColor: `${f.color}20`,
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${f.color}15`, color: f.color }}
              >
                {f.icon}
              </div>
              <span className="text-sm text-[#F5E6D3]">{f.text}</span>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            className="w-full"
            size="lg"
            onClick={() => router.push(`/register?ref=${code}`)}
          >
            <Sparkles size={16} className="mr-1.5" />
            Creer mon compte
          </Button>

          <p className="text-xs text-[#6B6050]">
            Deja un compte ?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-[#E08840] hover:underline"
            >
              Se connecter
            </button>
          </p>
        </div>

        <p className="text-[8px] text-[#6B6050] pt-4 border-t border-[#3A3530]">
          L&apos;abus d&apos;alcool est dangereux pour la sante, a consommer avec moderation.
        </p>
      </div>
    </div>
  );
}
