import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5175/ttrpg-core';
const seed = {
  version: 3, exportedAt: 0,
  characters: [{ id: 'c1', name: 'Aldric il Giusto', deletedAt: null,
    isPg: true, raceId: null, classLevels: [], alignment: '', playerId: null, tagIds: [], notes: '' }],
  groups: [], transactions: [], tags: [], players: [], races: [], classes: [],
};
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 900, deviceScaleFactor: 2 });
await page.evaluateOnNewDocument((s) => localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s)), seed);
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 400));

// read: text start = span rect
const read = await page.$eval('.rep-profile__nameedit > span', el => {
  const r = el.getBoundingClientRect(); return { left: r.left, top: r.top };
});
// enter edit
await page.click('.rep-profile__nameedit');
await new Promise(r => setTimeout(r, 250));
// edit: text start = input.left + borderLeft + paddingLeft ; top similarly
const edit = await page.$eval('.rep-profile__edit', el => {
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const bl = parseFloat(cs.borderLeftWidth), pl = parseFloat(cs.paddingLeft);
  const bt = parseFloat(cs.borderTopWidth), pt = parseFloat(cs.paddingTop);
  return { textLeft: r.left + bl + pl, textTop: r.top + bt + pt, rawLeft: r.left, rawTop: r.top };
});
const dx = +(edit.textLeft - read.left).toFixed(1);
const dy = +(edit.textTop - read.top).toFixed(1);
console.log(JSON.stringify({ read, edit, dx, dy, okX: Math.abs(dx) <= 1.5, okY: Math.abs(dy) <= 2.5 }));
await browser.close();
