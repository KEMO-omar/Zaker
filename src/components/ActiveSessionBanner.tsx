import React from 'react';
import { Subject } from '../types';
import { Target } from 'lucide-react';

interface ActiveSessionBannerProps {
  isRunning: boolean;
  subject: Subject;
  elapsedSeconds: number;
  onGoToFocus: () => void;
}

export const ActiveSessionBanner: React.FC<ActiveSessionBannerProps> = ({
  isRunning,
  subject,
  elapsedSeconds,
  onGoToFocus
}) => {
  if (!isRunning) return null;

  const h = Math.floor(elapsedSeconds / 3600);
  const m = Math.floor((elapsedSeconds % 3600) / 60);
  const s = elapsedSeconds % 60;
  const timeFormatted = `${h > 0 ? `${h}:` : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;

  return (
    <div className="focus-active-banner">
      <div className="focus-banner-text">
        <div className="pulse-indicator" />
        <div>
          <strong style={{ color: 'var(--text-main)' }}>
            جلسة مذاكرة نشطة جارية الآن: <span style={{ color: subject.color }}>{subject.name}</span>
          </strong>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            الوقت المنقضي: <span className="tabular" style={{ fontWeight: 700, color: 'var(--text-main)' }}>{timeFormatted}</span>
          </div>
        </div>
      </div>
      <button className="btn btn-primary btn-sm" onClick={onGoToFocus} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Target size={14} />
        <span>الانتقال إلى غرفة التركيز</span>
      </button>
    </div>
  );
};
