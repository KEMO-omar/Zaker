import { Lecture, LecturePart, Session, WeeklyTask } from '../types';

export const MAX_DAILY_SLOTS = 15; // Slots 0..14 (15 tasks/day max)

export const ORDERED_WEEK_DAYS = [
  { id: 'sat', label: 'السبت', short: 'سبت' },
  { id: 'sun', label: 'الأحد', short: 'أحد' },
  { id: 'mon', label: 'الاثنين', short: 'اثنين' },
  { id: 'tue', label: 'الثلاثاء', short: 'ثلاثاء' },
  { id: 'wed', label: 'الأربعاء', short: 'أربعاء' },
  { id: 'thu', label: 'الخميس', short: 'خميس' },
  { id: 'fri', label: 'الجمعة', short: 'جمعة' }
];

export interface LectureTrackMeta {
  id: string;
  label: string;
  shortLabel: string;
  subjId: string;
  isPlatform?: boolean;
}

export const LECTURE_TRACKS: LectureTrackMeta[] = [
  { id: 'physics', label: 'الفيزياء (أ. محمد عبد المعبود — منصة)', shortLabel: 'فيزياء · عبد المعبود (منصة)', subjId: 'physics', isPlatform: true },
  { id: 'arabic_salah', label: 'عربي — مسار 1: أ. محمد صلاح (منصة)', shortLabel: 'عربي · محمد صلاح (منصة)', subjId: 'arabic', isPlatform: true },
  { id: 'arabic_taqwa', label: 'عربي — مسار 2: أ. تقوى مرزوق (سنتر)', shortLabel: 'عربي · تقوى مرزوق (سنتر)', subjId: 'arabic', isPlatform: false },
  { id: 'english', label: 'الإنجليزي (أ. أيمن عبد العاطي — سنتر)', shortLabel: 'إنجليزي · أيمن (سنتر)', subjId: 'english', isPlatform: false },
  { id: 'history', label: 'التاريخ (أ. أحمد سمير — سنتر)', shortLabel: 'تاريخ · أحمد سمير (سنتر)', subjId: 'history', isPlatform: false }
];

export function isPlatformLecture(lec?: Partial<Lecture>): boolean {
  if (!lec) return false;
  const hay = `${lec.packageName || ''} ${lec.details || ''} ${lec.dueDay || ''} ${lec.title || ''} ${lec.tag || ''}`.toLowerCase();

  // Only Muhammad Abdul-Maboud (Physics) and Muhammad Salah (Arabic) are online platforms with video duration
  if (hay.includes('عبد المعبود') || hay.includes('عبدالمعبود') || hay.includes('محمد صلاح')) {
    return true;
  }

  // Center teachers (Taqwa Marzouq, Ahmed Samir, Ayman Abdel-Aty) are NOT platforms (no video duration)
  if (
    hay.includes('تقوى') ||
    hay.includes('أحمد سمير') ||
    hay.includes('احمد سمير') ||
    hay.includes('أيمن') ||
    hay.includes('ايمن')
  ) {
    return false;
  }

  if (lec.trackKey === 'physics' || lec.trackKey === 'arabic_salah') return true;
  if (lec.trackKey === 'arabic_taqwa' || lec.trackKey === 'english' || lec.trackKey === 'history') return false;

  if (lec.tag === 'سنتر' || lec.type === 'center') return false;
  if (lec.subjId === 'english' || lec.subjId === 'history') return false;
  if (lec.subjId === 'physics') return true;

  if (lec.subjId === 'arabic') {
    const pkg = `${lec.packageName || ''} ${lec.details || ''} ${lec.tag || ''}`.toLowerCase();
    if (pkg.includes('صلاح') || pkg.includes('منصة') || (lec.id || '').startsWith('ar-0')) return true;
    return false;
  }

  return lec.tag === 'منصة' || lec.type === 'platform';
}

export function getLectureTrack(lec?: Lecture): LectureTrackMeta {
  if (!lec) return LECTURE_TRACKS[0];
  if (lec.trackKey) {
    const found = LECTURE_TRACKS.find((t) => t.id === lec.trackKey);
    if (found) return found;
  }

  if (lec.subjId === 'arabic') {
    const pkg = `${lec.packageName || ''} ${lec.details || ''} ${lec.tag || ''}`.toLowerCase();
    if (pkg.includes('صلاح') || pkg.includes('منصة') || lec.id.startsWith('ar-0')) {
      return LECTURE_TRACKS[1];
    }
    return LECTURE_TRACKS[2];
  }

  const bySubj = LECTURE_TRACKS.find((t) => t.subjId === lec.subjId);
  if (bySubj) return bySubj;

  return {
    id: lec.subjId || 'general',
    label: lec.packageName || lec.subjId || 'عام',
    shortLabel: lec.subjId || 'عام',
    subjId: lec.subjId
  };
}

export const FIXED_WEEKLY_CLASSES: Array<{
  dayId: string;
  subjId: string;
  text: string;
  category: 'center';
  priority: 'class';
  teacher: string;
  time: string;
  slotIndex: number;
}> = [
  {
    dayId: 'sat',
    subjId: 'arabic',
    text: 'سنتر عربي: أ. تقوى مرزوق (4:00 ع)',
    category: 'center',
    priority: 'class',
    teacher: 'أ. تقوى مرزوق',
    time: '4:00 مساءً (سنتر)',
    slotIndex: 0
  },
  {
    dayId: 'sat',
    subjId: 'english',
    text: 'سنتر إنجليزي: أ. أيمن عبد العاطي (7:00 م)',
    category: 'center',
    priority: 'class',
    teacher: 'أ. أيمن عبد العاطي',
    time: '7:00 مساءً (سنتر)',
    slotIndex: 1
  },
  {
    dayId: 'mon',
    subjId: 'history',
    text: 'سنتر تاريخ الفشن: أ. أحمد سمير (1:00 ظ)',
    category: 'center',
    priority: 'class',
    teacher: 'أ. أحمد سمير',
    time: '1:00 ظهراً (سنتر)',
    slotIndex: 0
  },
  {
    dayId: 'tue',
    subjId: 'arabic',
    text: 'سنتر عربي: أ. تقوى مرزوق (4:00 ع)',
    category: 'center',
    priority: 'class',
    teacher: 'أ. تقوى مرزوق',
    time: '4:00 مساءً (سنتر)',
    slotIndex: 0
  },
  {
    dayId: 'tue',
    subjId: 'english',
    text: 'سنتر إنجليزي: أ. أيمن عبد العاطي (7:00 م)',
    category: 'center',
    priority: 'class',
    teacher: 'أ. أيمن عبد العاطي',
    time: '7:00 مساءً (سنتر)',
    slotIndex: 1
  },
  {
    dayId: 'thu',
    subjId: 'history',
    text: 'سنتر تاريخ الفشن: أ. أحمد سمير (1:00 ظ)',
    category: 'center',
    priority: 'class',
    teacher: 'أ. أحمد سمير',
    time: '1:00 ظهراً (سنتر)',
    slotIndex: 0
  }
];

