import { useEffect, useMemo, useState } from "react";
import {
  questionnaireSpec,
  type Choice,
  type EmotionState,
  type Identity,
  type Question
} from "./quiz/data/schema";

type SectionName = "A" | "B";
type Lang = "th" | "en" | "zh";

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
const languageOrder: Lang[] = ["th", "en", "zh"];

const uiText: Record<
  Lang,
  {
    appEyebrow: string;
    menuTitle: string;
    menuCopy: string;
    startQuiz: string;
    backToMenu: string;
    previous: string;
    next: string;
    showResult: string;
    resultAsset: string;
    noImages: string;
    sectionA: string;
    sectionB: string;
    questionLabel: string;
    titleRole: string;
    explanationRole: string;
    noChoiceLabel: string;
  }
> = {
  th: {
    appEyebrow: "Sixory Coffee Lab",
    menuTitle: "WHO ARE YOU",
    menuCopy: "ตอบคำถาม 7 ข้อ เพื่อหา identity + state และแสดงชุดการ์ดที่ตรงกับคุณ",
    startQuiz: "เริ่มทำแบบทดสอบ",
    backToMenu: "กลับไปเมนู",
    previous: "ย้อนกลับ",
    next: "ถัดไป",
    showResult: "ดูผลลัพธ์",
    resultAsset: "ชุดผลลัพธ์",
    noImages: "ไม่พบรูปในโฟลเดอร์ผลลัพธ์",
    sectionA: "Section A: Identity",
    sectionB: "Section B: State",
    questionLabel: "คำถาม",
    titleRole: "หัวข้อ",
    explanationRole: "คำอธิบาย",
    noChoiceLabel: "ยังไม่มีคำแปลตัวเลือกนี้"
  },
  en: {
    appEyebrow: "Sixory Coffee Lab",
    menuTitle: "WHO ARE YOU",
    menuCopy: "Answer 7 questions to find your identity + state and reveal your matching card set.",
    startQuiz: "Start Quiz",
    backToMenu: "Back to Menu",
    previous: "Previous",
    next: "Next",
    showResult: "Show Result",
    resultAsset: "Result Asset",
    noImages: "No images found in mapped folder.",
    sectionA: "Section A: Identity",
    sectionB: "Section B: State",
    questionLabel: "Question",
    titleRole: "Title",
    explanationRole: "Explanation",
    noChoiceLabel: "No translation for this choice yet"
  },
  zh: {
    appEyebrow: "Sixory Coffee Lab",
    menuTitle: "WHO ARE YOU",
    menuCopy: "回答 7 个问题，找出你的 identity + state，并显示对应卡片组合。",
    startQuiz: "开始测试",
    backToMenu: "返回菜单",
    previous: "上一题",
    next: "下一题",
    showResult: "查看结果",
    resultAsset: "结果素材",
    noImages: "在映射文件夹中未找到图片。",
    sectionA: "Section A: Identity",
    sectionB: "Section B: State",
    questionLabel: "问题",
    titleRole: "标题",
    explanationRole: "说明",
    noChoiceLabel: "该选项暂无翻译"
  }
};

const questionText: Record<string, Record<Lang, string>> = {
  Q1: {
    th: "คุณเลือกสิ่งไหนมากกว่า?",
    en: "Which one do you choose more often?",
    zh: "你更常选择哪一种？"
  },
  Q2: {
    th: "เวลาว่าง คุณมักจะ…",
    en: "In your free time, you usually...",
    zh: "空闲时你通常会……"
  },
  Q3: {
    th: "คุณรับมือกับวันที่แย่ยังไง?",
    en: "How do you handle a bad day?",
    zh: "你如何面对糟糕的一天？"
  },
  Q4: {
    th: "คุณเป็นคนแบบไหนมากที่สุด?",
    en: "Which type best describes you?",
    zh: "哪一种最能描述你？"
  },
  Q5: {
    th: "วันนี้คุณรู้สึกใกล้กับอะไรที่สุด?",
    en: "What feeling is closest to you today?",
    zh: "今天你的状态最接近哪一种？"
  },
  Q6: {
    th: "จังหวะชีวิตตอนนี้เป็นแบบไหน?",
    en: "How is your life rhythm right now?",
    zh: "你目前的生活节奏是怎样的？"
  },
  Q7: {
    th: "คุณอยากได้อะไรตอนนี้มากที่สุด?",
    en: "What do you need most right now?",
    zh: "你现在最需要什么？"
  }
};

