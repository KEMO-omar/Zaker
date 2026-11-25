import { ExamRecord, OfficialExam, Session, SmartNotificationItem, Subject, WeeklyTask } from '../types';
import {
  addDaysYmd,
  diffDaysYmd,
  filterTasksForWeek,
  getArabicDayLabel,
  getCurrentArabicDayId,
  getNextArabicDayId,
  getWeekStartSaturdayKey,
  toLocalYmd
} from '../utils/scheduleEngine';

export interface NotificationPrefs {
  enabled: boolean;
  intervalMinutes: number; // e.g., 30, 60, 120
  inactivity12hAlert: boolean;
  preExamAlert: boolean;
  morningCheckIn: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  enabled: true,
  intervalMinutes: 60,
  inactivity12hAlert: true,
  preExamAlert: true,
  morningCheckIn: true
};

export function getTimeGreeting(date: Date = new Date(), hoursSinceLastSession?: number | null): {
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  greeting: string;
  motivation: string;
} {
  const hour = date.getHours();
  const isIdleHard = hoursSinceLastSession === null || (typeof hoursSinceLastSession === 'number' && hoursSinceLastSession >= 12);

  if (hour >= 5 && hour < 12) {
    return {
      period: 'morning',
      greeting: isIdleHard ? '🚨 اصحى يا كريم! الصبح طلع وأنت لسه بعيد عن كتبك!' : 'صباح الهمة والرجولة يا دكتور كريم ☀️',
      motivation: isIdleHard
        ? 'الساعة بتعدي من رصيدك وحلم الطب البشري مش بيستنى حد نايم! تعب أبوك وأمك في رقبتك — اكسر الكسل وابدأ النهاردة قبل ما يضيع!'
        : 'ابدأ يومك ببركة وتوكل على الله.. كل ساعة تركيز النهاردة بتحط طوبة جديدة في كلية الطب!'
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      period: 'afternoon',
      greeting: isIdleHard ? '⚠️ نص اليوم راح يا كريم!! لسه ما اتحركتش ليه؟!' : 'أهلاً يا دكتور في نص اليوم 🌤️',
      motivation: isIdleHard
        ? 'النهار قرب يخلص ومنافسينك في علمي علوم بيقفلوا شيتات ودروس دلوقتي! فوق لنفسك وافتح التايمر حالاً بدل ما تندم بالليل!'
        : 'خليك شرس في نص اليوم! راقب الساعة وما تسمحش لنص ساعة تروح هدر من مهام اليوم.'
    };
  }
  if (hour >= 17 && hour < 22) {
    return {
      period: 'evening',
      greeting: isIdleHard ? '🔥 اليوم بيودّعك وأنت لسه سايب مهامك!!' : 'مساء الإصرار يا دكتور كريم 🌙',
      motivation: isIdleHard
        ? 'الوقت الذهبي ده آخر فرصة تلحق بيها ضميرك النهاردة! اقفل التليفون واللي ملهيش لازمة وشيل أهم مهمة قدامك دلوقتي!'
        : 'الوقت الذهبي لتقفيل اللي فاضل! اقفل مهام اليوم كلها عشان تحط راسك على المخدة وأنت راضي عن نفسك.'
    };
  }
  return {
    period: 'night',
    greeting: isIdleHard ? '🚨 آخر ساعات الليل.. هتنام بضمير ميت ولا هتلحق نفسك؟!' : 'أبطال آخر الليل يا كريم 🌟',
    motivation: isIdleHard
      ? 'النهاردة عدى ومش هيرجع تاني في عمرك! قبل ما تنام خلّص ولو مهمة واحدة تقيلة عشان ما تصحاش بكرة شايل حمل يومين!'
      : 'طمني عليك.. اقفل آخر مهمة متبقية قبل النوم عشان تصحى بكرة على نضافة.'
  };
}

export function getHoursSinceLastSession(sessions: Session[]): number | null {
  if (!sessions || sessions.length === 0) return null;
  let latestTs = 0;
  for (const s of sessions) {
    const ts = s.tsEnd || s.tsStart || (s.date ? new Date(s.date).getTime() : 0);
    if (ts > latestTs) latestTs = ts;
  }
  if (!latestTs) return null;
  return (Date.now() - latestTs) / (1000 * 60 * 60);
}

/**
 * Generates a dynamic check-in message containing today's actual tasks from the weekly schedule,
 * prioritizing user-added tasks first, with sharp conscience-shaking intensity.
 */
