import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, Check, Pause, Play, RotateCcw, Settings2, Volume2, VolumeX, Vibrate, VibrateOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FruitArt } from "@/game/FruitArt";
import {
  applyOutcome,
  LEVEL_SECONDS,
  makeQuestion,
  pointsFor,
  rewardLabel,
  START_LIVES,
  starsFor,
  TARGET_SCORE,
  type Fruit,
  type Level,
  type Outcome,
  type Question,
  type Stats,
} from "@/game/logic";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quick Match – Find It Fast!" },
      { name: "description", content: "A fast, colorful fruit-matching game. Match the fruit name to the picture before time runs out." },
      { property: "og:title", content: "Quick Match – Find It Fast!" },
      { property: "og:description", content: "Match the fruit name to the picture before time runs out. Three speeds, quick-answer bonuses and streak rewards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuickMatch,
});

type Screen = "menu" | "playing" | "complete" | "over" | "how" | "settings";
type Phase = "countin" | "active" | "paused";
type Feedback = { outcome: Outcome; pick?: Fruit; reward?: ReturnType<typeof pointsFor> };
type Preferences = { sound: boolean; vibration: boolean };
type RecordEntry = { bestScore: number; bestStars: number };
type Records = Record<Level, RecordEntry>;

const FEEDBACK_MS = 450;
const COUNTIN_MS = 700;
const START: Stats = { score: 0, lives: START_LIVES, combo: 0 };
const DEFAULT_PREFERENCES: Preferences = { sound: true, vibration: true };
const EMPTY_RECORDS: Records = {
  easy: { bestScore: 0, bestStars: 0 },
  medium: { bestScore: 0, bestStars: 0 },
  hard: { bestScore: 0, bestStars: 0 },
};
const STORAGE_KEYS = { records: "quick-match-records-v1", preferences: "quick-match-preferences-v1" };

function readSaved<T>(key: string, fallback: T): T {
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback;
  } catch {
    return fallback;
  }
}

function saveValue(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The game remains playable if the browser blocks local storage.
  }
}

function playFeedbackTone(correct: boolean) {
  try {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    const audio = new AudioContextClass();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = correct ? 660 : 220;
    gain.gain.setValueAtTime(0.12, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.18);
    oscillator.onended = () => void audio.close();
  } catch {
    // Audio is optional; unsupported devices simply stay quiet.
  }
}

