import React, { useState } from 'react';
import { Session, Subject } from '../types';
import {
  History,
  Calendar,
  Search,
  Trash2,
  Clock,
  BookOpen,
  Plus
} from 'lucide-react';

interface LogViewProps {
  sessions: Session[];
  subjects: Subject[];
  onDeleteSession: (id: string) => void;
  onOpenManualSession?: () => void;
}

export const LogView: React.FC<LogViewProps> = ({
  sessions,
  subjects,
  onDeleteSession,
  onOpenManualSession
}) => {
  const [selectedSubj, setSelectedSubj] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter((s) => {
    if (selectedSubj !== 'all') {
      const hasSubj = (s.entries && s.entries.some((e) => e.subj === selectedSubj)) || s.subjId === selectedSubj;
      if (!hasSubj) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEntries = s.entries && s.entries.some((e) => (e.task || '').toLowerCase().includes(q));
      if (!matchEntries) return false;
    }
    return true;
  });

  const totalMinutes = sessions.reduce((acc, s) => acc + (s.minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <section className="view-panel active">
      {/* Top Banner */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <History size={20} style={{ color: 'var(--accent-primary)' }} />
              <span>سجل إنجازات وجلسات المذاكرة</span>
              <span className="tabular" style={{ fontSize: 13, color: 'var(--accent-primary)', background: 'var(--bg-elevated)', padding: '2px 10px', borderRadius: 'var(--radius-full)' }}>
                {sessions.length} جلسة مسجلة ({totalHours} ساعة تراكمية)
              </span>
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
              كافة جلسات المذاكرة الصافية مسجلة ومحفوظة بتفاصيلها وتاريخها.
            </p>
          </div>
          {onOpenManualSession && (
            <button
              className="btn btn-primary btn-sm"
              onClick={onOpenManualSession}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <Plus size={14} />
              <span>تسجيل جلسة يدوية</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${selectedSubj === 'all' ? 'btn-primary' : ''}`}
            onClick={() => setSelectedSubj('all')}
          >
            جميع المواد ({sessions.length})
          </button>
          {subjects.map((s) => {
            const count = sessions.filter((sess) =>
              (sess.entries && sess.entries.some((e) => e.subj === s.id)) || sess.subjId === s.id
            ).length;
            return (
              <button
                key={s.id}
                className={`btn btn-sm ${selectedSubj === s.id ? 'btn-primary' : ''}`}
                onClick={() => setSelectedSubj(s.id)}
              >
                {s.name} ({count})
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', width: 220 }}>
          <input
            type="text"
            className="input-field"
            style={{ margin: 0, paddingRight: 32, paddingLeft: 10, fontSize: 12 }}
            placeholder="بحث في تفاصيل الجلسات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Sessions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredSessions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            لا توجد جلسات مذاكرة تطابق البحث أو الفلتر.
          </div>
        ) : (
          filteredSessions.map((sess, idx) => {
            const sessionKey = sess.id || sess.fbKey || `sess_${sess.tsStart || sess.tsEnd || idx}`;
            const dateStr = sess.tsStart
              ? new Date(sess.tsStart).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
              : (sess.date || 'جلسة سابقة');

            const firstSubjId = (sess.entries && sess.entries[0]?.subj) || sess.subjId;
            const subj = subjects.find((s) => s.id === firstSubjId);
            const taskText = (sess.entries && sess.entries.map((e) => e.task).join(' + ')) || 'مذاكرة مركزة';

            return (
              <div
                key={sessionKey}
                className="log-item"
                style={{
                  borderLeft: `4px solid ${subj?.color || 'var(--accent-primary)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-elevated)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <span className="tabular" style={{ fontSize: 15, fontWeight: 800, color: subj?.color || 'var(--accent-primary)' }}>
                      {sess.minutes}
                    </span>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>دقيقة</span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                        {taskText}
                      </span>
                      <span style={{ fontSize: 11, color: subj?.color || 'var(--accent-primary)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                        {subj?.name || firstSubjId || 'مادة عامة'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={11} />
                      <span className="tabular">{dateStr}</span>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-sm"
                  onClick={() => {
                    const sId = sess.id || sess.fbKey || (sess.tsStart ? `ts_${sess.tsStart}` : '');
                    if (sId) onDeleteSession(sId);
                  }}
                  title="حذف الجلسة"
                  style={{ color: 'var(--danger)', borderColor: 'rgba(239, 83, 80, 0.25)', padding: '6px 8px' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
