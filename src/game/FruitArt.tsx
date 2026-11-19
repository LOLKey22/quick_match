import type { Fruit } from "./logic";

// Simple hand-drawn SVG fruits (fill colors are illustration art, not UI theme).
export function FruitArt({ fruit }: { fruit: Fruit }) {
  const common = { viewBox: "0 0 100 100", className: "h-full w-full drop-shadow-sm", "aria-hidden": true };
  switch (fruit) {
    case "Apple":
      return (
        <svg {...common}>
          <path d="M50 30c-10-8-34-6-34 22 0 22 16 38 26 38 4 0 6-2 8-2s4 2 8 2c10 0 26-16 26-38 0-28-24-30-34-22z" fill="#e63946" />
          <path d="M50 30c0-8 2-14 6-18" stroke="#6b4226" strokeWidth="4" fill="none" strokeLinecap="round" />
          <ellipse cx="64" cy="18" rx="10" ry="5" fill="#52b043" transform="rotate(-25 64 18)" />
          <ellipse cx="34" cy="46" rx="5" ry="9" fill="#fff" opacity=".45" />
        </svg>
      );
    case "Banana":
      return (
        <svg {...common}>
          <path d="M20 30c10 40 50 55 70 40-4 14-28 24-48 16S14 52 14 30c0-4 5-4 6 0z" fill="#ffd23f" stroke="#c9a227" strokeWidth="2" />
          <path d="M14 30l-2-8 8 2z" fill="#6b4226" />
        </svg>
      );
    case "Orange":
      return (
        <svg {...common}>
          <circle cx="50" cy="56" r="34" fill="#ff8c1a" />
          <circle cx="40" cy="44" r="7" fill="#fff" opacity=".4" />
          <ellipse cx="58" cy="20" rx="10" ry="5" fill="#52b043" transform="rotate(-20 58 20)" />
          <circle cx="50" cy="23" r="3" fill="#6b4226" />
        </svg>
      );
    case "Strawberry":
      return (
        <svg {...common}>
          <path d="M50 92C30 80 16 58 20 40c4-14 56-14 60 0 4 18-10 40-30 52z" fill="#e5383b" />
          <path d="M28 32l10 6 12-10 12 10 10-6-6 12H34z" fill="#52b043" />
          {[[36, 52], [50, 48], [64, 52], [42, 66], [58, 66], [50, 80]].map(([x, y]) => (
            <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2" ry="3" fill="#ffe066" />
          ))}
        </svg>
      );
    case "Grapes":
      return (
        <svg {...common}>
          <path d="M50 16v12" stroke="#6b4226" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="64" cy="20" rx="10" ry="5" fill="#52b043" />
          {[[38, 36], [50, 34], [62, 36], [32, 50], [44, 50], [56, 50], [68, 50], [38, 64], [50, 64], [62, 64], [44, 78], [56, 78], [50, 90]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="8" fill="#7b2cbf" stroke="#5a189a" strokeWidth="1.5" />
          ))}
        </svg>
      );
    case "Papaya":
      return (
        <svg {...common}>
          <ellipse cx="50" cy="54" rx="26" ry="38" fill="#ffb703" stroke="#7cb518" strokeWidth="4" />
          <ellipse cx="50" cy="54" rx="18" ry="30" fill="#fb8500" />
          <ellipse cx="50" cy="56" rx="8" ry="16" fill="#3d2b1f" />
          {[48, 54, 60, 66].map((y) => (
            <circle key={y} cx={y % 12 === 0 ? 47 : 53} cy={y} r="2" fill="#000" />
          ))}
        </svg>
      );
  }
}
