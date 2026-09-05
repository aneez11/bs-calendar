import { bsToEpochDay, epochDayToBs, adToEpochDay, epochDayToAd, BS_AD_OFFSET } from './epoch'
import { BSInvalidDateError } from '../validate'

/** AD → BS. Uses the civil calendar date carried by `date` (UTC-midnight aware). */
export function toBS(date: Date): { year: number; month: number; day: number } {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new BSInvalidDateError(`Invalid AD date: ${String(date)}`)
  }
  const adEpoch = adToEpochDay(date)
  return epochDayToBs(adEpoch + BS_AD_OFFSET)
}

/** BS → AD. Returns a Date at UTC midnight — read with UTC getters (or formatBSDate). */
export function toAD(year: number, month: number, day: number): Date {
  const bsEpoch = bsToEpochDay(year, month, day)
  return epochDayToAd(bsEpoch - BS_AD_OFFSET)
}
