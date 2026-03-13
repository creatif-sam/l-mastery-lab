-- =====================================================
-- COOPETITION: Real-time Kahoot-style quiz battles
-- =====================================================

-- ─ Sessions ─
CREATE TABLE IF NOT EXISTS coopetition_sessions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id    uuid        NOT NULL REFERENCES quizzes(id)   ON DELETE CASCADE,
  host_id    uuid        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  join_code  text        NOT NULL,
  status     text        NOT NULL DEFAULT 'lobby'
               CHECK (status IN ('lobby','active','finished')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coopetition_sessions_join_code_key UNIQUE (join_code)
);

-- ─ Participants ─
CREATE TABLE IF NOT EXISTS coopetition_participants (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid        NOT NULL REFERENCES coopetition_sessions(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  display_name text        NOT NULL,
  avatar_url   text,
  score        integer     NOT NULL DEFAULT 0,
  joined_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);

-- ─ Indexes ─
CREATE INDEX IF NOT EXISTS idx_coopetition_sessions_join_code
  ON coopetition_sessions(join_code);
CREATE INDEX IF NOT EXISTS idx_coopetition_participants_session
  ON coopetition_participants(session_id);

-- ─ RLS ─
ALTER TABLE coopetition_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE coopetition_participants ENABLE ROW LEVEL SECURITY;

-- Sessions: all authenticated users can read; only host can modify
CREATE POLICY "coopetition_sessions_select"
  ON coopetition_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "coopetition_sessions_insert"
  ON coopetition_sessions FOR INSERT TO authenticated
  WITH CHECK (host_id = auth.uid());
CREATE POLICY "coopetition_sessions_update"
  ON coopetition_sessions FOR UPDATE TO authenticated
  USING (host_id = auth.uid());
CREATE POLICY "coopetition_sessions_delete"
  ON coopetition_sessions FOR DELETE TO authenticated
  USING (host_id = auth.uid());

-- Participants: all authenticated users can read; users manage their own row;
-- host can also update scores
CREATE POLICY "coopetition_participants_select"
  ON coopetition_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "coopetition_participants_insert"
  ON coopetition_participants FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "coopetition_participants_update"
  ON coopetition_participants FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM coopetition_sessions cs
      WHERE cs.id = session_id AND cs.host_id = auth.uid()
    )
  );

-- =====================================================
-- END OF MIGRATION
-- =====================================================
