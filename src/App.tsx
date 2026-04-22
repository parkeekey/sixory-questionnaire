import { useEffect, useMemo, useState } from "react";
import {
  questionnaireSpec,
  type Choice,
  type EmotionState,
  type Identity,
  type Question
} from "./quiz/data/schema";

type SectionName = "A" | "B";

interface FlatQuestion extends Question {
  section: SectionName;
}

interface ResultImage {
  number: number;
  src: string;
  role: "Title" | "Explanation";
}

const IMAGE_MODULES = import.meta.glob("../Assets/**/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default"
}) as Record<string, string>;

const identityOrder: Identity[] = ["Feeler", "Seeker", "Thinker", "Keeper"];
const stateOrder: EmotionState[] = ["Clear", "Intense", "Quiet"];

function flattenQuestions(): FlatQuestion[] {
  const sectionA = questionnaireSpec.questionnaire.sectionA_archetype.questions.map((q) => ({ ...q, section: "A" as const }));
  const sectionB = questionnaireSpec.questionnaire.sectionB_emotion.questions.map((q) => ({ ...q, section: "B" as const }));
  return [...sectionA, ...sectionB];
}

function buildFolderImages(): Record<string, ResultImage[]> {
  const map: Record<string, { number: number; src: string }[]> = {};

  for (const [path, src] of Object.entries(IMAGE_MODULES)) {
    const match = path.match(/\.\.\/Assets\/[^/]+\/([^/]+)\/([^/]+)$/);
    if (!match) continue;

    const [, folderName, fileName] = match;
    const numberMatch = fileName.match(/(\d+)/);
    if (!numberMatch) continue;

    map[folderName] ??= [];
    map[folderName].push({ number: Number(numberMatch[1]), src });
  }

  const out: Record<string, ResultImage[]> = {};
  for (const [folder, files] of Object.entries(map)) {
    out[folder] = files
      .sort((a, b) => a.number - b.number)
      .map((f) => ({
        ...f,
        role: f.number % 2 === 1 ? "Title" : "Explanation"
      }));
  }

  return out;
}

function pickTopIdentity(answers: Record<string, string>, questions: FlatQuestion[]): Identity {
  const counts: Record<Identity, number> = {
    Feeler: 0,
    Seeker: 0,
    Thinker: 0,
    Keeper: 0
  };

  for (const q of questions.filter((x) => x.section === "A")) {
    const choiceKey = answers[q.id];
    if (!choiceKey) continue;
    const choice = q.choices[choiceKey];
    if (choice?.identity) {
      counts[choice.identity] += 1;
    }
  }

  return identityOrder.reduce((best, current) => (counts[current] > counts[best] ? current : best), identityOrder[0]);
}

function pickTopState(answers: Record<string, string>, questions: FlatQuestion[]): EmotionState {
  const counts: Record<EmotionState, number> = {
    Clear: 0,
    Intense: 0,
    Quiet: 0
  };

  for (const q of questions.filter((x) => x.section === "B")) {
    const choiceKey = answers[q.id];
    if (!choiceKey) continue;
    const choice = q.choices[choiceKey];
    if (choice?.state) {
      counts[choice.state] += 1;
    }
  }

  return stateOrder.reduce((best, current) => (counts[current] > counts[best] ? current : best), stateOrder[0]);
}

async function extractColor(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = 80;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("");
        return;
      }

      ctx.drawImage(img, 0, 0, size, size);
      const points: [number, number][] = [
        [2, 2],
        [size - 3, 2],
        [2, size - 3],
        [size - 3, size - 3],
        [Math.floor(size / 2), 2],
        [2, Math.floor(size / 2)]
      ];

      let r = 0;
      let g = 0;
      let b = 0;
      for (const [x, y] of points) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        r += pixel[0];
        g += pixel[1];
        b += pixel[2];
      }

      const n = points.length;
      resolve(`rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`);
    };
    img.onerror = () => resolve("");
    img.src = src;
  });
}

function applyBgColor(color: string): void {
  document.documentElement.style.setProperty("--extracted-bg", color);
  const rgb = color.match(/\d+/g);
  if (!rgb) return;

  const [r, g, b] = rgb.map(Number);
  document.documentElement.style.setProperty(
    "--extracted-bg-deep",
    `rgb(${Math.round(r * 0.82)},${Math.round(g * 0.82)},${Math.round(b * 0.82)})`
  );
}

