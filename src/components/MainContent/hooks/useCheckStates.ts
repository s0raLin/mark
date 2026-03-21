import { useState, useRef } from "react";
import { CheckStates } from "../types";

const CHECKS_KEY = "studiomark_checks_global";

export function useCheckStates() {
  const [checkStates, setCheckStates] = useState<CheckStates>(() => {
    try {
      return JSON.parse(localStorage.getItem(CHECKS_KEY) ?? "{}");
    } catch {
      return {};
    }
  });

  const checkIndexRef = useRef(0);
  checkIndexRef.current = 0; // 每次 render 重置

  const updateCheckState = (idx: number, checked: boolean) => {
    const next = { ...checkStates, [idx]: checked };
    setCheckStates(next);
    localStorage.setItem(CHECKS_KEY, JSON.stringify(next));
  };

  return {
    checkStates,
    checkIndexRef,
    updateCheckState,
    CHECKS_KEY,
  };
}
