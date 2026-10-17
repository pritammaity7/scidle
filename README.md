# SciGuess

A Wordle-style daily guessing game where you guess famous scientists and mathematicians. Guess the name letter-by-letter using clues about the scientist's field, era, and achievements.

## Tech Stack

- **Next.js 16** (App Router, standalone output)
- **React 19** + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (Radix primitives)
- **Zustand** for client state
- **Sonner** for toasts
- **Vaul** for mobile drawers

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build (standalone output) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── custom/      # Custom share-link games
│   │   ├── game/        # Daily puzzle state
│   │   └── guess/       # Guess evaluation
│   ├── globals.css      # Tailwind theme + design tokens
│   ├── layout.tsx       # Root layout, fonts, toaster
│   └── page.tsx         # Main game UI
├── components/
│   ├── game/            # GameBoard, Keyboard, Calendar, ScientistInfo, ShareButton
│   └── ui/              # shadcn/ui primitives (button, dialog, drawer, etc.)
├── data/
│   ├── scientists.ts        # Active scientist list
│   ├── scientists-base.ts   # Full scientist database
│   └── scientists-dictionary.ts  # Name validation dictionary
└── lib/
    ├── dateUtils.ts     # Puzzle date math
    ├── encryption.ts    # Share-link ID encryption
    ├── gameEngine.ts    # Core game logic (guessing, scoring)
    ├── store.ts         # Zustand game store
    └── utils.ts         # cn() helper
```

## How It Works

1. A daily puzzle is generated from the scientist database based on the date.
2. You guess names; each letter is colored by correctness (like Wordle).
3. Clues (field, era, achievements) are revealed as you make guesses.
4. Progress is stored locally; share links encode the puzzle via encrypted IDs.
