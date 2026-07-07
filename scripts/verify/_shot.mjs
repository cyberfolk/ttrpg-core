import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5175/ttrpg-core';
const OUT = process.argv[2] || 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';

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

await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 600));

// read mode
await page.screenshot({ path: `${OUT}/01-read.png` });

// crop to the sheet section
const sheet = await page.$('.led');
if (sheet) await sheet.screenshot({ path: `${OUT}/02-sheet-read.png` });

// hover the Gruppi row to reveal add affordance
const grp = await page.$('.grp');
if (grp) { await grp.hover(); await new Promise((r) => setTimeout(r, 250)); await grp.screenshot({ path: `${OUT}/03-grp-hover.png` }); }

// edit mode via pencil
const pencil = await page.$('.led__pencil');
if (pencil) {
  await pencil.click();
  await new Promise((r) => setTimeout(r, 400));
  const sheet2 = await page.$('.led');
  if (sheet2) await sheet2.screenshot({ path: `${OUT}/04-sheet-edit.png` });
}

console.log('done');
await browser.close();
