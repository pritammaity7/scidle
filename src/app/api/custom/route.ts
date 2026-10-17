import { NextRequest, NextResponse } from 'next/server';
import { getScientistById, getAllScientists, calculateMaxGuesses, evaluateGuess, convertToGuessResults, type LetterStatus } from '@/lib/gameEngine';
import { isValidScientistName } from '@/data/scientists-dictionary';

// POST: Create a custom game OR submit a guess for custom game
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a guess submission
    if (body.guess && body.shareId) {
      // Handle guess submission for custom game
      const { guess, shareId, guesses: previousGuesses = [] } = body;
      
      // Decode the share ID to get the scientist name (or custom name)
      let scientistName: string;
      let scientistInfo = null;
      
      try {
        const decoded = Buffer.from(shareId, 'base64url').toString('utf-8');
        
        // Check if it's a custom name (starts with 'custom:') or a scientist ID
        if (decoded.startsWith('custom:')) {
          scientistName = decoded.replace('custom:', '');
        } else {
          // It's a scientist ID, look it up
          const scientist = getScientistById(decoded);
          if (!scientist) {
            return NextResponse.json({ error: 'Scientist not found' }, { status: 404 });
          }
          scientistName = scientist.name;
          scientistInfo = {
            name: scientist.name,
            displayName: scientist.displayName,
            info: scientist.info,
            field: scientist.field,
            era: scientist.era
          };
        }
      } catch {
        return NextResponse.json({ error: 'Invalid share ID' }, { status: 400 });
      }
      
      const upperGuess = guess.toUpperCase().trim();
      const maxGuesses = calculateMaxGuesses(scientistName.length);
      
      // Check guess length
      if (upperGuess.length !== scientistName.length) {
        return NextResponse.json({
          error: `Guess must be ${scientistName.length} letters`,
          validLength: scientistName.length
        }, { status: 400 });
      }
      
      // Check if only letters
      if (!/^[A-Z]+$/.test(upperGuess)) {
        return NextResponse.json({
          error: 'Guess must contain only letters'
        }, { status: 400 });
      }
      
      // Check if the guess is a valid scientist name from the dictionary
      // Skip this check for custom games (they allow any name)
      if (!scientistName.startsWith('custom:') && !isValidScientistName(upperGuess)) {
        return NextResponse.json({
          error: `"${guess}" is not a recognized scientist or mathematician name in our dictionary. Try another famous scientist!`
        }, { status: 400 });
      }
      
      // Evaluate the guess
      const resultArray = evaluateGuess(upperGuess, scientistName);
      const guessResults = convertToGuessResults(upperGuess, resultArray);
      
      const totalGuesses = previousGuesses.length + 1;
      const won = resultArray.every(r => r === 'correct');
      const gameOver = won || totalGuesses >= maxGuesses;
      
      const response: Record<string, unknown> = {
        result: guessResults,
        resultArray: resultArray,
        guess: upperGuess,
        gameOver,
        won,
        guessesUsed: totalGuesses,
        maxGuesses
      };
      
      if (gameOver) {
        // If we have scientist info from the database, use it
        // Otherwise create generic info for custom names
        if (scientistInfo) {
          response.scientist = scientistInfo;
        } else {
          response.scientist = {
            name: scientistName,
            displayName: formatDisplayName(scientistName),
            info: `A custom puzzle with the name "${formatDisplayName(scientistName)}". Challenge your friends to guess it!`,
            field: 'Custom Puzzle',
            era: 'Created by you'
          };
        }
      }
      
      return NextResponse.json(response);
    }
    
    // Handle creating a new custom game
    const { scientistId, customName } = body;
    
    // If customName is provided, create a game with that name
    if (customName) {
      const name = customName.toUpperCase().trim();
      
      if (name.length < 3 || name.length > 10) {
        return NextResponse.json({ error: 'Name must be 3-10 letters' }, { status: 400 });
      }
      
      if (!/^[A-Z]+$/.test(name)) {
        return NextResponse.json({ error: 'Name must contain only letters' }, { status: 400 });
      }
      
      // Create share ID with 'custom:' prefix to distinguish from scientist IDs
      const shareId = Buffer.from(`custom:${name}`).toString('base64url');
      
      return NextResponse.json({
        shareId,
        shareUrl: `/custom/${shareId}`,
        nameLength: name.length,
        maxGuesses: calculateMaxGuesses(name.length),
        displayName: formatDisplayName(name)
      });
    }
    
    // Otherwise, use scientistId
    if (!scientistId) {
      return NextResponse.json({ error: 'Scientist ID or custom name is required' }, { status: 400 });
    }
    
    const scientist = getScientistById(scientistId);
    if (!scientist) {
      return NextResponse.json({ error: 'Scientist not found' }, { status: 404 });
    }
    
    // Generate a share ID using the scientist ID
    const shareId = Buffer.from(scientistId).toString('base64url');
    
    return NextResponse.json({
      shareId,
      shareUrl: `/custom/${shareId}`,
      nameLength: scientist.name.length,
      maxGuesses: calculateMaxGuesses(scientist.name.length),
      displayName: scientist.displayName
    });
  } catch (error) {
    console.error('Error in custom game:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// GET: Get custom game or list of scientists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('id') || searchParams.get('shareId');
    const list = searchParams.get('list');
    
    // If list=true, return all scientists for selection
    if (list === 'true') {
      const allScientists = getAllScientists().map(s => ({
        id: s.id,
        displayName: s.displayName,
        nameLength: s.name.length,
        field: s.field,
        era: s.era
      }));
      
      return NextResponse.json({ scientists: allScientists });
    }
    
    // If shareId provided, get that custom game
    if (shareId) {
      try {
        const decoded = Buffer.from(shareId, 'base64url').toString('utf-8');
        
        // Check if it's a custom name or scientist ID
        if (decoded.startsWith('custom:')) {
          const name = decoded.replace('custom:', '');
          return NextResponse.json({
            nameLength: name.length,
            maxGuesses: calculateMaxGuesses(name.length),
            displayName: formatDisplayName(name),
            field: 'Custom Puzzle'
          });
        }
        
        // It's a scientist ID
        const scientist = getScientistById(decoded);
        
        if (!scientist) {
          return NextResponse.json({ error: 'Custom game not found' }, { status: 404 });
        }
        
        return NextResponse.json({
          nameLength: scientist.name.length,
          maxGuesses: calculateMaxGuesses(scientist.name.length),
          displayName: scientist.displayName,
          field: scientist.field
        });
      } catch {
        return NextResponse.json({ error: 'Invalid share ID' }, { status: 400 });
      }
    }
    
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error getting custom game:', error);
    return NextResponse.json({ error: 'Failed to get custom game' }, { status: 500 });
  }
}

// Helper function to format display name from custom name
function formatDisplayName(name: string): string {
  // Convert uppercase name to title case (e.g., "EINSTEIN" -> "Einstein")
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}
