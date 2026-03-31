-- ============================================================
-- try.wepp — Pricing Slider Migration
-- Run in Supabase SQL Editor AFTER add_comment_features.sql
-- ============================================================

ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS pricing_mode   text  NOT NULL DEFAULT 'tiers',
  ADD COLUMN IF NOT EXISTS pricing_slider jsonb NOT NULL DEFAULT '{}';
