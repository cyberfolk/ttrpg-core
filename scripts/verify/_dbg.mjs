import puppeteer from 'puppeteer-core';
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE='http://localhost:5175/ttrpg-core';
const seed={version:2,exportedAt:0,characters:[{id:'c1',name:'Aragorn',deletedAt:null}],groups:[],transactions:[]};
const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});
const p=await b.newPage();
p.on('console',m=>console.log('PAGE:',m.text()));
await p.setViewport({width:1000,height:900});
await p.evaluateOnNewDocument(s=>localStorage.setItem('ttrpg-reputation-state',JSON.stringify(s)),seed);
await p.goto(`${BASE}/personaggio/c1`,{waitUntil:'networkidle0'});
const w=ms=>new Promise(r=>setTimeout(r,ms));
await w(500);
const before=await p.evaluate(()=>({triggers:document.querySelectorAll('.isel__trigger').length}));
await p.evaluate(()=>[...document.querySelectorAll('.led__item')].find(i=>/Razza/.test(i.textContent)).querySelector('.led__val--edit').click());
await w(500);
const after=await p.evaluate(()=>({
  triggers:document.querySelectorAll('.isel__trigger').length,
  pops:document.querySelectorAll('.isel__pop').length,
  razzaItemHTML:[...document.querySelectorAll('.led__item')].find(i=>/Razza/.test(i.textContent)).innerHTML.slice(0,300),
}));
console.log(JSON.stringify({before,after},null,1));
await b.close();
