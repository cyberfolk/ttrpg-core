import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173/ttrpg-core';
const seed = {
  version: 3, exportedAt: 0,
  characters: [{ id: 'c1', name: 'Aldric', deletedAt: null,
    isPg: true, raceId: null, classLevels: [], alignment: '', playerId: null, tagIds: [],
    notes: '# Titolo\nCorpo delle note.' }],
  groups: [], transactions: [], tags: [], players: [], races: [], classes: [],
};
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 800 });
await page.evaluateOnNewDocument((s) => localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s)), seed);
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 400));
const editing = () => page.$('.notes__ta').then(Boolean);
await page.click('.notes__md');
await new Promise(r => setTimeout(r, 200));
const afterBodyClick = await editing();
await page.hover('.notes__view');
await page.click('.notes__pencil');
await new Promise(r => setTimeout(r, 200));
const afterPencil = await editing();
console.log(JSON.stringify({ afterBodyClick, afterPencil, ok: afterBodyClick === false && afterPencil === true }));
await browser.close();
