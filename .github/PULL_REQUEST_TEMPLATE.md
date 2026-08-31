## What this changes

<!-- A short description of the change and why it is needed. -->

Closes #

## How I verified it

<!--
Describe what you actually ran or clicked, not just that it "works".
`pnpm lint` and `pnpm typecheck` both run in CI and will fail the PR.
-->

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] Checked the affected pages in the browser

## Screenshots

<!--
Required for anything visual.

- Include **both light and dark mode** — they use different tokens and a change
  that looks right in one is regularly wrong in the other.
- Include a **mobile-width** screenshot. Most of our users are on phones, so a
  desktop-only screenshot does not show what most people will see.

Delete this section for non-visual changes.
-->

| | Light | Dark |
| --- | --- | --- |
| Mobile | | |
| Desktop | | |

## Checklist

- [ ] The PR targets `main` and covers one concern.
- [ ] New code lives in the relevant `src/features/<feature>/` directory rather
      than in global `components/` or `lib/`, unless it is genuinely shared.
- [ ] Styling uses semantic tokens (`bg-background`, `text-muted-foreground`, …)
      rather than raw Tailwind palette colours.
- [ ] Styling uses **named** breakpoints (`mobile:`, `tab:`, `sm:`, `lg:` …).
      Arbitrary `min-[…]` / `max-[…]` variants are disabled project-wide by the
      `screens` config and silently compile to nothing.
- [ ] No secrets, tokens or `.env.local` contents are included in this diff.
