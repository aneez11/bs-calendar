import { toBS } from './core/convert'
import { toDevanagariNumeral, nepaliMonthName } from './nepali'
import { monthName } from './format'

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

function applyTokens(template: string, tokens: Record<string, string>): string {
  const sorted = Object.keys(tokens).sort((a, b) => b.length - a.length)
  let result = template
  for (const key of sorted) {
    result = result.split(key).join(tokens[key]!)
  }
  return result
}

export function formatADDate(date: Date, format: string): string {
  return applyTokens(format, {
    'YYYY': String(date.getFullYear()),
    'YY': String(date.getFullYear()).slice(-2),
    'MM': pad(date.getMonth() + 1),
    'M': String(date.getMonth() + 1),
    'DD': pad(date.getDate()),
    'D': String(date.getDate()),
  })
}

export function formatBSDate(date: Date, format: string): string {
  const bs = toBS(date)
  return applyTokens(format, {
    'YYYY-NP': toDevanagariNumeral(bs.year),
    'YYYY': String(bs.year),
    'YY': String(bs.year).slice(-2),
    'MMMM-NP': nepaliMonthName(bs.month),
    'MMMM': monthName(bs.month),
    'MMM': monthName(bs.month).slice(0, 3),
    'MM': pad(bs.month),
    'M': String(bs.month),
    'DD-NP': toDevanagariNumeral(bs.day),
    'DD': pad(bs.day),
    'D-NP': toDevanagariNumeral(bs.day),
    'D': String(bs.day),
  })
}
