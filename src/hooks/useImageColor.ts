import { useEffect, useState } from "react";

/**
 * Draws the image at small scale on a hidden canvas and samples the four
 * corners plus top/left edge midpoints — areas most likely to be solid
 * background. Returns an averaged rgb() string, or the fallback if the
 * image hasn't loaded yet.
 */
async function extractBgColor(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const SIZE = 80;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("");
        return;
      }

      ctx.drawImage(img, 0, 0, SIZE, SIZE);

      // Sample background-heavy corners and edge midpoints
      const pts: [number, number][] = [
        [2, 2],
        [SIZE - 3, 2],
        [2, SIZE - 3],
        [SIZE - 3, SIZE - 3],
        [Math.floor(SIZE / 2), 2],
        [2, Math.floor(SIZE / 2)]
      ];

      let r = 0;
      let g = 0;
      let b = 0;

      for (const [x, y] of pts) {
        const d = ctx.getImageData(x, y, 1, 1).data;
        r += d[0];
        g += d[1];
        b += d[2];
      }

      const n = pts.length;
      resolve(`rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`);
    };

    img.onerror = () => resolve("");
    img.src = src;
  });
}

/**
 * Extracts the dominant background color from a local image asset and
 * writes it as --extracted-bg and --extracted-bg-deep on <html>.
 * Returns the rgb string once resolved (empty string while loading).
 */
export function useImageColor(src: string, fallback: string): string {
  const [color, setColor] = useState("");

  useEffect(() => {
    let cancelled = false;

    extractBgColor(src).then((result) => {
      if (cancelled) return;
      const resolved = result || fallback;
      setColor(resolved);
      document.documentElement.style.setProperty("--extracted-bg", resolved);

      // Compute a slightly deeper shade for the gradient by darkening ~12 %
      const match = resolved.match(/\d+/g);
      if (match) {
        const [rr, gg, bb] = match.map(Number);
        const deep = `rgb(${Math.round(rr * 0.88)},${Math.round(gg * 0.88)},${Math.round(bb * 0.88)})`;
        document.documentElement.style.setProperty("--extracted-bg-deep", deep);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [src, fallback]);

  return color;
}
