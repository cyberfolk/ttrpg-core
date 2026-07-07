import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';
const long = Array.from({ length: 20 }, (_, i) => `Riga di note numero ${i + 1} con un po' di testo per riempire.`).join('\n');
const seed = {
  version: 3, exportedAt: 0,
  characters: [{ id: 'c1', name: 'Aldric', deletedAt: null, isPg: true, raceId: null,
    classLevels: [], alignment: '', playerId: null, tagIds: [], notes: long }],
  groups: [], transactions: [], tags: [], players: [], races: [], classes: [],
};
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 1000, deviceScaleFactor: 1 });
await page.evaluateOnNewDocument((s) => localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s)), seed);
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 400));
await page.hover('.notes__view');
await page.click('.notes__pencil');
await new Promise(r => setTimeout(r, 300));
const m = await page.$eval('.notes__ta', el => {
  const cs = getComputedStyle(el);
  return { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, styleHeight: el.style.height,
    overflowY: cs.overflowY, hasInnerScroll: el.scrollHeight > el.clientHeight + 1 };
});
console.log(JSON.stringify(m));
await page.screenshot({ path: `${OUT}/ta-autogrow.png`, clip: { x: 130, y: 250, width: 640, height: 700 } });
await browser.close();
