import { getDatabase } from './database';
import {
  DailyCheckin,
  TaskItem,
  NoteItem,
  JournalEntry,
  WeeklyReview,
  TaskFilter,
  TaskArea,
} from '../types';

// Helper to generate UUID-like IDs
export const generateId = (): string => {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
};

// ==================== DAILY CHECK-IN ====================

export const getDailyCheckin = (dateStr: string): DailyCheckin | null => {
  const db = getDatabase();
  const row = db.getFirstSync<any>(
    'SELECT * FROM daily_checkins WHERE date = ?',
    [dateStr]
  );
  if (!row) return null;

  return {
    id: row.id,
    date: row.date,
    energy: row.energy,
    sleepHours: row.sleep_hours,
    sleepQuality: row.sleep_quality,
    mood: row.mood,
    workoutDone: Boolean(row.workout_done),
    workoutNote: row.workout_note || '',
    winLine: row.win_line || '',
    topPriority1: row.top_priority_1 || '',
    topPriority1Done: Boolean(row.top_priority_1_done),
    topPriority2: row.top_priority_2 || '',
    topPriority2Done: Boolean(row.top_priority_2_done),
    topPriority3: row.top_priority_3 || '',
    topPriority3Done: Boolean(row.top_priority_3_done),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const upsertDailyCheckin = (checkin: Partial<DailyCheckin> & { date: string }): DailyCheckin => {
  const db = getDatabase();
  const existing = getDailyCheckin(checkin.date);
  const now = new Date().toISOString();

  if (existing) {
    const updated: DailyCheckin = {
      ...existing,
      ...checkin,
      updatedAt: now,
    };

    db.runSync(
      `UPDATE daily_checkins SET
        energy = ?,
        sleep_hours = ?,
        sleep_quality = ?,
        mood = ?,
        workout_done = ?,
        workout_note = ?,
        win_line = ?,
        top_priority_1 = ?,
        top_priority_1_done = ?,
        top_priority_2 = ?,
        top_priority_2_done = ?,
        top_priority_3 = ?,
        top_priority_3_done = ?,
        updated_at = ?
      WHERE date = ?`,
      [
        updated.energy,
        updated.sleepHours,
        updated.sleepQuality,
        updated.mood,
        updated.workoutDone ? 1 : 0,
        updated.workoutNote,
        updated.winLine,
        updated.topPriority1,
        updated.topPriority1Done ? 1 : 0,
        updated.topPriority2,
        updated.topPriority2Done ? 1 : 0,
        updated.topPriority3,
        updated.topPriority3Done ? 1 : 0,
        now,
        checkin.date,
      ]
    );
    return updated;
  } else {
    const newId = checkin.id || generateId();
    const fullCheckin: DailyCheckin = {
      id: newId,
      date: checkin.date,
      energy: checkin.energy ?? 3,
      sleepHours: checkin.sleepHours ?? 7,
      sleepQuality: checkin.sleepQuality ?? 'good',
      mood: checkin.mood ?? 3,
      workoutDone: checkin.workoutDone ?? false,
      workoutNote: checkin.workoutNote ?? '',
      winLine: checkin.winLine ?? '',
      topPriority1: checkin.topPriority1 ?? '',
      topPriority1Done: checkin.topPriority1Done ?? false,
      topPriority2: checkin.topPriority2 ?? '',
      topPriority2Done: checkin.topPriority2Done ?? false,
      topPriority3: checkin.topPriority3 ?? '',
      topPriority3Done: checkin.topPriority3Done ?? false,
      createdAt: now,
      updatedAt: now,
    };

    db.runSync(
      `INSERT INTO daily_checkins (
        id, date, energy, sleep_hours, sleep_quality, mood, workout_done, workout_note,
        win_line, top_priority_1, top_priority_1_done, top_priority_2, top_priority_2_done,
        top_priority_3, top_priority_3_done, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullCheckin.id,
        fullCheckin.date,
        fullCheckin.energy,
        fullCheckin.sleepHours,
        fullCheckin.sleepQuality,
        fullCheckin.mood,
        fullCheckin.workoutDone ? 1 : 0,
        fullCheckin.workoutNote,
        fullCheckin.winLine,
        fullCheckin.topPriority1,
        fullCheckin.topPriority1Done ? 1 : 0,
        fullCheckin.topPriority2,
        fullCheckin.topPriority2Done ? 1 : 0,
        fullCheckin.topPriority3,
        fullCheckin.topPriority3Done ? 1 : 0,
        now,
        now,
      ]
    );
    return fullCheckin;
  }
};

// ==================== TASKS ====================

export const getTasks = (filter: TaskFilter = 'today', areaFilter?: TaskArea | 'all'): TaskItem[] => {
  const db = getDatabase();
  const todayStr = new Date().toISOString().split('T')[0];

  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params: any[] = [];

  if (filter === 'today') {
    query += ' AND (status = "todo" AND (due_date = ? OR due_date IS NULL OR due_date < ?))';
    params.push(todayStr, todayStr);
  } else if (filter === 'upcoming') {
    query += ' AND status = "todo" AND due_date > ?';
    params.push(todayStr);
  } else if (filter === 'done') {
    query += ' AND status = "done"';
  }

  if (areaFilter && areaFilter !== 'all') {
    query += ' AND area = ?';
    params.push(areaFilter);
  }

  query += ` ORDER BY 
    CASE priority 
      WHEN 'high' THEN 1 
      WHEN 'med' THEN 2 
      WHEN 'low' THEN 3 
    END ASC, 
    created_at DESC`;

  const rows = db.getAllSync<any>(query, params);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    area: r.area as TaskArea,
    priority: r.priority,
    dueDate: r.due_date,
    status: r.status,
    completedAt: r.completed_at,
    createdAt: r.created_at,
  }));
};

export const createTask = (
  task: Omit<TaskItem, 'id' | 'status' | 'completedAt' | 'createdAt'>
): TaskItem => {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  db.runSync(
    `INSERT INTO tasks (id, title, area, priority, due_date, status, completed_at, created_at)
     VALUES (?, ?, ?, ?, ?, 'todo', NULL, ?)`,
    [id, task.title.trim(), task.area, task.priority, task.dueDate || null, now]
  );

  return {
    id,
    title: task.title.trim(),
    area: task.area,
    priority: task.priority,
    dueDate: task.dueDate || null,
    status: 'todo',
    completedAt: null,
    createdAt: now,
  };
};

export const toggleTaskStatus = (id: string, currentStatus: 'todo' | 'done'): 'todo' | 'done' => {
  const db = getDatabase();
  const nextStatus = currentStatus === 'todo' ? 'done' : 'todo';
  const completedAt = nextStatus === 'done' ? new Date().toISOString() : null;

  db.runSync('UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?', [
    nextStatus,
    completedAt,
    id,
  ]);
  return nextStatus;
};

export const deleteTask = (id: string) => {
  const db = getDatabase();
  db.runSync('DELETE FROM tasks WHERE id = ?', [id]);
};

// ==================== NOTES ====================

export const getNotes = (searchQuery?: string, tagFilter?: string): NoteItem[] => {
  const db = getDatabase();
  let query = 'SELECT * FROM notes WHERE 1=1';
  const params: any[] = [];

  if (searchQuery && searchQuery.trim().length > 0) {
    const s = `%${searchQuery.trim().toLowerCase()}%`;
    query += ' AND (LOWER(title) LIKE ? OR LOWER(content) LIKE ? OR LOWER(checklist) LIKE ?)';
    params.push(s, s, s);
  }

  query += ' ORDER BY is_pinned DESC, updated_at DESC';

  const rows = db.getAllSync<any>(query, params);
  let notes: NoteItem[] = rows.map((r) => {
    let tags: string[] = [];
    let checklist: any[] = [];
    try {
      tags = JSON.parse(r.tags || '[]');
    } catch {
      tags = [];
    }
    try {
      checklist = JSON.parse(r.checklist || '[]');
    } catch {
      checklist = [];
    }

    return {
      id: r.id,
      title: r.title,
      content: r.content || '',
      tags,
      isPinned: Boolean(r.is_pinned),
      checklist,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });

  if (tagFilter && tagFilter !== 'All') {
    notes = notes.filter((n) => n.tags.includes(tagFilter));
  }

  return notes;
};

export const createNote = (
  note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>
): NoteItem => {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  db.runSync(
    `INSERT INTO notes (id, title, content, tags, is_pinned, checklist, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      note.title.trim() || 'Untitled Note',
      note.content,
      JSON.stringify(note.tags || []),
      note.isPinned ? 1 : 0,
      JSON.stringify(note.checklist || []),
      now,
      now,
    ]
  );

  return {
    id,
    title: note.title.trim() || 'Untitled Note',
    content: note.content,
    tags: note.tags,
    isPinned: note.isPinned,
    checklist: note.checklist,
    createdAt: now,
    updatedAt: now,
  };
};

export const updateNote = (note: NoteItem): NoteItem => {
  const db = getDatabase();
  const now = new Date().toISOString();

  db.runSync(
    `UPDATE notes SET
      title = ?,
      content = ?,
      tags = ?,
      is_pinned = ?,
      checklist = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      note.title.trim() || 'Untitled Note',
      note.content,
      JSON.stringify(note.tags || []),
      note.isPinned ? 1 : 0,
      JSON.stringify(note.checklist || []),
      now,
      note.id,
    ]
  );

  return {
    ...note,
    updatedAt: now,
  };
};

export const deleteNote = (id: string) => {
  const db = getDatabase();
  db.runSync('DELETE FROM notes WHERE id = ?', [id]);
};

// ==================== JOURNAL ====================

export const getJournalEntry = (dateStr: string): JournalEntry | null => {
  const db = getDatabase();
  const row = db.getFirstSync<any>(
    'SELECT * FROM journal_entries WHERE date = ?',
    [dateStr]
  );
  if (!row) return null;

  return {
    id: row.id,
    date: row.date,
    mental: row.mental || '',
    physical: row.physical || '',
    emotional: row.emotional || '',
    company: row.company || '',
    didText: row.did_text || '',
    learnedText: row.learned_text || '',
    nextText: row.next_text || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const upsertJournalEntry = (
  entry: Partial<JournalEntry> & { date: string }
): JournalEntry => {
  const db = getDatabase();
  const existing = getJournalEntry(entry.date);
  const now = new Date().toISOString();

  if (existing) {
    const updated: JournalEntry = {
      ...existing,
      ...entry,
      updatedAt: now,
    };

    db.runSync(
      `UPDATE journal_entries SET
        mental = ?,
        physical = ?,
        emotional = ?,
        company = ?,
        did_text = ?,
        learned_text = ?,
        next_text = ?,
        updated_at = ?
      WHERE date = ?`,
      [
        updated.mental,
        updated.physical,
        updated.emotional,
        updated.company,
        updated.didText,
        updated.learnedText,
        updated.nextText,
        now,
        entry.date,
      ]
    );
    return updated;
  } else {
    const id = entry.id || generateId();
    const newEntry: JournalEntry = {
      id,
      date: entry.date,
      mental: entry.mental || '',
      physical: entry.physical || '',
      emotional: entry.emotional || '',
      company: entry.company || '',
      didText: entry.didText || '',
      learnedText: entry.learnedText || '',
      nextText: entry.nextText || '',
      createdAt: now,
      updatedAt: now,
    };

    db.runSync(
      `INSERT INTO journal_entries (
        id, date, mental, physical, emotional, company,
        did_text, learned_text, next_text, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        newEntry.date,
        newEntry.mental,
        newEntry.physical,
        newEntry.emotional,
        newEntry.company,
        newEntry.didText,
        newEntry.learnedText,
        newEntry.nextText,
        now,
        now,
      ]
    );
    return newEntry;
  }
};

export const getJournalDatesWithEntries = (): string[] => {
  const db = getDatabase();
  const rows = db.getAllSync<{ date: string }>(
    'SELECT DISTINCT date FROM journal_entries ORDER BY date DESC'
  );
  return rows.map((r) => r.date);
};

// ==================== WEEKLY REVIEW ====================

export const getWeeklyReview = (weekStartDate: string): WeeklyReview | null => {
  const db = getDatabase();
  const row = db.getFirstSync<any>(
    'SELECT * FROM weekly_reviews WHERE week_start_date = ?',
    [weekStartDate]
  );
  if (!row) return null;

  return {
    id: row.id,
    weekStartDate: row.week_start_date,
    workedText: row.worked_text || '',
    didntWorkText: row.didnt_work_text || '',
    focusNextWeek: row.focus_next_week || '',
    createdAt: row.created_at,
  };
};

export const upsertWeeklyReview = (
  review: Partial<WeeklyReview> & { weekStartDate: string }
): WeeklyReview => {
  const db = getDatabase();
  const existing = getWeeklyReview(review.weekStartDate);
  const now = new Date().toISOString();

  if (existing) {
    const updated: WeeklyReview = {
      ...existing,
      ...review,
    };
    db.runSync(
      `UPDATE weekly_reviews SET
        worked_text = ?,
        didnt_work_text = ?,
        focus_next_week = ?
      WHERE week_start_date = ?`,
      [updated.workedText, updated.didntWorkText, updated.focusNextWeek, review.weekStartDate]
    );
    return updated;
  } else {
    const id = review.id || generateId();
    const newRev: WeeklyReview = {
      id,
      weekStartDate: review.weekStartDate,
      workedText: review.workedText || '',
      didntWorkText: review.didntWorkText || '',
      focusNextWeek: review.focusNextWeek || '',
      createdAt: now,
    };
    db.runSync(
      `INSERT INTO weekly_reviews (id, week_start_date, worked_text, didnt_work_text, focus_next_week, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, newRev.weekStartDate, newRev.workedText, newRev.didntWorkText, newRev.focusNextWeek, now]
    );
    return newRev;
  }
};

// ==================== INSIGHTS & ANALYTICS ====================

export interface InsightsData {
  days: {
    date: string;
    dayLabel: string;
    mood: number;
    energy: number;
    workoutDone: boolean;
    winLine: string;
  }[];
  workoutStreak: number;
  totalWorkoutsThisWeek: number;
  tasksDoneThisWeek: number;
  totalPrioritiesDoneThisWeek: number;
}

export const getInsightsData = (): InsightsData => {
  const db = getDatabase();
  const days: InsightsData['days'] = [];

  // Generate last 7 days
  let workoutStreak = 0;
  let streakActive = true;
  let totalWorkoutsThisWeek = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

    const checkin = getDailyCheckin(dateStr);
    const workoutDone = checkin ? checkin.workoutDone : false;

    if (workoutDone) {
      totalWorkoutsThisWeek += 1;
    }

    days.push({
      date: dateStr,
      dayLabel,
      mood: checkin ? checkin.mood : 0,
      energy: checkin ? checkin.energy : 0,
      workoutDone,
      winLine: checkin ? checkin.winLine : '',
    });
  }

  // Calculate current streak backward from today
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const c = getDailyCheckin(dateStr);
    if (c && c.workoutDone) {
      if (streakActive) workoutStreak += 1;
    } else {
      if (i > 0) streakActive = false; // Grace for today if not done yet
    }
  }

  // Tasks completed in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString();

  const tasksDoneRow = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM tasks WHERE status = "done" AND completed_at >= ?',
    [sevenDaysAgoStr]
  );
  const tasksDoneThisWeek = tasksDoneRow ? tasksDoneRow.count : 0;

  // Count priorities done this week
  let totalPrioritiesDone = 0;
  for (const day of days) {
    const c = getDailyCheckin(day.date);
    if (c) {
      if (c.topPriority1 && c.topPriority1Done) totalPrioritiesDone++;
      if (c.topPriority2 && c.topPriority2Done) totalPrioritiesDone++;
      if (c.topPriority3 && c.topPriority3Done) totalPrioritiesDone++;
    }
  }

  return {
    days,
    workoutStreak,
    totalWorkoutsThisWeek,
    tasksDoneThisWeek,
    totalPrioritiesDoneThisWeek: totalPrioritiesDone,
  };
};

// ==================== APP SETTINGS ====================

export const getSetting = (key: string, defaultValue: string): string => {
  const db = getDatabase();
  const row = db.getFirstSync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    [key]
  );
  return row ? row.value : defaultValue;
};

export const setSetting = (key: string, value: string) => {
  const db = getDatabase();
  db.runSync(
    'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
    [key, value, value]
  );
};

// ==================== BACKUP & EXPORT/IMPORT ====================

export const exportAllDataJSON = (): string => {
  const db = getDatabase();
  const checkins = db.getAllSync('SELECT * FROM daily_checkins');
  const tasks = db.getAllSync('SELECT * FROM tasks');
  const notes = db.getAllSync('SELECT * FROM notes');
  const journals = db.getAllSync('SELECT * FROM journal_entries');
  const reviews = db.getAllSync('SELECT * FROM weekly_reviews');
  const settings = db.getAllSync('SELECT * FROM app_settings');

  const exportPayload = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    appName: 'CEO Desk',
    data: {
      daily_checkins: checkins,
      tasks,
      notes,
      journal_entries: journals,
      weekly_reviews: reviews,
      app_settings: settings,
    },
  };

  return JSON.stringify(exportPayload, null, 2);
};

export const importAllDataJSON = (jsonStr: string): { success: boolean; message: string } => {
  try {
    const payload = JSON.parse(jsonStr);
    if (!payload.data || !payload.appName) {
      return { success: false, message: 'Invalid CEO Desk backup format.' };
    }

    const db = getDatabase();

    // Use a transaction to import cleanly
    db.withTransactionSync(() => {
      if (Array.isArray(payload.data.daily_checkins)) {
        for (const row of payload.data.daily_checkins) {
          db.runSync(
            `INSERT INTO daily_checkins (
              id, date, energy, sleep_hours, sleep_quality, mood, workout_done, workout_note,
              win_line, top_priority_1, top_priority_1_done, top_priority_2, top_priority_2_done,
              top_priority_3, top_priority_3_done, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
              energy=excluded.energy,
              sleep_hours=excluded.sleep_hours,
              sleep_quality=excluded.sleep_quality,
              mood=excluded.mood,
              workout_done=excluded.workout_done,
              workout_note=excluded.workout_note,
              win_line=excluded.win_line,
              top_priority_1=excluded.top_priority_1,
              top_priority_1_done=excluded.top_priority_1_done,
              top_priority_2=excluded.top_priority_2,
              top_priority_2_done=excluded.top_priority_2_done,
              top_priority_3=excluded.top_priority_3,
              top_priority_3_done=excluded.top_priority_3_done,
              updated_at=excluded.updated_at`,
            [
              row.id,
              row.date,
              row.energy,
              row.sleep_hours,
              row.sleep_quality,
              row.mood,
              row.workout_done,
              row.workout_note,
              row.win_line,
              row.top_priority_1,
              row.top_priority_1_done,
              row.top_priority_2,
              row.top_priority_2_done,
              row.top_priority_3,
              row.top_priority_3_done,
              row.created_at,
              row.updated_at,
            ]
          );
        }
      }

      if (Array.isArray(payload.data.tasks)) {
        for (const row of payload.data.tasks) {
          db.runSync(
            `INSERT INTO tasks (id, title, area, priority, due_date, status, completed_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
              title=excluded.title,
              area=excluded.area,
              priority=excluded.priority,
              due_date=excluded.due_date,
              status=excluded.status,
              completed_at=excluded.completed_at`,
            [row.id, row.title, row.area, row.priority, row.due_date, row.status, row.completed_at, row.created_at]
          );
        }
      }

      if (Array.isArray(payload.data.notes)) {
        for (const row of payload.data.notes) {
          db.runSync(
            `INSERT INTO notes (id, title, content, tags, is_pinned, checklist, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
              title=excluded.title,
              content=excluded.content,
              tags=excluded.tags,
              is_pinned=excluded.is_pinned,
              checklist=excluded.checklist,
              updated_at=excluded.updated_at`,
            [row.id, row.title, row.content, row.tags, row.is_pinned, row.checklist, row.created_at, row.updated_at]
          );
        }
      }

      if (Array.isArray(payload.data.journal_entries)) {
        for (const row of payload.data.journal_entries) {
          db.runSync(
            `INSERT INTO journal_entries (id, date, mental, physical, emotional, company, did_text, learned_text, next_text, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(date) DO UPDATE SET
              mental=excluded.mental,
              physical=excluded.physical,
              emotional=excluded.emotional,
              company=excluded.company,
              did_text=excluded.did_text,
              learned_text=excluded.learned_text,
              next_text=excluded.next_text,
              updated_at=excluded.updated_at`,
            [
              row.id,
              row.date,
              row.mental,
              row.physical,
              row.emotional,
              row.company,
              row.did_text,
              row.learned_text,
              row.next_text,
              row.created_at,
              row.updated_at,
            ]
          );
        }
      }

      if (Array.isArray(payload.data.weekly_reviews)) {
        for (const row of payload.data.weekly_reviews) {
          db.runSync(
            `INSERT INTO weekly_reviews (id, week_start_date, worked_text, didnt_work_text, focus_next_week, created_at)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(week_start_date) DO UPDATE SET
              worked_text=excluded.worked_text,
              didnt_work_text=excluded.didnt_work_text,
              focus_next_week=excluded.focus_next_week`,
            [row.id, row.week_start_date, row.worked_text, row.didnt_work_text, row.focus_next_week, row.created_at]
          );
        }
      }
    });

    return { success: true, message: 'Data restored successfully.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to import backup.' };
  }
};
