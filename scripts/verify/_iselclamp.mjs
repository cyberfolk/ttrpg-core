import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173/ttrpg-core';
const seed = {
  version: 3, exportedAt: 0,
  characters: [{ id: 'c1', name: 'Aldric', deletedAt: null, isPg: true, raceId: null,
    classLevels: [], alignment: 'Legale Buono', playerId: null, tagIds: [], notes: '' }],
  groups: [], transactions: [], tags: [], players: [], races: [], classes: [],
};
async function run(w, h, mobile, tag) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await page.evaluateOnNewDocument((s) => localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s)), seed);
  await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  // open Allineamento select
  const buttons = await page.$$('.led__val--edit');
  for (const b of buttons) {
    const label = await b.evaluate(el => el.getAttribute('aria-label') || '');
    if (label.toLowerCase().includes('allineamento')) { await b.click(); break; }
  }
  await new Promise(r => setTimeout(r, 300));
  const info = await page.evaluate(() => {
    const p = document.querySelector('.isel__pop');
    if (!p) return { found: false };
    const r = p.getBoundingClientRect();
    return { found: true, left: r.left, right: r.right, top: r.top, bottom: r.bottom, vw: innerWidth, vh: innerHeight };
  });
  const M = 8;
  info.ok = info.found && info.left >= M - 1 && info.right <= info.vw - M + 1 && info.top >= M - 1 && info.bottom <= info.vh - M + 1;
  console.log(tag, JSON.stringify(info));
  await browser.close();
}
await run(390, 720, true, 'mobile');
await run(1100, 800, false, 'desktop');
