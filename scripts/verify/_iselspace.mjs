import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';
const seed = {
  version: 3, exportedAt: 0,
  characters: [{ id: 'c1', name: 'Aldric', deletedAt: null, isPg: true, raceId: null,
    classLevels: [], alignment: '', playerId: null, tagIds: [], notes: '' }],
  groups: [], transactions: [], tags: [], players: [], races: [], classes: [],
};
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 900, deviceScaleFactor: 2 });
await page.evaluateOnNewDocument((s) => localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s)), seed);
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 400));
// open Allineamento select (has ALIGNMENTS options). Find its led__val--edit button by label.
const buttons = await page.$$('.led__val--edit');
// click the 2nd (allineamento) — order: razza, allineamento, giocatore? razza first.
for (const b of buttons) {
  const label = await b.evaluate(el => el.getAttribute('aria-label') || '');
  if (label.toLowerCase().includes('allineamento')) { await b.click(); break; }
}
await new Promise(r => setTimeout(r, 300));
const m = await page.evaluate(() => {
  const opts = [...document.querySelectorAll('.isel__opt')];
  if (!opts.length) return { count: 0 };
  const rects = opts.map(o => o.getBoundingClientRect());
  const cs = getComputedStyle(opts[0]);
  return { count: opts.length, h0: +rects[0].height.toFixed(1),
    gap: rects.length>1 ? +(rects[1].top - rects[0].bottom).toFixed(1) : null,
    padding: cs.padding, lineHeight: cs.lineHeight, fontSize: cs.fontSize };
});
console.log('isel', JSON.stringify(m));
await (await page.$('.isel__pop')).screenshot({ path: `${OUT}/picker-isel.png` }).catch(()=>{});
await browser.close();
