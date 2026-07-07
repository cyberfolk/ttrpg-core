import puppeteer from 'puppeteer-core';
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE='http://localhost:5175/ttrpg-core';
const OUT='C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';
const seed={version:2,exportedAt:0,
  characters:[{id:'c1',name:'Aragorn',deletedAt:null}],
  groups:[{id:'gr1',name:'La Gilda',type:'Gilda',memberIds:[],deletedAt:null}],
  transactions:[]};
const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});
const p=await b.newPage();
await p.setViewport({width:900,height:800,deviceScaleFactor:2});
await p.evaluateOnNewDocument(s=>localStorage.setItem('ttrpg-reputation-state',JSON.stringify(s)),seed);
const w=ms=>new Promise(r=>setTimeout(r,ms));
await p.goto(`${BASE}/personaggio/c1`,{waitUntil:'networkidle0'}); await w(500);
let el=await p.$('.led'); await el.screenshot({path:`${OUT}/m1-char.png`});
await p.goto(`${BASE}/gruppo/gr1`,{waitUntil:'networkidle0'}); await w(500);
el=await p.$('.led'); if(el) await el.screenshot({path:`${OUT}/m2-group.png`});
else console.log('NO .led on group');
// apri picker Tag sul personaggio
await p.goto(`${BASE}/personaggio/c1`,{waitUntil:'networkidle0'}); await w(400);
await p.evaluate(()=>{const rows=[...document.querySelectorAll('.m2m')];const tag=rows.find(r=>/Tag/.test(r.textContent));tag.querySelector('.m2m__addline').click();});
await w(400);
await p.screenshot({path:`${OUT}/m3-tag-picker.png`,fullPage:false});
console.log('done');
await b.close();
