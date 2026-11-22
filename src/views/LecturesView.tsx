import React, { useMemo, useState } from 'react';
import { Subject, Lecture } from '../types';
import {
  LECTURE_TRACKS,
  getLectureTrack,
  sortLecturesByOrder,
  autoSortLecturesByCode,
  reindexLectures
} from '../utils/scheduleEngine';
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
  Check,
  Zap,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ArrowUpDown,
  GripVertical,
  GitBranch
} from 'lucide-react';

interface LecturesViewProps {
  lectures: Lecture[];
  subjects: Subject[];
  onToggleLecture: (id: string) => void;
  onOpenNewLectureModal: () => void;
  onOpenEditLecture: (lecture: Lecture) => void;
  onDeleteLecture: (id: string) => void;
  onReorderLectures?: (reordered: Lecture[]) => void;
  onStartFocus?: (subjId: string) => void;
}

export const LecturesView: React.FC<LecturesViewProps> = ({
  lectures,
  subjects,
  onToggleLecture,
  onOpenNewLectureModal,
  onOpenEditLecture,
  onDeleteLecture,
  onReorderLectures,
  onStartFocus
}) => {
  const [selectedSubj, setSelectedSubj] = useState<string>('all');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const orderedLectures = useMemo(() => sortLecturesByOrder(lectures), [lectures]);

  // Count per independent track (so dual Arabic tracks stay clearly visible)
  const trackCounts = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    LECTURE_TRACKS.forEach((t) => {
      map[t.id] = { total: 0, done: 0 };
    });
    orderedLectures.forEach((lec) => {
      const tr = getLectureTrack(lec);
      if (!map[tr.id]) map[tr.id] = { total: 0, done: 0 };
      map[tr.id].total += 1;
      if (lec.isDone) map[tr.id].done += 1;
    });
    return map;
  }, [orderedLectures]);

  const filteredLectures = useMemo(() => {
    return orderedLectures.filter((lec) => {
      if (selectedSubj !== 'all' && lec.subjId !== selectedSubj) return false;
      if (selectedTrack !== 'all' && getLectureTrack(lec).id !== selectedTrack) return false;
      if (filterStatus === 'pending' && lec.isDone) return false;
      if (filterStatus === 'done' && !lec.isDone) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          lec.title.toLowerCase().includes(q) ||
          lec.code.toLowerCase().includes(q) ||
          (lec.details && lec.details.toLowerCase().includes(q)) ||
          (lec.packageName && lec.packageName.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [orderedLectures, selectedSubj, selectedTrack, filterStatus, searchQuery]);

  // Map each lecture ID to its 1-based position within its OWN TRACK
  // (Arabic Muhammad Salah #1..N stays completely separate from Arabic Taqwa Marzouq #1..N!)
  const trackOrderMap = useMemo(() => {
    const counts: Record<string, number> = {};
    const map = new Map<string, { seq: number; trackLabel: string; trackId: string }>();
    orderedLectures.forEach((lec) => {
      const tr = getLectureTrack(lec);
      counts[tr.id] = (counts[tr.id] || 0) + 1;
      map.set(lec.id, { seq: counts[tr.id], trackLabel: tr.shortLabel, trackId: tr.id });
    });
    return map;
  }, [orderedLectures]);

  const total = lectures.length;
  const doneCount = lectures.filter((l) => l.isDone).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  // Swap/Move lecture inside visible list (preserves track boundaries cleanly!)
  const moveLectureRelative = (lecId: string, direction: 'up' | 'down' | 'top') => {
    if (!onReorderLectures) return;
    const visIdx = filteredLectures.findIndex((l) => l.id === lecId);
    if (visIdx === -1) return;

    const fullList = [...orderedLectures];
    const fromFullIdx = fullList.findIndex((l) => l.id === lecId);
    if (fromFullIdx === -1) return;

    if (direction === 'top') {
      const targetFirst = filteredLectures[0];
      if (!targetFirst || targetFirst.id === lecId) return;
      const toFullIdx = fullList.findIndex((l) => l.id === targetFirst.id);
      const [item] = fullList.splice(fromFullIdx, 1);
      fullList.splice(toFullIdx, 0, item);
      onReorderLectures(reindexLectures(fullList));
      return;
    }

    const neighborVisIdx = direction === 'up' ? visIdx - 1 : visIdx + 1;
    if (neighborVisIdx < 0 || neighborVisIdx >= filteredLectures.length) return;
    const neighborId = filteredLectures[neighborVisIdx].id;
    const toFullIdx = fullList.findIndex((l) => l.id === neighborId);
    if (toFullIdx === -1) return;

    [fullList[fromFullIdx], fullList[toFullIdx]] = [fullList[toFullIdx], fullList[fromFullIdx]];
    onReorderLectures(reindexLectures(fullList));
  };

  const handleDropReorder = (targetId: string) => {
    if (!onReorderLectures || !draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const fullList = [...orderedLectures];
    const fromIdx = fullList.findIndex((l) => l.id === draggedId);
    const toIdx = fullList.findIndex((l) => l.id === targetId);
    if (fromIdx === -1 || toIdx === -1) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const [moved] = fullList.splice(fromIdx, 1);
    fullList.splice(toIdx, 0, moved);
    onReorderLectures(reindexLectures(fullList));
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleAutoSortByCode = () => {
    if (!onReorderLectures) return;
    onReorderLectures(autoSortLecturesByCode(orderedLectures, selectedTrack !== 'all' ? selectedTrack : undefined));
  };

  const handleSelectSubject = (subjId: string) => {
    setSelectedSubj(subjId);
    if (subjId === 'all') {
      setSelectedTrack('all');
    } else if (subjId === 'arabic') {
      // If currently filtering non-arabic track, reset track filter so both Arabic tracks show
      if (selectedTrack !== 'arabic_salah' && selectedTrack !== 'arabic_taqwa') {
        setSelectedTrack('all');
      }
    } else {
      setSelectedTrack(subjId);
    }
  };

  const handleSelectTrack = (trackId: string) => {
    setSelectedTrack(trackId);
    if (trackId === 'all') {
      setSelectedSubj('all');
    } else {
      const tr = LECTURE_TRACKS.find((t) => t.id === trackId);
      if (tr) setSelectedSubj(tr.subjId);
    }
  };

  return (
    <section className="view-panel active">
      {/* Header Banner */}
      <div className="card" style={{ marginBottom: 16, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
              <BookOpen size={20} style={{ color: 'var(--accent-primary)' }} />
              <span>محاضرات المنصات والسناتر (نظام المسارات والترتيب المزدوج)</span>
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.6, marginBottom: 0 }}>
              <strong className="tabular" style={{ color: 'var(--accent-primary)' }}>{doneCount}</strong> من <strong className="tabular">{total}</strong> مكتمل (<span className="tabular">{pct}%</span>)
              {' · '}
              للعربي مساران مستقلان تماماً: <strong>أ. محمد صلاح (منصة)</strong> و <strong>أ. تقوى مرزوق (سنتر)</strong> — رتّب كل مسار بالأسهم أو بالسحب أو من زر تعديل رقم الترتيب!
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {onReorderLectures && (
              <button
                className="btn btn-sm"
                onClick={handleAutoSortByCode}
                title="ترتيب المحاضرات تلقائياً من الدرس الأول للأخير داخل المسار"
                style={{ fontWeight: 700, borderColor: 'var(--border-active)', color: 'var(--accent-primary)' }}
              >
                <ArrowUpDown size={14} />
                <span>
                  {selectedTrack !== 'all' ? 'ترتيب هذا المسار تلقائياً (00 ← 99)' : 'ترتيب كل مسار تلقائياً (00 ← 99)'}
                </span>
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={onOpenNewLectureModal} style={{ fontWeight: 700 }}>
              <Plus size={14} />
              <span>إضافة محاضرة جديدة</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="stat-progress-bar" style={{ marginTop: 14, height: 6 }}>
          <div className="stat-progress-fill" style={{ width: `${pct}%`, background: 'var(--accent-primary)' }} />
        </div>
      </div>

      {/* Subject Filter Strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${selectedSubj === 'all' ? 'btn-primary' : ''}`}
            onClick={() => handleSelectSubject('all')}
          >
            جميع المواد (<span className="tabular">{lectures.length}</span>)
          </button>
          {subjects.map((s) => {
            const count = lectures.filter((l) => l.subjId === s.id).length;
            return (
              <button
                key={s.id}
                className={`btn btn-sm ${selectedSubj === s.id ? 'btn-primary' : ''}`}
                onClick={() => handleSelectSubject(s.id)}
              >
                {s.name} (<span className="tabular">{count}</span>)
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

          <div style={{ position: 'relative', width: 210 }}>
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

      {/* Independent Track Switcher (Dual Arabic Tracks Clearly Separated!) */}
      <div
        className="card"
        style={{
          padding: '10px 14px',
          marginBottom: 16,
          background: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap'
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-secondary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <GitBranch size={14} />
          <span>مسارات الترتيب المستقلة:</span>
        </span>
        <button
          type="button"
          className={`btn btn-sm ${selectedTrack === 'all' ? 'btn-primary' : ''}`}
          onClick={() => handleSelectTrack('all')}
          style={{ fontSize: 11.5 }}
        >
          كل المسارات
        </button>
        {LECTURE_TRACKS.map((tr) => {
          const stats = trackCounts[tr.id] || { total: 0, done: 0 };
          const active = selectedTrack === tr.id;
          const isArabicTrack = tr.subjId === 'arabic';
          return (
            <button
              key={tr.id}
              type="button"
              className={`btn btn-sm ${active ? 'btn-primary' : ''}`}
              onClick={() => handleSelectTrack(tr.id)}
              style={{
                fontSize: 11.5,
                fontWeight: active || isArabicTrack ? 700 : 600,
                borderColor: !active && isArabicTrack ? 'rgba(245, 158, 11, 0.45)' : undefined
              }}
            >
              <span>{tr.shortLabel}</span>
              <span className="tabular" style={{ opacity: 0.85, fontSize: 11 }}>
                ({stats.done}/{stats.total})
              </span>
            </button>
          );
        })}
      </div>

      {/* Lectures Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 14 }}>
        {filteredLectures.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            لا توجد محاضرات تطابق الفلتر أو البحث.
          </div>
        ) : (
          filteredLectures.map((lec, visIndex) => {
            const subj = subjects.find((s) => s.id === lec.subjId);
            const trackMeta = trackOrderMap.get(lec.id);
            const trackSeq = trackMeta?.seq || visIndex + 1;
            const trackShort = trackMeta?.trackLabel || subj?.name || lec.subjId;
            const isCenter =
              lec.tag === 'سنتر' ||
              lec.type === 'center' ||
              (lec.dueDay && lec.dueDay.includes('سنتر')) ||
              (lec.packageName && lec.packageName.includes('سنتر'));
            const isDragTarget = dragOverId === lec.id && draggedId !== lec.id;

            return (
              <div
                key={lec.id}
                draggable={Boolean(onReorderLectures)}
                onDragStart={() => setDraggedId(lec.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverId !== lec.id) setDragOverId(lec.id);
                }}
                onDragLeave={() => {
                  if (dragOverId === lec.id) setDragOverId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropReorder(lec.id);
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDragOverId(null);
                }}
                className="card"
                style={{
                  opacity: lec.isDone ? 0.8 : 1,
                  border: isDragTarget
                    ? '1.5px dashed var(--accent-primary)'
                    : '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 16,
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                  transform: draggedId === lec.id ? 'scale(0.98)' : 'none'
                }}
              >
                <div>
                  {/* Top Bar: Track Sequence Number + Track Label + Ordering & Edit Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      {onReorderLectures && (
                        <span
                          title="اسحب لإعادة الترتيب"
                          style={{ color: 'var(--text-faint)', cursor: 'grab', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
                        >
                          <GripVertical size={14} />
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenEditLecture(lec)}
                        title="اضغط لتعديل رقم ترتيب المحاضرة أو مسارها"
                        className="tabular"
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: subj?.color || 'var(--accent-primary)',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 6,
                          padding: '2px 7px',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        #{trackSeq}
                      </button>
                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {trackShort} · {lec.code} · {isCenter ? 'سنتر' : 'منصة'}
                      </span>
                    </div>

                    {/* Reorder + Edit/Delete Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      {onReorderLectures && (
                        <>
                          <button
                            className="btn btn-sm"
                            onClick={() => moveLectureRelative(lec.id, 'top')}
                            disabled={visIndex === 0}
                            title="تقديم لبداية المسار (الأولوية #1)"
                            style={{ padding: '4px 6px', opacity: visIndex === 0 ? 0.35 : 1 }}
                          >
                            <ChevronsUp size={13} />
                          </button>
                          <button
                            className="btn btn-sm"
                            onClick={() => moveLectureRelative(lec.id, 'up')}
                            disabled={visIndex === 0}
                            title="تقديم خطوة للأول"
                            style={{ padding: '4px 6px', opacity: visIndex === 0 ? 0.35 : 1 }}
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            className="btn btn-sm"
                            onClick={() => moveLectureRelative(lec.id, 'down')}
                            disabled={visIndex === filteredLectures.length - 1}
                            title="تأخير خطوة للآخر"
                            style={{ padding: '4px 6px', opacity: visIndex === filteredLectures.length - 1 ? 0.35 : 1 }}
                          >
                            <ArrowDown size={13} />
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn-sm"
                        onClick={() => onOpenEditLecture(lec)}
                        title="تعديل المحاضرة وترتيبها"
                        style={{ padding: '4px 6px', color: 'var(--text-muted)' }}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => onDeleteLecture(lec.id)}
                        title="حذف المحاضرة"
                        style={{ padding: '4px 6px', color: 'var(--danger)' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6, lineHeight: 1.45 }}>
                    {lec.title}
                  </h3>

                  {lec.details && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
                      {lec.details}
                    </p>
                  )}

                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={12} style={{ color: 'var(--accent-secondary)', flexShrink: 0 }} />
                      <span>المواعيد: <strong style={{ color: 'var(--text-main)' }}>{lec.dueDay || 'أسبوعي'}</strong></span>
                    </div>
                    {lec.packageName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Package size={12} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                        <span>{lec.packageName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      className={`btn btn-sm ${lec.isDone ? '' : 'btn-primary'}`}
                      onClick={() => onToggleLecture(lec.id)}
                      style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Check size={13} />
                      <span>{lec.isDone ? 'تم الإنجاز' : 'تمييز كمكتملة'}</span>
                    </button>
                    {onStartFocus && !lec.isDone && (
                      <button
                        className="btn btn-sm"
                        onClick={() => onStartFocus(lec.subjId)}
                        style={{
                          fontSize: 11,
                          padding: '4px 10px',
                          color: 'var(--accent-secondary)',
                          borderColor: 'rgba(56, 189, 248, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="بدء جلسة تركيز لهذه المحاضرة"
                      >
                        <Zap size={11} fill="currentColor" />
                        <span>ذاكر الآن</span>
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: 11.5, color: lec.isDone ? 'var(--success)' : 'var(--warning)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
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
