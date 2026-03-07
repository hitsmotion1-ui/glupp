-- ═══════════════════════════════════════════
-- Fix: RLS policy pour permettre aux users d'inserer des bieres pending
-- + Colonne image_url sur beers
-- Executer dans Supabase SQL Editor APRES reset_and_seed.sql
-- ═══════════════════════════════════════════

-- 1. Permettre aux utilisateurs connectes d'inserer des bieres avec status='pending'
-- (La policy admin existante permet deja aux admins d'inserer avec n'importe quel status)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can propose pending beers' AND tablename = 'beers'
  ) THEN
    CREATE POLICY "Users can propose pending beers" ON beers
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND status = 'pending'
      );
  END IF;
END $$;

-- 2. Ajouter la colonne image_url si elle n'existe pas
ALTER TABLE beers ADD COLUMN IF NOT EXISTS image_url TEXT;
COMMENT ON COLUMN beers.image_url IS 'URL de la photo de la biere (Supabase Storage)';

-- 3. Creer le bucket storage pour les photos de bieres (si pas deja fait)
-- NOTE: Si le bucket n'existe pas, le creer dans Supabase Dashboard > Storage > New Bucket
-- Nom: "beer-photos", Public: true
-- Ou executer:
INSERT INTO storage.buckets (id, name, public)
VALUES ('beer-photos', 'beer-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Policy storage: tout user connecte peut upload dans beer-photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can upload beer photos' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Anyone can upload beer photos" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'beer-photos' AND auth.uid() IS NOT NULL
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Beer photos are public' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Beer photos are public" ON storage.objects
      FOR SELECT USING (bucket_id = 'beer-photos');
  END IF;
END $$;
