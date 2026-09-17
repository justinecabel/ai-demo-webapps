import { timingSafeEqual } from 'node:crypto';
export function syncAuthorized(header,secret){
  if(typeof secret!=='string'||secret.length<43||typeof header!=='string'||!header.startsWith('Bearer '))return false;
  const actual=Buffer.from(header.slice(7)),expected=Buffer.from(secret);
  return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
export function publicSite(item){
  if(!item||item.access_mode!=='public'||item.status!=='active')return null;
  if(typeof item.id!=='string'||!/^[a-zA-Z0-9_-]{1,128}$/.test(item.id)||typeof item.title!=='string'||!item.title.trim()||item.title.length>160)return null;
  try{
    const url=new URL(item.current_live_url);
    if(url.protocol!=='https:'||url.username||url.password||url.port||!url.hostname.endsWith('.chatgpt.site'))return null;
    return {source:item.id,title:item.title.trim(),url:url.href,description:typeof item.description==='string'?item.description.slice(0,2000):''};
  }catch{return null;}
}
export function jpegData(value){
  if(typeof value!=='string'||value.length>350000||!value.startsWith('data:image/jpeg;base64,'))return null;
  const encoded=value.slice(23);
  if(!/^[a-zA-Z0-9+/]+={0,2}$/.test(encoded))return null;
  const bytes=Buffer.from(encoded,'base64');
  return bytes.length<=256000&&bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217?value:null;
}