function QuickMatch() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [phase, setPhase] = useState<Phase>("countin");
  const [level, setLevel] = useState<Level>("easy");
  const [stats, setStats] = useState<Stats>(START);
  const [question, setQuestion] = useState<Question>(() => makeQuestion(0, () => 0));
  const [timeLeft, setTimeLeft] = useState(LEVEL_SECONDS.easy);
  const [countIn, setCountIn] = useState(3);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [bestCombo, setBestCombo] = useState(0);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [records, setRecords] = useState(EMPTY_RECORDS);
  const [hydrated, setHydrated] = useState(false);
  const resolvedRef = useRef(false);
  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deadlineRef = useRef(0);
  const remainingRef = useRef(LEVEL_SECONDS.easy);
  const statsRef = useRef(stats);
  const preferencesRef = useRef(preferences);
  statsRef.current = stats;
  preferencesRef.current = preferences;

  useEffect(() => {
    setPreferences(readSaved(STORAGE_KEYS.preferences, DEFAULT_PREFERENCES));
    const loaded = readSaved<Records>(STORAGE_KEYS.records, EMPTY_RECORDS);
    setRecords({
      easy: { ...EMPTY_RECORDS.easy, ...loaded.easy },
      medium: { ...EMPTY_RECORDS.medium, ...loaded.medium },
      hard: { ...EMPTY_RECORDS.hard, ...loaded.hard },
    });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveValue(STORAGE_KEYS.preferences, preferences);
  }, [hydrated, preferences]);

  useEffect(() => {
    if (hydrated) saveValue(STORAGE_KEYS.records, records);
  }, [hydrated, records]);

  useEffect(() => {
    if (screen !== "complete" && screen !== "over") return;
    const earnedStars = screen === "complete" ? starsFor(stats.lives) : 0;
    setRecords((current) => ({
      ...current,
      [level]: {
        bestScore: Math.max(current[level].bestScore, stats.score),
        bestStars: Math.max(current[level].bestStars, earnedStars),
      },
    }));
  }, [screen, level, stats.lives, stats.score]);

  const clearNext = useCallback(() => {
    if (nextTimer.current !== null) clearTimeout(nextTimer.current);
    nextTimer.current = null;
  }, []);

  const resolve = useCallback((outcome: Outcome, pick?: Fruit) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    const previous = statsRef.current;
    const nextCombo = outcome === "correct" ? previous.combo + 1 : 0;
    const reward = outcome === "correct"
      ? pointsFor(remainingRef.current, LEVEL_SECONDS[level], nextCombo)
      : undefined;
    const next = applyOutcome(previous, outcome, reward?.total);
    statsRef.current = next;
    setStats(next);
    setBestCombo((best) => Math.max(best, next.combo));
    setFeedback({ outcome, ...(pick !== undefined ? { pick } : {}), ...(reward ? { reward } : {}) });
    if (preferencesRef.current.sound) playFeedbackTone(outcome === "correct");
    if (preferencesRef.current.vibration && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(outcome === "correct" ? 25 : [35, 35, 35]);
    }
    clearNext();
    nextTimer.current = setTimeout(() => {
      nextTimer.current = null;
      setFeedback(null);
      if (next.score >= TARGET_SCORE) return setScreen("complete");
      if (next.lives <= 0) return setScreen("over");
      remainingRef.current = LEVEL_SECONDS[level];
      setTimeLeft(LEVEL_SECONDS[level]);
      resolvedRef.current = false;
      setQuestion((current) => makeQuestion(current.id + 1, Math.random, current.target));
    }, FEEDBACK_MS);
  }, [clearNext, level]);

  useEffect(() => {
    if (screen !== "playing" || phase !== "countin") return;
    if (countIn === 0) {
      const timer = setTimeout(() => setPhase("active"), 500);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setCountIn((count) => count - 1), COUNTIN_MS);
    return () => clearTimeout(timer);
  }, [screen, phase, countIn]);

  useEffect(() => {
    if (screen !== "playing" || phase !== "active" || feedback) return;
    const duration = remainingRef.current;
    deadlineRef.current = Date.now() + duration * 1000;
    const timer = setInterval(() => {
      if (resolvedRef.current) return clearInterval(timer);
      const left = Math.max(0, (deadlineRef.current - Date.now()) / 1000);
      remainingRef.current = left;
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(timer);
        resolve("timeout");
      }
    }, 100);
    return () => clearInterval(timer);
  }, [screen, phase, question.id, feedback, resolve]);

  useEffect(() => () => clearNext(), [clearNext]);

  const startGame = (chosenLevel: Level) => {
    clearNext();
    setLevel(chosenLevel);
    setStats(START);
    statsRef.current = START;
    setBestCombo(0);
    setFeedback(null);
    resolvedRef.current = false;
    remainingRef.current = LEVEL_SECONDS[chosenLevel];
    setTimeLeft(LEVEL_SECONDS[chosenLevel]);
    setCountIn(3);
    setQuestion((current) => makeQuestion(current.id + 1));
    setPhase("countin");
    setScreen("playing");
  };

  const backToMenu = () => {
    clearNext();
    setFeedback(null);
    resolvedRef.current = true;
    setScreen("menu");
  };

  const pause = () => {
    if (phase === "active") {
      remainingRef.current = Math.max(0, (deadlineRef.current - Date.now()) / 1000);
      setTimeLeft(remainingRef.current);
      setPhase("paused");
    } else if (phase === "paused") {
      setPhase("active");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky via-cream to-leaf/40 font-[family-name:var(--font-display)] text-bark">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-5 sm:py-6">
        {screen === "menu" && <Menu level={level} setLevel={setLevel} records={records} onStart={() => startGame(level)} onHow={() => setScreen("how")} onSettings={() => setScreen("settings")} />}
        {screen === "how" && <HowToPlay onBack={() => setScreen("menu")} />}
        {screen === "settings" && <Settings preferences={preferences} setPreferences={setPreferences} onBack={() => setScreen("menu")} />}
        {screen === "playing" && (
          <Game
            stats={stats}
            question={question}
            timeLeft={timeLeft}
            total={LEVEL_SECONDS[level]}
            feedback={feedback}
            phase={phase}
            countIn={countIn}
            onPick={(fruit) => resolve(fruit === question.target ? "correct" : "wrong", fruit)}
            onPause={pause}
            onQuit={backToMenu}
          />
        )}
        {(screen === "complete" || screen === "over") && (
          <EndScreen
            won={screen === "complete"}
            score={stats.score}
            bestCombo={bestCombo}
            lives={stats.lives}
            stars={screen === "complete" ? starsFor(stats.lives) : 0}
            record={records[level]}
            onRetry={() => startGame(level)}
            onMenu={backToMenu}
          />
        )}
      </div>
    </main>
  );
}

