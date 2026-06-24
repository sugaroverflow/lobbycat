# Assumptions log — v0.7.2 polish + clarity

Per Fatima's rule (2026-06-24 21:09 UTC): don't pause for questions during the
v0.7.2 build. Make defensible assumptions, log them here with timestamp +
alternatives + "would change if", and ship. Sign-off answers Q1/Q2/Q3 are
already locked in REFACTOR-v0.7.2.md §11.

---

## Step 2 — Kill tags from dashboard rendering (2026-06-24 21:30 UTC)

### A2.1 — Dashboard cards didn't render tags in the first place; only `/companies/[slug]` did.

- **Assumed:** "Kill tags from dashboard rendering" in practice means the only
  surface left rendering `TagChip` was the company detail page (`/companies/[slug]`).
  A grep of `src/components` and `src/app` for `TagChip`, `tag-chip`, and
  `tags.map` confirms it. `DashboardCards` already doesn't render tag pills.
  There is no separate filter-chip toolbar with a tag filter to remove.
- **Alternatives:** I could have spent more time searching for indirect tag
  rendering (e.g. a custom hook surfacing tags into card bodies). I didn't see
  any, and Fatima's v0.7 ship already moved cards away from pills.
- **Would change if:** A subsequent click-through surfaces a tag pill somewhere
  I missed — I'd treat it as a step-2 follow-up commit, not a v0.8 thing.

### A2.2 — `TagChip` component file deleted now, not deferred.

- **Assumed:** With no remaining consumers, `src/components/tag-chip.tsx` is
  dead code; deleting it now keeps the v0.7.2 scope honest and avoids the file
  rotting through v0.8.
- **Alternatives:** Leave it as an orphan until v0.8's clarify work, in case
  we want to bring tag-style pills back. Per §3.1 the tag concept is dropping,
  so resurrection is unlikely.
- **Would change if:** v0.8 specifically wants pill-style chips for clarify
  cohorts — we can re-introduce a more general `<Chip>` component then.

### A2.3 — `companies.tags` JSONB + `tags`/`company_tags` lookup tables stay in DB.

- **Assumed:** Per §3.1 explicitly out of scope to remove. `lib/queries.ts`
  still returns `tags` in `getCompanyBySlug` for now; nothing consumes it on
  the page. No migration needed.
- **Alternatives:** Drop the `tags: companyTagList` field from the query
  return shape. Holding off to keep this commit focused on rendering and to
  avoid breaking anything that imports the type.
- **Would change if:** TypeScript build complains, or a v0.8 cleanup pass
  wants to prune the query surface — easy follow-up.

### A2.4 — `frames.kind === 'tag'` references in `frames-editor.tsx` and `actions.ts` are step-3 work, not step-2.

- **Assumed:** Step 2 is dashboard rendering only; step 3 explicitly says
  "Drop 'tag' AND 'question' frame kinds." Touching the frames editor here
  would muddle the commit.
- **Would change if:** Step 3 turns out to need a schema migration that has
  to land first — I'd reorder and call it out in the journal.

