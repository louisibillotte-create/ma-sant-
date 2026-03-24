export interface SportSession {
  activity: string;
  duration: number; // minutes
}

export type FoodQuality = 'Très équilibrée' | 'Plutôt saine' | 'Moyenne' | 'Fast-food' | 'Mauvaise';

export interface WeekData {
  id: string; // ISO week string e.g. "2025-W10"
  date: string; // ISO date string for the Monday of that week
  // Body
  weight: number | null;
  waist: number | null;
  // Food
  foodQuality: FoodQuality | null;
  fruitVegPortions: number;
  homeMeals: number; // out of 21
  mealDetails: string;
  // Activity
  stepsPerDay: number;
  totalKm: number;
  sportSessions: SportSession[];
  // Alcohol
  beer: number;
  wine: number;
  spirits: number;
  // Well-being
  energy: number; // 1-10
  sleep: number; // 1-10
  // Notes
  coachNotes: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AppData {
  weeks: WeekData[];
  chatHistory: ChatMessage[];
}
