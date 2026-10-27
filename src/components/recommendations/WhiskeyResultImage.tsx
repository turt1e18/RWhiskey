import type {AiSuggestionCard} from '@/lib/recommendations/v3Contract';
import WhiskeySearchPhoto from './WhiskeySearchPhoto';

/** Keep the existing reference photo flow without adding source metadata to this result. */
export default function WhiskeyResultImage({identity}:{identity:AiSuggestionCard['identity']}){
  return <WhiskeySearchPhoto identity={identity} showSource={false}/>;
}
