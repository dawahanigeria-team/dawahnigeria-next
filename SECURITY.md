# Security Policy

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security problems.**

Report vulnerabilities privately to **server@dawahnigeria.com**, or through
GitHub's [private vulnerability reporting](https://github.com/dawahanigeria-team/dawahnigeria-next/security/advisories/new)
on this repository.

Please include:

- What the issue is and where in the codebase it lives
- Steps to reproduce it, or a proof of concept
- What an attacker could do with it

### What to expect

- **Acknowledgement** within 3 working days
- **An assessment** (accepted / not applicable / needs more information) within 10 working days
- Updates at least every 14 days while we work on a fix
- Credit in the release notes once a fix ships, unless you would rather stay anonymous

## Scope

This repository holds the **Next.js web frontend only**. Reports about the
following are in scope:

- Cross-site scripting, injection, or unsafe rendering of API data
- Authentication or session handling flaws — including the session refresh in
  `custom-worker.ts` and the route handlers under `src/app/api/`
- Server-side request forgery or data leakage through Server Components, server
  actions, or route handlers
- Exposure of secrets or user data through the built bundle, source maps, or the
  deployed Worker
- Dependency vulnerabilities that are actually reachable from this application

Out of scope:

- The backend API (`api.dawahnigeria.com`) and its data — report those to the
  same address, but note that this repository is not where they are fixed
- Media hosted on `media.dawahnigeria.com`
- The CRA frontend at
  [dawahnigeria-web](https://github.com/dawahanigeria-team/dawahnigeria-web) —
  report those on that repository
- Findings from automated scanners with no demonstrated impact
- Missing hardening headers on third-party domains we do not control

### A note on public values

Some values in this repository look like secrets but are not, and reports about
them will be closed as out of scope:

- `API_PROJECT_ID` — a public API header, also shipped in the mobile app
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — an OAuth **client** id, public by design
- `NEXT_PUBLIC_SENTRY_DSN` / `NEXT_PUBLIC_POSTHOG_KEY` — browser-side keys,
  intended to ship in the client bundle

Anything prefixed `NEXT_PUBLIC_` is, by definition, in the client bundle. Real
secrets live in Cloudflare Worker secrets and GitHub Actions secrets, never in
this repository.

## Supported versions

Only the current `main` branch receives security fixes. There are no long-lived
release branches.
