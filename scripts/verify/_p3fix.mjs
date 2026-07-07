import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5175/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';

const seed = {
  version: 3,
  exportedAt: 0,
  characters: [
    {
      id: 'c1', name: 'Aragorn', deletedAt: null,
      isPg: true, raceId: null, classLevels: [], alignment: '', playerId: null, tagIds: [],
      notes: 'Nota **A**.',
    },
    {
      id: 'c2', name: 'Boromir', deletedAt: null,
      isPg: true, raceId: null, classLevels: [], alignment: '', playerId: null, tagIds: [],
      notes: 'Nota **B**.',
    },
  ],
  groups: [
    {
      id: 'g1', name: 'Alfa', type: 'Fazione', memberIds: ['c1'], deletedAt: null,
      seat: '', guideId: null, motto: '', tagIds: [],
      notes: 'Gruppo nota **A**.',
    },
    {
      id: 'g2', name: 'Beta', type: 'Fazione', memberIds: ['c2'], deletedAt: null,
      seat: '', guideId: null, motto: '', tagIds: [],
      notes: 'Gruppo nota **B**.',
    },
  ],
  transactions: [],
  tags: [],
  players: [],
  races: [],
  classes: [],
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 1000, deviceScaleFactor: 2 });

const consoleErrors = [];
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', (err) => consoleErrors.push(String(err)));

await page.evaluateOnNewDocument((s) => {
  if (localStorage.getItem('ttrpg-reputation-state') === null) {
    localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s));
  }
}, seed);

// --- Character profile: load c1 (Aragorn), default tab "note" ---
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 500));
const notesBefore = await page.evaluate(() => document.querySelector('.notes__md')?.innerText || '');
console.log('--- c1 notes before paging ---');
console.log(notesBefore);

// Click pager "next" button (SPA reuse: same route name -> component NOT remounted
// without the :key fix)
const nextClicked = await page.evaluate(() => {
  const btn = document.querySelector('.rep-recpager button[aria-label="Record successivo"]');
  btn?.click();
  return !!btn;
});
await new Promise((r) => setTimeout(r, 400));
const urlAfterNext = page.url();
const notesAfter = await page.evaluate(() => document.querySelector('.notes__md')?.innerText || '');
console.log('--- after pager next click ---');
console.log('nextClicked:', nextClicked, 'url:', urlAfterNext);
console.log('c2 notes rendered:', notesAfter);
const pagerShowsCorrectNote = notesAfter.includes('B');
console.log('PAGER SHOWS CORRECT ENTITY NOTE (B, not stale A)?', pagerShowsCorrectNote ? 'YES (fix works)' : 'NO (BUG STILL PRESENT)');

await page.screenshot({ path: `${OUT}/p3-pager-fix.png` });

console.log('--- console errors ---');
console.log(consoleErrors.length ? consoleErrors : 'NONE');

await browser.close();
