# Deploy LinguaDub in 6 steps

1. **Supabase:** use a new project or an existing one. LinguaDub keeps everything in its own `linguadub` schema and its own `linguadub-*` file buckets, so it does not touch other apps' tables, policies, users or files.
   In the SQL editor, run `supabase/migrations/0001_linguadub_schema.sql` (safe to run again).
   **Then expose the schema:** Project Settings > API (Data API) > **Exposed schemas**: add `linguadub`, and save. Without this the app cannot read its tables.
   Authentication > URL Configuration: set Site URL to your live domain and add `https://YOUR-DOMAIN/**` to Redirect URLs.
   Storage settings: raise the file size limit if you accept large videos.
2. **Vercel:** Add New Project, import this repository, choose the branch to publish.
3. **Environment variables** (Vercel > Settings > Environment Variables). Copy names from `.env.example`.
   Required: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `SELAR_WEBHOOK_SECRET`.
   For dubbing: `ELEVENLABS_API_KEY` (recommended), or `OPENAI_API_KEY` plus `DEEPL_API_KEY`.
4. **Deploy**, then open `https://YOUR-DOMAIN/api/health`. It must show `"ready": true`.
5. **Selar:** set the payment notification URL to `https://YOUR-DOMAIN/api/webhooks/selar?secret=YOUR_SELAR_WEBHOOK_SECRET`.
6. **Confirm plans** in `src/config/plans.ts` (names, prices, limits) against your Selar products.

Never paste secret keys into chat or commit them.
