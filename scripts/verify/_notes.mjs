import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5175/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';

const seed = {
  version: 2, exportedAt: 0,
  characters: [{ id: 'c1', name: 'Aragorn', deletedAt: null,
    notes: '# Titolo grande\n## Sottotitolo\nTesto **grassetto** e *corsivo* con `codice`.\n- primo\n- secondo\n### Terzo livello' }],
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
await new Promise((r) => setTimeout(r, 500));

const notes = await page.$('.notes');
if (notes) await notes.screenshot({ path: `${OUT}/note-01-read.png` });

// hover to reveal pencil
if (notes) { await notes.hover(); await new Promise((r) => setTimeout(r, 250)); await notes.screenshot({ path: `${OUT}/note-02-hover.png` }); }

// click to edit
const pencil = await page.$('.notes__pencil');
if (pencil) { await pencil.click(); await new Promise((r) => setTimeout(r, 250)); await (await page.$('.notes')).screenshot({ path: `${OUT}/note-03-edit.png` }); }

await browser.close();
console.log('done');
