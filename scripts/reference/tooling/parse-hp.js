// Parse Hamro Patro RSC flight payload -> extract daysInMonth + day records
const fs = require('fs');
const file = process.argv[2] || 'C:/Users/shres/AppData/Local/Temp/hp-rsc.txt';
const t = fs.readFileSync(file, 'utf8');

const monthRe = /\{"yearBs":(\d+),"monthBs":(\d+),[^{]*?"daysInMonth":(\d+)/g;
let m, count = 0;
const months = [];
while ((m = monthRe.exec(t))) {
  months.push({ y: +m[1], mo: +m[2], dim: +m[3] });
  count++;
}
console.log('month objects:', count);
for (const mo of months) console.log(`  BS ${mo.y}/${String(mo.mo).padStart(2, '0')} -> ${mo.dim} days`);

// day records with inMonth flag
const dayRe = /"year_bs":(\d+),"month_bs":(\d+),"day_bs":(\d+),"dayOfWeek":(\d+),"inMonth":(true|false)/g;
let d, days = 0, inMonth = 0;
const byMonth = new Map();
while ((d = dayRe.exec(t))) {
  days++;
  const key = `${d[1]}-${d[2]}`;
  if (!byMonth.has(key)) byMonth.set(key, { total: 0, inMonth: 0, maxDay: 0, minAD: null, maxAD: null });
  const rec = byMonth.get(key);
  rec.total++;
  if (d[5] === 'true') { inMonth++; rec.maxDay = Math.max(rec.maxDay, +d[3]); }
  const ad = `${d[1] ? '' : ''}`;
  void ad;
}
console.log('day records:', days, 'inMonth:', inMonth);
for (const [k, v] of byMonth) console.log(`  ${k}: records=${v.total} inMonth=${v.inMonth} maxDay=${v.maxDay}`);
