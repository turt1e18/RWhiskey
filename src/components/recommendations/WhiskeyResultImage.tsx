import type {AiSuggestionCard} from '@/lib/recommendations/v3Contract';
import WhiskeySearchPhoto from './WhiskeySearchPhoto';

/** Keep the existing reference photo flow without adding source metadata to this result. */
export default function WhiskeyResultImage({identity}:{identity:AiSuggestionCard['identity']}){
  return <div><WhiskeySearchPhoto identity={identity} showSource={false}/>
    <p className="-mt-3 text-xs leading-5 text-stone-700">실제 제품과 사진이 다를 수 있어요.</p>
  </div>;
}
