import effectSettings from '../config/effects.json';

type Lang = "th" | "en" | "zh";

interface MomentOverlayProps {
  lang: Lang;
  currentTime: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  currentDate: {
    day: number;
    month: number;
    year: number;
  };
}

export default function MomentOverlay({ lang, currentTime, currentDate }: MomentOverlayProps) {
  // Get "This is your moment" text based on language
  const thisIsYourMomentText = (() => {
    const byLang = effectSettings.thisIsYourMomentByLang as
      | Partial<Record<Lang, string>>
      | undefined;
    return byLang?.[lang] || "This is your moment";
  })();

  return (
    <div className="moment-overlay-inside">
      <h3 className="moment-title-small">{thisIsYourMomentText}</h3>
      <div className="countdown-display-small">
        <div className="time-unit-small">
          <div className="time-label-small">hr</div>
          <div className="time-digit-small">{String(currentTime.hours).padStart(2, '0')}</div>
        </div>
        <div className="time-unit-small">
          <div className="time-label-small">min</div>
          <div className="time-digit-small">{String(currentTime.minutes).padStart(2, '0')}</div>
        </div>
        <div className="time-unit-small">
          <div className="time-label-small">sec</div>
          <div className="time-digit-small">{String(currentTime.seconds).padStart(2, '0')}</div>
        </div>
      </div>
      <div className="date-display-small">
        <div className="date-unit">
          <div className="date-label-small">day</div>
          <div className="date-digit-small">{String(currentDate.day).padStart(2, '0')}</div>
        </div>
        <div className="date-unit">
          <div className="date-label-small">mo</div>
          <div className="date-digit-small">{String(currentDate.month).padStart(2, '0')}</div>
        </div>
        <div className="date-unit">
          <div className="date-label-small">yr</div>
          <div className="date-digit-small">{String(currentDate.year).slice(-2)}</div>
        </div>
      </div>
    </div>
  );
}
