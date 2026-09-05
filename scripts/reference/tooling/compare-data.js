// Compare bs-data.raw.json against three independent external sources:
//  1. Hamro Patro (hamropatro.com RSC payloads)  — primary per user request
//  2. npm nepali-date-converter@3.4.0
//  3. npm nepali-datetime@2.0.0 (ashesh)
const fs = require('fs');

const raw = JSON.parse(fs.readFileSync(__dirname + '/src/data/bs-data.raw.json', 'utf8'));
const hamro = JSON.parse(fs.readFileSync('C:/Users/shres/AppData/Local/Temp/hamro-months.json', 'utf8'));
const ndc = JSON.parse(fs.readFileSync('C:/Users/shres/AppData/Local/Temp/ndc-months.json', 'utf8'));
const ndt = JSON.parse(fs.readFileSync('C:/Users/shres/AppData/Local/Temp/ndt-months.json', 'utf8'));

const minYear = raw.minYear, maxYear = raw.maxYear;
let diffs = 0;
const report = [];

function arrayEq(a, b) { return a.length === b.length && a.every((v, i) => v === b[i]); }

for (let y = minYear; y <= maxYear; y++) {
  const ours = raw.years[String(y)];
  const h = [];
  for (let mo = 1; mo <= 12; mo++) {
    const rec = hamro.months[`${y}-${mo}`];
    h.push(rec ? rec.dim : null);
  }
  const n1 = ndc.years[String(y)];
  const n2 = ndt.years[String(y)] ? ndt.years[String(y)].months : null;

  const oursTotal = ours.reduce((a, b) => a + b, 0);
  const hTotal = h.every(v => v !== null) ? h.reduce((a, b) => a + b, 0) : null;
  const n1Total = n1 ? n1.reduce((a, b) => a + b, 0) : null;
  const n2Total = n2 ? n2.reduce((a, b) => a + b, 0) : null;

  const probs = [];
  if (hTotal !== null && !arrayEq(ours, h)) probs.push(`HAMRO=${JSON.stringify(h)} (total ${hTotal})`);
  if (n1 && !arrayEq(ours, n1)) probs.push(`NDC=${JSON.stringify(n1)} (total ${n1Total})`);
  if (n2 && !arrayEq(ours, n2)) probs.push(`NDT=${JSON.stringify(n2)} (total ${n2Total})`);
  if (probs.length) {
    diffs++;
    report.push({ year: y, ours, oursTotal, probs });
  }
}

console.log(`Years with any disagreement vs external sources: ${diffs}/${maxYear - minYear + 1}`);
for (const r of report) {
  console.log(`BS ${r.year} ours=${JSON.stringify(r.ours)} total=${r.oursTotal}`);
  for (const p of r.probs) console.log(`   ${p}`);
}

// Also check anchor: hamro firstAD of 2000-1 and new-year dates per year
console.log('\n--- New Year (BS/1/1) AD dates from Hamro Patro ---');
const anchors = {};
for (let y = minYear; y <= maxYear; y++) {
  const rec = hamro.months[`${y}-1`];
  anchors[y] = rec ? rec.firstAD : null;
}
fs.writeFileSync(__dirname + '/hamro-new-years.json', JSON.stringify(anchors, null, 1));
console.log('Saved hamro-new-years.json (sample):');
for (const y of [2000, 2050, 2075, 2080, 2081, 2082, 2083, 2085, 2090]) {
  console.log(`  BS ${y}/1/1 = ${anchors[y]}`);
}

// And last day of each year
console.log('\n--- Year totals per source (sample) ---');
for (const y of [2000, 2044, 2075, 2080, 2081, 2082, 2083, 2085, 2090]) {
  const ours = raw.years[String(y)].reduce((a, b) => a + b, 0);
  const h = Array.from({ length: 12 }, (_, i) => hamro.months[`${y}-${i + 1}`]?.dim ?? null);
  const hT = h.every(v => v !== null) ? h.reduce((a, b) => a + b, 0) : null;
  console.log(`BS ${y}: ours=${ours} hamro=${hT} ndc=${ndc.years[String(y)] ? ndc.years[String(y)].reduce((a, b) => a + b, 0) : '-'} ndt=${ndt.years[String(y)] ? ndt.years[String(y)].total : '-'}`);
}
