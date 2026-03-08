-- Fix: Allow users to re-submit their own rejected beers
-- The current RLS only allows admins to UPDATE beers.
-- Users need to be able to update their own rejected beers back to pending.

-- Policy: Users can update their own rejected beers (to re-submit them)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can resubmit own rejected beers'
    AND tablename = 'beers'
  ) THEN
    CREATE POLICY "Users can resubmit own rejected beers" ON beers
      FOR UPDATE USING (
        auth.uid() = added_by
        AND status = 'rejected'
      )
      WITH CHECK (
        auth.uid() = added_by
        AND status = 'pending'
      );
  END IF;
END $$;