function BigButton({ children, onClick, variant = "gold", className = "" }: { children: ReactNode; onClick: () => void; variant?: "gold" | "leaf"; className?: string }) {
  const colors = variant === "gold" ? "bg-gold text-bark shadow-[0_5px_0_var(--bark)]" : "bg-leaf text-cream shadow-[0_5px_0_var(--leaf-deep)]";
  return <Button onClick={onClick} className={`h-auto w-full whitespace-normal rounded-2xl px-5 py-3.5 text-lg font-bold transition active:translate-y-1 active:shadow-none ${colors} ${className}`}>{children}</Button>;
}

function Menu({ level, setLevel, records, onStart, onHow, onSettings }: { level: Level; setLevel: (value: Level) => void; records: Records; onStart: () => void; onHow: () => void; onSettings: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-3 text-center">
      <div className="flex gap-3" aria-hidden="true">
        {(["Apple", "Banana", "Strawberry"] as Fruit[]).map((fruit, index) => (
          <div key={fruit} className="h-14 w-14 animate-bounce" style={{ animationDelay: `${index * 150}ms` }}><FruitArt fruit={fruit} /></div>
        ))}
      </div>
      <div>
        <h1 className="text-5xl font-bold leading-tight text-leaf-deep drop-shadow-[0_3px_0_var(--cream)]">Quick Match</h1>
        <p className="mt-1 text-lg font-semibold text-bark">Find It Fast!</p>
      </div>
      <section className="w-full rounded-3xl bg-cream/90 p-4 shadow-lg" aria-label="Choose difficulty">
        <p className="mb-3 text-base font-semibold">Choose your speed</p>
        <div className="grid grid-cols-3 gap-2">
          {(["easy", "medium", "hard"] as Level[]).map((option) => (
            <Button key={option} variant="outline" onClick={() => setLevel(option)} aria-pressed={level === option}
              className={`h-auto min-h-[84px] flex-col gap-1 whitespace-normal rounded-2xl border-2 px-2 py-2 ${level === option ? "border-leaf-deep bg-leaf text-cream hover:bg-leaf" : "border-leaf/30 bg-cream text-bark"}`}>
              <span className="text-base font-bold capitalize">{option}</span>
              <span className="text-xs">{LEVEL_SECONDS[option]} seconds</span>
              <span className="text-[11px] font-medium">Best {records[option].bestScore} · {records[option].bestStars ? `${"★".repeat(records[option].bestStars)}` : "—"}</span>
            </Button>
          ))}
        </div>
      </section>
      <div className="w-full space-y-3">
        <BigButton onClick={onStart}>Start Game</BigButton>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onHow} className="h-11 rounded-xl border-leaf/30 bg-cream font-semibold text-bark"><BookOpen /> How to Play</Button>
          <Button variant="outline" onClick={onSettings} className="h-11 rounded-xl border-leaf/30 bg-cream font-semibold text-bark"><Settings2 /> Settings</Button>
        </div>
      </div>
    </div>
  );
}

function HowToPlay({ onBack }: { onBack: () => void }) {
  return (
    <section className="flex flex-1 flex-col justify-center gap-5 py-5">
      <h1 className="text-center text-4xl font-bold text-leaf-deep">How to Play</h1>
      <div className="rounded-3xl bg-cream/90 p-5 shadow-lg">
        <ol className="space-y-4 text-base font-medium leading-relaxed">
          <li><span className="font-bold text-leaf-deep">1.</span> Read the fruit name and tap its picture before time runs out.</li>
          <li><span className="font-bold text-leaf-deep">2.</span> Get 10 points for a correct answer, plus 5 for a quick answer.</li>
          <li><span className="font-bold text-leaf-deep">3.</span> Every fifth correct answer in a row earns 10 bonus points.</li>
          <li><span className="font-bold text-berry">4.</span> A wrong answer or timeout costs one heart; the right fruit is revealed.</li>
          <li><span className="font-bold text-leaf-deep">5.</span> Reach 100 points to win. Pause whenever you need a break.</li>
        </ol>
        <p className="mt-5 border-t border-leaf/20 pt-4 text-sm font-semibold">Easy: 5 seconds · Medium: 4 seconds · Hard: 3 seconds</p>
      </div>
      <BigButton onClick={onBack} variant="leaf">Back to Menu</BigButton>
    </section>
  );
}

