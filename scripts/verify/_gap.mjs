import puppeteer from 'puppeteer-core';
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE='http://localhost:5175/ttrpg-core';
const seed={version:2,exportedAt:0,characters:[{id:'c1',name:'Aragorn',deletedAt:null}],groups:[],transactions:[]};
const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});
const p=await b.newPage(); await p.setViewport({width:900,height:800});
await p.evaluateOnNewDocument(s=>localStorage.setItem('ttrpg-reputation-state',JSON.stringify(s)),seed);
await p.goto(`${BASE}/personaggio/c1`,{waitUntil:'networkidle0'});
await new Promise(r=>setTimeout(r,400));
const d=await p.evaluate(()=>{
  const m=[...document.querySelectorAll('.m2m')];
  const grp=m.find(x=>/Gruppi/.test(x.textContent));
  const tag=m.find(x=>/Tag/.test(x.textContent));
  const grpTags=grp.querySelector('.m2m__tags').getBoundingClientRect();
  const grpAdd=grp.querySelector('.m2m__addline').getBoundingClientRect();
  const tagRow=tag.getBoundingClientRect();
  const cs=getComputedStyle(tag);
  return {
    grpTagsBottom:+grpTags.bottom.toFixed(1),
    grpAdd:{top:+grpAdd.top.toFixed(1),h:+grpAdd.height.toFixed(1)},
    tagTop:+tagRow.top.toFixed(1),
    tagMarginTop:cs.marginTop,
    gapTagsToTagRow:+(tagRow.top-grpTags.bottom).toFixed(1),
  };
});
console.log(JSON.stringify(d,null,1));
await b.close();
