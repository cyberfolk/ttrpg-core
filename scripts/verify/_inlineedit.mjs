import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';
const seed = {
  version: 3, exportedAt: 0,
  characters: [{ id: 'c1', name: 'Aldric', deletedAt: null, isPg: true, raceId: 'r1',
    classLevels: [{ classId: 'k1', level: 5 }], alignment: 'Legale Buono', playerId: null, tagIds: [], notes: '' }],
  groups: [], transactions: [], tags: [], players: [], races: [{ id: 'r1', name: 'Umano' }], classes: [{ id: 'k1', name: 'Mago' }],
};
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 800, deviceScaleFactor: 2 });
await page.evaluateOnNewDocument((s) => localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s)), seed);
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 400));
// hover a field edit button (Razza)
const btn = await page.$('.led__val--edit');
await btn.hover();
await new Promise(r => setTimeout(r, 250));
const st = await page.evaluate(() => {
  const b = document.querySelector('.led__val--edit');
  const ico = b.querySelector('.led__val-ico');
  return { bg: getComputedStyle(b).backgroundColor, border: getComputedStyle(b).borderTopColor, icoOpacity: getComputedStyle(ico).opacity };
});
console.log('led field hover:', JSON.stringify(st));
await page.screenshot({ path: `${OUT}/inline-led-hover.png`, clip: { x: 0, y: 250, width: 900, height: 250 } });
await browser.close();