export function buildCheckInNotification(
  tasks: WeeklyTask[],
  completedTaskIds: Set<string | number>,
  subjects: Subject[],
  customGreetingOverride?: string,
  sessions?: Session[]
): SmartNotificationItem {
  const todayId = getCurrentArabicDayId();
  const todayLabel = getArabicDayLabel(todayId);
  const currentWeekKey = getWeekStartSaturdayKey();
  const hoursIdle = sessions ? getHoursSinceLastSession(sessions) : undefined;
  const { greeting, motivation } = getTimeGreeting(new Date(), hoursIdle);

  const currentWeekTasks = filterTasksForWeek(tasks, currentWeekKey, currentWeekKey);
  const todayTasks = currentWeekTasks.filter(t => t.dayId === todayId);
  const pendingToday = todayTasks.filter(
    t => !completedTaskIds.has(t.id) && !completedTaskIds.has(String(t.id))
  );

  // Focus & prioritize user-added manual/urgent tasks first
  const sortedPending = [...pendingToday].sort((a, b) => {
    const scoreA = (a.isUserAdded || a.category === 'manual' ? 10 : 0) + (a.category === 'exam' || a.priority === 'exam' ? 8 : 0) + (a.category === 'center' ? 5 : 0);
    const scoreB = (b.isUserAdded || b.category === 'manual' ? 10 : 0) + (b.category === 'exam' || b.priority === 'exam' ? 8 : 0) + (b.category === 'center' ? 5 : 0);
    return scoreB - scoreA;
  });

  const doneCount = todayTasks.length - pendingToday.length;

  let tasksSummary = '';
  if (sortedPending.length === 0 && todayTasks.length > 0) {
    tasksSummary = `🏆 الله عليك يا دكتور! قفلت مهام يوم ${todayLabel} كلها (${doneCount}/${todayTasks.length})! ما تقفش هنا — راجع قديمك أو ضيف مهمة تفوق في الخانة اليدوية.`;
  } else if (sortedPending.length === 0) {
    tasksSummary = `⚠️ يوم ${todayLabel} فاضي بدون مهام متسجلة! مفيش يوم بيعدي في تانية ثانوي كده — افتح الجدول وزع محاضراتك دلوقتي!`;
  } else {
    const previewLines = sortedPending.slice(0, 4).map((t, idx) => {
      const subjName = subjects.find(s => s.id === t.subjId)?.name || t.subjId;
      const star = (t.isUserAdded || t.category === 'manual') ? '⭐ ' : '';
      return `${idx + 1}. ${star}[${subjName}] ${t.text}`;
    });
    const extraCount = sortedPending.length > 4 ? `\n🚨 + ولسه ${sortedPending.length - 4} مهام تانية متسابَة في جدول النهاردة!` : '';
    tasksSummary = `📋 المهام اللي مستنياك دلوقتي في يوم ${todayLabel} (متبقي ${sortedPending.length} من ${todayTasks.length}):\n${previewLines.join('\n')}${extraCount}\n\n🔥 يلا افتح الكتب — كلام التمنّي ما بيدخلش كلية طب!`;
  }

  return {
    id: `notif_checkin_${Date.now()}`,
    type: 'checkin',
    title: customGreetingOverride || greeting,
    body: `${motivation}\n\n${tasksSummary}`,
    timestamp: Date.now(),
    read: false,
    actionTab: 'weeklyView'
  };
}

/**
 * Checks if 12+ hours have passed without any study session — harsh wake-up alarm.
 */
export function buildInactivity12hNotification(
  sessions: Session[],
  tasks?: WeeklyTask[],
  completedTaskIds?: Set<string | number>
): SmartNotificationItem | null {
  const hours = getHoursSinceLastSession(sessions);
  const pendingCount = tasks && completedTaskIds
    ? tasks.filter(t => !completedTaskIds.has(t.id) && !completedTaskIds.has(String(t.id))).length
    : 0;
  const pendingLine = pendingCount > 0 ? `\n📌 وقدامك ${pendingCount} مهمة في جدولك لسه ما اتفتحتش!` : '';

  if (hours === null) {
    return {
      id: `notif_12h_${Date.now()}`,
      type: 'inactivity_12h',
      title: '🚨 مفيش ولا دقيقة مذاكرة متسجلة يا كريم!!',
      body: `الرادار شايف الشاشة بيضا وصفر ساعات مذاكرة! تعب أهلك وحلم أوائل الجمهورية بيضيع وأنت ساكت.${pendingLine}\nارمي أي مشتت في إيدك وافتح غرفة التركيز الآن ولو بـ 25 دقيقة رجولة!`,
      timestamp: Date.now(),
      read: false,
      actionTab: 'focusView'
    };
  }
  if (hours >= 12) {
    const rounded = Math.floor(hours);
    const daysText = rounded >= 24 ? `(${Math.floor(rounded / 24)} يوم و ${rounded % 24} ساعة!!)` : '';
    return {
      id: `notif_12h_${Date.now()}`,
      type: 'inactivity_12h',
      title: `🚨 إنذار غياب ${rounded} ساعة ${daysText} بدون مذاكرة!`,
      body: `عدى ${rounded} ساعة كاملة يا كريم من آخر مرة فتحت فيها التايمر!! بتفكر في إيه والساعات دي بتطير من مجموع تانية وتالتة؟ منافسيك مش نايمين!${pendingLine}\nقوم فوراً اكسر الجمود ده بجلسة 30 دقيقة دلوقتي حالاً!`,
      timestamp: Date.now(),
      read: false,
      actionTab: 'focusView'
    };
  }
  return null;
}

