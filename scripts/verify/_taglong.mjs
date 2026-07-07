import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';
const tags = [
  { id: 't0', name: 'Ricercato dalle guardie della città di Valdûr per alto tradimento' },
  { id: 't1', name: 'Membro giurato dell\'ordine dei cavalieri del sole nascente' },
  { id: 't2', name: 'Veterano' },
  { id: 't3', name: 'Cacciatore di taglie noto in tutte le terre di confine settentrionali' },
];
const seed = {
  version: 3, exportedAt: 0,
  characters: [{ id: 'c1', name: 'Aldric', deletedAt: null, isPg: true, raceId: null,
    classLevels: [], alignment: '', playerId: null, tagIds: [], notes: '' }],
  groups: [], transactions: [], tags, players: [], races: [], classes: [],
};
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 900, deviceScaleFactor: 2 });
await page.evaluateOnNewDocument((s) => localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s)), seed);
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 400));
const adds = await page.$$('.m2m__addline');
await adds[adds.length - 1].click();
await new Promise(r => setTimeout(r, 300));
const m = await page.evaluate(() => {
  const opts = [...document.querySelectorAll('.m2m__opt')];
  const heights = opts.map(o => +o.getBoundingClientRect().height.toFixed(1));
  return { count: opts.length, heights, uniform: new Set(heights).size === 1 };
});
console.log(JSON.stringify(m));
await page.screenshot({ path: `${OUT}/tag-long-rows.png` });
await browser.close();
