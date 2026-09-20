# SkillState production setup

## Supabase

1. In project `rrqfhnwnfjlrejbkbnjt`, review and run `supabase/skillstate/001_skillstate_production.sql` in the SQL Editor.
2. Keep the existing Google provider and add these redirect URLs to the Auth allow-list:
   - `https://sidbuilds.com/skillstate/auth/callback/`
   - `http://localhost:3000/skillstate/auth/callback/`
   - Add the same path for any alternate local port used during testing.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the browser build. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is supported only as a legacy fallback.

## Cloudflare Worker

The Worker name is `skillstate`; `wrangler.jsonc` owns only the `sidbuilds.com/skillstate*` route.

Set the public Supabase values as both Cloudflare build variables and runtime variables. Set these runtime secrets without committing their values:

```text
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
OPENAI_MINI_MODEL
OPENAI_REASONING_MODEL
```

Set these runtime variables:

```text
SKILLSTATE_AI_MODE=live
SKILLSTATE_AI_REQUEST_LIMIT_PER_HOUR=60
NEXT_PUBLIC_SUPABASE_URL=<existing project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<existing publishable key>
```

Build and preview with `npm run preview:cloudflare`. After credentials, SQL, Auth redirects, and variables are configured, deploy with `npm run deploy:cloudflare`.
