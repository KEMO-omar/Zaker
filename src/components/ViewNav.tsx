import React from 'react';
import { ViewTab } from '../types';
import {
  LayoutDashboard,
  Bot,
  CalendarCheck,
  BookOpen,
  GraduationCap,
  Timer,
  Hourglass,
  History
} from 'lucide-react';

interface ViewNavProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
}

export const ViewNav: React.FC<ViewNavProps> = ({ currentTab, onSelectTab }) => {
  return (
    <nav className="view-nav" aria-label="أقسام التطبيق">
      <button
        className={`tab-btn ${currentTab === 'dashView' ? 'active' : ''}`}
        onClick={() => onSelectTab('dashView')}
      >
        <LayoutDashboard size={16} />
        <span>لوحة المذاكرة</span>
      </button>

      <button
        className={`tab-btn ${currentTab === 'aiSupervisorView' ? 'active' : ''}`}
        onClick={() => onSelectTab('aiSupervisorView')}
      >
        <Bot size={16} />
        <span>المراقب الذكي وإدارة الوقت</span>
      </button>

      <button
        className={`tab-btn ${currentTab === 'weeklyView' ? 'active' : ''}`}
        onClick={() => onSelectTab('weeklyView')}
      >
        <CalendarCheck size={16} />
        <span>مهام الأسبوع والجدول</span>
      </button>

      <button
        className={`tab-btn ${currentTab === 'lecturesView' ? 'active' : ''}`}
        onClick={() => onSelectTab('lecturesView')}
      >
        <BookOpen size={16} />
        <span>محاضرات المنصات والسناتر</span>
      </button>

      <button
        className={`tab-btn ${currentTab === 'examsView' ? 'active' : ''}`}
        onClick={() => onSelectTab('examsView')}
      >
        <GraduationCap size={16} />
        <span>الامتحانات والتقييم</span>
      </button>

      <button
        className={`tab-btn ${currentTab === 'focusView' ? 'active' : ''}`}
        onClick={() => onSelectTab('focusView')}
      >
        <Timer size={16} />
        <span>غرفة التركيز</span>
      </button>

      <button
        className={`tab-btn ${currentTab === 'wastedView' ? 'active' : ''}`}
        onClick={() => onSelectTab('wastedView')}
      >
        <Hourglass size={16} />
        <span>إدارة الوقت والدروس</span>
      </button>

      <button
        className={`tab-btn ${currentTab === 'logView' ? 'active' : ''}`}
        onClick={() => onSelectTab('logView')}
      >
        <History size={16} />
        <span>سجل الإنجازات</span>
      </button>
    </nav>
  );
};
