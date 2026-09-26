# Data Sources

## Provenance

The month-length data for BS years 2000–2090 in `bs-data.raw.json` is **built
directly from Hamro Patro (hamropatro.com)** as the primary reference, with a
single documented correction.

### 1. Hamro Patro (primary, all 91 years)

Fetched 2026-09-04 from `https://www.hamropatro.com/calendar/{Y}/{MM}` using
the Next.js RSC payload technique (header `RSC: 1` returns the flight payload
embedding three months of calendar data: `yearBs`, `monthBs`, `daysInMonth`,
and per-day AD↔BS records `year_ad`, `month_ad`, `day_ad`, `year_bs`,
`month_bs`, `day_bs`).

- Coverage: 1104 months, BS 2000-01 through 2091-12
- Each month record includes `daysInMonth`, `firstAD`, and `lastAD`
- The per-day AD records let us verify the chain continuously — every month's
  `firstAD` equals the previous month's `lastAD + 1` for all 1104 months
  (zero gaps, zero overlaps), so the served data is internally consistent.
- New Year anchors were additionally verified for every year 2000–2090.
- Snapshot shipped with the package:
  `scripts/reference/hamro-patro-months.json`

### 2. Corroborating datasets (independent extractions)

Used to confirm the Hamro data and to detect Hamro's one served error:

- **nepali-date-converter@3.4.0** (npm, `scripts/reference/ndc-months.json`)
  — month table 2000–2090.
- **nepali-datetime@2.0.0** (npm package `nepali-datetime` by ashesh,
  `scripts/reference/ndt-months.json`) — month table 2000–2099, anchored at
  AD 1943-04-14 = BS 2000/01/01, matching Hamro's firstAD for BS 2000-01.
- **bikrantj/nepali-calendar-scraper** (GitHub `data.json`, 2025 scrape of
  Hamro) — BS 2081–2089; agrees with our 2026 Hamro extraction on every
  overlapping month.

### Cross-source agreement summary

- 2000–2061: Hamro, NDC, and NDT agree on all month lengths.
- 2062: Hamro has Baishakh = 31, Jestha = 31; NDC/NDT have Baishakh = 30,
  Jestha = 32 (both 365-day years; from month 3 onward identical). Hamro's
  own per-day records place Jestha 1, 2062 on AD 2005-05-15, confirming
  Hamro's composition. **Adopted Hamro (Baishakh 31)** per the project rule
  that Hamro is the primary reference. Cumulative AD anchors are identical
  either way; only the month 1/2 split differs.
- 2084/2085: Hamro totals (365/366) differ from NDC/NDT (366/365) — the
  leap day falls in different years' Chaitra. **Adopted Hamro.** (These
  years are in the future relative to the data era; no authoritative
  declaration exists yet.)
- 2086/2089: totals equal; only intra-year composition differs between
  sources. **Adopted Hamro.**

### The one correction: BS 2087

Hamro Patro currently serves BS 2087 as a **367-day year**
(`[31,31,32,31,31,31,30,30,30,30,30,30]`). A 367-day BS year is impossible —
the BS calendar's leap adjustment works by adding a day to a month (making
some months 32 days), never by exceeding 366.

This was verified directly from the raw RSC payloads and independently
confirmed by the 2025 bikrantj scrape of the same source — the error is in
Hamro's served projection, not in our extraction.

**Correction applied:** Poush is shortened 30 → 29, giving 366 days
(`[31,31,32,31,31,31,30,30,29,30,30,30]`), matching NDC's row for 2087.
The New Year 2087 anchor (2030-04-14) is kept as Hamro serves it.

**Consequence:** years 2088–2090 in this package are shifted **one day
earlier** than Hamro's currently served calendar (e.g. New Year 2088 =
2031-04-15 here vs 2031-04-16 on hamropatro.com today). If Hamro corrects
their 2087 projection later, regenerate with `npm run build:data`.

## Reference Anchor

- BS 2080/01/01 (Nepali New Year 2080) = AD 2023-04-14
- BS 2000/01/01 = AD 1943-04-14 (chain start, matches all sources)

## Regeneration

```bash
npm run build:data     # raw.json -> bs-data.generated.ts
npx tsx scripts/verify-data.ts   # diff against reference fixtures
```

`scripts/build-data.ts` enforces 12 months per year, each 29–32 days, and
year totals of 365/366.

## Known Discrepancies (final)

| Year | Source difference | Chosen | Reason |
|------|-------------------|--------|--------|
| 2062 | Hamro `[31,31,...]` vs NDC/NDT `[30,32,...]` | Hamro | Primary reference; self-consistent per-day chain |
| 2084 | Hamro 365 vs NDC/NDT 366 | Hamro | Primary reference |
| 2085 | Hamro 366 vs NDC/NDT 365 | Hamro | Primary reference |
| 2087 | Hamro serves 367-day year (impossible) | 366 (Poush 30→29... see above: Mangsir 30→29) | Impossible year corrected; matches NDC |

## Important Note

BS month lengths are officially declared by Nepal's Calendar Determination
Committee (Panchanga Pramanik Samiti). Past years (through ~2083) match the
declared calendar; years beyond that are projections from the referenced
sources and may be revised. If you find discrepancies, please open an issue.

## Range

- **Supported range:** BS 2000–2090 (AD 1943-04-14 – 2034-04-13)
- **Total years:** 91
- **Total days:** 33,238
