import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import WhiskeyResultBasicFacts from '@/components/recommendations/WhiskeyResultBasicFacts';
import WhiskeyCollectedBottlingPanel from '@/components/recommendations/WhiskeyCollectedBottlingPanel';
import ExpectationFeedback from '@/components/recommendations/ExpectationFeedback';
import { whiskeyResultInformation } from '@/lib/recommendations/whiskeyResultInformation';
import { card, collected } from '@/lib/recommendations/whiskeyResultInformation.fixtures';
import type { AiSuggestionCard } from '@/lib/recommendations/v3Contract';
import type { WhiskeyFeedbackReason, WhiskeyFeedbackSentiment } from '@/type/ApiInterface';

export type Naming = '오늘의 한 잔' | '현재 표현' | '취향을 참고해 고른 위스키' | '바텐더의 제안';
export type Information = '수집값과 확인 전 값' | '일부 정보 없음' | '정보 충돌';
export interface NamingPreviewProps {
  naming: Naming;
  information: Information;
  mobile: boolean;
  showResultLabel: boolean;
}
const wording: Record<Naming, { title: string; introduction: string }> = {
  '오늘의 한 잔': { title: '오늘의 한 잔', introduction: '이 한 잔을 고른 이유' },
  '현재 표현': { title: '오늘의 AI 추천 결과', introduction: '오늘 권해드리는 한 잔' },
  '취향을 참고해 고른 위스키': { title: '취향을 참고해 고른 위스키', introduction: '이 한 잔을 고른 이유' },
  '바텐더의 제안': { title: '바텐더의 제안', introduction: '이 한 잔을 권하는 이유' },
};

function example(information: Information): AiSuggestionCard {
  if (information === '일부 정보 없음') return {
    ...card,
    identity: { ...card.identity, abv: null, category: null },
    collectedBottlingInformation: null,
  };
  if (information === '정보 충돌') return {
    ...card,
    collectedBottlingInformation: {
      ...collected,
      status: 'AMBIGUOUS',
      availableVolumesMl: [],
      fields: collected.fields.map((field) => ({ ...field, status: 'UNKNOWN', value: null, sources: [], reason: 'CONFLICTING_OBSERVATIONS' })),
      basicFields: collected.basicFields?.map((field) => ({ ...field, status: 'UNKNOWN', value: null, sources: [], reason: 'CONFLICTING_OBSERVATIONS' })),
    },
  };
  return { ...card, collectedBottlingInformation: collected };
}

/** Fixed, side-effect-free visual proposal. No recommendation, authentication or persistence clients. */
export function RecommendationNamingPreview({ naming, information, mobile, showResultLabel }: NamingPreviewProps) {
  const copy = wording[naming];
  const display = whiskeyResultInformation(example(information));
  const [informationStatus, setInformationStatus] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<WhiskeyFeedbackSentiment>('NEUTRAL');
  const [saved, setSaved] = useState<WhiskeyFeedbackSentiment | null>(null);
  const [reason, setReason] = useState<WhiskeyFeedbackReason>('NONE');
  const [comment, setComment] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [noteStatus, setNoteStatus] = useState<string | null>(null);

  return <main className="min-h-screen bg-[#1a120d] text-stone-100">
    <div className="mx-auto min-h-screen w-full pb-12" style={{ maxWidth: mobile ? 375 : 880 }}>
      <nav aria-label="추천 결과" className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-4">
        <button type="button" aria-label="주문서로 돌아가기" onClick={() => setNoteStatus('지금은 추천 결과 화면을 미리 보고 있어요.')}
          className="inline-flex min-h-11 items-center gap-2 text-xs text-stone-400"><ArrowLeft size={16} aria-hidden="true" />뒤로</button>
        <span className="text-xs tracking-[0.2em] text-stone-500">R-WHISKEY</span>
      </nav>
      <h1 className="sr-only">{copy.title}</h1>
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-4">
        <article className="w-full break-words rounded-sm border border-[#4a3728] bg-[#e5d5b7] p-7 text-stone-900 shadow-xl md:p-10">
          {showResultLabel && <p className="mb-3 text-xs font-semibold tracking-wide text-stone-600">{copy.title}</p>}
          <h2 className="text-[22px] font-semibold leading-snug tracking-tight md:text-2xl">Deanston 12 Year Old</h2>
          <p lang="ko" className="mt-2 text-[13px] leading-5 text-stone-700">딘스톤 12년</p>
          <figure className="relative mb-6 mt-5 flex h-64 w-full items-center justify-center overflow-hidden rounded-sm bg-[#f5ead3]">
            {/* eslint-disable-next-line @next/next/no-img-element -- local Storybook-only illustration */}
            <img src="/storybook-assets/bottle-preview.svg" alt="딘스톤 12년 카드 구성을 위한 예시 일러스트" className="h-full w-full object-contain pb-6" />
            <figcaption className="absolute inset-x-2 bottom-1 text-center text-[11px] leading-5 text-stone-600">미리보기용 제품 이미지</figcaption>
          </figure>
          <WhiskeyResultBasicFacts display={display} />
          <h3 className="mt-6 border-t border-[#4a3728]/25 pt-4 font-bold">{copy.introduction}</h3>
          <div className="mt-3 space-y-2 text-sm leading-7">
            <p>지금 끌리는 향을 떠올리며, 천천히 알아가실 한 잔으로 골라봤어요.</p>
            <p>처음에는 조금만 따라 향을 살피고, 한 모금씩 마음에 드는 느낌을 찾아보세요.</p>
            <p className="pt-1"><span className="font-semibold">곁들이면 좋은 한 입 · </span>담백한 크래커를 조금 곁들여 편안하게 즐겨보세요.</p>
          </div>
          <WhiskeyCollectedBottlingPanel key={information} display={display}>
            <button type="button" onClick={() => setInformationStatus('표시할 정보에 변경이 없어요.')}
              className="mt-3 min-h-11 py-2 text-left text-xs font-semibold underline">제품 정보 다시 확인</button>
            {informationStatus && <p role="status" className="text-xs leading-5 text-stone-600">{informationStatus}</p>}
          </WhiskeyCollectedBottlingPanel>
          <button type="button" onClick={() => setNoteStatus('지금은 화면 미리보기예요. 실제 시음 기록은 저장하지 않아요.')}
            className="mt-6 block min-h-11 w-full border border-[#4a3728] px-3 py-3 text-center text-sm font-semibold">마신 뒤 시음 기록 남기기</button>
          <p className="mt-2 text-xs leading-5 text-stone-600">내 시음 노트 목록에서 이 추천을 다시 찾을 수 있어요.</p>
          {noteStatus && <p role="status" className="mt-2 text-xs leading-5 text-stone-700">{noteStatus}</p>}
        </article>
        <ExpectationFeedback sentiment={sentiment} reason={reason} savedSentiment={saved} loading={false} status={feedbackStatus} authExpired={false}
          onSentiment={(value) => { setSentiment(value); setReason('NONE'); setFeedbackStatus(null); }}
          onReason={setReason} comment={comment} onComment={setComment}
          onSave={() => { setSaved(sentiment); setFeedbackStatus('첫인상을 선택했어요. 미리보기에서는 실제로 저장하지 않아요.'); }} />
      </div>
    </div>
  </main>;
}
