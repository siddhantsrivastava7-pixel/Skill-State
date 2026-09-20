# SkillState production SQL

This directory is intentionally separate from any existing Supabase migration history.

Apply `001_skillstate_production.sql` to project `rrqfhnwnfjlrejbkbnjt` through the Supabase SQL Editor after review. Do not run `supabase db push` from this repository against the shared project.

The script only creates or updates `skillstate_`-prefixed objects and their policies. It references the existing `public.profiles(id)` identity invariant without modifying that table.
