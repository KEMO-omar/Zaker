export interface Subject {
  id: string;
  name: string;
  color: string;
  targetMinutes: number;
  icon: string;
}

export interface SessionEntry {
  subj: string;
  task: string;
}

export interface Session {
  id: string;
  fbKey?: string;
  subjId?: string; // legacy or direct
  minutes: number;
  tsStart?: number;
  tsEnd?: number;
  date?: string;
  entries?: SessionEntry[];
}

export interface Exemption {
  id: string;
  fbKey?: string;
  minutes: number;
  timestamp: number;
  title: string;
  date?: string;
  subjId?: string;
}

export interface TaskOverlay {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface WeeklyTask {
  id: string | number;
  dayId: string; // 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'backlog'
  subjId: string;
  text: string;
  priority?: 'class' | 'exam' | 'urgent' | 'high' | 'normal';
  isRolled?: boolean;
  contextInfo?: string;
  overlay?: TaskOverlay;
}

export interface Lecture {
  id: string;
  code: string;
  title: string;
  details: string;
  dueDay: string;
  isDone: boolean;
  packageId?: string;
  packageName?: string;
  subjId: string;
  tag?: string;
  type?: string;
}

export interface ExamRecord {
  id: string;
  subjId: string;
  subjName?: string;
  teacher: string;
  topic: string;
  score: number;
  total: number;
  pct: number;
  examType: string;
  date: string;
  notes?: string;
}

export type ThemeType = 'default' | 'indigo' | 'warm-sand' | 'minimal-light';
export type ViewTab = 'dashView' | 'aiSupervisorView' | 'weeklyView' | 'lecturesView' | 'examsView' | 'focusView' | 'wastedView' | 'logView';
