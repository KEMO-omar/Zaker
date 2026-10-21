import React, { useState } from 'react';
import { Session, Subject } from '../types';

interface LogViewProps {
  sessions: Session[];
  subjects: Subject[];
  onDeleteSession: (id: string) => void;
}

export const LogView: React.FC<LogViewProps> = ({
  sessions,
  subjects,
  onDeleteSession
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
              <span>📜 سجل إنجازات وجلسات المذاكرة</span>
              <span className="tabular" style={{ fontSize: 13, color: 'var(--accent-primary)', background: 'var(--bg-elevated)', padding: '2px 10px', borderRadius: 'var(--radius-full)' }}>
                {sessions.length} جلسة مسجلة ({totalHours} ساعة تراكمية)
              </span>
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              كافة جلسات المذاكرة الصافية مسجلة ومحفوظة بتفاصيلها وتاريخها.
            </p>
          </div>
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

        <input
          type="text"
          className="input-field"
          style={{ margin: 0, padding: '6px 12px', fontSize: 12, width: 220 }}
          placeholder="بحث في تفاصيل الجلسات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Sessions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredSessions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            لا توجد جلسات مذاكرة تطابق البحث أو الفلتر.
          </div>
        ) : (
          filteredSessions.map((sess) => {
            const dateStr = sess.tsStart
              ? new Date(sess.tsStart).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
              : (sess.date || 'جلسة سابقة');

            const primarySubjId = sess.entries?.[0]?.subj || sess.subjId || 'physics';
            const subj = subjects.find((s) => s.id === primarySubjId);
            const taskTitle = sess.entries?.map((e) => e.task).filter(Boolean).join(' | ') || 'مذاكرة مركزة';

            return (
              <div key={sess.id} className="log-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 10,
                      height: 44,
                      borderRadius: 4,
                      background: subj?.color || 'var(--accent-primary)',
                      flexShrink: 0
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                        {taskTitle}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: 'var(--bg-elevated)',
                          color: subj?.color || 'var(--accent-primary)',
                          fontWeight: 700
                        }}
                      >
                        {subj?.name || primarySubjId}
                      </span>
                    </div>
                    <div className="tabular" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {dateStr}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="tabular" style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {Math.round(sess.minutes)} دقيقة ({((sess.minutes || 0) / 60).toFixed(1)}h)
                  </div>

                  <button
                    className="btn btn-sm"
                    onClick={() => onDeleteSession(sess.id)}
                    title="حذف الجلسة"
                    style={{ color: 'var(--danger)', padding: '4px 8px' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