function choiceEntries(choices: Record<string, Choice>): Array<[string, Choice]> {
  return Object.entries(choices);
}

export default function App() {
  const questions = useMemo(() => flattenQuestions(), []);
  const folderImages = useMemo(() => buildFolderImages(), []);

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    identity: Identity;
    state: EmotionState;
    assetFolder: string;
  } | null>(null);

  const current = questions[index];
  const selectedChoice = current ? answers[current.id] : undefined;
  const progress = Math.round(((index + 1) / Math.max(questions.length, 1)) * 100);

  useEffect(() => {
    const firstResultImage = result ? folderImages[result.assetFolder]?.[0]?.src : undefined;
    if (!firstResultImage) {
      applyBgColor("rgb(201,131,122)");
      return;
    }

    extractColor(firstResultImage).then((c) => {
      applyBgColor(c || "rgb(201,131,122)");
    });
  }, [result, folderImages]);

  const submitCurrentAndGoNext = () => {
    if (!current || !selectedChoice) return;

    if (index < questions.length - 1) {
      setIndex((v) => v + 1);
      return;
    }

    const identity = pickTopIdentity(answers, questions);
    const state = pickTopState(answers, questions);
    const assetFolder = questionnaireSpec.mapping.identity_state_to_asset[identity][state];
    setResult({ identity, state, assetFolder });
  };

  const restart = () => {
    setStarted(false);
    setIndex(0);
    setAnswers({});
    setResult(null);
  };

  if (!started) {
    return (
      <div className="app-root menu-root">
        <main className="menu-card animate-rise">
          <p className="eyebrow">Sixory Coffee Lab</p>
          <h1 className="menu-title">Questionnaire Test</h1>
          <p className="menu-copy">ตอบคำถาม 7 ข้อ เพื่อหา identity + state และแสดงชุดการ์ดที่ตรงกับคุณ</p>
          <button className="tab-btn" onClick={() => setStarted(true)}>
            Start Quiz
          </button>
        </main>
      </div>
    );
  }

  if (result) {
    const images = folderImages[result.assetFolder] ?? [];
    return (
      <div className="app-root">
        <header className="gallery-header">
          <button className="back-btn" onClick={restart}>
            Back to Menu
          </button>
          <h2 className="gallery-title">{result.identity} / {result.state}</h2>
        </header>

        <main className="gallery-scroll">
          <section className="folder-block">
            <h3 className="folder-title">Result Asset: {result.assetFolder}</h3>

            {images.length === 0 ? (
              <p className="empty-note">No images found in mapped folder.</p>
            ) : (
              <div className="pair-list">
                {images.map((img) => (
                  <article key={`${result.assetFolder}-${img.number}`} className="pair-card">
                    <p className="pair-label">{img.role} #{img.number}</p>
                    <img src={img.src} alt={`${result.assetFolder} ${img.role.toLowerCase()} ${img.number}`} className="pair-image" />
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-root menu-root">
      <main className="menu-card animate-rise quiz-card">
        <p className="eyebrow">
          {current.section === "A" ? "Section A: Identity" : "Section B: State"}
        </p>
        <p className="progress-text">Question {index + 1}/{questions.length} • {progress}%</p>
        <h2 className="question-title">{current.text}</h2>

        <div className="option-list">
          {choiceEntries(current.choices).map(([key, choice]) => (
            <button
              key={key}
              className={`option-btn${selectedChoice === key ? " selected" : ""}`}
              onClick={() => setAnswers((existing) => ({ ...existing, [current.id]: key }))}
            >
              <span className="option-key">{key}</span>
              <span>{choice.label}</span>
            </button>
          ))}
        </div>

        <div className="action-row">
          <button className="back-btn" onClick={() => setIndex((v) => Math.max(v - 1, 0))} disabled={index === 0}>
            Previous
          </button>
          <button className="tab-btn" onClick={submitCurrentAndGoNext} disabled={!selectedChoice}>
            {index === questions.length - 1 ? "Show Result" : "Next"}
          </button>
        </div>
      </main>
    </div>
  );
}
