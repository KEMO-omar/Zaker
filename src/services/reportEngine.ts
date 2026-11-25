import { Subject, Session, Exemption, WeeklyTask, Lecture, ExamRecord, OfficialExam } from '../types';
import {
  computeBacklogHoursSummary,
  diffDaysYmd,
  getLectureTotalMinutes,
  isPlatformLecture,
  toLocalYmd
} from '../utils/scheduleEngine';

export interface LiveStudyInput {
  sessions?: Session[];
  subjects?: Subject[];
  exemptions?: Exemption[];
  exams?: ExamRecord[];
  officialExams?: OfficialExam[];
  weeklyTasks?: WeeklyTask[];
  completedTaskIds?: Array<string | number>;
  lectures?: Lecture[];
  nowMs?: number;
}

export interface SubjectExamAnalysis {
  subjId: string;
  subjName: string;
  examsCount: number;
  examsList: ExamRecord[];
  avgPct: number;
  latestExam: ExamRecord | null;
  latestPct: number;
  prevPct: number | null;
  deltaPct: number | null; // positive = improved, negative = declined
  totalLostMarks: number;
  below95Count: number;
  recordedNotes: string[];
  teachers: string[];
  band: 'elite' | 'borderline' | 'warning' | 'critical' | 'none';
}

export interface SubjectStudyAnalysis {
  subjId: string;
  subjName: string;
  totalMinutes: number;
  totalHours: string;
  todayMinutes: number;
  weekMinutes: number;
  targetMinutes: number;
  targetCoveragePct: number;
  pendingLecturesCount: number;
  doneLecturesCount: number;
  pendingPlatformLectures: Lecture[];
  pendingCenterLectures: Lecture[];
  platformBacklogHours: number;
  homeworkPages: number;
  homeworkQuestions: number;
  pendingTasksCount: number;
}

export interface LiveStudySnapshot {
  generatedAtLabel: string;
  todayDayId: string;
  todayDayName: string;
  lastSessionTs: number;
  hoursSinceLastSession: number | null;
  daysSinceLastSession: number | null;
  inactivityLabel: string;
  todayStudyMins: number;
  todayStudyHours: string;
  weekStudyMins: number;
  weekStudyHours: string;
  allTimeStudyMins: number;
  allTimeStudyHours: string;
  wastedMins: number;
  wastedHours: string;
  todayExemptionMins: number;
  totalTasks: number;
  doneTasks: number;
  pendingTasksCount: number;
  tasksCompletionPct: number;
  todayTasksTotal: number;
  todayTasksDone: number;
  todayPendingTasks: WeeklyTask[];
  urgentPendingTasks: WeeklyTask[];
  allPendingTasks: WeeklyTask[];
  totalLectures: number;
  doneLectures: number;
  undoneLecturesCount: number;
  lecturesCompletionPct: number;
  undonePlatformLectures: Lecture[];
  undoneCenterLectures: Lecture[];
  platformBacklogHours: number;
  homeworkPagesTotal: number;
  homeworkQuestionsTotal: number;
  upcomingOfficialExams: OfficialExam[];
  examsCount: number;
  examsAvgPct: number;
  examsAbove95: number;
  examsBelow95: ExamRecord[];
  subjectExams: SubjectExamAnalysis[];
  subjectStudies: SubjectStudyAnalysis[];
  prioritySubjectId: string;
  prioritySubjectName: string;
  strongestSubjectName: string;
  weakestExamSubject: SubjectExamAnalysis | null;
}

const JS_DAY_TO_SCHEDULE_ID = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_NAMES_AR: Record<string, string> = {
  sat: 'السبت',
  sun: 'الأحد',
  mon: 'الإثنين',
  tue: 'الثلاثاء',
  wed: 'الأربعاء',
  thu: 'الخميس',
  fri: 'الجمعة',
  backlog: 'المتراكم'
};

export function getExamPct(exam: Pick<ExamRecord, 'score' | 'total' | 'pct'>): number {
  if (typeof exam.pct === 'number' && !Number.isNaN(exam.pct) && exam.total > 0) {
    // Recompute if score/total changed without updating pct
    return Math.round((exam.score / exam.total) * 100);
  }
  return exam.total > 0 ? Math.round((exam.score / exam.total) * 100) : 0;
}

export function formatDurationSince(hours: number | null): string {
  if (hours === null) return 'لم تُسجل أي جلسة مذاكرة بعد';
  if (hours < 1) return 'أقل من ساعة (نشط الآن)';
  if (hours < 24) {
    const rounded = Math.round(hours);
    if (rounded === 1) return 'منذ ساعة واحدة';
    if (rounded === 2) return 'منذ ساعتين';
    if (rounded <= 10) return `منذ ${rounded} ساعات`;
    return `منذ ${rounded} ساعة`;
  }
  const days = Math.floor(hours / 24);
  const remHours = Math.round(hours % 24);
  const dayLabel = days === 1 ? 'يوم واحد' : days === 2 ? 'يومين' : days <= 10 ? `${days} أيام` : `${days} يوماً`;
  if (remHours > 0) {
    return `منذ ${dayLabel} و ${remHours} ساعة`;
  }
  return `منذ ${dayLabel}`;
}

export function isLectureCenter(lec: Lecture): boolean {
  return !isPlatformLecture(lec);
}

