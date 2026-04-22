# Manus Specialty Lab Questionnaire

Mobile-first questionnaire app for coffee customers using React + TypeScript + Vite.

## Run

1. npm install
2. npm run dev
3. Open the local Vite URL in your browser

## App Size and Layout

- Target viewport width: 320px to 480px
- Maximum content width: 480px
- App shell: centered column with side padding
- Content bottom padding: includes fixed action bar plus safe area
- Bottom bar: fixed, full width, internal content capped at 480px
- Breakpoints:
  - sm: 640px
  - lg: 1024px

## Color Tokens (OKLCH)

- Primary: oklch(0.38 0.08 35)
- Primary foreground: oklch(0.98 0.005 60)
- Accent: oklch(0.72 0.12 60)
- Accent foreground: oklch(0.18 0.04 35)
- Background: oklch(0.985 0.003 80)
- Foreground: oklch(0.18 0.02 35)
- Card: oklch(1 0 0)
- Muted: oklch(0.94 0.005 80)
- Muted foreground: oklch(0.52 0.02 60)
- Border: oklch(0.88 0.008 60)
- Ring: oklch(0.38 0.08 35)
- Score low: oklch(0.65 0.18 25)
- Score mid: oklch(0.72 0.14 50)
- Score good: oklch(0.65 0.12 130)
- Score great: oklch(0.52 0.10 145)

## Typography

- Display: Fraunces
- Body: DM Sans
- Mono numeric: DM Mono

## Component Patterns Included

- Hero gradient header with progress + score chip
- White cards with subtle border and radius
- Single and multi-select option rows
- Slider question with numeric readout
- Text note question
- Summary panel
- Fixed bottom action bar with secondary and primary actions

## Lightweight Notes

- No routing dependency
- No state library
- No heavy chart library
- Minimal CSS and only React core dependencies

## Main Files

- src/App.tsx: slideshow questionnaire flow
- src/styles.css: tokens, layout, responsive and component styles
- src/data/questions.ts: editable question data
- src/types.ts: question and answer types
