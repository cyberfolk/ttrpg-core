import puppeteer from 'puppeteer-core';
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE='http://localhost:5175/ttrpg-core';
const OUT='C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';
const seed={version:2,exportedAt:0,characters:[{id:'c1',name:'Aragorn',deletedAt:null}],groups:[],transactions:[]};
const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});
const p=await b.newPage();
await p.setViewport({width:1000,height:900,deviceScaleFactor:4});
await p.evaluateOnNewDocument(s=>localStorage.setItem('ttrpg-reputation-state',JSON.stringify(s)),seed);
await p.goto(`${BASE}/personaggio/c1`,{waitUntil:'networkidle0'});
await new Promise(r=>setTimeout(r,500));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const h=async()=>p.evaluate(()=>{const it=[...document.querySelectorAll('.led__item')].find(i=>/Razza/.test(i.textContent));return it.getBoundingClientRect().height;});
const readH=await h();
// zoom rep item
const rep=await p.evaluateHandle(()=>[...document.querySelectorAll('.led__item')].find(i=>i.querySelector('.led__repchip')));
await rep.asElement().screenshot({path:`${OUT}/z-rep-fixed.png`});
// open razza
const razza=await p.$('.led__item .led__val--edit');
await razza.click(); await wait(300);
const editH=await h();
await p.screenshot({path:`${OUT}/c-razza-open.png`,clip:{x:0,y:280,width:760,height:120}});
console.log(JSON.stringify({readH,editH,delta:editH-readH}));
await b.close();