export function computeLiveStudySnapshot(input: LiveStudyInput): LiveStudySnapshot {
  const nowMs = input.nowMs || Date.now();
  const now = new Date(nowMs);
  const sessions = Array.isArray(input.sessions) ? input.sessions : [];
  const subjects = Array.isArray(input.subjects) && input.subjects.length > 0
    ? input.subjects
    : [
        { id: 'physics', name: 'فيزياء', color: '#818cf8', targetMinutes: 180, icon: 'atom' },
        { id: 'arabic', name: 'لغة عربية', color: '#f59e0b', targetMinutes: 150, icon: 'feather' },
        { id: 'english', name: 'لغة إنجليزية', color: '#38bdf8', targetMinutes: 90, icon: 'globe' },
        { id: 'history', name: 'تاريخ', color: '#10b981', targetMinutes: 120, icon: 'book-open' }
      ];
  const exemptions = Array.isArray(input.exemptions) ? input.exemptions : [];
  const exams = Array.isArray(input.exams) ? input.exams : [];
  const officialExams = Array.isArray(input.officialExams) ? input.officialExams : [];
  const weeklyTasks = Array.isArray(input.weeklyTasks) ? input.weeklyTasks : [];
  const completedSet = new Set((input.completedTaskIds || []).map((id) => String(id)));
  const lectures = Array.isArray(input.lectures) ? input.lectures : [];

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const currentDayOfWeek = now.getDay();
  const diffToSaturday = (currentDayOfWeek + 1) % 7;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToSaturday).getTime();

  const todayDayId = JS_DAY_TO_SCHEDULE_ID[currentDayOfWeek] || 'sat';
  const todayDayName = DAY_NAMES_AR[todayDayId] || 'اليوم';

  // 1. Sessions & Subject study breakdown
  let todayStudyMins = 0;
  let weekStudyMins = 0;
  let allTimeStudyMins = 0;
  let lastSessionTs = 0;

  const subjTotalMins: Record<string, number> = {};
  const subjTodayMins: Record<string, number> = {};
  const subjWeekMins: Record<string, number> = {};
  subjects.forEach((s) => {
    subjTotalMins[s.id] = 0;
    subjTodayMins[s.id] = 0;
    subjWeekMins[s.id] = 0;
  });

  sessions.forEach((s) => {
    const tsEnd = s.tsEnd || 0;
    const tsStart = s.tsStart || (s.date ? new Date(s.date).getTime() : 0);
    const effectiveTs = Math.max(tsEnd, tsStart);
    if (effectiveTs > lastSessionTs) lastSessionTs = effectiveTs;

    const m = Number(s.minutes) || 0;
    allTimeStudyMins += m;
    if (tsStart >= startOfToday) todayStudyMins += m;
    if (tsStart >= startOfWeek) weekStudyMins += m;

    if (Array.isArray(s.entries) && s.entries.length > 0) {
      const slice = m / s.entries.length;
      s.entries.forEach((ent) => {
        if (ent.subj && subjTotalMins[ent.subj] !== undefined) {
          subjTotalMins[ent.subj] += slice;
          if (tsStart >= startOfToday) subjTodayMins[ent.subj] += slice;
          if (tsStart >= startOfWeek) subjWeekMins[ent.subj] += slice;
        }
      });
    } else if (s.subjId && subjTotalMins[s.subjId] !== undefined) {
      subjTotalMins[s.subjId] += m;
      if (tsStart >= startOfToday) subjTodayMins[s.subjId] += m;
      if (tsStart >= startOfWeek) subjWeekMins[s.subjId] += m;
    }
  });

  const hoursSinceLastSession = lastSessionTs > 0 ? Math.max((nowMs - lastSessionTs) / (1000 * 60 * 60), 0) : null;
  const daysSinceLastSession = hoursSinceLastSession !== null ? Math.floor(hoursSinceLastSession / 24) : null;
  const inactivityLabel = formatDurationSince(hoursSinceLastSession);

  // Exemptions & Wasted time today
  let todayExemptionMins = 0;
  exemptions.forEach((ex) => {
    if ((ex.timestamp || 0) >= startOfToday) {
      todayExemptionMins += ex.minutes || 0;
    }
  });
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const sleepMins = 420;
  const elapsedAwakeMins = Math.max(minutesSinceMidnight - (now.getHours() < 7 ? 0 : sleepMins), 0);
  const wastedMins = Math.max(Math.round(elapsedAwakeMins - todayStudyMins - todayExemptionMins), 0);

  // 2. Tasks stats
  const doneTasksList = weeklyTasks.filter((t) => completedSet.has(String(t.id)));
  const allPendingTasks = weeklyTasks.filter((t) => !completedSet.has(String(t.id)));
  const todayTasks = weeklyTasks.filter((t) => t.dayId === todayDayId);
  const todayTasksDone = todayTasks.filter((t) => completedSet.has(String(t.id))).length;
  const todayPendingTasks = todayTasks.filter((t) => !completedSet.has(String(t.id)));
  const urgentPendingTasks = allPendingTasks.filter((t) => t.priority === 'urgent' || t.priority === 'exam' || t.isUserAdded);

  // 3. Lectures & homework backlog stats (strictly platform hours vs center zero-video)
  const doneLectures = lectures.filter((l) => l.isDone).length;
  const undoneLectures = lectures.filter((l) => !l.isDone);
  const undoneCenterLectures = undoneLectures.filter(isLectureCenter);
  const undonePlatformLectures = undoneLectures.filter((l) => !isLectureCenter(l));
  const backlogSummary = computeBacklogHoursSummary(lectures, weeklyTasks, completedSet);
  const todayYmd = toLocalYmd(now);
  const upcomingOfficialExams = officialExams
    .filter((oe) => oe?.date && diffDaysYmd(oe.date, todayYmd) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  // 4. Subject study breakdown
  const subjectStudies: SubjectStudyAnalysis[] = subjects.map((s) => {
    const mins = Math.round(subjTotalMins[s.id] || 0);
    const target = s.targetMinutes || 120;
    const subjLecs = lectures.filter((l) => l.subjId === s.id);
    const subjUndone = subjLecs.filter((l) => !l.isDone);
    const subjPendingTasks = allPendingTasks.filter((t) => t.subjId === s.id);
    let subjPlatformMins = 0;
    let homeworkPages = 0;
    let homeworkQuestions = 0;
    subjUndone.forEach((l) => {
      const meta = getLectureTotalMinutes(l);
      if (meta.isPlatform) subjPlatformMins += meta.lectureMins;
      if (meta.hasHomework && !meta.homeworkDone && meta.homeworkAmount > 0) {
        if (meta.homeworkUnit === 'questions') homeworkQuestions += meta.homeworkAmount;
        else homeworkPages += meta.homeworkAmount;
      }
    });

    return {
      subjId: s.id,
      subjName: s.name,
      totalMinutes: mins,
      totalHours: (mins / 60).toFixed(1),
      todayMinutes: Math.round(subjTodayMins[s.id] || 0),
      weekMinutes: Math.round(subjWeekMins[s.id] || 0),
      targetMinutes: target,
      targetCoveragePct: Math.round((mins / target) * 100),
      pendingLecturesCount: subjUndone.length,
      doneLecturesCount: subjLecs.length - subjUndone.length,
      pendingPlatformLectures: subjUndone.filter((l) => !isLectureCenter(l)),
      pendingCenterLectures: subjUndone.filter(isLectureCenter),
      platformBacklogHours: Number((subjPlatformMins / 60).toFixed(1)),
      homeworkPages,
      homeworkQuestions,
      pendingTasksCount: subjPendingTasks.length
    };
  });

  // 5. Per-subject exams analysis & chronological trend
  const subjectExams: SubjectExamAnalysis[] = subjects.map((s) => {
    const subjExamsList = exams
      .filter((e) => e.subjId === s.id)
      .slice()
      .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

    if (subjExamsList.length === 0) {
      return {
        subjId: s.id,
        subjName: s.name,
        examsCount: 0,
        examsList: [],
        avgPct: 0,
        latestExam: null,
        latestPct: 0,
        prevPct: null,
        deltaPct: null,
        totalLostMarks: 0,
        below95Count: 0,
        recordedNotes: [],
        teachers: [],
        band: 'none'
      };
    }

    const pcts = subjExamsList.map(getExamPct);
    const avgPct = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
    const latestExam = subjExamsList[subjExamsList.length - 1];
    const latestPct = pcts[pcts.length - 1];
    const prevPct = subjExamsList.length >= 2 ? pcts[pcts.length - 2] : null;
    const deltaPct = prevPct !== null ? latestPct - prevPct : null;
    const totalLostMarks = Number(
      subjExamsList.reduce((sum, e) => sum + Math.max((Number(e.total) || 0) - (Number(e.score) || 0), 0), 0).toFixed(1)
    );
    const below95Count = pcts.filter((p) => p < 95).length;
    const recordedNotes = Array.from(
      new Set(subjExamsList.map((e) => (e.notes || '').trim()).filter(Boolean))
    );
    const teachers = Array.from(
      new Set(subjExamsList.map((e) => (e.teacher || '').trim()).filter(Boolean))
    );

    let band: SubjectExamAnalysis['band'] = 'elite';
    if (avgPct < 80 || latestPct < 80) band = 'critical';
    else if (avgPct < 90 || latestPct < 90) band = 'warning';
    else if (avgPct < 95 || latestPct < 95) band = 'borderline';

    return {
      subjId: s.id,
      subjName: s.name,
      examsCount: subjExamsList.length,
      examsList: subjExamsList,
      avgPct,
      latestExam,
      latestPct,
      prevPct,
      deltaPct,
      totalLostMarks,
      below95Count,
      recordedNotes,
      teachers,
      band
    };
  });

  const examsWithPcts = exams.map((e) => ({ exam: e, pct: getExamPct(e) }));
  const examsAvgPct = examsWithPcts.length > 0
    ? Math.round(examsWithPcts.reduce((sum, x) => sum + x.pct, 0) / examsWithPcts.length)
    : 0;
  const examsAbove95 = examsWithPcts.filter((x) => x.pct >= 95).length;
  const examsBelow95 = examsWithPcts.filter((x) => x.pct < 95).map((x) => x.exam);

  // Identify priority subject dynamically (weighting low study hours + pending lectures + low exam average)
  const sortedByNeed = [...subjectStudies].sort((a, b) => {
    const examA = subjectExams.find((e) => e.subjId === a.subjId);
    const examB = subjectExams.find((e) => e.subjId === b.subjId);
    const scoreA = a.totalMinutes / (a.targetMinutes || 120) - a.pendingLecturesCount * 0.15 - (examA && examA.examsCount > 0 && examA.avgPct < 95 ? 0.5 : 0);
    const scoreB = b.totalMinutes / (b.targetMinutes || 120) - b.pendingLecturesCount * 0.15 - (examB && examB.examsCount > 0 && examB.avgPct < 95 ? 0.5 : 0);
    return scoreA - scoreB;
  });

  const sortedByHoursDesc = [...subjectStudies].sort((a, b) => b.totalMinutes - a.totalMinutes);
  const examsWithRecords = subjectExams.filter((se) => se.examsCount > 0).sort((a, b) => a.avgPct - b.avgPct);

  const generatedAtLabel = now.toLocaleString('ar-EG', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    generatedAtLabel,
    todayDayId,
    todayDayName,
    lastSessionTs,
    hoursSinceLastSession,
    daysSinceLastSession,
    inactivityLabel,
    todayStudyMins,
    todayStudyHours: (todayStudyMins / 60).toFixed(1),
    weekStudyMins,
    weekStudyHours: (weekStudyMins / 60).toFixed(1),
    allTimeStudyMins,
    allTimeStudyHours: (allTimeStudyMins / 60).toFixed(1),
    wastedMins,
    wastedHours: (wastedMins / 60).toFixed(1),
    todayExemptionMins,
    totalTasks: weeklyTasks.length,
    doneTasks: doneTasksList.length,
    pendingTasksCount: allPendingTasks.length,
    tasksCompletionPct: weeklyTasks.length > 0 ? Math.round((doneTasksList.length / weeklyTasks.length) * 100) : 0,
    todayTasksTotal: todayTasks.length,
    todayTasksDone,
    todayPendingTasks,
    urgentPendingTasks,
    allPendingTasks,
    totalLectures: lectures.length,
    doneLectures,
    undoneLecturesCount: undoneLectures.length,
    lecturesCompletionPct: lectures.length > 0 ? Math.round((doneLectures / lectures.length) * 100) : 0,
    undonePlatformLectures,
    undoneCenterLectures,
    platformBacklogHours: backlogSummary.lecturesTotalHours,
    homeworkPagesTotal: backlogSummary.homeworkPagesTotal,
    homeworkQuestionsTotal: backlogSummary.homeworkQuestionsTotal,
    upcomingOfficialExams,
    examsCount: exams.length,
    examsAvgPct,
    examsAbove95,
    examsBelow95,
    subjectExams,
    subjectStudies,
    prioritySubjectId: sortedByNeed[0]?.subjId || 'physics',
    prioritySubjectName: sortedByNeed[0]?.subjName || 'فيزياء',
    strongestSubjectName: sortedByHoursDesc[0]?.subjName || 'فيزياء',
    weakestExamSubject: examsWithRecords[0] || null
  };
}

