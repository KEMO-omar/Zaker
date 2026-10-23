import React from 'react';
import { Exemption, Session } from '../types';
import {
  Hourglass,
  Plus,
  Trash2,
  Clock,
  Moon,
  BookOpen,
  Calendar,
  AlertTriangle
} from 'lucide-react';

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
              <Hourglass size={20} style={{ color: 'var(--danger)' }} />
              <span>معادلة الـ 24 ساعة وحساب الوقت الضائع</span>
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, maxWidth: 640, lineHeight: 1.6 }}>
              الـ 24 ساعة ملكك بالكامل. نطرح منها 7 ساعات نوم + ساعات الدروس والمدرسة المعتمدة + ساعات مذاكرتك الصافية = فاقدك الحقيقي بالدقيقة.
            </p>
          </div>

          <button className="btn btn-primary btn-sm" onClick={onOpenExemptionModal}>
            <Plus size={14} />
            <span>تسجيل إعفاء جديد (مدرسة / درس)</span>
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
            <div style={{ width: `${studyPct}%`, background: 'var(--accent-primary)' }} title="مذاكرة صافية" />
            <div style={{ width: `${exemptPct}%`, background: 'var(--accent-secondary)' }} title="إعفاءات ودروس" />
            <div style={{ width: `${sleepPct}%`, background: '#64748b' }} title="نوم صحي (7 ساعات)" />
            <div style={{ width: `${wastedPct}%`, background: 'var(--danger)' }} title="وقت ضائع" />
            <div style={{ width: `${remainingPct}%`, background: 'transparent' }} title="متبقي من اليوم" />
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent-primary)' }} />
              <span>مذاكرة صافية:</span>
              <strong className="tabular" style={{ color: 'var(--text-main)' }}>{studyHours}h</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent-secondary)' }} />
              <span>إعفاءات (سناتر ومدرسة):</span>
              <strong className="tabular" style={{ color: 'var(--text-main)' }}>{exemptHours}h</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#64748b' }} />
              <span>نوم صحي:</span>
              <strong className="tabular" style={{ color: 'var(--text-main)' }}>{sleepHours}h</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--danger)' }} />
              <span>وقت ضائع:</span>
              <strong className="tabular" style={{ color: 'var(--danger)' }}>{wastedHours}h</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Exemptions Management Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} style={{ color: 'var(--accent-secondary)' }} />
            <span>سجل الإعفاءات الزمنية المعتمدة (السناتر، المدرسة، المشاوير)</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            إجمالي ساعات الإعفاء اليوم: <strong className="tabular" style={{ color: 'var(--accent-secondary)' }}>{exemptHours}h</strong>
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {exemptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)', fontSize: 13 }}>
              لا توجد إعفاءات مسجلة لليوم. اضغط زر "تسجيل إعفاء جديد" بالأعلى لخصم أوقات المدرسة أو السناتر.
            </div>
          ) : (
            exemptions.map((ex) => {
              const hours = (ex.minutes / 60).toFixed(1);
              const dateStr = new Date(ex.timestamp).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
              return (
                <div
                  key={ex.id}
                  className="log-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderLeft: '4px solid var(--accent-secondary)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                      {ex.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span>خصم معتمد من معادلة الـ 24 ساعة</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="tabular" style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-secondary)' }}>
                      {hours}h ({ex.minutes}m)
                    </div>
                    <button
                      className="btn btn-sm"
                      onClick={() => onDeleteExemption(ex.id)}
                      title="حذف الإعفاء"
                      style={{ color: 'var(--danger)', borderColor: 'rgba(239, 83, 80, 0.25)', padding: '4px 8px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
