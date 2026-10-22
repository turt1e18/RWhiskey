import type { AiSuggestionCard } from './v3Contract';

export interface WhiskeyReferencePhoto { url:string; sourceUrl:string; sourceTitle:string; fallbackUrl?:string }

/** Only public product identity goes to image search; never preferences, notes or account data. */
export function whiskeyPhotoQuery(p:AiSuggestionCard['identity']):string {
  return [p.brand,p.expression,p.edition,p.bottler,p.batch?`batch ${p.batch}`:null,
    p.vintageYear?`vintage ${p.vintageYear}`:null,p.caskNumber?`cask ${p.caskNumber}`:null,
    p.abv!=null?`${p.abv}%`:null].filter(Boolean).join(' ').replace(/\s+/g,' ').trim().slice(0,1500);
}

function publicHttps(value:unknown):value is string {
  if(typeof value!=='string' || value.length>2048 || value!==value.trim())return false;
  try {const u=new URL(value);return u.protocol==='https:' && !u.username && !u.password &&
    (!u.port || u.port==='443') && /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(u.hostname) &&
    !/\.(local|internal|localhost)$/i.test(u.hostname) && !/^\d+(?:\.\d+){3}$/.test(u.hostname);
  }catch{return false;}
}

export function parseWhiskeyPhoto(value:unknown):WhiskeyReferencePhoto|null {
  if(!value || typeof value!=='object' || Array.isArray(value))return null;
  const p=value as Record<string,unknown>;
  return publicHttps(p.url) && publicHttps(p.sourceUrl) && typeof p.sourceTitle==='string' &&
    p.sourceTitle.trim().length>0 && p.sourceTitle.length<=300 && !/[\u0000-\u001f\u007f]/.test(p.sourceTitle)
    ? {url:p.url,sourceUrl:p.sourceUrl,sourceTitle:p.sourceTitle,
      ...(publicHttps(p.fallbackUrl) && p.fallbackUrl!==p.url?{fallbackUrl:p.fallbackUrl}:{})} : null;
}
