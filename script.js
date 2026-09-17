'use strict';
let rows=[...document.querySelectorAll('[data-site]')];
const filters=document.querySelector('#category-filters');
const previewFiles={mileway:'site-3.jpg',daymark:'site-1.jpg',signal:'site-2.jpg',visibility:'site-4.jpg','pdf-mail-merge':'site-5.jpg'};
let selected='all';
let categories=[...new Map(rows.map(row=>[row.dataset.category,{id:row.dataset.category,name:row.dataset.categoryName}])).values()];
const local=['localhost','127.0.0.1'].includes(location.hostname);
let backend=window.SHOWCASE_CONFIG?.backendUrl || '';
try{const url=new URL(backend);if(url.protocol!=='https:'&&!(local&&url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))backend='';else backend=url.origin;}catch{backend='';}
if(backend){const admin=document.querySelector('#admin-link');admin.href=backend;admin.target='_blank';admin.rel='noopener noreferrer';admin.hidden=false;}

const popup=document.createElement('div');popup.id='site-preview';popup.className='hover-preview';popup.setAttribute('role','tooltip');popup.hidden=true;
const popupImage=document.createElement('img');popupImage.width=1200;popupImage.height=750;popupImage.referrerPolicy='no-referrer';
const popupTitle=document.createElement('strong');
const popupStatus=document.createElement('span');popupStatus.className='preview-status';popupStatus.textContent='Preview unavailable';popupStatus.hidden=true;
popup.append(popupImage,popupStatus,popupTitle);document.body.append(popup);
let activeRow=null,pinnedRow=null,pointerAnchor=null,showTimer,hideTimer,dismissedRow=null;
function hidePreview(){clearTimeout(showTimer);clearTimeout(hideTimer);popup.hidden=true;activeRow?.querySelector('.site-name').removeAttribute('aria-describedby');activeRow?.querySelector('.preview-toggle')?.setAttribute('aria-expanded','false');activeRow=null;pinnedRow=null;pointerAnchor=null;}
function positionPreview(row){
  const rect=row.getBoundingClientRect(),gap=12;
  const width=Math.min(344,innerWidth-24),height=popup.getBoundingClientRect().height || width*750/1200+51;
  let left=pointerAnchor ? pointerAnchor.x+gap : rect.right-width-18;
  let top=pointerAnchor ? pointerAnchor.y+gap : rect.bottom+gap;
  if(pointerAnchor&&left+width>innerWidth-12)left=pointerAnchor.x-width-gap;
  if(top+height>innerHeight-12)top=(pointerAnchor ? pointerAnchor.y : rect.top)-height-gap;
  left=Math.max(12,Math.min(left,innerWidth-width-12));top=Math.max(12,Math.min(top,innerHeight-height-12));
  popup.style.width=`${width}px`;popup.style.left=`${left}px`;popup.style.top=`${top}px`;
}
function showPreview(row,anchor=null){
  if(row.hidden||dismissedRow===row)return;
  hidePreview();activeRow=row;pointerAnchor=anchor;
  const title=row.querySelector('.site-name').textContent.trim();
  popupTitle.textContent=title;popupImage.alt=`${title} website preview`;
  const source=row.dataset.preview;
  popupImage.hidden=!source;popupStatus.hidden=Boolean(source);
  popupImage.onload=()=>{if(activeRow===row){popupImage.hidden=false;popupStatus.hidden=true;}};
  popupImage.onerror=()=>{if(activeRow===row){popupImage.hidden=true;popupStatus.hidden=false;}};
  if(source)popupImage.src=source;else popupImage.removeAttribute('src');
  popup.hidden=false;positionPreview(row);row.querySelector('.site-name').setAttribute('aria-describedby',popup.id);row.querySelector('.preview-toggle')?.setAttribute('aria-expanded','true');
}
function prepareRow(row){
  if(row.dataset.prepared)return;row.dataset.prepared='true';
  if(previewFiles[row.dataset.site])row.dataset.preview=`./assets/${previewFiles[row.dataset.site]}`;
  let hoverPoint=null;
  row.addEventListener('pointerenter',event=>{if(event.pointerType==='touch')return;hoverPoint={x:event.clientX,y:event.clientY};clearTimeout(hideTimer);showTimer=setTimeout(()=>showPreview(row,hoverPoint),180);});
  row.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;hoverPoint={x:event.clientX,y:event.clientY};if(activeRow===row&&pointerAnchor&&!pinnedRow){pointerAnchor=hoverPoint;positionPreview(row);}});
  row.addEventListener('pointerleave',()=>{clearTimeout(showTimer);dismissedRow=null;if(pinnedRow!==row)hideTimer=setTimeout(hidePreview,200);});
  row.addEventListener('focusin',event=>{if(!event.target.closest('.preview-toggle'))showPreview(row);});
  row.addEventListener('focusout',()=>{hideTimer=setTimeout(()=>{if(pinnedRow!==row&&!row.contains(document.activeElement)){dismissedRow=null;hidePreview();}},0);});
  const button=document.createElement('button');button.className='preview-toggle';button.type='button';button.append(createIcon('image'));button.setAttribute('aria-label',`Preview ${row.querySelector('.site-name').textContent.trim()}`);button.setAttribute('aria-expanded','false');
  button.addEventListener('pointerenter',()=>clearTimeout(showTimer));
  button.addEventListener('click',()=>{if(pinnedRow===row&&!popup.hidden){hidePreview();}else{dismissedRow=null;showPreview(row);pinnedRow=row;}});row.append(button);
}
function createIcon(name){const icon=document.createElement('i');icon.dataset.lucide=name;icon.setAttribute('aria-hidden','true');return icon;}
function renderIcons(){window.lucide?.createIcons({icons:{Link:window.lucide.Link,Image:window.lucide.Image},attrs:{'aria-hidden':'true','focusable':'false','stroke-width':1.75}});}
rows.forEach(prepareRow);renderIcons();
popup.addEventListener('pointerenter',()=>{clearTimeout(hideTimer);});popup.addEventListener('pointerleave',()=>{if(!pinnedRow)hidePreview();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){dismissedRow=activeRow;hidePreview();}});
document.addEventListener('pointerdown',event=>{if(!popup.contains(event.target)&&!event.target.closest('.preview-toggle'))hidePreview();});
window.addEventListener('scroll',hidePreview,{passive:true});window.addEventListener('resize',hidePreview);window.addEventListener('blur',()=>{if(!pinnedRow)hidePreview();});

