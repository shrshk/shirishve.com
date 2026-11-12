// Fails when any text colour drops under WCAG AA on its surface. Run by `npm run verify`.
import { AA_BODY, contrastReport } from '../src/lib/palette.ts';

const rows = contrastReport();
for (const r of rows) {
  const mark = r.pass ? 'ok  ' : 'FAIL';
  console.log(
    `${mark} ${r.ratio.toFixed(2).padStart(5)}  ${r.surface.padEnd(20)} ${r.role.padEnd(8)} ${r.fg} on ${r.worstBg}`,
  );
}
const failed = rows.filter((r) => !r.pass);
if (failed.length) {
  console.error(`\n${failed.length} pair(s) under ${AA_BODY}:1`);
  process.exit(1);
}
console.log(`\nAll ${rows.length} pairs pass AA (${AA_BODY}:1).`);
