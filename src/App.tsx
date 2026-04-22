import { useEffect, useMemo, useState } from "react";

type GroupKey = "feeler" | "keeper" | "seeker" | "thinker";

interface SlidePair {
  key: string;
  number: number;
  src: string;
  role: "Title" | "Explanation";
}

interface FolderDeck {
  folderName: string;
  pairs: SlidePair[];
}

const GROUP_LABELS: Record<GroupKey, string> = {
  feeler: "feeler",
  keeper: "Keeper",
  seeker: "Seeeker",
  thinker: "Thinker"
};

const GROUP_ORDER: GroupKey[] = ["feeler", "keeper", "seeker", "thinker"];

const IMAGE_MODULES = import.meta.glob("../Assets/**/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default"
}) as Record<string, string>;

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
  if (!rgb) {
    return;
  }

  const [r, g, b] = rgb.map(Number);
  document.documentElement.style.setProperty(
    "--extracted-bg-deep",
    `rgb(${Math.round(r * 0.82)},${Math.round(g * 0.82)},${Math.round(b * 0.82)})`
  );
}

function buildDecks(): Record<GroupKey, FolderDeck[]> {
  const tree: Record<GroupKey, Record<string, { number: number; src: string }[]>> = {
    feeler: {},
    keeper: {},
    seeker: {},
    thinker: {}
  };

  for (const [path, src] of Object.entries(IMAGE_MODULES)) {
    const match = path.match(/\.\.\/Assets\/([^/]+)\/([^/]+)\/([^/]+)$/);
    if (!match) {
      continue;
    }

    const [, group, folder, fileName] = match;
    if (!(group in tree)) {
      continue;
    }

    const numberMatch = fileName.match(/(\d+)/);
    if (!numberMatch) {
      continue;
    }

    const number = Number(numberMatch[1]);
    const typedGroup = group as GroupKey;
    tree[typedGroup][folder] ??= [];
    tree[typedGroup][folder].push({ number, src });
  }

  const decks = {} as Record<GroupKey, FolderDeck[]>;
  for (const group of GROUP_ORDER) {
    const folders = Object.entries(tree[group])
      .map(([folderName, files]) => {
        const pairs: SlidePair[] = files
          .sort((a, b) => a.number - b.number)
          .map((file) => ({
            key: `${folderName}-${file.number}`,
            number: file.number,
            src: file.src,
            role: file.number % 2 === 1 ? "Title" : "Explanation"
          }));

        return { folderName, pairs };
      })
      .sort((a, b) => a.folderName.localeCompare(b.folderName));

    decks[group] = folders;
  }

  return decks;
}

export default function App() {
  const decksByGroup = useMemo(() => buildDecks(), []);
  const [activeGroup, setActiveGroup] = useState<GroupKey | null>(null);

  useEffect(() => {
    if (!activeGroup) {
      applyBgColor("rgb(201,131,122)");
      return;
    }

    const firstImage = decksByGroup[activeGroup]?.[0]?.pairs?.[0]?.src;
    if (!firstImage) {
      return;
    }

    extractColor(firstImage).then((c) => {
      applyBgColor(c || "rgb(201,131,122)");
    });
  }, [activeGroup, decksByGroup]);

  if (!activeGroup) {
    return (
      <div className="app-root menu-root">
        <main className="menu-card animate-rise">
          <p className="eyebrow">Local Test</p>
          <h1 className="menu-title">Questionnaire Menu</h1>
          <p className="menu-copy">Pick one tab to view all folders and scroll through cards.</p>

          <div className="tab-grid">
            {GROUP_ORDER.map((group) => (
              <button key={group} className="tab-btn" onClick={() => setActiveGroup(group)}>
                {GROUP_LABELS[group]}
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-root">
      <header className="gallery-header">
        <button className="back-btn" onClick={() => setActiveGroup(null)}>
          Back to Menu
        </button>
        <h2 className="gallery-title">{GROUP_LABELS[activeGroup]}</h2>
      </header>

      <main className="gallery-scroll">
        {decksByGroup[activeGroup].map((deck) => (
          <section key={deck.folderName} className="folder-block">
            <h3 className="folder-title">{deck.folderName}</h3>

            {deck.pairs.length === 0 ? (
              <p className="empty-note">No numbered cards found in this folder.</p>
            ) : (
              <div className="pair-list">
                {deck.pairs.map((pair) => (
                  <article key={pair.key} className="pair-card">
                    <p className="pair-label">
                      {pair.role} #{pair.number}
                    </p>
                    <img src={pair.src} alt={`${deck.folderName} ${pair.role.toLowerCase()} ${pair.number}`} className="pair-image" />
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