export const DYNAMIC_STUDY_POOL: Array<{ subjId: string; text: string; category: 'study' }> = [
  { subjId: 'physics', text: 'فيزياء: حل مسائل وتدريبات شاملة من كتاب الامتحان', category: 'study' },
  { subjId: 'physics', text: 'فيزياء: تدوين القوانين والملاحظات الصعبة وحل الواجب', category: 'study' },
  { subjId: 'arabic', text: 'عربي: تطبيقات بلاغة ونحو شامل وحل قطعة قراءة متحررة', category: 'study' },
  { subjId: 'arabic', text: 'عربي: مراجعة أدب ونصوص متحررة وتقفيل الشيت', category: 'study' },
  { subjId: 'english', text: 'إنجليزي: حفظ كلمات الوحدة وحل تمارين جرامر المعاصر', category: 'study' },
  { subjId: 'english', text: 'إنجليزي: تدريب ترجمة وقطع فهم + كتابة مقال (Essay)', category: 'study' },
  { subjId: 'history', text: 'تاريخ: تلخيص الأحداث والشخصيات وحل أسئلة استنتاج', category: 'study' },
  { subjId: 'history', text: 'تاريخ: ربط التواريخ والنتائج وحل اختبار سريع على الدرس', category: 'study' }
];

const JS_DAY_TO_ID: Record<number, string> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat'
};

export function toLocalYmd(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseYmdLocal(ymd: string): Date {
  const parts = String(ymd || '').split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date();
}

export function addDaysYmd(ymd: string, deltaDays: number): string {
  const d = parseYmdLocal(ymd);
  d.setDate(d.getDate() + deltaDays);
  return toLocalYmd(d);
}

export function diffDaysYmd(targetYmd: string, baseYmd: string = toLocalYmd()): number {
  const t = parseYmdLocal(targetYmd).getTime();
  const b = parseYmdLocal(baseYmd).getTime();
  return Math.round((t - b) / (24 * 60 * 60 * 1000));
}

export function formatYmdShort(ymd: string): string {
  const d = parseYmdLocal(ymd);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function getCurrentArabicDayId(date: Date = new Date()): string {
  return JS_DAY_TO_ID[date.getDay()] || 'sat';
}

export function getDayIdFromYmd(ymd: string): string {
  if (!ymd) return getCurrentArabicDayId();
  return getCurrentArabicDayId(parseYmdLocal(ymd));
}

export function getNextArabicDayId(dayId: string): string {
  const idx = ORDERED_WEEK_DAYS.findIndex(d => d.id === dayId);
  if (idx === -1) return 'sat';
  return ORDERED_WEEK_DAYS[(idx + 1) % ORDERED_WEEK_DAYS.length].id;
}

export function getArabicDayLabel(dayId: string): string {
  if (dayId === 'backlog') return 'المتراكم';
  return ORDERED_WEEK_DAYS.find(d => d.id === dayId)?.label || dayId;
}

/**
 * Computes the YYYY-MM-DD key of the Saturday that started the current Sat..Fri school week.
 */
export function getWeekStartSaturdayKey(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffToSaturday = (d.getDay() + 1) % 7;
  d.setDate(d.getDate() - diffToSaturday);
  return toLocalYmd(d);
}

export function getWeekStartSaturdayKeyFromYmd(ymd: string): string {
  return getWeekStartSaturdayKey(parseYmdLocal(ymd));
}

export function getYmdForWeekDay(weekStartSatKey: string, dayId: string): string {
  const idx = ORDERED_WEEK_DAYS.findIndex(d => d.id === dayId);
  if (idx === -1) return weekStartSatKey;
  return addDaysYmd(weekStartSatKey, idx);
}

export function getWeekDaysWithDates(weekStartSatKey: string): Array<{
  id: string;
  label: string;
  short: string;
  dateStr: string;
  displayDate: string;
}> {
  return ORDERED_WEEK_DAYS.map((d, idx) => {
    const dateStr = addDaysYmd(weekStartSatKey, idx);
    return {
      ...d,
      dateStr,
      displayDate: formatYmdShort(dateStr)
    };
  });
}

/**
 * Resolves the effective Saturday week key for a task (based on explicit `task.date`, or `activeWeekStartKey`).
 */
export function getTaskWeekKey(task: WeeklyTask, fallbackWeekStartKey?: string): string {
  if (task.date && /^\d{4}-\d{2}-\d{2}$/.test(task.date)) {
    return getWeekStartSaturdayKeyFromYmd(task.date);
  }
  return fallbackWeekStartKey || getWeekStartSaturdayKey();
}

/**
 * Resolves the effective dayId (`sat`..`fri` or `'backlog'`) for a task.
 * If `task.date` is set and task is not `'backlog'`, its date strictly determines its weekday column.
 */
export function getEffectiveTaskDayId(task: WeeklyTask): string {
  if (task.dayId === 'backlog') return 'backlog';
  if (task.date && /^\d{4}-\d{2}-\d{2}$/.test(task.date)) {
    return getDayIdFromYmd(task.date);
  }
  return task.dayId;
}

export function filterTasksForWeek(
  tasks: WeeklyTask[],
  viewedWeekStartKey: string,
  activeWeekStartKey?: string
): WeeklyTask[] {
  const defaultWeek = activeWeekStartKey || getWeekStartSaturdayKey();
  return tasks
    .filter((t) => {
      if (!t || t.dayId === 'backlog') return false;
      const wKey = getTaskWeekKey(t, defaultWeek);
      return wKey === viewedWeekStartKey;
    })
    .map((t) => ({
      ...t,
      dayId: getEffectiveTaskDayId(t)
    }));
}

export function canAddTaskToDay(
  tasks: WeeklyTask[],
  targetDayId: string,
  targetDate?: string,
  activeWeekStartKey?: string,
  excludeTaskId?: string | number
): { allowed: boolean; currentCount: number; max: number; reason?: string } {
  if (targetDayId === 'backlog') {
    return { allowed: true, currentCount: 0, max: MAX_DAILY_SLOTS };
  }
  const defaultWeek = activeWeekStartKey || getWeekStartSaturdayKey();
  const targetWeekKey = targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate)
    ? getWeekStartSaturdayKeyFromYmd(targetDate)
    : defaultWeek;
  const resolvedDayId = targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate)
    ? getDayIdFromYmd(targetDate)
    : targetDayId;

  const dayTasks = tasks.filter(
    (t) =>
      (!excludeTaskId || String(t.id) !== String(excludeTaskId)) &&
      t.dayId !== 'backlog' &&
      getTaskWeekKey(t, defaultWeek) === targetWeekKey &&
      getEffectiveTaskDayId(t) === resolvedDayId
  );

  if (dayTasks.length >= MAX_DAILY_SLOTS) {
    return {
      allowed: false,
      currentCount: dayTasks.length,
      max: MAX_DAILY_SLOTS,
      reason: `يوم ${getArabicDayLabel(resolvedDayId)}${targetDate ? ` (${formatYmdShort(targetDate)})` : ''} وصل للحد الأقصى (${MAX_DAILY_SLOTS}/${MAX_DAILY_SLOTS} مهمة) — لن يتم نقل أي مهمة للمتراكم، اختر يوماً أو تاريخاً آخر.`
    };
  }
  return { allowed: true, currentCount: dayTasks.length, max: MAX_DAILY_SLOTS };
}

