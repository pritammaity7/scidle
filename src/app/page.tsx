'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameStore, type CompletedGame } from '@/lib/store';
import { GameBoard } from '@/components/game/GameBoard';
import { Keyboard, useKeyboardInput } from '@/components/game/Keyboard';
import { GameCalendar } from '@/components/game/Calendar';
import { ScientistInfo } from '@/components/game/ScientistInfo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter
} from '@/components/ui/drawer';
import { 
  Calendar as CalendarIcon, 
  Settings, 
  FlaskConical,
  Moon,
  Sun,
  HelpCircle,
  Sparkles,
  Trophy,
  Flame,
  BarChart3,
  X,
  Play,
  Share2,
  ChevronRight,
  Star,
  Target,
  Zap,
  BookOpen,
  Users,
  Copy
} from 'lucide-react';
import { formatDateToISO, getToday, parseISODate, formatDisplayDate } from '@/lib/dateUtils';
import type { GuessResult } from '@/lib/gameEngine';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Home() {
  const {
    startDate,
    currentDate,
    puzzleNumber,
    nameLength,
    maxGuesses,
    guesses,
    currentGuess,
    gameOver,
    won,
    scientist,
    darkMode,
    customGameId,
    completedGames,
    setStartDate,
    setCurrentDate,
    setNameLength,
    setMaxGuesses,
    setPuzzleNumber,
    addLetter,
    removeLetter,
    submitGuess,
    setGameOver,
    updateKeyboardStatus,
    resetGame,
    setShakeRow,
    setCustomGameId,
    addCompletedGame,
    setRevealRow,
    guesses: storedGuesses
  } = useGameStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showScientistInfo, setShowScientistInfo] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [customScientistName, setCustomScientistName] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Calculate stats
  const stats = {
    played: completedGames.length,
    won: completedGames.filter(g => g.won).length,
    currentStreak: calculateCurrentStreak(completedGames),
    maxStreak: calculateMaxStreak(completedGames),
    winPercentage: completedGames.length > 0 
      ? Math.round((completedGames.filter(g => g.won).length / completedGames.length) * 100) 
      : 0,
    averageGuesses: completedGames.length > 0 
      ? Math.round(completedGames.filter(g => g.won).reduce((acc, g) => acc + g.guessCount, 0) / completedGames.filter(g => g.won).length) || 0
      : 0
  };
  
  // Initialize game on mount
  useEffect(() => {
    // Check for first visit
    const hasVisited = localStorage.getItem('scidle-visited');
    if (!hasVisited) {
      setShowWelcome(true);
      localStorage.setItem('scidle-visited', 'true');
    }
    
    // Check for custom game in URL
    const urlParams = new URLSearchParams(window.location.search);
    const customId = urlParams.get('custom');
    
    if (customId) {
      loadCustomGame(customId);
    } else {
      loadDailyGame();
    }
    
    // Apply dark mode
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  
  // Show scientist info when game ends
  useEffect(() => {
    if (gameOver && scientist) {
      // Trigger reveal animation for the last row
      if (guesses.length > 0) {
        setRevealRow(guesses.length - 1);
      }
      setTimeout(() => setShowScientistInfo(true), 1200);
    }
  }, [gameOver, scientist, guesses.length, setRevealRow]);
  
  const loadDailyGame = async () => {
    try {
      setIsLoading(true);
      const today = getToday();
      
      const response = await fetch(
        `/api/game?date=${formatDateToISO(today)}&startDate=${startDate}`
      );
      
      if (!response.ok) {
        if (response.status === 400) {
          setShowSettings(true);
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to load game');
      }
      
      const data = await response.json();
      
      setNameLength(data.nameLength);
      setMaxGuesses(data.maxGuesses);
      setPuzzleNumber(data.puzzleNumber);
      setCurrentDate(today);
      setCustomGameId(null);
      
      if (storedGuesses.length > 0) {
        // Keep existing guesses for this date
      } else {
        resetGame();
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading game:', err);
      setError('Failed to load game. Please try again.');
      setIsLoading(false);
    }
  };
  
  const loadCustomGame = async (shareId: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/custom?id=${shareId}`);
      
      if (!response.ok) {
        throw new Error('Custom game not found');
      }
      
      const data = await response.json();
      
      setNameLength(data.nameLength);
      setMaxGuesses(data.maxGuesses);
      setCustomGameId(shareId);
      resetGame();
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading custom game:', err);
      setError('Custom game not found. Loading daily game instead.');
      loadDailyGame();
    }
  };
  
  const loadGameForDate = async (date: Date) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(
        `/api/game?date=${formatDateToISO(date)}&startDate=${startDate}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load game');
      }
      
      const data = await response.json();
      
      setNameLength(data.nameLength);
      setMaxGuesses(data.maxGuesses);
      setPuzzleNumber(data.puzzleNumber);
      setCurrentDate(date);
      setCustomGameId(null);
      resetGame();
      
      setIsLoading(false);
      setShowCalendar(false);
    } catch (err) {
      console.error('Error loading game for date:', err);
      toast.error('Failed to load game for this date');
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = useCallback(async (key: string) => {
    if (gameOver || isLoading) return;

    if (key === 'ENTER') {
      if (currentGuess.length !== nameLength) {
        setShakeRow(guesses.length);
        toast.error(`Guess must be ${nameLength} letters`);
        return;
      }

      try {
        const endpoint = customGameId ? '/api/custom' : '/api/guess';
        const previousGuessStrings = guesses.map(g => g.map(gr => gr.letter).join(''));

        const body = customGameId
          ? { guess: currentGuess, shareId: customGameId, guesses: previousGuessStrings }
          : { guess: currentGuess, date: currentDate, startDate, previousGuesses: previousGuessStrings };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.error || 'Invalid guess');
          setShakeRow(guesses.length);
          return;
        }

        const data = await response.json();

        submitGuess(data.result);
        updateKeyboardStatus(data.result);
        
        // Trigger reveal animation
        setRevealRow(guesses.length);

        if (data.gameOver) {
          setTimeout(() => {
            setGameOver(data.won, data.scientist);

            if (!customGameId) {
              const completedGame: CompletedGame = {
                date: currentDate,
                won: data.won,
                guessCount: guesses.length + 1,
                maxGuesses,
                guesses: [...guesses, data.result],
                scientistName: data.scientist.name,
                scientistDisplayName: data.scientist.displayName
              };
              addCompletedGame(completedGame);
            }
          }, nameLength * 150 + 500);
        }
      } catch (err) {
        console.error('Error submitting guess:', err);
        toast.error('Failed to submit guess');
      }
    } else if (key === 'BACK') {
      removeLetter();
    } else {
      addLetter(key);
    }
  }, [gameOver, isLoading, currentGuess, nameLength, guesses, customGameId, currentDate, startDate, submitGuess, updateKeyboardStatus, setGameOver, addCompletedGame, maxGuesses, setShakeRow, removeLetter, addLetter, setRevealRow]);
  
  const { handleKeyDown } = useKeyboardInput(handleKeyPress);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  const handleSaveSettings = () => {
    if (tempStartDate) {
      const newStartDate = parseISODate(tempStartDate);
      setStartDate(newStartDate);
      loadDailyGame();
    }
    setShowSettings(false);
    setTempStartDate('');
  };
  
  const handleCreateCustomGame = async () => {
    const name = customScientistName.trim().toUpperCase();
    
    if (!name) {
      toast.error('Please enter a scientist name');
      return;
    }
    
    if (name.length < 3 || name.length > 10) {
      toast.error('Name must be 3-10 letters');
      return;
    }
    
    if (!/^[A-Z]+$/.test(name)) {
      toast.error('Name must contain only letters');
      return;
    }
    
    try {
      const response = await fetch('/api/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customName: name })
      });
      
      if (!response.ok) throw new Error('Failed to create custom game');
      
      const data = await response.json();
      
      // Generate the full shareable link
      const shareLink = `${window.location.origin}/?custom=${data.shareId}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareLink);
      
      // Show the generated link in UI
      setGeneratedLink(shareLink);
      setCustomScientistName('');
      
      toast.success('Link copied to clipboard! Share it with friends.');
    } catch (err) {
      console.error('Error creating custom game:', err);
      toast.error('Failed to create custom game');
    }
  };
  
  const handleCopyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success('Link copied!');
    } catch {
      toast.error('Failed to copy');
    }
  };
  
  const toggleDarkMode = () => {
    useGameStore.getState().toggleDarkMode();
    document.documentElement.classList.toggle('dark');
  };

  if (error) {
    return (
      <div className="min-h-screen game-background flex items-center justify-center p-4">
        <div className="text-center glass rounded-2xl p-8 max-w-md animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-500 mb-6 text-lg">{error}</p>
          <Button onClick={() => window.location.reload()} className="btn-gradient text-white">
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen game-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left - Calendar */}
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20">
                <CalendarIcon className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 glass" align="start">
              <GameCalendar 
                onSelectDate={loadGameForDate}
                onClose={() => setShowCalendar(false)}
              />
            </PopoverContent>
          </Popover>
          
          {/* Center - Logo */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <FlaskConical className="w-7 h-7 text-emerald-500 logo-glow animate-float" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight responsive-title">
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                Scidle
              </span>
            </h1>
          </div>
          
          {/* Right - Actions */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setShowStats(true)} className="rounded-full hover:bg-white/20">
              <BarChart3 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowHelp(true)} className="rounded-full hover:bg-white/20">
              <HelpCircle className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-full hover:bg-white/20">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="rounded-full hover:bg-white/20">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Game Info Bar */}
      <div className="glass border-b border-white/5 py-2 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-2 text-sm">
          {customGameId ? (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <Sparkles className="w-3.5 h-3.5" />
              Custom Game
            </Badge>
          ) : (
            <>
              <Badge variant="outline" className="gap-1.5 px-3 py-1">
                <Target className="w-3.5 h-3.5" />
                #{puzzleNumber}
              </Badge>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{formatDisplayDate(parseISODate(currentDate))}</span>
            </>
          )}
        </div>
      </div>
      
      {/* Main Game */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="h-10 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-64 w-full max-w-sm bg-slate-200 dark:bg-slate-700 rounded-xl" />
          </div>
        ) : (
          <>
            {/* Hint Card */}
            <div className="text-center animate-fade-in">
              <p className="text-lg sm:text-xl font-semibold mb-1">
                Guess the Scientist
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-medium text-foreground">{nameLength}</span> letters
                </span>
                <span className="mx-2">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-medium text-foreground">{maxGuesses}</span> guesses
                </span>
              </p>
            </div>
            
            {/* Game Board */}
            <div className="animate-slide-up">
              <GameBoard />
            </div>
            
            {/* Keyboard */}
            <div className="w-full max-w-xl pb-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <Keyboard onKeyPress={handleKeyPress} disabled={isLoading || gameOver} />
            </div>
          </>
        )}
      </main>
      
      {/* Footer Stats Preview */}
      {!isLoading && !gameOver && (
        <div className="glass border-t border-white/5 py-3 px-4">
          <div className="max-w-2xl mx-auto flex items-center justify-center gap-6 text-sm">
            <button 
              onClick={() => setShowStats(true)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Trophy className="w-4 h-4" />
              <span>{stats.won} wins</span>
            </button>
            <button 
              onClick={() => setShowStats(true)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Flame className="w-4 h-4 text-orange-500" />
              <span>{stats.currentStreak} streak</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Welcome Modal */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-lg glass animate-scale-in">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <FlaskConical className="w-10 h-10 text-white" />
            </div>
            <DialogTitle className="text-2xl">
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Welcome to Scidle!
              </span>
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              The scientist-themed word guessing game
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-emerald-500 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
                <p className="text-xs font-medium">Correct</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-amber-500 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">B</span>
                </div>
                <p className="text-xs font-medium">Wrong Spot</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-slate-500 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">C</span>
                </div>
                <p className="text-xs font-medium">Not in Name</p>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm text-center">
                Guess the famous scientist&apos;s name in 6-9 tries. 
                A new puzzle every day!
              </p>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-center">
            <Button 
              onClick={() => setShowWelcome(false)} 
              className="btn-gradient text-white px-8"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Playing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* How to Play Modal */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="sm:max-w-lg glass animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-500" />
              How to Play
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className="space-y-3">
              <p className="text-muted-foreground">
                Guess the <span className="font-semibold text-foreground">famous scientist or mathematician</span> in as few tries as possible.
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                Rules
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">1</span>
                  Each guess must be a valid name with the correct number of letters.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">2</span>
                  The color of the tiles will change to show how close your guess was.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">3</span>
                  A new puzzle is available each day at midnight!
                </li>
              </ul>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-semibold">Color Meanings</h4>
              
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">A</div>
                  <span className="text-sm">Green = Correct position</span>
                </div>
                
                <div className="flex items-center gap-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">B</div>
                  <span className="text-sm">Yellow = Wrong position but in the name</span>
                </div>
                
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <div className="w-10 h-10 bg-slate-500 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">C</div>
                  <span className="text-sm">Gray = Not in the name</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-violet-500" />
                <h4 className="font-semibold text-sm">Custom Games</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Create custom puzzles with any scientist name to challenge your friends! Enter any name 3-10 letters long.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowHelp(false)} className="btn-gradient text-white">
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Statistics Modal */}
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="sm:max-w-md glass animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              Statistics
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <div className="text-center p-3 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <div className="text-2xl font-bold">{stats.played}</div>
                <div className="text-xs text-muted-foreground">Played</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <div className="text-2xl font-bold text-emerald-500">{stats.winPercentage}%</div>
                <div className="text-xs text-muted-foreground">Win %</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <div className="text-2xl font-bold text-orange-500">{stats.currentStreak}</div>
                <div className="text-xs text-muted-foreground">Streak</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <div className="text-2xl font-bold">{stats.maxStreak}</div>
                <div className="text-xs text-muted-foreground">Best</div>
              </div>
            </div>
            
            {/* Average Guesses */}
            {stats.won > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Average Guesses</span>
                  <span className="text-sm font-semibold">{stats.averageGuesses}</span>
                </div>
                <Progress value={(stats.averageGuesses / maxGuesses) * 100} className="h-2" />
              </div>
            )}
            
            {/* Guess Distribution */}
            {stats.won > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Guess Distribution</h4>
                <GuessDistribution completedGames={completedGames} maxGuesses={maxGuesses} />
              </div>
            )}
            
            {stats.played === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Play your first game to see statistics!</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowStats(false)} className="btn-gradient text-white">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={(open) => {
        setShowSettings(open);
        if (!open) setGeneratedLink(null);
      }}>
        <DialogContent className="sm:max-w-md glass animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Start Date Setting */}
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={tempStartDate || startDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
              />
              <p className="text-xs text-muted-foreground">
                Set the first playable date for daily puzzles.
              </p>
            </div>
            
            <Separator />
            
            {/* Create Custom Game */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Create Custom Game
              </Label>
              
              {generatedLink ? (
                /* Show generated link */
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-muted-foreground mb-2">Share this link with friends:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 break-all">
                        {generatedLink}
                      </code>
                      <Button 
                        size="sm" 
                        onClick={handleCopyLink}
                        className="shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setGeneratedLink(null)}
                    className="w-full"
                  >
                    Create Another Game
                  </Button>
                </div>
              ) : (
                /* Show input form */
                <>
                  <Input
                    placeholder="Enter any scientist name (3-10 letters)"
                    value={customScientistName}
                    onChange={(e) => setCustomScientistName(e.target.value.toUpperCase())}
                    maxLength={10}
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-lg tracking-wider font-mono text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Letters: {customScientistName.length}/10</span>
                    <span className={customScientistName.length >= 3 ? "text-emerald-500" : ""}>
                      {customScientistName.length >= 3 ? "✓ Valid length" : "Min 3 letters"}
                    </span>
                  </div>
                  <Button 
                    onClick={handleCreateCustomGame}
                    disabled={customScientistName.length < 3}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    Generate Share Link
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Enter any name to create a custom puzzle for friends!
                  </p>
                </>
              )}
            </div>
            
            <Separator />
            
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="darkMode" className="text-sm font-medium flex items-center gap-2">
                {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                Dark Mode
              </Label>
              <Switch
                id="darkMode"
                checked={darkMode}
                onCheckedChange={toggleDarkMode}
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} className="btn-gradient text-white">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Scientist Info Modal */}
      <ScientistInfo 
        open={showScientistInfo} 
        onClose={() => setShowScientistInfo(false)}
        onPlayAgain={() => {
          setShowScientistInfo(false);
          resetGame();
          loadDailyGame();
        }}
      />
    </div>
  );
}

// Helper functions
function calculateCurrentStreak(games: CompletedGame[]): number {
  if (games.length === 0) return 0;
  
  const sortedGames = [...games].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  let streak = 0;
  let expectedDate = new Date();
  expectedDate.setHours(0, 0, 0, 0);
  
  for (const game of sortedGames) {
    const gameDate = new Date(game.date);
    gameDate.setHours(0, 0, 0, 0);
    
    if (!game.won) break;
    
    const diffDays = Math.floor((expectedDate.getTime() - gameDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0 || diffDays === 1) {
      streak++;
      expectedDate = gameDate;
    } else {
      break;
    }
  }
  
  return streak;
}

function calculateMaxStreak(games: CompletedGame[]): number {
  if (games.length === 0) return 0;
  
  const sortedGames = [...games].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let maxStreak = 0;
  let currentStreak = 0;
  
  for (const game of sortedGames) {
    if (game.won) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  
  return maxStreak;
}

// Guess Distribution Component
function GuessDistribution({ completedGames, maxGuesses }: { completedGames: CompletedGame[], maxGuesses: number }) {
  const wonGames = completedGames.filter(g => g.won);
  
  // Count guesses
  const distribution: Record<number, number> = {};
  for (let i = 1; i <= maxGuesses; i++) {
    distribution[i] = 0;
  }
  
  wonGames.forEach(game => {
    distribution[game.guessCount] = (distribution[game.guessCount] || 0) + 1;
  });
  
  const maxCount = Math.max(...Object.values(distribution), 1);
  
  return (
    <div className="space-y-1.5">
      {Object.entries(distribution).map(([guess, count]) => (
        <div key={guess} className="flex items-center gap-2 text-sm">
          <span className="w-4 text-right font-medium">{guess}</span>
          <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-end px-2 text-white text-xs font-medium transition-all duration-500"
              style={{ width: `${Math.max((count / maxCount) * 100, count > 0 ? 15 : 0)}%` }}
            >
              {count > 0 && count}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
