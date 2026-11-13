/** Display compatibility for saved responses; never rewrites stored explanations or bottle identity. */
export function bartenderPresentation(summary:string[],serving?:string|null) {
  const food=serving && /크래커|초콜릿|치즈|견과|사과|말린 과일|배(?=\s|를|와|도|$)|과일/.test(serving)?serving:null;
  const introduction=summary.slice(0,3);
  if(introduction.length<2)introduction.push(!food&&serving?serving:'한 모금씩 천천히 살펴보며 마음에 드는 풍미를 찾아보세요.');
  // foodSuggested=false면 서버가 안주를 제안하지 않아 기본 안내를 쓴 것이다. 화면은 이를 추천처럼 보이지 않게 구분한다.
  return {introduction,food:food??'담백한 크래커를 조금 곁들여, 한 모금씩 맛의 변화를 살펴보세요.',foodSuggested:food!=null};
}

/**
 * "이렇게 마셔 보세요" 단계. 병의 사실을 새로 주장하지 않는 일반 시음 안내이며,
 * 도수는 화면에 표시되는 값(abv)일 때만 문장에 넣는다.
 */
export function servingSteps(level:'BEGINNER'|'INTERMEDIATE'|'ADVANCED'|null|undefined,abv:number|null):string[] {
  const steps=['작은 잔에 조금만 따라, 마시기 전에 향을 먼저 맡아 보세요.'];
  steps.push(abv!=null&&abv>=46
    ?`도수가 ${abv}%로 높은 편이라, 물 몇 방울을 더하면 향이 부드럽게 열릴 수 있어요.`
    :'한 모금 마신 뒤 물을 한두 방울 더해, 향이 어떻게 달라지는지 비교해 보세요.');
  steps.push(level==='BEGINNER'?'강하게 느껴지면 얼음 한 조각을 넣거나 탄산수와 섞어 하이볼로 즐겨도 괜찮아요.'
    :level==='ADVANCED'?'잔에 잠시 두었다가 다시 맡아, 시간이 지나며 바뀌는 향도 살펴보세요.'
    :'그대로 마신 맛과 물을 더한 맛을 번갈아 비교해 두면 다음 주문에 도움이 돼요.');
  return steps;
}