export function shuffleArray<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function sortLecturesByOrder(lectures: Lecture[]): Lecture[] {
  return lectures
    .map((lec, idx) => ({ lec, idx }))
    .sort((a, b) => {
      const oa = typeof a.lec.orderIndex === 'number' ? a.lec.orderIndex : a.idx + 100000;
      const ob = typeof b.lec.orderIndex === 'number' ? b.lec.orderIndex : b.idx + 100000;
      if (oa !== ob) return oa - ob;
      return a.idx - b.idx;
    })
    .map((entry) => entry.lec);
}

export function extractLectureSequenceNumber(lec: Lecture): number {
  const codeMatch = (lec.code || '').match(/(\d+)/);
  if (codeMatch) return Number(codeMatch[1]);
  const titleMatch = (lec.title || '').match(/(\d+)/);
  if (titleMatch) return Number(titleMatch[1]);
  const idMatch = (lec.id || '').match(/(\d+)/);
  if (idMatch) return Number(idMatch[1]);
  return 9999;
}

function getLectureKindRank(lec: Lecture): number {
  const label = `${lec.code || ''} ${lec.title || ''}`;
  if (label.includes('امتحان') || label.includes('تقييم')) return 3;
  if (label.includes('ورشة') || label.includes('مراجعة') || label.includes('هدية')) return 2;
  return 1;
}

export function reindexLectures(lectures: Lecture[]): Lecture[] {
  return lectures.map((lec, idx) => ({ ...lec, orderIndex: idx }));
}

export function getLectureRankInTrack(allLectures: Lecture[], lectureId: string): { rank: number; totalInTrack: number; track: LectureTrackMeta } | null {
  const ordered = sortLecturesByOrder(allLectures);
  const target = ordered.find((l) => l.id === lectureId);
  if (!target) return null;
  const track = getLectureTrack(target);
  const trackList = ordered.filter((l) => getLectureTrack(l).id === track.id);
  const idx = trackList.findIndex((l) => l.id === lectureId);
  return {
    rank: idx >= 0 ? idx + 1 : 1,
    totalInTrack: trackList.length,
    track
  };
}

export function setLecturePositionInTrack(
  allLectures: Lecture[],
  updatedLecture: Lecture,
  desired1BasedPos: number
): Lecture[] {
  const ordered = sortLecturesByOrder(allLectures).map((l) =>
    l.id === updatedLecture.id ? { ...updatedLecture } : l
  );
  const targetTrackId = getLectureTrack(updatedLecture).id;

  const trackSlots: number[] = [];
  const trackItems: Lecture[] = [];
  ordered.forEach((l, idx) => {
    if (getLectureTrack(l).id === targetTrackId) {
      trackSlots.push(idx);
      trackItems.push(l);
    }
  });

  const currentIdxInTrack = trackItems.findIndex((l) => l.id === updatedLecture.id);
  if (currentIdxInTrack === -1) return reindexLectures(ordered);

  const clampedPos = Math.max(0, Math.min(trackItems.length - 1, Math.round(desired1BasedPos) - 1));
  if (clampedPos !== currentIdxInTrack) {
    const [item] = trackItems.splice(currentIdxInTrack, 1);
    trackItems.splice(clampedPos, 0, item);
  }

  const result = [...ordered];
  trackSlots.forEach((masterIdx, i) => {
    result[masterIdx] = trackItems[i];
  });

  return reindexLectures(result);
}

export function autoSortLecturesByCode(lectures: Lecture[], onlyTrackId?: string): Lecture[] {
  const ordered = sortLecturesByOrder(lectures);
  const trackRank: Record<string, number> = {
    physics: 0,
    arabic_salah: 1,
    arabic_taqwa: 2,
    english: 3,
    history: 4
  };

  if (onlyTrackId) {
    const trackSlots: number[] = [];
    const trackItems: Lecture[] = [];
    ordered.forEach((l, idx) => {
      if (getLectureTrack(l).id === onlyTrackId) {
        trackSlots.push(idx);
        trackItems.push(l);
      }
    });
    trackItems.sort((a, b) => {
      const na = extractLectureSequenceNumber(a);
      const nb = extractLectureSequenceNumber(b);
      if (na !== nb) return na - nb;
      const ka = getLectureKindRank(a);
      const kb = getLectureKindRank(b);
      if (ka !== kb) return ka - kb;
      return (a.title || '').localeCompare(b.title || '', 'ar');
    });
    const result = [...ordered];
    trackSlots.forEach((masterIdx, i) => {
      result[masterIdx] = trackItems[i];
    });
    return reindexLectures(result);
  }

  const sorted = [...ordered].sort((a, b) => {
    const ta = getLectureTrack(a).id;
    const tb = getLectureTrack(b).id;
    const ra = trackRank[ta] ?? 99;
    const rb = trackRank[tb] ?? 99;
    if (ra !== rb) return ra - rb;
    if (ta !== tb) return ta.localeCompare(tb);
    const na = extractLectureSequenceNumber(a);
    const nb = extractLectureSequenceNumber(b);
    if (na !== nb) return na - nb;
    const ka = getLectureKindRank(a);
    const kb = getLectureKindRank(b);
    if (ka !== kb) return ka - kb;
    return (a.title || '').localeCompare(b.title || '', 'ar');
  });
  return reindexLectures(sorted);
}

/**
 * Normalizes daily slots cleanly PER (weekKey, dayId) with capacity up to MAX_DAILY_SLOTS (15 slots: 0..14).
 * CRITICAL RULE: NEVER silently pushes any task to `dayId: 'backlog'`!
 * Existing `'backlog'` items remain in `'backlog'` unless user explicitly restores/deletes them.
 */
