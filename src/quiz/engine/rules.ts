import type { QuizAnswerValue, QuizQuestion } from "../types";

export function isAnswerFilled(question: QuizQuestion, value: QuizAnswerValue | undefined): boolean {
  if (value === undefined) {
    return false;
  }

  if (question.type === "multi") {
    return Array.isArray(value) && value.length > 0;
  }

  if (question.type === "text") {
    return typeof value === "string" && value.trim().length > 0;
  }

  if (question.type === "scale") {
    return typeof value === "number";
  }

  return typeof value === "string" && value.length > 0;
}

export function canProceed(question: QuizQuestion, value: QuizAnswerValue | undefined): boolean {
  if (!question.required) {
    return true;
  }
  return isAnswerFilled(question, value);
}
