import type { Question } from "../types";

export const questionnaireTitle = "Coffee Customer Questionnaire";

export const questions: Question[] = [
  {
    id: "drink",
    label: "Order Profile",
    title: "What do you usually order?",
    hint: "Pick the closest match.",
    kind: "single",
    options: ["Espresso", "Flat White", "Pour Over", "Cold Brew", "Other"]
  },
  {
    id: "visit-time",
    label: "Visit Pattern",
    title: "When do you visit most often?",
    hint: "Choose one time window.",
    kind: "single",
    options: ["Early Morning", "Late Morning", "Afternoon", "Evening"]
  },
  {
    id: "values",
    label: "Taste Priority",
    title: "What matters most in your cup?",
    hint: "Choose up to two.",
    kind: "multi",
    min: 1,
    max: 2,
    options: ["Sweetness", "Body", "Aroma", "Acidity", "Consistency"]
  },
  {
    id: "intensity",
    label: "Intensity",
    title: "How strong do you prefer your coffee?",
    hint: "1 is very light, 10 is very strong.",
    kind: "scale",
    min: 1,
    max: 10,
    step: 1,
    leftLabel: "Light",
    rightLabel: "Strong"
  },
  {
    id: "satisfaction",
    label: "Experience Score",
    title: "How would you rate your last visit?",
    hint: "A quick score helps us improve.",
    kind: "scale",
    min: 1,
    max: 10,
    step: 1,
    leftLabel: "Needs Work",
    rightLabel: "Excellent"
  },
  {
    id: "note",
    label: "Final Note",
    title: "Any note for our baristas?",
    hint: "Optional and short is perfect.",
    kind: "text",
    placeholder: "Tell us one thing we can improve..."
  }
];
