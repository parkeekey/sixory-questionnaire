import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  questionnaireSpec,
  type Choice,
  type EmotionState,
  type Identity,
  type Question
} from "./quiz/data/schema";
import effectSettings from "./config/effects.json";

type SectionName = "A" | "B";
type Lang = "th" | "en" | "zh";
const DEV_PASSWORD = (effectSettings as Record<string, unknown>).devPassword as string | undefined ?? "1234";
const RESULT_PASSWORDS = (effectSettings as Record<string, unknown>).resultPasswords as Record<string, string> | undefined ?? {};

interface FlatQuestion extends Question {
  section: SectionName;
}

interface ResultImage {
  number: number;
  pageIndex: number;
  src: string;
  role: "Title" | "Explanation";
}

const IMAGE_MODULES = import.meta.glob("../local/assetv2/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default"
}) as Record<string, string>;

const LEGACY_IMAGE_MODULES = import.meta.glob("../Assets/**/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default"
}) as Record<string, string>;

const RESULT_PAGE_MAP: Record<string, number[]> = {
  feeler_softlight: [1, 2],
  seeker_burningHorz: [3, 4],
  thinker_quiteillu: [5, 6],
  keeper_solarground: [7, 8],
  feeler_drenchedbloom: [10, 11],
  seeker_stormseeker: [12, 13],
  thinker_innerstorm: [14, 15],
  keeper_stedyrain: [16, 17],
  feeler_quietembrance: [19, 20],
  seeker_frozenpath: [21, 22],
  thinker_deepstillness: [23, 24],
  keeper_innerfire: [25, 26]
};

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
    devLockOn: string;
    devLockOff: string;
    passwordPlaceholder: string;
    unlock: string;
    lockedHint: string;
    wrongPassword: string;
    unlocked: string;
  }
