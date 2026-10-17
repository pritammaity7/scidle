'use client';

import { useGameStore } from '@/lib/store';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Award, Calendar, FlaskConical, RotateCcw, Trophy, Sparkles, BookOpen } from 'lucide-react';
import { ShareButton } from './ShareButton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScientistInfoProps {
  open: boolean;
  onClose: () => void;
  onPlayAgain?: () => void;
}

export function ScientistInfo({ open, onClose, onPlayAgain }: ScientistInfoProps) {
  const { 
    scientist, 
    won, 
    guesses, 
    puzzleNumber, 
    maxGuesses,
    currentDate,
    nameLength,
    customGameId
  } = useGameStore();
  
  if (!scientist) return null;
  
  const guessCount = guesses.length;
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg glass animate-scale-in p-0 overflow-hidden">
        {/* Header with gradient background */}
        <div className={cn(
          "relative px-6 py-8 text-center",
          won 
            ? "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600" 
            : "bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800"
        )}>
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          </div>
          
          <div className="relative z-10">
            {/* Icon */}
            <div className={cn(
              "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-xl",
              won ? "bg-white/20" : "bg-white/10"
            )}>
              {won ? (
                <Trophy className="w-8 h-8 text-white" />
              ) : (
                <Sparkles className="w-8 h-8 text-white" />
              )}
            </div>
            
            {/* Title */}
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {won ? "Brilliant!" : "Nice Try!"}
            </DialogTitle>
            
            <DialogDescription className="text-white/80 text-base">
              {won 
                ? `You solved it in ${guessCount} ${guessCount === 1 ? 'guess' : 'guesses'}!`
                : `The scientist was...`
              }
            </DialogDescription>
          </div>
        </div>
        
        <div className="px-6 py-5 space-y-5">
          {/* Scientist Name */}
          <div className="text-center">
            <h3 className="text-3xl sm:text-4xl font-bold tracking-wide uppercase bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent mb-1">
              {scientist.name}
            </h3>
            <p className="text-lg text-muted-foreground">
              {scientist.displayName}
            </p>
          </div>
          
          {/* Badges */}
          <div className="flex justify-center gap-2 flex-wrap">
            {scientist.field && (
              <Badge 
                variant="secondary" 
                className="gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                {scientist.field}
              </Badge>
            )}
            {scientist.era && (
              <Badge 
                variant="outline" 
                className="gap-1.5 px-3 py-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                {scientist.era}
              </Badge>
            )}
          </div>
          
          <Separator />
          
          {/* Bio */}
          <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="absolute -top-3 left-4 bg-background px-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm leading-relaxed text-foreground pt-1">
              {scientist.info}
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="w-4 h-4" />
              <span>Puzzle #{customGameId ? '?' : puzzleNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-bold text-lg",
                won ? "text-emerald-500" : "text-slate-500"
              )}>
                {guessCount}/{maxGuesses}
              </span>
              <span className="text-muted-foreground">guesses</span>
            </div>
          </div>
          
          <Separator />
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <ShareButton 
              won={won}
              guessCount={guessCount}
              maxGuesses={maxGuesses}
              puzzleNumber={puzzleNumber}
              guesses={guesses}
              customGameId={customGameId}
            />
            {onPlayAgain && (
              <Button 
                variant="outline" 
                onClick={() => {
                  onClose();
                  onPlayAgain();
                }}
                className="flex-1 gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
