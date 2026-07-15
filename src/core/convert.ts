import { bsToEpochDay, epochDayToBs, adToEpochDay, epochDayToAd, BS_AD_OFFSET } from './epoch'

export function toBS(date: Date): { year: number; month: number; day: number } {
  const adEpoch = adToEpochDay(date)
  const bsEpoch = adEpoch + BS_AD_OFFSET
  return epochDayToBs(bsEpoch)
}

export function toAD(year: number, month: number, day: number): Date {
  const bsEpoch = bsToEpochDay(year, month, day)
  const adEpoch = bsEpoch - BS_AD_OFFSET
  return epochDayToAd(adEpoch)
}