type ConscienceLevel = 'critical' | 'sharp' | 'push';

function getConscienceLevel(snap: LiveStudySnapshot): ConscienceLevel {
  const inactiveHrs = snap.hoursSinceLastSession ?? 999;
  if (
    inactiveHrs >= 24 ||
    (snap.todayStudyMins === 0 && Number(snap.wastedHours) >= 3) ||
    (snap.examsCount > 0 && snap.examsAvgPct < 88) ||
    (snap.undoneLecturesCount >= 12 && snap.todayStudyMins < 60)
  ) {
    return 'critical';
  }
  if (
    inactiveHrs >= 12 ||
    snap.todayStudyMins < 180 ||
    snap.examsBelow95.length > 0 ||
    snap.pendingTasksCount > 0
  ) {
    return 'sharp';
  }
  return 'push';
}

/**
 * 1) التقرير الشامل (Comprehensive Overview Report)
 * الدور: تقييم عام للانضباط الزمني وتوازن المواد وتنفيذ الخطة الأسبوعية + وقفة ضمير مؤثرة.
 */
export function buildComprehensiveReport(snap: LiveStudySnapshot): string {
  const todayTargetPct = Math.min(Math.round((snap.todayStudyMins / 360) * 100), 100);
  const weekTargetPct = Math.min(Math.round((snap.weekStudyMins / 2100) * 100), 100);
  const level = getConscienceLevel(snap);

  const studyRows = [...snap.subjectStudies]
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .map((s) => {
      const balanceTag = s.totalMinutes === 0
        ? '🚨 صفر ساعات كاملة (إهمال تام!)'
        : s.weekMinutes === 0
          ? '⚠️ لم تلمسها هذا الأسبوع'
          : `هذا الأسبوع ${(s.weekMinutes / 60).toFixed(1)}h`;
      return `• **${s.subjName}:** إجمالي ${s.totalHours}h (${balanceTag}) | محاضرات متبقية: ${s.pendingLecturesCount}`;
    })
    .join('\n');

  const todayTasksLine = snap.todayTasksTotal > 0
    ? `${snap.todayTasksDone} من أصل ${snap.todayTasksTotal} مهام لليوم (${snap.todayDayName})`
    : `لا توجد مهام مجدولة ليوم ${snap.todayDayName}`;

  const nextTodayTasks = snap.todayPendingTasks.slice(0, 3)
    .map((t) => `  - ${t.text}`)
    .join('\n');

  let conscienceOpening = '';
  if (level === 'critical') {
    conscienceOpening = `🔥 **فوق يا كريم.. الكلام ده من القلب ومن غير تجميل:**
مرّ على آخر جلسة مذاكرة لك **${snap.inactivityLabel}**، وضاع من يومك **${snap.wastedHours} ساعة** في الهوا!
اسأل نفسك سؤال واحد يوجعك ويصحيك: **تعب أبوك وأمك وشقاهم ودعاهم ليك إنك تدخل كلية الطب.. مين هيعوضهولهم لو فضلت قاعد تتفرج على الساعات وهي بتتسرب من بين إيديك؟**
مجموع تانية ثانوي مدمج مع تالتة — يعني كل ساعة تسويف النهاردة بتاخد من رصيد مجموعك السنة الجاية، ومنافسيك في علمي علوم بيقطعوا الكتب تقطيع دلوقتي!`;
  } else if (level === 'sharp') {
    conscienceOpening = `⚡ **وقفة صراحة وحساب يا دكتور كريم:**
رصيدك اليوم (${snap.todayStudyHours}h من أصل 6 ساعات) مع وجود **${snap.wastedHours} ساعة غير مستغلة** بيقول إنك لسه بتلعب في نص طاقتك!
حلم أوائل الجمهورية والبالطو الأبيض ما بيتاخدش بنص مجهود ولا بتأجيل نص المهام — اللي بيريّح النهاردة بيدفع التمن ندم يوم النتيجة.`;
  } else {
    conscienceOpening = `🦁 **كده أيوه يا بطل.. بس إياك تطمن بدري:**
أرقامك اليوم (${snap.todayStudyHours}h) بتقول إنك راكب القطر الصح، لكن الأوائل ما بيرحموش نفسهم عند "كفاية كده النهاردة" — دوس لحد ما تقفل الـ 100% ومفيش درجة أو محاضرة تفلت منك.`;
  }

  const conscienceFooter = level === 'critical'
    ? `اقفل أي مشتت في إيدك دلوقتي حالاً، افتح غرفة التركيز على **${snap.prioritySubjectName}** واكسر الصفر بـ 50 دقيقة نار، وممنوع تنام الليلة قبل ما تغلق ${snap.todayPendingTasks.length > 0 ? `مهمة «${snap.todayPendingTasks[0].text}»` : 'أول محاضرة متروكة'}!`
    : `توقف عن النظر للوقت الضائع (${snap.wastedHours}h) وابدأ فوراً جلسة 50 دقيقة في **${snap.prioritySubjectName}** لإنقاذ التوازن بين المواد وإغلاق ${snap.todayPendingTasks.length > 0 ? `«${snap.todayPendingTasks[0].text}»` : 'أقرب محاضرة معلقة'}.`;

  const hwSummaryText = [
    snap.homeworkPagesTotal > 0 ? `${snap.homeworkPagesTotal} صفحة` : '',
    snap.homeworkQuestionsTotal > 0 ? `${snap.homeworkQuestionsTotal} سؤال` : ''
  ].filter(Boolean).join(' + ') || 'لا يوجد واجب متراكم';

  const officialExamsAlert = snap.upcomingOfficialExams
    .filter((oe) => diffDaysYmd(oe.date, toLocalYmd()) <= 1)
    .map((oe) => `${oe.title} (${oe.date} · ${oe.period})`)
    .join(' | ');

  return `### 📋 التقرير الشامل للحالة الدراسية والتوازن الزمني (د. كريم عمر)
🕒 **وقت الفحص:** ${snap.generatedAtLabel}

${conscienceOpening}

---

#### 1️⃣ كشف حساب الوقت والانضباط العام:
• **فجوة الانقطاع عن المذاكرة:** ${snap.inactivityLabel}.
• **مذاكرة اليوم (${snap.todayDayName}):** ${snap.todayStudyHours} ساعة (${snap.todayStudyMins} دقيقة) — ${todayTargetPct}% فقط من هدف الـ 6 ساعات.
• **إنجاز الأسبوع الحالي:** ${snap.weekStudyHours} ساعة (${weekTargetPct}% من هدف 35 ساعة).
• **الساعات اللي طارت من عمر حلمك اليوم:** **${snap.wastedHours} ساعة** (${snap.todayExemptionMins > 0 ? `بعد خصم ${Math.round(snap.todayExemptionMins / 60 * 10) / 10}h إعفاءات` : 'بدون أي عذر أو إعفاء مسجل'}).

---

#### 2️⃣ توازن الساعات بين المواد الأربعة:
${studyRows}
• **المادة الأعلى مجهوداً:** ${snap.strongestSubjectName} | **المادة اللي بتصرخ وبتطلب حقها الآن:** ${snap.prioritySubjectName}.

---

#### 3️⃣ وضع الخطة الأسبوعية والمحاضرات والامتحانات:
• **تنفيذ جدول الأسبوع:** ${snap.doneTasks} من ${snap.totalTasks} مهمة (${snap.tasksCompletionPct}%) — واليوم: ${todayTasksLine}.
• **تغطية المحاضرات والواجب:** أنهيت ${snap.doneLectures} من ${snap.totalLectures} محاضرة (${snap.lecturesCompletionPct}%)، ومتبقي **${snap.platformBacklogHours} ساعة منصة** (${snap.undonePlatformLectures.length} محاضرة صلاح/عبد المعبود) + **${snap.undoneCenterLectures.length} حصة سنتر** | واجب متبقي: **${hwSummaryText}**.
• **المؤشر العام للامتحانات:** ${snap.examsCount > 0 ? `متوسط ${snap.examsAvgPct}% عبر ${snap.examsCount} امتحانات (${snap.examsAbove95} فوق الـ 95%، و ${snap.examsBelow95.length} تحت الحد الأدنى للأوائل)` : 'لم تُسجل امتحانات بعد'}${officialExamsAlert ? `\n• **🔔 تنبيه امتحانات الجدول الرسمي:** ${officialExamsAlert}` : ''}.
${nextTodayTasks ? `\n**اللي مستنيك تنفذه النهاردة (${snap.todayDayName}) بدل التسويف:**\n${nextTodayTasks}` : ''}

---

#### 🔥 كلمة الضمير والأمر التنفيذي الآن:
${conscienceFooter}`;
}

