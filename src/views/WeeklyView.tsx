import React, { useState } from 'react';
import { Subject, WeeklyTask, Session, ExamRecord, Lecture, ArchivedWeek } from '../types';
import { PastWeeksAnalytics } from '../components/PastWeeksAnalytics';
import { DynamicScheduleBoard } from '../components/DynamicScheduleBoard';
import {
  Calendar,
  CalendarCheck,
  BarChart3,
  Layers,
  Sparkles
} from 'lucide-react';

interface WeeklyViewProps {
  tasks: WeeklyTask[];
  subjects: Subject[];
  completedTaskIds: Set<string | number>;
  onToggleTask: (taskId: string | number) => void;
  onOpenNewTaskModal: () => void;
  onOpenEditTask: (task: WeeklyTask) => void;
  onDeleteTask?: (taskId: string | number) => void;
  onUpdateAllTasks?: (tasks: WeeklyTask[]) => void;
  sessions?: Session[];
  exams?: ExamRecord[];
  lectures?: Lecture[];
  onStartFocus?: (subjId: string) => void;
  archivedWeeks?: ArchivedWeek[];
  onArchiveWeek?: (archive: ArchivedWeek, cleanTasks: WeeklyTask[]) => void;
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
  onArchiveWeek
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'history'>('tasks');

  return (
    <section className="view-panel active">
      {/* Top Navigation Deck */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarCheck size={24} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>نظام الجداول الأسبوعية والأتمتة الذكية</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(86, 194, 166, 0.15)', color: 'var(--accent-primary)', fontWeight: 700 }}>
                  محدث ومربوط بالبوستر التفاعلي
                </span>
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                توزيع مواعيد السناتر والمنصات وتوليد صورة الجدول المحدث وحساب بومودورو اليومي.
              </p>
            </div>
          </div>

          {/* Sub-tab Switcher: Dynamic Board vs History Analytics */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-sm ${activeSubTab === 'tasks' ? 'btn-primary' : ''}`}
              onClick={() => setActiveSubTab('tasks')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <CalendarCheck size={14} />
              <span>جدول الأسبوع التفاعلي والمهام</span>
            </button>
            <button
              className={`btn btn-sm ${activeSubTab === 'history' ? 'btn-primary' : ''}`}
              onClick={() => setActiveSubTab('history')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 700,
                background: activeSubTab === 'history' ? 'var(--accent-primary)' : 'rgba(56, 189, 248, 0.1)',
                borderColor: activeSubTab === 'history' ? 'var(--accent-primary)' : 'rgba(56, 189, 248, 0.3)',
                color: activeSubTab === 'history' ? '#000' : 'var(--accent-secondary)'
              }}
            >
              <BarChart3 size={14} />
              <span>مخطط وأرشيف الأسابيع السابقة ⚡</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-tab 1: Dynamic Interactive Schedule Board */}
      {activeSubTab === 'tasks' && (
        <DynamicScheduleBoard
          tasks={tasks}
          subjects={subjects}
          completedTaskIds={completedTaskIds}
          onToggleTask={onToggleTask}
          onOpenNewTaskModal={onOpenNewTaskModal}
          onOpenEditTask={onOpenEditTask}
          onDeleteTask={onDeleteTask}
          onUpdateAllTasks={onUpdateAllTasks}
          archivedWeeks={archivedWeeks}
          onArchiveWeek={onArchiveWeek}
        />
      )}

      {/* Sub-tab 2: Past Weeks Analytics */}
      {activeSubTab === 'history' && (
        <PastWeeksAnalytics
          sessions={sessions}
          subjects={subjects}
          exams={exams}
          weeklyTasks={tasks}
          completedTaskIds={completedTaskIds}
          lectures={lectures}
          onStartFocus={onStartFocus}
        />
      )}
    </section>
  );
};