export function normalizeDaySlots(tasks: WeeklyTask[], fallbackWeekStartKey?: string): WeeklyTask[] {
  const dayIds = new Set(ORDERED_WEEK_DAYS.map((d) => d.id));
  const defaultWeek = fallbackWeekStartKey || getWeekStartSaturdayKey();

  const groupedByWeekDay = new Map<string, WeeklyTask[]>();
  const backlogItems: WeeklyTask[] = [];

  tasks.forEach((t) => {
    if (!t) return;
    if (t.dayId === 'backlog' || (!dayIds.has(t.dayId) && !t.date)) {
      backlogItems.push({ ...t, dayId: 'backlog', slotIndex: undefined });
      return;
    }
    const effectiveDayId = getEffectiveTaskDayId(t);
    if (!dayIds.has(effectiveDayId)) {
      backlogItems.push({ ...t, dayId: 'backlog', slotIndex: undefined });
      return;
    }
    const wKey = getTaskWeekKey(t, defaultWeek);
    const bucketKey = `${wKey}__${effectiveDayId}`;
    if (!groupedByWeekDay.has(bucketKey)) groupedByWeekDay.set(bucketKey, []);
    groupedByWeekDay.get(bucketKey)!.push({ ...t, dayId: effectiveDayId });
  });

  const normalized: WeeklyTask[] = [];

  groupedByWeekDay.forEach((dayList) => {
    const grid: Array<WeeklyTask | null> = new Array(MAX_DAILY_SLOTS).fill(null);
    const extraOverflow: WeeklyTask[] = [];

    // Pass 1: preserve explicit valid slots (0..14)
    dayList.forEach((t) => {
      if (typeof t.slotIndex === 'number' && t.slotIndex >= 0 && t.slotIndex < MAX_DAILY_SLOTS) {
        const existing = grid[t.slotIndex];
        if (existing === null) {
          grid[t.slotIndex] = { ...t };
        } else if (
          t.slotIndex === 9 &&
          (t.isUserAdded || t.category === 'manual') &&
          !existing.isUserAdded &&
          existing.category !== 'manual' &&
          existing.category !== 'center'
        ) {
          extraOverflow.push(existing);
          grid[9] = { ...t };
        } else {
          extraOverflow.push({ ...t });
        }
      } else {
        extraOverflow.push({ ...t });
      }
    });

    // Pass 2: place remaining tasks into open slots (user tasks prefer slot 9 or 10..14; auto tasks prefer 0..8 then 10..14)
    const remainingBeyondCap: WeeklyTask[] = [];
    extraOverflow.forEach((t) => {
      let placed = false;
      const preferUserSlot = Boolean(t.slotIndex === 9 || t.isUserAdded || t.category === 'manual');
      if (preferUserSlot && grid[9] === null) {
        grid[9] = { ...t, slotIndex: 9 };
        placed = true;
      }
      if (!placed && !preferUserSlot) {
        for (let s = 0; s <= 8; s++) {
          if (grid[s] === null) {
            grid[s] = { ...t, slotIndex: s };
            placed = true;
            break;
          }
        }
      }
      if (!placed) {
        for (let s = 10; s < MAX_DAILY_SLOTS; s++) {
          if (grid[s] === null) {
            grid[s] = { ...t, slotIndex: s };
            placed = true;
            break;
          }
        }
      }
      if (!placed) {
        for (let s = 0; s < MAX_DAILY_SLOTS; s++) {
          if (grid[s] === null) {
            grid[s] = { ...t, slotIndex: s };
            placed = true;
            break;
          }
        }
      }
      if (!placed) {
        // Keep on its original day/date (NEVER throw into backlog!)
        remainingBeyondCap.push(t);
      }
    });

    for (let s = 0; s < MAX_DAILY_SLOTS; s++) {
      if (grid[s]) normalized.push({ ...grid[s]!, slotIndex: s });
    }
    remainingBeyondCap.forEach((t, idx) => {
      normalized.push({ ...t, slotIndex: MAX_DAILY_SLOTS + idx });
    });
  });

  return [...normalized, ...backlogItems];
}

function extractLectureKeyFromTask(task: WeeklyTask): string | null {
  if (task.lectureId) return task.lectureId;
  const idStr = String(task.id || '');
  const autoMatch = idStr.match(/^lec_auto_(.+)_\d{10,}$/);
  if (autoMatch) return autoMatch[1];
  const batchMatch = idStr.match(/^(?:lec|rev)_(.+?)_(?:sat|sun|mon|tue|wed|thu|fri)_\d+/);
  if (batchMatch) return batchMatch[1];
  return null;
}

export interface BuildScheduleOptions {
  lectures: Lecture[];
  preserveUserTasks?: WeeklyTask[];
  lockedTasks?: WeeklyTask[];
  startFromToday?: boolean;
  includeAllDays?: boolean;
  respectLectureOrder?: boolean;
  weekStartSatKey?: string;
}

/**
 * Generates or partially refreshes a weekly schedule for `weekStartSatKey`:
 * - Preserves ALL locked tasks (completed tasks, fixed physical centers, user-added tasks) in their exact slots
 * - Fills slots 0..8 (9 slots per day) and leaves slots 9..14 open for manual additions
 * - Attaches exact `date` (`YYYY-MM-DD`) when `weekStartSatKey` is supplied
 */
