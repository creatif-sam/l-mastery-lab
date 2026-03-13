-- Add time_limit per question (0 = use session global time)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS time_limit integer NOT NULL DEFAULT 0;

-- Allow admins to fully manage quizzes (bypasses any tutor-only policies)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'quizzes'
      AND policyname = 'admins_can_manage_quizzes'
  ) THEN
    CREATE POLICY "admins_can_manage_quizzes" ON quizzes
      FOR ALL TO authenticated
      USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;
