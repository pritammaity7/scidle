import { scientists, Scientist } from '@/data/scientists';
import { getPuzzleIndex } from './encryption';
import { formatDate, parseDate, getPuzzleNumber } from './dateUtils';

export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty' | 'pending';

export interface GuessResult {
  letter: string;
  status: LetterStatus;
}

export interface GuessWithResult {
  guess: string;
  result: LetterStatus[];
}

export interface GameState {
  scientist: Scientist;
  guesses: GuessWithResult[];
  maxGuesses: number;
  gameOver: boolean;
  won: boolean;
  puzzleNumber: number;
}

// Get scientist for a specific date
export function getScientistForDate(dateString: string): Scientist {
  const puzzleIndex = getPuzzleIndex(dateString, scientists.length);
  return scientists[puzzleIndex];
}

// Get scientist by ID
export function getScientistById(id: string): Scientist | undefined {
  return scientists.find(s => s.id === id);
}

// Check if a guess is a valid scientist name (for validation)
export function isValidScientistName(name: string): boolean {
  const upperName = name.toUpperCase();
  return scientists.some(s => s.name === upperName);
}

// Evaluate a guess against the answer
export function evaluateGuess(guess: string, answer: string): LetterStatus[] {
  const result: LetterStatus[] = [];
  const answerUpper = answer.toUpperCase();
  const guessUpper = guess.toUpperCase();
  
  // Create a copy of answer letters for counting
  const answerLetters = answerUpper.split('');
  const guessLetters = guessUpper.split('');
  
  // First pass: mark correct letters
  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] === answerLetters[i]) {
      result[i] = 'correct';
      answerLetters[i] = '#'; // Mark as used
    }
  }
  
  // Second pass: mark present letters
  for (let i = 0; i < guessLetters.length; i++) {
    if (result[i]) continue;
    
    const letterIndex = answerLetters.indexOf(guessLetters[i]);
    if (letterIndex !== -1) {
      result[i] = 'present';
      answerLetters[letterIndex] = '#'; // Mark as used
    } else {
      result[i] = 'absent';
    }
  }
  
  return result;
}

// Calculate max guesses based on name length
export function calculateMaxGuesses(nameLength: number): number {
  // More guesses for longer names
  if (nameLength <= 4) return 6;
  if (nameLength <= 6) return 7;
  if (nameLength <= 8) return 8;
  return 9;
}

// Create initial game state
export function createGameState(dateString: string): GameState {
  const scientist = getScientistForDate(dateString);
  const date = parseDate(dateString);
  // Use today as the start date so puzzle #1 is today
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const puzzleNumber = getPuzzleNumber(date, startDate);
  
  return {
    scientist,
    guesses: [],
    maxGuesses: calculateMaxGuesses(scientist.name.length),
    gameOver: false,
    won: false,
    puzzleNumber
  };
}

// Process a guess
export function processGuess(gameState: GameState, guess: string): GameState {
  if (gameState.gameOver) {
    return gameState;
  }
  
  const upperGuess = guess.toUpperCase();
  const result = evaluateGuess(upperGuess, gameState.scientist.name);
  
  const newGuesses = [...gameState.guesses, { guess: upperGuess, result }];
  const won = result.every(r => r === 'correct');
  const gameOver = won || newGuesses.length >= gameState.maxGuesses;
  
  return {
    ...gameState,
    guesses: newGuesses,
    gameOver,
    won
  };
}

// Get all scientists for custom game selection
export function getAllScientists(): Scientist[] {
  return scientists;
}

// Get scientists grouped by name length
export function getScientistsByLength(): Record<number, Scientist[]> {
  const grouped: Record<number, Scientist[]> = {};
  
  for (const scientist of scientists) {
    const length = scientist.name.length;
    if (!grouped[length]) {
      grouped[length] = [];
    }
    grouped[length].push(scientist);
  }
  
  return grouped;
}

// Generate share text from game state
export function generateShareText(gameState: GameState): string;
export function generateShareText(
  won: boolean,
  guessCount: number,
  maxGuesses: number,
  puzzleNumber: number,
  guesses: GuessResult[][]
): string;
export function generateShareText(
  wonOrState: boolean | GameState,
  guessCount?: number,
  maxGuesses?: number,
  puzzleNumber?: number,
  guesses?: GuessResult[][]
): string {
  let emojiGrid: string;
  let header: string;

  if (typeof wonOrState === 'object') {
    // Called with GameState
    const gameState = wonOrState;
    emojiGrid = gameState.guesses.map(guess => {
      return guess.result.map(r => {
        switch (r) {
          case 'correct': return '🟩';
          case 'present': return '🟨';
          case 'absent': return '⬛';
          default: return '⬛';
        }
      }).join('');
    }).join('\n');

    header = `Scidle #${gameState.puzzleNumber} ${gameState.won ? gameState.guesses.length : 'X'}/${gameState.maxGuesses}`;
  } else {
    // Called with individual parameters
    const won = wonOrState;
    if (!guesses || guessCount === undefined || maxGuesses === undefined || puzzleNumber === undefined) {
      throw new Error('Missing required parameters');
    }

    emojiGrid = guesses.map(guessRow => {
      return guessRow.map(g => {
        switch (g.status) {
          case 'correct': return '🟩';
          case 'present': return '🟨';
          case 'absent': return '⬛';
          default: return '⬛';
        }
      }).join('');
    }).join('\n');

    header = `Scidle #${puzzleNumber} ${won ? guessCount : 'X'}/${maxGuesses}`;
  }

  return `${header}\n\n${emojiGrid}`;
}

// Convert guess and result arrays to GuessResult format for the store
export function convertToGuessResults(guess: string, result: LetterStatus[]): GuessResult[] {
  return guess.split('').map((letter, index) => ({
    letter,
    status: result[index] || 'absent'
  }));
}
