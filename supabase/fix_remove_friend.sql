-- Fix: Allow users to delete (remove) their own friendships
-- Without this policy, removeFriend() fails silently due to RLS

CREATE POLICY "Users can remove their own friendships" ON friendships
  FOR DELETE
  USING (auth.uid() = user_a OR auth.uid() = user_b);
