import { useState } from "react";
import type { QuizAnswers, QuizAnswerValue } from "../types";

export function useQuizStore(initialAnswers: QuizAnswers = {}) {
  const [answers, setAnswers] = useState<QuizAnswers>(initialAnswers);

  const setAnswer = (questionId: string, value: QuizAnswerValue) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const resetAnswers = () => {
    setAnswers({});
  };

  return {
    answers,
    setAnswer,
    resetAnswers
  };
}
