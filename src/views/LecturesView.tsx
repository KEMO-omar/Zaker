import React, { useState } from 'react';
import { Subject, Lecture } from '../types';

interface LecturesViewProps {
  lectures: Lecture[];
  subjects: Subject[];
  onToggleLecture: (id: string) => void;
  onOpenNewLectureModal: () => void;
}

export const LecturesView: React.FC<LecturesViewProps> = ({
  lectures,
  subjects,
  onToggleLecture,
  onOpenNewLectureModal
}) => {
  const [selectedSubj, setSelectedSubj] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLectures = lectures.filter((lec) => {
    if (selectedSubj !== 'all' && lec.subjId !== selectedSubj) return false;
    if (filterStatus === 'pending' && lec.isDone) return false;
    if (filterStatus === 'done' && !lec.isDone) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = lec.title.toLowerCase().includes(q) ||
                    lec.code.toLowerCase().includes(q) ||
                    (lec.details && lec.details.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const total = lectures.length;
  const doneCount = lectures.filter((l) => l.isDone).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <section className="view-panel active">
      {/* Header Banner */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>📚 محاضرات المنصات والسناتر (فيزياء، عربي، إنجليزي، تاريخ)</span>
              <span className="tabular" style={{ fontSize: 13, color: 'var(--accent-primary)', background: 'var(--bg-elevated)', padding: '2px 10px', borderRadius: 'var(--radius-full)' }}>
                {doneCount} من {total} مكتمل ({pct}%)
              </span>
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              متابعة باقات منصة مستر عبد المعبود ومستر محمد صلاح وسناتر الإنجليزي والتاريخ.
            </p>
          </div>

          <button className="btn btn-primary btn-sm" onClick={onOpenNewLectureModal}>
            <span>➕ إضافة محاضرة جديدة</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="stat-progress-bar" style={{ marginTop: 14, height: 6 }}>
          <div className="stat-progress-fill" style={{ width: `${pct}%`, background: 'var(--accent-primary)' }} />
        </div>
      </div>

      {/* Filters & Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${selectedSubj === 'all' ? 'btn-primary' : ''}`}
            onClick={() => setSelectedSubj('all')}
          >
            جميع المواد ({lectures.length})
          </button>
          {subjects.map((s) => {
            const count = lectures.filter((l) => l.subjId === s.id).length;
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select
            className="input-field"
            style={{ margin: 0, padding: '6px 12px', fontSize: 12, width: 'auto' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">كل الحالات</option>
            <option value="pending">المتبقية فقط ⏳</option>
            <option value="done">المكتملة فقط ✅</option>
          </select>

          <input
            type="text"
            className="input-field"
            style={{ margin: 0, padding: '6px 12px', fontSize: 12, width: 200 }}
            placeholder="بحث في المحاضرات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Lectures Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filteredLectures.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            لا توجد محاضرات تطابق الفلتر أو البحث.
          </div>
        ) : (
          filteredLectures.map((lec) => {
            const subj = subjects.find((s) => s.id === lec.subjId);
            return (
              <div
                key={lec.id}
                className="card"
                style={{
                  opacity: lec.isDone ? 0.7 : 1,
                  borderLeft: `4px solid ${subj?.color || 'var(--accent-primary)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: subj?.color || 'var(--accent-primary)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 6 }}>
                    {lec.code}
                  </span>
                  {lec.tag && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.04)', padding: '2px 6px', borderRadius: 4 }}>
                      {lec.tag}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                  {lec.title}
                </h3>

                {lec.details && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
                    {lec.details}
                  </p>
                )}

                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>📅 المواعيد: <strong style={{ color: 'var(--text-main)' }}>{lec.dueDay || 'أسبوعي'}</strong></div>
                  {lec.packageName && <div>📦 {lec.packageName}</div>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                  <button
                    className={`btn btn-sm ${lec.isDone ? '' : 'btn-primary'}`}
                    onClick={() => onToggleLecture(lec.id)}
                    style={{ fontSize: 12 }}
                  >
                    {lec.isDone ? '✓ تم الاستماع والمذاكرة' : 'تمييز كمكتملة 🎯'}
                  </button>
                  <span style={{ fontSize: 11, color: lec.isDone ? 'var(--success)' : 'var(--warning)', fontWeight: 700 }}>
                    {lec.isDone ? '✅ مكتمل' : '⏳ قيد الانتظار'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
