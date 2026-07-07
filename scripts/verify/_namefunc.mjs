import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173/ttrpg-core';
const seed = {
  version: 3, exportedAt: 0,
  characters: [{ id: 'c1', name: 'Aldric il Giusto', deletedAt: null,
    isPg: true, raceId: null, classLevels: [], alignment: '', playerId: null, tagIds: [], notes: '' }],
  groups: [], transactions: [], tags: [], players: [], races: [], classes: [],
};
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 900 });
await page.evaluateOnNewDocument((s) => localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s)), seed);

const readName = () => page.evaluate(() => JSON.parse(localStorage.getItem('ttrpg-reputation-state')).characters[0].name);

await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 400));

// BLUR commit
await page.click('.rep-profile__nameedit');
await new Promise(r => setTimeout(r, 150));
await page.click('.rep-profile__edit', { clickCount: 3 });
await page.type('.rep-profile__edit', 'Nome Da Blur');
await page.mouse.click(500, 700); // blur click outside
await new Promise(r => setTimeout(r, 300));
const afterBlur = await readName();

// ESCAPE cancel
await page.click('.rep-profile__nameedit');
await new Promise(r => setTimeout(r, 150));
await page.click('.rep-profile__edit', { clickCount: 3 });
await page.type('.rep-profile__edit', 'NON DEVE SALVARSI');
await page.keyboard.press('Escape');
await new Promise(r => setTimeout(r, 300));
const afterEscape = await readName();

console.log(JSON.stringify({
  afterBlur, blurOk: afterBlur === 'Nome Da Blur',
  afterEscape, escapeOk: afterEscape === 'Nome Da Blur',
}));
await browser.close();
