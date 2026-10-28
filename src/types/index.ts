export type PillarArea = 'company' | 'self' | 'life';
export type TaskArea = 'company' | 'personal';
export type PriorityLevel = 'high' | 'med' | 'low';
export type TaskFilter = 'today' | 'upcoming' | 'done';

export interface DailyCheckin {
  id: string;
  date: string; // YYYY-MM-DD
  energy: number; // 1 to 5
  sleepHours: number;
  sleepQuality: 'poor' | 'fair' | 'good' | 'great';
  mood: number; // 1 to 5
  workoutDone: boolean;
  workoutNote: string;
  winLine: string;
  topPriority1: string;
  topPriority1Done: boolean;
  topPriority2: string;
  topPriority2Done: boolean;
  topPriority3: string;
  topPriority3Done: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  area: TaskArea;
  priority: PriorityLevel;
  dueDate: string | null; // YYYY-MM-DD
  status: 'todo' | 'done';
  completedAt: string | null;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[]; // JSON array in SQLite
  isPinned: boolean;
  checklist: ChecklistItem[]; // JSON array in SQLite
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mental: string;
  physical: string;
  emotional: string;
  company: string;
  didText: string;
  learnedText: string;
  nextText: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReview {
  id: string;
  weekStartDate: string; // YYYY-MM-DD (Monday)
  workedText: string;
  didntWorkText: string;
  focusNextWeek: string;
  createdAt: string;
}

export interface AppSettings {
  themeMode: 'system' | 'dark' | 'light';
  appLockEnabled: boolean;
  pinCode: string | null; // Stored securely
  biometricsEnabled: boolean;
  autoLockMinutes: number; // 0 = immediately, 1, 5, 15
}

export type RootTabParamList = {
  Today: undefined;
  Tasks: undefined;
  Notes: undefined;
  Journal: undefined;
  Insights: undefined;
};
