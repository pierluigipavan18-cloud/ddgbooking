# Deployment Guide — ddgBooking

## Option 1: Vercel (Recommended — Easiest)

Vercel is the company behind Next.js and offers the smoothest deployment experience.

### Steps:

1. **Push to GitHub** (already done if you're reading this)

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "Import Project" → select this repo
   - Vercel auto-detects Next.js

3. **Set Environment Variables** in Vercel dashboard:
   ```
   DATABASE_URL=your-production-db-url
   AUTH_SECRET=generate-with-openssl-rand-base64-32
   AUTH_URL=https://ddgbooking.it
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   EMAIL_FROM=ddgBooking <noreply@ddg.solutions>
   NEXT_PUBLIC_APP_URL=https://ddgbooking.it
   NEXT_PUBLIC_APP_NAME=ddgBooking
   ```

4. **Database:** For production, switch from SQLite to PostgreSQL:
   - Use [Neon](https://neon.tech) (free tier available) or [Supabase](https://supabase.com)
   - Update `prisma/schema.prisma`: change `provider = "sqlite"` to `provider = "postgresql"`
   - Update `DATABASE_URL` to your PostgreSQL connection string
   - Run `npx prisma db push` to create tables

5. **Custom Domain:**
   - In Vercel → Settings → Domains → add `ddgbooking.it`
   - Point DNS CNAME to `cname.vercel-dns.com`

6. **Deploy!** Vercel auto-deploys on every push.

### Cost: Free tier handles ~100K requests/month

---

## Option 2: VPS (Hetzner / DigitalOcean)

More control, slightly more work.

### Steps:

1. **Get a VPS** (Hetzner CX22 = €4/month, or DigitalOcean $6/month)

2. **Install dependencies:**
   ```bash
   sudo apt update && sudo apt install -y nodejs npm nginx certbot
   ```

3. **Clone and build:**
   ```bash
   git clone https://github.com/your-repo/ddgbooking.git
   cd ddgbooking
   npm install
   cp .env.example .env
   # Edit .env with production values
   npx prisma db push
   npm run db:seed
   npm run build
   ```

4. **Run with PM2:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "ddgbooking" -- start
   pm2 save
   pm2 startup
   ```

5. **Nginx reverse proxy:**
   ```nginx
   server {
       server_name ddgbooking.it;
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

6. **SSL:**
   ```bash
   sudo certbot --nginx -d ddgbooking.it
   ```

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or use existing
3. Enable: Google Calendar API, Google People API
4. Go to "OAuth consent screen" → configure
5. Go to "Credentials" → "Create OAuth 2.0 Client ID"
   - Type: Web application
   - Authorized redirect URIs: `https://ddgbooking.it/api/auth/callback/google`
6. Copy Client ID and Client Secret to your `.env`

### Important scopes:
- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`

---

## Email Setup (Gmail)

1. Go to Google Account → Security → 2-Step Verification (enable it)
2. Go to App passwords → generate a new one for "ddgBooking"
3. Use these in `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=the-generated-app-password
   ```

---

## Production Checklist

- [ ] Switch from SQLite to PostgreSQL
- [ ] Set strong `AUTH_SECRET` (run: `openssl rand -base64 32`)
- [ ] Configure Google OAuth with production redirect URLs
- [ ] Set up SMTP for emails
- [ ] Change the seed user password
- [ ] Set `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Configure DNS for custom domain
- [ ] Enable SSL/HTTPS
- [ ] Set up backups for the database
- [ ] Test the booking flow end-to-end

---

*Built by fotonik for DDG Solutions*
