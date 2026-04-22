import { useEffect, useRef, useState } from "react";
import pageOne from "../asset/page_1.png";
import pageThree from "../asset/page_3.png";

const PAGES = [
  { src: pageOne, alt: "The Feeler — Soft Light", fallback: "rgb(201,131,122)" },
  { src: pageThree, alt: "The Seeker — Burning Horizon", fallback: "rgb(55,72,95)" }
];

const TOTAL_SLIDES = PAGES.length + 1;
const DRAG_THRESHOLD = 55;

async function extractColor(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const SIZE = 80;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(""); return; }
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const pts: [number, number][] = [
        [2, 2], [SIZE - 3, 2], [2, SIZE - 3], [SIZE - 3, SIZE - 3],
        [Math.floor(SIZE / 2), 2], [2, Math.floor(SIZE / 2)]
      ];
      let r = 0, g = 0, b = 0;
      for (const [x, y] of pts) {
        const d = ctx.getImageData(x, y, 1, 1).data;
        r += d[0]; g += d[1]; b += d[2];
      }
      const n = pts.length;
      resolve(`rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`);
    };
    img.onerror = () => resolve("");
    img.src = src;
  });
}

function applyBgColor(color: string) {
  document.documentElement.style.setProperty("--extracted-bg", color);
  const m = color.match(/\d+/g);
  if (m) {
    const [r, g, bb] = m.map(Number);
    document.documentElement.style.setProperty(
      "--extracted-bg-deep",
      `rgb(${Math.round(r * 0.82)},${Math.round(g * 0.82)},${Math.round(bb * 0.82)})`
    );
  }
}

export default function App() {
  const [slide, setSlide] = useState(0);
  const [colors, setColors] = useState(PAGES.map((p) => p.fallback));
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragging = useRef(false);
  const startY = useRef(0);
  const dragYRef = useRef(0);

  useEffect(() => {
    Promise.all(PAGES.map((p) => extractColor(p.src))).then((extracted) => {
      setColors(extracted.map((c, i) => c || PAGES[i].fallback));
    });
  }, []);

  useEffect(() => {
    const idx = Math.min(Math.max(slide - 1, 0), colors.length - 1);
    applyBgColor(colors[idx]);
  }, [slide, colors]);

  const goTo = (next: number) => {
    setSlide(Math.max(0, Math.min(next, TOTAL_SLIDES - 1)));
    dragYRef.current = 0;
    setDragY(0);
    dragging.current = false;
    setIsDragging(false);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    setIsDragging(true);
    startY.current = e.clientY;
    dragYRef.current = 0;
    setDragY(0);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const delta = e.clientY - startY.current;
    dragYRef.current = delta;
    setDragY(delta);
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    const dy = dragYRef.current;
    if (dy < -DRAG_THRESHOLD) goTo(slide + 1);
    else if (dy > DRAG_THRESHOLD) goTo(slide - 1);
    else {
      dragYRef.current = 0;
      setDragY(0);
    }
  };

  const trackPct = -(slide * 100) + (dragY / window.innerHeight) * 100;
  const activeSlide = slide;

  return (
    <div
      className="presentation-shell"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="slideshow-stage" aria-live="polite">
        <div
          className={`slideshow-track${isDragging ? " is-dragging" : ""}`}
          style={{ transform: `translateY(${trackPct}dvh)` }}
        >
          <section className="slide slide-intro">
            <div className="intro-card animate-rise">
              <p className="eyebrow">Sixory Specialty Coffee</p>
              <h1 className="intro-title">Questionnaire</h1>
              <p className="intro-copy">Swipe up or tap to begin</p>
              <button className="slide-button" onClick={() => goTo(1)}>Begin</button>
            </div>
          </section>

          {PAGES.map((page) => (
            <section key={page.src} className="slide slide-page">
              <img src={page.src} alt={page.alt} className="page-image" draggable={false} />
            </section>
          ))}
        </div>
      </div>

      <nav className="dot-nav" aria-label="Slide navigation">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <button
            key={i}
            className={`dot-btn${activeSlide === i ? " active" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </nav>
    </div>
  );
}
