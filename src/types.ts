export type QuestionKind = "single" | "multi" | "scale" | "text";

export interface BaseQuestion {
  id: string;
  label: string;
  title: string;
  hint?: string;
  kind: QuestionKind;
}

export interface SingleQuestion extends BaseQuestion {
  kind: "single";
  options: string[];
}

export interface MultiQuestion extends BaseQuestion {
  kind: "multi";
  options: string[];
  min?: number;
  max?: number;
}

export interface ScaleQuestion extends BaseQuestion {
  kind: "scale";
  min: number;
  max: number;
  step?: number;
  leftLabel?: string;
  rightLabel?: string;
}

export interface TextQuestion extends BaseQuestion {
  kind: "text";
  placeholder?: string;
}

export type Question = SingleQuestion | MultiQuestion | ScaleQuestion | TextQuestion;

export type AnswerValue = string | string[] | number;

export type Answers = Record<string, AnswerValue>;