/**
 * Checks for today's or tomorrow's (night-before!) exams across OfficialExams, active-week tasks, and ExamRecords.
 * Uses strictly local YYYY-MM-DD comparisons so future exams never fire early or shift.
 */
export function buildPreExamNotification(
  tasks: WeeklyTask[],
  completedTaskIds: Set<string | number>,
  subjects: Subject[],
  exams: ExamRecord[] = [],
  officialExams: OfficialExam[] = []
): SmartNotificationItem | null {
  const todayStr = toLocalYmd(new Date());
  const tmrwStr = addDaysYmd(todayStr, 1);
  const todayId = getCurrentArabicDayId();
  const tomorrowId = getNextArabicDayId(todayId);
  const currentWeekKey = getWeekStartSaturdayKey();

  // 1. Official Timetable Exams (alert ONLY on today diff === 0 or night-before diff === 1)
  const urgentOfficialExams = (officialExams || []).filter((oe) => {
    if (!oe?.date || !/^\d{4}-\d{2}-\d{2}$/.test(oe.date)) return false;
    const diff = diffDaysYmd(oe.date, todayStr);
    return diff === 0 || diff === 1;
  });

  // 2. Active-week exam tasks matching today or tomorrow
  const activeWeekTasks = filterTasksForWeek(tasks, currentWeekKey, currentWeekKey);
  const upcomingExamTasks = activeWeekTasks.filter((t) => {
    const isDone = completedTaskIds.has(t.id) || completedTaskIds.has(String(t.id));
    if (isDone) return false;
    const isExam = t.category === 'exam' || t.priority === 'exam' || t.text.includes('امتحان') || t.text.includes('كويز');
    if (!isExam) return false;
    if (t.date && /^\d{4}-\d{2}-\d{2}$/.test(t.date)) {
      const diff = diffDaysYmd(t.date, todayStr);
      return diff === 0 || diff === 1;
    }
    return t.dayId === todayId || t.dayId === tomorrowId;
  });

  // 3. ExamRecord only if dated strictly today or tomorrow
  const datedUpcomingExams = exams.filter((e) => e.date === todayStr || e.date === tmrwStr);

  if (urgentOfficialExams.length === 0 && upcomingExamTasks.length === 0 && datedUpcomingExams.length === 0) {
    return null;
  }

  const lines: string[] = [];
  urgentOfficialExams.forEach((oe) => {
    const subj = subjects.find((s) => s.id === oe.subjId)?.name || oe.subjId;
    const diff = diffDaysYmd(oe.date, todayStr);
    const when = diff === 0 ? 'اليوم!!' : 'غداً (تنبيه ليلة الامتحان 🔔)';
    const periodPart = oe.period ? ` · ${oe.period}` : '';
    const syllabusPart = oe.syllabus ? ` — المقرر: ${oe.syllabus}` : '';
    lines.push(`• [جدول رسمي · ${subj}] ${oe.title}${periodPart} (${when}${syllabusPart})`);
  });
  upcomingExamTasks.forEach((t) => {
    const subj = subjects.find((s) => s.id === t.subjId)?.name || t.subjId;
    const isToday = t.date ? t.date === todayStr : t.dayId === todayId;
    const when = isToday ? 'النهاردة' : `بكرة (${getArabicDayLabel(tomorrowId)})`;
    lines.push(`• [${subj}] ${t.text} (${when})`);
  });
  datedUpcomingExams.forEach((e) => {
    const subj = subjects.find((s) => s.id === e.subjId)?.name || e.subjId;
    const when = e.date === todayStr ? 'اليوم' : 'غداً';
    lines.push(`• [${subj}] ${e.topic} - ${e.teacher} (${when})`);
  });

  const hasOfficialNightBefore = urgentOfficialExams.some((oe) => diffDaysYmd(oe.date, todayStr) === 1);
  return {
    id: `notif_exam_${Date.now()}`,
    type: 'exam_alert',
    title: hasOfficialNightBefore
      ? '🔔 تنبيه ليلة الامتحان: امتحان رسمي بكرة يا كريم! الـ 95% خط أحمر!'
      : '🏆 امتحانك على الأبواب يا كريم! مفيش سماح تنزل عن 95%!',
    body: `الامتحان ده بيختبر تعبك الحقيقي — راجع غلطاتك السابقة وحل بإيدك قبل ما تدخل القاعة عشان تقفله 100% وترفع راس أهلك:\n${lines.join('\n')}`,
    timestamp: Date.now(),
    read: false,
    actionTab: urgentOfficialExams.length > 0 ? 'examsView' : 'weeklyView'
  };
}

/**
 * Fires native Web Notification API (if permission granted) alongside in-app tracking.
 */
export function triggerBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.png',
        badge: '/favicon.png',
        dir: 'rtl',
        lang: 'ar-EG'
      });
    } catch (e) {
      // Fallback via ServiceWorker if direct constructor fails
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, { body, icon: '/favicon.png', dir: 'rtl' });
          });
        }
      } catch (err) {}
    }
  }
}