/**
 * 2) جلسة مساءلة المتراكمات (Backlog & Procrastination Interrogation)
 * الدور: مواجهة نارية حادة ومباشرة بكل متراكم (منصات + سناتر + مهام مؤجلة + ثغرات <95%) تهز الضمير.
 */
export function buildBacklogInterrogationReport(snap: LiveStudySnapshot): string {
  const bySubjectBacklog = snap.subjectStudies
    .filter((s) => s.pendingLecturesCount > 0 || s.pendingTasksCount > 0)
    .map((s) => {
      const platformSample = s.pendingPlatformLectures.slice(0, 3).map((l) => `    💻 [منصة أونلاين] ${l.title}`).join('\n');
      const centerSample = s.pendingCenterLectures.slice(0, 3).map((l) => `    🏢 [حصة سنتر] ${l.title}`).join('\n');
      const moreCount = Math.max(s.pendingLecturesCount - (Math.min(s.pendingPlatformLectures.length, 3) + Math.min(s.pendingCenterLectures.length, 3)), 0);
      return `• **${s.subjName}** (سايب **${s.pendingLecturesCount} محاضرة** تتحوّل لكابوس: ${s.pendingPlatformLectures.length} منصة + ${s.pendingCenterLectures.length} سنتر | ومعاهم ${s.pendingTasksCount} مهام معلقة):\n${[platformSample, centerSample].filter(Boolean).join('\n')}${moreCount > 0 ? `\n    🚨 … ولسه فيه ${moreCount} محاضرة تانية في ${s.subjName} مركونة ع الرف!` : ''}`;
    })
    .join('\n\n');

  const pendingTodayOrUrgent = (snap.todayPendingTasks.length > 0 ? snap.todayPendingTasks : snap.urgentPendingTasks).slice(0, 5);
  const tasksConfrontation = pendingTodayOrUrgent.length > 0
    ? pendingTodayOrUrgent.map((t, i) => `${i + 1}. [${DAY_NAMES_AR[t.dayId] || t.dayId}] **${t.text}** — لسه ما اتعلمش عليها!`).join('\n')
    : '✅ مفيش مهام عاجلة متسابَة في الجدول حالياً.';

  const lowExamsLines = snap.examsBelow95.length > 0
    ? snap.examsBelow95
        .map((e) => {
          const pct = getExamPct(e);
          const lost = (Number(e.total) - Number(e.score)).toFixed(1);
          return `• **${e.topic}** (${e.teacher}): جبت ${e.score}/${e.total} (**${pct}%**) — طار منك **${lost} درجة**${e.notes ? ` والسبب كان ("${e.notes}")` : ''}.. لسه سايب الغلطة دي من غير مراجعة ليه؟!`;
        })
        .join('\n')
    : '✅ ممتاز، مفيش امتحانات تحت الـ 95% حالياً — بس المتراكم لو اتساب هيضرب الامتحانات الجاية!';

  const gapAlert = snap.hoursSinceLastSession === null
    ? '🚨 **صدمة:** السجل فاضي تماماً ومفيش ولا جلسة مذاكرة متسجلة لحد اللحظة دي!'
    : snap.hoursSinceLastSession >= 24
      ? `🚨 **انقطاع يخوّف يا كريم:** بقالك **${snap.inactivityLabel}** قافل كتبك وصفر حركة، واليوم مسجل ${snap.todayStudyHours}h بس.. كل ساعة بتعدي في الصمت ده بتدفن حلم الطب تحت التراكمات!`
      : snap.hoursSinceLastSession >= 12
        ? `⚠️ **غياب طويل:** عدى **${snap.inactivityLabel}** على آخر جلسة مذاكرة، وفي الوقت ده المحاضرات بتتولد فوق بعضها وأنت مسجل ${snap.todayStudyHours}h!`
        : `⏳ آخر جلسة كانت **${snap.inactivityLabel}** — كويس إنك قريب، بس الجبل المتراكم ده لسه واقف قدامك ومش هيتمسح لوحده!`;

  const topBacklogSubj = [...snap.subjectStudies].sort((a, b) => b.pendingLecturesCount - a.pendingLecturesCount)[0];
  const topTargetName = topBacklogSubj?.subjName || snap.prioritySubjectName;
  const topFirstLec = topBacklogSubj?.pendingPlatformLectures[0]?.title || topBacklogSubj?.pendingCenterLectures[0]?.title;

  const hwSummaryText = [
    snap.homeworkPagesTotal > 0 ? `${snap.homeworkPagesTotal} صفحة` : '',
    snap.homeworkQuestionsTotal > 0 ? `${snap.homeworkQuestionsTotal} سؤال` : ''
  ].filter(Boolean).join(' + ') || 'صفر';

  return `### 🚨 محكمة الضمير وجلسة مساءلة المتراكمات (كلام يطلع من النافوخ)
${gapAlert}

> **"يا كريم، القعدة والفرجة على التراكم مش هتذاكرلك محاضرة، والخوف اللي جواك ده سببه إنك سايب نفسك للتأجيل. التراكمات دي مش هتنزل عليك بوحي قبل الامتحان — يا تصفيها دلوقتي برجولة يا هتدفع تمنها من أعصابك ومجموعك!"**

📊 **حجم الكارثة اللي سايبها وراك الآن:**
**${snap.platformBacklogHours} ساعة منصة متروكة** (${snap.undonePlatformLectures.length} محاضرة منصة صلاح/عبد المعبود) • **${snap.undoneCenterLectures.length} حصة سنتر** (تقوى/أيمن/أحمد سمير بدون وقت فيديو) • **واجب متراكم: ${hwSummaryText}** • **${snap.pendingTasksCount} مهمة جدول** ما اتقفلتش • **${snap.examsBelow95.length} امتحان** نزل تحت خط الـ 95%.

---

#### 1️⃣ كشف المحاضرات والدروس اللي مركونة على ضهرك:
${bySubjectBacklog || '🎉 بطل! كل محاضرات المنصات والسناتر مكتملة 100% — احذر تفتح أي ثغرة جديدة.'}

---

#### 2️⃣ مهام الجدول اللي بتبصلك ومستنياك تتحرك:
${tasksConfrontation}

---

#### 3️⃣ الدرجات اللي اتسربت من إيدك تحت الـ 95%:
${lowExamsLines}

---

#### ⚖️ 3 أسئلة تحطهم قدام عينك وتجاوبهم بالشغل مش بالكلام:
1. **لما ${topBacklogSubj && topBacklogSubj.pendingLecturesCount > 0 ? `${topBacklogSubj.pendingLecturesCount} محاضرة في ${topTargetName}` : 'مهام جدولك'} متسابَة بالمنظر ده وأنت بقى لك (${snap.inactivityLabel}) بعيد.. بتضحك على نفسك وبتقول هلمّهم في ليلة الامتحان إزاي؟**
2. **هل قلبك مطمن وأنت داخل على مدرسينك وراسك شايل ${snap.undonePlatformLectures.length} محاضرة منصة و ${snap.undoneCenterLectures.length} حصة سنتر لسه ما اتشافوش ولا اتحل شيتهم؟**
3. **لو والدك بص في الشاشة دي دلوقتي وشاف ${snap.wastedHours} ساعة ضاعت النهاردة مع التراكم ده.. هترد عليه وتقوله إيه؟**

🔥 **الحكم النهائي — مفيش نقاش:** اقفل الشاشة دي حالاً، اضغط زر **«بدء جلسة إنقاذ»** وابدأ فوراً بـ **${topFirstLec ? `«${topFirstLec}» في ${topTargetName}` : `أول بند متراكم في ${topTargetName}`}** لمدة 45 دقيقة متواصلة من غير ما ترفع عينك عن الورق!`;
}