function Settings({ preferences, setPreferences, onBack }: { preferences: Preferences; setPreferences: (update: (current: Preferences) => Preferences) => void; onBack: () => void }) {
  return (
    <section className="flex flex-1 flex-col justify-center gap-5 py-5">
      <h1 className="text-center text-4xl font-bold text-leaf-deep">Settings</h1>
      <div className="divide-y divide-leaf/20 rounded-3xl bg-cream/90 px-5 shadow-lg">
        <label className="flex min-h-[76px] cursor-pointer items-center justify-between gap-3 py-4">
          <span className="flex items-center gap-3 text-lg font-semibold">{preferences.sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />} Sound</span>
          <input type="checkbox" className="size-6 accent-green-700" checked={preferences.sound} onChange={(event) => setPreferences((current) => ({ ...current, sound: event.target.checked }))} aria-label="Sound effects" />
        </label>
        <label className="flex min-h-[76px] cursor-pointer items-center justify-between gap-3 py-4">
          <span className="flex items-center gap-3 text-lg font-semibold">{preferences.vibration ? <Vibrate aria-hidden="true" /> : <VibrateOff aria-hidden="true" />} Vibration</span>
          <input type="checkbox" className="size-6 accent-green-700" checked={preferences.vibration} onChange={(event) => setPreferences((current) => ({ ...current, vibration: event.target.checked }))} aria-label="Vibration" />
        </label>
      </div>
      <p className="text-center text-sm font-medium">Your choices are saved on this device.</p>
      <BigButton onClick={onBack} variant="leaf">Back to Menu</BigButton>
    </section>
  );
}

