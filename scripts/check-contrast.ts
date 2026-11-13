// Fails when any text colour drops under WCAG AA on its surface. Run by `npm run verify`.
import { contrastReport } from '../src/lib/palette.ts';

const rows = contrastReport();
for (const r of rows) {
  console.log(
    `${r.pass ? 'ok  ' : 'FAIL'} ${r.ratio.toFixed(2).padStart(5)} (needs ${r.need})  ${r.role.padEnd(28)} ${r.fg} on ${r.bg}`,
  );
}
const failed = rows.filter((r) => !r.pass);
if (failed.length) {
  console.error(`\n${failed.length} pair(s) under WCAG AA`);
  process.exit(1);
}
console.log(`\nAll ${rows.length} pairs pass AA.`);
