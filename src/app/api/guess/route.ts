import { NextRequest, NextResponse } from 'next/server';
import { createGameState, processGuess, convertToGuessResults, type LetterStatus } from '@/lib/gameEngine';
import { formatDate } from '@/lib/dateUtils';
import { isValidScientistName, getValidNamesByLength } from '@/data/scientists-dictionary';

// POST: Submit a guess
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guess, date, previousGuesses = [] } = body;

    if (!guess || typeof guess !== 'string') {
      return NextResponse.json({ error: 'Guess is required' }, { status: 400 });
    }

    const upperGuess = guess.toUpperCase().trim();
    const dateString = date || formatDate(new Date());

    // Create fresh game state
    let gameState = createGameState(dateString);

    // Replay previous guesses
    for (const prevGuess of previousGuesses) {
      gameState = processGuess(gameState, prevGuess);
    }

    // Check if game is already over
    if (gameState.gameOver) {
      return NextResponse.json({
        error: 'Game is already over',
        gameOver: true,
        won: gameState.won,
        scientist: gameState.won ? null : {
          name: gameState.scientist.name,
          displayName: gameState.scientist.displayName,
          info: gameState.scientist.info,
          field: gameState.scientist.field,
          era: gameState.scientist.era
        }
      }, { status: 400 });
    }

    // Validate guess length
    if (upperGuess.length !== gameState.scientist.name.length) {
      return NextResponse.json({
        error: `Guess must be ${gameState.scientist.name.length} letters`,
        validLength: gameState.scientist.name.length
      }, { status: 400 });
    }

    // Check if only letters
    if (!/^[A-Z]+$/.test(upperGuess)) {
      return NextResponse.json({
        error: 'Guess must contain only letters'
      }, { status: 400 });
    }

    // Check if the guess is a valid scientist name from the dictionary
    if (!isValidScientistName(upperGuess)) {
      return NextResponse.json({
        error: `"${guess}" is not a recognized scientist or mathematician name in our dictionary. Try another famous scientist!`,
        validScientistsCount: getValidNamesByLength(upperGuess.length).length
      }, { status: 400 });
    }

    // Process the guess
    gameState = processGuess(gameState, upperGuess);

    // Prepare response
    const lastGuess = gameState.guesses[gameState.guesses.length - 1];
    const resultArray = lastGuess?.result || [];

    // Convert to GuessResult format for the store
    const guessResults = convertToGuessResults(upperGuess, resultArray);

    const response: Record<string, unknown> = {
      result: guessResults, // Array of { letter, status } objects
      resultArray: resultArray, // Simple array of statuses
      guess: upperGuess,
      gameOver: gameState.gameOver,
      won: gameState.won,
      guessesUsed: gameState.guesses.length,
      maxGuesses: gameState.maxGuesses
    };

    // If game is over, include scientist info
    if (gameState.gameOver) {
      response.scientist = {
        name: gameState.scientist.name,
        displayName: gameState.scientist.displayName,
        info: gameState.scientist.info,
        field: gameState.scientist.field,
        era: gameState.scientist.era
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing guess:', error);
    return NextResponse.json({ error: 'Failed to process guess' }, { status: 500 });
  }
}
