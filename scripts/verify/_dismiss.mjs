import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173/ttrpg-core';
const tags = [{ id: 't0', name: 'Alfa' }, { id: 't1', name: 'Beta' }];
const seed = {
  version: 3, exportedAt: 0,
  characters: [{ id: 'c1', name: 'Aldric', deletedAt: null, isPg: true, raceId: null,
    classLevels: [], alignment: 'Legale Buono', playerId: null, tagIds: [], notes: '' }],
  groups: [], transactions: [], tags, players: [], races: [], classes: [],
};
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 800 });
await page.evaluateOnNewDocument((s) => localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s)), seed);
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 400));
const popCount = (sel) => page.$$eval(sel, els => els.length);

// --- m2m: click-outside chiude ---
const adds = await page.$$('.m2m__addline');
await adds[adds.length - 1].click();
await new Promise(r => setTimeout(r, 200));
const m2mOpen = await popCount('.m2m__pop');
await page.mouse.click(20, 400); // fuori
await new Promise(r => setTimeout(r, 200));
const m2mAfterOutside = await popCount('.m2m__pop');
// riapri e Esc
await adds[adds.length - 1].click();
await new Promise(r => setTimeout(r, 200));
await page.keyboard.press('Escape');
await new Promise(r => setTimeout(r, 200));
const m2mAfterEsc = await popCount('.m2m__pop');

// --- InlineSelect: click-outside chiude ---
const btns = await page.$$('.led__val--edit');
for (const b of btns) { const l = await b.evaluate(el => el.getAttribute('aria-label') || ''); if (l.toLowerCase().includes('allineamento')) { await b.click(); break; } }
await new Promise(r => setTimeout(r, 200));
const iselOpen = await popCount('.isel__pop');
await page.mouse.click(20, 400);
await new Promise(r => setTimeout(r, 200));
const iselAfterOutside = await popCount('.isel__pop');

console.log(JSON.stringify({
  m2mOpen, m2mAfterOutside, m2mAfterEsc, iselOpen, iselAfterOutside,
  ok: m2mOpen === 1 && m2mAfterOutside === 0 && m2mAfterEsc === 0 && iselOpen === 1 && iselAfterOutside === 0,
}));
await browser.close();
