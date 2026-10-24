import React from 'react';
import { ThemeType, ViewTab } from '../types';
import {
  RotateCw,
  Clock,
  Zap,
  Download,
  Bot,
  Palette,
  ShieldCheck,
  CheckCircle2,
  FileDown
} from 'lucide-react';

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
  onInstallPwa: () => void;
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
  onTriggerManualSync,
  onInstallPwa
}) => {
  const allHours = Math.floor(allTimeMinutes / 60);
  const allMins = Math.round(allTimeMinutes % 60);

  const countdownMins = Math.floor(syncCountdown / 60);
  const countdownSecs = syncCountdown % 60;
  const countdownFormatted = `${countdownMins < 10 ? '0' : ''}${countdownMins}:${countdownSecs < 10 ? '0' : ''}${countdownSecs}`;

  const handleExportBackup = () => {
    try {
      const rawSessions = localStorage.getItem('kareem_sessions');
      const backupData = {
        exportedAt: new Date().toISOString(),
        sessions: rawSessions ? JSON.parse(rawSessions) : [],
        allTimeMinutes
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kareem_study_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {}
  };

  return (
    <header className="app-header">
      <div className="brand-wrap">
        <div className="brand-icon" style={{
          background: 'transparent',
          padding: 0,
          overflow: 'hidden',
          width: 40,
          height: 40,
          borderRadius: 10,
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img src="./logo.png" alt="شباب STUDY HUB" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div>
          <div className="brand-title" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 900 }}>شباب</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: 0.5 }}>STUDY HUB</span>
            <span style={{ fontWeight: 400, opacity: 0.65, fontSize: 13 }}>| د. كريم عمر</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="brand-sub">نظام التركيز والإنتاجية الدراسي</span>
            <button
              id="cloudStatusIndicator"
              className="sync-badge-btn"
              onClick={onTriggerManualSync}
              title="اضغط للمزامنة الفورية مع قاعدة البيانات السحابية"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                padding: '3px 10px',
                borderRadius: 20,
                background: isSyncing ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                color: isSyncing ? '#f59e0b' : '#10b981',
                fontWeight: 700,
                border: `1px solid ${isSyncing ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                cursor: 'pointer'
              }}
            >
              <RotateCw size={11} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'جاري المزامنة...' : 'متصل بالسحابة'}</span>
            </button>
            <span
              id="syncHourlyTimerBadge"
              className="sync-timer-badge"
              title="تحديث دوري كل 60 دقيقة لقاعدة البيانات لحفظ كافة التعديلات، أو اضغط الزر الطارئ للإرسال فوراً"
            >
              <Clock size={12} style={{ color: 'var(--text-muted)' }} />
              <span>القادمة:</span>
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
          title="إرسال فوري للبيانات واستدعاء طارئ للمراقب"
        >
          <Zap size={14} style={{ color: 'var(--danger)' }} />
          <span>استدعاء طارئ</span>
        </button>

        {/* PWA Install Button for Chrome / Mobile */}
        <button
          id="pwaInstallHeaderBtn"
          className="btn btn-sm"
          onClick={onInstallPwa}
          title="تثبيت التطبيق على الكمبيوتر أو الموبايل للعمل بدون نت"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-main)' }}
        >
          <Download size={13} style={{ color: 'var(--accent-primary)' }} />
          <span>تثبيت التطبيق</span>
        </button>

        {/* Export Backup JSON Button */}
        <button
          className="btn btn-sm"
          onClick={handleExportBackup}
          title="تحميل نسخة احتياطية كاملة من كافة جلساتك ومذاكرتك كملف JSON"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-main)' }}
        >
          <FileDown size={13} style={{ color: 'var(--accent-secondary)' }} />
          <span>تصدير نسخة (JSON)</span>
        </button>

        {/* AI Supervisor Mood Quick Action */}
        <button
          id="aiSupervisorHeaderBtn"
          className="btn btn-sm ai-header-mood-btn"
          onClick={() => onSelectTab('aiSupervisorView')}
          title="المراقب الأكاديمي وإدارة الوقت"
        >
          <Bot size={14} style={{ color: 'var(--accent-primary)' }} />
          <span>
            المراقب: <strong style={{ color: 'var(--accent-primary)' }}>{aiMood.label}</strong>
          </span>
          <span className="tabular" style={{ fontSize: 11, color: 'var(--text-muted)' }}>({aiMood.score}%)</span>
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
            color: 'var(--text-main)'
          }}
        >
          <Clock size={13} style={{ color: 'var(--accent-primary)' }} />
          <span>
            كله في كله: <strong className="tabular" style={{ color: 'var(--accent-primary)' }}>{allHours}h {allMins < 10 ? `0${allMins}` : allMins}m</strong>
          </span>
        </div>

        {/* Theme Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
          <Palette size={14} style={{ color: 'var(--text-muted)' }} />
          <select
            id="themeSelect"
            className="btn btn-sm"
            value={theme}
            onChange={(e) => onThemeChange(e.target.value as ThemeType)}
            aria-label="اختيار المظهر"
            style={{ paddingRight: 8, paddingLeft: 8 }}
          >
            <option value="default">ساج هادئ (افتراضي)</option>
            <option value="indigo">نيلي نايت ديب</option>
            <option value="warm-sand">رمل دافئ كلاسيك</option>
            <option value="minimal-light">ضوء نهاري مريح</option>
          </select>
        </div>
      </div>
    </header>
  );
};
