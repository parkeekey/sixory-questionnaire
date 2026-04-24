import { useEffect, useState } from 'react';

interface TimeSnapshot {
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

export function useTimeSnapshot(): TimeSnapshot {
  const [timeSnapshot, setTimeSnapshot] = useState<TimeSnapshot>({
    currentTime: { hours: 0, minutes: 0, seconds: 0 },
    currentDate: { day: 0, month: 0, year: 0 }
  });

  // Capture static time snapshot once when component mounts
  useEffect(() => {
    const now = new Date();
    setTimeSnapshot({
      currentTime: {
        hours: now.getHours(),
        minutes: now.getMinutes(),
        seconds: now.getSeconds()
      },
      currentDate: {
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear()
      }
    });
  }, []);

  return timeSnapshot;
}
