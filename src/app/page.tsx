"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Beer, Swords, Trophy, Users, MapPin, Camera, Flame, ChevronRight, Star } from "lucide-react";

const FEATURES = [
  {
    icon: <Beer className="w-6 h-6" />,
    title: "Collectionne",
    description: "Scanne, photographie et ajoute chaque biere a ton Beerdex personnel.",
    color: "#E08840",
  },
  {
    icon: <Swords className="w-6 h-6" />,
    title: "Defie",
    description: "3 duels par jour pour classer tes bieres preferees. Qui sera ta #1 ?",
    color: "#A78BFA",
  },
  {
    icon: <Trophy className="w-6 h-6" />,
    title: "Progresse",
    description: "Gagne de l'XP, monte de niveau, debloque des badges et des avatars exclusifs.",
    color: "#F0C460",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Partage",
    description: "Rejoins tes potes, compare vos gouts, reagis a leurs decouvertes.",
    color: "#4ECDC4",
  },
];

const STATS_MOCK = [
  { label: "Bieres", value: "60+", icon: "🍺" },
  { label: "Brasseries", value: "30+", icon: "🏭" },
  { label: "Bars", value: "15+", icon: "📍" },
  { label: "Gluppers", value: "17", icon: "👥" },
];

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // Rediriger si déjà connecté
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.replace("/duel");
      } else {
        setChecking(false);
      }
    };
    check();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#16130E] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Beer className="w-8 h-8 text-[#E08840]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#16130E] text-[#F5E6D3] overflow-hidden">
      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#E08840]/5 rounded-full blur-[150px]" />
        
        {/* Floating emojis */}
        {["🍺", "🍻", "⚔️", "🏆", "📸", "🌍"].map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl opacity-10"
            style={{ top: `${15 + i * 12}%`, left: `${10 + (i * 17) % 80}%` }}
            animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4 + i * 0.7, repeat: Infinity, delay: i * 0.5 }}
          >
            {emoji}
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          {/* Logo */}
          <motion.h1
            className="font-display text-6xl md:text-8xl font-black tracking-tight mb-2"
            style={{ color: "#E08840" }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.4, delay: 0.2 }}
          >
            Glupp
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-[#A89888] font-light italic mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Every glupp counts.
          </motion.p>

          <motion.p
            className="text-sm md:text-base text-[#A89888] max-w-md mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            L&apos;app qui transforme chaque biere en aventure.
            Collectionne, defie tes potes, decouvre de nouvelles saveurs
            et deviens le Titan de la biere.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#E08840] text-[#16130E] font-bold text-base rounded-xl hover:bg-[#E08840]/90 transition-all hover:scale-105 shadow-lg shadow-[#E08840]/20">
              <Flame size={18} />
              Commencer l&apos;aventure
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border border-[#3A3530] text-[#A89888] font-medium text-base rounded-xl hover:border-[#E08840]/50 hover:text-[#F5E6D3] transition-all">
              J&apos;ai deja un compte
              <ChevronRight size={16} />
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-[#3A3530] flex items-start justify-center pt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E08840]" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="font-display text-3xl md:text-4xl font-bold text-center mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Comment ca marche ?
          </motion.h2>
          <motion.p
            className="text-center text-[#6B6050] mb-12 max-w-lg mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Glupp transforme chaque biere en experience. Pas besoin d&apos;etre un expert — juste d&apos;avoir soif de decouverte.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                className="p-6 rounded-2xl border border-[#3A3530] bg-[#1E1B16] hover:border-opacity-50 transition-all group"
                style={{ ["--accent" as string]: feature.color }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${feature.color}15`, color: feature.color }}>
                  {feature.icon}
                </div>
                <h3 className="font-display text-lg font-bold mb-2" style={{ color: feature.color }}>
                  {feature.title}
                </h3>
                <p className="text-sm text-[#A89888] leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-4 gap-3">
            {STATS_MOCK.map((stat, i) => (
              <motion.div
                key={i}
                className="text-center p-4 rounded-xl bg-[#1E1B16] border border-[#3A3530]"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="text-2xl block mb-1">{stat.icon}</span>
                <p className="font-display text-xl font-bold text-[#E08840]">{stat.value}</p>
                <p className="text-[10px] text-[#6B6050] uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 px-6">
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            className="p-8 rounded-2xl border border-[#3A3530] bg-[#1E1B16]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} className="text-[#F0C460] fill-[#F0C460]" />
              ))}
            </div>
            <p className="text-sm text-[#A89888] italic leading-relaxed mb-4">
              &quot;Depuis que j&apos;utilise Glupp, chaque soiree bar est devenue une aventure.
              Les duels avec les potes c&apos;est addictif, et le systeme de niveaux
              donne envie de decouvrir toujours plus.&quot;
            </p>
            <p className="text-xs text-[#6B6050]">— Un Glupper convaincu</p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Pret a <span style={{ color: "#E08840" }}>glupper</span> ?
          </h2>
          <p className="text-[#6B6050] mb-8 max-w-md mx-auto">
            Rejoins la communaute et commence a collectionner tes bieres des maintenant. C&apos;est gratuit.
          </p>
          <Link href="/register" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-[#E08840] text-[#16130E] font-bold text-lg rounded-xl hover:bg-[#E08840]/90 transition-all hover:scale-105 shadow-lg shadow-[#E08840]/20">
            🍺 Creer mon compte
          </Link>
          <p className="text-[10px] text-[#6B6050] mt-4">
            L&apos;abus d&apos;alcool est dangereux pour la sante. A consommer avec moderation. 18+
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#3A3530]/50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-black text-[#E08840]">Glupp</span>
            <span className="text-xs text-[#6B6050]">v1.1 · 18+</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#6B6050]">
            <Link href="/legal/terms" className="hover:text-[#A89888] transition-colors">CGU</Link>
            <Link href="/legal/privacy" className="hover:text-[#A89888] transition-colors">Confidentialite</Link>
            <Link href="/legal/mentions" className="hover:text-[#A89888] transition-colors">Mentions legales</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
