import React, { useState, useMemo } from 'react';
import { Session, Subject, ExamRecord, WeeklyTask, Lecture } from '../types';
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  Clock,
  TrendingUp,
  TrendingDown,
  Award,
  Sparkles,
  Flame,
  CheckCircle2,
  BookOpen,
  Target,
  BarChart3,
  Compass,
  Activity,
  Layers,
  Zap,
  Info
} from 'lucide-react';

interface PastWeeksAnalyticsProps {
  sessions: Session[];
  subjects: Subject[];
  exams?: ExamRecord[];
  weeklyTasks?: WeeklyTask[];
  completedTaskIds?: Set<string | number>;
  lectures?: Lecture[];
  onStartFocus?: (subjId: string) => void;
}

export const PastWeeksAnalytics: React.FC<PastWeeksAnalyticsProps> = ({
  sessions,
  subjects,
  exams = [],
  weeklyTasks = [],
  completedTaskIds = new Set(),
  lectures = [],
  onStartFocus
}) => {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0); // 0 = current week, 1 = last week, etc.

  // Academic week starts Saturday (0=Sun, 6=Sat)
  const now = useMemo(() => new Date(), []);

  // Compute weeks info (past 6 weeks)
  const weeksData = useMemo(() => {
    const list = [];
    const currentDayOfWeek = now.getDay();
    const diffToSaturday = (currentDayOfWeek + 1) % 7;
    const currentWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToSaturday, 0, 0, 0, 0).getTime();

    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    for (let w = 0; w < 6; w++) {
      const startTs = currentWeekStart - w * ONE_WEEK_MS;
      const endTs = startTs + ONE_WEEK_MS;
      const startDate = new Date(startTs);
      const endDate = new Date(endTs - 1000);

      const label = w === 0 ? 'الأسبوع الحالي' : w === 1 ? 'الأسبوع الماضي' : `منذ ${w} أسابيع`;
      const dateRangeStr = `${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}`;

      // Initialize 7 days (Saturday to Friday)
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

          // Find which day
          const dayIdx = Math.floor((ts - startTs) / ONE_DAY_MS);
          if (dayIdx >= 0 && dayIdx < 7) {
            days[dayIdx].minutes += m;
            days[dayIdx].sessionsCount += 1;

            // Subject breakdown
            const primarySubj = s.entries?.[0]?.subj || subjects[0]?.id || 'physics';
            days[dayIdx].subjMinutes[primarySubj] = (days[dayIdx].subjMinutes[primarySubj] || 0) + m;
            subjTotals[primarySubj] = (subjTotals[primarySubj] || 0) + m;
          }
        }
      });

      // Active days count
      const activeDays = days.filter((d) => d.minutes > 0).length;
      const peakDay = [...days].sort((a, b) => b.minutes - a.minutes)[0];

      // Weekly tasks in this week
      const weekExams = exams.filter((e) => {
        const d = e.date ? new Date(e.date).getTime() : 0;
        return d >= startTs && d < endTs;
      });

      list.push({
        index: w,
        label,
        dateRangeStr,
        startTs,
        endTs,
        totalMinutes,
        totalHours: (totalMinutes / 60).toFixed(1),
        targetMinutes: 2100, // 35 hours weekly target
        pctOfTarget: Math.min(Math.round((totalMinutes / 2100) * 100), 100),
        days,
        activeDays,
        weekSessionsCount,
        peakDay,
        subjTotals,
        examsCount: weekExams.length,
        examsAvg: weekExams.length > 0 ? Math.round(weekExams.reduce((a, b) => a + (b.pct || Math.round((b.score / b.total) * 100)), 0) / weekExams.length) : null
      });
    }

    return list;
  }, [sessions, subjects, exams, now]);

  const activeWeek = weeksData[selectedWeekIndex] || weeksData[0];
  const prevWeek = weeksData[selectedWeekIndex + 1];

  // Difference vs previous week
  const diffHours = prevWeek
    ? (Number(activeWeek.totalHours) - Number(prevWeek.totalHours)).toFixed(1)
    : null;

  // 35-Day Heatmap calculation
  const heatmapCells = useMemo(() => {
    const cells = [];
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    // 35 days (5 weeks)
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
      // Intensity 0 to 4
      let level = 0;
      if (dayMins >= 360) level = 4; // 6h+
      else if (dayMins >= 240) level = 3; // 4h+
      else if (dayMins >= 120) level = 2; // 2h+
      else if (dayMins > 0) level = 1; // >0

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
    // 1. Exam score (Weight 35%)
    let examScore = 70;
    if (exams.length > 0) {
      const avg = exams.reduce((a, b) => a + (b.pct || Math.round((b.score / b.total) * 100)), 0) / exams.length;
      examScore = Math.min(Math.round((avg / 95) * 100), 100);
    }

    // 2. Weekly study momentum (Weight 30%)
    const curWeekMins = weeksData[0]?.totalMinutes || 0;
    const hoursScore = Math.min(Math.round((curWeekMins / 1800) * 100), 100); // 30h target for 100%

    // 3. Lecture completion (Weight 20%)
    const doneLecs = lectures.filter((l) => l.isDone).length;
    const totalLecs = lectures.length || 1;
    const lecScore = Math.round((doneLecs / totalLecs) * 100);

    // 4. Tasks completion (Weight 15%)
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

  // Find max day minutes in active week for chart scaling (min 6h scale)
  const maxDayMinutes = Math.max(...activeWeek.days.map((d) => d.minutes), 360);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
        {/* Total Hours Card */}
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

        {/* Daily Average & Active Days */}
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

        {/* Sessions & Exams in this Week */}
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

        {/* 7-DAY BAR CHART CONTAINER */}
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
          {/* Target Reference Line at 5 hours (300 mins) */}
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

            let barColor = 'rgba(239, 83, 80, 0.35)'; // Red for 0
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
                {/* Hours label on top of bar */}
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

                {/* Animated bar fill */}
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

        {/* Days Names & Dates row */}
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
        {/* A. MEDICAL ADMISSION READINESS GAUGE */}
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

          {/* Sub-scores */}
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

        {/* B. 35-DAY CONSISTENCY HEATMAP */}
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

        {/* C. 24-HOUR CIRCADIAN PRODUCTIVITY RHYTHM */}
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
