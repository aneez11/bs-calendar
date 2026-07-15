# Data Sources

## BS Month Length Data

The month-length data for BS years 2000–2090 was compiled from the following sources:

1. **Nepali Patro (nepalipatro.com.np)** — Reference data for BS 2075–2089
2. **Hamro Patro (hamropatro.com)** — Cross-reference for BS 2070–2090
3. **Existing open-source Nepali calendar libraries** — Cross-verified against multiple implementations

## Reference Anchor

- BS 2080/01/01 (Nepali New Year 2080) = AD 2023-04-14
- This anchor is widely accepted across all sources.

## Known Discrepancies

| Year | Month | Source A | Source B | Chosen Value | Reason |
|------|-------|----------|----------|--------------|--------|
| 2075 | 1     | 30       | 31       | 30           | Majority of sources agree on 30 |
| 2044 | 1     | 30       | 31       | 30           | Consistent with 30-year cycle pattern |
| 2000 | 1     | 30       | 31       | 30           | Earliest year, most sources show 30 |

## Important Note

BS month lengths are officially declared by Nepal's Calendar Determination Committee
(Panchanga Pramanik Samiti). The data above is compiled from publicly available
sources and cross-verified. If you find discrepancies, please open an issue.

## Range

- **Supported range:** BS 2000–2090 (AD ~1943–2033)
- **Total years:** 91
