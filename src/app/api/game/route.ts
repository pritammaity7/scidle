import { NextRequest, NextResponse } from 'next/server';
import { createGameState, GameState } from '@/lib/gameEngine';
import { formatDate, isValidPlayDate, parseDate, parseISODate, getDefaultStartDate } from '@/lib/dateUtils';
import { getPuzzleNumber } from '@/lib/dateUtils';

// GET: Get game state for a date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateString = searchParams.get('date') || formatDate(new Date());
    const startDateParam = searchParams.get('startDate');
    
    // Use startDate from query param or default
    const startDate = startDateParam ? parseISODate(startDateParam) : getDefaultStartDate();
    
    // Check if date is valid
    const requestDate = parseDate(dateString);
    
    if (!isValidPlayDate(requestDate, startDate)) {
      // If it's before start date, still allow getting the puzzle info
      // but mark it as not yet playable
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (requestDate > today) {
        return NextResponse.json({
          error: 'Cannot play future games',
          playable: false
        }, { status: 400 });
      }
    }
    
    // Get the scientist for this date
    const gameState = createGameState(dateString);
    
    // Calculate puzzle number based on the provided start date
    const puzzleNumber = getPuzzleNumber(requestDate, startDate);
    
    // Return public info (not the answer)
    return NextResponse.json({
      nameLength: gameState.scientist.name.length,
      puzzleNumber: puzzleNumber,
      maxGuesses: gameState.maxGuesses,
      playable: true,
      date: dateString
    });
  } catch (error) {
    console.error('Error getting game:', error);
    return NextResponse.json({ error: 'Failed to get game' }, { status: 500 });
  }
}
