# AIGen Hackathon Platform & Organizer Command Center

Official 5-day online hackathon platform built for the **AI Generation Club** (Hawassa, Ethiopia).

---

## Architecture Overview

This repository is structured as a monorepo containing both the public participant platform and the private organizer command center:

```
aigen-hawassa-hackathon/
├── app/                  # Public Participant Portal (Homepage, Submissions, Announcements, Schedule)
├── components/           # Public UI Components (Navbar, Countdown, Cards)
├── public/               # Public assets & AI Generation Club official logo
├── admin/                # Organizer & Judge Command Center (Scoring, Schedules, Passkeys, Collaborators)
│   ├── app/              # Admin console UI & Matrix evaluation engine
│   └── lib/              # Admin Supabase client
├── .env.example          # Template for required environment variables
└── README.md
```

---

## Features

### 1. Public Participant Portal (`/`)
- **Individual Competition**: Fast contestant registration and submission flow.
- **5-Day Journey Meta-Prompt**: Structured prompt intake detailing daily AI-augmented workflows.
- **Submission Editing & Deadline Lock**: Contestants can edit their project entries until the submission deadline expires. Once the deadline passes, submissions are locked.
- **Dynamic Countdown & Live Schedule**: Live sync with Supabase `event_settings` table. Defaults to pending state until set by organizers.
- **Dynamic Organizing Roster**: Real-time listing of core organizers and collaborators.
- **Private Evaluation Flow**: Public leaderboard rankings remain concealed until the official award ceremony.

### 2. Organizer & Judge Command Center (`/admin`)
- **Role-Based Passkey Authentication**:
  - **Judges**: Scoring-only access to review submissions and score on a 5-dimension rubric (Problem Solving, Technical Execution, AI Tool Adoption, Presentation, Innovation).
  - **Organizers**: Full administrative control to manage live countdowns, create online schedules, post announcements, and manage collaborators.
- **In-Dashboard Passkey Manager (Access Passkeys 🔑):
  - Organizers can view, reveal, and change both the Organizer passkey and Judge passkey live directly from the admin dashboard.
  - Changes are synced in real time via Supabase event_settings and take effect immediately across all devices with zero code redeployment needed.
- **Real-Time Event Control**:
  - Set custom deadlines or presets (`+24h`, `+48h`, `+5 Days (120h)`, `+7 Days`, `Reset/Clear`).
  - Add and delete interactive agenda items for the online schedule.
  - Dynamically manage displayed organizers and collaborators.

---

## Getting Started Locally

### Prerequisites
- Node.js (v18.17+ or v20+)
- npm / pnpm / yarn

### 1. Environment Configuration
Copy `.env.example` to `.env.local` in both the root directory and the `admin/` directory:

```bash
# Root directory (Public Portal)
cp .env.example .env.local

# Admin directory (Organizer Portal)
cp .env.example admin/.env.local
```

Fill in your Supabase project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

### 2. Run the Public Platform
```bash
npm install
npm run dev
# Running on http://localhost:3000
```

### 3. Run the Admin Command Center
In a separate terminal:
```bash
cd admin
npm install
npm run dev -- -p 3001
# Running on http://localhost:3001
```

---

## Deploying to Vercel (Free & Instant)

Deploy both websites in 2 minutes using Vercel from this single repository:

### Deploy App 1: Public Platform
1. Go to [vercel.com](https://vercel.com) and click **Add New... > Project**.
2. Select your repository `dagmawishigute3-oss/aigen-hawassa-hackathon`.
3. Set **Framework Preset** to `Next.js`.
4. Keep **Root Directory** as `./` (default).
5. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
6. Click **Deploy**.

### Deploy App 2: Organizer Command Center
1. On Vercel, click **Add New... > Project**.
2. Select the same repository `dagmawishigute3-oss/aigen-hawassa-hackathon`.
3. Set **Root Directory** to `admin` (click **Edit** next to Root Directory and select `admin`).
4. Under **Environment Variables**, add the same Supabase variables.
5. Click **Deploy**.
