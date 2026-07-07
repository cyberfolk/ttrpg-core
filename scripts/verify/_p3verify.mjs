import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5174/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';

const seed = {
  version: 3,
  exportedAt: 0,
  characters: [
    {
      id: 'c1', name: 'Aragorn', deletedAt: null,
      isPg: true, raceId: null, classLevels: [], alignment: '', playerId: null, tagIds: [],
      notes: 'Mercenario riservato, con un debito verso la **Gilda dei Velati**.',
    },
  ],
  groups: [
    {
      id: 'g1', name: 'La Compagnia', type: 'Fazione', memberIds: ['c1'], deletedAt: null,
      seat: '', guideId: null, motto: '', tagIds: [],
      notes: "Fondata dopo la **Caduta di Emberfall**.",
    },
  ],
  transactions: [],
  tags: [],
  players: [],
  races: [],
  classes: [],
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 1000, deviceScaleFactor: 2 });

const consoleErrors = [];
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', (err) => consoleErrors.push(String(err)));

// Only seed once: evaluateOnNewDocument reruns on every navigation/reload,
// which would otherwise clobber edits made during the test on each reload.
await page.evaluateOnNewDocument((s) => {
  if (localStorage.getItem('ttrpg-reputation-state') === null) {
    localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s));
  }
}, seed);

// --- Character profile: default tab is "note" ---
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 500));
const charNotesHtml = await page.evaluate(() => document.querySelector('.notes__md')?.innerHTML || '');
console.log('--- character notes rendered (before edit) ---');
console.log(charNotesHtml);
console.log('bold present?', charNotesHtml.includes('<strong>') ? 'YES' : 'NO (REGRESSION)');
await page.screenshot({ path: `${OUT}/p3-character-notes.png` });

// Drive edit: click pencil, change textarea, click Fatto
await page.evaluate(() => document.querySelector('.notes__pencil')?.click());
await new Promise((r) => setTimeout(r, 200));
await page.evaluate(() => {
  const ta = document.querySelector('.notes__ta');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(ta, 'Nota modificata: **debito saldato**.');
  ta.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 200));
const doneClicked = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.notes button')];
  const btn = btns.find((b) => b.textContent.includes('Fatto'));
  btn?.click();
  return !!btn;
});
await new Promise((r) => setTimeout(r, 300));
const charNotesAfter = await page.evaluate(() => document.querySelector('.notes__md')?.innerHTML || '');
console.log('--- character notes rendered (after edit) ---');
console.log(charNotesAfter, 'doneClicked:', doneClicked);

// Reload and check persistence
await page.reload({ waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 500));
const charNotesReload = await page.evaluate(() => document.querySelector('.notes__md')?.innerHTML || '');
const lsAfter = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('ttrpg-reputation-state'));
  return s.characters.find((c) => c.id === 'c1').notes;
});
console.log('--- character notes after reload ---');
console.log(charNotesReload);
console.log('localStorage notes value:', lsAfter);
console.log('persisted?', lsAfter.includes('debito saldato') ? 'YES' : 'NO (REGRESSION)');

// --- Group profile: default tab is "note" ---
await page.goto(`${BASE}/gruppo/g1`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 500));
const groupNotesHtml = await page.evaluate(() => document.querySelector('.notes__md')?.innerHTML || '');
console.log('--- group notes rendered (before edit) ---');
console.log(groupNotesHtml);
console.log('bold present?', groupNotesHtml.includes('<strong>') ? 'YES' : 'NO (REGRESSION)');
await page.screenshot({ path: `${OUT}/p3-group-notes.png` });

await page.evaluate(() => document.querySelector('.notes__pencil')?.click());
await new Promise((r) => setTimeout(r, 200));
await page.evaluate(() => {
  const ta = document.querySelector('.notes__ta');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(ta, 'Alleanza rinnovata con i **Mercanti d\'Ottone**.');
  ta.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 200));
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.notes button')];
  const btn = btns.find((b) => b.textContent.includes('Fatto'));
  btn?.click();
});
await new Promise((r) => setTimeout(r, 300));

await page.reload({ waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 500));
const groupNotesReload = await page.evaluate(() => document.querySelector('.notes__md')?.innerHTML || '');
const lsGroupAfter = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('ttrpg-reputation-state'));
  return s.groups.find((g) => g.id === 'g1').notes;
});
console.log('--- group notes after reload ---');
console.log(groupNotesReload);
console.log('localStorage notes value:', lsGroupAfter);
console.log('persisted?', lsGroupAfter.includes('rinnovata') ? 'YES' : 'NO (REGRESSION)');

console.log('--- console errors ---');
console.log(consoleErrors.length ? consoleErrors : 'NONE');

await browser.close();
