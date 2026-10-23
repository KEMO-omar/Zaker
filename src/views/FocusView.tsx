import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Subject } from '../types';
import {
  Play,
  Pause,
  CheckCircle2,
  Coffee,
  Quote,
  Clock
} from 'lucide-react';

interface FocusViewProps {
  subjects: Subject[];
  activeSubjId: string;
  onSelectSubject: (id: string) => void;
  taskNote: string;
  onTaskNoteChange: (note: string) => void;
  isRunning: boolean;
  elapsedSeconds: number;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onFinishSession: () => void;
  onOpenBreak: () => void;
  onOpenManualSession?: () => void;
  quotes: string[];
}

export const FocusView: React.FC<FocusViewProps> = ({
  subjects,
  activeSubjId,
  onSelectSubject,
  taskNote,
  onTaskNoteChange,
  isRunning,
  elapsedSeconds,
  onStartTimer,
  onPauseTimer,
  onFinishSession,
  onOpenBreak,
  onOpenManualSession,
  quotes
}) => {
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Cycle quote every 15 seconds
  useEffect(() => {
    if (!quotes || quotes.length === 0) return;
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [quotes]);

  const activeSubj = subjects.find((s) => s.id === activeSubjId) || subjects[0];

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const timeFormatted = `${hours > 0 ? `${hours < 10 ? '0' : ''}${hours}:` : ''}${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const handleFinish = () => {
    if (elapsedSeconds < 1) return;
    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}
    onFinishSession();
  };

  return (
    <section className="view-panel active">
      <div className="focus-view">
        {/* Top Controls: Subject Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>المادة قيد المذاكرة:</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {subjects.map((s) => (
              <button
                key={s.id}
                className={`btn btn-sm ${activeSubjId === s.id ? 'btn-primary' : ''}`}
                onClick={() => onSelectSubject(s.id)}
                style={{
                  background: activeSubjId === s.id ? s.color : 'var(--bg-surface)',
                  borderColor: activeSubjId === s.id ? s.color : 'var(--border-subtle)',
                  color: activeSubjId === s.id ? '#0b1212' : 'var(--text-main)',
                  fontWeight: 700
                }}
              >
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Task Note Input */}
        <div style={{ maxWidth: 480, width: '100%', margin: '16px auto 0' }}>
          <input
            type="text"
            className="input-field"
            style={{ textAlign: 'center', fontSize: 14 }}
            placeholder="اكتب عنوان الدرس أو المهمة المركزة هنا..."
            value={taskNote}
            onChange={(e) => onTaskNoteChange(e.target.value)}
          />
        </div>

        {/* Active Badge */}
        <div style={{ marginTop: 12 }}>
          <div className="focus-subject-badge" style={{ borderColor: activeSubj.color, color: activeSubj.color }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeSubj.color }} />
            <span>جلسة: {activeSubj.name}</span>
          </div>
        </div>

        {/* Big Clock Display */}
        <div className="focus-main-clock tabular">
          {timeFormatted}
        </div>

        {/* Ambient Motivational Quote */}
        <div className="quote-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Quote size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <span>{quotes[quoteIndex] || 'يا كريم، حلم كلية الطب بيتصنع في الساعات دي!'}</span>
        </div>

        {/* Action Controls */}
        <div className="focus-action-bar">
          {!isRunning ? (
            <button className="btn btn-primary" onClick={onStartTimer} style={{ padding: '12px 28px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Play size={16} fill="currentColor" />
              <span>بدء جلسة التركيز</span>
            </button>
          ) : (
            <button className="btn" onClick={onPauseTimer} style={{ padding: '12px 24px', fontSize: 15, borderColor: 'var(--warning)', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Pause size={16} />
              <span>إيقاف مؤقت</span>
            </button>
          )}

          <button
            className="btn"
            onClick={handleFinish}
            disabled={elapsedSeconds === 0}
            style={{ padding: '12px 24px', fontSize: 15, borderColor: 'var(--success)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <CheckCircle2 size={16} />
            <span>إنهاء وحفظ الجلسة</span>
          </button>

          <button className="btn" onClick={onOpenBreak} style={{ padding: '12px 20px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Coffee size={15} style={{ color: 'var(--accent-primary)' }} />
            <span>استراحة بومودورو</span>
          </button>

          {onOpenManualSession && (
            <button className="btn" onClick={onOpenManualSession} style={{ padding: '12px 20px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={15} style={{ color: 'var(--accent-secondary)' }} />
              <span>تسجيل جلسة يدوية</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