function Game({ stats, question, timeLeft, total, feedback, phase, countIn, onPick, onPause, onQuit }: {
  stats: Stats; question: Question; timeLeft: number; total: number; feedback: Feedback | null;
  phase: Phase; countIn: number; onPick: (fruit: Fruit) => void; onPause: () => void; onQuit: () => void;
}) {
  const pct = Math.max(0, Math.min(100, (timeLeft / total) * 100));
  const urgent = timeLeft <= 1.5;
  const countLabel = countIn > 0 ? String(countIn) : "Go!";
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 text-3xl" role="img" aria-label={`${stats.lives} hearts left`}>
          {Array.from({ length: START_LIVES }, (_, index) => <span key={index} className={index < stats.lives ? "text-berry" : "text-bark/25"}>♥</span>)}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right"><div className="text-3xl font-bold">{stats.score}</div><div className="text-xs font-semibold uppercase">score</div></div>
          <Button variant="outline" size="icon" onClick={onPause} aria-label={phase === "paused" ? "Resume game" : "Pause game"} title={phase === "paused" ? "Resume" : "Pause"} className="size-11 rounded-full border-leaf/30 bg-cream text-leaf-deep">
            {phase === "paused" ? <Play /> : <Pause />}
          </Button>
        </div>
      </div>
      <div>
        <div className="mb-1 flex justify-between text-sm font-semibold"><span>Progress</span><span>{stats.score}/{TARGET_SCORE}</span></div>
        <div className="h-3 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full bg-gold transition-all" style={{ width: `${Math.min(100, stats.score)}%` }} /></div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`w-12 text-center text-2xl font-bold ${urgent ? "qm-pulse text-berry" : ""}`}>{Math.ceil(timeLeft)}</div>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-cream"><div className={`h-full rounded-full ${urgent ? "bg-berry" : "bg-leaf"}`} style={{ width: `${pct}%` }} /></div>
        <div className={`rounded-full bg-gold px-3 py-1 text-sm font-bold ${stats.combo > 1 ? "qm-pop" : ""}`}>Combo x{stats.combo}</div>
      </div>
      <section className={`rounded-3xl bg-cream p-3 text-center shadow-lg ${feedback?.outcome === "timeout" ? "qm-shake" : ""}`} key={`prompt-${question.id}`}>
        <p className="text-xs font-semibold uppercase">Find the</p>
        <p className="text-3xl font-bold text-leaf-deep">{question.target}</p>
        <p className="min-h-6 text-sm font-bold" aria-live="polite">
          {feedback?.outcome === "correct" && <span className="text-leaf-deep">{feedback.reward ? rewardLabel(feedback.reward) : "Great!"}</span>}
          {feedback?.outcome === "wrong" && <span className="text-berry">Oops! −1 heart · answer shown</span>}
          {feedback?.outcome === "timeout" && <span className="text-berry">Time&apos;s up! −1 heart · answer shown</span>}
        </p>
      </section>
      {phase === "paused" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 rounded-3xl border-2 border-leaf/20 bg-cream/80 p-6 text-center">
          <div className="text-5xl font-bold text-leaf-deep">Paused</div>
          <BigButton onClick={onPause}><Play className="mr-2" /> Resume</BigButton>
        </div>
      ) : phase === "countin" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl bg-cream/70 text-center" aria-live="assertive">
          <span className="text-sm font-semibold uppercase">Get ready</span>
          <span className="qm-pop text-7xl font-bold text-leaf-deep">{countLabel}</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {question.order.map((fruit) => {
            const picked = feedback?.pick === fruit;
            const rightShown = (feedback?.outcome === "wrong" || feedback?.outcome === "timeout") && question.target === fruit;
            const ring = rightShown
              ? "qm-glow border-leaf bg-leaf/15 hover:bg-leaf/15 disabled:opacity-100"
              : picked
                ? feedback?.outcome === "correct"
                  ? "qm-pop border-leaf disabled:opacity-100"
                  : "qm-shake border-berry disabled:opacity-100"
                : "border-transparent disabled:opacity-40";
            return (
              <Button key={`${question.id}-${fruit}`} variant="outline" disabled={!!feedback} onClick={() => onPick(fruit)}
                className={`relative flex aspect-square h-auto min-h-0 flex-col items-center justify-center rounded-2xl border-4 bg-cream p-2 shadow-md transition-opacity hover:bg-cream active:scale-95 [&_svg]:size-full ${ring}`} aria-label={fruit}>
                <span className="block size-[82%]"><FruitArt fruit={fruit} /></span>
                {rightShown && <span className="absolute bottom-1 rounded-full bg-leaf-deep px-2 py-0.5 text-[11px] font-bold text-cream">Answer</span>}
                <span className="sr-only">{fruit}</span>
              </Button>
            );
          })}
        </div>
      )}
      <Button variant="ghost" onClick={onQuit} className="mt-auto min-h-10 self-center text-sm font-semibold text-bark underline">Back to Menu</Button>
    </div>
  );
}

function EndScreen({ won, score, bestCombo, lives, stars, record, onRetry, onMenu }: { won: boolean; score: number; bestCombo: number; lives: number; stars: number; record: RecordEntry; onRetry: () => void; onMenu: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-5 text-center">
      <div className="h-20 w-20 qm-pop"><FruitArt fruit={won ? "Strawberry" : "Banana"} /></div>
      <h2 className={`text-4xl font-bold ${won ? "text-leaf-deep" : "text-berry"}`}>{won ? "Level Complete!" : "Game Over"}</h2>
      {won && <p className="text-4xl leading-none text-gold" aria-label={`${stars} stars`}>{"★".repeat(stars)}{"☆".repeat(3 - stars)}</p>}
      <div className="w-full rounded-3xl bg-cream p-5 shadow-lg">
        <p className="text-sm font-semibold uppercase">Final score</p>
        <p className="text-6xl font-bold text-gold drop-shadow-[0_2px_0_var(--bark)]">{score}</p>
        <p className="mt-2 font-semibold">Best combo: x{bestCombo}</p>
        <p className="mt-1 text-sm font-medium">Hearts left: {lives}</p>
        <div className="mt-4 border-t border-leaf/20 pt-3 text-sm font-semibold">Personal best: {record.bestScore} points · {record.bestStars ? `${"★".repeat(record.bestStars)}` : "No stars yet"}</div>
      </div>
      <BigButton onClick={onRetry}><RotateCcw className="mr-2" /> Retry</BigButton>
      <BigButton onClick={onMenu} variant="leaf">Back to Menu</BigButton>
      <p className="flex items-center gap-2 text-sm font-medium"><Check className="size-4 text-leaf-deep" /> Best scores saved on this device</p>
    </div>
  );
}