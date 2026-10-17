'use client';

import { useGameStore } from '@/lib/store';
import type { LetterStatus } from '@/lib/gameEngine';
import { cn } from '@/lib/utils';
import { Delete, CornerDownLeft } from 'lucide-react';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  disabled?: boolean;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
];

export function Keyboard({ onKeyPress, disabled }: KeyboardProps) {
  const { keyboardStatus, gameOver } = useGameStore();
  
  const getKeyClass = (key: string): string => {
    const status = keyboardStatus[key];
    
    switch (status) {
      case 'correct':
        return 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/30';
      case 'present':
        return 'bg-gradient-to-b from-amber-400 to-amber-600 text-white border-amber-500 shadow-lg shadow-amber-500/30';
      case 'absent':
        return 'bg-gradient-to-b from-slate-400 to-slate-600 text-white border-slate-500';
      default:
        return 'bg-gradient-to-b from-white to-slate-100 dark:from-slate-600 dark:to-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-500 shadow-md';
    }
  };
  
  const handleKeyClick = (key: string) => {
    if (disabled || gameOver) return;
    onKeyPress(key);
  };
  
  return (
    <div className="flex flex-col items-center gap-1 sm:gap-1.5 w-full max-w-xl mx-auto px-1">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex justify-center gap-1 sm:gap-1.5 w-full"
        >
          {row.map((key) => {
            const isSpecialKey = key === 'ENTER' || key === 'BACK';
            const isEnter = key === 'ENTER';
            const isBack = key === 'BACK';
            
            return (
              <button
                key={key}
                onClick={() => handleKeyClick(key)}
                disabled={disabled || gameOver}
                className={cn(
                  "flex items-center justify-center rounded-lg font-bold text-xs sm:text-sm uppercase",
                  "border-2 select-none keyboard-key",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all duration-150",
                  // Size based on key type
                  isSpecialKey 
                    ? "px-2 sm:px-3 h-11 sm:h-12 md:h-14 min-w-[45px] sm:min-w-[55px] md:min-w-[65px]" 
                    : "w-7 sm:w-8 md:w-10 h-11 sm:h-12 md:h-14",
                  // Color based on status
                  !isSpecialKey && getKeyClass(key),
                  // Special keys styling
                  isSpecialKey && "bg-gradient-to-b from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-violet-500 shadow-lg shadow-violet-500/30"
                )}
              >
                {isEnter && (
                  <span className="flex items-center gap-1">
                    <CornerDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline text-xs">Enter</span>
                  </span>
                )}
                {isBack && <Delete className="w-4 h-4 sm:w-5 sm:h-5" />}
                {!isSpecialKey && key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Hook for handling keyboard events
export function useKeyboardInput(onKeyPress: (key: string) => void, disabled?: boolean) {
  const { gameOver, isAnimating } = useGameStore();
  
  const handleKeyDown = (event: KeyboardEvent) => {
    if (disabled || gameOver || isAnimating) return;
    
    // Don't intercept keys if user is typing in an input or textarea
    const activeElement = document.activeElement;
    const isTyping = activeElement instanceof HTMLInputElement || 
                     activeElement instanceof HTMLTextAreaElement;
    
    if (isTyping) return;
    
    const key = event.key.toUpperCase();
    
    // Handle letter keys
    if (/^[A-Z]$/.test(key)) {
      event.preventDefault();
      onKeyPress(key);
      return;
    }
    
    // Handle Enter
    if (event.key === 'Enter') {
      event.preventDefault();
      onKeyPress('ENTER');
      return;
    }
    
    // Handle Backspace
    if (event.key === 'Backspace') {
      event.preventDefault();
      onKeyPress('BACK');
      return;
    }
  };
  
  return { handleKeyDown };
}
