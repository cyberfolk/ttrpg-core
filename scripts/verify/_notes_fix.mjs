import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5175/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';

// schema v3 (vedi docs/requisiti-funzionali/05-dati-e-persistenza.md)
const seed = {
  version: 3, exportedAt: 0,
  characters: [{
    id: 'c1', name: 'Aragorn', deletedAt: null,
    isPg: true, raceId: null, classLevels: [], alignment: '',
    playerId: null, tagIds: [],
    notes: '# Titolo grande\n## Sottotitolo\nTesto **grassetto** e *corsivo* con `codice`.\n- primo\n- secondo\n### Terzo livello',
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

// Regione testata + tab + note, per giudicare l'allineamento del rientro.
const card = await page.$('.rep-profile__tabs')
  ? await page.$('.rep-profile')
  : await page.$('.notes');

// Screenshot lettura (tab + note) — l'intero blocco tab/contenuto
const tabsBlock = await page.$('.rep-profile__tabs');
if (tabsBlock) {
  // cattura il genitore per includere note sotto i tab
  const box = await page.evaluate(() => {
    const tabs = document.querySelector('.rep-profile__tabs');
    const notes = document.querySelector('.notes');
    if (!tabs || !notes) return null;
    const a = tabs.getBoundingClientRect();
    const b = notes.getBoundingClientRect();
    const top = Math.min(a.top, b.top) - 6;
    const left = Math.min(a.left, b.left) - 6;
    const right = Math.max(a.right, b.right) + 6;
    const bottom = b.bottom + 6;
    return { x: left, y: top, width: right - left, height: bottom - top };
  });
  if (box) await page.screenshot({ path: `${OUT}/notefix-01-indent.png`, clip: box });
}

// Hover sulla matita per far comparire il tooltip "Modifica" (teleportato su body).
const pencil = await page.$('.notes__pencil');
if (pencil) {
  await pencil.hover();
  await new Promise((r) => setTimeout(r, 300));
}

// Screenshot full viewport-region intorno alle note per vedere il tooltip ancorato.
const box2 = await page.evaluate(() => {
  const notes = document.querySelector('.notes');
  if (!notes) return null;
  const b = notes.getBoundingClientRect();
  return { x: Math.max(0, b.left - 20), y: Math.max(0, b.top - 20), width: b.width + 40, height: b.height + 90 };
});
if (box2) await page.screenshot({ path: `${OUT}/notefix-02-tooltip.png`, clip: box2 });

// Log posizione tooltip vs matita per conferma numerica.
const geom = await page.evaluate(() => {
  const pen = document.querySelector('.notes__pencil');
  const wrap = document.querySelector('.notes__pencilwrap');
  const bub = document.querySelector('.rep-hint__bubble');
  const r = (el) => el ? el.getBoundingClientRect() : null;
  const fmt = (b) => b ? { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom) } : null;
  return { pencil: fmt(r(pen)), wrap: fmt(r(wrap)), bubble: fmt(r(bub)) };
});
console.log(JSON.stringify(geom, null, 2));

await browser.close();
console.log('done');