> = {
  th: {
    appEyebrow: "Sixory x Hacking coffee roaster",
    menuTitle: "CHOOSE WHO YOU ARE",
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
    noChoiceLabel: "ยังไม่มีคำแปลตัวเลือกนี้",
    devLockOn: "ปิด Dev Lock",
    devLockOff: "เปิด Dev Lock",
    passwordPlaceholder: "ใส่รหัสผ่าน",
    unlock: "ปลดล็อก",
    lockedHint: `หน้า 2 จะถูกเบลอจนกว่าจะใส่รหัสผ่าน`,
    wrongPassword: "รหัสผ่านไม่ถูกต้อง",
    unlocked: "ปลดล็อกแล้ว"
  },
  en: {
    appEyebrow: "Sixory x Hacking coffee roaster",
    menuTitle: "CHOOSE WHO YOU ARE",
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
    noChoiceLabel: "No translation for this choice yet",
    devLockOn: "Disable Dev Lock",
    devLockOff: "Enable Dev Lock",
    passwordPlaceholder: "Enter password",
    unlock: "Unlock",
    lockedHint: `Result page 2 is blurred until password is entered`,
    wrongPassword: "Wrong password",
    unlocked: "Unlocked"
  },
  zh: {
    appEyebrow: "Sixory x Hacking coffee roaster",
    menuTitle: "CHOOSE WHO YOU ARE",
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
    noChoiceLabel: "该选项暂无翻译",
    devLockOn: "关闭 Dev 锁",
    devLockOff: "开启 Dev 锁",
    passwordPlaceholder: "输入密码",
    unlock: "解锁",
    lockedHint: `结果第 2 页会被模糊，直到输入密码 `,
    wrongPassword: "密码错误",
    unlocked: "已解锁"
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
  const pageMap = new Map<number, string>();

  for (const [path, src] of Object.entries(IMAGE_MODULES)) {
    const match = path.match(/page_(\d+)\.[^.]+$/i);
    if (!match) continue;

    pageMap.set(Number(match[1]), src);
  }

  if (pageMap.size === 0) {
    const legacyGrouped = new Map<string, Array<{ number: number; src: string }>>();

    for (const [path, src] of Object.entries(LEGACY_IMAGE_MODULES)) {
      const folderMatch = path.match(/\/Assets\/[^/]+\/([^/]+)\//i);
      const pageMatch = path.match(/page_(\d+)\.[^.]+$/i);
      if (!folderMatch || !pageMatch) continue;

      const folder = folderMatch[1];
      const number = Number(pageMatch[1]);
      const existing = legacyGrouped.get(folder) ?? [];
      existing.push({ number, src });
      legacyGrouped.set(folder, existing);
    }

    const legacyOut: Record<string, ResultImage[]> = {};
    for (const [folder, files] of legacyGrouped.entries()) {
      const sorted = files.sort((a, b) => a.number - b.number);
      legacyOut[folder] = sorted.map((f, i) => ({
        number: f.number,
        src: f.src,
        pageIndex: i + 1,
        role: i % 2 === 0 ? "Title" : "Explanation"
      }));
    }

    return legacyOut;
  }

  const out: Record<string, ResultImage[]> = {};
  for (const [folder, pages] of Object.entries(RESULT_PAGE_MAP)) {
    out[folder] = pages
      .map((number) => {
        const src = pageMap.get(number);
        return src ? { number, src } : null;
      })
      .filter((file): file is { number: number; src: string } => file !== null)
      .map((f, i) => ({
        number: f.number,
        src: f.src,
        pageIndex: i + 1,
        role: i % 2 === 0 ? "Title" : "Explanation"
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
  const questionnaireBgColor = effectSettings.questionnaireBgColor ?? "rgb(201,131,122)";
  const questionnaireBgDeepColor = effectSettings.questionnaireBgDeepColor ?? "rgb(177,115,107)";
  const revealTotalDurationMs = effectSettings.revealTotalDurationMs ?? 7800;
  const revealPhraseDurationMs = effectSettings.revealPhraseDurationMs ?? 2400;
  const revealPhraseFadeMs = effectSettings.revealPhraseFadeMs ?? 900;
  const revealBgColor = effectSettings.revealBgColor ?? "rgb(176,120,109)";
  const revealBgDeepColor = effectSettings.revealBgDeepColor;
  const revealBgDelayMs = effectSettings.revealBgDelayMs ?? 0;
  const revealResultBgDelayMs = effectSettings.revealResultBgDelayMs ?? 2000;
  const resultFadeDurationMs = effectSettings.resultFadeDurationMs ?? 900;
  const resultBook = (effectSettings as Record<string, unknown>).resultBook as Record<string, unknown> | undefined;
  const bookFlipDurationMs = Number(resultBook?.flipDurationMs ?? 650);
  const colorTransitionDurationMs = effectSettings.colorTransition.duration;
  const colorTransitionEasing = effectSettings.colorTransition.easing;
  const devLockReveal = (effectSettings as Record<string, unknown>).devLockReveal !== false;

  const [lang, setLang] = useState<Lang>("th");
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isPasswordLockEnabled, setIsPasswordLockEnabled] = useState(effectSettings.devLockEnabled ?? true);
  const [passwordInput, setPasswordInput] = useState("");
  const [isResultUnlocked, setIsResultUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showReveal, setShowReveal] = useState(false);
  const [revealPhraseIndex, setRevealPhraseIndex] = useState(0);
  const [isRevealPhraseVisible, setIsRevealPhraseVisible] = useState(true);
  const [questionPhase, setQuestionPhase] = useState<"idle" | "out" | "in">("idle");
  const [questionDirection, setQuestionDirection] = useState<"next" | "prev">("next");
  const [resultPageIndex, setResultPageIndex] = useState(0);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");
  const [flipPhase, setFlipPhase] = useState<"idle" | "out" | "in">("idle");
  const [baseBg, setBaseBg] = useState({ color: questionnaireBgColor, deep: questionnaireBgDeepColor, gradient: false });
  const [overlayBg, setOverlayBg] = useState({ color: questionnaireBgColor, deep: questionnaireBgDeepColor, gradient: false });
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [overlayHasTransition, setOverlayHasTransition] = useState(false);
  const [pendingResult, setPendingResult] = useState<{
    identity: Identity;
    state: EmotionState;
    assetFolder: string;
  } | null>(null);
  const [result, setResult] = useState<{
    identity: Identity;
    state: EmotionState;
    assetFolder: string;
  } | null>(null);

  const revealPhrases = useMemo(() => {
    const byLang = effectSettings.revealPhrasesByLang as
      | Partial<Record<Lang, string[]>>
      | undefined;
    const langPhrases = byLang?.[lang];
    if (Array.isArray(langPhrases) && langPhrases.length > 0) {
      return langPhrases;
    }

    return ["...it's starting to make sense..."];
  }, [lang]);

  const crossFadeBg = useCallback(
    (color: string, deepColor?: string, gradient = true) => {
      const deep =
        deepColor ??
        (() => {
          const rgb = color.match(/\d+/g);
          if (!rgb) return color;
          const [r, g, b] = rgb.map(Number);
          return `rgb(${Math.round(r * 0.82)},${Math.round(g * 0.82)},${Math.round(b * 0.82)})`;
        })();
      setOverlayBg({ color, deep, gradient });
      setOverlayHasTransition(false);
      setOverlayOpacity(0);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setOverlayHasTransition(true);
          setOverlayOpacity(1);
        });
      });
      window.setTimeout(() => {
        setBaseBg({ color, deep, gradient });
        setOverlayHasTransition(false);
        setOverlayOpacity(0);
      }, colorTransitionDurationMs + 50);
    },
    [colorTransitionDurationMs]
  );

  const bgValue = (c: { color: string; deep: string; gradient: boolean }) =>
    c.gradient
      ? `radial-gradient(circle at top right, rgba(255,255,255,0.1), transparent 30%), linear-gradient(180deg, ${c.color}, ${c.color} 48%, ${c.deep})`
      : c.color;

  const bgPortal = createPortal(
    <>
      <div className="bg-layer" style={{ background: bgValue(baseBg) }} />
      <div
        className="bg-layer"
        style={{
          background: bgValue(overlayBg),
          opacity: overlayOpacity,
          transition: overlayHasTransition
            ? `opacity ${colorTransitionDurationMs}ms ${colorTransitionEasing}`
            : "none",
        }}
      />
    </>,
    document.body
  );

  const current = questions[index];
  const selectedChoice = current ? answers[current.id] : undefined;
  const progress = Math.round(((index + 1) / Math.max(questions.length, 1)) * 100);
  const t = uiText[lang];
  const questionTransitionClass =
    questionPhase === "idle"
      ? "book-page"
      : questionPhase === "out"
        ? `book-page is-flipping flip-out ${questionDirection === "next" ? "flip-next" : "flip-prev"} transition-lock`
        : `book-page is-flipping flip-in ${questionDirection === "next" ? "flip-next" : "flip-prev"} transition-lock`;

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
    const root = document.documentElement;
    root.style.setProperty("--fx-bg-duration", `${effectSettings.backgroundTransitionMs}ms`);
    root.style.setProperty("--fx-rise-duration", `${effectSettings.riseDurationMs}ms`);
    root.style.setProperty("--fx-slide-duration", `${effectSettings.slideDurationMs}ms`);
    root.style.setProperty("--fx-rise-offset", `${effectSettings.riseOffsetPx}px`);
    root.style.setProperty("--fx-slide-offset", `${effectSettings.slideOffsetPx}px`);
    root.style.setProperty("--fx-ease", effectSettings.easing);
    root.style.setProperty("--fx-reveal-fade-duration", `${revealPhraseFadeMs}ms`);
    root.style.setProperty("--fx-result-fade-duration", `${resultFadeDurationMs}ms`);
    root.style.setProperty("--fx-book-duration", `${bookFlipDurationMs}ms`);
    root.style.setProperty("--fx-book-half-duration", `${Math.max(120, Math.floor(bookFlipDurationMs / 2))}ms`);
    root.style.setProperty("--fx-book-easing", (resultBook?.flipEasing as string | undefined) ?? "cubic-bezier(0.22, 1, 0.36, 1)");
    root.style.setProperty("--fx-book-perspective", `${resultBook?.perspectivePx ?? 1200}px`);
  }, [
    bookFlipDurationMs,
    resultBook,
    resultFadeDurationMs,
    revealPhraseFadeMs
  ]);

  useEffect(() => {
    setResultPageIndex(0);
    setFlipPhase("idle");
    setFlipDirection("next");
  }, [result?.assetFolder]);

  useEffect(() => {
    if (showReveal || result) return;
    crossFadeBg(questionnaireBgColor, questionnaireBgDeepColor, true);
  }, [crossFadeBg, questionnaireBgColor, questionnaireBgDeepColor, result, showReveal]);

  useEffect(() => {
    if (!showReveal || !pendingResult) return;

    const revealBgTimer = window.setTimeout(() => {
      crossFadeBg(revealBgColor, revealBgDeepColor, true);
    }, revealBgDelayMs);

    const firstResultImage = folderImages[pendingResult.assetFolder]?.[0]?.src;
    if (!firstResultImage) {
      return () => {
        window.clearTimeout(revealBgTimer);
      };
    }

    const bgDelayTimer = window.setTimeout(() => {
      extractColor(firstResultImage).then((c) => {
        crossFadeBg(c || revealBgColor, revealBgDeepColor, true);
      });
    }, revealResultBgDelayMs);

    return () => {
      window.clearTimeout(revealBgTimer);
      window.clearTimeout(bgDelayTimer);
    };
  }, [
    crossFadeBg,
    folderImages,
    pendingResult,
    revealBgColor,
    revealBgDeepColor,
    revealBgDelayMs,
    revealResultBgDelayMs,
    showReveal
  ]);

  useEffect(() => {
    if (!showReveal || !pendingResult) return;

    setRevealPhraseIndex(0);
    setIsRevealPhraseVisible(true);

    const phraseFlipDelay = Math.max(250, Math.floor(revealPhraseFadeMs * 0.45));

    const phraseTimer = window.setInterval(() => {
      setIsRevealPhraseVisible(false);
      window.setTimeout(() => {
        setRevealPhraseIndex((value) => (value + 1) % revealPhrases.length);
        setIsRevealPhraseVisible(true);
      }, phraseFlipDelay);
    }, revealPhraseDurationMs);

    const finishTimer = window.setTimeout(() => {
      window.clearInterval(phraseTimer);
      setIsRevealPhraseVisible(false);
      window.setTimeout(() => {
        setResult(pendingResult);
        setPendingResult(null);
        setShowReveal(false);
      }, phraseFlipDelay);
    }, revealTotalDurationMs);

    return () => {
      window.clearInterval(phraseTimer);
      window.clearTimeout(finishTimer);
    };
  }, [
    pendingResult,
    revealPhraseDurationMs,
    revealPhraseFadeMs,
    revealPhrases.length,
    revealTotalDurationMs,
    showReveal
  ]);

  useEffect(() => {
    if (!result) return;

    const firstResultImage = result ? folderImages[result.assetFolder]?.[0]?.src : undefined;
    if (!firstResultImage) {
      crossFadeBg(revealBgColor, revealBgDeepColor, false);
      return;
    }

    extractColor(firstResultImage).then((c) => {
      crossFadeBg(c || revealBgColor, revealBgDeepColor, false);
    });
  }, [crossFadeBg, folderImages, result, revealBgColor, revealBgDeepColor]);

  const submitCurrentAndGoNext = () => {
    if (!current || !selectedChoice) return;

    if (index < questions.length - 1) {
      if (questionPhase !== "idle") return;
      const half = Math.max(120, Math.floor(bookFlipDurationMs / 2));
      setQuestionDirection("next");
      setQuestionPhase("out");
      window.setTimeout(() => {
        setIndex((v) => v + 1);
        setQuestionPhase("in");
        window.setTimeout(() => {
          setQuestionPhase("idle");
        }, half);
      }, half);
      return;
    }

    const identity = pickTopIdentity(answers, questions);
    const state = pickTopState(answers, questions);
    const assetFolder = questionnaireSpec.mapping.identity_state_to_asset[identity][state];
    setPendingResult({ identity, state, assetFolder });
    setShowReveal(true);
  };

  const restart = () => {
    setStarted(false);
    setIndex(0);
    setAnswers({});
    setResult(null);
    setPasswordInput("");
    setIsResultUnlocked(false);
    setPasswordError("");
    setPendingResult(null);
    setShowReveal(false);
    setRevealPhraseIndex(0);
    setIsRevealPhraseVisible(true);
    setQuestionPhase("idle");
    setQuestionDirection("next");
    setResultPageIndex(0);
    setFlipPhase("idle");
    setFlipDirection("next");
  };

  const goToPreviousQuestion = () => {
    if (questionPhase !== "idle") return;
    if (index === 0) return;

    const half = Math.max(120, Math.floor(bookFlipDurationMs / 2));
    setQuestionDirection("prev");
    setQuestionPhase("out");
    window.setTimeout(() => {
      setIndex((v) => Math.max(v - 1, 0));
      setQuestionPhase("in");
      window.setTimeout(() => {
        setQuestionPhase("idle");
      }, half);
    }, half);
  };

  const toggleDevLock = () => {
    setIsPasswordLockEnabled((enabled) => {
      const next = !enabled;
      if (next) {
        setIsResultUnlocked(false);
      }
      setPasswordError("");
      return next;
    });
  };

  const unlockResult = () => {
    const folderPassword = result ? (RESULT_PASSWORDS[result.assetFolder] || "") : "";
    const expected = folderPassword.trim() !== "" ? folderPassword.trim() : DEV_PASSWORD;
    if (passwordInput.trim() === expected) {
      setIsResultUnlocked(true);
      setPasswordError("");
      return;
    }
    setIsResultUnlocked(false);
    setPasswordError(t.wrongPassword);
  };

  if (!started) {
    return (
      <div className="app-root menu-root">
        {bgPortal}
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
    const firstLockedPageTwoNumber = images.find((img) => img.pageIndex === 2)?.number;
    const activeImage = images[resultPageIndex];
    const isLockedPageTwo = Boolean(
      activeImage && isPasswordLockEnabled && !isResultUnlocked && activeImage.pageIndex === 2
    );

    const turnPage = (direction: "next" | "prev") => {
      if (flipPhase !== "idle") return;
      if (direction === "next" && resultPageIndex >= images.length - 1) return;
      if (direction === "prev" && resultPageIndex <= 0) return;

      setFlipDirection(direction);
      setFlipPhase("out");
      const half = Math.max(120, Math.floor(bookFlipDurationMs / 2));
      window.setTimeout(() => {
        setResultPageIndex((value) => value + (direction === "next" ? 1 : -1));
        setFlipPhase("in");
        window.setTimeout(() => {
          setFlipPhase("idle");
        }, half);
      }, half);
    };

    return (
      <div className="app-root">
        {bgPortal}
        <header className="gallery-header">
          <button className="back-btn" onClick={restart}>
            {t.backToMenu}
          </button>
          <h2 className="gallery-title">{identityLabels[result.identity][lang]} / {stateLabels[result.state][lang]}</h2>
          <LanguageSwitcher lang={lang} onChange={setLang} />
        </header>

        <main className="gallery-scroll animate-result-fade">
          {devLockReveal ? (
          <div className="dev-lock-panel result-dev-lock">
            <button className="back-btn" onClick={toggleDevLock}>
              {isPasswordLockEnabled ? t.devLockOn : t.devLockOff}
            </button>

            {isPasswordLockEnabled ? (
              <p className="empty-note">
                {isResultUnlocked ? t.unlocked : t.lockedHint}
              </p>
            ) : null}
            {passwordError ? <p className="password-error">{passwordError}</p> : null}
          </div>
          ) : null}

          {images.length === 0 ? (
            <p className="empty-note">{t.noImages}</p>
          ) : (
            <div className="book-stage">
              <article
                key={`${result.assetFolder}-${activeImage?.number ?? "empty"}`}
                className={`pair-card book-page${isLockedPageTwo ? " locked" : ""}${flipPhase !== "idle" ? ` is-flipping ${flipPhase === "out" ? "flip-out" : "flip-in"} ${flipDirection === "next" ? "flip-next" : "flip-prev"}` : ""}`}
              >
                {activeImage ? (
                  <img
                    src={activeImage.src}
                    alt={`${result.assetFolder} ${activeImage.role.toLowerCase()} ${activeImage.number}`}
                    className="pair-image"
                  />
                ) : (
                  <p className="empty-note">{t.noImages}</p>
                )}
                {isLockedPageTwo && activeImage ? (
                  <div className="lock-overlay">
                    {activeImage.number === firstLockedPageTwoNumber ? (
                      <div className="lock-overlay-inner">
                        <p className="lock-overlay-text">{t.lockedHint}</p>
                        <div className="dev-lock-controls">
                          <input
                            className="dev-password-input"
                            type="password"
                            value={passwordInput}
                            onChange={(event) => setPasswordInput(event.target.value)}
                            placeholder={t.passwordPlaceholder}
                          />
                          <button className="tab-btn" onClick={unlockResult}>
                            {t.unlock}
                          </button>
                        </div>
                        {passwordError ? <p className="password-error">{passwordError}</p> : null}
                      </div>
                    ) : (
                      <div className="lock-overlay-inner">
                        <p className="lock-overlay-text">{t.lockedHint}</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </article>

              <div className="book-controls">
                <button className="back-btn" onClick={() => turnPage("prev")} disabled={flipPhase !== "idle" || resultPageIndex === 0}>
                  {t.previous}
                </button>
                <p className="progress-text">{resultPageIndex + 1}/{images.length}</p>
                <button
                  className="tab-btn"
                  onClick={() => turnPage("next")}
                  disabled={flipPhase !== "idle" || resultPageIndex >= images.length - 1}
                >
                  {t.next}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (showReveal && pendingResult) {
    return (
      <div className="app-root reveal-root animate-rise">
        {bgPortal}
        <div className="reveal-panel">
          <div className="loading-ring" aria-hidden="true" />
          <p className={`reveal-line${isRevealPhraseVisible ? " visible" : ""}`}>
            {revealPhrases[revealPhraseIndex]}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root menu-root">
      {bgPortal}
      <main className="menu-card quiz-card">
        <div key={`${current.id}-${index}`} className={`quiz-step ${questionTransitionClass}`}>
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
          <button className="back-btn" onClick={goToPreviousQuestion} disabled={index === 0 || questionPhase !== "idle"}>
            {t.previous}
          </button>
          <button className="tab-btn" onClick={submitCurrentAndGoNext} disabled={!selectedChoice || questionPhase !== "idle"}>
            {index === questions.length - 1 ? t.showResult : t.next}
          </button>
        </div>
        </div>
      </main>
    </div>
  );
}
