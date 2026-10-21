import React from 'react';
import { ViewTab } from '../types';

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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span>لوحة المذاكرة</span>
      </button>

      <button
        className={`tab-btn ${currentTab === 'aiSupervisorView' ? 'active' : ''}`}
        onClick={() => onSelectTab('aiSupervisorView')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 19.07 1.41-1.41"/><path d="m17.66 6.34 1.41-1.41"/>
        </svg>
        <span>المراقب وإدارة الوقت ⚡</span>
      </button>

      <button
        className={`tab-btn ${currentTab === 'weeklyView' ? 'active' : ''}`}
        onClick={() => onSelectTab('weeklyView')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/>
        </svg>
        <span>مهام الأسبوع والجدول</span>
      </button>

      <button
        className={`tab-btn ${currentTab === 'lecturesView' ? 'active' : ''}`}
        onClick={() => onSelectTab('lecturesView')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/><path d="M6 14h6"/>
        </svg>
        <span>محاضرات المنصات والسناتر</span>
      </button>

      <button
        className={`tab-btn ${currentTab === 'examsView' ? 'active' : ''}`}
        onClick={() => onSelectTab('examsView')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
        <span>درجات الامتحانات والتقييم</span>
      </button>

      <button
        className={`tab-btn ${currentTab === 'focusView' ? 'active' : ''}`}
        onClick={() => onSelectTab('focusView')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>غرفة التركيز</span>
      </button>

      <button
        className={`tab-btn ${currentTab === 'wastedView' ? 'active' : ''}`}
        onClick={() => onSelectTab('wastedView')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>إدارة الوقت والدروس</span>
      </button>

      <button
        className={`tab-btn ${currentTab === 'logView' ? 'active' : ''}`}
        onClick={() => onSelectTab('logView')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
        <span>سجل الإنجازات</span>
      </button>
    </nav>
  );
};
