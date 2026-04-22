import { useState } from "react";
import pageOne from "../asset/page_1.png";

export default function App() {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <div className="presentation-shell">
      <div className="slideshow-stage" aria-live="polite">
        <div className="slideshow-track" style={{ transform: `translateY(-${activeSlide * 100}dvh)` }}>
          <section className="slide slide-intro">
            <div className="intro-card animate-rise">
              <p className="eyebrow">Sixory Specialty Coffee</p>
              <h1 className="intro-title">Questionaire test</h1>
              <p className="intro-copy">
                A clean, minimal slideshow that adapts to your source page first, then grows into the full questionnaire.
              </p>
              <button className="slide-button" onClick={() => setActiveSlide(1)}>
                Slide up to page 1
              </button>
            </div>
          </section>

          <section className="slide slide-reference">
            <div className="reference-copy animate-rise">
              <p className="eyebrow">Reference match</p>
              <h2 className="reference-title">Matched to the dusty rose editorial look</h2>
              <p className="intro-copy intro-copy-muted">
                This slide uses your source asset as the visual target so we can tune colors, typography, and spacing against the real design.
              </p>
            </div>

            <figure className="reference-frame animate-rise">
              <img src={pageOne} alt="Source reference page showing the Sixory Feeler soft light layout" className="reference-image" />
            </figure>

            <div className="slide-actions">
              <button className="slide-button slide-button-secondary" onClick={() => setActiveSlide(0)}>
                Back
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