const choiceText: Record<string, Record<string, Record<Lang, string>>> = {
  Q1: {
    A: { th: "ความรู้สึก", en: "Feelings", zh: "感受" },
    B: { th: "ประสบการณ์ใหม่", en: "New experiences", zh: "新体验" },
    C: { th: "ความเข้าใจ", en: "Understanding", zh: "理解" },
    D: { th: "ความมั่นคง", en: "Stability", zh: "稳定" }
  },
  Q2: {
    A: { th: "ฟังเพลง / อยู่กับอารมณ์", en: "Listen to music / sit with emotions", zh: "听音乐 / 与情绪相处" },
    B: { th: "ออกไปข้างนอก", en: "Go outside", zh: "出去走走" },
    C: { th: "คิด / อ่าน / วิเคราะห์", en: "Think / read / analyze", zh: "思考 / 阅读 / 分析" },
    D: { th: "พัก / ทำอะไรเรียบง่าย", en: "Rest / do simple things", zh: "休息 / 做简单的事" }
  },
  Q3: {
    A: { th: "รู้สึกมันเต็มที่", en: "Feel it fully", zh: "完整感受它" },
    B: { th: "ออกไปเปลี่ยนบรรยากาศ", en: "Go out and change the atmosphere", zh: "出去换个环境" },
    C: { th: "คิดหาความหมาย", en: "Reflect and search for meaning", zh: "思考并寻找意义" },
    D: { th: "อยู่เฉยๆ รอให้ผ่าน", en: "Stay still and let it pass", zh: "静下来等待过去" }
  },
  Q4: {
    A: { th: "ลึกและอ่อนโยน", en: "Deep and gentle", zh: "深沉且温柔" },
    B: { th: "กล้าและอยากลอง", en: "Bold and eager to try", zh: "勇敢且愿意尝试" },
    C: { th: "คิดลึก", en: "Deep thinker", zh: "善于深度思考" },
    D: { th: "นิ่งและมั่นคง", en: "Calm and grounded", zh: "沉稳且可靠" }
  },
  Q5: {
    A: { th: "โล่ง / พร้อมเริ่มใหม่", en: "Clear / ready to restart", zh: "清晰 / 准备重新开始" },
    B: { th: "หนัก / ชัด / มีอารมณ์", en: "Heavy / vivid / emotional", zh: "厚重 / 明显 / 情绪强烈" },
    C: { th: "นิ่ง / อยากอยู่เงียบๆ", en: "Quiet / want calm", zh: "安静 / 想独处" }
  },
  Q6: {
    A: { th: "ไหลลื่น", en: "Flowing", zh: "流畅" },
    B: { th: "หนักแน่น", en: "Solid and intense", zh: "厚实有力" },
    C: { th: "ช้าลง", en: "Slowing down", zh: "慢下来" }
  },
  Q7: {
    A: { th: "ความชัดเจน", en: "Clarity", zh: "清晰感" },
    B: { th: "ความเข้มข้น", en: "Intensity", zh: "浓度感" },
    C: { th: "ความสงบ", en: "Calm", zh: "平静" }
  }
};

const identityLabels: Record<Identity, Record<Lang, string>> = {
  Feeler: { th: "Feeler", en: "Feeler", zh: "感受者" },
  Seeker: { th: "Seeker", en: "Seeker", zh: "探索者" },
  Thinker: { th: "Thinker", en: "Thinker", zh: "思考者" },
  Keeper: { th: "Keeper", en: "Keeper", zh: "守护者" }
};

