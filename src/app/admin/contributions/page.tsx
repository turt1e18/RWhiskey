"use client";
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ApiResponseError} from '@/api/apiClient';
import {contributionAdminApi,type AdminSummary,type ContributionStatus} from '@/api/contributionApi';
import {PaperPage} from '@/components/PaperPage';
import {fieldLabel,statusLabel} from '@/lib/contribution/contribution';
import {useAuthStore} from '@/store/authStore';

const tabs:{value:ContributionStatus|undefined;label:string}[]=[{value:undefined,label:'처리할 것 전체'},{value:'SUBMITTED',label:'새로 들어옴'},
  {value:'NEEDS_INFO',label:'추가 정보 대기'},{value:'HELD',label:'보류'},{value:'DECIDED',label:'반영 대기'},{value:'APPLY_FAILED',label:'반영 실패'}];
const kindLabel={CORRECTION:'정정',NEW_BOTTLE:'신규 등록',DUPLICATE:'중복',OTHER:'기타'};

/** Operator list. The server decides access; a 403 is shown as "not found" so the page reveals nothing. */
export default function AdminContributionsPage(){
  const {isAuthenticated,isInitialized}=useAuthStore();
  const [tab,setTab]=useState<ContributionStatus|undefined>(undefined);
  const [list,setList]=useState<AdminSummary[]|null>(null);
  const [state,setState]=useState<'ok'|'hidden'|'error'>('ok');
  useEffect(()=>{
    if(!isAuthenticated)return;
    setList(null);
    contributionAdminApi.list(tab).then(l=>{setList(l);setState('ok');})
      .catch(e=>setState(e instanceof ApiResponseError&&(e.status===403||e.status===401)?'hidden':'error'));
  },[tab,isAuthenticated]);

  if(!isInitialized)return <PaperPage title="불러오는 중"><p role="status" className="text-sm">불러오는 중…</p></PaperPage>;
  if(!isAuthenticated||state==='hidden')return <PaperPage title="페이지를 찾을 수 없어요"><p className="text-sm">주소를 다시 확인해 주세요.</p></PaperPage>;
  return <PaperPage title="제보 확인" wide back={{href:'/main',label:'Home'}}>
    <div role="tablist" aria-label="상태" className="flex flex-wrap gap-2">{tabs.map(t=><button key={t.label} role="tab" aria-selected={tab===t.value}
      onClick={()=>setTab(t.value)} className={`min-h-11 rounded-sm border px-3 text-[13px] ${tab===t.value?'border-[#2d2017] bg-[#4a3728]/10 font-bold':'border-[#4a3728]/30'}`}>{t.label}</button>)}</div>
    {state==='error'&&<p role="alert" className="mt-4 text-sm text-red-800">불러오지 못했어요. 다시 시도하세요.</p>}
    {!list&&state==='ok'&&<p role="status" className="mt-4 text-sm">불러오는 중…</p>}
    {list&&list.length===0&&<p className="mt-4 text-sm">처리할 제보가 없어요.</p>}
    {list&&list.length>0&&<ul className="mt-4 flex flex-col gap-2">{list.map(c=><li key={c.id}>
      <Link href={`/admin/contributions/${c.id}`} className="flex min-h-11 flex-col gap-0.5 rounded-sm border border-[#4a3728]/25 bg-white/40 p-3 hover:border-[#2d2017]">
        <span className="text-sm font-semibold">{c.targetName??'이름 없음'} <span className="font-normal text-stone-600">· {kindLabel[c.kind]} · {statusLabel[c.status]}</span></span>
        <span className="text-xs text-stone-700">{c.fields.map(fieldLabel).join(', ')}</span>
        <span className="text-xs text-stone-600">{new Date(c.createdAt).toLocaleString('ko-KR')}{c.sameTargetOpen>0?` · 같은 병 대기 ${c.sameTargetOpen}건 (제보자 ${c.distinctReporters}명)`:''}</span>
      </Link></li>)}</ul>}
  </PaperPage>;
}
