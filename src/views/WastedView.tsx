import React from 'react';
import { Exemption, Session } from '../types';

interface WastedViewProps {
  exemptions: Exemption[];
  sessions: Session[];
  onOpenExemptionModal: () => void;
  onDeleteExemption: (id: string) => void;
}

export const WastedView: React.FC<WastedViewProps> = ({
  exemptions,
  sessions,
  onOpenExemptionModal,
  onDeleteExemption
}) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Today study minutes
  let todayStudyMins = 0;
  sessions.forEach((s) => {
    const ts = s.tsStart || (s.date ? new Date(s.date).getTime() : 0);
    if (ts >= startOfToday) {
      todayStudyMins += s.minutes || 0;
    }
  });

  // Today exemptions minutes
  let todayExemptionMins = 0;
  exemptions.forEach((ex) => {
    if (ex.timestamp >= startOfToday) {
      todayExemptionMins += ex.minutes || 0;
    }
  });

  const sleepMins = 420; // 7 hours
  const totalDayMins = 1440; // 24 hours
  const elapsedMins = now.getHours() * 60 + now.getMinutes();

  // Wasted time out of elapsed time
  const elapsedAwakeMins = Math.max(elapsedMins - (now.getHours() < 7 ? 0 : sleepMins), 0);
  const wastedMins = Math.max(Math.round(elapsedAwakeMins - todayStudyMins - todayExemptionMins), 0);

  const studyHours = (todayStudyMins / 60).toFixed(1);
  const exemptHours = (todayExemptionMins / 60).toFixed(1);
  const sleepHours = (sleepMins / 60).toFixed(1);
  const wastedHours = (wastedMins / 60).toFixed(1);

  // Proportions for 24-hour visual bar
  const studyPct = Math.min((todayStudyMins / totalDayMins) * 100, 100);
  const exemptPct = Math.min((todayExemptionMins / totalDayMins) * 100, 100);
  const sleepPct = (sleepMins / totalDayMins) * 100;
  const wastedPct = Math.min((wastedMins / totalDayMins) * 100, 100);
  const remainingPct = Math.max(100 - (studyPct + exemptPct + sleepPct + wastedPct), 0);

  return (
    <section className="view-panel active">
      {/* Upper Status Banner */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--danger)' }}>⏳ معادلة الـ 24 ساعة وحساب الوقت الضائع</span>
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, maxWidth: 640 }}>
              "الـ 24 ساعة ملكك بالكامل. نطرح منها 7 ساعات نوم + ساعات الدروس والمدرسة المعتمدة + ساعات مذاكرتك الصافية = فاقدك الحقيقي بالدقيقة."
            </p>
          </div>

          <button className="btn btn-primary btn-sm" onClick={onOpenExemptionModal}>
            <span>➕ تسجيل إعفاء جديد (مدرسة / درس)</span>
          </button>
        </div>

        {/* 24-Hour Visual Segmented Bar */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
            <span>توزيع يومك الحالي (24 ساعة):</span>
            <span className="tabular">الوقت الضائع المرصود: <strong style={{ color: 'var(--danger)' }}>{wastedHours}h</strong></span>
          </div>
          <div style={{
            height: 14,
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            display: 'flex'
          }}>
            <div style={{ width: `${studyPct}%`, background: 'var(--accent-primary)', title: 'مذاكرة' } as any} title="مذاكرة صافية" />
            <div style={{ width: `${exemptPct}%`, background: 'var(--accent-secondary)' }} title="إعفاءات ودروس" />
            <div style={{ width: `${sleepPct}%`, background: '#64748b' }} title="نوم صحي (7 ساعات)" />
            <div style={{ width: `${wastedPct}%`, background: 'var(--danger)' }} title="وقت ضائع" />
            <div style={{ width: `${remainingPct}%`, background: 'transparent' }} title="متبقي من اليوم" />
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent-primary)' }} />
              مذاكرة صافية: <strong className="tabular" style={{ color: 'var(--text-main)' }}>{studyHours}h</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent-secondary)' }} />
              إعفاءات ودروس: <strong className="tabular" style={{ color: 'var(--text-main)' }}>{exemptHours}h</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#64748b' }} />
              نوم صحي: <strong className="tabular" style={{ color: 'var(--text-main)' }}>{sleepHours}h</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--danger)' }} />
              وقت ضائع: <strong className="tabular" style={{ color: 'var(--danger)' }}>{wastedHours}h</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Exemptions Management List */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
            <span>سجل الإعفاءات المسجلة لليوم والأيام السابقة:</span>
          </div>
          <button className="btn btn-sm btn-primary" onClick={onOpenExemptionModal}>
            <span>➕ إضافة إعفاء</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {exemptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 13 }}>
              لا توجد إعفاءات مسجلة. أضف المدرسة أو مواعيد السناتر حتى لا تُحسب كوقت ضائع.
            </div>
          ) : (
            exemptions.map((ex) => (
              <div key={ex.id} className="log-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>🏫</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                      {ex.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      مسجل في: <span className="tabular">{new Date(ex.timestamp).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span className="tabular" style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-secondary)' }}>
                    {(ex.minutes / 60).toFixed(1)} ساعة ({ex.minutes} دقيقة)
                  </span>
                  <button
                    className="btn btn-sm"
                    onClick={() => onDeleteExemption(ex.id)}
                    title="حذف الإعفاء"
                    style={{ color: 'var(--danger)', padding: '4px 8px' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
