import { Subject, Session, Exemption, WeeklyTask, Lecture, ExamRecord } from '../types';
import {
  LiveStudyInput,
  computeLiveStudySnapshot,
  buildComprehensiveReport,
  buildBacklogInterrogationReport,
  buildExamsDiagnosticReport,
  buildDynamicExamReaction,
  buildDynamicTimeBlockSchedule,
  buildSupervisorChatAnswer,
  getExamPct
} from './reportEngine';

export const DEFAULT_NOTEBOOK_URLS: Record<string, string> = {
  history: 'https://notebook.google.com/notebook/53915592-d0da-4e14-b9cf-fe7959189d34',
  physics: 'https://notebook.google.com/notebook/95907ec1-8d37-4598-bdb0-0d47d9cd4af0',
  arabic: 'https://notebook.google.com/notebook/31a885de-d1e6-4a7a-8782-56652ad528d5',
  english: 'https://notebook.google.com/notebook/66252a85-8af2-4478-830f-90c32838e905'
};

export const DEFAULT_SUBJECTS: Subject[] = [
  {
    id: 'history',
    name: 'تاريخ',
    color: '#10b981',
    targetMinutes: 120,
    icon: 'book-open',
    notebookUrl: DEFAULT_NOTEBOOK_URLS.history
  },
  {
    id: 'arabic',
    name: 'لغة عربية',
    color: '#f59e0b',
    targetMinutes: 150,
    icon: 'feather',
    notebookUrl: DEFAULT_NOTEBOOK_URLS.arabic
  },
  {
    id: 'english',
    name: 'لغة إنجليزية',
    color: '#38bdf8',
    targetMinutes: 90,
    icon: 'globe',
    notebookUrl: DEFAULT_NOTEBOOK_URLS.english
  },
  {
    id: 'physics',
    name: 'فيزياء',
    color: '#818cf8',
    targetMinutes: 180,
    icon: 'atom',
    notebookUrl: DEFAULT_NOTEBOOK_URLS.physics
  }
];

export const FIREBASE_RTDB_URL = 'https://shapap-13c58-default-rtdb.firebaseio.com/shapap';

export interface ActiveSessionRecord {
  isRunning: boolean;
  startTime: number;
  subjId: string;
  taskNote: string;
  pausedElapsed?: number;
}

function toArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'object') return Object.values(val).filter(Boolean);
  return [];
}

function sanitizeFirebaseData(fb: any) {
  if (!fb) return null;
  const rawSubjs = Array.isArray(fb.subjects) && fb.subjects.length >= 4 ? fb.subjects : DEFAULT_SUBJECTS;
  const subjectsWithNotebooks = rawSubjs.map((s: any) => ({
    ...s,
    notebookUrl: s.notebookUrl || DEFAULT_NOTEBOOK_URLS[s.id] || ''
  }));

  return {
    sessions: toArray(fb.sessions).sort((a: any, b: any) => (b.tsStart || 0) - (a.tsStart || 0)),
    exemptions: toArray(fb.exemptions).sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0)),
    weeklyTasks: toArray(fb.weeklyTasks),
    completedTaskIds: toArray(fb.completedTaskIds),
    archivedWeeks: toArray(fb.archivedWeeks),
    activeWeekStartKey: fb.activeWeekStartKey || '',
    lectures: toArray(fb.lectures),
    exams: toArray(fb.exams).sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()),
    subjects: subjectsWithNotebooks,
    customAiInstructions: fb.customAiInstructions || '',
    activeSession: fb.activeSession || null
  };
}

function safeCacheDbData(data: any) {
  try {
    localStorage.setItem('kareem_db_cache', JSON.stringify(data));
  } catch (e) {
    try {
      const stripped = {
        ...data,
        exams: Array.isArray(data?.exams)
          ? data.exams.map((ex: any) =>
              ex && typeof ex.certificateImage === 'string' && ex.certificateImage.length > 30000
                ? { ...ex, certificateImage: '' }
                : ex
            )
          : data?.exams
      };
      localStorage.setItem('kareem_db_cache', JSON.stringify(stripped));
    } catch (e2) {}
  }
}

