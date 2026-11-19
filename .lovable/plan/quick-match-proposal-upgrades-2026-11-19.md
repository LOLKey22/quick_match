# Quick Match proposal upgrades

## What will change

Bring the playable game in line with the uploaded final proposal while keeping its fruit artwork and orchard look:
- Add Medium (4 seconds), a 3–2–1–Go count-in, and pause/resume that freezes the clock and covers the cards.
- Award +10 for a correct answer, +5 when at least half the time remains, and +10 on each fifth consecutive correct answer. Show the exact points earned. Wrong answers and timeouts still cost one heart and reset the streak; reveal the correct fruit in green.
- Prevent a question target from repeating immediately.
- Add How to Play and Settings screens, with sound and vibration toggles persisted on the device.
- Award completion stars based on hearts remaining and save/display each difficulty’s best score and star grade on the device.

## Implementation approach

Keep game rules in the existing pure game-logic module and verify scoring, target selection, difficulty and star grading with its adjacent tests. Extend the existing one-page screen flow, preserving a single countdown per active question; represent count-in and paused states explicitly so time only runs during active play. Store only personal records and comfort preferences in browser local storage, read after hydration, with safe defaults when storage is unavailable.

## Validation

Run the game-logic tests and TypeScript check, inspect the preview’s fresh build log, and exercise the primary mobile game flow including correct, incorrect, timeout and pause behavior.
