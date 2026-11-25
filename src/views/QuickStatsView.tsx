import React, { useMemo } from 'react';
import { Subject, Session, Lecture, WeeklyTask, OfficialExam } from '../types';
import {
  computeBacklogHoursSummary,
  computeStudyStreakStats,
  diffDaysYmd,
  formatYmdShort,
  getLectureTotalMinutes,
  toLocalYmd
} from '../utils/scheduleEngine';
import { Clock, Flame, Layers, Calendar, Lock, LayoutDashboard } from 'lucide-react';

interface QuickStatsViewProps {
  sessions: Session[];
  subjects: Subject[];
  lectures: Lecture[];
  weeklyTasks: WeeklyTask[];
  completedTaskIds: Set<string | number>;
  officialExams: OfficialExam[];
  onNavigateFullApp?: () => void;
}

export const QuickStatsView: React.FC<QuickStatsViewProps> = ({
  sessions,
  subjects,
  lectures,
  weeklyTasks,
  completedTaskIds,
  officialExams,
  onNavigateFullApp
}) => {
  const todayYmd = toLocalYmd();

  const streakStats = useMemo(() => computeStudyStreakStats(sessions), [sessions]);
  const backlogSummary = useMemo(
    () => computeBacklogHoursSummary(lectures, weeklyTasks, completedTaskIds),
    [lectures, weeklyTasks, completedTaskIds]
  );

  const todayGoalMinutes = 360; // 6 hours baseline daily target
  const todayProgressPct = Math.min(100, Math.round((streakStats.todayMinutes / todayGoalMinutes) * 100));

  const subjectRows = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startTs = startOfToday.getTime();

    return subjects.map((subj) => {
      let todayMins = 0;
      let totalMins = 0;

      sessions.forEach((s) => {
        const primary = s.entries?.[0]?.subj;
        if (primary !== subj.id) return;
        const m = s.minutes || 0;
        totalMins += m;
        const ts = s.tsStart || (s.date ? new Date(s.date).getTime() : 0);
        if (ts >= startTs) todayMins += m;
      });

      const pendingLecs = lectures.filter((l) => l.subjId === subj.id && !l.isDone);
      let subjBacklogMins = 0;
      let pendingPlatformCount = 0;
      let pendingPages = 0;
      let pendingQuestions = 0;
      pendingLecs.forEach((lec) => {
        const meta = getLectureTotalMinutes(lec);
        if (meta.isPlatform) {
          pendingPlatformCount += 1;
          subjBacklogMins += meta.lectureMins;
        }
        if (meta.hasHomework && !meta.homeworkDone && meta.homeworkAmount > 0) {
          if (meta.homeworkUnit === 'questions') pendingQuestions += meta.homeworkAmount;
          else pendingPages += meta.homeworkAmount;
        }
      });

      return {
        subj,
        todayHours: (todayMins / 60).toFixed(1),
        totalHours: (totalMins / 60).toFixed(1),
        pendingLecturesCount: pendingLecs.length,
        pendingPlatformCount,
        backlogHours: (subjBacklogMins / 60).toFixed(1),
        pendingPages,
        pendingQuestions
      };
    });
  }, [subjects, sessions, lectures]);

  const upcomingOfficialExams = useMemo(() => {
    return [...officialExams]
      .filter((ex) => diffDaysYmd(ex.date, todayYmd) >= 0)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [officialExams, todayYmd]);

  return (
    <section className="view-panel active">
      <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Compact Read-Only Header */}
        <div
          className="card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Lock size={15} style={{ color: 'var(--accent-primary)' }} />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                ملخص الإحصائيات السريع — قراءة فقط
              </h2>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              تاريخ اليوم: <span className="tabular" style={{ fontWeight: 700, color: 'var(--text-main)' }}>{todayYmd}</span>
              {' · '}
              رابط مباشر: <span className="tabular" style={{ color: 'var(--accent-secondary)' }}>?view=stats</span>
              {' · '}
              بدون نماذج تعديل
            </p>
          </div>

          {onNavigateFullApp && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={onNavigateFullApp}
              style={{ whiteSpace: 'nowrap', fontWeight: 700 }}
            >
              <LayoutDashboard size={14} />
              <span>فتح اللوحة الكاملة</span>
            </button>
          )}
        </div>

        {/* 3 Core Hero Metrics: Today Hours, Streak, Backlog Hours */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {/* 1. Today's Study Hours */}
          <div className="card" style={{ padding: '18px 20px', borderRight: '3px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)' }}>ساعات مذاكرة النهاردة</span>
              <Clock size={16} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="tabular" style={{ fontSize: 34, fontWeight: 900, color: 'var(--accent-primary)', lineHeight: 1.1 }}>
                {streakStats.todayHours}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 }}>ساعة</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              <span className="tabular">{streakStats.todayMinutes}</span> دقيقة ·{' '}
              <span className="tabular">{streakStats.todaySessionsCount}</span> جلسات · الهدف{' '}
              <span className="tabular">6.0</span> س
            </div>
            <div className="stat-progress-bar" style={{ marginTop: 10, height: 6 }}>
              <div className="stat-progress-fill" style={{ width: `${todayProgressPct}%`, background: 'var(--accent-primary)' }} />
            </div>
          </div>

          {/* 2. Study Streak */}
          <div className="card" style={{ padding: '18px 20px', borderRight: '3px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)' }}>السلسلة المتواصلة (أيام متتالية)</span>
              <Flame size={16} style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="tabular" style={{ fontSize: 34, fontWeight: 900, color: '#f59e0b', lineHeight: 1.1 }}>
                {streakStats.currentStreakDays}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 }}>يوم</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              أطول سلسلة: <strong className="tabular">{streakStats.longestStreakDays}</strong> يوم ·{' '}
              حالة اليوم:{' '}
              <strong style={{ color: streakStats.studiedToday ? '#10b981' : '#f59e0b' }}>
                {streakStats.studiedToday ? 'تم تسجيل جلسة' : 'لم يُسجل بعد'}
              </strong>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 8 }}>
              إجمالي الأيام النشطة: <span className="tabular">{streakStats.totalActiveDays}</span> يوم
            </div>
          </div>

          {/* 3. Total Platform Backlog in Hours + Homework Pages/Questions */}
          <div className="card" style={{ padding: '18px 20px', borderRight: '3px solid var(--danger)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)' }}>متراكم المنصات بالساعات</span>
              <Layers size={16} style={{ color: 'var(--danger)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="tabular" style={{ fontSize: 34, fontWeight: 900, color: 'var(--danger)', lineHeight: 1.1 }}>
                {backlogSummary.lecturesTotalHours}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 }}>ساعة منصة</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              منصات (صلاح وعبد المعبود): <strong className="tabular">{backlogSummary.pendingPlatformLecturesCount}</strong> · سناتر:{' '}
              <strong className="tabular">{backlogSummary.pendingCenterLecturesCount}</strong>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 8 }}>
              واجب متراكم: <span className="tabular">{backlogSummary.homeworkPagesTotal}</span> صفحة ·{' '}
              <span className="tabular">{backlogSummary.homeworkQuestionsTotal}</span> سؤال ·{' '}
              <span className="tabular">{backlogSummary.backlogTasksCount}</span> مهمة
            </div>
          </div>
        </div>

        {/* Read-only Subject Breakdown Table */}
        <div className="card" style={{ padding: '18px 20px', overflowX: 'auto' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', margin: '0 0 12px 0' }}>
            توزيع الساعات والمتراكم حسب المادة
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'right' }}>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>المادة</th>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>ساعات النهاردة</th>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>إجمالي الساعات</th>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>محاضرات / حصص متبقية</th>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>متراكم المنصة + الواجب</th>
              </tr>
            </thead>
            <tbody>
              {subjectRows.map((row) => (
                <tr key={row.subj.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px', fontWeight: 700, color: row.subj.color }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: row.subj.color }} />
                      {row.subj.name}
                    </span>
                  </td>
                  <td className="tabular" style={{ padding: '10px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {row.todayHours} س
                  </td>
                  <td className="tabular" style={{ padding: '10px', color: 'var(--text-muted)' }}>
                    {row.totalHours} س
                  </td>
                  <td className="tabular" style={{ padding: '10px', color: row.pendingLecturesCount > 0 ? 'var(--warning)' : 'var(--success)', fontWeight: 700 }}>
                    {row.pendingLecturesCount} متبقي
                  </td>
                  <td className="tabular" style={{ padding: '10px', fontWeight: 700, color: 'var(--danger)' }}>
                    {row.pendingPlatformCount > 0 ? `${row.backlogHours} س منصة` : 'سنتر (بدون وقت فيديو)'}
                    {(row.pendingPages > 0 || row.pendingQuestions > 0) && (
                      <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
                        {' · '}
                        {row.pendingPages > 0 ? `${row.pendingPages} ص` : ''}
                        {row.pendingPages > 0 && row.pendingQuestions > 0 ? ' + ' : ''}
                        {row.pendingQuestions > 0 ? `${row.pendingQuestions} سؤ` : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Read-only Official Exams Countdown */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Calendar size={16} style={{ color: '#a78bfa' }} />
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              امتحانات الجدول الرسمي القادمة ({upcomingOfficialExams.length})
            </h3>
          </div>

          {upcomingOfficialExams.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
              لا توجد امتحانات رسمية قادمة مضافة حالياً.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingOfficialExams.map((ex) => {
                const subj = subjects.find((s) => s.id === ex.subjId);
                const diff = diffDaysYmd(ex.date, todayYmd);
                const statusLabel =
                  diff === 0 ? 'النهاردة' : diff === 1 ? 'غداً · تنبيه ليلة الامتحان' : `بعد ${diff} يوم`;
                return (
                  <div
                    key={ex.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'var(--bg-elevated)',
                      border: `1px solid ${diff <= 1 ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'}`
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-main)' }}>
                        {ex.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                        <span style={{ color: subj?.color || 'var(--accent-primary)', fontWeight: 700 }}>
                          {subj?.name || ex.subjId}
                        </span>
                        {' · '}
                        <span className="tabular">{ex.date} ({formatYmdShort(ex.date)})</span>
                        {' · '}
                        <span>{ex.period}</span>
                        {ex.syllabus ? ` · ${ex.syllabus}` : ''}
                      </div>
                    </div>
                    <span
                      className="tabular"
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: diff === 0 ? 'var(--danger)' : diff === 1 ? '#f59e0b' : 'var(--accent-secondary)'
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
