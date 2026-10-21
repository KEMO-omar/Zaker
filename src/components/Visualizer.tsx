import React, { useRef, useEffect } from 'react';
import { Subject, Session } from '../types';

interface VisualizerProps {
  sessions: Session[];
  subjects: Subject[];
  mode: 'spiral' | 'gauge' | 'bars';
  onModeChange: (mode: 'spiral' | 'gauge' | 'bars') => void;
  totalStudyMinutes: number;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  sessions,
  subjects,
  mode,
  onModeChange,
  totalStudyMinutes
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Group study minutes by subject
  const subjectMinutesMap: Record<string, number> = {};
  subjects.forEach(s => { subjectMinutesMap[s.id] = 0; });

  sessions.forEach(sess => {
    if (sess.entries && sess.entries.length > 0) {
      const share = sess.minutes / sess.entries.length;
      sess.entries.forEach(e => {
        if (e.subj && subjectMinutesMap[e.subj] !== undefined) {
          subjectMinutesMap[e.subj] += share;
        } else if (e.subj) {
          subjectMinutesMap[e.subj] = (subjectMinutesMap[e.subj] || 0) + share;
        }
      });
    } else if (sess.subjId) {
      subjectMinutesMap[sess.subjId] = (subjectMinutesMap[sess.subjId] || 0) + sess.minutes;
    }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 320;
    const height = canvas.clientHeight || 320;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    if (mode === 'spiral') {
      // Continuous spiral visualizer
      const maxRadius = Math.min(centerX, centerY) - 15;
      const minRadius = 45;
      const numTurns = 3.5;
      const totalPoints = 360 * numTurns;

      // Draw background track
      ctx.beginPath();
      for (let i = 0; i <= totalPoints; i++) {
        const theta = (i * Math.PI) / 180;
        const progress = i / totalPoints;
        const r = minRadius + progress * (maxRadius - minRadius);
        const x = centerX + r * Math.cos(theta);
        const y = centerY + r * Math.sin(theta);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Target = 360 minutes (6 hours)
      const targetMins = 360;
      const fillRatio = Math.min(totalStudyMinutes / targetMins, 1);
      const fillPoints = Math.round(totalPoints * fillRatio);

      if (fillPoints > 0) {
        // Draw colored segments based on subjects
        let currentSubjectIndex = 0;
        let drawnPoints = 0;

        subjects.forEach((subj) => {
          const sMins = subjectMinutesMap[subj.id] || 0;
          if (sMins <= 0 || drawnPoints >= fillPoints) return;

          const subjRatio = sMins / Math.max(totalStudyMinutes, 1);
          const subjPoints = Math.round(fillPoints * subjRatio);
          const endPoint = Math.min(drawnPoints + subjPoints, fillPoints);

          ctx.beginPath();
          for (let i = drawnPoints; i <= endPoint; i++) {
            const theta = (i * Math.PI) / 180;
            const progress = i / totalPoints;
            const r = minRadius + progress * (maxRadius - minRadius);
            const x = centerX + r * Math.cos(theta);
            const y = centerY + r * Math.sin(theta);
            if (i === drawnPoints) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = subj.color;
          ctx.lineWidth = 7;
          ctx.lineCap = 'round';
          ctx.stroke();

          drawnPoints = endPoint;
          currentSubjectIndex++;
        });

        // Glow effect at tip
        if (drawnPoints > 0) {
          const theta = (drawnPoints * Math.PI) / 180;
          const progress = drawnPoints / totalPoints;
          const r = minRadius + progress * (maxRadius - minRadius);
          const x = centerX + r * Math.cos(theta);
          const y = centerY + r * Math.sin(theta);
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.shadowColor = '#56c2a6';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    } else if (mode === 'gauge') {
      // Concentric circular gauges for subjects
      const baseRadius = Math.min(centerX, centerY) - 20;
      const ringWidth = 8;
      const ringGap = 6;

      subjects.forEach((subj, idx) => {
        const r = baseRadius - idx * (ringWidth + ringGap);
        if (r < 30) return;

        // Background ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = ringWidth;
        ctx.stroke();

        // Active ring
        const sMins = subjectMinutesMap[subj.id] || 0;
        const target = subj.targetMinutes || 120;
        const pct = Math.min(sMins / target, 1);

        if (pct > 0) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, r, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
          ctx.strokeStyle = subj.color;
          ctx.lineWidth = ringWidth;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      });
    } else {
      // Horizontal comparative bars
      const barHeight = 18;
      const startY = 40;
      const maxBarWidth = width - 110;

      subjects.forEach((subj, idx) => {
        const y = startY + idx * 46;
        const sMins = Math.round(subjectMinutesMap[subj.id] || 0);
        const target = subj.targetMinutes || 120;
        const pct = Math.min(sMins / target, 1);

        // Subject name label
        ctx.fillStyle = '#f0f4f5';
        ctx.font = 'bold 12px Cairo, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(subj.name, width - 15, y + 14);

        // Bar track
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.roundRect(15, y, maxBarWidth, barHeight, 6);
        ctx.fill();

        // Bar fill
        if (pct > 0) {
          ctx.fillStyle = subj.color;
          ctx.beginPath();
          ctx.roundRect(15, y, Math.max(maxBarWidth * pct, 6), barHeight, 6);
          ctx.fill();
        }

        // Time label
        ctx.fillStyle = '#8b9ea3';
        ctx.font = '600 11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${sMins}m / ${target}m`, 20, y - 5);
      });
    }
  }, [sessions, subjects, mode, totalStudyMinutes]);

  const hours = Math.floor(totalStudyMinutes / 60);
  const mins = Math.round(totalStudyMinutes % 60);

  return (
    <div className="visualizer-wrap">
      <div className="canvas-holder">
        <canvas ref={canvasRef} />
        {mode !== 'bars' && (
          <div className="canvas-center-info">
            <div className="center-num tabular">{hours}h {mins < 10 ? `0${mins}` : mins}m</div>
            <div className="center-lbl">صافي المذاكرة</div>
          </div>
        )}
      </div>

      <div className="viz-switcher">
        <button
          className={`viz-btn ${mode === 'spiral' ? 'active' : ''}`}
          onClick={() => onModeChange('spiral')}
        >
          حلزوني متصل 🌀
        </button>
        <button
          className={`viz-btn ${mode === 'gauge' ? 'active' : ''}`}
          onClick={() => onModeChange('gauge')}
        >
          عدادات دائرية ⭕
        </button>
        <button
          className={`viz-btn ${mode === 'bars' ? 'active' : ''}`}
          onClick={() => onModeChange('bars')}
        >
          مقارنة المواد 📊
        </button>
      </div>
    </div>
  );
};
