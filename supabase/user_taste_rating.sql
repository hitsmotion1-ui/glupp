-- ═══════════════════════════════════════════
-- Migration: Add user taste rating columns to user_beers
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════

-- Ajoute les colonnes pour le ressenti gustatif de l'utilisateur
ALTER TABLE user_beers
  ADD COLUMN IF NOT EXISTS user_taste_bitter SMALLINT CHECK (user_taste_bitter BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS user_taste_sweet SMALLINT CHECK (user_taste_sweet BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS user_taste_fruity SMALLINT CHECK (user_taste_fruity BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS user_taste_body SMALLINT CHECK (user_taste_body BETWEEN 1 AND 5);

-- Commentaires explicatifs
COMMENT ON COLUMN user_beers.user_taste_bitter IS 'Note subjective amertume (1-5) donnee par le user';
COMMENT ON COLUMN user_beers.user_taste_sweet IS 'Note subjective sucre (1-5) donnee par le user';
COMMENT ON COLUMN user_beers.user_taste_fruity IS 'Note subjective fruite (1-5) donnee par le user';
COMMENT ON COLUMN user_beers.user_taste_body IS 'Note subjective corps (1-5) donnee par le user';
