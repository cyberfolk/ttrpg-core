import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5175/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';

const ORIGINAL = '# Titolo originale\nTesto **originale** che NON deve cambiare.';

const seed = {
  version: 3, exportedAt: 0,
  characters: [{
    id: 'c1', name: 'Aragorn', deletedAt: null,
    isPg: true, raceId: null, classLevels: [], alignment: '',
    playerId: null, tagIds: [], notes: ORIGINAL,
  }],
  groups: [], transactions: [],
  tags: [], players: [], races: [], classes: [],
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

// Entra in edit (click sull'anteprima).
await page.click('.notes__view');
await new Promise((r) => setTimeout(r, 250));

// Screenshot dei due bottoni in edit mode.
const notes = await page.$('.notes');
if (notes) await notes.screenshot({ path: `${OUT}/cancel-01-edit.png` });

// Modifica il testo nella textarea.
await page.click('.notes__ta');
await page.evaluate(() => {
  const ta = document.querySelector('.notes__ta');
  ta.value = '';
  ta.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.type('.notes__ta', 'TESTO MODIFICATO che deve essere SCARTATO');
await new Promise((r) => setTimeout(r, 150));

// Click su Annulla (primo bottone del gruppo azioni = ghost).
const cancelBtn = await page.$('.notes__actions .ds-btn--ghost');
await cancelBtn.click();
await new Promise((r) => setTimeout(r, 250));

// Deve essere tornato in lettura col testo ORIGINALE.
const afterCancel = await page.evaluate(() => {
  const md = document.querySelector('.notes__md');
  const ta = document.querySelector('.notes__ta');
  return { editing: !!ta, html: md ? md.innerHTML : null };
});

// Ricarica la pagina: le note su localStorage NON devono essere cambiate.
await page.reload({ waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 500));
const afterReload = await page.evaluate(() => {
  const raw = localStorage.getItem('ttrpg-reputation-state');
  const st = JSON.parse(raw);
  const md = document.querySelector('.notes__md');
  return { storedNotes: st.characters[0].notes, html: md ? md.innerHTML : null };
});
const notes2 = await page.$('.notes');
if (notes2) await notes2.screenshot({ path: `${OUT}/cancel-02-after-reload.png` });

const pass = afterCancel.editing === false
  && afterReload.storedNotes === ORIGINAL
  && !afterReload.storedNotes.includes('MODIFICATO');

console.log(JSON.stringify({ afterCancel, afterReload, PASS: pass }, null, 2));

await browser.close();
console.log('done');
