import type { AppData, WeekData, ChatMessage } from '../types';

const STORAGE_KEY = 'vitalite_v1';

function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function generateSeedData(): WeekData[] {
  const weeks: WeekData[] = [];
  const now = new Date();

  for (let i = 3; i >= 0; i--) {
    const weekDate = new Date(now);
    weekDate.setDate(weekDate.getDate() - i * 7);
    const monday = getMondayOfWeek(weekDate);

    const baseWeight = 78.5 - i * 0.3 + (Math.random() - 0.5) * 0.4;
    const baseSteps = 7200 + Math.floor(Math.random() * 3000);

    const foodQualities = ['Très équilibrée', 'Plutôt saine', 'Moyenne', 'Plutôt saine'] as const;

    weeks.push({
      id: getISOWeek(monday),
      date: monday.toISOString().split('T')[0],
      weight: Math.round(baseWeight * 10) / 10,
      waist: 88 - i * 0.5,
      foodQuality: foodQualities[i % foodQualities.length],
      fruitVegPortions: 3 + Math.floor(Math.random() * 3),
      homeMeals: 12 + Math.floor(Math.random() * 6),
      mealDetails: i === 0 ? 'Bonne semaine avec beaucoup de légumes verts et peu de sucre raffiné.' : '',
      stepsPerDay: baseSteps,
      totalKm: Math.round(baseSteps * 7 * 0.0007 * 10) / 10,
      sportSessions: [
        { activity: 'Course à pied', duration: 35 + Math.floor(Math.random() * 20) },
        { activity: 'Musculation', duration: 45 },
      ],
      beer: Math.floor(Math.random() * 4),
      wine: Math.floor(Math.random() * 3),
      spirits: Math.floor(Math.random() * 2),
      energy: 6 + Math.floor(Math.random() * 3),
      sleep: 6 + Math.floor(Math.random() * 3),
      coachNotes: i === 0 ? 'Je me sens mieux cette semaine, la fatigue diminue.' : '',
    });
  }

  return weeks;
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as AppData;
    }
  } catch {
    // ignore parse errors
  }

  const seed: AppData = {
    weeks: generateSeedData(),
    chatHistory: [],
  };
  saveData(seed);
  return seed;
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveWeek(week: WeekData): void {
  const data = loadData();
  const idx = data.weeks.findIndex((w) => w.id === week.id);
  if (idx >= 0) {
    data.weeks[idx] = week;
  } else {
    data.weeks.push(week);
  }
  data.weeks.sort((a, b) => a.date.localeCompare(b.date));
  saveData(data);
}

export function saveChatHistory(messages: ChatMessage[]): void {
  const data = loadData();
  data.chatHistory = messages;
  saveData(data);
}

export function getCurrentWeekId(): string {
  return getISOWeek(new Date());
}

export function getCurrentWeekDate(): string {
  return getMondayOfWeek(new Date()).toISOString().split('T')[0];
}
