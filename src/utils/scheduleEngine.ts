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

// Fixed weekly physical Center classes ONLY (حضور السناتر الفعلي فقط بدون أي منصات أونلاين مجردة)
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

// JS getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
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
 * Whenever Friday finishes and Saturday begins, this key changes automatically!
 */
export function getWeekStartSaturdayKey(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // Distance back to Saturday (getDay(): Sat=6 -> 0, Sun=0 -> 1, Mon=1 -> 2, ..., Fri=5 -> 6)
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

export interface BuildScheduleOptions {
  lectures: Lecture[];
  preserveUserTasks?: WeeklyTask[];
  startFromToday?: boolean;
  includeAllDays?: boolean;
}

/**
 * Generates a fresh, randomized, non-static weekly schedule:
 * - Always sets fixed physical centers (no abstract platform appointments)
 * - Focuses & prioritizes user-added manual/exam tasks at top open slots
 * - Randomly distributes uncompleted lectures (to finish) and completed lectures (to review)
 * - Fills slots 0..8 across the target days
 * - STRICTLY leaves slotIndex 9 (the 10th / bottom capsule on every column) EMPTY for manual quick-add!
 */
export function buildRandomizedWeeklySchedule(options: BuildScheduleOptions): WeeklyTask[] {
  const { lectures = [], preserveUserTasks = [], startFromToday = false } = options;
  const nowSeed = Date.now();

  // Map tracking occupied slots [0..8] per day (slot 9 is strictly reserved empty unless user explicitly put a manual task in slot 9)
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

  // 1. Place Fixed Physical Centers ONLY
  FIXED_WEEKLY_CLASSES.forEach((f, idx) => {
    occupiedSlots[f.dayId]?.add(f.slotIndex);
    resultTasks.push({
      id: `center_${f.dayId}_${idx}_${nowSeed}`,
      dayId: f.dayId,
      subjId: f.subjId,
      text: f.text,
      category: 'center',
      priority: 'class',
      teacher: f.teacher,
      time: f.time,
      slotIndex: f.slotIndex
    });
  });

  // Helper to claim the next free auto slot strictly in [0..8] (never touching slot 9!)
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

  // 2. Prioritize & Focus on User-Added Manual / Exam / Urgent Tasks first!
  preserveUserTasks.forEach((ut) => {
    if (!ut.dayId || !occupiedSlots[ut.dayId]) return;
    // Keep in slot 9 if user put it in bottom manual box, otherwise place at highest open slot 0..8
    let targetSlot: number | null = null;
    if (ut.slotIndex === 9) {
      targetSlot = 9;
    } else {
      targetSlot = claimNextAutoSlot(ut.dayId);
    }
    if (targetSlot !== null) {
      resultTasks.push({
        ...ut,
        isUserAdded: true,
        priority: ut.priority || 'urgent',
        slotIndex: targetSlot
      });
    }
  });

  // 3. Determine active days order
  const allDaysOrder = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
  let targetDaysOrder = shuffleArray(allDaysOrder);

  if (startFromToday) {
    const todayId = getCurrentArabicDayId();
    const todayIdx = allDaysOrder.indexOf(todayId);
    const orderedFromToday = todayIdx >= 0
      ? [...allDaysOrder.slice(todayIdx), ...allDaysOrder.slice(0, todayIdx)]
      : allDaysOrder;
    targetDaysOrder = orderedFromToday;
  } else {
    // Keep Saturday first so the start of the week feels immediate, shuffle the subject spread cleanly
    targetDaysOrder = allDaysOrder;
  }

  // 4. Shuffle Pending (uncompleted) Lectures & Completed (for review) Lectures
  // Newly added lectures (higher timestamp id or newer) get randomized mixing with backlog
  const pendingLectures = shuffleArray(lectures.filter(l => !l.isDone));
  const reviewLectures = shuffleArray(lectures.filter(l => l.isDone));

  // Group by subject to ensure balanced variety every day without bunching the same subject 5 times in one day
  const subjKeys = shuffleArray(['physics', 'arabic', 'english', 'history']);
  const pendingBySubj: Record<string, Lecture[]> = {
    physics: shuffleArray(pendingLectures.filter(l => l.subjId === 'physics')),
    arabic: shuffleArray(pendingLectures.filter(l => l.subjId === 'arabic')),
    english: shuffleArray(pendingLectures.filter(l => l.subjId === 'english')),
    history: shuffleArray(pendingLectures.filter(l => l.subjId === 'history'))
  };
  const reviewBySubj: Record<string, Lecture[]> = {
    physics: shuffleArray(reviewLectures.filter(l => l.subjId === 'physics')),
    arabic: shuffleArray(reviewLectures.filter(l => l.subjId === 'arabic')),
    english: shuffleArray(reviewLectures.filter(l => l.subjId === 'english')),
    history: shuffleArray(reviewLectures.filter(l => l.subjId === 'history'))
  };

  // Fill every day dynamically slots [0..8], alternating pending lectures + review lectures + study reinforcement
  // NEVER filling slot 9!
  const shuffledStudyPool = shuffleArray(DYNAMIC_STUDY_POOL);
  let studyPoolIdx = 0;

  targetDaysOrder.forEach((dayId, dayIdx) => {
    // Rotate subject priority per day randomly
    const daySubjOrder = shuffleArray(subjKeys);
    let subjPointer = dayIdx % daySubjOrder.length;
    let guard = 0;

    // Fill slots up to index 8 (9 capsules per day max, leaving bottom 10th capsule completely empty!)
    while (occupiedSlots[dayId].size < 9 && guard < 36) {
      guard++;
      const sId = daySubjOrder[subjPointer % daySubjOrder.length];
      subjPointer++;

      // Ratio: mostly uncompleted lectures (approx 65%), review lectures (approx 25%), study sheet (10% or fallback when exhausted)
      const roll = Math.random();
      let added = false;

      if (roll < 0.65 && pendingBySubj[sId] && pendingBySubj[sId].length > 0) {
        const lec = pendingBySubj[sId].shift()!;
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
            slotIndex: slot
          });
          added = true;
        }
      } else if (roll < 0.90 && reviewBySubj[sId] && reviewBySubj[sId].length > 0) {
        const revLec = reviewBySubj[sId].shift()!;
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
            slotIndex: slot
          });
          added = true;
        }
      }

      // If chosen bucket empty, pull from any available pending -> review -> study pool
      if (!added) {
        const anyPending = subjKeys.find(k => pendingBySubj[k]?.length > 0);
        const anyReview = subjKeys.find(k => reviewBySubj[k]?.length > 0);
        if (anyPending && Math.random() < 0.72) {
          const lec = pendingBySubj[anyPending].shift()!;
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
              slotIndex: slot
            });
          }
        } else if (anyReview) {
          const revLec = reviewBySubj[anyReview].shift()!;
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
              slotIndex: slot
            });
          }
        } else {
          // Fill remaining slots (up to 8) from randomized dynamic study bank
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

  return resultTasks;
}

/**
 * Automatically injects a newly added lecture into the first open auto slot (0..8)
 * on a matching day (based on dueDay text or today/least loaded day).
 * Leaves slot 9 strictly untouched!
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
  const fallbackDays = [todayId, ...ORDERED_WEEK_DAYS.map(d => d.id)];
  const orderedSearchDays = Array.from(new Set([...candidateDays, ...fallbackDays]));

  for (const dayId of orderedSearchDays) {
    const used = new Set(
      currentTasks
        .filter(t => t.dayId === dayId && typeof t.slotIndex === 'number')
        .map(t => t.slotIndex as number)
    );
    // Find free slot strictly between 0 and 8
    for (let slot = 0; slot <= 8; slot++) {
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
          slotIndex: slot
        };
        return [...currentTasks, injectedTask];
      }
    }
  }

  return currentTasks;
}
