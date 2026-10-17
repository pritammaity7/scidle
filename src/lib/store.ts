import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GuessResult, LetterStatus } from './gameEngine';
import { getDefaultStartDate, formatDateToISO, getToday } from './dateUtils';

export interface CompletedGame {
  date: string;
  won: boolean;
  guessCount: number;
  maxGuesses: number;
  guesses: GuessResult[][];
  scientistName: string;
  scientistDisplayName: string;
}

export interface CustomGameResult {
  shareId: string;
  won: boolean;
  guessCount: number;
  maxGuesses: number;
  guesses: GuessResult[][];
  scientistName: string;
  scientistDisplayName: string;
}

export interface ScientistInfo {
  name: string;
  displayName: string;
  info: string;
  field: string;
  era: string;
}

interface GameState {
  // Configuration
  startDate: string;
  
  // Current game state
  currentDate: string;
  puzzleNumber: number;
  nameLength: number;
  maxGuesses: number;
  guesses: GuessResult[][];
  currentGuess: string;
  gameOver: boolean;
  won: boolean;
  scientist: ScientistInfo | null;
  
  // Keyboard state
  keyboardStatus: Record<string, LetterStatus>;
  
  // Completed games history
  completedGames: CompletedGame[];
  
  // Custom games
  customGameId: string | null;
  customGameResults: CustomGameResult[];
  
  // UI state
  isAnimating: boolean;
  shakeRow: number | null;
  revealRow: number | null;
  
  // Settings
  darkMode: boolean;
  
  // Actions
  setStartDate: (date: Date) => void;
  setCurrentDate: (date: Date) => void;
  setNameLength: (length: number) => void;
  setMaxGuesses: (max: number) => void;
  setPuzzleNumber: (num: number) => void;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  submitGuess: (result: GuessResult[]) => void;
  setGameOver: (won: boolean, scientist: ScientistInfo | null) => void;
  setKeyboardStatus: (status: Record<string, LetterStatus>) => void;
  updateKeyboardStatus: (guessResult: GuessResult[]) => void;
  resetGame: () => void;
  setIsAnimating: (animating: boolean) => void;
  setShakeRow: (row: number | null) => void;
  setRevealRow: (row: number | null) => void;
  toggleDarkMode: () => void;
  loadGameState: (date: string) => void;
  saveGameState: () => void;
  setCustomGameId: (id: string | null) => void;
  addCompletedGame: (game: CompletedGame) => void;
  addCustomGameResult: (result: CustomGameResult) => void;
}

