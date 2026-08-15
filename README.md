# Dawah Nigeria — Next.js

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

The Next.js rewrite of the web frontend for
[dawahnigeria.com](https://dawahnigeria.com) — discovering and listening to
Islamic lectures.

This repository contains **the frontend only**. The API it reads from, and the
lecture audio itself, are not part of this repository.

> **Status: work in progress.** This app is replacing the React (CRA) frontend at
> [dawahnigeria-web](https://github.com/dawahanigeria-team/dawahnigeria-web).
> Not every feature has been ported yet. Until the switch happens,
> `dawahnigeria.com` is still served by the CRA app — see
> [Which repository should I contribute to?](#which-repository-should-i-contribute-to)

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router) with [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/) in strict mode
- [Zustand](https://zustand.docs.pmnd.rs/) for client state
- [TanStack Query](https://tanstack.com/query) for server state
- [Tailwind CSS](https://tailwindcss.com/) for styling
- Deployed to [Cloudflare Workers](https://workers.cloudflare.com/) via [OpenNext](https://opennext.js.org/cloudflare)
- Sentry, PostHog and Tawk.to for monitoring, analytics and support chat

## Getting started

You need **Node.js 22.13+** and **pnpm 11**. The repository pins pnpm through the
`packageManager` field, so [Corepack](https://nodejs.org/api/corepack.html) will
select the right version automatically.

> Node 22.13 is a hard floor, not a suggestion — pnpm 11 uses `node:sqlite`, so
> on Node 20 it dies with `ERR_UNKNOWN_BUILTIN_MODULE: No such built-in module:
> node:sqlite` before it gets anywhere near your code.

```bash
corepack enable
git clone https://github.com/dawahanigeria-team/dawahnigeria-next.git
cd dawahnigeria-next
pnpm install
cp .env.example .env.local
pnpm dev
```

The development server runs at http://localhost:3000.

`.env.example` points at the live production API, which is read-only for the
endpoints this app uses. Copy it as-is to get running — the analytics and error
reporting keys are all optional and the app works with them blank.

> **The dev server must run on port 3000.** The API's CORS allowlist contains
> `http://localhost:3000` exactly — other ports, and `127.0.0.1`, are rejected.
> On a different port the page shell renders but no content loads, which looks
> like a broken app rather than a CORS problem. Check your port first.

### Environment files

Next loads these in order of increasing precedence, and this repository uses all
of them deliberately:

| File | Loaded by | Committed |
| --- | --- | --- |
| `.env.development` | `pnpm dev` | Yes — holds no secrets |
| `.env.production` | production builds and the Worker | Yes — holds no secrets |
| `.env.local` | everything except tests, wins over the above | **No** — this is your file |
| `.dev.vars` | `wrangler dev` / `cf:preview` only | **No** |

Put your own values in `.env.local`. It is gitignored and always takes
precedence.

### Available scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the development server on port 3000 |
| `pnpm build` | Production build |
| `pnpm start` | Serve a production build locally |
| `pnpm lint` | ESLint over the repository |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm cf:preview` | Build and preview the Cloudflare Worker locally |
| `pnpm cf:deploy` | Build and deploy the Worker (maintainers only) |

Run `pnpm lint` and `pnpm typecheck` before opening a pull request — CI runs both
and will fail the PR otherwise.

## Project structure

```
src/
├── app/            # App Router routes
│   ├── api/        # Route handlers
│   ├── auth/       # Sign in / sign up
│   └── dawahcast/  # The main application surface
├── components/     # Shared presentational components
├── features/       # Feature modules — the bulk of the code
│   ├── auth/       favorites/   player/
│   ├── account/    leaderboard/ search/
│   ├── analytics/  library/     subscription/
│   ├── chat/       comments/    dawahcast/
└── lib/            # Routes, formatters, API client, shared helpers
```

Feature modules are the unit of organisation: a feature owns its components,
hooks, and server functions rather than scattering them across global
`components/` and `hooks/` folders.

## Theming

Colours are CSS custom properties in `src/app/globals.css`, exposed to Tailwind
as semantic tokens in `tailwind.config.ts`. Light and dark values live in
`:root` and `.dark` respectively.

Use the semantic tokens (`bg-background`, `text-foreground`, `bg-muted`,
`text-muted-foreground`) rather than raw Tailwind palette colours, so both
themes stay correct. Note the pairing rule: `--muted` is a **surface** and
`--muted-foreground` is **text** — they move in opposite directions between the
two themes and must never be given the same value.

> **A trap worth knowing about:** `tailwind.config.ts` defines `screens` with
> object values (`{ max: "615px" }`). That disables Tailwind's arbitrary
> `min-[…]` / `max-[…]` variants for the whole project — they compile to
> nothing, silently, with no error. Always use a **named** breakpoint
> (`mobile:`, `tab:`, `sm:`, `lg:` …). If a responsive style seems to be
> ignored, this is almost certainly why.

## Deployment

The app runs on Cloudflare Workers, built with OpenNext. `wrangler.jsonc` holds
the Worker configuration; `custom-worker.ts` wraps the generated handler to
refresh sessions before the Next server boots.

Deployment is handled by maintainers. Contributors do not need Cloudflare
credentials for anything in this repository.

## Which repository should I contribute to?

There are two public frontends and they are not interchangeable:

- **[dawahnigeria-web](https://github.com/dawahanigeria-team/dawahnigeria-web)**
  — the React/CRA app currently serving dawahnigeria.com. Bug fixes affecting
  live users go here.
- **dawahnigeria-next** (this repository) — the Next.js rewrite that will
  replace it. New features and porting work go here.

If you are unsure, open an issue and ask before starting — we would rather point
you at the right one than have you build something twice.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please also read our
[Code of Conduct](CODE_OF_CONDUCT.md), and our
[Security Policy](SECURITY.md) if you have found a vulnerability — do not open a
public issue for those.

## License

[Apache-2.0](LICENSE).
