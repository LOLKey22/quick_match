export const FRUITS = ["Apple", "Banana", "Orange", "Strawberry", "Grapes", "Papaya"] as const;
export type Fruit = (typeof FRUITS)[number];
export type Level = "easy" | "medium" | "hard";

export const LEVEL_SECONDS: Record<Level, number> = { easy: 5, medium: 4, hard: 3 };
export const START_LIVES = 3;
export const POINTS_PER_CORRECT = 10;
export const TARGET_SCORE = 100;

export interface Question {
  id: number;
  target: Fruit;
  order: Fruit[];
}

export function shuffle<T>(items: readonly T[], rand = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const current = a[i];
    const chosen = a[j];
    if (current === undefined || chosen === undefined) continue;
    [a[i], a[j]] = [chosen, current];
  }
  return a;
}

export function makeQuestion(id: number, rand = Math.random, previousTarget?: Fruit): Question {
  const available = previousTarget ? FRUITS.filter((fruit) => fruit !== previousTarget) : FRUITS;
  const target = available[Math.floor(rand() * available.length)] ?? "Apple";
  return { id, target, order: shuffle(FRUITS, rand) };
}

export interface Stats {
  score: number;
  lives: number;
  combo: number;
}

export type Outcome = "correct" | "wrong" | "timeout";

export interface AnswerReward {
  total: number;
  quickBonus: number;
  streakBonus: number;
}

export function pointsFor(secondsLeft: number, limit: number, streak: number): AnswerReward {
  const quickBonus = secondsLeft >= limit / 2 ? 5 : 0;
  const streakBonus = streak > 0 && streak % 5 === 0 ? 10 : 0;
  return { total: POINTS_PER_CORRECT + quickBonus + streakBonus, quickBonus, streakBonus };
}

/** Breakdown shown after a right answer, e.g. "+10 Correct · +5 Quick · +10 Streak". */
export function rewardLabel(reward: AnswerReward): string {
  const parts = [`+${POINTS_PER_CORRECT} Correct`];
  if (reward.quickBonus) parts.push(`+${reward.quickBonus} Quick`);
  if (reward.streakBonus) parts.push(`+${reward.streakBonus} Streak`);
  return parts.join(" · ");
}

export function applyOutcome(s: Stats, outcome: Outcome, earnedPoints = POINTS_PER_CORRECT): Stats {
  if (outcome === "correct") {
    return { score: s.score + earnedPoints, lives: s.lives, combo: s.combo + 1 };
  }
  return { score: s.score, lives: Math.max(0, s.lives - 1), combo: 0 };
}

export function starsFor(livesRemaining: number): number {
  if (livesRemaining >= START_LIVES) return 3;
  if (livesRemaining === START_LIVES - 1) return 2;
  return 1;
}
