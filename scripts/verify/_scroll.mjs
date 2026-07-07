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
// apri editor Classe, poi la tendina livello (20 voci)
const btns=await p.$$('.led__item .led__val--edit');
await btns[1].click(); await w(300);
await p.evaluate(()=>document.querySelector('.led__mc .isel__trigger').click());
await w(300);
// scroll dentro il popover
const res=await p.evaluate(()=>{
  const pop=document.querySelector('.isel__pop');
  if(!pop) return {open:false};
  const before=pop.scrollTop;
  pop.scrollTop=120;
  pop.dispatchEvent(new Event('scroll',{bubbles:true}));
  return {open:!!document.querySelector('.isel__pop'), before, after:document.querySelector('.isel__pop')?.scrollTop, scrollable: pop.scrollHeight>pop.clientHeight};
});
console.log(JSON.stringify(res));
await b.close();
