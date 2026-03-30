-- try.wepp — Migrate legacy category names to new system
-- Run in Supabase SQL Editor

UPDATE experiments SET category = 'Health'      WHERE category = 'HealthTech';
UPDATE experiments SET category = 'Education'   WHERE category = 'EdTech';
UPDATE experiments SET category = 'Marketplace' WHERE category = 'FoodTech';
UPDATE experiments SET category = 'Social'      WHERE category = 'Community';
UPDATE experiments SET category = 'SaaS'        WHERE category = 'Tech';
UPDATE experiments SET category = 'Other'       WHERE category NOT IN (
  'SaaS', 'Marketplace', 'Consumer', 'Dev Tools',
  'Health', 'Education', 'Social', 'Other'
);
