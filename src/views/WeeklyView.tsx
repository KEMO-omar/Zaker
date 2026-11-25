import React, { useState } from 'react';
import { Subject, WeeklyTask, Session, ExamRecord, Lecture, ArchivedWeek, ChangelogEntry, OfficialExam } from '../types';
import { PastWeeksAnalytics } from '../components/PastWeeksAnalytics';
import { DynamicScheduleBoard } from '../components/DynamicScheduleBoard';
import { CalendarCheck, BarChart3 } from 'lucide-react';

interface WeeklyViewProps {
  tasks: WeeklyTask[];
  subjects: Subject[];
  completedTaskIds: Set<string | number>;
  onToggleTask: (taskId: string | number) => void;
  onOpenNewTaskModal: (initialDate?: string) => void;
  onOpenEditTask: (task: WeeklyTask) => void;
  onDeleteTask?: (taskId: string | number) => void;
  onUpdateAllTasks?: (tasks: WeeklyTask[]) => void;
  sessions?: Session[];
  exams?: ExamRecord[];
  lectures?: Lecture[];
  onStartFocus?: (subjId: string) => void;
  archivedWeeks?: ArchivedWeek[];
  onArchiveWeek?: (archive: ArchivedWeek, cleanTasks: WeeklyTask[]) => void;
  onOpenNotificationsCenter?: () => void;
  activeWeekStartKey?: string;
  changelog?: ChangelogEntry[];
  officialExams?: OfficialExam[];
  onLogEvent?: (entry: Omit<ChangelogEntry, 'id' | 'timestamp'>) => void;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  tasks,
  subjects,
  completedTaskIds,
  onToggleTask,
  onOpenNewTaskModal,
  onOpenEditTask,
  onDeleteTask,
  onUpdateAllTasks,
  sessions = [],
  exams = [],
  lectures = [],
  onStartFocus,
  archivedWeeks = [],
  onArchiveWeek,
  onOpenNotificationsCenter,
  activeWeekStartKey,
  changelog = [],
  officialExams = [],
  onLogEvent
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'history'>('tasks');

  return (
    <section className="view-panel active">
      {/* Clean Single Top Header & Segmented Switcher */}
      <div
        style={{
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--accent-glow)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <CalendarCheck size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1.25 }}>
              الجدول الأسبوعي والمهام
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              كل التعديلات والتبديلات والتواريخ والإنجاز تُحفظ تلقائياً حتى 15 خانة يومياً
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            gap: 4,
            padding: 4,
            background: 'var(--bg-surface)',
            borderRadius: 10,
            border: '1px solid var(--border-subtle)'
          }}
        >
          <button
            type="button"
            className={`btn btn-sm ${activeSubTab === 'tasks' ? 'btn-primary' : ''}`}
            onClick={() => setActiveSubTab('tasks')}
            style={{
              fontWeight: 700,
              whiteSpace: 'nowrap',
              border: activeSubTab === 'tasks' ? undefined : 'none',
              background: activeSubTab === 'tasks' ? undefined : 'transparent'
            }}
          >
            <CalendarCheck size={14} />
            <span>الجدول والمهام</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeSubTab === 'history' ? 'btn-primary' : ''}`}
            onClick={() => setActiveSubTab('history')}
            style={{
              fontWeight: 700,
              whiteSpace: 'nowrap',
              border: activeSubTab === 'history' ? undefined : 'none',
              background: activeSubTab === 'history' ? undefined : 'transparent'
            }}
          >
            <BarChart3 size={14} />
            <span>تحليلات الأسابيع السابقة</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'tasks' && (
        <DynamicScheduleBoard
          tasks={tasks}
          subjects={subjects}
          completedTaskIds={completedTaskIds}
          onToggleTask={onToggleTask}
          onOpenNewTaskModal={() => onOpenNewTaskModal()}
          onOpenNewTaskForDate={(dateStr) => onOpenNewTaskModal(dateStr)}
          onOpenEditTask={onOpenEditTask}
          onDeleteTask={onDeleteTask}
          onUpdateAllTasks={onUpdateAllTasks}
          archivedWeeks={archivedWeeks}
          onArchiveWeek={onArchiveWeek}
          lectures={lectures}
          onOpenNotificationsCenter={onOpenNotificationsCenter}
          activeWeekStartKey={activeWeekStartKey}
          changelog={changelog}
          officialExams={officialExams}
          onLogEvent={onLogEvent}
        />
      )}

      {activeSubTab === 'history' && (
        <PastWeeksAnalytics
          sessions={sessions}
          subjects={subjects}
          exams={exams}
          weeklyTasks={tasks}
          completedTaskIds={completedTaskIds}
          lectures={lectures}
          archivedWeeks={archivedWeeks}
          onStartFocus={onStartFocus}
        />
      )}
    </section>
  );
};