const stateLabels: Record<EmotionState, Record<Lang, string>> = {
  Clear: { th: "Clear", en: "Clear", zh: "清晰" },
  Intense: { th: "Intense", en: "Intense", zh: "浓烈" },
  Quiet: { th: "Quiet", en: "Quiet", zh: "安静" }
};

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

function localizedQuestion(id: string, fallback: string, lang: Lang): string {
  return questionText[id]?.[lang] ?? fallback;
}

function localizedChoice(questionId: string, choiceKey: string, fallback: string, lang: Lang): string {
  return choiceText[questionId]?.[choiceKey]?.[lang] ?? fallback;
}

function LanguageSwitcher({ lang, onChange }: { lang: Lang; onChange: (next: Lang) => void }) {
  const labels: Record<Lang, string> = {
    th: "TH",
    en: "EN",
    zh: "中文"
  };

  return (
    <div className="lang-switch" role="group" aria-label="Language switcher">
      {languageOrder.map((code) => (
        <button
          key={code}
          className={`lang-btn${lang === code ? " active" : ""}`}
          onClick={() => onChange(code)}
        >
          {labels[code]}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const questions = useMemo(() => flattenQuestions(), []);
  const folderImages = useMemo(() => buildFolderImages(), []);

  const [lang, setLang] = useState<Lang>("th");
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
  const t = uiText[lang];

  useEffect(() => {
    const saved = window.localStorage.getItem("quiz-lang");
    if (saved === "th" || saved === "en" || saved === "zh") {
      setLang(saved);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("quiz-lang", lang);
  }, [lang]);

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
          <div className="menu-top">
            <p className="eyebrow">{t.appEyebrow}</p>
            <LanguageSwitcher lang={lang} onChange={setLang} />
          </div>
          <h1 className="menu-title">{t.menuTitle}</h1>
          <p className="menu-copy">{t.menuCopy}</p>
          <button className="tab-btn" onClick={() => setStarted(true)}>
            {t.startQuiz}
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
            {t.backToMenu}
          </button>
          <h2 className="gallery-title">{identityLabels[result.identity][lang]} / {stateLabels[result.state][lang]}</h2>
          <LanguageSwitcher lang={lang} onChange={setLang} />
        </header>

        <main className="gallery-scroll">
          <section className="folder-block">
            <h3 className="folder-title">{t.resultAsset}: {result.assetFolder}</h3>

            {images.length === 0 ? (
              <p className="empty-note">{t.noImages}</p>
            ) : (
              <div className="pair-list">
                {images.map((img) => (
                  <article key={`${result.assetFolder}-${img.number}`} className="pair-card">
                    <p className="pair-label">{img.role === "Title" ? t.titleRole : t.explanationRole} #{img.number}</p>
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
        <div className="menu-top">
          <p className="eyebrow">
            {current.section === "A" ? t.sectionA : t.sectionB}
          </p>
          <LanguageSwitcher lang={lang} onChange={setLang} />
        </div>
        <p className="progress-text">{t.questionLabel} {index + 1}/{questions.length} • {progress}%</p>
        <h2 className="question-title">{localizedQuestion(current.id, current.text, lang)}</h2>

        <div className="option-list">
          {choiceEntries(current.choices).map(([key, choice]) => (
            <button
              key={key}
              className={`option-btn${selectedChoice === key ? " selected" : ""}`}
              onClick={() => setAnswers((existing) => ({ ...existing, [current.id]: key }))}
            >
              <span className="option-key">{key}</span>
              <span>{localizedChoice(current.id, key, choice.label || t.noChoiceLabel, lang)}</span>
            </button>
          ))}
        </div>

        <div className="action-row">
          <button className="back-btn" onClick={() => setIndex((v) => Math.max(v - 1, 0))} disabled={index === 0}>
            {t.previous}
          </button>
          <button className="tab-btn" onClick={submitCurrentAndGoNext} disabled={!selectedChoice}>
            {index === questions.length - 1 ? t.showResult : t.next}
          </button>
        </div>
      </main>
    </div>
  );
}
