# Contributing to Dawah Nigeria (Next.js)

Thank you for considering a contribution. This repository is the **Next.js
rewrite** of the web frontend for [dawahnigeria.com](https://dawahnigeria.com).
The API and the lecture content itself live elsewhere and are not part of this
repository.

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before taking part, and our
[Security Policy](SECURITY.md) if you have found a vulnerability (do not open a
public issue for those).

## Before you start

This app is **actively replacing** the CRA frontend at
[dawahnigeria-web](https://github.com/dawahanigeria-team/dawahnigeria-web), and
not every feature has been ported yet. Two consequences:

- A page that looks missing or half-built may simply not be ported yet rather
  than broken. Check the issues before filing.
- A bug affecting live users today probably needs fixing in `dawahnigeria-web`,
  not here. See
  [Which repository should I contribute to?](README.md#which-repository-should-i-contribute-to)

For anything larger than a small fix, **open an issue first**. Porting work is
coordinated, and it is easy to duplicate someone else's in-flight effort.

## Getting set up

You need **Node.js 22.13+** and **pnpm 11**. The repository pins pnpm via the
`packageManager` field — enable Corepack and it resolves automatically.

Node 22.13 is a hard floor: pnpm 11 uses `node:sqlite`, so anything older fails
with `ERR_UNKNOWN_BUILTIN_MODULE` before your code is even reached.

```bash
corepack enable
git clone https://github.com/dawahanigeria-team/dawahnigeria-next.git
cd dawahnigeria-next
pnpm install
cp .env.example .env.local
pnpm dev
```

The app runs at http://localhost:3000.

**Use pnpm, not npm or yarn.** The lockfile is `pnpm-lock.yaml`; installing with
another package manager produces a different dependency tree and a lockfile that
will be rejected in review.

### You must use port 3000

The API's CORS allowlist contains **`http://localhost:3000` exactly**. Any other
port — and even `http://127.0.0.1:3000` — is rejected, and every request fails in
the browser with a CORS error while the page shell still renders. If you see an
empty app with no content, check your port before anything else.

### About the API

`.env.example` points at the live production API. It is read-only for the
endpoints this app uses, so you can develop against it, but please avoid
hammering it — cache locally where you can, and never commit an `.env.local`
file.

## Before you open a pull request

Both of these run in CI and will fail the PR:

```bash
pnpm lint
pnpm typecheck
```

A production build is worth checking too, since some issues only surface there:

```bash
pnpm build
```

## Code conventions

- **TypeScript is strict.** Avoid `any`; prefer narrowing over casting.
- **Features own their code.** Put components, hooks, and server functions inside
  the relevant `src/features/<feature>/` directory rather than in global folders.
  Only genuinely shared things belong in `src/components/` or `src/lib/`.
- **Use semantic colour tokens** (`bg-background`, `text-foreground`,
  `text-muted-foreground`) rather than raw Tailwind palette colours, so light and
  dark themes both stay correct. `--muted` is a surface, `--muted-foreground` is
  text — never give them the same value.
- **Use named breakpoints only** (`mobile:`, `tab:`, `sm:`, `lg:` …). Arbitrary
  `min-[…]` / `max-[…]` variants are disabled project-wide by the `screens`
  config and compile to nothing without warning.
- **Match the surrounding code.** Comment density, naming, and file layout should
  look like the code already there.

### Commit messages

Write a short imperative subject line describing the change and, where it is not
obvious, a body explaining *why*. Reference the issue number when there is one.

## Pull requests

- Target the **`main`** branch.
- Keep pull requests focused — one concern per PR reviews far faster.
- Describe what changed and how you verified it. Screenshots are very helpful for
  UI changes; include **both light and dark mode** when you touch styling.
- Expect review comments. They are about the code, never about you.

## Reporting bugs

Open an issue with:

- What you expected and what happened instead
- Steps to reproduce, and the URL or route
- Browser and OS
- Whether it also happens on the live site at dawahnigeria.com — this tells us
  whether the bug is new to the rewrite or inherited

## Questions

If something in this guide is wrong or unclear, that is a bug too. Open an issue
and say so.
