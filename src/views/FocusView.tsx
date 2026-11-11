import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Subject } from '../types';
import {
  Play,
  Pause,
  CheckCircle2,
  Coffee,
  Quote,
  Clock,
  RotateCcw,
  BookOpen,
  Zap,
  Flame,
  ShieldAlert
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
  onCancelSession?: () => void;
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
  onCancelSession,
  onOpenBreak,
  onOpenManualSession,
  quotes
}) => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isRescueActive, setIsRescueActive] = useState<boolean>(false);

  // Cycle quote every 15 seconds
  useEffect(() => {
    if (!quotes || quotes.length === 0) return;
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [quotes]);

  const activeSubj = subjects.find((s) => s.id === activeSubjId) || subjects[0];

  const handleStartRescueSession = () => {
    setIsRescueActive(true);
    onTaskNoteChange(`🚨 جلسة إنقاذ طارئة: كسر حاجز التراكم في ${activeSubj.name} (25 دقيقة)`);
    if (!isRunning) {
      onStartTimer();
    }
  };

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const timeFormatted = `${hours > 0 ? `${hours < 10 ? '0' : ''}${hours}:` : ''}${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const handleFinish = () => {
    if (elapsedSeconds < 1) return;
    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}
    setIsRescueActive(false);
    onFinishSession();
  };

  return (
    <section className="view-panel active">
      <div className="focus-view">
        {/* Emergency Rescue Kickstart Banner */}
        <div style={{
          maxWidth: 620,
          width: '100%',
          margin: '0 auto 16px',
          padding: '12px 18px',
          borderRadius: 12,
          background: isRescueActive ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.15))' : 'rgba(255, 255, 255, 0.03)',
          border: `1px solid ${isRescueActive ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', flexShrink: 0 }}>
              <ShieldAlert size={18} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>
                {isRescueActive ? '🚨 وضع الإنقاذ وكسر التراكم نشط الآن' : 'حاسس بتراكم ومش عارف تبدأ منين؟'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {isRescueActive
                  ? 'يا دكتور كريم: اهدأ تماماً.. ركز فقط في الـ 25 دقيقة دول وانسى بقية التراكم، خطوة بخطوة وهترجع للقمة!'
                  : 'متفكرش في الـ 100 حاجة مرة واحدة! ابدأ جلسة إنقاذ 25 دقيقة فقط بدون تفكير لكسر الشلل النفسي'}
              </div>
            </div>
          </div>
          {!isRescueActive && !isRunning && (
            <button
              className="btn btn-sm"
              onClick={handleStartRescueSession}
              style={{
                background: 'linear-gradient(90deg, #ef4444, #f59e0b)',
                color: '#fff',
                borderColor: 'transparent',
                fontWeight: 800,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px'
              }}
            >
              <Zap size={14} fill="currentColor" />
              <span>ابدأ جلسة إنقاذ (25 دقيقة) ⚡</span>
            </button>
          )}
        </div>

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

        {/* Active Badge & NotebookLM Link */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="focus-subject-badge" style={{ borderColor: activeSubj.color, color: activeSubj.color, margin: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeSubj.color }} />
            <span>جلسة: {activeSubj.name}</span>
          </div>

          {activeSubj.notebookUrl && (
            <a
              href={activeSubj.notebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--accent-secondary)',
                borderColor: 'rgba(56, 189, 248, 0.35)',
                fontWeight: 700,
                fontSize: 12,
                padding: '4px 12px'
              }}
            >
              <BookOpen size={13} />
              <span>فتح دفتر {activeSubj.name} في Google NotebookLM ↗</span>
            </a>
          )}
        </div>

        {/* Big Clock Display */}
        <div className="focus-main-clock tabular">
          {timeFormatted}
        </div>

        {/* Live Cloud Sync Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', margin: '6px 0 16px' }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isRunning ? 'var(--success)' : elapsedSeconds > 0 ? 'var(--warning)' : 'var(--border-subtle)',
            boxShadow: isRunning ? '0 0 8px var(--success)' : 'none',
            display: 'inline-block'
          }} />
          <span style={{ fontWeight: 600 }}>
            {isRunning
              ? 'الجلسة جارية ومحفوظة سحابياً في Firebase (تستمر حتى لو أغلقت الموقع أو المتصفح)'
              : elapsedSeconds > 0
              ? 'الجلسة متوقفة مؤقتاً ومحفوظة سحابياً'
              : 'جاهز لبدء الجلسة والحفظ السحابي الفوري'}
          </span>
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

          {onCancelSession && elapsedSeconds > 0 && (
            <button
              className="btn"
              onClick={onCancelSession}
              style={{ padding: '12px 18px', fontSize: 14, borderColor: 'var(--danger)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RotateCcw size={15} />
              <span>إلغاء / تصفير</span>
            </button>
          )}

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
