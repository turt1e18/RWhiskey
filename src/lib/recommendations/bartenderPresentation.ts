/** Display compatibility for saved responses; never rewrites stored explanations or bottle identity. */
export function bartenderPresentation(summary:string[],serving?:string|null) {
  const food=serving && /크래커|초콜릿|치즈|견과|사과|말린 과일|배(?=\s|를|와|도|$)|과일/.test(serving)?serving:null;
  const introduction=summary.slice(0,3);
  if(introduction.length<2)introduction.push(!food&&serving?serving:'한 모금씩 천천히 살펴보며 마음에 드는 풍미를 찾아보세요.');
  return {introduction,food:food??'담백한 크래커를 조금 곁들여, 한 모금씩 맛의 변화를 살펴보세요.'};
}
