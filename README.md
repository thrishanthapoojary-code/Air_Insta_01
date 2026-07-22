# Air Insta

A modern, Instagram-style social web app built with React, TypeScript, Tailwind CSS, and Supabase (Postgres + Auth + Realtime).

## Features

- **Auth** — email/password sign-up & sign-in (Supabase Auth)
- **Feed** — infinite-scroll home feed with cached like/save state
- **Posts** — image posts with captions, hashtags, and location tagging
- **Stories** — 24-hour disappearing stories with a full-screen viewer and progress bars
- **Likes / Comments / Save / Share** — with optimistic UI and double-tap-to-like
- **Explore** — trending posts grid + suggested users to follow
- **Search** — search users and hashtags
- **Notifications** — like/comment/follow notifications with realtime unread badge
- **Direct Messaging** — 1-to-1 conversations with realtime message delivery
- **Profiles** — bio, avatar, posts grid, saved tab, followers/following lists, edit profile
- **Dark / Light mode** — persisted, system-aware toggle
- **Responsive** — desktop sidebar + mobile bottom nav

## Tech Stack

| Layer      | Choice                                   |
| ---------- | ---------------------------------------- |
| Frontend   | React 18 + TypeScript + Vite             |
| Styling    | Tailwind CSS (CSS-variable theming)      |
| Icons      | lucide-react                             |
| Backend    | Supabase (Postgres + Auth + Realtime)    |
| Database   | PostgreSQL with Row Level Security       |

## Getting Started

The dev server runs automatically in this environment. To run locally:

```bash
npm install
npm run dev      # start Vite dev server
npm run build    # production build
npm run typecheck
```

Supabase credentials are pre-populated in `.env`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Demo Accounts

Seeded for testing (password for all: `AirInsta2024!Secure`):

| Username | Email                |
| -------- | -------------------- |
| maya     | maya@airinsta.dev    |
| leo      | leo@airinsta.dev     |
| aria     | aria@airinsta.dev    |
| kai      | kai@airinsta.dev     |
| nova     | nova@airinsta.dev    |

Each user has posts, a story, and cross-follows the others. Sign in as one of them to see a populated feed, or create a new account from the sign-up screen.

## Seeding

```bash
set -a; . ./.env; set +a
node scripts/seed.mts
```

The seed script is idempotent — it signs up demo users (or signs in if they exist), creates posts/stories, and sets up cross-follows.

## Project Structure

```
src/
  components/    Avatar, Modal, PostCard, StoriesBar, StoryViewer, Sidebar, CreatePostModal, PostDetailModal
  context/       AuthContext, ThemeContext
  lib/           supabase client, posts, profiles, stories, messaging, notifications, utils
  screens/       AuthScreen, Feed, Explore, Notifications, Messages, Profile, SearchScreen
  types/         shared TypeScript types
scripts/seed.mts  demo data seeder
```

## Database

All tables use Row Level Security scoped to `authenticated` users. Counter columns (likes, comments, followers, posts) are maintained by Postgres triggers for accuracy. Realtime is enabled on all tables via the `supabase_realtime` publication.

## Notes

- Stock photos are sourced from Pexels (referenced by URL, not downloaded).
- Media uploads in the create flow use Pexels stock URLs for the demo; a production deployment would wire Supabase Storage for user uploads.
