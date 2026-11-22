import React, { useState, useMemo } from 'react';
import { Session, Subject, ExamRecord, WeeklyTask, Lecture, ArchivedWeek } from '../types';
import { LECTURE_TRACKS, getLectureTrack, getWeekStartSaturdayKey } from '../utils/scheduleEngine';
import {
  ChevronRight,
  ChevronLeft,
  Clock,
  TrendingUp,
  TrendingDown,
  Award,
  Flame,
  BarChart3,
  Compass,
  Activity,
  Layers,
  AlertTriangle,
  Archive,
  PieChart
} from 'lucide-react';

interface PastWeeksAnalyticsProps {
  sessions: Session[];
  subjects: Subject[];
  exams?: ExamRecord[];
  weeklyTasks?: WeeklyTask[];
  completedTaskIds?: Set<string | number>;
  lectures?: Lecture[];
  archivedWeeks?: ArchivedWeek[];
  onStartFocus?: (subjId: string) => void;
}

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر'
];

export const PastWeeksAnalytics: React.FC<PastWeeksAnalyticsProps> = ({
  sessions,
  subjects,
  exams = [],
  weeklyTasks = [],
  completedTaskIds = new Set(),
  lectures = [],
  archivedWeeks = [],
  onStartFocus
}) => {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);
  const [trendRangeTab, setTrendRangeTab] = useState<'days' | 'weeks' | 'months'>('days');
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);
  const [hoveredWeekIdx, setHoveredWeekIdx] = useState<number | null>(null);

  const now = useMemo(() => new Date(), []);

  // ===================== ALL-TIME HOURS & BACKLOG SUMMARY =====================
  const globalStats = useMemo(() => {
    const allTimeMins = sessions.reduce((sum, s) => sum + (s.minutes || 0), 0);
    const allTimeHours = allTimeMins / 60;

    const totalLecs = lectures.length;
    const doneLecs = lectures.filter((l) => l.isDone).length;
    const pendingLecs = totalLecs - doneLecs;
    const lecBacklogPct = totalLecs > 0 ? Math.round((pendingLecs / totalLecs) * 100) : 0;

    const totalTasks = weeklyTasks.length;
    const doneTasks = weeklyTasks.filter((t) => completedTaskIds.has(t.id) || completedTaskIds.has(String(t.id))).length;
    const pendingTasks = totalTasks - doneTasks;
    const taskBacklogPct = totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0;

    // Combined overall backlog index
    const combinedTotal = totalLecs + totalTasks;
    const combinedPending = pendingLecs + pendingTasks;
    const overallBacklogPct = combinedTotal > 0 ? Math.round((combinedPending / combinedTotal) * 100) : 0;

    // Distinct active study days across all time
    const activeDayKeys = new Set<string>();
    const allTimeSubjMins: Record<string, number> = {};
    subjects.forEach((s) => { allTimeSubjMins[s.id] = 0; });

    sessions.forEach((s) => {
      const ts = s.tsStart || (s.date ? new Date(s.date).getTime() : 0);
      if (ts > 0) {
        const d = new Date(ts);
        activeDayKeys.add(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);
      }
      const subj = s.entries?.[0]?.subj || subjects[0]?.id || 'physics';
      allTimeSubjMins[subj] = (allTimeSubjMins[subj] || 0) + (s.minutes || 0);
    });

    const avgExamPct = exams.length > 0
      ? Math.round(exams.reduce((a, b) => a + (b.pct || Math.round((b.score / b.total) * 100)), 0) / exams.length)
      : 0;

    return {
      allTimeHours: allTimeHours.toFixed(1),
      allTimeHoursNum: allTimeHours,
      totalSessions: sessions.length,
      activeDaysCount: activeDayKeys.size,
      totalLecs,
      doneLecs,
      pendingLecs,
      lecBacklogPct,
      totalTasks,
      doneTasks,
      pendingTasks,
      taskBacklogPct,
      overallBacklogPct,
      allTimeSubjMins,
      avgExamPct
    };
  }, [sessions, lectures, weeklyTasks, completedTaskIds, subjects, exams]);

  // ===================== PAST 8 WEEKS DATA (+ ARCHIVE LINKAGE) =====================
  const weeksData = useMemo(() => {
    const list = [];
    const currentDayOfWeek = now.getDay();
    const diffToSaturday = (currentDayOfWeek + 1) % 7;
    const currentWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToSaturday, 0, 0, 0, 0).getTime();

    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    // Index archivedWeeks by weekKey if available
    const archiveByWeekKey = new Map<string, ArchivedWeek>();
    archivedWeeks.forEach((a) => {
      if (a.weekKey) archiveByWeekKey.set(a.weekKey, a);
    });

    for (let w = 0; w < 8; w++) {
      const startTs = currentWeekStart - w * ONE_WEEK_MS;
      const endTs = startTs + ONE_WEEK_MS;
      const startDate = new Date(startTs);
      const endDate = new Date(endTs - 1000);
      const weekKey = getWeekStartSaturdayKey(startDate);

      const label = w === 0 ? 'الأسبوع الحالي' : w === 1 ? 'الأسبوع الماضي' : `منذ ${w} أسابيع`;
      const shortLabel = w === 0 ? 'الحالي' : w === 1 ? 'الماضي' : `-${w}أ`;
      const dateRangeStr = `${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}`;

      const dayNames = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
      const days = dayNames.map((name, idx) => {
        const dayStartTs = startTs + idx * ONE_DAY_MS;
        const dayDate = new Date(dayStartTs);
        return {
          idx,
          name,
          dateStr: `${dayDate.getDate()}/${dayDate.getMonth() + 1}`,
          startTs: dayStartTs,
          endTs: dayStartTs + ONE_DAY_MS,
          minutes: 0,
          subjMinutes: {} as Record<string, number>,
          sessionsCount: 0
        };
      });

      let totalMinutes = 0;
      let weekSessionsCount = 0;
      const subjTotals: Record<string, number> = {};
      subjects.forEach((s) => { subjTotals[s.id] = 0; });

      sessions.forEach((s) => {
        const ts = s.tsStart || (s.date ? new Date(s.date).getTime() : 0);
        if (ts >= startTs && ts < endTs) {
          const m = s.minutes || 0;
          totalMinutes += m;
          weekSessionsCount += 1;

          const dayIdx = Math.floor((ts - startTs) / ONE_DAY_MS);
          if (dayIdx >= 0 && dayIdx < 7) {
            days[dayIdx].minutes += m;
            days[dayIdx].sessionsCount += 1;
            const primarySubj = s.entries?.[0]?.subj || subjects[0]?.id || 'physics';
            days[dayIdx].subjMinutes[primarySubj] = (days[dayIdx].subjMinutes[primarySubj] || 0) + m;
            subjTotals[primarySubj] = (subjTotals[primarySubj] || 0) + m;
          }
        }
      });

      const activeDays = days.filter((d) => d.minutes > 0).length;
      const peakDay = [...days].sort((a, b) => b.minutes - a.minutes)[0];

      const weekExams = exams.filter((e) => {
        const d = e.date ? new Date(e.date).getTime() : 0;
        return d >= startTs && d < endTs;
      });

      // Resolve completion & backlog % from live tasks (w=0), archivedWeeks, or hour shortfall vs 35h
      let completionPct: number | null = null;
      let archivedSummary: ArchivedWeek | undefined = archiveByWeekKey.get(weekKey);
      if (w === 0 && weeklyTasks.length > 0) {
        const done = weeklyTasks.filter((t) => completedTaskIds.has(t.id) || completedTaskIds.has(String(t.id))).length;
        completionPct = Math.round((done / weeklyTasks.length) * 100);
      } else if (archivedSummary) {
        completionPct = archivedSummary.completionPct;
      }

      const hoursPctOfTarget = Math.min(Math.round((totalMinutes / 2100) * 100), 100);
      // Weekly backlog %: if completionPct known use (100 - completionPct), else shortfall from 35h target
      const weekBacklogPct = completionPct !== null
        ? Math.max(0, 100 - completionPct)
        : Math.max(0, 100 - hoursPctOfTarget);

      list.push({
        index: w,
        weekKey,
        label,
        shortLabel,
        dateRangeStr,
        startTs,
        endTs,
        totalMinutes,
        totalHours: (totalMinutes / 60).toFixed(1),
        totalHoursNum: Number((totalMinutes / 60).toFixed(1)),
        targetMinutes: 2100,
        pctOfTarget: hoursPctOfTarget,
        weekBacklogPct,
        completionPct,
        archivedSummary,
        days,
        activeDays,
        weekSessionsCount,
        peakDay,
        subjTotals,
        examsCount: weekExams.length,
        examsAvg: weekExams.length > 0
          ? Math.round(weekExams.reduce((a, b) => a + (b.pct || Math.round((b.score / b.total) * 100)), 0) / weekExams.length)
          : null
      });
    }

    return list;
  }, [sessions, subjects, exams, now, weeklyTasks, completedTaskIds, archivedWeeks]);

  // ===================== PAST 14 DAYS TIMELINE (HOURS + BACKLOG %) =====================
  const last14Days = useMemo(() => {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const daysArr = [];

    // Estimate rolling backlog pressure trajectory working backwards from current overallBacklogPct
    let rollingBacklog = globalStats.overallBacklogPct;
    const rawDays = [];

    for (let i = 0; i < 14; i++) {
      const dayTs = startOfToday - i * ONE_DAY_MS;
      const dayEndTs = dayTs + ONE_DAY_MS;
      const dObj = new Date(dayTs);

      let mins = 0;
      let count = 0;
      sessions.forEach((s) => {
        const ts = s.tsStart || (s.date ? new Date(s.date).getTime() : 0);
        if (ts >= dayTs && ts < dayEndTs) {
          mins += s.minutes || 0;
          count += 1;
        }
      });

      const hours = Number((mins / 60).toFixed(1));
      const dayTargetHours = 5;
      // Daily deficit drives accumulation upward; high study hours reduce it
      const deficitRatio = Math.max(0, Math.min(100, Math.round(((dayTargetHours - hours) / dayTargetHours) * 100)));

      rawDays.push({
        dayOffset: i,
        dateStr: `${dObj.getDate()}/${dObj.getMonth() + 1}`,
        dayName: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'][dObj.getDay()],
        hours,
        minutes: mins,
        sessionsCount: count,
        deficitRatio,
        backlogPct: Math.round(rollingBacklog)
      });

      // Step backward estimation cleanly within [0..100]
      const delta = hours >= 4 ? -3 : hours >= 2 ? -1 : 3;
      rollingBacklog = Math.max(5, Math.min(98, rollingBacklog - delta));
    }

    // Reverse to chronological left-to-right (oldest -> today)
    for (let i = rawDays.length - 1; i >= 0; i--) {
      daysArr.push(rawDays[i]);
    }
    return daysArr;
  }, [sessions, now, globalStats.overallBacklogPct]);

  // ===================== PREVIOUS MONTHS TIMELINE (HOURS + EXAMS + BACKLOG %) =====================
  const monthlyStats = useMemo(() => {
    const map = new Map<string, { key: string; label: string; minutes: number; sessionsCount: number; examScores: number[]; archivedPcts: number[] }>();

    const ensureMonth = (d: Date) => {
      const y = d.getFullYear();
      const m = d.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: `${ARABIC_MONTHS[m]} ${y}`,
          minutes: 0,
          sessionsCount: 0,
          examScores: [],
          archivedPcts: []
        });
      }
      return map.get(key)!;
    };

    // Ensure at least current + previous 2 months exist
    for (let mOff = 2; mOff >= 0; mOff--) {
      const refD = new Date(now.getFullYear(), now.getMonth() - mOff, 1);
      ensureMonth(refD);
    }

    sessions.forEach((s) => {
      const ts = s.tsStart || (s.date ? new Date(s.date).getTime() : 0);
      if (ts > 0) {
        const entry = ensureMonth(new Date(ts));
        entry.minutes += s.minutes || 0;
        entry.sessionsCount += 1;
      }
    });

    exams.forEach((e) => {
      const ts = e.date ? new Date(e.date).getTime() : 0;
      if (ts > 0) {
        const entry = ensureMonth(new Date(ts));
        const pct = e.pct ?? Math.round((e.score / Math.max(1, e.total)) * 100);
        entry.examScores.push(pct);
      }
    });

    archivedWeeks.forEach((a) => {
      const ts = a.archivedAt ? new Date(a.archivedAt).getTime() : 0;
      if (ts > 0) {
        const entry = ensureMonth(new Date(ts));
        entry.archivedPcts.push(a.completionPct);
      }
    });

    return Array.from(map.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-6)
      .map((m) => {
        const hours = Number((m.minutes / 60).toFixed(1));
        const targetMonthHours = 140; // ~35h * 4 weeks
        const hoursAchievement = Math.min(100, Math.round((hours / targetMonthHours) * 100));
        const avgExam = m.examScores.length > 0
          ? Math.round(m.examScores.reduce((a, b) => a + b, 0) / m.examScores.length)
          : null;
        const backlogRate = m.archivedPcts.length > 0
          ? Math.round(100 - (m.archivedPcts.reduce((a, b) => a + b, 0) / m.archivedPcts.length))
          : Math.max(0, 100 - hoursAchievement);

        return {
          ...m,
          hours,
          hoursAchievement,
          avgExam,
          backlogRate
        };
      });
  }, [sessions, exams, archivedWeeks, now]);

  // ===================== TRACK & SUBJECT VISUAL DONUT RINGS =====================
  const trackRings = useMemo(() => {
    return LECTURE_TRACKS.map((tr) => {
      const trLecs = lectures.filter((l) => getLectureTrack(l).id === tr.id);
      const total = trLecs.length;
      const done = trLecs.filter((l) => l.isDone).length;
      const pending = total - done;
      const donePct = total > 0 ? Math.round((done / total) * 100) : 0;
      const backlogPct = total > 0 ? 100 - donePct : 0;
      const subj = subjects.find((s) => s.id === tr.subjId);
      const subjHours = ((globalStats.allTimeSubjMins[tr.subjId] || 0) / 60).toFixed(1);

      return {
        ...tr,
        color: subj?.color || '#38bdf8',
        total,
        done,
        pending,
        donePct,
        backlogPct,
        subjHours
      };
    });
  }, [lectures, subjects, globalStats.allTimeSubjMins]);

  const activeWeek = weeksData[selectedWeekIndex] || weeksData[0];
  const prevWeek = weeksData[selectedWeekIndex + 1];

  const diffHours = prevWeek
    ? (Number(activeWeek.totalHours) - Number(prevWeek.totalHours)).toFixed(1)
    : null;

  // 35-Day Heatmap calculation
  const heatmapCells = useMemo(() => {
    const cells = [];
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    for (let i = 34; i >= 0; i--) {
      const cellTs = startOfToday - i * ONE_DAY_MS;
      const cellEndTs = cellTs + ONE_DAY_MS;
      const cellDate = new Date(cellTs);

      let dayMins = 0;
      sessions.forEach((s) => {
        const ts = s.tsStart || (s.date ? new Date(s.date).getTime() : 0);
        if (ts >= cellTs && ts < cellEndTs) {
          dayMins += s.minutes || 0;
        }
      });

      const hours = (dayMins / 60).toFixed(1);
      let level = 0;
      if (dayMins >= 360) level = 4;
      else if (dayMins >= 240) level = 3;
      else if (dayMins >= 120) level = 2;
      else if (dayMins > 0) level = 1;

      cells.push({
        dateStr: `${cellDate.getDate()}/${cellDate.getMonth() + 1}`,
        dayName: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'][cellDate.getDay()],
        minutes: dayMins,
        hours,
        level,
        isToday: i === 0
      });
    }
    return cells;
  }, [sessions, now]);

  // Productivity 24h Segments
  const circadianRhythm = useMemo(() => {
    const segments = [
      { id: 'dawn', label: 'الفجر والباكر', time: '04:00 - 09:00', icon: '🌅', minutes: 0 },
      { id: 'morning', label: 'النهار والظهيرة', time: '09:00 - 14:00', icon: '☀️', minutes: 0 },
      { id: 'afternoon', label: 'العصر والمغرب', time: '14:00 - 19:00', icon: '🌤️', minutes: 0 },
      { id: 'night', label: 'المساء والليل', time: '19:00 - 24:00', icon: '🌙', minutes: 0 },
      { id: 'late', label: 'السهر المتأخر', time: '00:00 - 04:00', icon: '🌌', minutes: 0 }
    ];

    sessions.forEach((s) => {
      const ts = s.tsStart || (s.date ? new Date(s.date).getTime() : 0);
      if (ts > 0) {
        const hour = new Date(ts).getHours();
        const m = s.minutes || 0;
        if (hour >= 4 && hour < 9) segments[0].minutes += m;
        else if (hour >= 9 && hour < 14) segments[1].minutes += m;
        else if (hour >= 14 && hour < 19) segments[2].minutes += m;
        else if (hour >= 19 && hour < 24) segments[3].minutes += m;
        else segments[4].minutes += m;
      }
    });

    const totalCircadian = segments.reduce((acc, s) => acc + s.minutes, 0) || 1;
    return segments.map((seg) => ({
      ...seg,
      hours: (seg.minutes / 60).toFixed(1),
      pct: Math.round((seg.minutes / totalCircadian) * 100)
    }));
  }, [sessions]);

  // Medical School Admission Readiness Score (0 - 100)
  const medicalIndex = useMemo(() => {
    let examScore = 70;
    if (exams.length > 0) {
      const avg = exams.reduce((a, b) => a + (b.pct || Math.round((b.score / b.total) * 100)), 0) / exams.length;
      examScore = Math.min(Math.round((avg / 95) * 100), 100);
    }

    const curWeekMins = weeksData[0]?.totalMinutes || 0;
    const hoursScore = Math.min(Math.round((curWeekMins / 1800) * 100), 100);

    const doneLecs = lectures.filter((l) => l.isDone).length;
    const totalLecs = lectures.length || 1;
    const lecScore = Math.round((doneLecs / totalLecs) * 100);

    const doneTasks = weeklyTasks.filter((t) => completedTaskIds.has(t.id) || completedTaskIds.has(String(t.id))).length;
    const totalTasks = weeklyTasks.length || 1;
    const taskScore = Math.round((doneTasks / totalTasks) * 100);

    const weightedTotal = Math.round(
      examScore * 0.35 +
      hoursScore * 0.30 +
      lecScore * 0.20 +
      taskScore * 0.15
    );

    let statusText = 'على مسار أوائل الجمهورية 🩺';
    let statusColor = 'var(--accent-primary)';
    if (weightedTotal < 60) {
      statusText = 'خطر استنزاف الحلم - تدارك فوراً 🚨';
      statusColor = 'var(--danger)';
    } else if (weightedTotal < 80) {
      statusText = 'مستوى تنافسي يحتاج حسم وضبط ساعات ⚠️';
      statusColor = 'var(--warning)';
    }

    return {
      score: weightedTotal,
      examScore,
      hoursScore,
      lecScore,
      taskScore,
      statusText,
      statusColor
    };
  }, [exams, weeksData, lectures, weeklyTasks, completedTaskIds]);

  const maxDayMinutes = Math.max(...activeWeek.days.map((d) => d.minutes), 360);

  // SVG Chart helper metrics for 14-day view
  const max14DayHours = Math.max(...last14Days.map((d) => d.hours), 6);
  const chronologicalWeeks = useMemo(() => [...weeksData].reverse(), [weeksData]);
  const max8WeekHours = Math.max(...chronologicalWeeks.map((w) => w.totalHoursNum), 35);
  const maxMonthHours = Math.max(...monthlyStats.map((m) => m.hours), 40);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 0. ALL-TIME VISUAL KPI OVERVIEW: TOTAL HOURS, BACKLOG & ACCUMULATION RATE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {/* KPI 1: Total Hours All Time */}
        <div className="card" style={{ padding: '16px 18px', background: 'var(--bg-surface)', borderRight: '3.5px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>عدد الساعات الكلية (منذ البداية)</span>
            <Clock size={16} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="tabular" style={{ fontSize: 30, fontWeight: 900, color: 'var(--accent-primary)' }}>
              {globalStats.allTimeHours}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>ساعة مذاكرة</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8 }}>
            عبر <strong className="tabular">{globalStats.totalSessions}</strong> جلسة في{' '}
            <strong className="tabular">{globalStats.activeDaysCount}</strong> يوم فعلي
          </div>
        </div>

        {/* KPI 2: Overall Backlog & Accumulation % */}
        <div className="card" style={{ padding: '16px 18px', background: 'var(--bg-surface)', borderRight: '3.5px solid var(--danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>المراكمة الكلية ونسبة المتراكم</span>
            <AlertTriangle size={16} style={{ color: globalStats.overallBacklogPct > 50 ? 'var(--danger)' : 'var(--warning)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span className="tabular" style={{ fontSize: 30, fontWeight: 900, color: globalStats.overallBacklogPct > 50 ? 'var(--danger)' : 'var(--warning)' }}>
              {globalStats.overallBacklogPct}%
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              نسبة مراكمة ({globalStats.pendingLecs} محاضرة + {globalStats.pendingTasks} مهمة)
            </span>
          </div>
          <div className="stat-progress-bar" style={{ marginTop: 10, height: 6 }}>
            <div
              className="stat-progress-fill"
              style={{
                width: `${globalStats.overallBacklogPct}%`,
                background: globalStats.overallBacklogPct > 50 ? 'var(--danger)' : 'var(--warning)'
              }}
            />
          </div>
        </div>

        {/* KPI 3: Lectures Backlog Breakdown */}
        <div className="card" style={{ padding: '16px 18px', background: 'var(--bg-surface)', borderRight: '3.5px solid var(--accent-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>إنجاز ومراكمة المحاضرات</span>
            <PieChart size={16} style={{ color: 'var(--accent-secondary)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="tabular" style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-main)' }}>
              {globalStats.doneLecs}/{globalStats.totalLecs}
            </span>
            <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 700 }}>
              (مراكمة {globalStats.lecBacklogPct}%)
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8 }}>
            متبقي <strong className="tabular">{globalStats.pendingLecs}</strong> محاضرة لم تُغلق بعد
          </div>
        </div>

        {/* KPI 4: Weekly Archives Summary */}
        <div className="card" style={{ padding: '16px 18px', background: 'var(--bg-surface)', borderRight: '3.5px solid #a78bfa' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>متوسط التراكم والأرشيف الأسبوعي</span>
            <Archive size={16} style={{ color: '#a78bfa' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="tabular" style={{ fontSize: 28, fontWeight: 900, color: '#a78bfa' }}>
              {archivedWeeks.length}
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>أسابيع مؤرشفة</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8 }}>
            الأسبوع الحالي: <strong className="tabular">{globalStats.doneTasks}/{globalStats.totalTasks}</strong> مهمة منجزة
          </div>
        </div>
      </div>

      {/* 0.5 MULTI-TIMESCALE PROGRESS & ACCUMULATION SVG CHARTS (DAYS / WEEKS / MONTHS) */}
      <div className="card" style={{ padding: '20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={19} style={{ color: 'var(--accent-primary)' }} />
              <span>الرسوم البيانية للتقدم والساعات ونسبة المراكمة عبر الزمن</span>
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              قارن تطور ساعات مذاكرتك مقابل نسبة المراكمة خلال الأيام والأسابيع والشهور السابقة
            </p>
          </div>

          <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className={`btn btn-sm ${trendRangeTab === 'days' ? 'btn-primary' : ''}`}
              onClick={() => setTrendRangeTab('days')}
              style={{ fontSize: 12, fontWeight: 700, border: trendRangeTab === 'days' ? undefined : 'none', background: trendRangeTab === 'days' ? undefined : 'transparent' }}
            >
              الأيام السابقة (14 يوم)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${trendRangeTab === 'weeks' ? 'btn-primary' : ''}`}
              onClick={() => setTrendRangeTab('weeks')}
              style={{ fontSize: 12, fontWeight: 700, border: trendRangeTab === 'weeks' ? undefined : 'none', background: trendRangeTab === 'weeks' ? undefined : 'transparent' }}
            >
              الأسابيع السابقة (8 أسابيع)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${trendRangeTab === 'months' ? 'btn-primary' : ''}`}
              onClick={() => setTrendRangeTab('months')}
              style={{ fontSize: 12, fontWeight: 700, border: trendRangeTab === 'months' ? undefined : 'none', background: trendRangeTab === 'months' ? undefined : 'transparent' }}
            >
              الأشهر السابقة ({monthlyStats.length})
            </button>
          </div>
        </div>

        {/* Legend Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 14 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--accent-primary)' }} />
            <span>ساعات المذاكرة المسجلة</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 16, height: 3, borderRadius: 2, background: '#ef4444' }} />
            <span>منحنى نسبة المراكمة / العجز (%)</span>
          </span>
          {trendRangeTab === 'months' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#38bdf8' }} />
              <span>متوسط درجات الامتحانات (%)</span>
            </span>
          )}
        </div>

        {/* SVG CHART 1: LAST 14 DAYS (HOURS BARS + BACKLOG % LINE) */}
        {trendRangeTab === 'days' && (
          <div>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg viewBox="0 0 840 245" style={{ width: '100%', minWidth: 640, height: 'auto', display: 'block' }}>
                <defs>
                  <linearGradient id="dayBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.65" />
                  </linearGradient>
                  <linearGradient id="backlogLineArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Lines */}
                {[0, 25, 50, 75, 100].map((pct) => {
                  const y = 190 - (pct / 100) * 155;
                  return (
                    <g key={pct}>
                      <line x1={40} y1={y} x2={810} y2={y} stroke="rgba(148,163,184,0.14)" strokeDasharray="3 4" />
                      <text x={32} y={y + 4} textAnchor="end" fontSize="10" fill="rgba(148,163,184,0.75)">
                        {pct}%
                      </text>
                    </g>
                  );
                })}

                {/* Backlog % Area + Polyline */}
                {last14Days.length > 1 && (
                  <>
                    <polygon
                      fill="url(#backlogLineArea)"
                      points={`68,190 ${last14Days
                        .map((d, i) => {
                          const x = 68 + i * 54;
                          const y = 190 - (d.backlogPct / 100) * 155;
                          return `${x},${y}`;
                        })
                        .join(' ')} ${68 + (last14Days.length - 1) * 54},190`}
                    />
                    <polyline
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={last14Days
                        .map((d, i) => {
                          const x = 68 + i * 54;
                          const y = 190 - (d.backlogPct / 100) * 155;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  </>
                )}

                {/* Daily Study Hour Bars + Interactive Nodes */}
                {last14Days.map((d, i) => {
                  const xCenter = 68 + i * 54;
                  const barW = 24;
                  const barH = Math.max(4, (d.hours / max14DayHours) * 145);
                  const barY = 190 - barH;
                  const lineY = 190 - (d.backlogPct / 100) * 155;
                  const isHovered = hoveredDayIdx === i;

                  return (
                    <g
                      key={d.dateStr}
                      onMouseEnter={() => setHoveredDayIdx(i)}
                      onMouseLeave={() => setHoveredDayIdx(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={xCenter - barW / 2}
                        y={barY}
                        width={barW}
                        height={barH}
                        rx={5}
                        fill={d.hours >= 5 ? 'url(#dayBarGrad)' : d.hours > 0 ? '#38bdf8' : 'rgba(239,68,68,0.22)'}
                        opacity={isHovered ? 1 : 0.88}
                      />
                      {d.hours > 0 && (
                        <text x={xCenter} y={barY - 5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#e2e8f0">
                          {d.hours}h
                        </text>
                      )}
                      <circle
                        cx={xCenter}
                        cy={lineY}
                        r={isHovered ? 5.5 : 3.8}
                        fill="#ef4444"
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      <text x={xCenter} y={208} textAnchor="middle" fontSize="10.5" fontWeight={d.dayOffset === 0 ? '800' : '600'} fill={d.dayOffset === 0 ? '#10b981' : '#94a3b8'}>
                        {d.dateStr}
                      </text>
                      <text x={xCenter} y={224} textAnchor="middle" fontSize="9.5" fill="#64748b">
                        {d.dayOffset === 0 ? 'اليوم' : d.dayName}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Interactive Hover Detail Strip */}
            <div style={{ marginTop: 10, padding: '8px 14px', borderRadius: 8, background: 'var(--bg-elevated)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              {hoveredDayIdx !== null && last14Days[hoveredDayIdx] ? (
                <>
                  <span>
                    📅 <strong style={{ color: 'var(--text-main)' }}>{last14Days[hoveredDayIdx].dayName} ({last14Days[hoveredDayIdx].dateStr})</strong>
                  </span>
                  <span>
                    ⏱️ المذاكرة: <strong className="tabular" style={{ color: 'var(--accent-primary)' }}>{last14Days[hoveredDayIdx].hours} ساعة</strong> ({last14Days[hoveredDayIdx].sessionsCount} جلسات)
                  </span>
                  <span>
                    📉 مؤشر المراكمة في هذا اليوم: <strong className="tabular" style={{ color: '#ef4444' }}>{last14Days[hoveredDayIdx].backlogPct}%</strong>
                  </span>
                </>
              ) : (
                <span>حرّك المؤشر فوق أي يوم لمعاينة الساعات ونسبة المراكمة التفصيلية لهذا اليوم.</span>
              )}
            </div>
          </div>
        )}

        {/* SVG CHART 2: PAST 8 WEEKS + ARCHIVED WEEKS COMPARISON */}
        {trendRangeTab === 'weeks' && (
          <div>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg viewBox="0 0 840 245" style={{ width: '100%', minWidth: 620, height: 'auto', display: 'block' }}>
                {[0, 25, 50, 75, 100].map((pct) => {
                  const y = 190 - (pct / 100) * 155;
                  return (
                    <g key={pct}>
                      <line x1={40} y1={y} x2={810} y2={y} stroke="rgba(148,163,184,0.14)" strokeDasharray="3 4" />
                      <text x={32} y={y + 4} textAnchor="end" fontSize="10" fill="rgba(148,163,184,0.75)">
                        {pct}%
                      </text>
                    </g>
                  );
                })}

                {/* Weekly Backlog Line */}
                <polyline
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  points={chronologicalWeeks
                    .map((w, i) => {
                      const x = 95 + i * 96;
                      const y = 190 - (w.weekBacklogPct / 100) * 155;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />

                {chronologicalWeeks.map((w, i) => {
                  const xCenter = 95 + i * 96;
                  const barW = 36;
                  const barH = Math.max(5, (w.totalHoursNum / max8WeekHours) * 150);
                  const barY = 190 - barH;
                  const lineY = 190 - (w.weekBacklogPct / 100) * 155;
                  const isHov = hoveredWeekIdx === i;

                  return (
                    <g
                      key={w.weekKey}
                      onMouseEnter={() => setHoveredWeekIdx(i)}
                      onMouseLeave={() => setHoveredWeekIdx(null)}
                      onClick={() => setSelectedWeekIndex(w.index)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={xCenter - barW / 2}
                        y={barY}
                        width={barW}
                        height={barH}
                        rx={6}
                        fill={w.index === 0 ? '#10b981' : '#38bdf8'}
                        opacity={isHov ? 1 : 0.85}
                      />
                      <text x={xCenter} y={barY - 6} textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#e2e8f0">
                        {w.totalHours}h
                      </text>
                      <circle cx={xCenter} cy={lineY} r={isHov ? 6 : 4.2} fill="#ef4444" stroke="#0f172a" strokeWidth="1.5" />
                      <text x={xCenter} y={208} textAnchor="middle" fontSize="11" fontWeight="700" fill={w.index === 0 ? '#10b981' : '#cbd5e1'}>
                        {w.shortLabel}
                      </text>
                      <text x={xCenter} y={224} textAnchor="middle" fontSize="9.5" fill="#64748b">
                        {w.archivedSummary ? `أرشيف ${w.archivedSummary.completedCount}/${w.archivedSummary.totalCount}` : w.dateRangeStr}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div style={{ marginTop: 10, padding: '8px 14px', borderRadius: 8, background: 'var(--bg-elevated)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              {hoveredWeekIdx !== null && chronologicalWeeks[hoveredWeekIdx] ? (
                <>
                  <span>📆 <strong>{chronologicalWeeks[hoveredWeekIdx].label}</strong> ({chronologicalWeeks[hoveredWeekIdx].dateRangeStr})</span>
                  <span>⏱️ إجمالي الساعات: <strong className="tabular" style={{ color: 'var(--accent-primary)' }}>{chronologicalWeeks[hoveredWeekIdx].totalHours}h</strong> (هدف 35h)</span>
                  <span>📉 نسبة المراكمة/العجز: <strong className="tabular" style={{ color: '#ef4444' }}>{chronologicalWeeks[hoveredWeekIdx].weekBacklogPct}%</strong></span>
                </>
              ) : (
                <span>اضغط على أي أسبوع في الرسم لعرض تفاصيل أيامه السبعة أدناه.</span>
              )}
            </div>
          </div>
        )}

        {/* SVG CHART 3: PREVIOUS MONTHS (MONTHLY HOURS + EXAM AVG + BACKLOG %) */}
        {trendRangeTab === 'months' && (
          <div>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg viewBox="0 0 840 245" style={{ width: '100%', minWidth: 560, height: 'auto', display: 'block' }}>
                {[0, 25, 50, 75, 100].map((pct) => {
                  const y = 190 - (pct / 100) * 155;
                  return (
                    <g key={pct}>
                      <line x1={40} y1={y} x2={810} y2={y} stroke="rgba(148,163,184,0.14)" strokeDasharray="3 4" />
                      <text x={32} y={y + 4} textAnchor="end" fontSize="10" fill="rgba(148,163,184,0.75)">
                        {pct}%
                      </text>
                    </g>
                  );
                })}

                <polyline
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  points={monthlyStats
                    .map((m, i) => {
                      const step = Math.floor(720 / Math.max(1, monthlyStats.length));
                      const x = 95 + i * step;
                      const y = 190 - (m.backlogRate / 100) * 155;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />

                {monthlyStats.map((m, i) => {
                  const step = Math.floor(720 / Math.max(1, monthlyStats.length));
                  const xCenter = 95 + i * step;
                  const hoursH = Math.max(5, (m.hours / maxMonthHours) * 150);
                  const examH = m.avgExam !== null ? Math.max(5, (m.avgExam / 100) * 150) : 0;
                  const lineY = 190 - (m.backlogRate / 100) * 155;

                  return (
                    <g key={m.key}>
                      <rect x={xCenter - 28} y={190 - hoursH} width={24} height={hoursH} rx={5} fill="#10b981" opacity={0.9} />
                      <text x={xCenter - 16} y={190 - hoursH - 5} textAnchor="middle" fontSize="10" fontWeight="800" fill="#10b981">
                        {m.hours}h
                      </text>

                      {m.avgExam !== null && (
                        <>
                          <rect x={xCenter + 4} y={190 - examH} width={24} height={examH} rx={5} fill="#38bdf8" opacity={0.88} />
                          <text x={xCenter + 16} y={190 - examH - 5} textAnchor="middle" fontSize="10" fontWeight="800" fill="#38bdf8">
                            {m.avgExam}%
                          </text>
                        </>
                      )}

                      <circle cx={xCenter} cy={lineY} r={4.5} fill="#ef4444" stroke="#0f172a" strokeWidth="1.5" />
                      <text x={xCenter} y={208} textAnchor="middle" fontSize="11" fontWeight="700" fill="#e2e8f0">
                        {m.label}
                      </text>
                      <text x={xCenter} y={224} textAnchor="middle" fontSize="9.5" fill="#94a3b8">
                        مراكمة {m.backlogRate}% · {m.sessionsCount} جلسة
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* 0.75 SUBJECT & ARABIC DUAL-TRACK BACKLOG RINGS */}
      <div className="card" style={{ padding: '20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieChart size={18} style={{ color: 'var(--accent-secondary)' }} />
            <span>خريطة الساعات والمراكمة لكل مادة ومسار (مسارا العربي منفصلان)</span>
          </h4>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
            توضح نسبة الإنجاز مقابل المتراكم لكل مسار تعليمي
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
          {trackRings.map((tr) => {
            const radius = 26;
            const circ = 2 * Math.PI * radius;
            const offset = circ - (circ * tr.donePct) / 100;

            return (
              <div
                key={tr.id}
                style={{
                  background: 'var(--bg-elevated)',
                  padding: '14px',
                  borderRadius: 12,
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="64" height="64" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(239, 68, 68, 0.25)" strokeWidth="6" />
                    <circle
                      cx="32"
                      cy="32"
                      r={radius}
                      fill="none"
                      stroke={tr.color}
                      strokeWidth="6"
                      strokeDasharray={circ}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      transform="rotate(-90 32 32)"
                    />
                  </svg>
                  <span className="tabular" style={{ position: 'absolute', fontSize: 12, fontWeight: 900, color: 'var(--text-main)' }}>
                    {tr.donePct}%
                  </span>
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: tr.color, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tr.shortLabel}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    منجز <strong className="tabular" style={{ color: 'var(--text-main)' }}>{tr.done}</strong> / متراكم{' '}
                    <strong className="tabular" style={{ color: tr.pending > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      {tr.pending}
                    </strong>{' '}
                    ({tr.backlogPct}%)
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                    ساعات المادة: <strong className="tabular" style={{ color: 'var(--accent-primary)' }}>{tr.subjHours}h</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 1. TOP WEEK SELECTOR TABS */}
      <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)' }}>
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                مستكشف ومقارنة الأسابيع الماضية
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                تتبع ساعاتك اليومية ونسبة إنجازك لكل أسبوع على حدة لمعرفة أين ذهب وقتك بدقة
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', padding: 4, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <button
              className="btn btn-sm"
              disabled={selectedWeekIndex >= weeksData.length - 1}
              onClick={() => setSelectedWeekIndex((prev) => Math.min(prev + 1, weeksData.length - 1))}
              style={{ padding: '6px 10px', minWidth: 32 }}
              title="الأسبوع الأقدم"
            >
              <ChevronRight size={16} />
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '0 8px', color: 'var(--text-main)', minWidth: 100, textAlign: 'center' }}>
              {activeWeek.label}
            </span>
            <button
              className="btn btn-sm"
              disabled={selectedWeekIndex <= 0}
              onClick={() => setSelectedWeekIndex((prev) => Math.max(prev - 1, 0))}
              style={{ padding: '6px 10px', minWidth: 32 }}
              title="الأسبوع الأحدث"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>

        {/* Week Pills Bar */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
          {weeksData.map((w) => {
            const isSelected = w.index === selectedWeekIndex;
            return (
              <button
                key={w.index}
                onClick={() => setSelectedWeekIndex(w.index)}
                style={{
                  flex: '1 0 auto',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-elevated)',
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textAlign: 'right',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 800 }}>{w.label}</span>
                  <span className="tabular" style={{ fontSize: 11, fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                    {w.totalHours}h
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.8 }}>
                  {w.dateRangeStr} • {w.activeDays}/7 أيام
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ACTIVE WEEK KEY METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div className="card" style={{ padding: '16px 18px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>إجمالي ساعات الأسبوع</span>
            <Clock size={16} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="tabular" style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent-primary)' }}>
              {activeWeek.totalHours}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>من 35.0 ساعة هدف</span>
          </div>
          <div className="stat-progress-bar" style={{ marginTop: 10, height: 6 }}>
            <div
              className="stat-progress-fill"
              style={{
                width: `${activeWeek.pctOfTarget}%`,
                background: activeWeek.pctOfTarget >= 90 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, var(--accent-secondary), var(--accent-primary))'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>إنجاز الهدف: {activeWeek.pctOfTarget}%</span>
            {diffHours && Number(diffHours) !== 0 && (
              <span style={{ color: Number(diffHours) > 0 ? '#10b981' : 'var(--danger)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                {Number(diffHours) > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{Number(diffHours) > 0 ? `+${diffHours}` : diffHours}h عن السابق</span>
              </span>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>المعدل اليومي وأيام الالتزام</span>
            <Activity size={16} style={{ color: 'var(--accent-secondary)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="tabular" style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-main)' }}>
              {(Number(activeWeek.totalHours) / 7).toFixed(1)}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>ساعة / يوم</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Flame size={14} style={{ color: 'var(--warning)' }} />
            <span>ذاكرت في <strong>{activeWeek.activeDays}</strong> من 7 أيام هذا الأسبوع</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            يوم الذروة: <strong>{activeWeek.peakDay?.name || 'السبت'}</strong> ({(activeWeek.peakDay?.minutes / 60 || 0).toFixed(1)}h)
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>جلسات وامتحانات الأسبوع</span>
            <Award size={16} style={{ color: '#a78bfa' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="tabular" style={{ fontSize: 28, fontWeight: 900, color: '#a78bfa' }}>
              {activeWeek.weekSessionsCount}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>جلسة تركيز مسجلة</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
            {activeWeek.examsCount > 0 ? (
              <span style={{ color: '#10b981', fontWeight: 700 }}>
                🏆 تم اجتياز {activeWeek.examsCount} امتحانات بمتوسط {activeWeek.examsAvg}%
              </span>
            ) : (
              <span>لا توجد امتحانات مسجلة في هذا الأسبوع</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE DAILY BAR CHART (7 DAYS: SAT TO FRI) */}
      <div className="card" style={{ padding: '20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>مخطط ساعات الأيام السبعة ({activeWeek.label}: {activeWeek.dateRangeStr})</span>
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              الخط المنقط يمثل الهدف اليومي (5 ساعات يومياً لتأكيد التفوق في علمي علوم)
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: '#10b981' }} />
              <span>5h+ متفوق</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent-secondary)' }} />
              <span>3h - 5h جيد</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--warning)' }} />
              <span>1h - 3h حرج</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--danger)' }} />
              <span>صفر انقطاع</span>
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 12,
            alignItems: 'flex-end',
            minHeight: 220,
            paddingTop: 30,
            borderBottom: '2px solid var(--border-subtle)',
            position: 'relative'
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: `${Math.min(Math.round((300 / maxDayMinutes) * 100), 92)}%`,
              borderTop: '2px dashed rgba(245, 158, 11, 0.6)',
              zIndex: 1,
              pointerEvents: 'none'
            }}
          >
            <span
              style={{
                position: 'absolute',
                right: 4,
                top: -18,
                fontSize: 10,
                color: 'var(--warning)',
                fontWeight: 700,
                background: 'var(--bg-elevated)',
                padding: '1px 6px',
                borderRadius: 4
              }}
            >
              الهدف اليومي 5h
            </span>
          </div>

          {activeWeek.days.map((day) => {
            const dayHours = (day.minutes / 60).toFixed(1);
            const heightPct = Math.min(Math.round((day.minutes / maxDayMinutes) * 100), 100);

            let barColor = 'rgba(239, 83, 80, 0.35)';
            if (day.minutes >= 300) barColor = 'linear-gradient(180deg, #10b981 0%, #059669 100%)';
            else if (day.minutes >= 180) barColor = 'linear-gradient(180deg, var(--accent-secondary) 0%, var(--accent-primary) 100%)';
            else if (day.minutes > 0) barColor = 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)';

            return (
              <div
                key={day.idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  position: 'relative',
                  zIndex: 2
                }}
              >
                <span
                  className="tabular"
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    marginBottom: 6,
                    color: day.minutes > 0 ? 'var(--text-main)' : 'var(--text-muted)'
                  }}
                >
                  {day.minutes > 0 ? `${dayHours}h` : '0h'}
                </span>

                <div
                  style={{
                    width: '100%',
                    maxWidth: 44,
                    height: `${Math.max(heightPct, 6)}%`,
                    background: barColor,
                    borderRadius: '8px 8px 3px 3px',
                    transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: day.minutes >= 300 ? '0 0 14px rgba(16, 185, 129, 0.4)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    overflow: 'hidden'
                  }}
                  title={`${day.name} (${day.dateStr}): ${dayHours} ساعة`}
                />
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, marginTop: 10, textAlign: 'center' }}>
          {activeWeek.days.map((day) => (
            <div key={day.idx}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>{day.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{day.dateStr}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. SUBJECTS BREAKDOWN IN ACTIVE WEEK */}
      <div className="card" style={{ padding: '20px', background: 'var(--bg-surface)' }}>
        <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={18} style={{ color: 'var(--accent-secondary)' }} />
          <span>توزيع ساعات المواد الأربعة في هذا الأسبوع ({activeWeek.label})</span>
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {subjects.map((subj) => {
            const subjMins = activeWeek.subjTotals[subj.id] || 0;
            const subjHours = (subjMins / 60).toFixed(1);
            const totalWeekMins = activeWeek.totalMinutes || 1;
            const pctOfTotal = Math.round((subjMins / totalWeekMins) * 100);

            return (
              <div
                key={subj.id}
                style={{
                  background: 'var(--bg-elevated)',
                  padding: '14px',
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: subj.color }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>{subj.name}</span>
                  </div>
                  <span className="tabular" style={{ fontSize: 14, fontWeight: 900, color: subj.color }}>
                    {subjHours}h ({pctOfTotal}%)
                  </span>
                </div>
                <div className="stat-progress-bar" style={{ height: 5 }}>
                  <div className="stat-progress-fill" style={{ width: `${pctOfTotal}%`, background: subj.color }} />
                </div>
                {onStartFocus && (
                  <button
                    className="btn btn-sm"
                    onClick={() => onStartFocus(subj.id)}
                    style={{ fontSize: 11, padding: '4px 8px', alignSelf: 'flex-start', marginTop: 2 }}
                  >
                    بدء جلسة مذاكرة في {subj.name} ⚡
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. VISUAL SECTION: MEDICAL ADMISSION INDEX & 35-DAY HEATMAP & 24H CIRCADIAN RHYTHM */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: '20px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Compass size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>مؤشر الجاهزية لكلية الطب البشري</span>
            </h4>
            <span style={{ fontSize: 11, color: medicalIndex.statusColor, fontWeight: 800, background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 6 }}>
              {medicalIndex.statusText}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
            <div style={{ position: 'relative', width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="150" height="150" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={medicalIndex.statusColor}
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * medicalIndex.score) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <span className="tabular" style={{ fontSize: 32, fontWeight: 900, color: medicalIndex.statusColor }}>
                  {medicalIndex.score}%
                </span>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>مؤشر القبول</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <div style={{ background: 'var(--bg-elevated)', padding: '8px 10px', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>دقة الامتحانات (95%)</div>
              <div className="tabular" style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                {medicalIndex.examScore}%
              </div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: '8px 10px', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>زخم الساعات الأسبوعي</div>
              <div className="tabular" style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                {medicalIndex.hoursScore}%
              </div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: '8px 10px', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>المحاضرات والمنصات</div>
              <div className="tabular" style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                {medicalIndex.lecScore}%
              </div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: '8px 10px', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>إنجاز المهام والشيتات</div>
              <div className="tabular" style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                {medicalIndex.taskScore}%
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} style={{ color: '#10b981' }} />
              <span>مصفوفة الاستمرارية (آخر 35 يوماً)</span>
            </h4>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              توهج اللون = ساعات أكثر
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 6,
              padding: '8px 0'
            }}
          >
            {heatmapCells.map((c, i) => {
              let bg = 'rgba(255, 255, 255, 0.04)';
              let border = '1px solid var(--border-subtle)';
              if (c.level === 1) bg = 'rgba(16, 185, 129, 0.25)';
              else if (c.level === 2) bg = 'rgba(16, 185, 129, 0.45)';
              else if (c.level === 3) bg = 'rgba(16, 185, 129, 0.70)';
              else if (c.level === 4) {
                bg = '#10b981';
                border = '1px solid #34d399';
              }

              return (
                <div
                  key={i}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 6,
                    background: bg,
                    border: c.isToday ? '2px solid var(--accent-primary)' : border,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    color: c.level >= 3 ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 700,
                    cursor: 'default',
                    transition: 'transform 0.15s ease'
                  }}
                  title={`${c.dayName} ${c.dateStr}: ${c.hours}h`}
                >
                  <span>{c.dateStr}</span>
                  {c.minutes > 0 && <span style={{ fontSize: 8 }}>{c.hours}h</span>}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>أقل كثافة</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }} />
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(16, 185, 129, 0.25)' }} />
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(16, 185, 129, 0.45)' }} />
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(16, 185, 129, 0.70)' }} />
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981' }} />
            </div>
            <span>أعلى كثافة (6h+)</span>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} style={{ color: 'var(--warning)' }} />
              <span>إيقاع إنتاجيتك على مدار 24 ساعة</span>
            </h4>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              أين تقع ساعاتك الذهبية؟
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {circadianRhythm.map((seg) => (
              <div key={seg.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-main)', fontWeight: 700 }}>
                    <span>{seg.icon}</span>
                    <span>{seg.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({seg.time})</span>
                  </span>
                  <span className="tabular" style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {seg.hours}h ({seg.pct}%)
                  </span>
                </div>
                <div className="stat-progress-bar" style={{ height: 6 }}>
                  <div
                    className="stat-progress-fill"
                    style={{
                      width: `${seg.pct}%`,
                      background: 'linear-gradient(90deg, var(--accent-secondary), var(--accent-primary))'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
