-- Allow anyone to read idea_submissions (anonymous public browsing)
-- Run this in Supabase SQL Editor

CREATE POLICY "public read ideas"
  ON idea_submissions FOR SELECT USING (true);