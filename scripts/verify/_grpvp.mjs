import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';
const seed = { version:3, exportedAt:0, characters:[{id:'c1',name:'Aldric',deletedAt:null,isPg:true,raceId:null,classLevels:[],alignment:'',playerId:null,tagIds:[],notes:''}], groups:[{id:'g1',name:'La Guardia Cittadina',type:'fazione',memberIds:['c1'],deletedAt:null,seat:'Valdûr',guideId:'c1',motto:'Fino alla fine',tagIds:[],notes:''}], transactions:[],tags:[],players:[],races:[],classes:[] };
const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width:1100, height:900, deviceScaleFactor:2 });
await page.evaluateOnNewDocument((s)=>localStorage.setItem('ttrpg-reputation-state',JSON.stringify(s)), seed);
await page.goto(`${BASE}/gruppo/g1`,{waitUntil:'networkidle0'});
await new Promise(r=>setTimeout(r,400));
// is drawer visible in viewport?
const drawer = await page.evaluate(()=>{
  const d = document.querySelector('.rep-drawer, [class*="drawer"]');
  if(!d) return {found:false};
  const r = d.getBoundingClientRect(); const cs=getComputedStyle(d);
  return {found:true, cls:d.className, left:r.left, right:r.right, vw:innerWidth, transform:cs.transform, visibility:cs.visibility, inViewport: r.left < innerWidth && r.right > 0};
});
console.log(JSON.stringify(drawer));
await page.screenshot({ path: `${OUT}/grp-viewport.png` }); // NON fullPage
await browser.close();
