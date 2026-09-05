-- ==============================================================================
-- QUARRY: MIGRACIÓN FASE 3 (CHECK-IN DIARIO Y BITÁCORA DE CAMPO)
-- ==============================================================================

-- 1. TABLA: daily_checkins
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checkin_date date NOT NULL,
  energy_level int4 NOT NULL CHECK (energy_level >= 1 AND energy_level <= 5),
  mood text NULL,
  sleep_hours numeric NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT daily_checkins_profile_date_uniq UNIQUE (profile_id, checkin_date)
);

-- Habilitar RLS en daily_checkins
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para daily_checkins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_checkins' AND policyname = 'Users can view own daily_checkins'
  ) THEN
    CREATE POLICY "Users can view own daily_checkins"
      ON public.daily_checkins FOR SELECT TO public
      USING (profile_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_checkins' AND policyname = 'Users can insert own daily_checkins'
  ) THEN
    CREATE POLICY "Users can insert own daily_checkins"
      ON public.daily_checkins FOR INSERT TO public
      WITH CHECK (profile_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_checkins' AND policyname = 'Users can update own daily_checkins'
  ) THEN
    CREATE POLICY "Users can update own daily_checkins"
      ON public.daily_checkins FOR UPDATE TO public
      USING (profile_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_checkins' AND policyname = 'Users can delete own daily_checkins'
  ) THEN
    CREATE POLICY "Users can delete own daily_checkins"
      ON public.daily_checkins FOR DELETE TO public
      USING (profile_id = auth.uid());
  END IF;
END $$;


-- 2. TABLA: journal_entries
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  prompt_type text NOT NULL CHECK (prompt_type IN ('manana', 'noche', 'libre')),
  mood text NULL,
  content text NOT NULL,
  is_sealed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en journal_entries
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para journal_entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'journal_entries' AND policyname = 'Users can view own journal_entries'
  ) THEN
    CREATE POLICY "Users can view own journal_entries"
      ON public.journal_entries FOR SELECT TO public
      USING (profile_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'journal_entries' AND policyname = 'Users can insert own journal_entries'
  ) THEN
    CREATE POLICY "Users can insert own journal_entries"
      ON public.journal_entries FOR INSERT TO public
      WITH CHECK (profile_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'journal_entries' AND policyname = 'Users can update own journal_entries'
  ) THEN
    CREATE POLICY "Users can update own journal_entries"
      ON public.journal_entries FOR UPDATE TO public
      USING (profile_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'journal_entries' AND policyname = 'Users can delete own journal_entries'
  ) THEN
    CREATE POLICY "Users can delete own journal_entries"
      ON public.journal_entries FOR DELETE TO public
      USING (profile_id = auth.uid());
  END IF;
END $$;


-- 3. TABLA: focus_sessions
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  duration_minutes int4 NOT NULL,
  label text NULL,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en focus_sessions
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para focus_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can view own focus_sessions'
  ) THEN
    CREATE POLICY "Users can view own focus_sessions"
      ON public.focus_sessions FOR SELECT TO public
      USING (profile_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can insert own focus_sessions'
  ) THEN
    CREATE POLICY "Users can insert own focus_sessions"
      ON public.focus_sessions FOR INSERT TO public
      WITH CHECK (profile_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can update own focus_sessions'
  ) THEN
    CREATE POLICY "Users can update own focus_sessions"
      ON public.focus_sessions FOR UPDATE TO public
      USING (profile_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can delete own focus_sessions'
  ) THEN
    CREATE POLICY "Users can delete own focus_sessions"
      ON public.focus_sessions FOR DELETE TO public
      USING (profile_id = auth.uid());
  END IF;
END $$;

