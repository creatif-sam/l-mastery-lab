-- ============================================================
-- LML Platform – Tutor Content Creation (2026-02-27 v2)
-- ============================================================

-- Allow tutors to own lessons and quizzes
ALTER TABLE public.lessons  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.quizzes  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- RLS: tutors can insert / update / delete their own lessons
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors can manage their lessons"    ON public.lessons;
DROP POLICY IF EXISTS "Anyone authenticated can view lessons" ON public.lessons;

CREATE POLICY "Anyone authenticated can view lessons"
  ON public.lessons FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Tutors can manage their lessons"
  ON public.lessons FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Allow admins to manage all lessons
DROP POLICY IF EXISTS "Admins can manage all lessons" ON public.lessons;
CREATE POLICY "Admins can manage all lessons"
  ON public.lessons FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS: tutors can insert / update / delete their own quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view quizzes"  ON public.quizzes;
DROP POLICY IF EXISTS "Tutors can manage their quizzes"        ON public.quizzes;
DROP POLICY IF EXISTS "Admins can manage all quizzes"          ON public.quizzes;

CREATE POLICY "Anyone authenticated can view quizzes"
  ON public.quizzes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Tutors can manage their quizzes"
  ON public.quizzes FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all quizzes"
  ON public.quizzes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS: questions and options follow the quiz owner
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view questions"         ON public.questions;
DROP POLICY IF EXISTS "Quiz owners can manage questions"  ON public.questions;
DROP POLICY IF EXISTS "Anyone can view options"           ON public.question_options;
DROP POLICY IF EXISTS "Quiz owners can manage options"    ON public.question_options;

CREATE POLICY "Anyone can view questions"
  ON public.questions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Quiz owners can manage questions"
  ON public.questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = questions.quiz_id
        AND (quizzes.created_by = auth.uid()
             OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Anyone can view options"
  ON public.question_options FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Quiz owners can manage options"
  ON public.question_options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.questions
      JOIN public.quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = question_options.question_id
        AND (quizzes.created_by = auth.uid()
             OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- RLS: lesson_categories – anyone can read, admins/tutors can create
ALTER TABLE public.lesson_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view lesson categories"      ON public.lesson_categories;
DROP POLICY IF EXISTS "Admins and tutors can manage categories" ON public.lesson_categories;

CREATE POLICY "Anyone can view lesson categories"
  ON public.lesson_categories FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and tutors can manage categories"
  ON public.lesson_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'tutor')
    )
  );
