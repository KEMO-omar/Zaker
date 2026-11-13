import { ExamRecord, Session, SmartNotificationItem, Subject, WeeklyTask } from '../types';
import { getArabicDayLabel, getCurrentArabicDayId, getNextArabicDayId } from '../utils/scheduleEngine';

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

export function getTimeGreeting(date: Date = new Date()): {
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  greeting: string;
  motivation: string;
} {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return {
      period: 'morning',
      greeting: 'صباح الخير والهمة يا دكتور كريم ☀️',
      motivation: 'جهز نفسك للمذاكرة وابدأ يومك ببركة وتوكل على الله.. كل دقيقة النهاردة بتقربك لكلية الطب!'
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      period: 'afternoon',
      greeting: 'أهلاً يا بطل في نص اليوم 🌤️',
      motivation: 'طمني عليك، أخبار المذاكرة والسناتر إيه دلوقتي؟ خليك مركز على مهام اليوم!'
    };
  }
  if (hour >= 17 && hour < 22) {
    return {
      period: 'evening',
      greeting: 'مساء الإنجاز يا دكتور كريم 🌙',
      motivation: 'الوقت الذهبي لتقفيل مهام اليوم! جهز نفسك لجلسة تركيز محترمة تقفل بيها المتاح.'
    };
  }
  return {
    period: 'night',
    greeting: 'بطل الليل يا كريم 🌟',
    motivation: 'طمني عليك.. قبل ما تنام خلّص أهم مهمة فاضلة عشان تنام بضمير مستريح.'
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
 * prioritizing user-added tasks first.
 */
export function buildCheckInNotification(
  tasks: WeeklyTask[],
  completedTaskIds: Set<string | number>,
  subjects: Subject[],
  customGreetingOverride?: string
): SmartNotificationItem {
  const todayId = getCurrentArabicDayId();
  const todayLabel = getArabicDayLabel(todayId);
  const { greeting, motivation } = getTimeGreeting();

  const todayTasks = tasks.filter(t => t.dayId === todayId);
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
    tasksSummary = `🏆 ما شاء الله! خلصت كل مهام يوم ${todayLabel} (${doneCount}/${todayTasks.length})! ممكن تراجع أو تضيف مهمة في الخانة اليدوية.`;
  } else if (sortedPending.length === 0) {
    tasksSummary = `يوم ${todayLabel} فاضي حالياً! افتح الجدول الأسبوعي واضغط توليد أو أضف مهامك النهاردة.`;
  } else {
    const previewLines = sortedPending.slice(0, 4).map((t, idx) => {
      const subjName = subjects.find(s => s.id === t.subjId)?.name || t.subjId;
      const star = (t.isUserAdded || t.category === 'manual') ? '⭐ ' : '';
      return `${idx + 1}. ${star}[${subjName}] ${t.text}`;
    });
    const extraCount = sortedPending.length > 4 ? `\n+ ولسه ${sortedPending.length - 4} مهام أخرى في جدول النهاردة.` : '';
    tasksSummary = `📋 مهام جدول النهاردة (يوم ${todayLabel} - متبقي ${sortedPending.length} من ${todayTasks.length}):\n${previewLines.join('\n')}${extraCount}`;
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
 * Checks if 12+ hours have passed without any study session.
 */
export function buildInactivity12hNotification(sessions: Session[]): SmartNotificationItem | null {
  const hours = getHoursSinceLastSession(sessions);
  if (hours === null) {
    return {
      id: `notif_12h_${Date.now()}`,
      type: 'inactivity_12h',
      title: '🚨 عدى أكثر من 12 ساعة بدون جلسة مذاكرة!',
      body: 'يا دكتور كريم.. مفيش أي جلسة مذاكرة مسجلة في آخر 12 ساعة! جهز نفسك وافتح غرفة التركيز الآن ولو بجلسة 25 دقيقة تنقذ بيها اليوم.',
      timestamp: Date.now(),
      read: false,
      actionTab: 'focusView'
    };
  }
  if (hours >= 12) {
    const rounded = Math.floor(hours);
    return {
      id: `notif_12h_${Date.now()}`,
      type: 'inactivity_12h',
      title: `🚨 إنذار غياب ${rounded} ساعة بدون مذاكرة!`,
      body: `عدى ${rounded} ساعة كاملة يا كريم من آخر جلسة مذاكرة ليك! مفيش وقت يضيع ومجموع تانية مدمج مع تالتة.. اضغط وابدأ جلسة الآن!`,
      timestamp: Date.now(),
      read: false,
      actionTab: 'focusView'
    };
  }
  return null;
}

/**
 * Checks for upcoming or today's exams in weeklyTasks or exams schedule.
 */
export function buildPreExamNotification(
  tasks: WeeklyTask[],
  completedTaskIds: Set<string | number>,
  subjects: Subject[],
  exams: ExamRecord[] = []
): SmartNotificationItem | null {
  const todayId = getCurrentArabicDayId();
  const tomorrowId = getNextArabicDayId(todayId);

  const upcomingExamTasks = tasks.filter(t => {
    const isDone = completedTaskIds.has(t.id) || completedTaskIds.has(String(t.id));
    if (isDone) return false;
    const isExam = t.category === 'exam' || t.priority === 'exam' || t.text.includes('امتحان') || t.text.includes('كويز');
    return isExam && (t.dayId === todayId || t.dayId === tomorrowId);
  });

  // Also check ExamRecord if future date matches today or tomorrow
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const tmrw = new Date(now);
  tmrw.setDate(tmrw.getDate() + 1);
  const tmrwStr = tmrw.toISOString().split('T')[0];

  const datedUpcomingExams = exams.filter(e => e.date === todayStr || e.date === tmrwStr);

  if (upcomingExamTasks.length === 0 && datedUpcomingExams.length === 0) {
    return null;
  }

  const lines: string[] = [];
  upcomingExamTasks.forEach(t => {
    const subj = subjects.find(s => s.id === t.subjId)?.name || t.subjId;
    const when = t.dayId === todayId ? 'النهاردة' : `بكرة (${getArabicDayLabel(tomorrowId)})`;
    lines.push(`• [${subj}] ${t.text} (${when})`);
  });
  datedUpcomingExams.forEach(e => {
    const subj = subjects.find(s => s.id === e.subjId)?.name || e.subjId;
    const when = e.date === todayStr ? 'اليوم' : 'غداً';
    lines.push(`• [${subj}] ${e.topic} - ${e.teacher} (${when})`);
  });

  return {
    id: `notif_exam_${Date.now()}`,
    type: 'exam_alert',
    title: '🏆 تنبيه امتحان قريب! جهز نفسك لشرط الـ 95%+',
    body: `يا دكتور كريم عندك امتحان قريب لازم تستعدله من دلوقتي وتراجع أخطاءك:\n${lines.join('\n')}`,
    timestamp: Date.now(),
    read: false,
    actionTab: 'weeklyView'
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
