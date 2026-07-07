import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5175/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';

const seed = {
  version: 2, exportedAt: 0,
  characters: [{ id: 'c1', name: 'Aragorn', deletedAt: null }],
  groups: [], transactions: [],
};

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--window-size=1000,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 900, deviceScaleFactor: 2 });
await page.evaluateOnNewDocument((s) => {
  localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s));
}, seed);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await wait(600);

const sheetShot = async (name) => {
  const el = await page.$('.led');
  if (el) await el.screenshot({ path: `${OUT}/${name}.png` });
};

await sheetShot('r1-read');

const razzaBtn = await page.$('.led__item .led__val--edit');
if (razzaBtn) { await razzaBtn.hover(); await wait(250); await sheetShot('r2-hover-val'); }
if (razzaBtn) { await razzaBtn.click(); await wait(300); await sheetShot('r3-select-inline'); }
await page.keyboard.press('Escape'); await wait(200);

const btns = await page.$$('.led__item .led__val--edit');
if (btns[1]) { await btns[1].click(); await wait(350); await sheetShot('r4-classe-editor'); }
await page.keyboard.press('Escape'); await wait(200);

const x = await page.$('.grp__tag-x');
if (x) { await x.hover(); await wait(250); }
const grp = await page.$('.grp');
if (grp) await grp.screenshot({ path: `${OUT}/r5-badge-x-hover.png` });

console.log('done');
await browser.close();