// 1. Fetch DB Data (Works on local server, Cloud Run, and GitHub Pages via Firebase direct)
export async function fetchDbData(): Promise<any> {
  // Try server endpoint first
  try {
    const res = await fetch('/api/db/sync');
    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        safeCacheDbData(json.data);
        return json.data;
      }
    }
  } catch (err) {
    // Continue to direct Firebase RTDB
  }

  // Direct client-side Firebase RTDB fallback (for GitHub Pages and static preview)
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}.json`);
    if (res.ok) {
      const fbData = await res.json();
      if (fbData) {
        const sanitized = sanitizeFirebaseData(fbData);
        safeCacheDbData(sanitized);
        return sanitized;
      }
    }
  } catch (err) {
    // Continue to local storage
  }

  // Local storage fallback
  try {
    const local = localStorage.getItem('kareem_db_cache');
    if (local) return JSON.parse(local);
  } catch (err) {}

  return null;
}

// 2. Save DB Data (Saves to server, direct Firebase RTDB, and LocalStorage)
export async function saveDbData(data: {
  sessions?: Session[];
  exemptions?: Exemption[];
  weeklyTasks?: WeeklyTask[];
  completedTaskIds?: (string | number)[];
  archivedWeeks?: any[];
  activeWeekStartKey?: string;
  lectures?: Lecture[];
  exams?: ExamRecord[];
  subjects?: Subject[];
  customAiInstructions?: string;
  displayTimeMode?: string;
}): Promise<boolean> {
  // Always update local cache safely (falling back to stripped heavy images if QuotaExceeded)
  safeCacheDbData(data);

  let ok = false;

  // 1. Try server endpoint
  try {
    const res = await fetch('/api/db/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, clientTimestamp: Date.now() })
    });
    if (res.ok) ok = true;
  } catch (err) {}

  // 2. Direct client-side Firebase sync (ensures data is ALWAYS preserved on Firebase)
  try {
    const examsObj: any = {};
    toArray(data.exams).forEach((e: any) => { if (e && e.id) examsObj[e.id] = e; });

    const sessionsObj: any = {};
    toArray(data.sessions).forEach((s: any) => {
      const k = s.fbKey || s.id || (s.tsStart ? `ts_${s.tsStart}` : null);
      if (k) sessionsObj[k] = s;
    });

    const exemptionsObj: any = {};
    toArray(data.exemptions).forEach((x: any) => {
      const k = x.fbKey || x.id || (x.timestamp ? `exm_${x.timestamp}` : null);
      if (k) exemptionsObj[k] = x;
    });

    const results = await Promise.allSettled([
      fetch(`${FIREBASE_RTDB_URL}/exams.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(examsObj) }),
      fetch(`${FIREBASE_RTDB_URL}/weeklyTasks.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toArray(data.weeklyTasks)) }),
      fetch(`${FIREBASE_RTDB_URL}/completedTaskIds.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toArray(data.completedTaskIds)) }),
      fetch(`${FIREBASE_RTDB_URL}/lectures.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toArray(data.lectures)) }),
      fetch(`${FIREBASE_RTDB_URL}/sessions.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sessionsObj) }),
      fetch(`${FIREBASE_RTDB_URL}/exemptions.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(exemptionsObj) }),
      fetch(`${FIREBASE_RTDB_URL}/subjects.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toArray(data.subjects)) }),
      ...(data.archivedWeeks ? [fetch(`${FIREBASE_RTDB_URL}/archivedWeeks.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toArray(data.archivedWeeks)) })] : []),
      ...(data.activeWeekStartKey ? [fetch(`${FIREBASE_RTDB_URL}/activeWeekStartKey.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data.activeWeekStartKey) })] : []),
      fetch(`${FIREBASE_RTDB_URL}/customAiInstructions.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data.customAiInstructions || '') }),
      fetch(`${FIREBASE_RTDB_URL}/lastUpdated.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Date.now()) })
    ]);
    if (results.some(r => r.status === 'fulfilled' && r.value.ok)) ok = true;
  } catch (err) {}

  return ok;
}

