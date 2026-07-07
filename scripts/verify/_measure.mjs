import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5175/ttrpg-core';
const seed = { version: 2, exportedAt: 0, characters: [{ id: 'c1', name: 'Aragorn', deletedAt: null }], groups: [], transactions: [] };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 900 });
await page.evaluateOnNewDocument((s) => localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s)), seed);
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 500));

const data = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.led__item')];
  const repItem = items.find((it) => it.querySelector('.led__repchip'));
  const chipWrap = repItem.querySelector('.led__repchip');
  const chip = repItem.querySelector('.ds-score');
  const k = repItem.querySelector('.led__k');
  const r = (el) => { const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, h: b.height }; };
  const cs = (el) => { const s = getComputedStyle(el); return { pt: s.paddingTop, pb: s.paddingBottom, lh: s.lineHeight, h: s.height, display: s.display, ai: s.alignItems }; };
  return {
    item: r(repItem), itemCS: { ai: getComputedStyle(repItem).alignItems, lh: getComputedStyle(repItem).lineHeight },
    chipWrap: r(chipWrap), chip: r(chip), k: r(k),
    chipCS: cs(chip), wrapCS: cs(chipWrap),
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