/**
 * 3) تقارير الامتحانات التشخيصية (Per-Subject & Trend Diagnostic Reports)
 * الدور: تشريح قاسي وصادق لكل مادة ولكل درجة، رصد التحسن أو التراجع مقارنة بالسابق، وكشف أين يتسرب حلم الطب.
 */
export function buildExamsDiagnosticReport(snap: LiveStudySnapshot): string {
  if (snap.examsCount === 0) {
    return `### 🎯 تشريح الامتحانات وميزان الـ 95% (حسب كل مادة والدرجة)
لا توجد أي درجات امتحانات مسجلة في قاعدتك حتى اللحظة!
⚠️ خلي بالك يا كريم: المذاكرة من غير ما تختبر نفسك وتواجه درجتك بتخلق وهم إنك فاهم — سجل أول امتحان أو كويز دلوقتي عشان نعرف مستواك الحقيقي فين من أوائل الجمهورية!`;
  }

  const subjectCards = snap.subjectExams
    .map((se) => {
      const studyInfo = snap.subjectStudies.find((st) => st.subjId === se.subjId);
      const studyHours = studyInfo?.totalHours || '0.0';
      const pendingLecs = studyInfo?.pendingLecturesCount || 0;

      if (se.examsCount === 0) {
        return `#### 📘 ${se.subjName} — (مفيش ولا درجة متسجلة هنا!)
• **المكاشفة:** سجلت فيها ${studyHours}h مذاكرة ولسه فيها ${pendingLecs} محاضرة متبقية، بس هربان من تسجيل درجاتك فيها ليه؟ المادة اللي مش بتتقاس درجتها بتغدر بيك آخر السنة!`;
      }

      const trendText = se.deltaPct === null
        ? '🆕 أول اختبار مسجل في المادة (نقطة البداية)'
        : se.deltaPct > 0
          ? `📈 **انتفاضة وتحسن (+${se.deltaPct}%)** عن الامتحان اللي قبله (${se.prevPct}% ⬅️ ${se.latestPct}%) — خطوة ترفع الراس!`
          : se.deltaPct < 0
            ? `📉 **جرس خطر وهبوط (${se.deltaPct}%)** عن الامتحان اللي قبله (${se.prevPct}% ⬅️ ${se.latestPct}%) — مستواك في النازل لو ما وقفتش النزيف دلوقتي!`
            : `➡️ **ثبات على (${se.latestPct}%)** — لو فوق الـ 95% ممتاز، لو تحتها يبقى لسه ما صلحتش غلطك القديم!`;

      let prescription = '';
      if (se.band === 'elite') {
        prescription = se.deltaPct !== null && se.deltaPct < 0
          ? `🏆 متوسطك (${se.avgPct}%) وسط الأوائل، **بس اوعى الغرور يخدعك!** نزلت في آخر امتحان لـ ${se.latestPct}% ودي علامة إن تركيزك بدأ يتهز — امسك الـ ${(100 - se.latestPct)}% اللي طاروا دول واقفلهم الليلة.`
          : `🦁 **ده مستوى دكاترة القصر العيني وأوائل الجمهورية (${se.avgPct}%)!** تعب الليالي باين في الورقة، لكن البطل الحقيقي ما بيسيبش ولا ربع درجة تضيع — عينك على الـ 100% الصافية!`;
      } else if (se.band === 'borderline') {
        prescription = `⚠️ **بتعور نفسك على الفاضي يا كريم (${se.avgPct}%)!** أنت واقف على عتبة الـ 95% وبتضيع مجهودك بسبب ${se.totalLostMarks} درجة طاروا في تفاصيل كان ممكن تتلم! فرق الـ 2% دول هم الفرق بين كلية القمة وحسرة التنسيق — صفّي الـ ${pendingLecs} محاضرات المعلقة وامسك تريكات الأسئلة اللي غلطت فيها!`;
      } else if (se.band === 'warning') {
        prescription = `🟠 **النتيجة دي ما تنفعش مع واحد حاطط عينه على الطب (${se.avgPct}%)!** خسرت **${se.totalLostMarks} درجة** كاملة ومش مدّي المادة غير ${studyHours}h مذاكرة! الدرجة بتقول بصوت عالي إن طريقة مذاكرتك للمادة دي ناقصها حل بإيدك ومراجعة كشكول أخطاء فوراً!`;
      } else {
        prescription = `🚨 **كارثة ونزيف درجات مفتوح في ${se.subjName} (${se.avgPct}%)!** ضاع منك **${se.totalLostMarks} درجة** — الرقم ده لو فضل كده هيسحب مجموعك التراكمي لتحت ومحدش هيلحقك! اقفل أي حاجة تانية، افتح الـ ${pendingLecs} محاضرات المتروكة في ${se.subjName} وحل الامتحان اللي غلطت فيه بإيدك النهاردة قبل بكرة!`;
      }

      const latestStr = se.latestExam
        ? `${se.latestExam.topic} (${se.latestExam.score}/${se.latestExam.total} = ${se.latestPct}% يوم ${se.latestExam.date})`
        : '';

      const notesStr = se.recordedNotes.length > 0
        ? `• **السبب اللي ضيع درجاتك بإيدك:** ${se.recordedNotes.join(' | ')}`
        : '';

      const scoresHistory = se.examsList.length > 1
        ? `• **شريط الدرجات بالترتيب:** ${se.examsList.map((ex) => `${ex.topic} (${ex.score}/${ex.total} = ${getExamPct(ex)}%)`).join(' ⬅️ ')}`
        : '';

      return `#### 📌 ${se.subjName} — المتوسط: ${se.avgPct}% (${se.examsCount} ${se.examsCount === 1 ? 'امتحان' : 'امتحانات'} | الخسارة: ${se.totalLostMarks} درجة)
• **آخر امتحان:** ${latestStr}
${scoresHistory ? scoresHistory + '\n' : ''}• **اتجاه المنحنى:** ${trendText}
• **المجهود مقابل النتيجة:** ${studyHours} ساعة مذاكرة مسجلة | ${pendingLecs} محاضرة متبقية
${notesStr ? notesStr + '\n' : ''}• **كلمة حق وتشخيص صارم:** ${prescription}`;
    })
    .join('\n\n');

  const weakestSummary = snap.weakestExamSubject
    ? snap.weakestExamSubject.avgPct < 95
      ? `🔥 **أعلى جرس إنذار في كشف درجاتك هو مادة «${snap.weakestExamSubject.subjName}» (${snap.weakestExamSubject.avgPct}%)!** فاضلك +${95 - snap.weakestExamSubject.avgPct}% عشان تدخل دايرة الأوائل. افتكر إن الدرجة اللي بتضيعها في تانية متسجلة في مستقبلك مع تالتة — ما تسيبش كشكول الأخطاء الليلة غير لما تعرف كل غلطة ضاعت فين!`
      : `🦁 **فخور بيك يا دكتور كريم!** كل المواد اللي امتحنت فيها عابرة خط الـ 95%، بس الأوائل الحقيقيين بياخدوا ده دافع عشان يطاردوا الـ 100% خصوصاً في **${snap.weakestExamSubject.subjName}** (${snap.weakestExamSubject.avgPct}%).`
    : '';

  return `### 🎯 تشريح الامتحانات وميزان الأوائل (95%+) — تحليل كل مادة بدرجاتها
🕒 **رصد لحظي:** ${snap.generatedAtLabel}
📊 **كشف الدرجات الكلي:** ${snap.examsCount} امتحانات | المتوسط التراكمي: **${snap.examsAvgPct}%** | حققت شرط الأوائل (≥95%): **${snap.examsAbove95}** | خالفت الشرط (<95%): **${snap.examsBelow95.length}**.

---

${subjectCards}

---

#### 🩺 الخطة العلاجية الحاسمة للامتحانات:
${weakestSummary}`;
}

