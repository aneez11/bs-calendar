// Check hamro new-year chain consistency + internal month chain
const fs = require('fs');
const hamro = JSON.parse(fs.readFileSync('C:/Users/shres/AppData/Local/Temp/hamro-months.json', 'utf8'));
const anchors = JSON.parse(fs.readFileSync('D:/Jobs/Aansh Tech/Node Packages/nepali patro/bs-calendar/hamro-new-years.json', 'utf8'));

function toDays(ad) { const [y, m, d] = ad.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); }
function fromDays(n) { const dt = new Date(n * 86400000); return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`; }

console.log('Today AD:', new Date().toISOString().slice(0, 10), ' (BS approx: )');

let prevEnd = null;
for (let y = 2000; y <= 2091; y++) {
  const a = anchors[String(y)];
  if (!a) { console.log(`BS ${y}: NO ANCHOR`); continue; }
  const ny = toDays(a);
  if (prevEnd !== null) {
    const gap = ny - prevEnd; // = length of year y-1
    if (gap !== 365 && gap !== 366) {
      console.log(`CHAIN BREAK: BS ${y - 1} length = ${gap} (${prevEnd === null ? '' : ''}newYear ${y - 1} .. ${a})`);
    }
  }
  // verify last day of this year from lastAD of month 12
  const dec = hamro.months[`${y}-12`];
  if (dec && dec.lastAD) {
    prevEnd = toDays(dec.lastAD) + 1; // first day of next year
    if (prevEnd !== ny + (dec.dim !== undefined ? 0 : 0)) {
      // cross-check: anchor(y+1) should equal lastAD(12,y)+1
    }
  }
  void ny;
}

// per-year length from month dims directly, and from chain
console.log('\nyear | hamroDimTotal | chainLength | firstAD      | lastAD(12)');
for (let y = 2000; y <= 2090; y++) {
  const dims = []; for (let m = 1; m <= 12; m++) { const r = hamro.months[`${y}-${m}`]; dims.push(r ? r.dim : null); }
  const dimTotal = dims.every(v => v !== null) ? dims.reduce((a, b) => a + b, 0) : null;
  const nextA = anchors[String(y + 1)];
  const chainLen = (nextA && anchors[String(y)]) ? toDays(nextA) - toDays(anchors[String(y)]) : null;
  const dec = hamro.months[`${y}-12`];
  const flag = (dimTotal !== null && chainLen !== null && dimTotal !== chainLen) ? ' <<< MISMATCH' : '';
  if (dimTotal !== chainLen || y >= 2083) console.log(`${y} | ${dimTotal} | ${chainLen} | ${anchors[String(y)]} | ${dec ? dec.lastAD : '-'}${flag}`);
}
