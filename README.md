# SearchSprout

AI-Powered Search and Discovery Platform for B2B SaaS.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- React 19
- Tailwind CSS 4
- Supabase (Auth + PostgreSQL + Storage)
- Recharts
- Lucide Icons

## Environment Variables

Create a `.env.local` file in the project root with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key     # optional, for AI Assistant
OPENAI_API_KEY=your_openai_api_key           # optional fallback
```

## Database Setup

Run `supabase/schema.sql` against your Supabase project to create all required tables with Row Level Security policies.

## Development

```bash
npm install
npm run dev
```

## Deployment

The app deploys to any platform that supports Next.js:

- Vercel: connect the GitHub repository and add environment variables
- Railway, Render, Fly.io: build command `npm run build`, start `npm start`

## Pricing

Payments are processed via Selar:

- Starter ($47/mo): https://selar.com/47plan?currency=USD
- Growth ($57/mo): https://selar.com/57plan?currency=USD
- Scale ($97/mo): https://selar.com/97plan?currency=USD
