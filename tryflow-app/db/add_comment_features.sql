-- ============================================================
-- try.wepp — Comment Features Migration
-- Run in Supabase SQL Editor AFTER full_schema.sql
-- ============================================================

-- 1. New columns on comments
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS credit_awarded integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reactions      text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS likes_count    integer NOT NULL DEFAULT 0;

-- 2. Likes join table (composite PK prevents double-voting)
CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id text REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  voter_id   text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (comment_id, voter_id)
);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public insert comment_likes" ON comment_likes;
DROP POLICY IF EXISTS "public delete comment_likes" ON comment_likes;
DROP POLICY IF EXISTS "public read comment_likes"   ON comment_likes;

CREATE POLICY "public insert comment_likes" ON comment_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete comment_likes" ON comment_likes FOR DELETE USING (true);
CREATE POLICY "public read comment_likes"   ON comment_likes FOR SELECT USING (true);

-- 3. Atomic toggle — handles like/unlike + counter in one transaction
CREATE OR REPLACE FUNCTION toggle_comment_like(
  p_comment_id text,
  p_voter_id   text
) RETURNS jsonb AS $$
DECLARE
  already_liked boolean;
  new_count      integer;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM comment_likes
    WHERE comment_id = p_comment_id AND voter_id = p_voter_id
  ) INTO already_liked;

  IF already_liked THEN
    DELETE FROM comment_likes
      WHERE comment_id = p_comment_id AND voter_id = p_voter_id;
    UPDATE comments
      SET likes_count = GREATEST(likes_count - 1, 0)
      WHERE id = p_comment_id
      RETURNING likes_count INTO new_count;
    RETURN jsonb_build_object('liked', false, 'likes_count', new_count);
  ELSE
    INSERT INTO comment_likes (comment_id, voter_id) VALUES (p_comment_id, p_voter_id);
    UPDATE comments
      SET likes_count = likes_count + 1
      WHERE id = p_comment_id
      RETURNING likes_count INTO new_count;
    RETURN jsonb_build_object('liked', true, 'likes_count', new_count);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
