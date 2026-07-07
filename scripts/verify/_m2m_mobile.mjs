// Ripro bug mobile Many2ManyField: pallino/label/lista impilati su schermo stretto.
// Uso: node scripts/verify/_m2m_mobile.mjs <suffix>   (suffix = "before" | "after")
import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5175/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';
const SUF = process.argv[2] || 'shot';

const seed = {
  version: 3, exportedAt: 0,
  characters: [
    { id: 'c1', name: 'Cassia Vento', deletedAt: null,
      isPg: false, raceId: 'r1', classLevels: [{ classId: 'k1', level: 6 }],
      alignment: 'Legale Neutrale', playerId: null,
      tagIds: ['tg1', 'tg2', 'tg3'], notes: '' },
  ],
  groups: [
    { id: 'g1', name: 'La Guardia Cittadina', type: 'fazione',
      memberIds: ['c1'], deletedAt: null,
      seat: 'Valdûr', guideId: 'c1', motto: '', tagIds: [], notes: '' },
  ],
  transactions: [],
  tags: [
    { id: 'tg1', name: 'Capitano' },
    { id: 'tg2', name: 'Religioso' },
    { id: 'tg3', name: 'Veterano' },
  ],
  players: [],
  races: [{ id: 'r1', name: 'Umano' }],
  classes: [{ id: 'k1', name: 'Guerriero' }],
};

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new', args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.evaluateOnNewDocument((s) => {
  localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s));
}, seed);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await wait(600);

const led = await page.$('.led');
await led.screenshot({ path: `${OUT}/m2m-mobile-${SUF}.png` });

// dump geometria delle due righe .m2m per verifica numerica
const geo = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.m2m')];
  return rows.map((r) => {
    const sep = r.querySelector('.m2m__sep')?.getBoundingClientRect();
    const label = r.querySelector('.m2m__label')?.getBoundingClientRect();
    const body = r.querySelector('.m2m__body')?.getBoundingClientRect();
    const firstTag = r.querySelector('.m2m__tag')?.getBoundingClientRect();
    return {
      text: r.textContent.trim().slice(0, 24),
      sepTop: sep && Math.round(sep.top),
      labelTop: label && Math.round(label.top),
      bodyTop: body && Math.round(body.top),
      firstTagTop: firstTag && Math.round(firstTag.top),
      // stesso rigo se le top coincidono (± qualche px)
      inline: sep && body && Math.abs(sep.top - body.top) < 20,
    };
  });
});
console.log(JSON.stringify(geo, null, 2));
console.log('shot ->', `${OUT}/m2m-mobile-${SUF}.png`);
await browser.close();
