'use client';

import { useGameStore } from '@/lib/store';
import type { GuessResult, LetterStatus } from '@/lib/gameEngine';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface GameBoardProps {
  onRevealComplete?: () => void;
}

export function GameBoard({ onRevealComplete }: GameBoardProps) {
  const { 
    nameLength, 
    maxGuesses, 
    guesses, 
    currentGuess, 
    shakeRow, 
    revealRow,
    isAnimating,
    setIsAnimating,
    setRevealRow
  } = useGameStore();
  
  const [revealedIndices, setRevealedIndices] = useState<Set<string>>(new Set());
  const [flipIndices, setFlipIndices] = useState<Set<string>>(new Set());
  
  // Handle reveal animation
  useEffect(() => {
    if (revealRow !== null && revealRow >= 0) {
      setIsAnimating(true);
      const row = revealRow;
      const guessResult = guesses[row];
      
      if (!guessResult) return;
      
      // Flip each letter with a delay
      guessResult.forEach((_, index) => {
        setTimeout(() => {
          setFlipIndices(prev => new Set([...prev, `${row}-${index}`]));
          
          // After flip animation completes, mark as revealed
          setTimeout(() => {
            setRevealedIndices(prev => new Set([...prev, `${row}-${index}`]));
          }, 300);
          
          // After the last letter is revealed
          if (index === guessResult.length - 1) {
            setTimeout(() => {
              setFlipIndices(new Set());
              setRevealRow(null);
              setIsAnimating(false);
              onRevealComplete?.();
            }, 600);
          }
        }, index * 200); // Stagger the flip
      });
    }
  }, [revealRow, guesses, setRevealRow, setIsAnimating, onRevealComplete]);
  
  // Create empty rows to fill the board
  const rows: (GuessResult[] | null)[] = [];
  for (let i = 0; i < maxGuesses; i++) {
    if (i < guesses.length) {
      rows.push(guesses[i]!);
    } else if (i === guesses.length) {
      rows.push(null); // Current row
    } else {
      rows.push(null); // Empty rows
    }
  }
  
  // Calculate tile size based on name length and screen
  const getTileSize = () => {
    if (nameLength <= 5) return "w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 text-xl sm:text-2xl md:text-3xl";
    if (nameLength <= 7) return "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-lg sm:text-xl md:text-2xl";
    return "w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 text-base sm:text-lg md:text-xl";
  };
  
  return (
    <div className="flex flex-col items-center gap-1 sm:gap-1.5">
      {rows.map((guess, rowIndex) => (
        <div 
          key={rowIndex} 
          className={cn(
            "flex gap-1 sm:gap-1.5",
            shakeRow === rowIndex && "animate-shake"
          )}
        >
          {Array.from({ length: nameLength }).map((_, letterIndex) => {
            const letter = guess?.[letterIndex]?.letter || 
              (rowIndex === guesses.length ? currentGuess[letterIndex] || '' : '');
            const status = guess?.[letterIndex]?.status || 'empty';
            const isRevealed = revealedIndices.has(`${rowIndex}-${letterIndex}`);
            const isFlipping = flipIndices.has(`${rowIndex}-${letterIndex}`);
            const isCurrentRow = rowIndex === guesses.length;
            const hasLetter = letter !== '';
            const isPastRow = rowIndex < guesses.length;
            
            return (
              <LetterTile
                key={letterIndex}
                letter={letter}
                status={status}
                isRevealed={isRevealed}
                isFlipping={isFlipping}
                isCurrentRow={isCurrentRow}
                isPastRow={isPastRow}
                hasLetter={hasLetter}
                tileSize={getTileSize()}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface LetterTileProps {
  letter: string;
  status: LetterStatus;
  isRevealed: boolean;
  isFlipping: boolean;
  isCurrentRow: boolean;
  isPastRow: boolean;
  hasLetter: boolean;
  tileSize: string;
}

function LetterTile({ 
  letter, 
  status, 
  isRevealed, 
  isFlipping,
  isCurrentRow,
  isPastRow,
  hasLetter,
  tileSize
}: LetterTileProps) {
  // Track previous letter to detect changes for pop animation
  const [prevLetter, setPrevLetter] = useState(letter);
  const [showPop, setShowPop] = useState(false);
  
  // Only trigger pop when letter actually changes (new letter added)
  if (letter !== prevLetter) {
    setPrevLetter(letter);
    if (hasLetter && isCurrentRow && letter !== '') {
      setShowPop(true);
      setTimeout(() => setShowPop(false), 150);
    }
  }
  
  return (
    <div
      className={cn(
        tileSize,
        "flex items-center justify-center border-2 rounded-xl font-bold uppercase",
        "select-none transition-all duration-200",
        "relative overflow-hidden",
        // Empty tiles - LIGHT MODE: clear border, DARK MODE: subtle border
        status === 'empty' && !isCurrentRow && "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-transparent",
        // Current row empty tiles
        status === 'empty' && isCurrentRow && !hasLetter && "border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800/50",
        // Current row with letter (filled but not submitted)
        isCurrentRow && hasLetter && !isPastRow && [
          "border-slate-500 dark:border-slate-400",
          "bg-white dark:bg-slate-700",
          "shadow-lg text-slate-900 dark:text-white"
        ],
        // Flip animation
        isFlipping && "animate-flip",
        // Revealed states with gradient backgrounds
        status === 'correct' && isRevealed && [
          "tile-correct border-0",
          "shadow-lg shadow-emerald-500/40"
        ],
        status === 'present' && isRevealed && [
          "tile-present border-0",
          "shadow-lg shadow-amber-500/40"
        ],
        status === 'absent' && isRevealed && [
          "tile-absent border-0"
        ],
        // Past rows without reveal yet
        isPastRow && !isRevealed && !isFlipping && [
          "bg-slate-200 dark:bg-slate-800",
          "border-slate-400 dark:border-slate-600",
          "text-slate-900 dark:text-white"
        ],
        // Pop animation for current row
        showPop && "animate-pop"
      )}
    >
      {/* Shine effect for revealed tiles */}
      {(status === 'correct' || status === 'present') && isRevealed && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      )}
      
      {/* Letter */}
      <span className={cn(
        "relative z-10",
        status === 'correct' || status === 'present' || status === 'absent' 
          ? "text-white drop-shadow-sm" 
          : "text-slate-900 dark:text-white"
      )}>
        {letter}
      </span>
    </div>
  );
}
