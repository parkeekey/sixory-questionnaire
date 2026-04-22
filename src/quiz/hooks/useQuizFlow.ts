import { useMemo, useState } from "react";
import { flattenQuestionIds, getNextQuestionId, getPrevQuestionId } from "../engine/navigation";
import type { QuizConfig } from "../types";

export function useQuizFlow(config: QuizConfig) {
  const allIds = useMemo(() => flattenQuestionIds(config), [config]);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(allIds[0] ?? null);

  const goNext = () => {
    if (!currentQuestionId) return;
    const next = getNextQuestionId(config, currentQuestionId);
    if (next) {
      setCurrentQuestionId(next);
    }
  };

  const goPrev = () => {
    if (!currentQuestionId) return;
    const prev = getPrevQuestionId(config, currentQuestionId);
    if (prev) {
      setCurrentQuestionId(prev);
    }
  };

  const progress = currentQuestionId ? ((allIds.indexOf(currentQuestionId) + 1) / Math.max(allIds.length, 1)) * 100 : 0;

  return {
    currentQuestionId,
    setCurrentQuestionId,
    goNext,
    goPrev,
    progress
  };
}
