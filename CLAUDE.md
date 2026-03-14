# ddgBooking — by fotonik

> Sistema di prenotazione appuntamenti per DDG Solutions.
> Un Calendly clone con CRM integrato, multi-agente, e API per AI agents.

## Quick Start

```bash
npm install
npx prisma db push
npm run db:seed          # Seeds with Diego's account + sample data
npm run dev              # Starts on http://localhost:3000
```

**Demo login:** `diego@ddg.solutions` / `ddg2026!`

## Architecture

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** SQLite via Prisma ORM (easily swappable to PostgreSQL for production)
- **Auth:** NextAuth.js v5 (Google OAuth + credentials)
- **Email:** Nodemailer (SMTP)
- **Calendar:** Google Calendar API + Google Meet

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/           # Login page
│   ├── (booking)/book/[slug]/  # Public booking page (Calendly-style)
│   ├── (dashboard)/dashboard/  # Admin dashboard
│   │   ├── calendar/           # Weekly calendar view
│   │   ├── crm/                # Contact management (pre/post sale)
│   │   ├── agents/             # Agent management + availability
│   │   ├── email-sequences/    # Email automation
│   │   └── settings/           # Booking links + API docs
│   ├── api/
│   │   ├── auth/               # NextAuth handlers
│   │   ├── agents/             # Agent CRUD
│   │   ├── availability/       # Availability calculation
│   │   ├── bookings/           # Booking CRUD
│   │   ├── booking-links/      # Booking link CRUD
│   │   ├── contacts/           # CRM contact CRUD
│   │   └── v1/                 # Public API for AI agents
│   │       ├── slots/          # GET suggested slots
│   │       └── book/           # POST create booking
│   └── privacy/                # GDPR privacy policy (Italian)
├── components/
│   ├── booking/                # Public booking UI components
│   └── dashboard/              # Dashboard shell + components
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── availability.ts         # Slot calculation + AI suggestions
│   ├── email.ts                # Email sending + templates
│   ├── google-calendar.ts      # Google Calendar + Meet integration
│   ├── prisma.ts               # Prisma client singleton
│   └── themes.ts               # Theme definitions
└── types/                      # TypeScript types
```

## Key Features

### 1. Multi-Agent Booking
One booking link hosts multiple agent calendars. The least busy agent in the next 7 days is shown first, with a switcher icon to change agents.

### 2. CRM (Pre/Post Sale)
- Contact management with stages: Lead → Prospect → Cliente → Perso
- Activity logging for every interaction
- Notes system for each contact
- Privacy consent tracking (GDPR)

### 3. AI Agent API (Plusvibe Integration)
Two endpoints designed for AI agent integration:

```bash
# Get suggested time slots with Italian messages
GET /api/v1/slots?slug=consulenza-energia&count=3

# Response:
{
  "suggestions": [
    {
      "message": "domani verso le 15:00 come suona?",
      "bookingUrl": "https://booking.ddg.solutions/book/consulenza-energia?agent=xxx&date=2026-03-14&time=15:00",
      "agentName": "Marco Rossi"
    }
  ]
}

# Create a booking programmatically
POST /api/v1/book
{
  "slug": "consulenza-energia",
  "agentId": "agent-marco",
  "startTime": "2026-03-14T14:00:00Z",
  "endTime": "2026-03-14T14:30:00Z",
  "guest": { "name": "Mario Rossi", "email": "mario@example.com" },
  "privacyConsent": true
}
```

### 4. Email Sequences
Automatic emails at key touchpoints:
- Booking confirmation (immediate)
- Reminders (24h and 1h before)
- Post-meeting follow-up (1h, 3 days, 7 days after)

### 5. Google Integration
- Google Calendar sync (reads busy times, creates events)
- Google Meet auto-generation for every booking
- Google autofill on booking forms (via HTML autocomplete attributes)

### 6. Themes
6 background themes: Classico, Oceano, Tramonto, Foresta, Notte, Energia DDG

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Database connection string |
| `AUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `SMTP_HOST` | SMTP server for emails |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app |

## Timezone

Everything defaults to **Europe/Rome** (Italy). The booking form, emails, and API responses all use Italian locale formatting.

## Target User

The UI is designed for **Italian professionals** (boomers demographic):
- Large, clear fonts and inputs (16px minimum, prevents iOS zoom)
- Simple navigation with Italian labels
- Big touch targets for mobile
- Minimal steps to book
- Google autofill to reduce friction

## Deployment

See DEPLOYMENT.md for production deployment instructions.

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:push      # Push schema changes to DB
npm run db:studio    # Open Prisma Studio (DB browser)
npm run db:seed      # Seed database with sample data
```

---

*Built with care by fotonik for DDG Solutions.*
