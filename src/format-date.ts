import { toBS } from './core/convert'
import { toDevanagariNumeral, nepaliMonthName } from './nepali'
import { monthName } from './format'
import { EN_MONTH_NAMES } from './grid'

export type DateFormatToken =
  | 'YYYY' | 'YY'
  | 'MM' | 'M'
  | 'DD' | 'D'
  | 'MMMM' | 'MMM'
  | 'MMMM-NP'
  | 'DD-NP' | 'D-NP'
  | 'YYYY-NP'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Replace longest tokens first so `MM` inside an already-substituted value can
 * never be re-replaced. Uses a single-pass regex over a token alternation so
 * substituted text (e.g. Devanagari or month names) is never rescanned.
 */
function applyTokens(template: string, tokens: Record<string, string>): string {
  const keys = Object.keys(tokens).sort((a, b) => b.length - a.length)
  if (keys.length === 0) return template
  const re = new RegExp(keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g')
  return template.replace(re, matched => tokens[matched]!)
}

export function formatADDate(date: Date, format: string): string {
  const { year, month, day } = {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  }
  const monthEn = EN_MONTH_NAMES[month - 1]!
  return applyTokens(format, {
    'YYYY': String(year),
    'YY': String(year).slice(-2),
    'MMMM': monthEn,
    'MMM': monthEn.slice(0, 3),
    'MM': pad(month),
    'M': String(month),
    'DD': pad(day),
    'D': String(day),
  })
}

export function formatBSDate(date: Date, format: string): string {
  const { year, month, day } = toBS(date)
  const monthEn = monthName(month)
  return applyTokens(format, {
    'YYYY-NP': toDevanagariNumeral(year),
    'YYYY': String(year),
    'YY': String(year).slice(-2),
    'MMMM-NP': nepaliMonthName(month),
    'MMMM': monthEn,
    // BS abbreviations are 4 chars, not 3: 'Ashad' and 'Ashwin' would both
    // collapse to 'Ash' at 3, so BS MMM is intentionally wider than AD MMM.
    'MMM': monthEn.slice(0, 4),
    'MM': pad(month),
    'M': String(month),
    'DD-NP': toDevanagariNumeral(day),
    'DD': pad(day),
    'D-NP': toDevanagariNumeral(day),
    'D': String(day),
  })
}
