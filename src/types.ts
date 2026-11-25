export interface Subject {
  id: string;
  name: string;
  color: string;
  targetMinutes: number;
  icon: string;
  notebookUrl?: string;
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
  category?: 'center' | 'platform' | 'study' | 'exam' | 'manual' | 'review';
  teacher?: string;
  time?: string;
  slotIndex?: number; // 0 to 14 (up to 15 tasks per day; Slot 9 is bottom manual slot on poster)
  date?: string; // YYYY-MM-DD local date
  isRolled?: boolean;
  isUserAdded?: boolean;
  originalDayId?: string;
  contextInfo?: string;
  lectureId?: string;
  overlay?: TaskOverlay;
}

export interface ArchivedWeek {
  id: string;
  weekTitle: string;
  weekKey?: string;
  archivedAt: string;
  totalCount: number;
  completedCount: number;
  completionPct: number;
  tasks?: WeeklyTask[];
  notes?: string;
}

export interface OfficialExam {
  id: string;
  subjId: string;
  title: string;
  date: string; // YYYY-MM-DD
  period: string; // الحصة / التوقيت الرسمي
  syllabus?: string;
  notes?: string;
}

export interface ChangelogEntry {
  id: string;
  timestamp: number;
  action: 'add' | 'edit' | 'delete' | 'move' | 'swap' | 'archive' | 'backup' | 'complete' | 'uncomplete';
  entityType: 'task' | 'lecture' | 'exam' | 'official_exam' | 'schedule' | 'backup';
  summary: string;
  details?: string;
}

export interface SmartNotificationItem {
  id: string;
  type: 'checkin' | 'inactivity_12h' | 'exam_alert' | 'week_rollover' | 'manual_focus';
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  actionTab?: ViewTab;
}

export interface LectureSubPart {
  id: string;
  title: string;
  durationMinutes: number;
  isDone?: boolean;
  isHomework?: boolean;
}

export interface LecturePart {
  id: string;
  title: string;
  durationMinutes: number;
  isDone?: boolean;
  isHomework?: boolean;
  subParts?: LectureSubPart[];
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
  orderIndex?: number;
  trackKey?: string;
  durationMinutes?: number;
  parts?: LecturePart[];
  hasHomework?: boolean;
  homeworkDone?: boolean;
  homeworkUnit?: 'pages' | 'questions';
  homeworkAmount?: number;
  homeworkMinutes?: number;
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
  certificateUrl?: string;
  certificateImage?: string;
  certificateTitle?: string;
}

export type ThemeType = 'default' | 'indigo' | 'warm-sand' | 'minimal-light';
export type ViewTab = 'dashView' | 'aiSupervisorView' | 'weeklyView' | 'lecturesView' | 'examsView' | 'focusView' | 'wastedView' | 'logView' | 'allTimeHeatmapView' | 'quickStatsView';
