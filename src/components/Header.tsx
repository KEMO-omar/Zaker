import React from 'react';
import { ThemeType, ViewTab } from '../types';

interface HeaderProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  theme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
  allTimeMinutes: number;
  aiMood: {
    avatar: string;
    label: string;
    score: number;
  };
  syncCountdown: number;
  isSyncing: boolean;
  onTriggerEmergencySync: () => void;
  onTriggerManualSync: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  theme,
  onThemeChange,
  allTimeMinutes,
  aiMood,
  syncCountdown,
  isSyncing,
  onTriggerEmergencySync,
  onTriggerManualSync
}) => {
  const allHours = Math.floor(allTimeMinutes / 60);
  const allMins = Math.round(allTimeMinutes % 60);

  const countdownMins = Math.floor(syncCountdown / 60);
  const countdownSecs = syncCountdown % 60;
  const countdownFormatted = `${countdownMins < 10 ? '0' : ''}${countdownMins}:${countdownSecs < 10 ? '0' : ''}${countdownSecs}`;

  return (
    <header className="app-header">
      <div className="brand-wrap">
        <div className="brand-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 10 10 0 0 0 0-20"/>
            <path d="M12 6a6 6 0 1 1 0 12 4 4 0 0 1 0-8"/>
          </svg>
        </div>
        <div>
          <div className="brand-title">
            SHAPAP <span style={{ fontWeight: 400, opacity: 0.7 }}>| مساحة كريم</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="brand-sub">نظام التركيز والإنتاجية الدراسي</span>
            <button
              id="cloudStatusIndicator"
              className="sync-badge-btn"
              onClick={onTriggerManualSync}
              title="اضغط للمزامنة الفورية مع قاعدة البيانات السحابية"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 12,
                background: isSyncing ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16,185,129,0.12)',
                color: isSyncing ? '#f59e0b' : '#10b981',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: isSyncing ? '#f59e0b' : '#10b981',
                  display: 'inline-block'
                }}
              />
              <span>{isSyncing ? 'جاري المزامنة...' : 'متصل بالسحابة'}</span>
            </button>
            <span
              id="syncHourlyTimerBadge"
              className="sync-timer-badge"
              title="تحديث دوري كل 60 دقيقة لقاعدة البيانات لحفظ كافة التعديلات، أو اضغط الزر الطارئ للإرسال فوراً"
            >
              <span>⏱️ القادمة:</span>
              <strong className="tabular">{countdownFormatted}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        {/* Emergency Sync & Call Button */}
        <button
          id="emergencySyncHeaderBtn"
          className="btn btn-sm btn-emergency-pulse"
          onClick={onTriggerEmergencySync}
          title="إرسال فوري للبيانات واستدعاء طارئ للمراقب (تلقائياً كل ساعة)"
        >
          <span className="emergency-pulse-dot" />
          <span>🚨 إرسال واستدعاء طارئ</span>
        </button>

        {/* AI Supervisor Mood Quick Action */}
        <button
          id="aiSupervisorHeaderBtn"
          className="btn btn-sm ai-header-mood-btn"
          onClick={() => onSelectTab('aiSupervisorView')}
          title="المراقب الأكاديمي وإدارة الوقت"
        >
          <span style={{ fontSize: 14 }}>{aiMood.avatar}</span>
          <span>
            المراقب: <strong style={{ color: 'var(--accent-primary)' }}>{aiMood.label}</strong>
          </span>
        </button>

        {/* All-Time Metric Badge */}
        <div
          id="headerAllTimeBadge"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent-primary)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 10 10 0 0 0 0-20"/>
          </svg>
          <span>
            كله في كله: <strong className="tabular">{allHours}h {allMins < 10 ? `0${allMins}` : allMins}m</strong>
          </span>
        </div>

        {/* Theme Selection */}
        <select
          id="themeSelect"
          className="btn btn-sm"
          value={theme}
          onChange={(e) => onThemeChange(e.target.value as ThemeType)}
          aria-label="اختيار المظهر"
        >
          <option value="default">🌿 نور الساج الهادئ (افتراضي)</option>
          <option value="indigo">🌌 نيلي نايت ديب</option>
          <option value="warm-sand">☕ رمل دافئ كلاسيك</option>
          <option value="minimal-light">☀️ ضوء نهاري مريح</option>
        </select>
      </div>
    </header>
  );
};
