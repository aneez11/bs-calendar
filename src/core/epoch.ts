import {
  monthLengths,
  cumulativeOffsets,
  minYear,
  maxYear,
  referenceBS,
  referenceAD,
} from '../data/bs-data.generated'

// Days since BS (minYear, 1, 1)
export function bsToEpochDay(year: number, month: number, day: number): number {
  if (year < minYear || year > maxYear) {
    throw new RangeError(`Year ${year} out of range [${minYear}, ${maxYear}]`)
  }
  if (month < 1 || month > 12) {
    throw new RangeError(`Month ${month} out of range [1, 12]`)
  }

  const months = monthLengths[String(year)]
  if (!months) throw new RangeError(`No data for year ${year}`)

  if (day < 1 || day > months[month - 1]!) {
    throw new RangeError(`Day ${day} out of range for BS ${year}/${month} (max ${months[month - 1]})`)
  }

  const yearIndex = year - minYear
  const offset = cumulativeOffsets[yearIndex] ?? 0

  let monthOffset = 0
  for (let m = 0; m < month - 1; m++) {
    monthOffset += months[m]!
  }

  return offset + monthOffset + (day - 1)
}

// Inverse — locate year, month, day from epoch day
export function epochDayToBs(epochDay: number): { year: number; month: number; day: number } {
  // Binary search for year
  let lo = 0
  let hi = cumulativeOffsets.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1
    if (cumulativeOffsets[mid]! <= epochDay) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }

  const year = minYear + lo
  const dayOfYear = epochDay - cumulativeOffsets[lo]!
  const months = monthLengths[String(year)]
  if (!months) throw new RangeError(`No data for year ${year}`)

  let remaining = dayOfYear
  let month = 0
  while (month < 12 && remaining >= months[month]!) {
    remaining -= months[month]!
    month++
  }

  if (month >= 12) {
    throw new RangeError(`Epoch day ${epochDay} out of range`)
  }

  return { year, month: month + 1, day: remaining + 1 }
}

// AD side
const refAdDate = new Date(referenceAD + 'T00:00:00.000Z')

export function adToEpochDay(date: Date): number {
  const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const refUtc = Date.UTC(refAdDate.getFullYear(), refAdDate.getMonth(), refAdDate.getDate())
  return Math.round((utc - refUtc) / 86400000)
}

export function epochDayToAd(epochDay: number): Date {
  const refUtc = Date.UTC(refAdDate.getFullYear(), refAdDate.getMonth(), refAdDate.getDate())
  return new Date(refUtc + epochDay * 86400000)
}

// Compute BS_AD_OFFSET — must come after adToEpochDay
export const BS_AD_OFFSET = bsToEpochDay(referenceBS.year, referenceBS.month, referenceBS.day) - adToEpochDay(refAdDate)