// 3. Active Session Sync (Immediately saves running session to Firebase + LocalStorage)
export async function saveActiveSession(active: ActiveSessionRecord | null): Promise<void> {
  if (active) {
    try {
      localStorage.setItem('kareem_active_session', JSON.stringify(active));
    } catch (e) {}

    // Send to local server
    fetch('/api/db/active-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(active)
    }).catch(() => {});

    // Send directly to Firebase RTDB activeSession
    fetch(`${FIREBASE_RTDB_URL}/activeSession.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(active)
    }).catch(() => {});
  } else {
    try {
      localStorage.removeItem('kareem_active_session');
    } catch (e) {}

    // Clear from local server
    fetch('/api/db/active-session', { method: 'DELETE' }).catch(() => {});

    // Clear from Firebase RTDB
    fetch(`${FIREBASE_RTDB_URL}/activeSession.json`, { method: 'DELETE' }).catch(() => {});
  }
}

export async function fetchActiveSession(): Promise<ActiveSessionRecord | null> {
  // 1. LocalStorage
  try {
    const local = localStorage.getItem('kareem_active_session');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && parsed.startTime) return parsed;
    }
  } catch (e) {}

  // 2. Local server
  try {
    const res = await fetch('/api/db/active-session');
    if (res.ok) {
      const data = await res.json();
      if (data && data.activeSession && data.activeSession.startTime) {
        return data.activeSession;
      }
    }
  } catch (e) {}

  // 3. Firebase RTDB
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}/activeSession.json`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.startTime) return data;
    }
  } catch (e) {}

  return null;
}

// 4. REAL CONTEXTUAL ACADEMIC SUPERVISOR ENGINE (Client & Server)
let clientTurn = 0;

export function calculateDynamicSupervisorMood(
  sessions: Session[],
  exams: ExamRecord[],
  todayMins: number = 0
): {
  avatar: string;
  label: string;
  score: number;
  reason: string;
  speech: string;
} {
  // Calculate days since last session
  let latestTs = 0;
  if (Array.isArray(sessions) && sessions.length > 0) {
    sessions.forEach(s => {
      const ts = s.tsStart || (s.date ? new Date(s.date).getTime() : 0);
      if (ts > latestTs) latestTs = ts;
    });
  }

  const now = Date.now();
  const daysInactive = latestTs > 0 ? Math.floor((now - latestTs) / (1000 * 60 * 60 * 24)) : 5;

  // 1. Extreme Inactivity: 5+ days with 0 minutes today
  if (daysInactive >= 5 && todayMins === 0) {
    return {
      avatar: '🚨',
      label: 'غضب ومحاسبة طارئة',
      score: 12,
      reason: `انقطاع قاتل عن المذاكرة لمدة ${daysInactive} أيام! حلم الطب وتعب أهلك بيتسرب من إيدك!`,
      speech: `فوق يا كريم!! بقالك ${daysInactive} أيام كاملة قافل كتبك وصفر دقائق؟! كل ساعة بتنامها أو تضيعها في الفراغ بتاخد من مجموع تانية وتالتة وبتبعدك عن كلية الطب! ارمي كل الأعذار واقعد دلوقتي افتح التايمر حالاً!`
    };
  }

  // 2. High Inactivity: 3-4 days with 0 minutes today
  if (daysInactive >= 3 && todayMins === 0) {
    return {
      avatar: '⚠️',
      label: 'إنذار أحمر وتراجع خطير',
      score: 22,
      reason: `توقف مخيف منذ ${daysInactive} أيام متتالية والمتراكمات بتكبر فوق راسك.`,
      speech: `يا كريم.. ${daysInactive} أيام بدون مذاكرة إزاي وقلبك مطمن؟! منافسيك في علمي علوم بيقفلوا فصول وشيتات وأنت واقف تتفرج! تعب أهلك مش لعبة — افتح غرفة التركيز حالاً واكسر الصفر!`
    };
  }

  // 3. Zero minutes today
  if (todayMins === 0) {
    return {
      avatar: '🔥',
      label: 'محاسبة حادة وصدمة ضمير',
      score: 32,
      reason: 'اليوم بيجري من عمرك ومسجل صفر دقائق مذاكرة حتى الآن!',
      speech: 'بتعمل إيه يا كريم؟! اليوم بيتسحب منك وصفر دقائق متسجلة! مفيش كلية طب بتيجي بالقعاد والنية — افتح التايمر دلوقتي واديها 45 دقيقة نار تنقذ بيها يومك!'
    };
  }

  // 4. Achieved full 6+ hours target
  if (todayMins >= 360) {
    return {
      avatar: '🦁',
      label: 'أسطوري وفخور',
      score: 96,
      reason: 'انضباط أوائل وتحقيق المستهدف اليومي الكامل (6 ساعات+)!',
      speech: 'عاش يا دكتور كريم!! ده الشغل اللي يرفع راس أبوك وأمك ويثبت إنك قد حلم الطب البشري وأوائل الجمهورية. كمل وحافظ على الشراسة دي!'
    };
  }

  // 5. Positive progress (3+ hours)
  if (todayMins >= 180) {
    return {
      avatar: '⚡',
      label: 'إيقاع حلو — لسه ناقص قفلة!',
      score: 74,
      reason: `وصلت ${(todayMins / 60).toFixed(1)}h، لكن الأوائل ما بيوقفوش في نص السكة قبل الـ 6 ساعات.`,
      speech: 'برافو إنك اشتغلت النهاردة، بس إوعى تستريح وتقول كفاية! لسه باقي ساعات اليوم وتقدر تقفل الهدف الكامل وترجع للبيت ضميرك مستريح 100%!'
    };
  }

  // 6. Started but under 3 hours
  return {
    avatar: '⏳',
    label: 'لسه في أول السلم',
    score: 50,
    reason: `ذاكرت ${(todayMins / 60).toFixed(1)} ساعة فقط — أقل من نص المطلوب لطالب علمي علوم.`,
    speech: `الـ ${(todayMins / 60).toFixed(1)} ساعة دول تسخين مش مذاكرة أوائل يا كريم! دوس على نفسك واقفل المشتتات، حلم الطب عاوز تعب يليق بيه النهاردة!`
  };
}

