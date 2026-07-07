import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';
const seed = {
  version: 3, exportedAt: 0,
  characters: [{ id: 'c1', name: 'Aldric', deletedAt: null, isPg: true, raceId: null,
    classLevels: [{ classId: 'k1', level: 8 }], alignment: '', playerId: null, tagIds: [], notes: '' }],
  groups: [], transactions: [], tags: [], players: [], races: [], classes: [{ id: 'k1', name: 'Mago' }],
};
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 800, deviceScaleFactor: 2 });
await page.evaluateOnNewDocument((s) => localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s)), seed);
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 400));
// labels with tip
const labels = await page.$$eval('.led__k.ds-hint', els => els.map(e => e.textContent.trim()));
console.log('label-info fields:', JSON.stringify(labels));
// hover first info label (Livello)
const infos = await page.$$('.led__k.ds-hint');
await infos[0].hover();
await new Promise(r => setTimeout(r, 300));
const bubble = await page.$eval('.rep-hint__bubble', el => el.textContent).catch(() => null);
console.log('Livello label tooltip:', JSON.stringify(bubble));
await page.screenshot({ path: `${OUT}/label-tip.png`, clip: { x: 0, y: 250, width: 900, height: 360 } });
await browser.close();
