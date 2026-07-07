import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';
const seed = {
  version: 3, exportedAt: 0,
  characters: [{ id: 'c1', name: 'Aldric il Giusto', deletedAt: null, isPg: true, raceId: 'r1',
    classLevels: [{ classId: 'k1', level: 5 }, { classId: 'k2', level: 3 }], alignment: 'Legale Buono',
    playerId: 'p1', tagIds: ['t0', 't1'], notes: '# Titolo\nCorpo delle note.' }],
  groups: [{ id: 'g1', name: 'La Guardia Cittadina', type: 'fazione', memberIds: ['c1'], deletedAt: null,
    seat: 'Valdûr', guideId: 'c1', motto: 'Fino alla fine', tagIds: ['t0'], notes: '' }],
  transactions: [], tags: [{ id: 't0', name: 'Capitano' }, { id: 't1', name: 'Veterano' }],
  players: [{ id: 'p1', name: 'Giulia' }], races: [{ id: 'r1', name: 'Umano' }],
  classes: [{ id: 'k1', name: 'Mago' }, { id: 'k2', name: 'Ladro' }],
};
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
async function shot(path, w, h, mobile, tag) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  await page.evaluateOnNewDocument((s) => localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s)), seed);
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: `${OUT}/sweep-${tag}.png`, fullPage: true });
  await page.close();
}
await shot('/personaggio/c1', 1100, 900, false, 'char-desktop');
await shot('/personaggio/c1', 390, 760, true, 'char-mobile');
await shot('/gruppo/g1', 1100, 900, false, 'grp-desktop');
await shot('/gruppo/g1', 390, 760, true, 'grp-mobile');
await browser.close();
console.log('done');
