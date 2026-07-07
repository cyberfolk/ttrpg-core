import puppeteer from 'puppeteer-core';
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE='http://localhost:5175/ttrpg-core';
const OUT='C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';
const seed={version:2,exportedAt:0,characters:[{id:'c1',name:'Aragorn',deletedAt:null}],
  groups:[{id:'gr1',name:'La Gilda',type:'Gilda',memberIds:[],deletedAt:null}],transactions:[]};
const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});
const p=await b.newPage(); await p.setViewport({width:900,height:800,deviceScaleFactor:2});
await p.evaluateOnNewDocument(s=>localStorage.setItem('ttrpg-reputation-state',JSON.stringify(s)),seed);
const w=ms=>new Promise(r=>setTimeout(r,ms));
await p.goto(`${BASE}/gruppo/gr1`,{waitUntil:'networkidle0'}); await w(500);
let el=await p.$('.led'); await el.screenshot({path:`${OUT}/g1-group-fields.png`});
// apri Tipo (combo) e crea "Culto"
await p.evaluate(()=>{const it=[...document.querySelectorAll('.led__item')].find(i=>/Tipo/.test(i.textContent));it.querySelector('.led__val--edit').click();});
await w(300);
const hasSearch=await p.evaluate(()=>!!document.querySelector('.isel__search-input'));
await p.screenshot({path:`${OUT}/g2-tipo-combo.png`});
await p.evaluate(()=>{const inp=document.querySelector('.isel__search-input');inp.value='Culto';inp.dispatchEvent(new Event('input',{bubbles:true}));});
await w(200);
await p.evaluate(()=>document.querySelector('.isel__opt--create')?.click());
await w(200);
const tipoVal=await p.evaluate(()=>{const it=[...document.querySelectorAll('.led__item')].find(i=>/Tipo/.test(i.textContent));return it.querySelector('.led__val--edit')?.textContent.trim();});
// personaggio non rotto
await p.goto(`${BASE}/personaggio/c1`,{waitUntil:'networkidle0'}); await w(400);
const charOk=await p.evaluate(()=>{const t=document.body.textContent;return /Razza/.test(t)&&/Livello/.test(t);});
console.log(JSON.stringify({hasSearch,createdTipo:tipoVal,charOk}));
await b.close();