export function buildRandomizedWeeklySchedule(options: BuildScheduleOptions): WeeklyTask[] {
  const {
    lectures = [],
    preserveUserTasks = [],
    lockedTasks = [],
    startFromToday = false,
    respectLectureOrder = true,
    weekStartSatKey = getWeekStartSaturdayKey()
  } = options;
  const nowSeed = Date.now();

  const occupiedSlots: Record<string, Set<number>> = {
    sat: new Set(),
    sun: new Set(),
    mon: new Set(),
    tue: new Set(),
    wed: new Set(),
    thu: new Set(),
    fri: new Set()
  };

  const resultTasks: WeeklyTask[] = [];
  const usedIds = new Set<string>();
  const lockedLectureIds = new Set<string>();
  const lockedTexts = new Set<string>();

  const claimNextAutoSlot = (dayId: string): number | null => {
    const used = occupiedSlots[dayId];
    if (!used) return null;
    for (let s = 0; s <= 8; s++) {
      if (!used.has(s)) {
        used.add(s);
        return s;
      }
    }
    return null;
  };

  const claimNextAnySlot = (dayId: string): number | null => {
    const used = occupiedSlots[dayId];
    if (!used) return null;
    for (let s = 0; s < MAX_DAILY_SLOTS; s++) {
      if (!used.has(s)) {
        used.add(s);
        return s;
      }
    }
    return null;
  };

  const combinedLocked = [...lockedTasks, ...preserveUserTasks];
  combinedLocked.forEach((lt) => {
    if (!lt || usedIds.has(String(lt.id))) return;
    usedIds.add(String(lt.id));

    const effectiveDayId = getEffectiveTaskDayId(lt);
    if (effectiveDayId === 'backlog') {
      resultTasks.push({ ...lt });
      const lid = extractLectureKeyFromTask(lt);
      if (lid) lockedLectureIds.add(lid);
      if (lt.text) lockedTexts.add(lt.text.trim());
      return;
    }

    // If task belongs to a DIFFERENT week via explicit `date`, preserve untouched!
    if (lt.date && getWeekStartSaturdayKeyFromYmd(lt.date) !== weekStartSatKey) {
      resultTasks.push({ ...lt });
      return;
    }

    if (effectiveDayId && occupiedSlots[effectiveDayId]) {
      const canUseExtendedSlots = Boolean(lt.isUserAdded || lt.category === 'manual' || (lt.category === 'exam' && (lt.slotIndex ?? 0) >= 9));
      const maxAllowedSlot = canUseExtendedSlots ? MAX_DAILY_SLOTS - 1 : 8;
      let targetSlot =
        typeof lt.slotIndex === 'number' && lt.slotIndex >= 0 && lt.slotIndex <= maxAllowedSlot && !occupiedSlots[effectiveDayId].has(lt.slotIndex)
          ? lt.slotIndex
          : null;

      if (targetSlot === null) {
        targetSlot = canUseExtendedSlots ? claimNextAnySlot(effectiveDayId) : claimNextAutoSlot(effectiveDayId);
      } else {
        occupiedSlots[effectiveDayId].add(targetSlot);
      }

      if (targetSlot !== null) {
        resultTasks.push({
          ...lt,
          dayId: effectiveDayId,
          date: lt.date || getYmdForWeekDay(weekStartSatKey, effectiveDayId),
          slotIndex: targetSlot
        });
        const lid = extractLectureKeyFromTask(lt);
        if (lid) lockedLectureIds.add(lid);
        if (lt.text) lockedTexts.add(lt.text.trim());
      }
    }
  });

  // 1. Fixed Physical Centers
  FIXED_WEEKLY_CLASSES.forEach((f, idx) => {
    const alreadyPresent = resultTasks.some(
      (t) =>
        getTaskWeekKey(t, weekStartSatKey) === weekStartSatKey &&
        ((t.category === 'center' && t.dayId === f.dayId && t.subjId === f.subjId && t.teacher === f.teacher) ||
          (t.dayId === f.dayId && t.slotIndex === f.slotIndex && t.text === f.text))
    );
    if (alreadyPresent) return;

    const preferredFree = !occupiedSlots[f.dayId].has(f.slotIndex);
    const slot = preferredFree ? f.slotIndex : claimNextAutoSlot(f.dayId);
    if (slot !== null) {
      occupiedSlots[f.dayId].add(slot);
      resultTasks.push({
        id: `center_${f.dayId}_${idx}_${nowSeed}`,
        dayId: f.dayId,
        date: getYmdForWeekDay(weekStartSatKey, f.dayId),
        subjId: f.subjId,
        text: f.text,
        category: 'center',
        priority: 'class',
        teacher: f.teacher,
        time: f.time,
        slotIndex: slot
      });
    }
  });

  // 2. Days order
  const allDaysOrder = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
  let targetDaysOrder = allDaysOrder;
  if (startFromToday) {
    const todayId = getCurrentArabicDayId();
    const todayIdx = allDaysOrder.indexOf(todayId);
    targetDaysOrder = todayIdx >= 0
      ? [...allDaysOrder.slice(todayIdx), ...allDaysOrder.slice(0, todayIdx)]
      : allDaysOrder;
  }

  // 3. Queues per independent track
  const orderedAllLectures = respectLectureOrder ? sortLecturesByOrder(lectures) : lectures;
  const availableLectures = orderedAllLectures.filter((l) => {
    if (lockedLectureIds.has(l.id)) return false;
    const expectedPending = `${l.code}: ${l.title}`.trim();
    const expectedReview = `[مراجعة] ${l.code}: ${l.title}`.trim();
    if (lockedTexts.has(expectedPending) || lockedTexts.has(expectedReview)) return false;
    return true;
  });

  const trackIds = Array.from(new Set([
    ...LECTURE_TRACKS.map((t) => t.id),
    ...availableLectures.map((l) => getLectureTrack(l).id)
  ]));

  const pendingByTrack: Record<string, Lecture[]> = {};
  const reviewByTrack: Record<string, Lecture[]> = {};

  trackIds.forEach((tId) => {
    const pList = availableLectures.filter((l) => !l.isDone && getLectureTrack(l).id === tId);
    const rList = availableLectures.filter((l) => l.isDone && getLectureTrack(l).id === tId);
    pendingByTrack[tId] = respectLectureOrder ? pList : shuffleArray(pList);
    reviewByTrack[tId] = respectLectureOrder ? rList : shuffleArray(rList);
  });

  // 4. Fill open auto slots [0..8] across days
  const shuffledStudyPool = shuffleArray(DYNAMIC_STUDY_POOL);
  let studyPoolIdx = 0;

  targetDaysOrder.forEach((dayId, dayIdx) => {
    const dayDate = getYmdForWeekDay(weekStartSatKey, dayId);
    const dayTrackOrder = shuffleArray(trackIds);
    let trackPointer = dayIdx % Math.max(1, dayTrackOrder.length);
    let guard = 0;

    const countAutoOccupied = () => {
      let cnt = 0;
      for (let s = 0; s <= 8; s++) {
        if (occupiedSlots[dayId].has(s)) cnt++;
      }
      return cnt;
    };

    while (countAutoOccupied() < 9 && guard < 45) {
      guard++;
      const tId = dayTrackOrder[trackPointer % dayTrackOrder.length];
      trackPointer++;

      const roll = Math.random();
      let added = false;

      if (roll < 0.70 && pendingByTrack[tId] && pendingByTrack[tId].length > 0) {
        const lec = pendingByTrack[tId].shift()!;
        const slot = claimNextAutoSlot(dayId);
        if (slot !== null) {
          resultTasks.push({
            id: `lec_${lec.id}_${dayId}_${nowSeed}_${Math.random().toString(36).slice(2, 6)}`,
            dayId,
            date: dayDate,
            subjId: lec.subjId,
            text: `${lec.code}: ${lec.title}`,
            category: 'platform',
            priority: 'high',
            teacher: lec.packageName || 'محاضرة',
            time: lec.dueDay || 'غير محدد',
            lectureId: lec.id,
            slotIndex: slot
          });
          added = true;
        }
      } else if (roll < 0.92 && reviewByTrack[tId] && reviewByTrack[tId].length > 0) {
        const revLec = reviewByTrack[tId].shift()!;
        const slot = claimNextAutoSlot(dayId);
        if (slot !== null) {
          resultTasks.push({
            id: `rev_${revLec.id}_${dayId}_${nowSeed}_${Math.random().toString(36).slice(2, 6)}`,
            dayId,
            date: dayDate,
            subjId: revLec.subjId,
            text: `[مراجعة] ${revLec.code}: ${revLec.title}`,
            category: 'review',
            priority: 'normal',
            teacher: revLec.packageName || 'مراجعة تثبيت',
            time: 'تثبيت ومراجعة',
            lectureId: revLec.id,
            slotIndex: slot
          });
          added = true;
        }
      }

      if (!added) {
        const anyPending = dayTrackOrder.find((k) => pendingByTrack[k]?.length > 0);
        const anyReview = dayTrackOrder.find((k) => reviewByTrack[k]?.length > 0);
        if (anyPending && Math.random() < 0.72) {
          const lec = pendingByTrack[anyPending].shift()!;
          const slot = claimNextAutoSlot(dayId);
          if (slot !== null) {
            resultTasks.push({
              id: `lec_${lec.id}_${dayId}_${nowSeed}_${Math.random().toString(36).slice(2, 6)}`,
              dayId,
              date: dayDate,
              subjId: lec.subjId,
              text: `${lec.code}: ${lec.title}`,
              category: 'platform',
              priority: 'high',
              teacher: lec.packageName || 'محاضرة',
              time: lec.dueDay || '',
              lectureId: lec.id,
              slotIndex: slot
            });
          }
        } else if (anyReview) {
          const revLec = reviewByTrack[anyReview].shift()!;
          const slot = claimNextAutoSlot(dayId);
          if (slot !== null) {
            resultTasks.push({
              id: `rev_${revLec.id}_${dayId}_${nowSeed}_${Math.random().toString(36).slice(2, 6)}`,
              dayId,
              date: dayDate,
              subjId: revLec.subjId,
              text: `[مراجعة] ${revLec.code}: ${revLec.title}`,
              category: 'review',
              priority: 'normal',
              teacher: revLec.packageName || 'مراجعة تثبيت',
              time: 'تثبيت ومراجعة',
              lectureId: revLec.id,
              slotIndex: slot
            });
          }
        } else {
          const studyItem = shuffledStudyPool[studyPoolIdx % shuffledStudyPool.length];
          studyPoolIdx++;
          const slot = claimNextAutoSlot(dayId);
          if (slot !== null) {
            resultTasks.push({
              id: `dyn_study_${dayId}_${slot}_${nowSeed}_${Math.random().toString(36).slice(2, 6)}`,
              dayId,
              date: dayDate,
              subjId: studyItem.subjId,
              text: studyItem.text,
              category: 'study',
              priority: 'normal',
              slotIndex: slot
            });
          }
        }
      }
    }
  });

  return normalizeDaySlots(resultTasks, weekStartSatKey);
}

