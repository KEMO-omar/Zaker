import React from 'react';
import { Subject, Session, Exemption, ExamRecord, WeeklyTask } from '../types';
import { Visualizer } from '../components/Visualizer';
import {
  Clock,
  Calendar,
  CalendarDays,
  Activity,
  Zap,
  Sliders,
  Volume2,
  Bot,
  Sparkles,
  AlertTriangle,
  Play,
  ArrowUpRight,
  CheckCircle2,
  Target,
  Flame,
  Trophy,
  TrendingUp,
  Plus,
  History
} from 'lucide-react';

interface DashboardViewProps {
  sessions: Session[];
  subjects: Subject[];
  exemptions: Exemption[];
  exams: ExamRecord[];
  weeklyTasks: WeeklyTask[];
  completedTaskIds: Set<string | number>;
  customAiInstructions: string;
  onSaveCustomInstructions: (text: string) => void;
  onStartFocus: (subjId: string) => void;
  onOpenAiSchedule: () => void;
  onOpenInterrogation: () => void;
  onOpenEditSubjects: () => void;
  onTriggerAudit: () => void;
  onSpeakAi: () => void;
  onNavigateToView: (view: any) => void;
  onOpenManualSession?: () => void;
  aiMood: {
    avatar: string;
    label: string;
    score: number;
    reason: string;
    speech: string;
  };
  vizMode: 'spiral' | 'gauge' | 'bars';
  onVizModeChange: (mode: 'spiral' | 'gauge' | 'bars') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sessions,
  subjects,
  exemptions,
  exams,
  weeklyTasks,
  completedTaskIds,
  customAiInstructions,
  onSaveCustomInstructions,
  onStartFocus,
  onOpenAiSchedule,
  onOpenInterrogation,
  onOpenEditSubjects,
  onTriggerAudit,
  onSpeakAi,
  onNavigateToView,
  onOpenManualSession,
  aiMood,
  vizMode,
  onVizModeChange
}) => {
  const [directivesText, setDirectivesText] = React.useState(customAiInstructions);
  const [saveStatus, setSaveStatus] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDirectivesText(customAiInstructions);
  }, [customAiInstructions]);

  // Calculate Time Spans
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  // Egyptian academic week starts on Saturday (0=Sun, 6=Sat)
  const currentDayOfWeek = now.getDay();
  const diffToSaturday = (currentDayOfWeek + 1) % 7;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToSaturday).getTime();

  let todayMins = 0;
  let todaySessionsCount = 0;
  let weekMins = 0;
  let weekSessionsCount = 0;
  let monthMins = 0;
  let monthSessionsCount = 0;
  let allTimeMins = 0;

  // 7-day schedule array
  const weekDays = [
    { id: 'sat', name: 'السبت', short: 'سبت', offset: 0, mins: 0 },
    { id: 'sun', name: 'الأحد', short: 'أحد', offset: 1, mins: 0 },
    { id: 'mon', name: 'الإثنين', short: 'إثنين', offset: 2, mins: 0 },
    { id: 'tue', name: 'الثلاثاء', short: 'ثلاثاء', offset: 3, mins: 0 },
    { id: 'wed', name: 'الأربعاء', short: 'أربعاء', offset: 4, mins: 0 },
    { id: 'thu', name: 'الخميس', short: 'خميس', offset: 5, mins: 0 },
    { id: 'fri', name: 'الجمعة', short: 'جمعة', offset: 6, mins: 0 },
  ];

  const activeDaysSet = new Set<string>();

  sessions.forEach((s) => {
    const ts = s.tsStart || (s.date ? new Date(s.date).getTime() : 0);
    const m = s.minutes || 0;
    allTimeMins += m;

    if (ts > 0) {
      const d = new Date(ts);
      activeDaysSet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }

    if (ts >= startOfToday) {
      todayMins += m;
      todaySessionsCount += 1;
    }
    if (ts >= startOfWeek) {
      weekMins += m;
      weekSessionsCount += 1;
    }
    if (ts >= startOfMonth) {
      monthMins += m;
      monthSessionsCount += 1;
    }

    // Map into weekly 7-day breakdown
    if (ts >= startOfWeek && ts < startOfWeek + 7 * 24 * 60 * 60 * 1000) {
      const dayIdx = Math.floor((ts - startOfWeek) / (24 * 60 * 60 * 1000));
      if (dayIdx >= 0 && dayIdx < 7) {
        weekDays[dayIdx].mins += m;
      }
    }
  });

  const todayHours = (todayMins / 60).toFixed(1);
  const todayPct = Math.min(Math.round((todayMins / 360) * 100), 100);

  const weekHours = (weekMins / 60).toFixed(1);
  const weekPct = Math.min(Math.round((weekMins / 2100) * 100), 100);

  const monthHours = (monthMins / 60).toFixed(1);
  const monthTarget = 150;
  const monthPct = Math.min(Math.round((monthMins / (monthTarget * 60)) * 100), 100);
  const daysPassedInMonth = Math.max(now.getDate(), 1);
  const monthDailyAvgHours = ((monthMins / daysPassedInMonth) / 60).toFixed(1);

  const allTimeHours = (allTimeMins / 60).toFixed(1);
  const totalSessionsCount = sessions.length;
  const totalActiveDays = activeDaysSet.size || (sessions.length > 0 ? 1 : 0);
  const avgSessionMins = totalSessionsCount > 0 ? Math.round(allTimeMins / totalSessionsCount) : 0;

  // Earliest session
  const sortedAsc = [...sessions].filter(s => s.tsStart || s.date).sort((a, b) => (a.tsStart || 0) - (b.tsStart || 0));
  const earliestTs = sortedAsc[0]?.tsStart || (sortedAsc[0]?.date ? new Date(sortedAsc[0].date).getTime() : Date.now());
  const firstSessionDateFormatted = new Date(earliestTs).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });

  // Wasted time calculations for today
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const sleepMins = 420; // 7h sleep
  const elapsedAwakeMins = Math.max(minutesSinceMidnight - (now.getHours() < 7 ? 0 : sleepMins), 0);

  let todayExemptionMins = 0;
  exemptions.forEach((ex) => {
    if (ex.timestamp >= startOfToday) {
      todayExemptionMins += ex.minutes || 0;
    }
  });

  const wastedMins = Math.max(Math.round(elapsedAwakeMins - todayMins - todayExemptionMins), 0);
  const wastedHours = (wastedMins / 60).toFixed(1);
  const wastedPct = elapsedAwakeMins > 0 ? Math.min(Math.round((wastedMins / elapsedAwakeMins) * 100), 100) : 0;

  // Exam averages
  const examPcts = exams.map((e) => e.pct || Math.round((e.score / e.total) * 100));
  const avgExamPct = examPcts.length > 0 ? Math.round(examPcts.reduce((a, b) => a + b, 0) / examPcts.length) : 0;

  // Productivity Score
  const productivityScore = Math.min(
    Math.round((todayMins / 360) * 50 + (avgExamPct / 100) * 35 + (1 - wastedMins / (elapsedAwakeMins || 1)) * 15),
    100
  );

  // Identify most needed subject
  const subjTimes: Record<string, number> = {};
  subjects.forEach((s) => { subjTimes[s.id] = 0; });
  sessions.forEach((s) => {
    if (s.entries) {
      s.entries.forEach((e) => {
        if (e.subj && subjTimes[e.subj] !== undefined) {
          subjTimes[e.subj] += s.minutes / s.entries.length;
        }
      });
    } else if (s.subjId && subjTimes[s.subjId] !== undefined) {
      subjTimes[s.subjId] += s.minutes;
    }
  });

  let minRatio = Infinity;
  let prioritySubjName = 'فيزياء';
  let prioritySubjId = 'physics';
  subjects.forEach((s) => {
    const ratio = (subjTimes[s.id] || 0) / (s.targetMinutes || 120);
    if (ratio < minRatio) {
      minRatio = ratio;
      prioritySubjName = s.name;
      prioritySubjId = s.id;
    }
  });

  const handleSaveDirectives = () => {
    onSaveCustomInstructions(directivesText);
    setSaveStatus('تم حفظ تعليماتك بنجاح!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <section className="view-panel active">
      {/* 4 Core Counters Grid + Quick Action */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {/* 1. Today Counter */}
        <div className="stat-metric-card" style={{ borderTop: '3px solid var(--accent-primary)' }}>
          <div className="stat-metric-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={15} style={{ color: 'var(--accent-primary)' }} />
              <strong style={{ color: 'var(--text-main)', fontSize: 13 }}>طاقة وإنجاز اليوم</strong>
            </span>
            <span className="tabular" style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>{todayPct}%</span>
          </div>
          <div className="stat-metric-num tabular" style={{ color: 'var(--accent-primary)', fontSize: 30 }}>{todayHours}h</div>
          <div className="stat-metric-sub" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>الهدف اليومي: <strong className="tabular">6 ساعات</strong></span>
            <span className="tabular" style={{ color: 'var(--text-muted)' }}>{todaySessionsCount} جلسات</span>
          </div>
          <div className="stat-progress-bar">
            <div className="stat-progress-fill" style={{ width: `${todayPct}%`, background: 'var(--accent-primary)' }} />
          </div>
        </div>

        {/* 2. Full Week Counter */}
        <div className="stat-metric-card" style={{ borderTop: '3px solid var(--accent-secondary)' }}>
          <div className="stat-metric-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={15} style={{ color: 'var(--accent-secondary)' }} />
              <strong style={{ color: 'var(--text-main)', fontSize: 13 }}>عداد الأسبوع كله</strong>
            </span>
            <span className="tabular" style={{ color: 'var(--accent-secondary)', fontWeight: 800 }}>{weekPct}%</span>
          </div>
          <div className="stat-metric-num tabular" style={{ color: 'var(--accent-secondary)', fontSize: 30 }}>{weekHours}h</div>
          <div className="stat-metric-sub" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>الهدف الأسبوعي: <strong className="tabular">35 ساعة</strong></span>
            <span className="tabular" style={{ color: 'var(--text-muted)' }}>{weekSessionsCount} جلسات</span>
          </div>
          <div className="stat-progress-bar">
            <div className="stat-progress-fill" style={{ width: `${weekPct}%`, background: 'var(--accent-secondary)' }} />
          </div>
        </div>

        {/* 3. Full Month Counter */}
        <div className="stat-metric-card" style={{ borderTop: '3px solid #a78bfa' }}>
          <div className="stat-metric-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarDays size={15} style={{ color: '#a78bfa' }} />
              <strong style={{ color: 'var(--text-main)', fontSize: 13 }}>عداد الشهر كله</strong>
            </span>
            <span className="tabular" style={{ color: '#a78bfa', fontWeight: 800 }}>{monthPct}%</span>
          </div>
          <div className="stat-metric-num tabular" style={{ color: '#a78bfa', fontSize: 30 }}>{monthHours}h</div>
          <div className="stat-metric-sub" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>معدل اليوم: <strong className="tabular">{monthDailyAvgHours}h</strong></span>
            <span className="tabular" style={{ color: 'var(--text-muted)' }}>{monthSessionsCount} جلسة</span>
          </div>
          <div className="stat-progress-bar">
            <div className="stat-progress-fill" style={{ width: `${monthPct}%`, background: '#a78bfa' }} />
          </div>
        </div>

        {/* 4. All-Time Cumulative Counter */}
        <div className="stat-metric-card" style={{ borderTop: '3px solid #f59e0b', background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.04), var(--bg-surface))' }}>
          <div className="stat-metric-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trophy size={15} style={{ color: '#f59e0b' }} />
              <strong style={{ color: 'var(--text-main)', fontSize: 13 }}>من أول مرة ذاكرت</strong>
            </span>
            <span className="tabular" style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700 }}>إجمالي تراكمي</span>
          </div>
          <div className="stat-metric-num tabular" style={{ color: '#f59e0b', fontSize: 30 }}>{allTimeHours}h</div>
          <div className="stat-metric-sub" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>إجمالي الجلسات: <strong className="tabular">{totalSessionsCount}</strong></span>
            <span>الأيام النشطة: <strong className="tabular">{totalActiveDays} يوم</strong></span>
          </div>
          <div className="stat-metric-sub" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            بداية رحلة الطب: {firstSessionDateFormatted}
          </div>
        </div>
      </div>

      {/* 7-Day Weekly Breakdown Strip */}
      <div className="card" style={{ marginTop: 16, padding: '16px 20px', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              توزيع ساعات الأسبوع يوماً بيوم (السبت - الجمعة)
            </h3>
            <span className="tabular" style={{ fontSize: 12, color: 'var(--accent-primary)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4 }}>
              المجموع: {weekHours} ساعة
            </span>
          </div>

          {onOpenManualSession && (
            <button
              className="btn btn-primary btn-sm"
              onClick={onOpenManualSession}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12 }}
            >
              <Plus size={14} />
              <span>تسجيل جلسة يدوية سريعة</span>
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {weekDays.map((wd, idx) => {
            const isTodayDay = idx === diffToSaturday;
            const h = (wd.mins / 60).toFixed(1);
            const fillPct = Math.min(Math.round((wd.mins / 360) * 100), 100);

            return (
              <div
                key={wd.id}
                style={{
                  background: isTodayDay ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-elevated)',
                  border: isTodayDay ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 8px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
              >
                <div style={{ fontSize: 12, fontWeight: isTodayDay ? 800 : 600, color: isTodayDay ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                  {wd.name} {isTodayDay && '(اليوم)'}
                </div>
                <div className="tabular" style={{ fontSize: 16, fontWeight: 800, color: wd.mins > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>
                  {h}h
                </div>
                <div style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${fillPct}%`,
                      background: isTodayDay ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                      borderRadius: 2
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Supervisor Card */}
      <div className="ai-supervisor-card" style={{ marginTop: 24 }}>
        <div className="ai-card-top-row">
          <div className="ai-identity-block">
            <div className="ai-mood-badge-wrap">
              <div className="ai-mood-avatar">
                <Bot size={28} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="ai-mood-pill">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', display: 'inline-block' }} />
                    {aiMood.label}
                  </span>
                  <span className="ai-mood-score tabular">رضا المراقب: {aiMood.score}%</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>رصد حي ومتابعة</span>
                </div>
                <div className="ai-mood-reason">{aiMood.reason}</div>
              </div>
            </div>
          </div>

          <div className="ai-card-actions">
            <button className="btn btn-sm btn-speak" onClick={onSpeakAi} title="استمع إلى صوت المراقب الأكاديمي">
              <Volume2 size={13} />
              <span>استمع للمراقب</span>
            </button>
            <button className="btn btn-sm" onClick={onOpenInterrogation} style={{ borderColor: 'var(--danger)', color: 'var(--danger)', fontWeight: 700 }}>
              <AlertTriangle size={13} />
              <span>استجواب المتراكمات</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={onTriggerAudit} style={{ fontWeight: 700 }}>
              <Zap size={13} />
              <span>تحليل المراقبة الفوري</span>
            </button>
            <button className="btn btn-sm" onClick={onOpenAiSchedule} style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: 'var(--accent-secondary)', fontWeight: 700 }}>
              <Clock size={13} />
              <span>جدول الساعات المتبقية</span>
            </button>
            <button className="btn btn-sm" onClick={() => onNavigateToView('aiSupervisorView')} style={{ fontWeight: 600 }}>
              <span>مركز التحكم</span>
              <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        {/* Live Emotional Speech Box */}
        <div className="ai-speech-bubble">
          <div className="speech-text" style={{ fontSize: 14, lineHeight: 1.7 }}>
            {aiMood.speech}
          </div>
        </div>

        {/* HUD Summary Grid */}
        <div className="ai-hud-grid">
          <div className="ai-hud-item">
            <span className="ai-hud-label">حالة اليوم والمود</span>
            <span className="ai-hud-val" style={{ color: 'var(--accent-primary)', fontSize: 14 }}>{aiMood.label}</span>
          </div>
          <div className="ai-hud-item">
            <span className="ai-hud-label">المادة الأحق بالبدء الآن</span>
            <span className="ai-hud-val" style={{ color: 'var(--warning)', fontSize: 14 }}>
              {prioritySubjName}
            </span>
          </div>
          <div className="ai-hud-item">
            <span className="ai-hud-label">الوقت المفقود اليوم</span>
            <span className="ai-hud-val tabular" style={{ color: wastedMins > 180 ? 'var(--danger)' : 'var(--text-main)', fontSize: 14 }}>
              {wastedHours}h ({wastedMins}m)
            </span>
          </div>
          <div className="ai-hud-item">
            <span className="ai-hud-label">متوسط الامتحانات وقاعدة 95%</span>
            <span className="ai-hud-val tabular" style={{ color: avgExamPct >= 95 ? 'var(--success)' : 'var(--danger)', fontSize: 14 }}>
              {avgExamPct}% {avgExamPct >= 95 ? 'أوائل' : 'تحت الهدف'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Visualizer & Subject Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, marginTop: 24 }}>
        {/* Left: Study Distribution & Targets */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>توزيع مذاكرة المواد والهدف اليومي</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" onClick={onOpenEditSubjects} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Sliders size={12} />
                <span>تعديل الأهداف</span>
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => onStartFocus(prioritySubjId)}
                style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Play size={11} fill="currentColor" />
                <span>بدء {prioritySubjName}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
            {subjects.map((s) => {
              const mins = Math.round(subjTimes[s.id] || 0);
              const target = s.targetMinutes || 120;
              const pct = Math.min(Math.round((mins / target) * 100), 100);
              const hours = (mins / 60).toFixed(1);
              const targetHours = (target / 60).toFixed(1);

              return (
                <div key={s.id} style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                      <strong style={{ fontSize: 14, color: 'var(--text-main)' }}>{s.name}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      <strong className="tabular" style={{ color: 'var(--text-main)' }}>{hours}h</strong> من {targetHours}h ({pct}%)
                    </div>
                  </div>
                  <div className="stat-progress-bar" style={{ height: 6 }}>
                    <div className="stat-progress-fill" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Directives Inline Box */}
          <div style={{ marginTop: 20, padding: 14, background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                أوامرك المباشرة للمراقب الأكاديمي:
              </span>
              <button className="btn btn-sm btn-primary" onClick={handleSaveDirectives} style={{ padding: '3px 8px', fontSize: 11 }}>
                حفظ الأوامر
              </button>
            </div>
            <textarea
              className="kareem-directives-textarea"
              style={{ minHeight: 60, fontSize: 12 }}
              value={directivesText}
              onChange={(e) => setDirectivesText(e.target.value)}
              placeholder="اكتب للمراقب كيف يعاتبك وبأي لهجة يتكلم..."
            />
            {saveStatus && (
              <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4, fontWeight: 700 }}>
                {saveStatus}
              </div>
            )}
          </div>
        </div>

        {/* Right: Visualizer */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} style={{ color: 'var(--accent-secondary)' }} />
              <span>مخطط الساعات البصري</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className={`btn btn-sm ${vizMode === 'spiral' ? 'btn-primary' : ''}`}
                onClick={() => onVizModeChange('spiral')}
                style={{ padding: '2px 8px', fontSize: 11 }}
              >
                حلزوني
              </button>
              <button
                className={`btn btn-sm ${vizMode === 'gauge' ? 'btn-primary' : ''}`}
                onClick={() => onVizModeChange('gauge')}
                style={{ padding: '2px 8px', fontSize: 11 }}
              >
                دائري
              </button>
              <button
                className={`btn btn-sm ${vizMode === 'bars' ? 'btn-primary' : ''}`}
                onClick={() => onVizModeChange('bars')}
                style={{ padding: '2px 8px', fontSize: 11 }}
              >
                أعمدة
              </button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
            <Visualizer
              sessions={sessions}
              subjects={subjects}
              mode={vizMode}
              onModeChange={onVizModeChange}
              totalStudyMinutes={todayMins}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