function filterRows(){
  hidePreview();let count=0;
  rows.forEach(row=>{row.hidden=selected!=='all'&&row.dataset.category!==selected;if(!row.hidden)count++;});
  document.querySelector('#visible-count').textContent=`${count} ${count===1?'site':'sites'}`;
  document.querySelector('#empty-message').hidden=count>0;
  filters.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===selected)));
}
function renderFilters(){
  if(selected!=='all'&&!categories.some(category=>category.id===selected))selected='all';
  filters.replaceChildren(...[{id:'all',name:'All'},...categories].map(category=>{
    const button=document.createElement('button');button.type='button';button.dataset.category=category.id;button.textContent=category.name;
    button.addEventListener('click',()=>{selected=category.id;filterRows();});return button;
  }));filterRows();
}
function safeLink(value){try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}}
function catalogRow(site){
  let row=rows.find(row=>row.dataset.site===site.id);
  if(!row){
    row=document.createElement('article');row.className='site-row';row.dataset.site=site.id;
    const name=document.createElement('a');name.className='site-name';name.target='_blank';name.rel='noopener noreferrer';
    const category=document.createElement('span');category.className='site-category';
    row.append(name,category);document.querySelector('#empty-message').before(row);
  }
  const url=safeLink(site.url);if(!url){row.remove();return null;}
  const name=row.querySelector('.site-name');
  const icon=createIcon('link');
  name.replaceChildren(icon,document.createTextNode(site.title));name.href=url;name.setAttribute('aria-label',`Open ${site.title} in a new tab`);
  row.dataset.category=site.category_id || 'uncategorized';row.querySelector('.site-category').textContent=site.category_name || 'Uncategorized';
  prepareRow(row);
  if(typeof site.preview_url==='string'&&/^\.\/assets\/[a-zA-Z0-9_-]+\.jpg$/.test(site.preview_url))row.dataset.preview=site.preview_url;
  if(site.has_preview&&backend)row.dataset.preview=`${backend}/api/previews/${encodeURIComponent(site.id)}`;
  return row;
}
function applyCatalog(data){
  if(!Array.isArray(data?.categories)||!Array.isArray(data?.sites))throw new Error('Invalid catalog');
  const sites=data.sites.filter(site=>typeof site.id==='string'&&typeof site.title==='string'&&safeLink(site.url));
  categories=data.categories.filter(category=>typeof category.id==='string'&&typeof category.name==='string').map(category=>({id:category.id,name:category.name}));
  const ids=new Set(sites.map(site=>site.id));rows.filter(row=>!ids.has(row.dataset.site)).forEach(row=>row.remove());
  rows=sites.map(catalogRow).filter(Boolean);
  if(rows.some(row=>row.dataset.category==='uncategorized'))categories.push({id:'uncategorized',name:'Uncategorized'});
  document.querySelector('.count').textContent=rows.length;document.querySelector('#service-status').textContent='';renderIcons();renderFilters();
}
async function loadCatalog(){
  if(!backend)return;
  try{
    const response=await fetch(`${backend}/api/catalog`,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(6000)});
    if(!response.ok)throw new Error('Unavailable');const data=await response.json();
    applyCatalog(data);
  }catch{document.querySelector('#service-status').textContent='Showing saved sites.';}
}
renderFilters();if(window.SHOWCASE_CATALOG)applyCatalog(window.SHOWCASE_CATALOG);loadCatalog();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')loadCatalog();});
