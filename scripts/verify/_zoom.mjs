import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5175/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';
const seed = { version: 2, exportedAt: 0, characters: [{ id: 'c1', name: 'Aragorn', deletedAt: null }], groups: [], transactions: [] };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 900, deviceScaleFactor: 4 });
await page.evaluateOnNewDocument((s) => localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s)), seed);
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 500));
const el = await page.evaluateHandle(() => {
  const items = [...document.querySelectorAll('.led__item')];
  return items.find((it) => it.querySelector('.led__repchip'));
});
await el.asElement().screenshot({ path: `${OUT}/z-rep-item.png` });
console.log('saved');
await browser.close();
