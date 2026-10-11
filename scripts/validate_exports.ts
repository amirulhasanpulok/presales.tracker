import assert from "node:assert/strict";
import { csvCell, csvRows } from "../src/utils/csv";
assert.equal(csvCell('A,"B"'), '"A,""B"""');
assert.equal(csvCell('=HYPERLINK("evil")'), '"\'=HYPERLINK(""evil"")"');
assert.equal(csvCell("  +cmd"), '"\'  +cmd"');
assert.equal(csvCell(-12), "-12");
assert.equal(csvCell(undefined), '""');
assert.equal(
  csvRows([
    ["Customer", "Budget"],
    ["বাংলা, Company", 125],
  ]),
  '\uFEFF"Customer","Budget"\r\n"বাংলা, Company",125',
);
console.log(
  "PASS: 6 CSV checks: formula safety, quotes, numbers, missing values and Bangla encoding.",
);
