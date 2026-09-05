// Fetch Hamro Patro calendar RSC payloads and extract authoritative month data.
// Each /calendar/{Y}/{M} RSC payload embeds 3 months: prev, current, next.
// We fetch M in {1,4,7,10} per year to cover all 12 months, extracting:
//  - daysInMonth per (yearBs, monthBs)
//  - AD date of each month's first day (from day records, day_bs === 1)
//  - AD date of each month's last day (day_bs === daysInMonth)
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'hamro-ref');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const YEARS = [];
const startYear = parseInt(process.argv[2] || '2000', 10);
const endYear = parseInt(process.argv[3] || '2090', 10);
for (let y = startYear; y <= endYear; y++) YEARS.push(y);
const MONTHS = [1, 4, 7, 10];

const monthRe = /\{"yearBs":(\d+),"monthBs":(\d+),[^{]*?"daysInMonth":(\d+)/g;
const dayRe = /"year_ad":(\d+),"month_ad":(\d+),"day_ad":(\d+),"year_bs":(\d+),"month_bs":(\d+),"day_bs":(\d+)/g;

function parsePayload(text) {
  const months = new Map(); // 'Y-M' -> {dim, firstAD, lastAD}
  let m;
  while ((m = monthRe.exec(text))) {
    const key = `${m[1]}-${m[2]}`;
    if (!months.has(key)) months.set(key, { dim: +m[3], firstAD: null, lastAD: null });
    else months.get(key).dim = +m[3]; // keep latest
  }
  let d;
  while ((d = dayRe.exec(text))) {
    const key = `${d[4]}-${d[5]}`;
    const rec = months.get(key);
    if (!rec) continue;
    const bs = +d[6];
    const ad = `${d[1]}-${String(d[2]).padStart(2, '0')}-${String(d[3]).padStart(2, '0')}`;
    if (bs === 1) rec.firstAD = ad;
    if (bs === rec.dim) rec.lastAD = ad;
  }
  return months;
}

async function fetchOne(y, mo, attempt = 0) {
  const url = `https://www.hamropatro.com/calendar/${y}/${String(mo).padStart(2, '0')}`;
  const cache = path.join(OUT, `rsc-${y}-${String(mo).padStart(2, '0')}.txt`);
  if (fs.existsSync(cache)) {
    return parsePayload(fs.readFileSync(cache, 'utf8'));
  }
  try {
    const r = await fetch(url, { headers: { RSC: '1', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    if (r.status !== 200) throw new Error('HTTP ' + r.status);
    const t = await r.text();
    fs.writeFileSync(cache, t);
    const parsed = parsePayload(t);
    if (parsed.size === 0) throw new Error('no months parsed');
    return parsed;
  } catch (e) {
    if (attempt < 3) {
      await new Promise(res => setTimeout(res, 1500 * (attempt + 1)));
      return fetchOne(y, mo, attempt + 1);
    }
    throw e;
  }
}

async function main() {
  const result = { source: 'hamropatro.com calendar RSC payloads', fetched: new Date().toISOString(), months: {} };
  let done = 0;
  const jobs = [];
  const queue = [];
  for (const y of YEARS) for (const mo of MONTHS) queue.push([y, mo]);

  const workers = Array.from({ length: 5 }, async () => {
    while (queue.length) {
      const [y, mo] = queue.shift();
      try {
        const months = await fetchOne(y, mo);
        for (const [key, rec] of months) {
          if (result.months[key] && result.months[key].dim !== rec.dim) {
            console.error(`CONFLICT ${key}: ${result.months[key].dim} vs ${rec.dim}`);
          }
          result.months[key] = rec;
        }
      } catch (e) {
        console.error(`FAIL ${y}/${mo}: ${e.message}`);
      }
      done++;
      if (done % 20 === 0) console.log(`progress ${done}/${YEARS.length * MONTHS.length}`);
      await new Promise(res => setTimeout(res, 250));
    }
  });
  await Promise.all(jobs.concat(workers));

  const out = path.join(__dirname, 'hamro-months.json');
  fs.writeFileSync(out, JSON.stringify(result, null, 1));
  const keys = Object.keys(result.months);
  console.log(`Saved ${keys.length} months to ${out}`);
  const missing = [];
  for (const y of YEARS) for (let mo = 1; mo <= 12; mo++) if (!result.months[`${y}-${mo}`]) missing.push(`${y}-${mo}`);
  if (missing.length) console.log('MISSING:', missing.join(', '));
  else console.log('All 12 months present for every requested year.');
}

main().catch(e => { console.error(e); process.exit(1); });
