# try.wepp

**Pre-launch market validation playground.**
Post your idea before writing a single line of production code — get real pricing votes, feature requests, and community feedback from users.

> Live demo · [try.wepp.vercel.app](https://try.wepp.vercel.app) *(replace with your deployment URL)*

---

## Overview

try.wepp lets builders validate ideas before they build. Creators submit a project in 5 minutes and get a public community page. Visitors browse, vote on pricing plans, vote on features, and leave feedback — all tracked in a real-time analytics dashboard.

```
Explorer → browses /explore → clicks project → votes + leaves feedback
Creator  → submits project  → shares link    → reads analytics dashboard
```

---

## Features

- **Project submission wizard** — 4-step form: info → pricing → landing copy → launch
- **Community page** (`/[slug]`) — pricing vote, feature vote, threaded comments, waitlist signup
- **Explore grid** — browse all live projects by category with live search and filter
- **Analytics dashboard** — per-project or aggregate: daily visitors, pricing tier interest, feature vote breakdown
- **Notifications** — bell icon shows recent waitlist signups and comments
- **Google OAuth** — sign in with Google via Supabase Auth
- **Row-level security** — public reads, owner-only writes enforced at the DB layer

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router, React Server Components) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth & Database | Supabase (PostgreSQL + Auth + RLS) |
| Charts | Recharts |
| Icons | Lucide React |
| UI primitives | shadcn/ui |

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A Google Cloud OAuth 2.0 client (for Google login)

---

## Getting Started

```bash
# Clone and enter the app directory
git clone https://github.com/your-org/trywepp.git
cd trywepp/tryflow-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

```bash
# Start the development server
npm run dev
# → http://localhost:3000
```

---

## Database Setup

Run these SQL files **in order** in your Supabase SQL Editor:

```
db/schema.sql           # Core tables (experiments, waitlist_entries, click_events) + RLS policies
db/comments.sql         # Comments table with public insert/owner read RLS
db/add_fields.sql       # Adds category and maker_name columns to experiments
db/add_reply.sql        # Adds parent_id to comments (threaded replies)
db/add_project_url.sql  # Adds project_url column to experiments
db/migrate_categories.sql  # (If upgrading) Normalises legacy category names
db/seed.sql             # (Optional) Seeds 4 sample projects using the first signed-up user
```

### Google OAuth

1. Supabase Dashboard → **Authentication → Providers → Google** → Enable
2. Add your Google OAuth Client ID and Secret
3. In Google Cloud Console, add this to **Authorized redirect URIs**:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

---

## Project Structure

```
tryflow-app/
├── app/
│   ├── layout.tsx                    # Root layout — sidebar + auth check
│   ├── page.tsx                      # Marketing landing page
│   ├── explore/page.tsx              # Public project grid with search + category filter
│   ├── (auth)/                       # /login
│   ├── (dashboard)/                  # Auth-gated routes
│   │   ├── home/page.tsx             # Creator stats banner + explore grid
│   │   ├── dashboard/page.tsx        # Experiments table with action menu
│   │   ├── analytics/page.tsx        # Charts (supports ?project=<id> for per-project view)
│   │   └── settings/page.tsx         # Profile edit + preferences
│   └── (landing)/[slug]/page.tsx     # Public community page per project
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx               # Hover-expand sidebar, guest/auth nav variants
│   │   ├── TopBar.tsx                # Search, notifications, help, user avatar
│   │   └── NavigationProgress.tsx    # Top loading bar on route change
│   ├── landing/
│   │   ├── PricingVoteSection.tsx    # Vote on pricing plans, see live results
│   │   ├── FeatureVoteSection.tsx    # Vote on features
│   │   ├── CommentSection.tsx        # Threaded comments with inline replies
│   │   ├── PageViewTracker.tsx       # Fires page_view event on mount
│   │   ├── ShareButtons.tsx          # Copy link + Post on X
│   │   └── HeroSection.tsx           # Category-themed gradient hero
│   ├── explore/
│   │   ├── ProjectCard.tsx           # Card with category badge + pricing summary
│   │   └── ExploreGrid.tsx           # Client component with category filter state
│   ├── analytics/
│   │   ├── ProjectSelector.tsx       # Dropdown to filter analytics by project
│   │   ├── DailyVisitorsChart.tsx    # Recharts bar chart (last 14 days)
│   │   ├── PricingBreakdownChart.tsx
│   │   └── FeatureBreakdownChart.tsx
│   ├── dashboard/
│   │   ├── ExperimentActionsMenu.tsx # "..." dropdown: view, copy link, analytics, delete
│   │   ├── MyProjectsList.tsx        # Creator's project list
│   │   └── StatusBadge.tsx           # Clickable status pill (pause/resume/archive)
│   └── settings/
│       ├── ProfileForm.tsx           # Display name edit
│       └── PreferencesPanel.tsx      # Toggles persisted to localStorage
│
├── db/                               # SQL migration files (run in Supabase SQL Editor)
└── lib/
    ├── supabase/client.ts            # Browser Supabase client
    ├── supabase/server.ts            # Server Supabase client (SSR cookies)
    └── utils.ts
```

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/experiments` | List authenticated user's experiments |
| `POST` | `/api/experiments` | Create a new experiment (status: RUNNING) |
| `PATCH` | `/api/experiments/[id]` | Update status (pause/resume/archive) |
| `DELETE` | `/api/experiments/[id]` | Delete own experiment |
| `POST` | `/api/track` | Record a click/view event (public) |
| `POST` | `/api/waitlist` | Add email to waitlist (public) |
| `GET` | `/api/comments` | Fetch comments for an experiment |
| `POST` | `/api/comments` | Post a comment or reply |
| `GET` | `/api/search` | Search live projects by name (public) |
| `GET` | `/api/notifications` | Recent waitlist + comment activity for current user |

### Event types tracked via `/api/track`

| `event_type` | `metadata` | Trigger |
|---|---|---|
| `page_view` | `{}` | Community page mount (increments total_visitors) |
| `pricing_click` | `{ planName }` | Pricing section button click |
| `pricing_vote` | `{ planName }` | Community page plan vote |
| `feature_vote` | `{ featureId, featureTitle }` | Feature vote button |

---

## Categories

SaaS · Marketplace · Consumer · Dev Tools · Health · Education · Social · Other

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes
4. Open a pull request

---

## License

MIT
