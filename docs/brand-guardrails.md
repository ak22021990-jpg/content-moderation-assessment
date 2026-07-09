# Brand Guardrails

> **⚠️ DISABLED — 2026-07-09**
>
> The brand-name guardrails described below are **no longer enforced**.
> The project owner explicitly accepted the legal risk and requested that
> Disney-related strings, characters, and iconography be allowed in the UI,
> code, and repository (see `06-06-PLAN.md` and `PROJECT.md` Key Decisions).
>
> The original forbidden-string list is preserved below for audit/reference
> purposes only.

## Purpose

This file previously defined the single source of truth for forbidden brand strings in this repository.
The pre-commit hook (`.husky/pre-commit`) and CI workflow (`.github/workflows/brand-guard.yml`)
used the grep pattern defined below. Any change to the pattern would have required updating all three
locations simultaneously.

Client brand identity must never appear in UI, code, meta tags, repo names, commit messages,
or any file tracked in this repository — **unless the project owner has explicitly disabled this guard**.

---

## Forbidden String Clusters (ARCHIVED)

### Primary Brand
- `disney`
- `disney+`

### Marvel
- `marvel`
- `spider-man`, `spiderman`
- `avengers`
- `iron man`, `ironman`
- `captain america`
- `thor` *(word-boundary anchored — see note below)*
- `black panther`
- `hulk`
- `wolverine`
- `x-men`

### Star Wars
- `star wars`, `starwars`
- `luke skywalker`
- `darth vader`
- `mandalorian`
- `jedi`
- `sith`
- `han solo`
- `chewbacca`
- `yoda`
- `lightsaber`

### Pixar
- `pixar`
- `toy story`, `toystory`
- `finding nemo`
- `wall-e`, `walle`
- `coco` *(word-boundary anchored — avoids false positive on npm package `picocolors`)*
- `buzz lightyear`
- `woody`
- `incredibles`

### Classic Disney
- `mickey mouse`
- `minnie mouse`
- `frozen` *(word-boundary anchored — see note below)*
- `moana`
- `encanto`
- `elsa`
- `anna`
- `simba`
- `lion king`
- `cinderella`
- `snow white`

### Streaming / Platforms
- `hulu`
- `espn+`

---

## Word-Boundary Note

`\bthor\b`, `\bfrozen\b`, and `\bcoco\b` use word-boundary anchors to reduce false positives:
- `\bthor\b` correctly ignores `author` — `u` before `t` is a word character, so `\b` does not match.
- `\bcoco\b` correctly ignores `picocolors` (npm package) — `i` before `c` is a word character, so `\b` does not match before `c` in `picocolors`.
- `\bfrozen\b` will still match `--frozen-lockfile` because `-` is a non-word character (both sides are word boundaries). This is an accepted limitation. Mitigated by: the pre-commit hook only scans staged diffs, not existing files; the CI scan excludes `package-lock.json`; this project uses `npm ci` not `--frozen-lockfile`. If a future config file requires that flag, add `--exclude` for that file in `brand-guard.yml`.

---

## Grep Pattern

The exact pattern used by the pre-commit hook and CI workflow (case-insensitive, `-iE` flag):

```
disney|disney\+|marvel|spider-man|spiderman|avengers|iron man|ironman|captain america|\bthor\b|black panther|hulk|wolverine|x-men|star wars|starwars|luke skywalker|darth vader|mandalorian|jedi|sith|han solo|chewbacca|yoda|lightsaber|pixar|toy story|toystory|finding nemo|wall-e|walle|\bcoco\b|buzz lightyear|woody|incredibles|mickey mouse|minnie mouse|\bfrozen\b|moana|encanto|elsa|anna|simba|lion king|cinderella|snow white|hulu|espn\+
```

---

## Scan Exclusions

The following paths are excluded from the brand-string scan because they legitimately reference the forbidden strings for meta purposes (documenting the guard system, describing forbidden clusters, or capturing internal planning context that never ships to users):

- `docs/brand-guardrails.md` — this file, which defines the forbidden clusters
- `.github/workflows/brand-guard.yml` — the CI scanner (contains the pattern)
- `.husky/pre-commit` — the local scanner (contains the pattern)
- `package-lock.json` — dependency graph, not authored content
- `.planning/**` — GSD planning artifacts (roadmap, requirements, phase plans, research). These docs discuss the brand-guard system itself and reference the working directory name; they are never bundled into `dist/` or served to candidates.

Both `.husky/pre-commit` and `.github/workflows/brand-guard.yml` must enforce these exclusions.

## Process for Updating

Guard is disabled. To re-enable:

1. Open a PR with the proposed change.
2. Get written legal/client approval.
3. Restore the scan in `.husky/pre-commit` AND `.github/workflows/brand-guard.yml` in the same commit.
4. Verify CI passes after the update.

When the guard was active, the pattern had to stay in sync across this file,
`.husky/pre-commit`, and `.github/workflows/brand-guard.yml`.