export function generateRealSupervisorAnswer(userMessage: string, context: any): string {
  clientTurn += 1;
  const subjectsList: Subject[] = Array.isArray(context?.subjects) && context.subjects.length > 0
    ? context.subjects
    : DEFAULT_SUBJECTS;

  // Build synthetic sessions if only subjTimes & todayMins exist in legacy callers
  let sessions: Session[] = Array.isArray(context?.sessions) ? context.sessions : [];
  if (sessions.length === 0 && context?.subjTimes) {
    const now = Date.now();
    sessions = Object.entries(context.subjTimes).map(([subjId, mins]) => ({
      id: `ctx_${subjId}`,
      subjId,
      minutes: Number(mins) || 0,
      tsStart: now - 3600 * 1000,
      tsEnd: now
    }));
  }

  const snap = computeLiveStudySnapshot({
    sessions,
    subjects: subjectsList,
    exams: Array.isArray(context?.exams) ? context.exams : [],
    weeklyTasks: Array.isArray(context?.pendingTasks) ? context.pendingTasks : (Array.isArray(context?.weeklyTasks) ? context.weeklyTasks : []),
    completedTaskIds: Array.isArray(context?.completedTaskIds) ? context.completedTaskIds : [],
    lectures: Array.isArray(context?.lectures) ? context.lectures : []
  });

  if (typeof context?.todayStudyMins === 'number' && sessions.length === 0) {
    snap.todayStudyMins = context.todayStudyMins;
    snap.todayStudyHours = (context.todayStudyMins / 60).toFixed(1);
  }
  if (typeof context?.weekMins === 'number' && sessions.length === 0) {
    snap.weekStudyMins = context.weekMins;
    snap.weekStudyHours = (context.weekMins / 60).toFixed(1);
  }
  if (typeof context?.wastedMins === 'number' && sessions.length === 0) {
    snap.wastedMins = context.wastedMins;
    snap.wastedHours = (context.wastedMins / 60).toFixed(1);
  }

  return buildSupervisorChatAnswer(userMessage, snap);
}

export async function callAiChat(message: string, context: any, customInstructions?: string): Promise<string> {
  // 1. Try server endpoint
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context, customInstructions })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.reply) return data.reply;
    }
  } catch (err) {}

  // 2. Real Live Academic Supervisor Engine
  return generateRealSupervisorAnswer(message, context);
}

export async function callAiMonitor(studyInput: LiveStudyInput, customInstructions?: string, forceFresh = true): Promise<string> {
  const snap = computeLiveStudySnapshot(studyInput);
  try {
    const res = await fetch('/api/ai/monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studyData: {
          snapshot: snap,
          raw: {
            sessionsCount: studyInput.sessions?.length || 0,
            examsCount: studyInput.exams?.length || 0,
            lecturesCount: studyInput.lectures?.length || 0,
            tasksCount: studyInput.weeklyTasks?.length || 0
          }
        },
        customInstructions,
        forceFresh
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.analysis) return data.analysis;
    }
  } catch (err) {}

  return buildComprehensiveReport(snap);
}