/**
 * Injects a newly added lecture into the first open slot (0..14) on a matching day in the active week.
 * Respects 15-slot cap cleanly without moving anything to backlog.
 */
export function injectLectureIntoSchedule(
  currentTasks: WeeklyTask[],
  newLecture: Lecture,
  activeWeekStartKey: string = getWeekStartSaturdayKey()
): WeeklyTask[] {
  const due = (newLecture.dueDay || '').trim();
  const candidateDays: string[] = [];

  if (due.includes('السبت') || due.includes('سبت')) candidateDays.push('sat');
  if (due.includes('الأحد') || due.includes('احد') || due.includes('أحد')) candidateDays.push('sun');
  if (due.includes('الإثنين') || due.includes('الاثنين') || due.includes('اتنين')) candidateDays.push('mon');
  if (due.includes('الثلاثاء') || due.includes('تلات')) candidateDays.push('tue');
  if (due.includes('الأربعاء') || due.includes('اربع')) candidateDays.push('wed');
  if (due.includes('الخميس') || due.includes('خميس')) candidateDays.push('thu');
  if (due.includes('الجمعة') || due.includes('جمعة')) candidateDays.push('fri');

  const todayId = getCurrentArabicDayId();
  const fallbackDays = [todayId, ...ORDERED_WEEK_DAYS.map((d) => d.id)];
  const orderedSearchDays = Array.from(new Set([...candidateDays, ...fallbackDays]));

  for (const dayId of orderedSearchDays) {
    const dayDate = getYmdForWeekDay(activeWeekStartKey, dayId);
    const used = new Set(
      currentTasks
        .filter(
          (t) =>
            t.dayId !== 'backlog' &&
            getTaskWeekKey(t, activeWeekStartKey) === activeWeekStartKey &&
            getEffectiveTaskDayId(t) === dayId &&
            typeof t.slotIndex === 'number'
        )
        .map((t) => t.slotIndex as number)
    );
    for (let slot = 0; slot < MAX_DAILY_SLOTS; slot++) {
      if (!used.has(slot)) {
        const injectedTask: WeeklyTask = {
          id: `lec_auto_${newLecture.id}_${Date.now()}`,
          dayId,
          date: dayDate,
          subjId: newLecture.subjId,
          text: `${newLecture.code}: ${newLecture.title}`,
          category: newLecture.isDone ? 'review' : 'platform',
          priority: 'high',
          teacher: newLecture.packageName,
          time: newLecture.dueDay,
          lectureId: newLecture.id,
          isUserAdded: slot >= 9 ? true : undefined,
          slotIndex: slot
        };
        return normalizeDaySlots([...currentTasks, injectedTask], activeWeekStartKey);
      }
    }
  }

  return normalizeDaySlots(currentTasks, activeWeekStartKey);
}

/**
 * Computes total backlog time in hours strictly from PLATFORM lectures (Muhammad Salah & Muhammad Abdul-Maboud),
 * while center classes (Taqwa, Ahmed Samir, Ayman) have 0 lecture video duration,
 * and tracks homework strictly in pages or questions.
 */
export interface BacklogHoursSummary {
  pendingLecturesCount: number;
  pendingPlatformLecturesCount: number;
  pendingCenterLecturesCount: number;
  lectureMinutesTotal: number;
  homeworkMinutesTotal: number;
  homeworkPagesTotal: number;
  homeworkQuestionsTotal: number;
  homeworkLegacyLecturesCount: number;
  explicitDurationsCount: number;
  estimatedDurationsCount: number;
  backlogTasksCount: number;
  backlogTasksMinutes: number;
  totalMinutes: number;
  totalHours: number;
  lecturesTotalHours: number;
  homeworkTotalHours: number;
}

export const DEFAULT_LECTURE_MINUTES = 90;
export const DEFAULT_HOMEWORK_MINUTES = 45;
export const DEFAULT_BACKLOG_TASK_MINUTES = 45;

export interface LectureLoadMeta {
  isPlatform: boolean;
  lectureMins: number;
  fullDurationMins: number;
  partsCount: number;
  donePartsCount: number;
  hasHomework: boolean;
  homeworkDone: boolean;
  homeworkUnit: 'pages' | 'questions';
  homeworkAmount: number;
  homeworkMins: number;
  totalMinutes: number;
  isEstimated: boolean;
}

export function isHomeworkPartItem(item?: { isHomework?: boolean; title?: string } | null): boolean {
  if (!item) return false;
  return Boolean(item.isHomework || (item.title || '').trim() === 'الواجب');
}

export function isLectureHomeworkDone(lec?: Partial<Lecture> | null): boolean {
  if (!lec || !lec.hasHomework) return true;
  if (lec.isDone) return true;
  if (lec.homeworkDone) return true;
  const parts = Array.isArray(lec.parts) ? lec.parts : [];
  for (const p of parts) {
    if (isHomeworkPartItem(p) && p.isDone) return true;
    const subs = Array.isArray(p.subParts) ? p.subParts : [];
    for (const s of subs) {
      if (isHomeworkPartItem(s) && s.isDone) return true;
    }
  }
  return false;
}

export function syncHomeworkPartOnLecture(lec: Lecture): Lecture {
  const isPlatform = isPlatformLecture(lec);
  const rawParts = Array.isArray(lec.parts) ? lec.parts : [];
  let foundExistingHwSubId = '';
  let foundExistingHwDone = false;

  const strippedParts: LecturePart[] = rawParts
    .filter((p) => {
      if (isHomeworkPartItem(p)) {
        if (p.isDone) foundExistingHwDone = true;
        return false;
      }
      return true;
    })
    .map((p) => {
      const subs = Array.isArray(p.subParts) ? p.subParts : [];
      const nonHwSubs = subs.filter((s) => {
        if (isHomeworkPartItem(s)) {
          if (!foundExistingHwSubId) foundExistingHwSubId = s.id;
          if (s.isDone) foundExistingHwDone = true;
          return false;
        }
        return true;
      });
      return {
        ...p,
        subParts: nonHwSubs
      };
    });

  if (!lec.hasHomework) {
    return {
      ...lec,
      homeworkDone: false,
      ...(isPlatform ? { parts: strippedParts.length > 0 ? strippedParts : undefined } : { parts: undefined })
    };
  }

  const hwDone = Boolean(lec.isDone || lec.homeworkDone || foundExistingHwDone);

  if (isPlatform && strippedParts.length > 0) {
    const lastIdx = strippedParts.length - 1;
    const lastPart = strippedParts[lastIdx];
    const existingSubs = Array.isArray(lastPart.subParts) ? lastPart.subParts : [];
    const hwSub = {
      id: foundExistingHwSubId || `sub_hw_${lec.id || 'new'}`,
      title: 'الواجب',
      durationMinutes: 0,
      isDone: hwDone,
      isHomework: true
    };
    const nextParts = strippedParts.map((p, idx) =>
      idx === lastIdx ? { ...p, subParts: [...existingSubs, hwSub] } : p
    );
    return {
      ...lec,
      homeworkDone: hwDone,
      parts: nextParts
    };
  }

  return {
    ...lec,
    homeworkDone: hwDone,
    ...(isPlatform ? { parts: strippedParts.length > 0 ? strippedParts : undefined } : { parts: undefined })
  };
}

