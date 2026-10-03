<div align="center">

# 🥗 NutriGen — Daily Plate Perfect

**A mobile-first meal planner that personalises your day around your goals, your diet and your schedule.**

[![Live demo](https://img.shields.io/badge/Live%20demo-nutri--gen--app.lovable.app-F97316?style=for-the-badge)](https://nutri-gen-app.lovable.app)

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)
![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-8B5CF6)

<img src="docs/screenshots/welcome.jpg" alt="NutriGen welcome screen" width="260" />
&nbsp;&nbsp;
<img src="docs/screenshots/sign-in.jpg" alt="NutriGen sign-in screen" width="260" />

</div>

---

## Why NutriGen?

Most calorie trackers feel like spreadsheets. NutriGen is designed the other way round: a clean, friendly, Gen Z–oriented app that works on any device and bends around how *you* eat, with flexible meal times, dietary preferences, health goals and a pantry that helps decide what to cook.

> **Project status: working prototype.** Authentication, onboarding and profile/preferences are fully wired to a real backend. The dashboard, meal suggestions, pantry and history screens currently run on built-in sample data, and AI-generated suggestions are on the roadmap. See [Roadmap](#roadmap).

## Features

**Live today**

- 🔐 **Email sign-up and sign-in** with session persistence (Supabase Auth)
- 🧭 **Guided onboarding** in four steps: health goal, dietary preferences, meal times, then a personalised start
- 👤 **Profile and preferences** saved per user: height, weight, activity level, dietary preferences, and flexible breakfast / lunch / dinner times
- 🎁 **20-day free trial** started automatically at sign-up, with a welcome pop-up that explains it
- ✨ **Polished UX**: animated splash screen, smooth page transitions (Framer Motion), bottom navigation, responsive layout

**Prototype screens (sample data)**

- 📊 **Dashboard**: calorie ring, macro cards (protein / carbs / fats), water tracker, streak banner
- 🍽️ **Meals**: search and filter meal ideas by meal type and difficulty, with recipe detail sheets
- 🥕 **Pantry**: track ingredients by category with expiry-date warnings
- 🕘 **Meal history**: review what you've logged
- ⚙️ **Preferences**: toggles such as *AI meals from pantry* and *budget-friendly meals*

## How it works

```
Splash ─▶ Welcome pop-up ─▶ Sign up / Sign in ─▶ Onboarding (4 steps) ─▶ App
                                                                          │
                          Dashboard · Meals · Pantry · Profile ◀──────────┘
```

Routes are protected: signed-out visitors are sent to `/auth`, and signed-in users who haven't finished onboarding are sent to `/onboarding` before they can reach the app.

## Tech stack

| Layer | Tools |
| --- | --- |
| Framework | React 18, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui (Radix UI), Lucide icons |
| Motion | Framer Motion |
| Data / state | TanStack Query, React Hook Form + Zod |
| Backend | Supabase (Postgres, Auth, Row Level Security) |
| Tooling | ESLint, Vitest, bun / npm |

## Data model

Defined in [`supabase/migrations`](supabase/migrations). Row Level Security is enabled on every table, so each user can only read and write their own rows.

| Table | Purpose |
| --- | --- |
| `profiles` | Body stats, goal, diet, allergies, meal times, calorie target, trial and onboarding state. Created automatically by a database trigger at sign-up. |
| `pantry_items` | Ingredients with category, quantity, unit and expiry date |
| `meal_logs` | Logged meals with calories and macros |
| `health_streaks` | Logging, calorie-goal, water and exercise streaks |

## Getting started

**Prerequisites:** Node.js 18+ (or bun) and a free [Supabase](https://supabase.com) project.

```bash
# 1. Clone and install
git clone https://github.com/Himanshu-moderator/nutri-gen-app.git
cd nutri-gen-app
npm install            # or: bun install

# 2. Configure environment (see below)
cp .env.example .env

# 3. Run
npm run dev            # http://localhost:8080
```

**Environment variables** (from your Supabase project's *Settings → API*):

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-public-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>
```

Apply the schema from `supabase/migrations/*.sql` (via the Supabase SQL editor or `supabase db push`) so the tables, policies and sign-up trigger exist.

**Scripts**

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint the codebase |
| `npm test` | Run unit tests |

## Project structure

```
src/
├── pages/         Auth, Onboarding, Dashboard, Meals, Pantry, Profile, Preferences…
├── components/    CalorieRing, MacroCard, MealCard, TrialPopup, SplashScreen, ui/ (shadcn)
├── contexts/      AuthContext (Supabase session)
├── hooks/         useProfile, use-toast, use-mobile
├── integrations/  Supabase client and generated types
└── data/          Sample recipes used by the prototype screens
supabase/          Migrations and config
```

## Roadmap

- [ ] Persist pantry items, meal logs and streaks to Supabase (the tables already exist)
- [ ] AI meal suggestions based on pantry contents, goals and preferences
- [ ] Real nutrition data per serving instead of sample values
- [ ] Allergy selection in onboarding and preferences (the column already exists)
- [ ] Reminders and notifications around each user's meal times
- [ ] Subscription flow after the 20-day trial
- [ ] Google sign-in and password reset

## About

Designed and built by **[Himanshu Chatterjee](https://github.com/Himanshu-moderator)** as part of a move into product management: from the product brief and feature scoping to the UX flows and the working app. Prototyped with [Lovable](https://lovable.dev).

Feedback and ideas are welcome — open an issue.
