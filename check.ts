import fs from 'fs';
import { parse } from 'csv-parse/sync';

const raw1 = fs.readFileSync('data/TS-PS4-1.csv', 'utf8');
const txns = parse(raw1, { columns: true });

const raw2 = fs.readFileSync('data/TS-PS4-2.csv', 'utf8');
const dr = parse(raw2, { columns: true });

let unwithdrawn = 0;
let deceasedAadhaar = 0;

const drAadhaar = new Set(dr.map((d: any) => d.aadhaar));

for (let t of txns) {
  if (t.status === 'SUCCESS' && String(t.withdrawn) === '0') unwithdrawn++;
  
  if (t.status === 'SUCCESS' && drAadhaar.has(t.aadhaar)) {
    let dInfo: any = dr.find((x: any) => x.aadhaar === t.aadhaar);
    if (new Date(t.transaction_date) > new Date(dInfo.death_date)) {
        deceasedAadhaar++;
    }
  }
}

console.log('Unwithdrawn:', unwithdrawn);
console.log('Deceased Aadhaar exact match:', deceasedAadhaar);
