import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5175/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';

const seed = {
  version: 3, exportedAt: 0,
  characters: [{ id: 'c1', name: 'Aldric il Giusto', deletedAt: null,
    isPg: true, raceId: null, classLevels: [], alignment: '', playerId: null, tagIds: [],
    notes: '# Titolo\nTesto **grassetto**.' }],
  groups: [], transactions: [], tags: [], players: [], races: [], classes: [],
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

await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 500));

// Note edit buttons
await page.click('.notes__view');
await new Promise((r) => setTimeout(r, 250));
await (await page.$('.notes__actions')).screenshot({ path: `${OUT}/btn-notes.png` });

// Rename buttons: open gear menu → Rinomina
await page.hover('.rep-profile__gear');
await new Promise((r) => setTimeout(r, 300));
const items = await page.$$('.ds-menu__item');
if (items[0]) await items[0].click();
await new Promise((r) => setTimeout(r, 300));
await (await page.$('.rep-profile__editactions')).screenshot({ path: `${OUT}/btn-rename.png` });

await browser.close();
console.log('done');
