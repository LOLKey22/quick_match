# Quick Match – Find It Fast!

A fruit-matching reaction game by Group 11. Read the fruit name, tap the matching picture before the countdown ends, and reach 100 points without losing all three hearts.

## Prompt used to fix the countdown timer

C — CONTEXT

My Quick Match fruit-matching game has a countdown timer. The timer sometimes stops after a correct answer instead of restarting for the next question.

R — ROLE

Act as a Senior React and TypeScript Game Logic Debugger.

Y — YIELD

Fix the existing countdown timer logic in my Lovable application.

S — STEPS

Inspect the current countdown timer implementation.

Identify why the timer stops after a correct answer.

Ensure each new question starts with the full countdown.

Prevent multiple timers from running simultaneously.

Verify that a timeout removes exactly one heart.

Test correct answers, incorrect answers, and timeouts.

T — TARGET

Ensure the timer works consistently across consecutive questions.

A — ASSUMPTIONS

The application already has working scoring, lives, and fruit-matching systems.

L — LIMITS

Do not rebuild the application. Do not change the visual design or scoring rules. Preserve existing functionality.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://fruit-match-timekeeper.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2d0051a0-606d-47de-bb43-1ffabc0dc489).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
