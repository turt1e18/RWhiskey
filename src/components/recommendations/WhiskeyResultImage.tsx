import type {AiSuggestionCard} from '@/lib/recommendations/v3Contract';
import WhiskeySearchPhoto from './WhiskeySearchPhoto';

/** Keep the existing reference photo flow without adding source metadata to this result. */
export default function WhiskeyResultImage({identity,onReportPhoto}:{identity:AiSuggestionCard['identity'];onReportPhoto?:()=>void}){
  return <div><WhiskeySearchPhoto identity={identity} showSource={false}/>
    <p className="-mt-3 text-xs leading-5 text-stone-700">실제 제품과 사진이 다를 수 있어요.
      {onReportPhoto&&<button type="button" onClick={onReportPhoto} className="ml-1.5 inline-flex min-h-11 items-center align-middle font-semibold text-[#2d2017] underline underline-offset-2">다른 병 사진인가요?</button>}</p>
  </div>;
}
