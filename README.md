# Draconic Dice

Draconic Dice is a browser-based scorekeeper built for multi-round dice and point games. Set a roster, choose a target score, track each round (with the rule that at least one player stays at zero), and crown the winners automatically when the target is reached. The app remembers your progress locally, supports undo/redo, and lets you import or export entire score histories.

## Features

- ⚙️ **Game setup**: Add or search players with enforced unique names, choose a default target score (50 by default), and start as soon as two players are ready.
- 🎯 **Round enforcement**: Inputs are clamped to whole numbers 0–20, with validation that every round has at least one zero and one non-zero entry.
- 📈 **Live analytics**: Scoreboard progress bars, cumulative score timeline chart, and a winner banner when the target is hit.
- 🕰️ **History & leaderboard**: Saved games include per-player totals plus round win/loss stats; the leaderboard aggregates games played, wins, best rounds, per-round averages, and lifetime round tallies.
- ♻️ **Undo/redo & persistence**: Every state change is tracked with undo/redo stacks and persisted to `localStorage`, so refreshes are safe.
- 🔄 **Import/export**: Merge imports with existing data (validated) or export everything as JSON for backups and sharing.
- 🌓 **Responsive UI**: Works on desktop and mobile, supports light/dark/system themes, and features touch-friendly controls.

## Tech Stack

- [React 19](https://react.dev/)
- [TypeScript 5](https://www.typescriptlang.org/)
- [Vite 7](https://vitejs.dev/)
- [Recharts](https://recharts.org/) for the cumulative score timeline
- [Vitest](https://vitest.dev/) for unit tests

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
npm install
```

### Development

Start the dev server with hot module replacement:

```bash
npm run dev
```

The app defaults to `http://localhost:5173`.

### Tests

```bash
npm run test
```

### Production Build

```bash
npm run build
```

The optimized site is emitted to `dist/`.

## Gameplay Overview

1. **Setup**: Add players via the search/add control and set a target score (default 50). At least two players are required to start.
2. **Rounds**: Each round auto-fills zeros. Adjust only the players who scored. The save button is enabled once the round has at least one zero and one non-zero value.
3. **Progress**: Scoreboard rows show cumulative totals and the points remaining to reach the target; the chart visualizes round-by-round progress.
4. **Ending**: When any player hits/exceeds the target, all tied leaders win. You can also end a match manually and immediately start a rematch with the same roster.
5. **History**: Finished games appear in the History tab (with round-level stats), and the Leaderboard tab aggregates all-time performance. Undo/redo is available throughout play.

## Importing & Exporting

- Use the **Import** button in the Setup panel to merge data (players, ongoing match, history) before starting a new game.
- The History drawer also exposes Import/Export/Clear controls for managing long-term archives.
- Exported files are JSON and can be re-imported later; malformed files are rejected with an error message.

## Deployment

Draconic Dice is a static SPA. Any static host (e.g., GitHub Pages, Netlify, Vercel) will work.

### GitHub Pages quick start

1. Build the project: `npm run build`
2. Copy the contents of `dist/` to a branch published via GitHub Pages (e.g., `gh-pages`).
3. If hosting under a project path (not `<user>.github.io` root), set `base` in `vite.config.ts` to `'/your-repo-name/'`.

To automate, add a GitHub Action that runs `npm ci`, `npm run build`, and deploys the `dist/` folder.

## Folder Structure

```
src/
  components/   UI building blocks (setup panel, scoreboard, history drawer, etc.)
  context/      GameProvider with undo/redo timeline, persistence, preferences
  services/     localStorage adapter
  utils/        Game logic helpers, id generators, unit tests
  App.tsx       Main app layout and view wiring
  main.tsx      Entry point
```