/**
 * 4) رد الفعل الفوري عند إضافة امتحان جديد (Dynamic Exam Reaction)
 */
export function buildDynamicExamReaction(
  newExam: ExamRecord,
  allExams: ExamRecord[],
  subjName: string,
  subjStudyHours: string
): { reaction: string; pct: number } {
  const pct = getExamPct(newExam);
  const lost = Math.max((Number(newExam.total) || 0) - (Number(newExam.score) || 0), 0);

  const sameSubjPrev = allExams
    .filter((e) => e.subjId === newExam.subjId && e.id !== newExam.id)
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0];

  let comparisonLine = '';
  if (sameSubjPrev) {
    const prevPct = getExamPct(sameSubjPrev);
    const diff = pct - prevPct;
    if (diff > 0) {
      comparisonLine = `📈 **كفو يا بطل — طلعت في ${subjName} بنسبة +${diff}%** عن امتحان «${sameSubjPrev.topic}» (${prevPct}% ⬅️ ${pct}%). المجهود ده بيظهر في الورق!`;
    } else if (diff < 0) {
      comparisonLine = `📉 **وقفة حاسمة في ${subjName}: نزلت ${diff}%** عن مستواك في «${sameSubjPrev.topic}» (${prevPct}% ⬅️ ${pct}%)! التراجع ده إنذار إن تركيزك اتشتت أو استهترت بالمراجعة!`;
    } else {
      comparisonLine = `➡️ **نفس نسبة امتحانك السابق في ${subjName} (${pct}%)** — لو فوق 95% ثبات رجولة، لو تحتها يبقى نفس الغلطة بتتكرر!`;
    }
  } else {
    comparisonLine = `🆕 أول اختبار مسجل في **${subjName}** (رصيد مذاكرتك فيها حتى الآن: ${subjStudyHours}h).`;
  }

  let verdict = '';
  if (pct === 100) {
    verdict = `🏆 **الله أكبر عليك يا دكتور كريم!! تقفيل 100% (${newExam.score}/${newExam.total})!** ده الشغل اللي يرفع راس أهلك قدام الدنيا كلها ويكتب اسمك بين أوائل الجمهورية وكلية الطب البشري! اثبت على نفس العهد ولا تهزك أي فترات كسل!`;
  } else if (pct >= 95) {
    verdict = `🌟 **أداء أوائل يشرّف في ${subjName} (${pct}%)!** دخلت منطقة الـ 95%+ برجولة، بس فاضل **${lost.toFixed(1)} درجة** صغيرين سرقوا منك الـ 100% الكاملة — دور وراهم النهاردة عشان ما تسيبش نص درجة تاني!`;
  } else if (pct >= 85) {
    verdict = `🔥 **فوق لنفسك يا كريم! (${pct}% في ${subjName}) مش بتاعت طالب داخل طب!** ضاع منك **${lost.toFixed(1)} درجة** في «${newExam.topic}»! ${newExam.notes ? `تقول كاتب إن السبب ("${newExam.notes}")` : 'الإهمال أو التسرع ده'}؟! الـ 95% هي خط الأوائل الأدنى — افتح الورقة واكتب كل غلطة في كشكول الأخطاء دلوقتي مش بكرة!`;
  } else {
    verdict = `🚨 **إخفاق ما يتسكتش عليه يا كريم!! (${pct}% في ${subjName})!** طار من إيدك **${lost.toFixed(1)} درجة** من أصل ${newExam.total}! بتعمل إيه في مستقبلك؟ تعب أبوك وأمك مش لعبة عشان تدخل الامتحان تطلع بالدرجة دي! ارمي التليفون من إيدك، افتح الشرح والأسئلة الغلط وحلها بإيدك الليلة لحد ما تفهم كل حرف!`;
  }

  return {
    pct,
    reaction: `${verdict}\n\n${comparisonLine}`
  };
}

