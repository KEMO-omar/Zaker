import { Lecture, WeeklyTask } from '../types';

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
}

export const LECTURE_TRACKS: LectureTrackMeta[] = [
  { id: 'physics', label: 'الفيزياء (أ. محمد عبد المعبود)', shortLabel: 'فيزياء · عبد المعبود', subjId: 'physics' },
  { id: 'arabic_salah', label: 'عربي — مسار 1: أ. محمد صلاح (منصة)', shortLabel: 'عربي · محمد صلاح', subjId: 'arabic' },
  { id: 'arabic_taqwa', label: 'عربي — مسار 2: أ. تقوى مرزوق (سنتر)', shortLabel: 'عربي · تقوى مرزوق', subjId: 'arabic' },
  { id: 'english', label: 'الإنجليزي (أ. أيمن عبد العاطي)', shortLabel: 'إنجليزي · أيمن عبد العاطي', subjId: 'english' },
  { id: 'history', label: 'التاريخ (أ. أحمد سمير)', shortLabel: 'تاريخ · أحمد سمير', subjId: 'history' }
];

/**
 * Resolves the independent ordering track for a lecture.
 * Supports two separate Arabic tracks (أ. محمد صلاح vs أ. تقوى مرزوق) plus each other subject.
 */
export function getLectureTrack(lec?: Lecture): LectureTrackMeta {
  if (!lec) return LECTURE_TRACKS[0];
  if (lec.trackKey) {
    const found = LECTURE_TRACKS.find((t) => t.id === lec.trackKey);
    if (found) return found;
  }

  if (lec.subjId === 'arabic') {
    const pkg = `${lec.packageName || ''} ${lec.details || ''} ${lec.tag || ''}`.toLowerCase();
    if (pkg.includes('صلاح') || pkg.includes('منصة') || lec.id.startsWith('ar-0')) {
      return LECTURE_TRACKS[1]; // arabic_salah
    }
    return LECTURE_TRACKS[2]; // arabic_taqwa
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

// Fixed weekly physical Center classes ONLY
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
  // Saturday Centers
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
  // Monday Center
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
  // Tuesday Centers
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
  // Thursday Center
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

export function getCurrentArabicDayId(date: Date = new Date()): string {
  return JS_DAY_TO_ID[date.getDay()] || 'sat';
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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function shuffleArray<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Sorts lectures according to Karim's explicit orderIndex (falling back to original array position).
 */
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

/**
 * Extracts numeric sequence from a lecture code/title/id for smart auto-ordering.
 */
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

/**
 * Normalizes orderIndex to clean sequential integers 0..N-1.
 */
export function reindexLectures(lectures: Lecture[]): Lecture[] {
  return lectures.map((lec, idx) => ({ ...lec, orderIndex: idx }));
}

/**
 * Returns the 1-based position of `lecture` within its own track (e.g., Arabic-Salah vs Arabic-Taqwa).
 */
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

/**
 * Moves a lecture to a specific 1-based position inside its own track without disturbing other tracks' relative orders!
 */
export function setLecturePositionInTrack(
  allLectures: Lecture[],
  updatedLecture: Lecture,
  desired1BasedPos: number
): Lecture[] {
  const ordered = sortLecturesByOrder(allLectures).map((l) =>
    l.id === updatedLecture.id ? { ...updatedLecture } : l
  );
  const targetTrackId = getLectureTrack(updatedLecture).id;

  // Gather indices in master `ordered` belonging to this track
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

  // Write sorted trackItems back into the exact trackSlots positions in master list
  const result = [...ordered];
  trackSlots.forEach((masterIdx, i) => {
    result[masterIdx] = trackItems[i];
  });

  return reindexLectures(result);
}

/**
 * Auto-sorts lectures cleanly by track (keeping Arabic Muhammad Salah & Arabic Taqwa Marzouq separated!),
 * then numeric lecture code (00, 01, 02...) and natural lesson type.
 */
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
 * Ensures every task in every day (sat..fri) has a unique, collision-free slotIndex in [0..9].
 * Slot 9 is reserved for Karim's user-added bottom tasks whenever possible.
 */
export function normalizeDaySlots(tasks: WeeklyTask[]): WeeklyTask[] {
  const dayIds = new Set(ORDERED_WEEK_DAYS.map((d) => d.id));
  const byDay: Record<string, WeeklyTask[]> = {};
  const backlogOrOther: WeeklyTask[] = [];

  tasks.forEach((t) => {
    if (t && t.dayId && dayIds.has(t.dayId)) {
      if (!byDay[t.dayId]) byDay[t.dayId] = [];
      byDay[t.dayId].push({ ...t });
    } else if (t) {
      backlogOrOther.push({ ...t });
    }
  });

  const normalized: WeeklyTask[] = [];

  ORDERED_WEEK_DAYS.forEach((d) => {
    const dayList = byDay[d.id] || [];
    const grid: Array<WeeklyTask | null> = new Array(10).fill(null);
    const overflow: WeeklyTask[] = [];

    // Pass 1: place tasks that have an explicit valid slotIndex
    dayList.forEach((t) => {
      if (typeof t.slotIndex === 'number' && t.slotIndex >= 0 && t.slotIndex <= 9) {
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
          overflow.push(existing);
          grid[9] = { ...t };
        } else {
          overflow.push({ ...t });
        }
      } else {
        overflow.push({ ...t });
      }
    });

    // Pass 2: assign open auto slots [0..8] then [9] for remaining tasks
    overflow.forEach((t) => {
      let placed = false;
      const preferBottom = Boolean(t.slotIndex === 9 || t.isUserAdded || t.category === 'manual');
      if (preferBottom && grid[9] === null) {
        grid[9] = { ...t, slotIndex: 9 };
        placed = true;
      }
      if (!placed) {
        for (let s = 0; s <= 8; s++) {
          if (grid[s] === null) {
            grid[s] = { ...t, slotIndex: s };
            placed = true;
            break;
          }
        }
      }
      if (!placed && grid[9] === null) {
        grid[9] = { ...t, slotIndex: 9 };
        placed = true;
      }
      if (!placed && (t.isUserAdded || t.category === 'manual')) {
        const currentNine = grid[9];
        if (currentNine && !currentNine.isUserAdded && currentNine.category !== 'manual' && currentNine.category !== 'center') {
          grid[9] = { ...t, slotIndex: 9 };
          placed = true;
        }
      }
      if (!placed) {
        backlogOrOther.push({ ...t, dayId: 'backlog', slotIndex: undefined });
      }
    });

    for (let s = 0; s <= 9; s++) {
      if (grid[s]) {
        normalized.push({ ...grid[s]!, slotIndex: s });
      }
    }
  });

  return [...normalized, ...backlogOrOther];
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
}

/**
 * Generates or partially refreshes a weekly schedule:
 * - Preserves ALL locked tasks (completed tasks ✓, fixed physical centers, user-added tasks) in their exact slots
 * - Fills slots 0..8 (9 slots per day) and LEAVES SLOT 9 (last bottom capsule) EMPTY for Karim's own additions!
 * - Pulls lessons strictly IN ORDER within EACH independent track (e.g., Arabic-Salah vs Arabic-Taqwa!)
 * - Never duplicates a lecture already locked in the current week
 */
export function buildRandomizedWeeklySchedule(options: BuildScheduleOptions): WeeklyTask[] {
  const {
    lectures = [],
    preserveUserTasks = [],
    lockedTasks = [],
    startFromToday = false,
    respectLectureOrder = true
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

  // Auto-slots strictly cover 0..8 so slot 9 (the 10th bottom box) stays free for Karim's own manual lectures/tasks!
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

  const combinedLocked = [...lockedTasks, ...preserveUserTasks];
  combinedLocked.forEach((lt) => {
    if (!lt || usedIds.has(String(lt.id))) return;
    usedIds.add(String(lt.id));

    if (lt.dayId && occupiedSlots[lt.dayId]) {
      const canUseSlot9 = Boolean(lt.isUserAdded || lt.category === 'manual' || (lt.category === 'exam' && lt.slotIndex === 9));
      const maxAllowedSlot = canUseSlot9 ? 9 : 8;
      let targetSlot =
        typeof lt.slotIndex === 'number' && lt.slotIndex >= 0 && lt.slotIndex <= maxAllowedSlot && !occupiedSlots[lt.dayId].has(lt.slotIndex)
          ? lt.slotIndex
          : null;

      if (targetSlot === null) {
        targetSlot = canUseSlot9 && lt.slotIndex === 9 && !occupiedSlots[lt.dayId].has(9) ? 9 : claimNextAutoSlot(lt.dayId);
      } else {
        occupiedSlots[lt.dayId].add(targetSlot);
      }

      if (targetSlot !== null) {
        resultTasks.push({ ...lt, slotIndex: targetSlot });
        const lid = extractLectureKeyFromTask(lt);
        if (lid) lockedLectureIds.add(lid);
        if (lt.text) lockedTexts.add(lt.text.trim());
      }
    } else if (lt.dayId === 'backlog') {
      resultTasks.push({ ...lt });
      const lid = extractLectureKeyFromTask(lt);
      if (lid) lockedLectureIds.add(lid);
      if (lt.text) lockedTexts.add(lt.text.trim());
    }
  });

  // 1. Fixed Physical Centers
  FIXED_WEEKLY_CLASSES.forEach((f, idx) => {
    const alreadyPresent = resultTasks.some(
      (t) =>
        (t.category === 'center' && t.dayId === f.dayId && t.subjId === f.subjId && t.teacher === f.teacher) ||
        (t.dayId === f.dayId && t.slotIndex === f.slotIndex && t.text === f.text)
    );
    if (alreadyPresent) return;

    const preferredFree = !occupiedSlots[f.dayId].has(f.slotIndex);
    const slot = preferredFree ? f.slotIndex : claimNextAutoSlot(f.dayId);
    if (slot !== null) {
      occupiedSlots[f.dayId].add(slot);
      resultTasks.push({
        id: `center_${f.dayId}_${idx}_${nowSeed}`,
        dayId: f.dayId,
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

  // 3. Prepare queues PER INDEPENDENT TRACK (including separate queues for Arabic-Salah & Arabic-Taqwa!)
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

  // 4. Fill open auto slots [0..8] across days, leaving slot 9 EMPTY!
  const shuffledStudyPool = shuffleArray(DYNAMIC_STUDY_POOL);
  let studyPoolIdx = 0;

  targetDaysOrder.forEach((dayId, dayIdx) => {
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

  return normalizeDaySlots(resultTasks);
}

/**
 * Automatically injects a newly added lecture into the first open auto slot (0..8)
 * on a matching day, or falls back to slot 9 if user explicitly added a manual lecture.
 */
export function injectLectureIntoSchedule(currentTasks: WeeklyTask[], newLecture: Lecture): WeeklyTask[] {
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
    const used = new Set(
      currentTasks
        .filter((t) => t.dayId === dayId && typeof t.slotIndex === 'number')
        .map((t) => t.slotIndex as number)
    );
    for (let slot = 0; slot <= 9; slot++) {
      if (!used.has(slot)) {
        const injectedTask: WeeklyTask = {
          id: `lec_auto_${newLecture.id}_${Date.now()}`,
          dayId,
          subjId: newLecture.subjId,
          text: `${newLecture.code}: ${newLecture.title}`,
          category: newLecture.isDone ? 'review' : 'platform',
          priority: 'high',
          teacher: newLecture.packageName,
          time: newLecture.dueDay,
          lectureId: newLecture.id,
          isUserAdded: slot === 9 ? true : undefined,
          slotIndex: slot
        };
        return normalizeDaySlots([...currentTasks, injectedTask]);
      }
    }
  }

  return normalizeDaySlots(currentTasks);
}
