# AIGen Hackathon Platform & Organizer Command Center

The official web platform and administrative control center for the **AI Generation Club** (Hawassa, Ethiopia) 5-day online hackathon.

---

## System Architecture

This repository is maintained as a monorepo housing both the participant-facing platform and the organizer evaluation center:

```
aigen-hawassa-hackathon/
├── app/                  # Participant Portal (Registration, Submissions, Announcements, Agenda)
├── components/           # Public Interface Components (Navigation, Countdown, Schedule, Cards)
├── public/               # Static assets & Official Club Brand Identity
├── admin/                # Organizer & Judge Command Center (Scoring matrices, broadcasts, passkeys)
│   ├── app/              # Administrative Dashboard UI & Rubric Engine
│   └── lib/              # Admin Supabase Database Client
├── .env.example          # Environment variable template
└── README.md
```

---

## Core Capabilities

### 1. Participant Platform (`/`)
- **Individual Competition Model**: Optimized registration and submission pipeline designed for individual participants.
- **5-Day Prompt Engineering Meta-Prompt**: Structured prompt intake capturing multi-day AI-assisted development workflows.
- **Submission Lifecycle & Deadline Enforcer**: Participants may update their project repositories and demo links continuously until the countdown deadline expires. Once expired, entries lock permanently against edits.
- **Dynamic Countdown & Live Schedule**: Synchronized directly with Supabase `event_settings`. Defaults to pending status until officially announced by event directors.
- **Organizers & Collaborators Roster**: Public directory recognizing leadership, mentorship, and operational partners in exact committee order.
- **Private Evaluation Flow**: Public leaderboard scores remain concealed to maintain competition integrity until the closing award ceremony.

### 2. Organizer & Judge Command Center (`/admin`)
- **Role-Based Passkey Authentication**:
  - **Judges**: Scoped exclusively to project evaluation across a 5-dimension rubric (Problem Solving, Technical Execution, AI Tool Adoption, Presentation, Innovation).
  - **Organizers**: Complete operational control over countdown timers, live schedule publication, announcement broadcasts, and committee roster management.
- **Live Passkey Security Management (`Access Passkeys 🔑`)**:
  - Organizers can view, reveal, and update both Organizer and Judge access passkeys directly from the dashboard.
  - Updates persist to Supabase `event_settings` in real time, propagating across all active sessions with zero code changes or redeployments required.
- **Operational Timeline & Schedule Management**:
  - Configurable submission deadlines with one-click presets (`+24h`, `+48h`, `+5 Days (120h)`, `+7 Days`, `Reset/Clear`).
  - Interactive agenda publisher supporting timeline events with real-time site updates.

---

## Local Development

### Prerequisites
- Node.js (v18.17+ or v20+)
- npm, pnpm, or yarn

### 1. Environment Setup
Create local configuration files using the provided template:

```bash
# Participant Portal (Root)
cp .env.example .env.local

# Organizer Portal (Admin)
cp .env.example admin/.env.local
```

Populate `.env.local` with your database credentials and optional initial access passkeys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
NEXT_PUBLIC_ADMIN_PASSKEY=your_private_organizer_passkey
NEXT_PUBLIC_JUDGE_PASSKEY=your_private_judge_passkey
```

### 2. Launching Services
Run the participant platform:
```bash
npm install
npm run dev
# Accessible at http://localhost:3000
```

In a separate terminal, launch the organizer command center:
```bash
cd admin
npm install
npm run dev -- -p 3001
# Accessible at http://localhost:3001
```

---

## Production Deployment

### Option 1: Vercel (Recommended for Next.js)

Vercel provides native SSR, automated branch previews, and serverless edge performance for both applications from this repository.

#### Deploy Participant Portal:
1. Connect your GitHub account on [vercel.com](https://vercel.com) and import `dagmawishigute3-oss/aigen-hawassa-hackathon`.
2. Configure **Root Directory** as `./`.
3. Add the Supabase environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
4. Select **Deploy**.

#### Deploy Organizer Command Center:
1. From the Vercel dashboard, click **Add New... > Project** and select `dagmawishigute3-oss/aigen-hawassa-hackathon`.
2. Under **Root Directory**, click **Edit** and set to `admin`.
3. Provide the same Supabase environment variables and optional initial passkeys.
4. Select **Deploy**.

---

### Option 2: GitHub Pages (Static Hosting via GitHub Actions)

For hosting entirely within GitHub's infrastructure using GitHub Pages:
1. Configure Next.js static export mode in `next.config.ts` (`output: 'export'`).
2. Navigate to repository **Settings > Pages** on GitHub.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. Enable the official **Next.js** deployment workflow.

---

## License & Organization

Maintained by the **AI Generation Club** — Hawassa, Ethiopia.
All rights reserved © 2026.