/**
 * 5) خطة الساعات المتبقية بالدقائق (Dynamic Time-Blocking Schedule)
 */
export function buildDynamicTimeBlockSchedule(
  snap: LiveStudySnapshot,
  availableHoursRaw = '4',
  bedtime = '23:30',
  focusLevel = 'عالي'
): string {
  const availHours = Math.max(1, Math.min(Number(availableHoursRaw) || 4, 12));
  const roundsCount = Math.max(1, Math.min(Math.floor((availHours * 60) / 60), 6));

  const sortedNeed = [...snap.subjectStudies].sort((a, b) => {
    const ea = snap.subjectExams.find((e) => e.subjId === a.subjId);
    const eb = snap.subjectExams.find((e) => e.subjId === b.subjId);
    const scoreA = (ea && ea.examsCount > 0 ? ea.avgPct : 92) - a.pendingLecturesCount * 2;
    const scoreB = (eb && eb.examsCount > 0 ? eb.avgPct : 92) - b.pendingLecturesCount * 2;
    return scoreA - scoreB;
  });

  const blocks: string[] = [];
  for (let i = 0; i < roundsCount; i++) {
    const subjStudy = sortedNeed[i % sortedNeed.length];
    const subjTask = snap.todayPendingTasks.find((t) => t.subjId === subjStudy.subjId)
      || snap.allPendingTasks.find((t) => t.subjId === subjStudy.subjId);
    const subjLecture = subjStudy.pendingPlatformLectures[0] || subjStudy.pendingCenterLectures[0];
    const subjExam = snap.subjectExams.find((e) => e.subjId === subjStudy.subjId);

    const concreteAction = subjTask
      ? `تنفيذ مهمة: «${subjTask.text}»`
      : subjLecture
        ? `تصفية محاضرة: «${subjLecture.title}»`
        : subjExam && subjExam.examsCount > 0 && subjExam.avgPct < 95
          ? `تشريح أخطاء امتحان ${subjExam.latestExam?.topic || subjStudy.subjName} وحل تدريبات لرفع المتوسط من ${subjExam.avgPct}% لـ 95%+`
          : `مذاكرة وحل شيت تقيل بإيدك في ${subjStudy.subjName}`;

    blocks.push(`${i + 1}. **الجولة ${i + 1} (50 دقيقة حبس نفس ومذاكرة نارية) — ${subjStudy.subjName}:** ${concreteAction}.`);
    if (i < roundsCount - 1) {
      blocks.push(`   ☕ **راحة بومودورو (10 دقائق فقط):** اشرب مية واتحرك، **وممنوع تفتح سوشيال ميديا تخطف دماغك**.`);
    }
  }

  return `### ⏱️ خطة إنقاذ ما تبقى من يوم (${snap.todayDayName}) — دقيقة بدقيقة
📌 **المعطيات:** ${availHours} ساعات متاحة | النوم الإلزامي: ${bedtime} | التركيز: ${focusLevel}
⚡ **الواقع الصريح:** رصيدك اليوم **${snap.todayStudyHours}h** بس، وقدامك **${snap.todayPendingTasks.length} مهمة لليوم** و **${snap.undoneLecturesCount} محاضرة متراكمة**. الـ ${availHours} ساعات دول إما تنقذ بيهم ضميرك أو تضيعهم في الندم!

${blocks.join('\n')}

🌙 **عهد آخر اليوم (${bedtime}):** ما تحطش راسك على المخدة غير لما تعلم صح على المهام اللي أنجزتها في الجدول التفاعلي وتنام وأنت راجل قد كلمتك!`;
}

/**
 * 6) محرك المحادثة المباشر مع المراقب الأكاديمي (100% بيانات حية + حدة وضمير صاحي)
 */
