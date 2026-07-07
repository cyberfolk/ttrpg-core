import puppeteer from 'puppeteer-core';
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE='http://localhost:5175/ttrpg-core';
const seed={version:2,exportedAt:0,characters:[{id:'c1',name:'Aragorn',deletedAt:null}],groups:[],transactions:[]};
const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});
const p=await b.newPage();
await p.setViewport({width:900,height:800});
await p.evaluateOnNewDocument(s=>localStorage.setItem('ttrpg-reputation-state',JSON.stringify(s)),seed);
await p.goto(`${BASE}/personaggio/c1`,{waitUntil:'networkidle0'});
const w=ms=>new Promise(r=>setTimeout(r,ms));
await w(400);
await p.evaluate(()=>[...document.querySelectorAll('.led__item')].find(i=>/Razza/.test(i.textContent)).querySelector('.led__val--edit').click());
await w(300);
// clic opzione 'Elfo'
await p.evaluate(()=>{const o=[...document.querySelectorAll('.isel__opt')].find(x=>x.textContent.trim()==='Elfo');o.click();});
await w(300);
const res=await p.evaluate(()=>({
  pops:document.querySelectorAll('.isel__pop').length,
  razzaVal:[...document.querySelectorAll('.led__item')].find(i=>/Razza/.test(i.textContent)).querySelector('.led__val--edit, .isel__val')?.textContent.trim(),
  editing:document.querySelectorAll('.isel__trigger').length,
}));
console.log(JSON.stringify(res));
await b.close();
