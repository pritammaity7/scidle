import { scientists as baseScientists } from './scientists-base';

// Re-export everything
export interface Scientist {
  id: string;
  name: string;
  displayName: string;
  info: string;
  field: string;
  era: string;
}

export const scientists: Scientist[] = baseScientists;

export function getScientistsByLength(length: number): Scientist[] {
  return scientists.filter(s => s.name.length === length);
}

export function getAvailableLengths(): number[] {
  const lengths = new Set(scientists.map(s => s.name.length));
  return Array.from(lengths).sort();
}

export const totalScientists = scientists.length;
