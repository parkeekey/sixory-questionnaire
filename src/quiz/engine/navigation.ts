import type { QuizConfig } from "../types";

export function flattenQuestionIds(config: QuizConfig): string[] {
  return config.sections.flatMap((section) => section.questions.map((question) => question.id));
}

export function getNextQuestionId(config: QuizConfig, currentId: string): string | null {
  const ids = flattenQuestionIds(config);
  const index = ids.indexOf(currentId);
  if (index < 0 || index >= ids.length - 1) {
    return null;
  }
  return ids[index + 1];
}

export function getPrevQuestionId(config: QuizConfig, currentId: string): string | null {
  const ids = flattenQuestionIds(config);
  const index = ids.indexOf(currentId);
  if (index <= 0) {
    return null;
  }
  return ids[index - 1];
}
