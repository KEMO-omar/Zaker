import React, { useState } from 'react';
import { Subject, Lecture } from '../types';
import {
  BookOpen,
  Plus,
  Search,
  Calendar,
  Package,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  Check
} from 'lucide-react';

interface LecturesViewProps {
  lectures: Lecture[];
  subjects: Subject[];
  onToggleLecture: (id: string) => void;
  onOpenNewLectureModal: () => void;
  onOpenEditLecture: (lecture: Lecture) => void;
  onDeleteLecture: (id: string) => void;
}

export const LecturesView: React.FC<LecturesViewProps> = ({
  lectures,
  subjects,
  onToggleLecture,
  onOpenNewLectureModal,
  onOpenEditLecture,
  onDeleteLecture
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
              <BookOpen size={20} style={{ color: 'var(--accent-primary)' }} />
              <span>محاضرات المنصات والسناتر (فيزياء، عربي، إنجليزي، تاريخ)</span>
              <span className="tabular" style={{ fontSize: 13, color: 'var(--accent-primary)', background: 'var(--bg-elevated)', padding: '2px 10px', borderRadius: 'var(--radius-full)' }}>
                {doneCount} من {total} مكتمل ({pct}%)
              </span>
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
              متابعة باقات منصة مستر عبد المعبود ومستر محمد صلاح وسناتر الإنجليزي والتاريخ مع إمكانية تعديل وحذف أي محاضرة.
            </p>
          </div>

          <button className="btn btn-primary btn-sm" onClick={onOpenNewLectureModal}>
            <Plus size={14} />
            <span>إضافة محاضرة جديدة</span>
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
            <option value="pending">المتبقية فقط</option>
            <option value="done">المكتملة فقط</option>
          </select>

          <div style={{ position: 'relative', width: 200 }}>
            <input
              type="text"
              className="input-field"
              style={{ margin: 0, paddingRight: 32, paddingLeft: 10, fontSize: 12 }}
              placeholder="بحث في المحاضرات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          </div>
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
                  opacity: lec.isDone ? 0.75 : 1,
                  borderLeft: `4px solid ${subj?.color || 'var(--accent-primary)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 18
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: subj?.color || 'var(--accent-primary)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 6 }}>
                      {lec.code}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {lec.tag && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.04)', padding: '2px 6px', borderRadius: 4 }}>
                          {lec.tag}
                        </span>
                      )}
                      <button
                        className="btn btn-sm"
                        onClick={() => onOpenEditLecture(lec)}
                        title="تعديل المحاضرة"
                        style={{ padding: '3px 6px', fontSize: 11, color: 'var(--text-muted)' }}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => onDeleteLecture(lec.id)}
                        title="حذف المحاضرة"
                        style={{ padding: '3px 6px', fontSize: 11, color: 'var(--danger)', borderColor: 'rgba(239, 83, 80, 0.2)' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8, lineHeight: 1.4 }}>
                    {lec.title}
                  </h3>

                  {lec.details && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
                      {lec.details}
                    </p>
                  )}

                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={12} style={{ color: 'var(--accent-secondary)' }} />
                      <span>المواعيد: <strong style={{ color: 'var(--text-main)' }}>{lec.dueDay || 'أسبوعي'}</strong></span>
                    </div>
                    {lec.packageName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Package size={12} style={{ color: 'var(--accent-primary)' }} />
                        <span>{lec.packageName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                  <button
                    className={`btn btn-sm ${lec.isDone ? '' : 'btn-primary'}`}
                    onClick={() => onToggleLecture(lec.id)}
                    style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Check size={13} />
                    <span>{lec.isDone ? 'تم الاستماع والمذاكرة' : 'تمييز كمكتملة'}</span>
                  </button>
                  <span style={{ fontSize: 11, color: lec.isDone ? 'var(--success)' : 'var(--warning)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {lec.isDone ? (
                      <>
                        <CheckCircle2 size={13} />
                        <span>مكتمل</span>
                      </>
                    ) : (
                      <>
                        <Clock size={13} />
                        <span>قيد الانتظار</span>
                      </>
                    )}
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
