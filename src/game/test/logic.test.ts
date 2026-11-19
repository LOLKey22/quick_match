import { describe, it, expect } from "vitest";
import { applyOutcome, LEVEL_SECONDS, makeQuestion, FRUITS, pointsFor, rewardLabel, starsFor } from "../logic";

describe("quick match rules", () => {
  it("correct answer gives +10 and increases combo", () => {
    expect(applyOutcome({ score: 20, lives: 3, combo: 2 }, "correct")).toEqual({ score: 30, lives: 3, combo: 3 });
  });
  it("wrong answer removes one heart and resets combo", () => {
    expect(applyOutcome({ score: 20, lives: 3, combo: 2 }, "wrong")).toEqual({ score: 20, lives: 2, combo: 0 });
  });
  it("timeout removes exactly one heart", () => {
    expect(applyOutcome({ score: 0, lives: 2, combo: 1 }, "timeout").lives).toBe(1);
  });
  it("easy is 5s, medium is 4s, and hard is 3s", () => {
    expect(LEVEL_SECONDS).toEqual({ easy: 5, medium: 4, hard: 3 });
  });
  it("each question shows all six fruits", () => {
    expect([...makeQuestion(1).order].sort()).toEqual([...FRUITS].sort());
  });
  it("a new target never repeats the previous fruit", () => {
    expect(makeQuestion(2, () => 0, "Apple").target).not.toBe("Apple");
  });
  it("awards a quick-answer bonus at exactly half the time remaining", () => {
    expect(pointsFor(2, 4, 1)).toEqual({ total: 15, quickBonus: 5, streakBonus: 0 });
    expect(pointsFor(1.99, 4, 1).total).toBe(10);
  });
  it("adds a 10-point bonus on every fifth correct answer in a streak", () => {
    expect(pointsFor(1, 4, 5)).toEqual({ total: 20, quickBonus: 0, streakBonus: 10 });
  });
  it("assigns 3, 2, or 1 stars based on hearts remaining", () => {
    expect([starsFor(3), starsFor(2), starsFor(1)]).toEqual([3, 2, 1]);
  });
  it("spells out each part of the reward without double counting", () => {
    expect(rewardLabel(pointsFor(4, 4, 1))).toBe("+10 Correct · +5 Quick");
    expect(rewardLabel(pointsFor(1, 4, 5))).toBe("+10 Correct · +10 Streak");
    expect(rewardLabel(pointsFor(1, 4, 2))).toBe("+10 Correct");
  });
});
