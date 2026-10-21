import React from 'react';
import { Subject, Session, Exemption, ExamRecord, WeeklyTask } from '../types';
import { Visualizer } from '../components/Visualizer';

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
  onTriggerAudit: () => void;
  onSpeakAi: () => void;
  onNavigateToView: (view: any) => void;
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
  onTriggerAudit,
  onSpeakAi,
  onNavigateToView,
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
  const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  let todayMins = 0;
  let weekMins = 0;
  let monthMins = 0;

  sessions.forEach((s) => {
    const ts = s.tsStart || (s.date ? new Date(s.date).getTime() : 0);
    const m = s.minutes || 0;
    if (ts >= startOfToday) todayMins += m;
    if (ts >= oneWeekAgo) weekMins += m;
    if (ts >= startOfMonth) monthMins += m;
  });

  const todayHours = (todayMins / 60).toFixed(1);
  const todayPct = Math.min(Math.round((todayMins / 360) * 100), 100);

  const weekHours = (weekMins / 60).toFixed(1);
  const weekPct = Math.min(Math.round((weekMins / 2100) * 100), 100);

  const monthHours = (monthMins / 60).toFixed(1);

  // Wasted time calculations for today:
  // Assuming awake hours elapsed so far today
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
  subjects.forEach((s) => {
    const ratio = (subjTimes[s.id] || 0) / (s.targetMinutes || 120);
    if (ratio < minRatio) {
      minRatio = ratio;
      prioritySubjName = s.name;
    }
  });

  const handleSaveDirectives = () => {
    onSaveCustomInstructions(directivesText);
    setSaveStatus('✅ تم حفظ تعليماتك بنجاح!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <section className="view-panel active">
      {/* Upper Metrics Cards */}
      <div className="stats-banner-grid">
        <div className="stat-metric-card">
          <div className="stat-metric-header">
            <span>⏱️ طاقة اليوم</span>
            <span className="tabular" style={{ color: 'var(--accent-primary)' }}>{todayPct}% من الهدف</span>
          </div>
          <div className="stat-metric-num tabular">{todayHours}h</div>
          <div className="stat-metric-sub">الهدف اليومي: <strong className="tabular">6 ساعات</strong></div>
          <div className="stat-progress-bar">
            <div className="stat-progress-fill" style={{ width: `${todayPct}%`, background: 'var(--accent-primary)' }} />
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-metric-header">
            <span>📅 إنجاز الأسبوع</span>
            <span className="tabular" style={{ color: 'var(--accent-secondary)' }}>{weekPct}%</span>
          </div>
          <div className="stat-metric-num tabular">{weekHours}h</div>
          <div className="stat-metric-sub">الهدف الأسبوعي: <strong className="tabular">35 ساعة</strong></div>
          <div className="stat-progress-bar">
            <div className="stat-progress-fill" style={{ width: `${weekPct}%`, background: 'var(--accent-secondary)' }} />
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-metric-header">
            <span>🗓️ إنجاز الشهر</span>
            <span style={{ color: '#a78bfa' }}>هذا الشهر</span>
          </div>
          <div className="stat-metric-num tabular">{monthHours}h</div>
          <div className="stat-metric-sub">تراكم الشهر الحالي</div>
          <div className="stat-progress-bar">
            <div className="stat-progress-fill" style={{ width: `${Math.min((monthMins / 9000) * 100, 100)}%`, background: '#a78bfa' }} />
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-metric-header">
            <span>⚡ مؤشر الإنتاجية</span>
            <span style={{ color: 'var(--warning)', fontWeight: 800 }}>
              {productivityScore >= 80 ? 'ممتاز' : productivityScore >= 60 ? 'جيد' : 'يحتاج حزم'}
            </span>
          </div>
          <div className="stat-metric-num tabular" style={{ color: 'var(--warning)' }}>{productivityScore} / 100</div>
          <div className="stat-metric-sub">كفاءة التركيز: <strong className="tabular">{100 - wastedPct}%</strong></div>
          <div className="stat-progress-bar">
            <div className="stat-progress-fill" style={{ width: `${productivityScore}%`, background: 'linear-gradient(90deg, #f59e0b, #10b981)' }} />
          </div>
        </div>
      </div>

      {/* AI Supervisor Card */}
      <div className="ai-supervisor-card" style={{ marginTop: 24 }}>
        <div className="ai-card-top-row">
          <div className="ai-identity-block">
            <div className="ai-mood-badge-wrap">
              <div className="ai-mood-avatar">{aiMood.avatar}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="ai-mood-pill">{aiMood.avatar} {aiMood.label}</span>
                  <span className="ai-mood-score tabular">رضا المراقب: {aiMood.score}%</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>⚡ رصد حي</span>
                </div>
                <div className="ai-mood-reason">{aiMood.reason}</div>
              </div>
            </div>
          </div>

          <div className="ai-card-actions">
            <button className="btn btn-sm btn-speak" onClick={onSpeakAi} title="استمع إلى صوت المراقب الأكاديمي">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
              <span>🔊 استمع للمراقب</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={onTriggerAudit} style={{ fontWeight: 700 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              <span>⚡ تحليل المراقبة الفوري</span>
            </button>
            <button className="btn btn-sm" onClick={onOpenAiSchedule} style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: 'var(--accent-secondary)', fontWeight: 700 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>⏱️ جدول الساعات المتبقية</span>
            </button>
            <button className="btn btn-sm" onClick={() => onNavigateToView('aiSupervisorView')} style={{ fontWeight: 600 }}>
              <span>مركز التحكم ↗</span>
            </button>
          </div>
        </div>

        {/* Live Emotional Speech Box */}
        <div className="ai-speech-bubble">
          <div className="speech-quote-icon">❝</div>
          <div className="speech-text">{aiMood.speech}</div>
        </div>

        {/* HUD Summary Grid */}
        <div className="ai-hud-grid">
          <div className="ai-hud-item">
            <span className="ai-hud-label">📡 حالة اليوم الحالية والمود</span>
            <span className="ai-hud-val" style={{ color: 'var(--accent-primary)', fontSize: 14 }}>{aiMood.label}</span>
          </div>
          <div className="ai-hud-item">
            <span className="ai-hud-label">⏳ الوقت الضائع المرصود</span>
            <span className="ai-hud-val tabular" style={{ color: 'var(--danger)' }}>{wastedMins} دقيقة ({wastedHours}h)</span>
          </div>
          <div className="ai-hud-item">
            <span className="ai-hud-label">📚 المادة الأكثر احتياجاً للمذاكرة</span>
            <span className="ai-hud-val" style={{ color: 'var(--warning)', fontSize: 14 }}>{prioritySubjName}</span>
          </div>
          <div className="ai-hud-item">
            <span className="ai-hud-label">🎯 متوسط درجات الامتحانات (شرط الـ 95%)</span>
            <span className="ai-hud-val tabular" style={{ color: avgExamPct >= 95 ? 'var(--success)' : 'var(--danger)' }}>
              {avgExamPct}% {avgExamPct >= 95 ? '✅' : '⚠️'}
            </span>
          </div>
        </div>

        {/* Karim's Directives Editor */}
        <div className="kareem-directives-card">
          <div className="kareem-directives-header">
            <div className="kareem-directives-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              <span>تعليمات وقواعد كريم الصريحة للمراقب الذكي (تتحكم في أسلوبه وموده فوراً):</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {saveStatus && (
                <span style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 700 }}>{saveStatus}</span>
              )}
              <button className="btn btn-sm btn-primary" onClick={handleSaveDirectives} style={{ padding: '4px 12px', fontSize: 12 }}>
                <span>💾 حفظ وإلزام المراقب فوراً</span>
              </button>
            </div>
          </div>
          <textarea
            className="kareem-directives-textarea"
            placeholder="اكتب للمراقب كيف يعاتبك، كيف يراقب وقتك وامتحاناتك، وبأي لهجة يتكلم..."
            value={directivesText}
            onChange={(e) => setDirectivesText(e.target.value)}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>💡 أي تعديل تكتبه هنا يتم ربطه وحفظه في السحابة، ويطبقه المراقب حرفياً في كل كلامه وموده.</span>
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>قاعدة الـ 95% ومراقبة الوقت الضائع مفعلة</span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid: Visualizer + Wasted Time */}
      <div className="dash-grid" style={{ marginTop: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 10 10 0 0 0 0-20"/>
              </svg>
              <span>رادار التركيز والوقت المستمر</span>
            </div>
          </div>

          <Visualizer
            sessions={sessions}
            subjects={subjects}
            mode={vizMode}
            onModeChange={onVizModeChange}
            totalStudyMinutes={todayMins}
          />
        </div>

        <div className="card wasted-card">
          <div className="card-header">
            <div className="card-title" style={{ color: 'var(--danger)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>رصد الوقت الضائع اليوم</span>
            </div>
          </div>

          <div className="wasted-value tabular">{wastedHours} <span style={{ fontSize: 20 }}>ساعة</span></div>
          <div className="wasted-sub">
            فاقد غير محسوب من ساعات اليقظة اليوم ({wastedMins} دقيقة ضائعة).
          </div>

          <div className="wasted-bar">
            <div className="wasted-bar-fill" style={{ width: `${wastedPct}%` }} />
          </div>

          <div className="exempt-box">
            <div className="exempt-info">
              <span>🏫 ساعات الإعفاء المعتمدة اليوم:</span>
              <span className="exempt-tag tabular">{(todayExemptionMins / 60).toFixed(1)}h</span>
            </div>
            <button className="btn btn-sm" onClick={() => onNavigateToView('wastedView')}>
              تفاصيل الفاقد والإعفاءات ↗
            </button>
          </div>
        </div>
      </div>

      {/* Core 4 Subjects Cards */}
      <h3 style={{ fontSize: 16, fontWeight: 800, margin: '28px 0 14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>📚 متابعة مواد كريم الأربعة الأساسية والبدء السريع:</span>
      </h3>
      <div className="subjects-grid">
        {subjects.map((subj) => {
          const sMins = Math.round(subjTimes[subj.id] || 0);
          const target = subj.targetMinutes || 120;
          const sPct = Math.min(Math.round((sMins / target) * 100), 100);

          return (
            <div key={subj.id} className="subject-card" style={{ '--sub-color': subj.color } as any}>
              <div className="subject-info">
                <div className="subject-icon-box">
                  <span style={{ fontSize: 18 }}>
                    {subj.id === 'physics' ? '⚛️' : subj.id === 'arabic' ? '📖' : subj.id === 'english' ? '🌐' : '🏛️'}
                  </span>
                </div>
                <div>
                  <div className="subject-name">{subj.name}</div>
                  <div className="subject-time tabular">
                    {Math.floor(sMins / 60)}h {sMins % 60}m / {Math.floor(target / 60)}h
                  </div>
                  <div style={{ fontSize: 11, color: subj.color, fontWeight: 700, marginTop: 2 }}>
                    {sPct}% مكتمل
                  </div>
                </div>
              </div>

              <div>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => onStartFocus(subj.id)}
                  title={`بدء جلسة تركيز في مادة ${subj.name}`}
                  style={{ background: subj.color, borderColor: subj.color, color: '#0b1212', fontWeight: 700 }}
                >
                  <span>بدء 🎯</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
