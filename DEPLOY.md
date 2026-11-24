# Deploy Revenue AI

1. **Supabase (existing project is fine).** Revenue AI uses its own `revenue_ai` schema and `revenue-ai-files` bucket, so it will not touch other apps' tables.
   - SQL editor: paste and run `supabase/migrations/0001_revenue_ai_schema.sql` (safe to re run).
   - Project Settings > API > **Exposed schemas**: add `revenue_ai` and save. Without this the app cannot read its tables.
   - Authentication > URL Configuration: set Site URL to your live domain and add `https://YOUR-DOMAIN/**` to Redirect URLs.
   - Keep **Confirm email** on and configure SMTP for production email.
2. **Vercel:** import the repository and choose the branch to publish.
3. **Environment variables** (names in `.env.example`). Required: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `INTEGRATION_ENCRYPTION_KEY`, `SELAR_WEBHOOK_SECRET`. For AI: `ANTHROPIC_API_KEY`.
4. Deploy, then open `https://YOUR-DOMAIN/api/health`. It must show `"ready": true`.
5. **Selar:** set the payment notification URL to `https://YOUR-DOMAIN/api/webhooks/selar?secret=YOUR_SELAR_WEBHOOK_SECRET`.
6. Sign up, verify your email, then on the Overview page use **Load example data** to explore, and **Remove example data** when finished.

Plan names, prices and limits are in `src/config/plans.ts`. Never paste secret keys into chat or commit them.
