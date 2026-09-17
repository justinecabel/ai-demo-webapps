import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {inferCategory,automaticCategories} from '../backend/lib/categories.mjs';
import {publicSite} from '../backend/lib/import-policy.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const manifestPath=process.argv[2];
if(!manifestPath)throw new Error('Supply a complete Sites inventory JSON manifest.');
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
if(manifest.complete!==true||!Array.isArray(manifest.items))throw new Error('Only a complete Sites inventory is accepted.');
const outputDirectory=resolve(process.argv[3] || resolve(root,'dist'));
const assets=resolve(outputDirectory,'assets');await mkdir(assets,{recursive:true});
const sites=[];const seen=new Set();
for(const item of manifest.items){
  const site=publicSite(item);if(!site)continue;
  if(seen.has(site.source))throw new Error('Duplicate Sites inventory entry.');seen.add(site.source);
  const categoryId=inferCategory(site);
  const categoryName=automaticCategories.find(([id])=>id===categoryId)[1];
  const imagePath=resolve(assets,`${site.source}.jpg`);
  let preview='';
  try{await readFile(imagePath);preview=`./assets/${site.source}.jpg`;}catch{}
  try{
    const url=new URL(item.screenshot_url);
    if(url.protocol==='https:'&&!url.username&&!url.password&&url.hostname.endsWith('.oaiusercontent.com')){
      const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(20000)});
      if(response.ok&&response.headers.get('content-type')?.startsWith('image/jpeg')){
        const reader=response.body.getReader();let total=0;const chunks=[];
        while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>256000){await reader.cancel();throw new Error('Thumbnail too large.');}chunks.push(value);}
        const bytes=Buffer.concat(chunks);
        if(bytes[0]===255&&bytes[1]===216&&bytes.at(-2)===255&&bytes.at(-1)===217){await writeFile(imagePath,bytes);preview=`./assets/${site.source}.jpg`;}
      }
    }
  }catch{}
  sites.push({id:site.source,title:site.title,url:site.url,category_id:categoryId,category_name:categoryName,preview_url:preview});
}
const ids=new Set(sites.map(site=>site.category_id));
const data={categories:automaticCategories.filter(([id])=>ids.has(id)).map(([id,name])=>({id,name})),sites};
// JSON encoded as an inert string, so titles cannot become executable code.
const serialized=JSON.stringify(JSON.stringify(data)).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const output=`// Generated from public Sites metadata. No credentials or signed URLs.\nwindow.SHOWCASE_CATALOG = JSON.parse(${serialized});\n`;
const target=resolve(outputDirectory,'catalog.js');let old='';try{old=await readFile(target,'utf8');}catch{}
if(old!==output)await writeFile(target,output);
console.log(JSON.stringify({sites:sites.length,categories:data.categories.length,catalogChanged:old!==output}));
