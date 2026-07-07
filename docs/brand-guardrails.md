# Brand Guardrails

## Purpose

This file is the single source of truth for forbidden brand strings in this repository.
The pre-commit hook (`.husky/pre-commit`) and CI workflow (`.github/workflows/brand-guard.yml`)
both use the grep pattern defined below. Any change to the pattern must update all three
locations simultaneously.

Client brand identity must never appear in UI, code, meta tags, repo names, commit messages,
or any file tracked in this repository.

---

## Forbidden String Clusters

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
- `coco`
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

`\bthor\b` and `\bfrozen\b` use word-boundary anchors to reduce false positives:
- `\bthor\b` correctly ignores `author` — `u` before `t` is a word character, so `\b` does not match.
- `\bfrozen\b` will still match `--frozen-lockfile` because `-` is a non-word character (both sides are word boundaries). This is an accepted limitation. Mitigated by: the pre-commit hook only scans staged diffs, not existing files; the CI scan excludes `package-lock.json`; this project uses `npm ci` not `--frozen-lockfile`. If a future config file requires that flag, add `--exclude` for that file in `brand-guard.yml`.

---

## Grep Pattern

The exact pattern used by the pre-commit hook and CI workflow (case-insensitive, `-iE` flag):

```
disney|disney\+|marvel|spider-man|spiderman|avengers|iron man|ironman|captain america|\bthor\b|black panther|hulk|wolverine|x-men|star wars|starwars|luke skywalker|darth vader|mandalorian|jedi|sith|han solo|chewbacca|yoda|lightsaber|pixar|toy story|toystory|finding nemo|wall-e|walle|coco|buzz lightyear|woody|incredibles|mickey mouse|minnie mouse|\bfrozen\b|moana|encanto|elsa|anna|simba|lion king|cinderella|snow white|hulu|espn\+
```

---

## Process for Updating

1. Open a PR with the proposed change.
2. Get approval from the project lead.
3. Update the pattern in this file AND `.husky/pre-commit` AND `.github/workflows/brand-guard.yml` in the same commit.
4. Verify CI passes after the update.

Never update only one location — the three must always be in sync.
