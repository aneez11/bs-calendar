// GENERATED FILE — do not edit. Run `npm run build:data` to regenerate.

export const minYear = 2000 as const
export const maxYear = 2090 as const

export const referenceBS = {"year":2080,"month":1,"day":1} as const
export const referenceAD = '2023-04-14' as const

// Month lengths packed: char 'a'+(days-29) per month, 12 chars per year from 2000.
const PACKED = 'bdcdcbbbabacccdcccbababbccddcbbababbcdcdcbbbaabcbdcdcbbbabacccdcccbababbccddcbbababbcdcdcbbbaabccccdccabbaacccdcccbababbccddcbbababbcdcdcbbbaabccccdccabbabbccdcccbababbccddcbbababbcdcdcbbbaabccccdccabbabbccdcccbababbcdcdcbbababbcdcdcbbbabaccccdccbababbccdcccbababbcdcdcbbbaabbcdcdcbbbabaccccdccbababbccdcccbababbcdcdcbbbaabcbdcdcbbbabacccdcccbababbccdcdbbababbcdcdcbbbaabcbdcdcbbbabacccdcccbababbccddcbbababbcdcdcbbbaabcbdcdccabbaacccdcccbababbccddcbbababbcdcdcbbbaabccccdccabbabbccdcccbababbccddcbbababbcdcdcbbbaabccccdccabbabbccdcccbababbcdcdcbbababbcdcdcbbbaabccccdccbababbccdcccbababbcdcdcbbbaabbcdcdcbbbabaccccdccbababbccdcccbababbcdcdcbbbaabbcdcdcbbbabacccdcccbababbccdcdbbababbcdcdcbbbaabcbdcdcbbbabacccdcccbababbccddcbbababbcdcdcbbbaabccccdccababacccdcccbababbccddcbbababbcdcdcbbbaabccccdccabbaacccdcccbababbccddcbbababbcdcdcbbbaabccccdccabbabbccdcccbababbcdcdcbbababbcdcdcbbbaabccccdccbababbccdcccbababbcdcdcbbbaabbcdcdcbbbabaccccdccbababbccdcccbababbcdcdcbbbaabbcdcdcbbbabacccdcccbababbccdcccbababbccdccbbbabbbcdcdbcbbabbbbdcdcbbbabbbccdcccbbabbbbcddbcbbabbbbdcdcbbbabbbbdcdcbbbabbb'

function decodeMonthLengths(): Record<string, number[]> {
  const years: Record<string, number[]> = {}
  for (let y = minYear; y <= maxYear; y++) {
    const row: number[] = []
    for (let m = 0; m < 12; m++) {
      row.push(29 + (PACKED.charCodeAt((y - minYear) * 12 + m) - 97))
    }
    years[String(y)] = row
  }
  return years
}

export const monthLengths: Record<string, readonly number[]> = decodeMonthLengths()

export const yearTotals: Record<string, number> = (() => {
  const totals: Record<string, number> = {}
  for (let y = minYear; y <= maxYear; y++) {
    totals[String(y)] = monthLengths[String(y)]!.reduce((s, d) => s + d, 0)
  }
  return totals
})()

export const cumulativeOffsets: readonly number[] = [0,365,730,1095,1461,1826,2191,2556,2922,3287,3652,4017,4383,4748,5113,5478,5844,6209,6574,6939,7305,7670,8035,8400,8766,9131,9496,9862,10227,10592,10957,11323,11688,12053,12418,12784,13149,13514,13879,14245,14610,14975,15340,15706,16071,16436,16801,17167,17532,17897,18262,18628,18993,19358,19723,20089,20454,20819,21185,21550,21915,22280,22646,23011,23376,23741,24107,24472,24837,25202,25568,25933,26298,26663,27029,27394,27759,28124,28490,28855,29220,29585,29951,30316,30681,31046,31412,31777,32143,32508,32873,33238] as const
