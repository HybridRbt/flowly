// Acceptance run for the card "看板卡片补齐可访问名称，让 UI 自动化验证可定位" (aef0a68c):
// a script opens a board card's sidebar by its title alone, five times in a row, on the real
// desktop web app through docs/promo/shot-lib.mjs (AGENTS.md: verification screenshots and page
// text come from shot-lib). Usage:
//   node run.mjs          # 5x open+close by title
//   node run.mjs --shot   # also save board.png / drawer.png as evidence
// The Tinylink demo project is the permanent fixture; this run changes nothing on it.
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, open, openCard, closeCard, shot } from '../../promo/shot-lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const TITLE = process.argv.includes('--title') ? process.argv[process.argv.indexOf('--title') + 1] : 'Add rate limiting to POST /shorten';
const RUNS = 5;

const browser = await launch();
const s = await open(browser, { w: 1700, h: 1000, project: 'Tinylink' });
const results = [];
try {
  for (let i = 1; i <= RUNS; i++) {
    const started = Date.now();
    await openCard(s, TITLE);
    if (process.argv.includes('--shot') && i === 1) await shot(s, `${here}/drawer.png`);
    await closeCard(s);
    results.push({ run: i, ok: true, ms: Date.now() - started });
    console.log(`run ${i}/${RUNS}: opened and closed "${TITLE}"`);
  }
  if (process.argv.includes('--shot')) await shot(s, `${here}/board.png`);
} finally {
  await browser.close();
}

const failures = results.filter((r) => !r.ok);
const report = {
  check: 'Open a card sidebar by title only, 5 consecutive times',
  title: TITLE,
  date: new Date().toISOString(),
  script: 'docs/verification/board-card-open-2026-11-05/run.mjs',
  command: process.argv.join(' '),
  passed: results.length === RUNS && failures.length === 0,
  runs: results,
  pageErrors: s.errors,
};
writeFileSync(`${here}/report.json`, JSON.stringify(report, null, 2));
console.log(report.passed ? `PASS: ${RUNS}/${RUNS} consecutive opens by title` : `FAIL: ${results.filter((r) => r.ok).length}/${RUNS} succeeded`);
process.exit(report.passed ? 0 : 1);
