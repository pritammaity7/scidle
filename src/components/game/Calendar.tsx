'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useGameStore } from '@/lib/store';
import { 
  formatDateToISO, 
  getToday, 
  isValidPlayDate, 
  parseISODate,
  formatDisplayDate,
  isToday
} from '@/lib/dateUtils';

interface CalendarProps {
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

export function GameCalendar({ onSelectDate, onClose }: CalendarProps) {
  const { startDate, completedGames, currentDate } = useGameStore();
  const [month, setMonth] = React.useState<Date>(new Date());
  
  const startDateParsed = parseISODate(startDate);
  const today = getToday();
  const currentDateParsed = parseISODate(currentDate);
  
  // Get completed dates
  const completedDates = React.useMemo(() => {
    return new Set(completedGames.map(g => g.date));
  }, [completedGames]);
  
  // Check if a date is completed
  const isDateCompleted = (date: Date): boolean => {
    return completedDates.has(formatDateToISO(date));
  };
  
  // Check if a date is won
  const isDateWon = (date: Date): boolean => {
    const game = completedGames.find(g => g.date === formatDateToISO(date));
    return game?.won ?? false;
  };
  
  // Handle date selection
  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Don't allow clicking on already completed games
    if (isDateCompleted(date)) {
      return;
    }
    
    if (!isValidPlayDate(date, startDateParsed)) {
      return;
    }
    
    onSelectDate(date);
    onClose();
  };
  
  // Custom day render
  const DayContent = (props: { date: Date; displayMonth: Date }) => {
    const { date } = props;
    const dateStr = formatDateToISO(date);
    const isValid = isValidPlayDate(date, startDateParsed);
    const isCurrentDate = dateStr === currentDate;
    const completed = isDateCompleted(date);
    const won = isDateWon(date);
    const isTodayDate = isToday(date);
    
    if (!isValid) {
      return (
        <span className="text-muted-foreground opacity-30">
          {date.getDate()}
        </span>
      );
    }
    
    // Completed games show as disabled/clicked
    if (completed) {
      return (
        <div 
          className={cn(
            "relative w-full h-full flex items-center justify-center cursor-not-allowed",
            isCurrentDate && "ring-2 ring-primary ring-offset-1 rounded"
          )}
        >
          <span className={won ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
            {date.getDate()}
          </span>
          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
            {won ? (
              <span className="text-emerald-500 text-[10px]">✓</span>
            ) : (
              <span className="text-red-500 text-[10px]">✗</span>
            )}
          </span>
        </div>
      );
    }
    
    return (
      <div 
        className={cn(
          "relative w-full h-full flex items-center justify-center cursor-pointer",
          isCurrentDate && "ring-2 ring-primary ring-offset-1 rounded"
        )}
      >
        <span className="text-foreground font-medium">{date.getDate()}</span>
        {isTodayDate && !completed && (
          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </div>
    );
  };
  
  return (
    <div className="p-4">
      <DayPicker
        mode="single"
        selected={currentDateParsed}
        onSelect={handleSelect}
        month={month}
        onMonthChange={setMonth}
        disabled={[
          { before: startDateParsed },
          { after: today }
        ]}
        components={{
          DayContent: DayContent as React.ComponentType<{ date: Date; displayMonth: Date }>
        }}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: cn(
            "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
            "[&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50",
            "[&:has([aria-selected].day-range-end)]:rounded-r-md",
            "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
            "h-9 w-9"
          ),
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "text-muted-foreground opacity-50",
          day_disabled: "text-muted-foreground opacity-30",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible"
        }}
      />
      
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-4 text-xs text-muted-foreground justify-center">
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-primary" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-emerald-500">✓</span>
            <span>Won</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-red-500">✗</span>
            <span>Lost</span>
          </div>
        </div>
      </div>
    </div>
  );
}
