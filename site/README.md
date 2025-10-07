This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### PostgreSQL Setup (Recommended for Vercel)

This project uses Prisma. For production and Vercel deploys, switch to a hosted PostgreSQL database.

1. Update `prisma/schema.prisma` datasource to `provider = "postgresql"` (already done).
2. Create a Postgres database (e.g., Neon, Supabase, Railway).
3. Set `DATABASE_URL` locally in `.env.local` and in Vercel Project Settings → Environment Variables.
   - Example: `DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"`
4. Create tables in the new database:
   - `npx prisma generate`
   - `npx prisma db push` (initial push to a fresh Postgres DB)
5. Import initial data (optional):
   - `npx tsx prisma/import.ts` or run your seed scripts

Notes:
- Existing SQLite migrations are kept for local history. Use `db push` for the first Postgres setup, then start generating new migrations.
- Ensure other envs are set: `CLOUDINARY_*`, `RAZORPAY_*`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.

Vercel project settings:
- Framework preset: Next.js
- Root Directory: `site`
- Build Command: auto (`next build`)
- Output Directory: `.next`
