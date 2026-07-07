import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173/ttrpg-core';
const groups = [{ id: 'g0', name: 'Gruppo A', type: 'fazione', memberIds: [], deletedAt: null, seat: '', guideId: null, motto: '', tagIds: [], notes: '' }];
const tags = [{ id: 't0', name: 'Tag A' }, { id: 't1', name: 'Tag B' }];
const seed = {
  version: 3, exportedAt: 0,
  characters: [{ id: 'c1', name: 'Aldric', deletedAt: null, isPg: true, raceId: null,
    classLevels: [], alignment: '', playerId: null, tagIds: [], notes: '' }],
  groups, transactions: [], tags, players: [], races: [], classes: [],
};
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 900 });
await page.evaluateOnNewDocument((s) => localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s)), seed);
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 400));
const adds = await page.$$('.m2m__addline');
await adds[0].click(); // Gruppi
await new Promise(r => setTimeout(r, 250));
const afterFirst = await page.$$eval('.m2m__pop', els => els.length);
await adds[1].click(); // Tag
await new Promise(r => setTimeout(r, 250));
const afterSecond = await page.$$eval('.m2m__pop', els => els.length);
console.log(JSON.stringify({ afterFirst, afterSecond, ok: afterFirst === 1 && afterSecond === 1 }));
await browser.close();
