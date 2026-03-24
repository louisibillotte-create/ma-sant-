import type { AppData, WeekData, ChatMessage, DailyLog } from '../types';

const STORAGE_KEY = 'vitalite_v2';
export const API_KEY_STORAGE = 'vitalite_api_key';

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

const emptyData: AppData = {
  weeks: [],
  dailyLogs: [],
  chatHistory: [],
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppData>;
      return {
        weeks: parsed.weeks ?? [],
        dailyLogs: parsed.dailyLogs ?? [],
        chatHistory: parsed.chatHistory ?? [],
      };
    }
  } catch {
    // ignore parse errors
  }
  return { ...emptyData };
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

export function saveDailyLog(log: DailyLog): void {
  const data = loadData();
  const idx = data.dailyLogs.findIndex((l) => l.id === log.id);
  if (idx >= 0) {
    data.dailyLogs[idx] = log;
  } else {
    data.dailyLogs.push(log);
  }
  data.dailyLogs.sort((a, b) => a.date.localeCompare(b.date));
  saveData(data);
}

export function getDailyLog(dateId: string): DailyLog | undefined {
  return loadData().dailyLogs.find((l) => l.id === dateId);
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

export function toDateId(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) ?? (import.meta.env.VITE_ANTHROPIC_API_KEY as string) ?? '';
}

export function saveApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE, key);
}