export function getLecturePartDuration(part: LecturePart): {
  totalMins: number;
  remainingMins: number;
  hasSubParts: boolean;
  doneSubParts: number;
  totalSubParts: number;
} {
  if (isHomeworkPartItem(part)) {
    return {
      totalMins: 0,
      remainingMins: 0,
      hasSubParts: false,
      doneSubParts: 0,
      totalSubParts: 0
    };
  }

  const subs = Array.isArray(part.subParts) ? part.subParts : [];
  const nonHwSubs = subs.filter((s) => !isHomeworkPartItem(s));

  if (nonHwSubs.length > 0) {
    let totalMins = 0;
    let remainingMins = 0;
    let doneSubParts = 0;
    nonHwSubs.forEach((s) => {
      const m = Math.max(0, Number(s.durationMinutes) || 0);
      totalMins += m;
      const done = Boolean(part.isDone || s.isDone);
      if (done) doneSubParts += 1;
      else remainingMins += m;
    });
    return {
      totalMins,
      remainingMins: part.isDone ? 0 : remainingMins,
      hasSubParts: true,
      doneSubParts,
      totalSubParts: nonHwSubs.length
    };
  }

  const m = Math.max(0, Number(part.durationMinutes) || 0);
  return {
    totalMins: m,
    remainingMins: part.isDone ? 0 : m,
    hasSubParts: false,
    doneSubParts: 0,
    totalSubParts: 0
  };
}

export function getLecturePartsTotals(parts?: LecturePart[]): {
  totalMins: number;
  remainingMins: number;
  partsCount: number;
  donePartsCount: number;
} {
  const list = (Array.isArray(parts) ? parts : []).filter((p) => !isHomeworkPartItem(p));
  let totalMins = 0;
  let remainingMins = 0;
  let donePartsCount = 0;
  list.forEach((p) => {
    const meta = getLecturePartDuration(p);
    totalMins += meta.totalMins;
    remainingMins += meta.remainingMins;
    if (p.isDone || (meta.hasSubParts && meta.doneSubParts === meta.totalSubParts)) {
      donePartsCount += 1;
    }
  });
  return {
    totalMins,
    remainingMins,
    partsCount: list.length,
    donePartsCount
  };
}

export function toggleLectureHomeworkDone(lec: Lecture): Lecture {
  if (!lec.hasHomework) return lec;
  const nextHwDone = !isLectureHomeworkDone(lec);
  const parts = Array.isArray(lec.parts) ? lec.parts : [];
  const updatedParts = parts.map((p) => {
    const subs = Array.isArray(p.subParts) ? p.subParts : [];
    const nextSubs = subs.map((s) => (isHomeworkPartItem(s) ? { ...s, isDone: nextHwDone } : s));
    return {
      ...p,
      ...(isHomeworkPartItem(p) ? { isDone: nextHwDone } : {}),
      subParts: nextSubs
    };
  });

  const videoParts = updatedParts.filter((p) => !isHomeworkPartItem(p));
  const hasVideoParts = isPlatformLecture(lec) && videoParts.length > 0;
  const allVideoPartsDone = hasVideoParts
    ? videoParts.every((p) => {
        const nonHwSubs = (Array.isArray(p.subParts) ? p.subParts : []).filter((s) => !isHomeworkPartItem(s));
        if (nonHwSubs.length > 0) return p.isDone || nonHwSubs.every((s) => Boolean(s.isDone));
        return Boolean(p.isDone);
      })
    : lec.isDone;

  const nextIsDone = nextHwDone ? (hasVideoParts ? allVideoPartsDone : lec.isDone) : false;

  return {
    ...lec,
    homeworkDone: nextHwDone,
    ...(updatedParts.length > 0 ? { parts: updatedParts } : {}),
    isDone: nextIsDone
  };
}

export function toggleLecturePartDone(
  lec: Lecture,
  partId: string,
  subPartId?: string
): Lecture {
  const parts = Array.isArray(lec.parts) ? lec.parts : [];
  if (parts.length === 0) return lec;

  if (subPartId) {
    const targetSub = parts
      .find((p) => p.id === partId)
      ?.subParts?.find((s) => s.id === subPartId);
    if (isHomeworkPartItem(targetSub)) {
      return toggleLectureHomeworkDone(lec);
    }
  }

  let nextHwDone = Boolean(lec.homeworkDone || isLectureHomeworkDone({ ...lec, isDone: false }));

  const updatedParts: LecturePart[] = parts.map((p) => {
    if (p.id !== partId) return p;
    const subs = Array.isArray(p.subParts) ? p.subParts : [];
    const nonHwSubs = subs.filter((s) => !isHomeworkPartItem(s));

    if (isHomeworkPartItem(p)) {
      nextHwDone = !p.isDone;
      return { ...p, isDone: nextHwDone };
    }

    if (subPartId && subs.length > 0) {
      const nextSubs = subs.map((s) => (s.id === subPartId ? { ...s, isDone: !s.isDone } : s));
      const nextNonHwSubs = nextSubs.filter((s) => !isHomeworkPartItem(s));
      const allNonHwDone = nextNonHwSubs.length > 0 ? nextNonHwSubs.every((s) => Boolean(s.isDone)) : Boolean(p.isDone);
      return {
        ...p,
        isDone: allNonHwDone,
        subParts: nextSubs
      };
    }

    const nextDone = !p.isDone;
    return {
      ...p,
      isDone: nextDone,
      subParts: subs.length > 0
        ? subs.map((s) => (isHomeworkPartItem(s) ? s : { ...s, isDone: nextDone }))
        : subs
    };
  });

  const videoParts = updatedParts.filter((p) => !isHomeworkPartItem(p));
  const allVideoPartsDone = videoParts.every((p) => {
    const nonHwSubs = (Array.isArray(p.subParts) ? p.subParts : []).filter((s) => !isHomeworkPartItem(s));
    if (nonHwSubs.length > 0) return p.isDone || nonHwSubs.every((s) => Boolean(s.isDone));
    return Boolean(p.isDone);
  });

  const finalIsDone = allVideoPartsDone && (!lec.hasHomework || nextHwDone);

  return {
    ...lec,
    homeworkDone: lec.hasHomework ? nextHwDone : false,
    parts: updatedParts,
    isDone: finalIsDone
  };
}

export function formatLectureHomeworkLabel(lec: Partial<Lecture>): string {
  if (!lec.hasHomework) return 'بدون واجب';
  const amount = typeof lec.homeworkAmount === 'number' && lec.homeworkAmount > 0 ? lec.homeworkAmount : 0;
  if (amount > 0) {
    return lec.homeworkUnit === 'questions' ? `واجب: ${amount} سؤال` : `واجب: ${amount} صفحة`;
  }
  if (typeof lec.homeworkMinutes === 'number' && lec.homeworkMinutes > 0) {
    return `واجب (${lec.homeworkMinutes} د)`;
  }
  return 'يوجد واجب';
}

