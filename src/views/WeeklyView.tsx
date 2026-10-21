import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Subject, WeeklyTask } from '../types';

interface WeeklyViewProps {
  tasks: WeeklyTask[];
  subjects: Subject[];
  completedTaskIds: Set<string | number>;
  onToggleTask: (taskId: string | number) => void;
  onOpenNewTaskModal: () => void;
  onDeleteTask?: (taskId: string | number) => void;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  tasks,
  subjects,
  completedTaskIds,
  onToggleTask,
  onOpenNewTaskModal,
  onDeleteTask
}) => {
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedSubj, setSelectedSubj] = useState<string>('all');
  const [showPoster, setShowPoster] = useState<boolean>(true);
  const [showOverlaysOnPoster, setShowOverlaysOnPoster] = useState<boolean>(true);

  const days = [
    { id: 'all', label: 'الكل' },
    { id: 'sat', label: 'السبت' },
    { id: 'sun', label: 'الأحد' },
    { id: 'mon', label: 'الاثنين' },
    { id: 'tue', label: 'الثلاثاء' },
    { id: 'wed', label: 'الأربعاء' },
    { id: 'thu', label: 'الخميس' },
    { id: 'fri', label: 'الجمعة' },
    { id: 'backlog', label: 'المتراكم' }
  ];

  const filteredTasks = tasks.filter((t) => {
    if (selectedDay !== 'all' && t.dayId !== selectedDay) return false;
    if (selectedSubj !== 'all' && t.subjId !== selectedSubj) return false;
    return true;
  });

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => completedTaskIds.has(t.id) || completedTaskIds.has(String(t.id))).length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 4-day backlog poster tasks
  const posterTasks = tasks.filter((t) => t.overlay);

  const handleTaskCheck = (taskId: string | number, isAlreadyDone: boolean) => {
    onToggleTask(taskId);
    if (!isAlreadyDone) {
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {}
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(239, 83, 80, 0.2)', color: 'var(--danger)', fontWeight: 700 }}>عاجل 🔥</span>;
      case 'high':
        return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)', fontWeight: 700 }}>هام ⚡</span>;
      case 'class':
        return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.2)', color: 'var(--accent-secondary)', fontWeight: 700 }}>سنتر / حصة 🏛️</span>;
      case 'exam':
        return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(167, 139, 250, 0.2)', color: '#a78bfa', fontWeight: 700 }}>امتحان 📝</span>;
      default:
        return null;
    }
  };

  return (
    <section className="view-panel active">
      {/* Top Progress & Quick Actions */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>📅 جدول المهام الأسبوعية والمواعيد</span>
              <span className="tabular" style={{ fontSize: 13, color: 'var(--accent-primary)', background: 'var(--bg-elevated)', padding: '2px 10px', borderRadius: 'var(--radius-full)' }}>
                {completedCount} من {totalCount} منجز ({completionPct}%)
              </span>
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              متابعة الدروس الأونلاين والسناتر والمذاكرة أولاً بأول لتفادي تراكم المواد.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-sm"
              onClick={() => setShowPoster(!showPoster)}
              style={{ borderColor: showPoster ? 'var(--accent-primary)' : 'var(--border-subtle)', color: showPoster ? 'var(--accent-primary)' : 'var(--text-muted)' }}
            >
              <span>🖼️ {showPoster ? 'إخفاء بوستر المتراكم' : 'عرض بوستر المتراكم (43611.png)'}</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={onOpenNewTaskModal}>
              <span>➕ إضافة مهمة جديدة</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="stat-progress-bar" style={{ marginTop: 14, height: 6 }}>
          <div className="stat-progress-fill" style={{ width: `${completionPct}%`, background: 'linear-gradient(90deg, var(--accent-secondary), var(--accent-primary))' }} />
        </div>
      </div>

      {/* Interactive 4-Day Backlog Poster Section */}
      {showPoster && (
        <div className="card" style={{ marginBottom: 24, overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '14px 20px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)', display: 'inline-block' }} />
              <strong style={{ fontSize: 14, color: 'var(--text-main)' }}>
                صورة جدول المتراكم التفاعلية (اضغط على أي مهمة في الصورة لتحديدها)
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>إظهار التحديدات التفاعلية:</span>
              <button
                className="btn btn-sm"
                onClick={() => setShowOverlaysOnPoster(!showOverlaysOnPoster)}
                style={{ padding: '2px 10px', fontSize: 11 }}
              >
                {showOverlaysOnPoster ? 'مفعل ✅' : 'معطل ❌'}
              </button>
            </div>
          </div>

          <div style={{ position: 'relative', width: '100%', overflowX: 'auto', background: '#090d0f', padding: '16px 8px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', maxWidth: 1000, width: '100%', minWidth: 680, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <img
                src="43611.png"
                alt="جدول لم المتراكم في أربع أيام"
                style={{ width: '100%', height: 'auto', display: 'block' }}
                onError={(e) => {
                  (e.target as any).src = 'https://placehold.co/1000x700/0f1416/ffffff?text=جدول+لم+المتراكم+في+أربع+أيام';
                }}
              />

              {showOverlaysOnPoster && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}>
                  {posterTasks.map((t) => {
                    const isDone = completedTaskIds.has(t.id) || completedTaskIds.has(String(t.id));
                    const ov = t.overlay!;
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleTaskCheck(t.id, isDone)}
                        title={`${t.text} (${isDone ? 'مكتملة' : 'غير مكتملة'})`}
                        style={{
                          position: 'absolute',
                          left: `${ov.left}%`,
                          top: `${ov.top}%`,
                          width: `${ov.width}%`,
                          height: `${ov.height}%`,
                          cursor: 'pointer',
                          borderRadius: 4,
                          transition: 'all 0.2s ease',
                          background: isDone ? 'rgba(16, 185, 129, 0.45)' : 'rgba(56, 189, 248, 0.15)',
                          border: isDone ? '2px solid #10b981' : '1px solid rgba(56, 189, 248, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isDone && <span style={{ fontSize: 13, color: '#fff', fontWeight: 900 }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Day Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {days.map((d) => {
            const count = d.id === 'all'
              ? tasks.length
              : tasks.filter((t) => t.dayId === d.id).length;
            return (
              <button
                key={d.id}
                className={`btn btn-sm ${selectedDay === d.id ? 'btn-primary' : ''}`}
                onClick={() => setSelectedDay(d.id)}
                style={{ fontSize: 12 }}
              >
                <span>{d.label}</span>
                <span className="tabular" style={{ fontSize: 11, opacity: 0.8 }}>({count})</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>المادة:</span>
          <select
            className="input-field"
            style={{ margin: 0, padding: '4px 10px', fontSize: 12, width: 'auto' }}
            value={selectedSubj}
            onChange={(e) => setSelectedSubj(e.target.value)}
          >
            <option value="all">جميع المواد</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredTasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>
            لا توجد مهام مسجلة لهذا اليوم أو التصنيف المختار.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = completedTaskIds.has(task.id) || completedTaskIds.has(String(task.id));
            const subj = subjects.find((s) => s.id === task.subjId);

            return (
              <div
                key={task.id}
                className="log-item"
                style={{
                  opacity: isDone ? 0.65 : 1,
                  background: isDone ? 'rgba(255, 255, 255, 0.02)' : 'var(--bg-surface)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => handleTaskCheck(task.id, isDone)}
                    style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                          textDecoration: isDone ? 'line-through' : 'none'
                        }}
                      >
                        {task.text}
                      </span>
                      {getPriorityBadge(task.priority)}
                      {task.contextInfo && (
                        <span style={{ fontSize: 11, color: 'var(--accent-secondary)' }}>
                          • {task.contextInfo}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: subj?.color || '#56c2a6' }} />
                      <span>{subj?.name || task.subjId}</span>
                      <span>•</span>
                      <span>{task.dayId === 'backlog' ? 'متراكم' : task.dayId}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {onDeleteTask && (
                    <button
                      className="btn btn-sm"
                      onClick={() => onDeleteTask(task.id)}
                      title="حذف المهمة"
                      style={{ color: 'var(--danger)', padding: '4px 8px' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
