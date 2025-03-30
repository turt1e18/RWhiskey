"use client";

import { useState } from "react";
import BeforeScreen from "./_components/Before";
import AfterScreen from "./_components/After";

export default function MoodScreen() {
  /**
   * 0 데이터 세팅 화면
   * 1 데이터 결과 화면
   */
  const [screenState, serScreenState] = useState(0);
  const switchScreen = () => {
    switch (screenState) {
      case 0:
        return <BeforeScreen setSwitchState={serScreenState} />;
      case 1:
        return <AfterScreen />;
      default:
        break;
    }
  };
  return <>{switchScreen()}</>;
}