export function buildSupervisorChatAnswer(userMessage: string, snap: LiveStudySnapshot): string {
  const clean = (userMessage || '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .toLowerCase()
    .trim();

  const findSubj = (id: string) => snap.subjectStudies.find((s) => s.subjId === id);
  const findExam = (id: string) => snap.subjectExams.find((e) => e.subjId === id);

  const renderSubjectReply = (subjId: string, introLabel: string) => {
    const st = findSubj(subjId);
    const ex = findExam(subjId);
    const nextLecs = [
      ...(st?.pendingPlatformLectures || []).slice(0, 2).map((l) => `💻 [منصة] ${l.title}`),
      ...(st?.pendingCenterLectures || []).slice(0, 2).map((l) => `🏢 [سنتر] ${l.title}`)
    ];
    const pendingTasks = snap.allPendingTasks.filter((t) => t.subjId === subjId).slice(0, 3);
    const examSummary = ex && ex.examsCount > 0
      ? `متوسطك **${ex.avgPct}%** عبر ${ex.examsCount} امتحانات (آخرهم: ${ex.latestExam?.topic} = ${ex.latestPct}%${ex.deltaPct !== null ? `، التغير: ${ex.deltaPct >= 0 ? `+${ex.deltaPct}` : ex.deltaPct}%` : ''})`
      : 'لسه ما اختبرتش نفسك وسجلت درجة هنا!';

    const emotionalPunch = (st?.pendingLecturesCount || 0) >= 4 || (ex && ex.examsCount > 0 && ex.avgPct < 95)
      ? `🔥 **اسمع الكلام اللي يطلع من النافوخ يا كريم:** عندك **${st?.pendingLecturesCount || 0} محاضرة متروكة** في ${introLabel} ${ex && ex.examsCount > 0 && ex.avgPct < 95 ? `ومتوسط درجاتك نازل عن الـ 95% (${ex.avgPct}%)` : ''}! المادة دي ما بتتفهمش بالنية الطيبة — يا تحبس نفسك تقفلها دلوقتي يا هتدفع التمن في الامتحان الجاي!`
      : `⚡ **شد حيلك يا دكتور:** ${introLabel} محتاجة منك شرسة ومواصلة بدون ما تسيب محاضرة واحدة تركن!`;

    const hwSubjStr = [
      st?.homeworkPages ? `${st.homeworkPages} صفحة` : '',
      st?.homeworkQuestions ? `${st.homeworkQuestions} سؤال` : ''
    ].filter(Boolean).join(' + ');

    return `### 🎯 مكاشفة صريحة في ${introLabel}:
${emotionalPunch}

• **مذاكرتك المسجلة:** ${st?.totalHours || '0.0'}h إجمالي (${((st?.weekMinutes || 0) / 60).toFixed(1)}h هذا الأسبوع).
• **موقف الامتحانات:** ${examSummary}.
• **المتروك في ${introLabel}:** ${st?.pendingLecturesCount || 0} محاضرة (${st?.pendingPlatformLectures.length || 0} منصة بـ ${st?.platformBacklogHours || 0}h + ${st?.pendingCenterLectures.length || 0} سنتر)${hwSubjStr ? ` | واجب متبقي: ${hwSubjStr}` : ''}.
${nextLecs.length > 0 ? `\n**اللي بيبصلك ومستني تفتحه دلوقتي:**\n${nextLecs.map((x) => `- ${x}`).join('\n')}` : '\n✅ مفيش محاضرات متأخرة في المادة دي — عاش!'}
${pendingTasks.length > 0 ? `\n**مهام في الجدول:**\n${pendingTasks.map((t) => `- ${t.text}`).join('\n')}` : ''}

🚨 **قرار فوري:** افتح التايمر 45 دقيقة في **${introLabel}** وخلص أول بند فوق دلوقتي حالاً!`;
  };

  if (clean.includes('فيزيا') || clean.includes('عبد المعبود') || clean.includes('عبدالمعبود')) {
    return renderSubjectReply('physics', 'الفيزياء');
  }
  if (clean.includes('عربي') || clean.includes('نحو') || clean.includes('صلاح') || clean.includes('تقوي') || clean.includes('بلاغ')) {
    return renderSubjectReply('arabic', 'اللغة العربية');
  }
  if (clean.includes('انجليزي') || clean.includes('ايمن') || clean.includes('english') || clean.includes('unit')) {
    return renderSubjectReply('english', 'اللغة الإنجليزية');
  }
  if (clean.includes('تاريخ') || clean.includes('احمد سمير')) {
    return renderSubjectReply('history', 'التاريخ');
  }

  if (clean.includes('متراكم') || clean.includes('مراكم') || clean.includes('منص') || clean.includes('سنتر') || clean.includes('محاضر') || clean.includes('مزاكرتش') || clean.includes('ماذاكرتش') || clean.includes('بقالي') || clean.includes('تقصير') || clean.includes('مقصر')) {
    return buildBacklogInterrogationReport(snap);
  }

  if (clean.includes('امتحان') || clean.includes('درجات') || clean.includes('درجه') || clean.includes('نتيجه') || clean.includes('كويز')) {
    return buildExamsDiagnosticReport(snap);
  }

  if (
    clean.includes('وزع') ||
    clean.includes('متبقي') ||
    clean.includes('جدول') ||
    clean.includes('بومودورو') ||
    clean.includes('نظم') ||
    /(^|\s)وقتي(\s|$)/.test(clean) ||
    clean.includes('الساعات')
  ) {
    return buildDynamicTimeBlockSchedule(snap, '4', '23:30', 'عالي');
  }

  if (clean.includes('تعب') || clean.includes('زهق') || clean.includes('ملل') || clean.includes('مش قادر') || clean.includes('كسل') || clean.includes('محبط') || clean.includes('مخنوق') || clean.includes('ضغط')) {
    return `يا كريم.. اسمعني كويس ووقف الكلام مع الشيطان والكسل ثانية واحدة:
أهلك بيصحوا ويتعبوا ويدفعوا فلوس الدروس والمنصات وهما مش مستنيين أعذار "زهقت أو مش قادر"، مستنيين لحظة ما يدخلوا يشوفوك شايل سماعة كلية الطب ورافع راسهم في بلدكم!
• **الحقيقة قدام عينك الآن:** آخر مذاكرة كانت **${snap.inactivityLabel}**، وفيه **${snap.undoneLecturesCount} محاضرة** و **${snap.pendingTasksCount} مهمة جدول** مستنيين حد راجل يقوم يشيلهم.
• **أوعى تستسلم لشعور الزهق:** الوجع بتاع 25 دقيقة مذاكرة دلوقتي أهون مليون مرة من وجع الندم يوم النتيجة!
🔥 **اتفقنا على خطوة واحدة بس:** افتح التايمر **25 دقيقة** على **${snap.prioritySubjectName}**، واديها روحك — والله أول ما تكمل ربع ساعة دماغك هيفوق وهترجع أسد! 🩺⚡`;
  }

  const level = getConscienceLevel(snap);
  const opener = level === 'critical'
    ? `🚨 **اسمعني يا كريم وكلامي ده يطلع من النافوخ من غير لف ودوران:** وضعك الحالي **خطر حقيقي على حلم كلية الطب**! بقالك **${snap.inactivityLabel}** بعيد عن المذاكرة، وضاع من يومك **${snap.wastedHours}h**، وسايب وراك **${snap.undoneLecturesCount} محاضرة** (**${snap.undonePlatformLectures.length}** منصة + **${snap.undoneCenterLectures.length}** سنتر) و **${snap.pendingTasksCount} مهمة معلقة**!`
    : level === 'sharp'
      ? `⚠️ **وقفة مصارحة مع ضميرك يا كريم:** أرقامك دلوقتي بتقول إنك لسه مش مدّي حلم الطب حقه كامل! آخر جلسة كانت **${snap.inactivityLabel}**، ومذاكرتك الأسبوع ده **${snap.weekStudyHours}h** قصاد **${snap.undoneLecturesCount} محاضرة متراكمة** ومتوسط امتحانات **${snap.examsAvgPct}%**.`
      : `🦁 **عاش يا بطل (${snap.weekStudyHours}h مذاكرة الأسبوع ده)!** التزامك ده هو طريق الطب، بس أوعى تنخدع — لسه عندك **${snap.undoneLecturesCount} محاضرة متبقية** و **${snap.pendingTasksCount} مهمة** عايزة تتقفل بالدم!`;

  return `${opener}

📊 **الصورة الحقيقية قدامك دلوقتي:**
• **آخر جلسة:** ${snap.inactivityLabel} | **اليوم:** ${snap.todayStudyHours}h | **الفاقد اليوم:** ${snap.wastedHours}h.
• **المتروكات:** ${snap.undoneLecturesCount} محاضرة متروكة (أشدهم على ضهرك: **${snap.prioritySubjectName}**).
• **ميزان الامتحانات:** متوسط **${snap.examsAvgPct}%** (${snap.examsAbove95} فوق الـ 95% / ${snap.examsBelow95.length} تحتها).

> **تعب أهلك في سدس/الفشن أمانة في رقبتك يا كريم.. كل ساعة بتعدي وإحنا بنتكلم بس، في طالب غيرك في المحافظة دلوقتي قافل على نفسه وبيحل في ${snap.prioritySubjectName}!**

🔥 **عايز تعرف تعمل إيه دلوقتي حالاً؟** اقفل الشات واضغط **«بدء جلسة مذاكرة»** 45 دقيقة في **${snap.prioritySubjectName}** — ولما تخلصها ارجعلي وأنت رافع راسك!`;
}
