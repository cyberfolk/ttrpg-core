import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';
const groups = Array.from({ length: 5 }, (_, i) => ({ id: 'g' + i, name: 'Gruppo ' + (i + 1), type: 'fazione',
  memberIds: [], deletedAt: null, seat: '', guideId: null, motto: '', tagIds: [], notes: '' }));
const tags = Array.from({ length: 5 }, (_, i) => ({ id: 't' + i, name: 'Tag ' + (i + 1) }));
const seed = {
  version: 3, exportedAt: 0,
  characters: [{ id: 'c1', name: 'Aldric', deletedAt: null, isPg: true, raceId: null,
    classLevels: [], alignment: '', playerId: null, tagIds: [], notes: '' }],
  groups, transactions: [], tags, players: [], races: [], classes: [],
};
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 900, deviceScaleFactor: 2 });
await page.evaluateOnNewDocument((s) => localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s)), seed);
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 400));

async function openAndMeasure(idx, name) {
  const adds = await page.$$('.m2m__addline');
  await adds[idx].click();
  await new Promise(r => setTimeout(r, 300));
  const m = await page.evaluate(() => {
    const opts = [...document.querySelectorAll('.m2m__opt')];
    const rects = opts.map(o => o.getBoundingClientRect());
    const heights = rects.map(r => +r.height.toFixed(1));
    const gaps = rects.slice(1).map((r, i) => +(r.top - rects[i].bottom).toFixed(1));
    const cs = getComputedStyle(opts[0]);
    return { count: opts.length, heights, gaps, padding: cs.padding, lineHeight: cs.lineHeight, fontSize: cs.fontSize };
  });
  console.log(name, JSON.stringify(m));
  await (await page.$('.m2m__pop')).screenshot({ path: `${OUT}/picker-${name}.png` });
  // close
  await page.mouse.click(10, 10);
  await new Promise(r => setTimeout(r, 200));
}
await openAndMeasure(0, 'gruppi');
await openAndMeasure(1, 'tag');
await browser.close();
