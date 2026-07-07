import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';
const tags = Array.from({ length: 12 }, (_, i) => ({ id: 't' + i, name: 'Tag numero ' + (i + 1) }));
const seed = {
  version: 3, exportedAt: 0,
  characters: [{ id: 'c1', name: 'Aldric', deletedAt: null, isPg: true, raceId: null,
    classLevels: [{ classId: 'k1', level: 5 }], alignment: '', playerId: null,
    tagIds: ['t0','t1','t2','t3','t4','t5','t6','t7'], notes: '' }],
  groups: [], transactions: [], tags, players: [], races: [], classes: [{ id: 'k1', name: 'Mago' }],
};
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.evaluateOnNewDocument((s) => localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s)), seed);
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 400));

// click the LAST m2m add button (Tag, lowest in header → least space below)
const adds = await page.$$('.m2m__addline');
console.log('add buttons:', adds.length);
const btn = adds[adds.length - 1];
await btn.evaluate(el => el.scrollIntoView({ block: 'center' }));
await new Promise(r => setTimeout(r, 150));
const trgRect = await btn.evaluate(el => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, bottom: r.bottom }; });
console.log('trigger rect:', JSON.stringify(trgRect));
await btn.click();
await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path: `${OUT}/m2m-picker-mobile-right.png` });

const info = await page.evaluate(() => {
  const pop = document.querySelector('.m2m__pop');
  if (!pop) return { found: false };
  const r = pop.getBoundingClientRect();
  return { found: true, left: r.left, right: r.right, top: r.top, bottom: r.bottom,
    vw: window.innerWidth, vh: window.innerHeight };
});
const M = 8;
info.okLeft = info.left >= M - 1;
info.okRight = info.right <= info.vw - M + 1;
info.okTop = info.top >= M - 1;
info.okBottom = info.bottom <= info.vh - M + 1;
info.ok = info.okLeft && info.okRight && info.okTop && info.okBottom;
console.log(JSON.stringify(info));
await page.screenshot({ path: `${OUT}/m2m-picker-mobile.png` });
await browser.close();