export function getLectureTotalMinutes(lec: Lecture): LectureLoadMeta {
  const isPlatform = isPlatformLecture(lec);
  const parts = isPlatform && Array.isArray(lec.parts) ? lec.parts : [];
  const videoParts = parts.filter((p) => !isHomeworkPartItem(p));

  let fullDurationMins = 0;
  let lectureMins = 0;
  let donePartsCount = 0;
  let isEstimated = false;

  if (isPlatform) {
    if (videoParts.length > 0) {
      const partTotals = getLecturePartsTotals(videoParts);
      fullDurationMins = partTotals.totalMins > 0 ? partTotals.totalMins : (Number(lec.durationMinutes) || DEFAULT_LECTURE_MINUTES);
      lectureMins = lec.isDone ? 0 : (partTotals.totalMins > 0 ? partTotals.remainingMins : fullDurationMins);
      donePartsCount = partTotals.donePartsCount;
      isEstimated = partTotals.totalMins <= 0 && !(typeof lec.durationMinutes === 'number' && lec.durationMinutes > 0);
    } else {
      const hasExplicitLec = typeof lec.durationMinutes === 'number' && lec.durationMinutes > 0;
      fullDurationMins = hasExplicitLec ? Number(lec.durationMinutes) : DEFAULT_LECTURE_MINUTES;
      lectureMins = lec.isDone ? 0 : fullDurationMins;
      isEstimated = !hasExplicitLec;
    }
  }

  const homeworkAmount = typeof lec.homeworkAmount === 'number' && lec.homeworkAmount > 0
    ? Number(lec.homeworkAmount)
    : 0;
  const homeworkUnit: 'pages' | 'questions' = lec.homeworkUnit === 'questions' ? 'questions' : 'pages';
  const homeworkMins = homeworkAmount === 0 && lec.hasHomework && typeof lec.homeworkMinutes === 'number' && lec.homeworkMinutes > 0
    ? Number(lec.homeworkMinutes)
    : 0;
  const homeworkDone = isLectureHomeworkDone(lec);

  return {
    isPlatform,
    lectureMins,
    fullDurationMins,
    partsCount: videoParts.length,
    donePartsCount,
    hasHomework: Boolean(lec.hasHomework),
    homeworkDone,
    homeworkUnit,
    homeworkAmount,
    homeworkMins,
    totalMinutes: lectureMins,
    isEstimated
  };
}

export function computeBacklogHoursSummary(
  lectures: Lecture[],
  weeklyTasks: WeeklyTask[] = [],
  completedTaskIds: Set<string | number> = new Set()
): BacklogHoursSummary {
  const pendingLectures = lectures.filter((l) => !l.isDone);
  let pendingPlatformLecturesCount = 0;
  let pendingCenterLecturesCount = 0;
  let lectureMinutesTotal = 0;
  let homeworkMinutesTotal = 0;
  let homeworkPagesTotal = 0;
  let homeworkQuestionsTotal = 0;
  let homeworkLegacyLecturesCount = 0;
  let explicitDurationsCount = 0;
  let estimatedDurationsCount = 0;

  pendingLectures.forEach((l) => {
    const meta = getLectureTotalMinutes(l);
    if (meta.isPlatform) {
      pendingPlatformLecturesCount += 1;
      lectureMinutesTotal += meta.lectureMins;
      if (meta.isEstimated) estimatedDurationsCount += 1;
      else explicitDurationsCount += 1;
    } else {
      pendingCenterLecturesCount += 1;
    }

    if (meta.hasHomework && !meta.homeworkDone) {
      if (meta.homeworkAmount > 0) {
        if (meta.homeworkUnit === 'questions') homeworkQuestionsTotal += meta.homeworkAmount;
        else homeworkPagesTotal += meta.homeworkAmount;
      } else if (meta.homeworkMins > 0) {
        homeworkMinutesTotal += meta.homeworkMins;
        homeworkLegacyLecturesCount += 1;
      }
    }
  });

  const backlogTasks = weeklyTasks.filter(
    (t) => t.dayId === 'backlog' && !completedTaskIds.has(t.id) && !completedTaskIds.has(String(t.id))
  );
  const backlogTasksMinutes = backlogTasks.length * DEFAULT_BACKLOG_TASK_MINUTES;
  const totalMinutes = lectureMinutesTotal;

  return {
    pendingLecturesCount: pendingLectures.length,
    pendingPlatformLecturesCount,
    pendingCenterLecturesCount,
    lectureMinutesTotal,
    homeworkMinutesTotal,
    homeworkPagesTotal,
    homeworkQuestionsTotal,
    homeworkLegacyLecturesCount,
    explicitDurationsCount,
    estimatedDurationsCount,
    backlogTasksCount: backlogTasks.length,
    backlogTasksMinutes,
    totalMinutes,
    totalHours: Number((totalMinutes / 60).toFixed(1)),
    lecturesTotalHours: Number((lectureMinutesTotal / 60).toFixed(1)),
    homeworkTotalHours: Number((homeworkMinutesTotal / 60).toFixed(1))
  };
}

/**
 * Computes consecutive study streak in days and today's total minutes using local YYYY-MM-DD dates.
 */
export function computeStudyStreakStats(sessions: Session[]): {
  todayMinutes: number;
  todayHours: number;
  todaySessionsCount: number;
  currentStreakDays: number;
  longestStreakDays: number;
  totalActiveDays: number;
  studiedToday: boolean;
} {
  const todayStr = toLocalYmd(new Date());
  const minsByDay = new Map<string, number>();
  let todaySessionsCount = 0;

  sessions.forEach((s) => {
    const mins = Number(s.minutes) || 0;
    if (mins <= 0) return;
    let ymd = '';
    if (s.tsStart) {
      ymd = toLocalYmd(new Date(s.tsStart));
    } else if (s.date && /^\d{4}-\d{2}-\d{2}/.test(s.date)) {
      ymd = s.date.slice(0, 10);
    }
    if (!ymd) return;
    minsByDay.set(ymd, (minsByDay.get(ymd) || 0) + mins);
    if (ymd === todayStr) todaySessionsCount += 1;
  });

  const todayMinutes = minsByDay.get(todayStr) || 0;
  const studiedToday = todayMinutes > 0;

  // Current streak: start from today if studied today, otherwise yesterday (active streak not yet broken today)
  let currentStreakDays = 0;
  let cursor = studiedToday ? todayStr : addDaysYmd(todayStr, -1);
  while ((minsByDay.get(cursor) || 0) > 0) {
    currentStreakDays += 1;
    cursor = addDaysYmd(cursor, -1);
    if (currentStreakDays > 3650) break;
  }

  // Longest streak across all recorded active days
  const sortedDays = Array.from(minsByDay.entries())
    .filter(([, m]) => m > 0)
    .map(([d]) => d)
    .sort();
  let longestStreakDays = currentStreakDays;
  let run = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      run = 1;
    } else {
      const diff = diffDaysYmd(sortedDays[i], sortedDays[i - 1]);
      run = diff === 1 ? run + 1 : 1;
    }
    if (run > longestStreakDays) longestStreakDays = run;
  }

  return {
    todayMinutes,
    todayHours: Number((todayMinutes / 60).toFixed(1)),
    todaySessionsCount,
    currentStreakDays,
    longestStreakDays,
    totalActiveDays: sortedDays.length,
    studiedToday
  };
}
