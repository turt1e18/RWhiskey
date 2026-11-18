"use client";

import { useEffect, useState } from "react";

// 새로고침 뒤 처음 보이는 다이어리 틀만 서서히 나타난다. 노트 화면끼리 이동할 때 틀이 다시 깜빡이지 않게 한다.
let seen = false;

/** true면 이 틀은 처음 보이는 것이다(들어오는 동작을 보여 준다). false면 이미 보인 틀이라 바로 그린다. */
export function useFrameIntro(): boolean {
  const [intro] = useState(() => !seen);
  useEffect(() => { seen = true; }, []);
  return intro;
}