export async function callAiInterrogate(studyInput: LiveStudyInput, customInstructions?: string): Promise<string> {
  const snap = computeLiveStudySnapshot(studyInput);
  try {
    const res = await fetch('/api/ai/interrogate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        backlogData: {
          snapshot: snap,
          undonePlatformLectures: snap.undonePlatformLectures.map((l) => ({ title: l.title, subjId: l.subjId, code: l.code })),
          undoneCenterLectures: snap.undoneCenterLectures.map((l) => ({ title: l.title, subjId: l.subjId, code: l.code })),
          pendingTasks: snap.allPendingTasks.map((t) => ({ text: t.text, dayId: t.dayId, subjId: t.subjId, priority: t.priority })),
          lowExams: snap.examsBelow95.map((e) => ({ topic: e.topic, subjId: e.subjId, score: e.score, total: e.total, pct: getExamPct(e), notes: e.notes }))
        },
        customInstructions
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.interrogation) return data.interrogation;
    }
  } catch (err) {}

  return buildBacklogInterrogationReport(snap);
}

export async function callAiExamReaction(
  exam: ExamRecord,
  allExams: ExamRecord[],
  subjects: Subject[] = DEFAULT_SUBJECTS,
  sessions: Session[] = [],
  customInstructions?: string
): Promise<{ reaction: string; pct: number }> {
  const subjName = subjects.find((s) => s.id === exam.subjId)?.name || exam.subjId;
  let subjMins = 0;
  sessions.forEach((s) => {
    if (s.entries && s.entries.length > 0) {
      s.entries.forEach((ent) => {
        if (ent.subj === exam.subjId) subjMins += (s.minutes || 0) / s.entries!.length;
      });
    } else if (s.subjId === exam.subjId) {
      subjMins += s.minutes || 0;
    }
  });
  const subjHours = (subjMins / 60).toFixed(1);

  try {
    const lightExam = { ...exam, certificateImage: undefined, subjName };
    const sameSubjHistory = allExams
      .filter((e) => e.subjId === exam.subjId && e.id !== exam.id)
      .slice(0, 5)
      .map((e) => ({ topic: e.topic, score: e.score, total: e.total, pct: getExamPct(e), date: e.date }));

    const res = await fetch('/api/ai/exam-reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exam: lightExam,
        sameSubjHistory,
        subjStudyHours: subjHours,
        allExamsCount: allExams.length,
        customInstructions
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.reaction) return { reaction: data.reaction, pct: data.pct };
    }
  } catch (err) {}

  return buildDynamicExamReaction(exam, allExams, subjName, subjHours);
}

export async function callAiExamAudit(studyInput: LiveStudyInput, customInstructions?: string): Promise<string> {
  const snap = computeLiveStudySnapshot(studyInput);
  try {
    const lightExams = (studyInput.exams || []).map((e) => ({ ...e, certificateImage: undefined }));
    const res = await fetch('/api/ai/exam-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exams: lightExams,
        subjectExams: snap.subjectExams,
        subjectStudies: snap.subjectStudies.map((s) => ({
          subjId: s.subjId,
          subjName: s.subjName,
          totalHours: s.totalHours,
          pendingLecturesCount: s.pendingLecturesCount
        })),
        snapshot: snap,
        customInstructions
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.diagnostic) return data.diagnostic;
    }
  } catch (err) {}

  return buildExamsDiagnosticReport(snap);
}

export async function callAiSchedule(params: {
  availableHours: string;
  bedtime: string;
  focusLevel: string;
  studyInput: LiveStudyInput;
  customInstructions?: string;
}): Promise<string> {
  const snap = computeLiveStudySnapshot(params.studyInput);
  try {
    const res = await fetch('/api/ai/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        availableHours: params.availableHours,
        bedtime: params.bedtime,
        focusLevel: params.focusLevel,
        snapshot: snap,
        customInstructions: params.customInstructions
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.schedule) return data.schedule;
    }
  } catch (err) {}

  return buildDynamicTimeBlockSchedule(snap, params.availableHours, params.bedtime, params.focusLevel);
}

export async function fetchQuotes(): Promise<string[]> {
  try {
    let res = await fetch('./motivation.json');
    if (!res.ok) res = await fetch('./تحفيز.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {}
  return [
    'يا دكتور كريم، حلم كلية الطب وأوائل الجمهورية بيتصنع في الساعات الصعبة دي.',
    'مجموع تانية ثانوي مدمج مع تالتة، مفيش ثانية مسموح بتضييعها.',
    'استعن بالله ولا تعجز، البداية الصعبة تصنع النهاية العظيمة.',
    'الـ 95% هي الحد الأدنى، ومستهدفنا الدائم الـ 100%!',
    'كل مسألة بتحلها في شيت عبد المعبود وصلاح بتثبت مكانك بين أوائل الجمهورية.'
  ];
}
