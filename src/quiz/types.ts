export type QuestionType = "single" | "multi" | "scale" | "text";

export interface QuizOption {
  id: string;
  label: string;
  value: string;
}

export interface QuizQuestion {
  id: string;
  title: string;
  description?: string;
  type: QuestionType;
  options?: QuizOption[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export interface QuizSection {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

export interface QuizConfig {
  id: string;
  title: string;
  sections: QuizSection[];
}

export type QuizAnswerValue = string | string[] | number;

export type QuizAnswers = Record<string, QuizAnswerValue>;
