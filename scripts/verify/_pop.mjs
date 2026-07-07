import puppeteer from 'puppeteer-core';
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE='http://localhost:5175/ttrpg-core';
const OUT='C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';
const seed={version:2,exportedAt:0,characters:[{id:'c1',name:'Aragorn',deletedAt:null}],groups:[],transactions:[]};
const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});
const p=await b.newPage(); await p.setViewport({width:900,height:800,deviceScaleFactor:2});
await p.evaluateOnNewDocument(s=>localStorage.setItem('ttrpg-reputation-state',JSON.stringify(s)),seed);
await p.goto(`${BASE}/personaggio/c1`,{waitUntil:'networkidle0'});
const w=ms=>new Promise(r=>setTimeout(r,ms));
await w(400);
const livTop=()=>p.evaluate(()=>{const it=[...document.querySelectorAll('.led__item')].find(i=>/Livello/.test(i.textContent));return +it.getBoundingClientRect().top.toFixed(1);});
const readLiv=await livTop();
const btns=await p.$$('.led__item .led__val--edit');
await btns[1].click(); await w(300);
const editLiv=await livTop();
const popExists=await p.evaluate(()=>!!document.querySelector('.led__mcpop'));
await p.screenshot({path:`${OUT}/p1-classe-popover.png`});
// seleziona livello 5 sul primo InlineSelect nel popover
await p.evaluate(()=>document.querySelector('.led__mcpop .isel__trigger').click()); await w(250);
await p.evaluate(()=>{const o=[...document.querySelectorAll('.isel__opt')].find(x=>x.textContent.trim()==='5');o.click();}); await w(250);
const stillOpen=await p.evaluate(()=>!!document.querySelector('.led__mcpop'));
const total=await p.evaluate(()=>document.querySelector('.led__mcpop-total')?.textContent.trim());
// click esterno chiude
await p.evaluate(()=>document.querySelector('.led h2, .led')?.click()); await w(250);
const closed=await p.evaluate(()=>!document.querySelector('.led__mcpop'));
console.log(JSON.stringify({readLiv,editLiv,deltaLiv:+(editLiv-readLiv).toFixed(1),popExists,stillOpenAfterSelect:stillOpen,total,closedOnOutside:closed}));
await b.close();