const STORAGE_KEY = 'scidle-game-state';

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Default configuration
      startDate: formatDateToISO(getDefaultStartDate()),
      
      // Current game state
      currentDate: formatDateToISO(getToday()),
      puzzleNumber: 1,
      nameLength: 6,
      maxGuesses: 8,
      guesses: [],
      currentGuess: '',
      gameOver: false,
      won: false,
      scientist: null,
      
      // Keyboard state
      keyboardStatus: {},
      
      // History
      completedGames: [],
      customGameResults: [],
      
      // Custom games
      customGameId: null,
      
      // UI state
      isAnimating: false,
      shakeRow: null,
      revealRow: null,
      
      // Settings
      darkMode: false,
      
      // Actions
      setStartDate: (date: Date) => {
        set({ startDate: formatDateToISO(date) });
      },
      
      setCurrentDate: (date: Date) => {
        const dateStr = formatDateToISO(date);
        const state = get();
        
        // Check if we have a saved game for this date
        const savedGame = state.completedGames.find(g => g.date === dateStr);
        
        if (savedGame) {
          set({
            currentDate: dateStr,
            guesses: savedGame.guesses,
            gameOver: true,
            won: savedGame.won,
            scientist: {
              name: savedGame.scientistName,
              displayName: savedGame.scientistDisplayName,
              info: '',
              field: '',
              era: ''
            }
          });
        } else {
          set({
            currentDate: dateStr,
            guesses: [],
            currentGuess: '',
            gameOver: false,
            won: false,
            scientist: null,
            keyboardStatus: {}
          });
        }
      },
      
      setNameLength: (length: number) => {
        set({ nameLength: length, maxGuesses: length + 2 });
      },
      
      setMaxGuesses: (max: number) => {
        set({ maxGuesses: max });
      },
      
      setPuzzleNumber: (num: number) => {
        set({ puzzleNumber: num });
      },
      
      addLetter: (letter: string) => {
        const state = get();
        if (state.currentGuess.length < state.nameLength && !state.gameOver) {
          set({ currentGuess: state.currentGuess + letter.toUpperCase() });
        }
      },
      
      removeLetter: () => {
        const state = get();
        if (state.currentGuess.length > 0 && !state.gameOver) {
          set({ currentGuess: state.currentGuess.slice(0, -1) });
        }
      },
      
      submitGuess: (result: GuessResult[]) => {
        const state = get();
        const newGuesses = [...state.guesses, result];
        set({ 
          guesses: newGuesses, 
          currentGuess: '',
          revealRow: state.guesses.length
        });
      },
      
      setGameOver: (won: boolean, scientist: ScientistInfo | null) => {
        set({ gameOver: true, won, scientist });
      },
      
      setKeyboardStatus: (status: Record<string, LetterStatus>) => {
        set({ keyboardStatus: status });
      },
      
      updateKeyboardStatus: (guessResult: GuessResult[]) => {
        const state = get();
        const newStatus = { ...state.keyboardStatus };
        
        for (const { letter, status: letterStatus } of guessResult) {
          const currentStatus = newStatus[letter];
          
          // Priority: correct > present > absent
          if (letterStatus === 'correct') {
            newStatus[letter] = 'correct';
          } else if (letterStatus === 'present' && currentStatus !== 'correct') {
            newStatus[letter] = 'present';
          } else if (letterStatus === 'absent' && !currentStatus) {
            newStatus[letter] = 'absent';
          }
        }
        
        set({ keyboardStatus: newStatus });
      },
      
      resetGame: () => {
        set({
          guesses: [],
          currentGuess: '',
          gameOver: false,
          won: false,
          scientist: null,
          keyboardStatus: {},
          shakeRow: null,
          revealRow: null
        });
      },
      
      setIsAnimating: (animating: boolean) => {
        set({ isAnimating: animating });
      },
      
      setShakeRow: (row: number | null) => {
        set({ shakeRow: row });
        if (row !== null) {
          setTimeout(() => set({ shakeRow: null }), 500);
        }
      },
      
      setRevealRow: (row: number | null) => {
        set({ revealRow: row });
      },
      
      toggleDarkMode: () => {
        const state = get();
        set({ darkMode: !state.darkMode });
      },
      
      loadGameState: (date: string) => {
        const state = get();
        const savedGame = state.completedGames.find(g => g.date === date);
        
        if (savedGame) {
          set({
            currentDate: date,
            guesses: savedGame.guesses,
            gameOver: true,
            won: savedGame.won,
            scientist: {
              name: savedGame.scientistName,
              displayName: savedGame.scientistDisplayName,
              info: '',
              field: '',
              era: ''
            }
          });
        }
      },
      
      saveGameState: () => {
        // The persist middleware handles saving
      },
      
      setCustomGameId: (id: string | null) => {
        set({ customGameId: id });
      },
      
      addCompletedGame: (game: CompletedGame) => {
        const state = get();
        const existing = state.completedGames.findIndex(g => g.date === game.date);
        
        if (existing >= 0) {
          const updated = [...state.completedGames];
          updated[existing] = game;
          set({ completedGames: updated });
        } else {
          set({ completedGames: [...state.completedGames, game] });
        }
      },
      
      addCustomGameResult: (result: CustomGameResult) => {
        const state = get();
        const existing = state.customGameResults.findIndex(r => r.shareId === result.shareId);
        
        if (existing >= 0) {
          const updated = [...state.customGameResults];
          updated[existing] = result;
          set({ customGameResults: updated });
        } else {
          set({ customGameResults: [...state.customGameResults, result] });
        }
      }
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        startDate: state.startDate,
        completedGames: state.completedGames,
        customGameResults: state.customGameResults,
        darkMode: state.darkMode
      })
    }
  )
);
