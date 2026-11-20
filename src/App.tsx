import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Subject, Session, Exemption, WeeklyTask, Lecture, ExamRecord, ThemeType, ViewTab, ArchivedWeek, SmartNotificationItem } from './types';
import {
  buildRandomizedWeeklySchedule,
  getWeekStartSaturdayKey,
  injectLectureIntoSchedule
} from './utils/scheduleEngine';
import {
  DEFAULT_NOTIFICATION_PREFS,
  NotificationPrefs,
  buildCheckInNotification,
  buildInactivity12hNotification,
  buildPreExamNotification,
  getHoursSinceLastSession,
  triggerBrowserNotification
} from './services/notifications';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import {
  DEFAULT_SUBJECTS,
  fetchDbData,
  saveDbData,
  saveActiveSession,
  fetchActiveSession,
  callAiMonitor,
  callAiExamReaction,
  callAiSchedule,
  callAiExamAudit,
  callAiInterrogate,
  fetchQuotes,
  calculateDynamicSupervisorMood
} from './services/api';
import {
  computeLiveStudySnapshot,
  buildComprehensiveReport,
  buildExamsDiagnosticReport,
  LiveStudyInput
} from './services/reportEngine';

import { Header } from './components/Header';
import { ViewNav } from './components/ViewNav';
import { ActiveSessionBanner } from './components/ActiveSessionBanner';
import {
  BreakModal,
  ExamModal,
  EditExamModal,
  ExamReactionModal,
  NewTaskModal,
  EditTaskModal,
  NewLectureModal,
  EditLectureModal,
  EditSubjectsModal,
  ExemptionModal,
  AiScheduleModal,
  InterrogationModal,
  ManualSessionModal,
  PwaInstallModal
} from './components/Modals';

import { DashboardView } from './views/DashboardView';
import { AISupervisorView } from './views/AISupervisorView';
import { WeeklyView } from './views/WeeklyView';
import { LecturesView } from './views/LecturesView';
import { ExamsView } from './views/ExamsView';
import { FocusView } from './views/FocusView';
import { WastedView } from './views/WastedView';
import { LogView } from './views/LogView';
import { AllTimeMatrixView } from './views/AllTimeMatrixView';

export const App: React.FC = () => {
  // Navigation & Theme
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashView');
  const [theme, setTheme] = useState<ThemeType>('default');
  const [vizMode, setVizMode] = useState<'spiral' | 'gauge' | 'bars'>('spiral');

  // Core Data with instant LocalStorage caching
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem('kareem_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [exemptions, setExemptions] = useState<Exemption[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string | number>>(new Set());
  const [archivedWeeks, setArchivedWeeks] = useState<ArchivedWeek[]>([]);
  const [activeWeekStartKey, setActiveWeekStartKey] = useState<string>(() => {
    try {
      return localStorage.getItem('kareem_active_week_key') || '';
    } catch {
      return '';
    }
  });
  const [dbLoaded, setDbLoaded] = useState<boolean>(false);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const examsRef = useRef<ExamRecord[]>([]);
  examsRef.current = exams;

  const safeSaveExamsLocalStorage = (list: ExamRecord[]) => {
    try {
      localStorage.setItem('kareem_exams', JSON.stringify(list));
    } catch (e) {
      try {
        const lightweight = list.map((ex) =>
          ex.certificateImage && ex.certificateImage.length > 30000
            ? { ...ex, certificateImage: '' }
            : ex
        );
        localStorage.setItem('kareem_exams', JSON.stringify(lightweight));
      } catch (e2) {}
    }
  };
  const [customAiInstructions, setCustomAiInstructions] = useState<string>('');
  const [quotes, setQuotes] = useState<string[]>([]);
  const [isManualSessionOpen, setIsManualSessionOpen] = useState(false);

  // Smart Notifications & Periodic Check-Ins State
  const [notifications, setNotifications] = useState<SmartNotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('kareem_smart_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activePopupNotification, setActivePopupNotification] = useState<SmartNotificationItem | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(() => {
    try {
      const saved = localStorage.getItem('kareem_notification_prefs');
      return saved ? { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(saved) } : DEFAULT_NOTIFICATION_PREFS;
    } catch {
      return DEFAULT_NOTIFICATION_PREFS;
    }
  });
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);

  // Focus Timer State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeSubjId, setActiveSubjId] = useState<string>('physics');
  const [taskNote, setTaskNote] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);
  const sessionStartTimeRef = useRef<number | null>(null);

  // AI Watchdog & Mood State
  const [aiMood, setAiMood] = useState<{
    avatar: string;
    label: string;
    score: number;
    reason: string;
    speech: string;
  }>({
    avatar: '🦁',
    label: 'أسطوري وفخور',
    score: 85,
    reason: 'يراقب كل ثانية، يعاتب عند تضييع الوقت، ويتابع قفل الامتحانات الـ 4',
    speech: 'يا كريم، مجموع تانية ثانوي مدمج مع تالتة، مفيش ثانية ولا درجة مسموح بتضييعها. حلم كلية الطب بيتصنع دلوقتي!'
  });
  const [auditReport, setAuditReport] = useState<string>('');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  // Modals State
  const [isBreakOpen, setIsBreakOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isEditExamOpen, setIsEditExamOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<ExamRecord | null>(null);

  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<WeeklyTask | null>(null);

  const [isNewLectureModalOpen, setIsNewLectureModalOpen] = useState(false);
  const [isEditLectureOpen, setIsEditLectureOpen] = useState(false);
  const [lectureToEdit, setLectureToEdit] = useState<Lecture | null>(null);

  const [isEditSubjectsOpen, setIsEditSubjectsOpen] = useState(false);
  const [isExemptionModalOpen, setIsExemptionModalOpen] = useState(false);

  const [isAiScheduleOpen, setIsAiScheduleOpen] = useState(false);
  const [aiScheduleText, setAiScheduleText] = useState<string | null>(null);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);

  const [examAuditReport, setExamAuditReport] = useState<string | null>(null);
  const [isAuditingExams, setIsAuditingExams] = useState(false);
  const [lastExamForReaction, setLastExamForReaction] = useState<ExamRecord | null>(null);
  const [examReactionText, setExamReactionText] = useState<string>('');
  const [isExamReactionOpen, setIsExamReactionOpen] = useState(false);

  // Backlog Interrogation State
  const [isInterrogationOpen, setIsInterrogationOpen] = useState(false);
  const [interrogationText, setInterrogationText] = useState<string | null>(null);
  const [isInterrogating, setIsInterrogating] = useState(false);

  // PWA Install State for Chrome & Mobile
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running as installed standalone PWA
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };
    checkInstalled();

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const installedHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      showToast('⚡ تم تثبيت تطبيق شباب بنجاح على جهازك!');
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          showToast('⚡ تم تثبيت التطبيق بنجاح على جهازك!');
          setDeferredPrompt(null);
          setIsInstalled(true);
          return;
        }
      } catch (e) {
        console.warn('Install prompt error:', e);
      }
    }
    // Open comprehensive installation guide modal
    setIsInstallModalOpen(true);
  };

  // Sync Timer
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncCountdown, setSyncCountdown] = useState<number>(3600); // 60 mins

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 1. Initial Data Loading from /api/db/sync and LocalStorage Fallback
  useEffect(() => {
    async function loadInitialData() {
      // Quotes
      fetchQuotes().then((q) => setQuotes(q));

      // Local storage fallbacks
      const localDirectives = localStorage.getItem('kareem_ai_custom_instructions');
      if (localDirectives) setCustomAiInstructions(localDirectives);

      const localTheme = localStorage.getItem('kareem_theme') as ThemeType;
      if (localTheme) setTheme(localTheme);

      try {
        const rawTasks = localStorage.getItem('kareem_weekly_tasks');
        if (rawTasks) setWeeklyTasks(JSON.parse(rawTasks));
        const rawCompleted = localStorage.getItem('kareem_completed_task_ids');
        if (rawCompleted) setCompletedTaskIds(new Set(JSON.parse(rawCompleted)));
        const rawArchives = localStorage.getItem('kareem_archived_weeks');
        if (rawArchives) setArchivedWeeks(JSON.parse(rawArchives));
        const rawLectures = localStorage.getItem('kareem_lectures');
        if (rawLectures) setLectures(JSON.parse(rawLectures));
        const rawExams = localStorage.getItem('kareem_exams');
        if (rawExams) setExams(JSON.parse(rawExams));
        // Clear any previously frozen report so reports always compute from live real-time data
        localStorage.removeItem('kareem_audit_report');
      } catch (e) {}

      // Server DB
      const db = await fetchDbData();
      if (db) {
        if (Array.isArray(db.subjects) && db.subjects.length >= 4) {
          setSubjects(db.subjects);
        }
        if (Array.isArray(db.sessions)) {
          let localSaved: Session[] = [];
          try {
            const raw = localStorage.getItem('kareem_sessions');
            if (raw) localSaved = JSON.parse(raw);
          } catch (e) {}

          const sessMap = new Map<string, any>();
          // 1. Put local sessions
          localSaved.forEach((s) => {
            const k = s.id || s.fbKey || (s.tsStart ? `ts_${s.tsStart}` : null);
            if (k) sessMap.set(String(k), s);
          });
          // 2. Put server sessions (union)
          db.sessions.forEach((s: any, idx: number) => {
            const k = s.id || s.fbKey || (s.tsStart ? `ts_${s.tsStart}` : `s_${s.date || idx}`);
            if (k) {
              const existing = sessMap.get(String(k));
              sessMap.set(String(k), { ...(existing || {}), ...s, id: s.id || k });
            }
          });
          const mergedSessions = Array.from(sessMap.values()).sort((a, b) => (b.tsStart || 0) - (a.tsStart || 0));
          setSessions(mergedSessions);
          try {
            localStorage.setItem('kareem_sessions', JSON.stringify(mergedSessions));
          } catch (e) {}
        }
        if (Array.isArray(db.exemptions)) {
          setExemptions(db.exemptions);
        }
        if (Array.isArray(db.weeklyTasks) && db.weeklyTasks.length > 0) {
          setWeeklyTasks(db.weeklyTasks);
          try { localStorage.setItem('kareem_weekly_tasks', JSON.stringify(db.weeklyTasks)); } catch (e) {}
        }
        if (Array.isArray(db.completedTaskIds)) {
          setCompletedTaskIds(new Set(db.completedTaskIds));
          try { localStorage.setItem('kareem_completed_task_ids', JSON.stringify(db.completedTaskIds)); } catch (e) {}
        }
        if (Array.isArray(db.archivedWeeks)) {
          setArchivedWeeks(db.archivedWeeks);
          try { localStorage.setItem('kareem_archived_weeks', JSON.stringify(db.archivedWeeks)); } catch (e) {}
        }
        if (Array.isArray(db.lectures) && db.lectures.length > 0) {
          setLectures(db.lectures);
          try { localStorage.setItem('kareem_lectures', JSON.stringify(db.lectures)); } catch (e) {}
        }
        if (Array.isArray(db.exams) && db.exams.length > 0) {
          setExams((prev) => {
            const map = new Map<string, ExamRecord>();
            db.exams.forEach((e: ExamRecord) => {
              if (e && e.id) map.set(String(e.id), e);
            });
            prev.forEach((e) => {
              if (e && e.id && !map.has(String(e.id))) {
                map.set(String(e.id), e);
              }
            });
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
            );
            examsRef.current = merged;
            safeSaveExamsLocalStorage(merged);
            return merged;
          });
        }
        if (db.activeWeekStartKey) {
          setActiveWeekStartKey(db.activeWeekStartKey);
          try { localStorage.setItem('kareem_active_week_key', db.activeWeekStartKey); } catch (e) {}
        }
        if (db.customAiInstructions) {
          setCustomAiInstructions(db.customAiInstructions);
        }
        if (db.vizMode) {
          setVizMode(db.vizMode);
        }
        if (db.theme) {
          setTheme(db.theme);
        }
      }

      setDbLoaded(true);

      // Check active running session from Firebase / LocalStorage
      try {
        const active = await fetchActiveSession();
        if (active && active.startTime) {
          if (active.subjId) setActiveSubjId(active.subjId);
          if (active.taskNote) setTaskNote(active.taskNote);

          if (active.isRunning) {
            const now = Date.now();
            const elapsed = Math.max(Math.floor((now - active.startTime) / 1000), 0);
            setElapsedSeconds(elapsed);
            sessionStartTimeRef.current = active.startTime;
            setIsRunning(true);
          } else {
            const pausedSec = active.pausedElapsed !== undefined ? active.pausedElapsed : Math.max(Math.floor((Date.now() - active.startTime) / 1000), 0);
            setElapsedSeconds(pausedSec);
            sessionStartTimeRef.current = Date.now() - pausedSec * 1000;
            setIsRunning(false);
          }
        }
      } catch (err) {}
    }
    loadInitialData();
  }, []);

  // Sync sessions to localStorage on every change
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      try {
        localStorage.setItem('kareem_sessions', JSON.stringify(sessions));
      } catch (e) {}
    }
  }, [sessions]);

  // Set HTML theme attribute
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('kareem_theme', theme);
  }, [theme]);

  // Dynamically calculate supervisor mood from real activity & inactivity streak across subjects
  useEffect(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let todayMins = 0;
    sessions.forEach((s) => {
      const ts = s.tsStart || (s.date ? new Date(s.date).getTime() : 0);
      if (ts >= startOfToday) todayMins += s.minutes || 0;
    });
    const dynamicMood = calculateDynamicSupervisorMood(sessions, exams, todayMins);
    setAiMood(dynamicMood);
  }, [sessions, exams]);

  // Live helper returning current snapshot input
  const getLiveStudyInput = useCallback((overrides?: Partial<LiveStudyInput>): LiveStudyInput => ({
    sessions,
    subjects,
    exemptions,
    exams,
    weeklyTasks,
    completedTaskIds: Array.from(completedTaskIds),
    lectures,
    nowMs: Date.now(),
    ...overrides
  }), [sessions, subjects, exemptions, exams, weeklyTasks, completedTaskIds, lectures]);

  // Dynamically recompute Comprehensive Report and Exam Diagnostic Report whenever live data changes or view is opened
  useEffect(() => {
    if (!dbLoaded) return;
    const snap = computeLiveStudySnapshot(getLiveStudyInput());
    setAuditReport(buildComprehensiveReport(snap));
    setExamAuditReport(buildExamsDiagnosticReport(snap));
  }, [dbLoaded, currentTab, getLiveStudyInput]);

  // Sync Countdown Timer (60 mins)
  useEffect(() => {
    const timer = setInterval(() => {
      setSyncCountdown((prev) => {
        if (prev <= 1) {
          triggerAutoSync();
          return 3600;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sessions, exemptions, weeklyTasks, completedTaskIds, lectures, exams, customAiInstructions]);

  // Focus Stopwatch Interval - strictly active only while isRunning is true, freezes when paused
  useEffect(() => {
    if (isRunning) {
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = Date.now() - elapsedSeconds * 1000;
      }
      timerRef.current = setInterval(() => {
        if (sessionStartTimeRef.current) {
          const now = Date.now();
          const realElapsed = Math.floor((now - sessionStartTimeRef.current) / 1000);
          setElapsedSeconds(realElapsed);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning]);

  // Trigger Sync with Server
  const triggerAutoSync = useCallback(async (overrides?: any) => {
    setIsSyncing(true);
    const dataToSave = {
      sessions: overrides?.sessions ?? sessions,
      exemptions: overrides?.exemptions ?? exemptions,
      weeklyTasks: overrides?.weeklyTasks ?? weeklyTasks,
      completedTaskIds: overrides?.completedTaskIds ?? Array.from(completedTaskIds),
      archivedWeeks: overrides?.archivedWeeks ?? archivedWeeks,
      activeWeekStartKey: overrides?.activeWeekStartKey ?? activeWeekStartKey,
      lectures: overrides?.lectures ?? lectures,
      exams: overrides?.exams ?? exams,
      subjects: overrides?.subjects ?? subjects,
      customAiInstructions: overrides?.customAiInstructions ?? customAiInstructions
    };
    const success = await saveDbData(dataToSave);
    setIsSyncing(false);
    return success;
  }, [sessions, exemptions, weeklyTasks, completedTaskIds, archivedWeeks, activeWeekStartKey, lectures, exams, subjects, customAiInstructions]);

  // Push helper for Smart Notifications
  const pushSmartNotification = useCallback((item: SmartNotificationItem, fireNativePush = true) => {
    setNotifications(prev => {
      const next = [item, ...prev].slice(0, 40);
      try { localStorage.setItem('kareem_smart_notifications', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    setActivePopupNotification(item);
    if (fireNativePush) {
      triggerBrowserNotification(item.title, item.body);
    }
  }, []);

  // AUTO-ROLLOVER & AUTO-ARCHIVE ON SATURDAY (when Friday ends & new Saturday week begins!)
  useEffect(() => {
    if (!dbLoaded) return;

    const checkWeekRollover = () => {
      const currentWeekKey = getWeekStartSaturdayKey();

      if (!activeWeekStartKey) {
        setActiveWeekStartKey(currentWeekKey);
        try { localStorage.setItem('kareem_active_week_key', currentWeekKey); } catch (e) {}
        return;
      }

      if (activeWeekStartKey !== currentWeekKey) {
        // Archive previous finished week as-is (completed stays completed, uncompleted stays uncompleted in snapshot)
        const total = weeklyTasks.length;
        const done = weeklyTasks.filter(
          t => completedTaskIds.has(t.id) || completedTaskIds.has(String(t.id))
        ).length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

        const newArchive: ArchivedWeek = {
          id: `auto_archive_${activeWeekStartKey}_${Date.now()}`,
          weekTitle: `أسبوع ${activeWeekStartKey}`,
          weekKey: activeWeekStartKey,
          archivedAt: new Date().toISOString(),
          totalCount: total,
          completedCount: done,
          completionPct: pct,
          tasks: [...weeklyTasks]
        };

        const updatedArchives = total > 0 ? [newArchive, ...archivedWeeks] : archivedWeeks;
        const freshWeekTasks = buildRandomizedWeeklySchedule({
          lectures,
          preserveUserTasks: []
        });

        setArchivedWeeks(updatedArchives);
        setWeeklyTasks(freshWeekTasks);
        setCompletedTaskIds(new Set());
        setActiveWeekStartKey(currentWeekKey);

        try {
          localStorage.setItem('kareem_archived_weeks', JSON.stringify(updatedArchives));
          localStorage.setItem('kareem_weekly_tasks', JSON.stringify(freshWeekTasks));
          localStorage.setItem('kareem_completed_task_ids', JSON.stringify([]));
          localStorage.setItem('kareem_active_week_key', currentWeekKey);
        } catch (e) {}

        triggerAutoSync({
          archivedWeeks: updatedArchives,
          weeklyTasks: freshWeekTasks,
          completedTaskIds: [],
          activeWeekStartKey: currentWeekKey
        });

        pushSmartNotification({
          id: `notif_week_${Date.now()}`,
          type: 'week_rollover',
          title: '🎉 أسبوع جديد بدأ (السبت)! تم الأرشفة والتجهيز تلقائياً',
          body: `تمت أرشفة الأسبوع السابق (${done}/${total} مهمة) وبدأنا أسبوعك الجديد بجدول عشوائي طازج من محاضراتك والسناتر الحضورية، مع ترك الخانة الأخيرة أسفل كل يوم فارغة لإضافاتك!`,
          timestamp: Date.now(),
          read: false,
          actionTab: 'weeklyView'
        });
      }
    };

    checkWeekRollover();
    const interval = setInterval(checkWeekRollover, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dbLoaded, activeWeekStartKey, weeklyTasks, completedTaskIds, archivedWeeks, lectures, triggerAutoSync, pushSmartNotification]);

  // SMART ALERTS & PERIODIC CHECK-INS ENGINE (12h Inactivity + Pre-Exam + Morning/Periodic Tasks Check-in)
  const runSmartNotificationsCheck = useCallback((forceCheckIn = false, forceAlerts = false) => {
    const now = Date.now();

    // 1. Check 12-hour study inactivity alert (cooldown 2 hours unless forced)
    if (notificationPrefs.inactivity12hAlert) {
      const last12hAlert = Number(localStorage.getItem('kareem_last_12h_alert') || 0);
      if (forceAlerts || now - last12hAlert >= 2 * 60 * 60 * 1000) {
        const alert12h = buildInactivity12hNotification(sessions, weeklyTasks, completedTaskIds);
        if (alert12h) {
          localStorage.setItem('kareem_last_12h_alert', String(now));
          pushSmartNotification(alert12h);
        }
      }
    }

    // 2. Check upcoming exam alert (cooldown 4 hours unless forced)
    if (notificationPrefs.preExamAlert) {
      const lastExamAlert = Number(localStorage.getItem('kareem_last_exam_alert') || 0);
      if (forceAlerts || now - lastExamAlert >= 4 * 60 * 60 * 1000) {
        const examAlert = buildPreExamNotification(weeklyTasks, completedTaskIds, subjects, exams);
        if (examAlert) {
          localStorage.setItem('kareem_last_exam_alert', String(now));
          pushSmartNotification(examAlert);
        }
      }
    }

    // 3. Periodic / Morning Check-in containing Today's Tasks (prioritizing user-added tasks)
    if (notificationPrefs.enabled && notificationPrefs.morningCheckIn) {
      const lastCheckIn = Number(localStorage.getItem('kareem_last_checkin_alert') || 0);
      const intervalMs = Math.max(15, notificationPrefs.intervalMinutes) * 60 * 1000;
      if (forceCheckIn || now - lastCheckIn >= intervalMs) {
        localStorage.setItem('kareem_last_checkin_alert', String(now));
        const checkIn = buildCheckInNotification(weeklyTasks, completedTaskIds, subjects, undefined, sessions);
        pushSmartNotification(checkIn);
      }
    }
  }, [notificationPrefs, sessions, weeklyTasks, completedTaskIds, subjects, exams, pushSmartNotification]);

  useEffect(() => {
    if (!dbLoaded) return;
    const bootTimer = setTimeout(() => {
      runSmartNotificationsCheck(false, false);
    }, 2500);

    const intervalMs = Math.max(5, Math.min(notificationPrefs.intervalMinutes, 60)) * 60 * 1000;
    const periodicTimer = setInterval(() => {
      runSmartNotificationsCheck(false, false);
    }, intervalMs);

    return () => {
      clearTimeout(bootTimer);
      clearInterval(periodicTimer);
    };
  }, [dbLoaded, notificationPrefs.intervalMinutes, runSmartNotificationsCheck]);

  // Emergency Sync & Call
  const handleTriggerEmergencySync = async () => {
    showToast('جاري المزامنة الفورية واستدعاء المراقب الطارئ...');
    await triggerAutoSync();
    setSyncCountdown(3600);
    await handleTriggerAiAudit(true);
    showToast('تمت المزامنة واستدعاء المراقب بنجاح!');
  };

  const handleTriggerManualSync = async () => {
    showToast('جاري المزامنة مع قاعدة البيانات السحابية...');
    const ok = await triggerAutoSync();
    if (ok) showToast('تمت المزامنة وحفظ التعديلات بنجاح!');
  };

  // AI Supervisor Comprehensive Report Audit
  const handleTriggerAiAudit = async (forceFresh = true) => {
    setIsAuditing(true);
    const liveInput = getLiveStudyInput();
    const snap = computeLiveStudySnapshot(liveInput);

    const analysis = await callAiMonitor(liveInput, customAiInstructions, forceFresh);
    setAuditReport(analysis);

    // Dynamic supervisor mood directly calculated from real sessions, exams, and inactivity
    const dynamicMood = calculateDynamicSupervisorMood(sessions, exams, snap.todayStudyMins);
    setAiMood(dynamicMood);

    setIsAuditing(false);
  };

  // Text-to-speech for AI
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[#*`_>~-]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'ar-EG';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
    showToast('جاري تشغيل صوت المراقب...');
  };

  // Task Toggle
  const handleToggleTask = (taskId: string | number) => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev);
      const strId = String(taskId);
      const numId = Number(taskId);

      if (next.has(taskId) || next.has(strId) || (!isNaN(numId) && next.has(numId))) {
        next.delete(taskId);
        next.delete(strId);
        if (!isNaN(numId)) next.delete(numId);
      } else {
        next.add(taskId);
        next.add(strId);
        if (!isNaN(numId)) next.add(numId);
      }
      const arr = Array.from(next);
      try {
        localStorage.setItem('kareem_completed_task_ids', JSON.stringify(arr));
      } catch (e) {}
      triggerAutoSync({ completedTaskIds: arr });
      return next;
    });
  };

  // Add Task (preserving category, teacher, time, bottom manual slot placement, and user priority)
  const handleSaveNewTask = (taskData: {
    dayId: string;
    subjId: string;
    text: string;
    priority: WeeklyTask['priority'];
    category?: WeeklyTask['category'];
    teacher?: string;
    time?: string;
    slotIndex?: number;
    isUserAdded?: boolean;
  }) => {
    const newTask: WeeklyTask = {
      id: `task_user_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      dayId: taskData.dayId,
      subjId: taskData.subjId,
      text: taskData.text,
      priority: taskData.priority,
      category: taskData.category || 'manual',
      teacher: taskData.teacher,
      time: taskData.time,
      slotIndex: taskData.slotIndex,
      isUserAdded: taskData.isUserAdded ?? true
    };
    const updated = [newTask, ...weeklyTasks];
    setWeeklyTasks(updated);
    try {
      localStorage.setItem('kareem_weekly_tasks', JSON.stringify(updated));
    } catch (e) {}
    showToast('تمت إضافة المهمة بتصنيفها وإظهارها على الجدول بنجاح! ✓');
    triggerAutoSync({ weeklyTasks: updated });
  };

  // Edit Task
  const handleOpenEditTask = (task: WeeklyTask) => {
    setTaskToEdit(task);
    setIsEditTaskOpen(true);
  };

  const handleUpdateTask = (updatedTask: WeeklyTask) => {
    const updated = weeklyTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    setWeeklyTasks(updated);
    try {
      localStorage.setItem('kareem_weekly_tasks', JSON.stringify(updated));
    } catch (e) {}
    showToast('تم حفظ تعديلات المهمة في القاعدة بنجاح!');
    triggerAutoSync({ weeklyTasks: updated });
  };

  // Delete Task
  const handleDeleteTask = (taskId: string | number) => {
    const updated = weeklyTasks.filter((t) => t.id !== taskId);
    setWeeklyTasks(updated);
    try {
      localStorage.setItem('kareem_weekly_tasks', JSON.stringify(updated));
    } catch (e) {}
    showToast('تم حذف المهمة من القاعدة');
    triggerAutoSync({ weeklyTasks: updated });
  };

  // Bulk update all tasks
  const handleUpdateAllTasks = (updated: WeeklyTask[]) => {
    setWeeklyTasks(updated);
    try {
      localStorage.setItem('kareem_weekly_tasks', JSON.stringify(updated));
    } catch (e) {}
    triggerAutoSync({ weeklyTasks: updated });
  };

  // Archive Current Week
  const handleArchiveWeek = (archive: ArchivedWeek, cleanTasks: WeeklyTask[]) => {
    const updatedArchives = [archive, ...archivedWeeks];
    setArchivedWeeks(updatedArchives);
    setWeeklyTasks(cleanTasks);
    setCompletedTaskIds(new Set());
    try {
      localStorage.setItem('kareem_archived_weeks', JSON.stringify(updatedArchives));
      localStorage.setItem('kareem_weekly_tasks', JSON.stringify(cleanTasks));
      localStorage.setItem('kareem_completed_task_ids', JSON.stringify([]));
    } catch (e) {}
    showToast('تمت أرشفة الأسبوع بنجاح وبدء أسبوع جديد نظيف!');
    triggerAutoSync({
      archivedWeeks: updatedArchives,
      weeklyTasks: cleanTasks,
      completedTaskIds: []
    });
  };

  // Lecture Toggle
  const handleToggleLecture = (lecId: string) => {
    const updated = lectures.map((l) => (l.id === lecId ? { ...l, isDone: !l.isDone } : l));
    setLectures(updated);
    try {
      localStorage.setItem('kareem_lectures', JSON.stringify(updated));
    } catch (e) {}
    showToast('تم تحديث حالة المحاضرة وحفظها في القاعدة');
    triggerAutoSync({ lectures: updated });
  };

  // Add Lecture (auto-injecting newly added lecture into weekly schedule)
  const handleSaveNewLecture = (lecData: Omit<Lecture, 'id' | 'isDone'>) => {
    const newLec: Lecture = {
      ...lecData,
      id: `lec_${Date.now()}`,
      isDone: false
    };
    const updatedLectures = [newLec, ...lectures];
    const updatedTasks = injectLectureIntoSchedule(weeklyTasks, newLec);
    setLectures(updatedLectures);
    setWeeklyTasks(updatedTasks);
    try {
      localStorage.setItem('kareem_lectures', JSON.stringify(updatedLectures));
      localStorage.setItem('kareem_weekly_tasks', JSON.stringify(updatedTasks));
    } catch (e) {}
    showToast('تمت إضافة المحاضرة وإدراجها تلقائياً في الجدول الأسبوعي! ⚡');
    triggerAutoSync({ lectures: updatedLectures, weeklyTasks: updatedTasks });
  };

  // Edit Lecture
  const handleOpenEditLecture = (lecture: Lecture) => {
    setLectureToEdit(lecture);
    setIsEditLectureOpen(true);
  };

  const handleUpdateLecture = (updatedLecture: Lecture) => {
    const updated = lectures.map((l) => (l.id === updatedLecture.id ? updatedLecture : l));
    setLectures(updated);
    try {
      localStorage.setItem('kareem_lectures', JSON.stringify(updated));
    } catch (e) {}
    showToast('تم حفظ تعديلات المحاضرة في القاعدة بنجاح!');
    triggerAutoSync({ lectures: updated });
  };

  const handleDeleteLecture = (id: string) => {
    const updated = lectures.filter((l) => l.id !== id);
    setLectures(updated);
    try {
      localStorage.setItem('kareem_lectures', JSON.stringify(updated));
    } catch (e) {}
    showToast('تم حذف المحاضرة من القاعدة');
    triggerAutoSync({ lectures: updated });
  };

  // Add Exam
  const handleSaveExam = async (examData: Omit<ExamRecord, 'id' | 'pct'>) => {
    const pct = examData.total > 0 ? Math.round((examData.score / examData.total) * 100) : 0;
    const newExam: ExamRecord = {
      ...examData,
      id: `exam_${Date.now()}`,
      pct
    };

    const currentExams = examsRef.current;
    const updated = [newExam, ...currentExams.filter((e) => e.id !== newExam.id)];
    examsRef.current = updated;
    setExams(updated);
    safeSaveExamsLocalStorage(updated);

    // Sync IMMEDIATELY to server & Firebase BEFORE running AI reaction
    const syncOk = await triggerAutoSync({ exams: updated });
    if (syncOk) {
      showToast('✅ تم تسجيل وحفظ نتيجة الامتحان في قاعدة البيانات بنجاح!');
    } else {
      showToast('⚠️ تم حفظ الامتحان محلياً — تعذر الاتصال بالسيرفر، اضغط مزامنة');
    }

    // Call instant AI reaction (non-blocking for persistence)
    try {
      const res = await callAiExamReaction(newExam, updated, subjects, sessions, customAiInstructions);
      setLastExamForReaction(newExam);
      setExamReactionText(res.reaction);
      setIsExamReactionOpen(true);
    } catch (err) {
      // Exam is already safely persisted
    }
  };

  // Edit Exam
  const handleOpenEditExam = (exam: ExamRecord) => {
    setExamToEdit(exam);
    setIsEditExamOpen(true);
  };

  const handleUpdateExam = async (updatedExam: ExamRecord) => {
    const updated = examsRef.current.map((e) => (e.id === updatedExam.id ? updatedExam : e));
    examsRef.current = updated;
    setExams(updated);
    safeSaveExamsLocalStorage(updated);
    const syncOk = await triggerAutoSync({ exams: updated });
    showToast(syncOk ? '✅ تم حفظ تعديلات الامتحان والشهادة في القاعدة!' : '⚠️ تم التعديل محلياً — اضغط مزامنة');
  };

  // Delete Exam
  const handleDeleteExam = async (id: string) => {
    const updated = examsRef.current.filter((e) => e.id !== id);
    examsRef.current = updated;
    setExams(updated);
    safeSaveExamsLocalStorage(updated);
    const syncOk = await triggerAutoSync({ exams: updated });
    showToast(syncOk ? 'تم حذف سجل الامتحان من القاعدة' : 'تم الحذف محلياً');
  };

  // Save Subjects Targets
  const handleSaveSubjects = (updatedSubjects: Subject[]) => {
    setSubjects(updatedSubjects);
    showToast('تم حفظ أهداف المواد بنجاح!');
    setTimeout(() => triggerAutoSync(), 400);
  };

  // Add Exemption
  const handleSaveExemption = (exData: { title: string; minutes: number }) => {
    const newExm: Exemption = {
      id: `ex_${Date.now()}`,
      title: exData.title,
      minutes: exData.minutes,
      timestamp: Date.now()
    };
    setExemptions((prev) => [newExm, ...prev]);
    showToast('تم تسجيل الإعفاء بنجاح');
    setTimeout(() => triggerAutoSync(), 400);
  };

  // Delete Exemption
  const handleDeleteExemption = (id: string) => {
    setExemptions((prev) => prev.filter((x) => x.id !== id));
    showToast('تم حذف الإعفاء');
    setTimeout(() => triggerAutoSync(), 400);
  };

  // Delete Session
  const handleDeleteSession = (id: string) => {
    const updatedSessions = sessions.filter(
      (s) => s.id !== id && s.fbKey !== id && (s.tsStart ? `ts_${s.tsStart}` !== id : true)
    );
    setSessions(updatedSessions);
    try {
      localStorage.setItem('kareem_sessions', JSON.stringify(updatedSessions));
    } catch (e) {}
    showToast('تم حذف الجلسة من السجل');
    saveDbData({
      sessions: updatedSessions,
      exemptions,
      weeklyTasks,
      completedTaskIds: Array.from(completedTaskIds),
      lectures,
      exams,
      subjects,
      customAiInstructions
    });
  };

  // Add Manual Session
  const handleSaveManualSession = (sessionData: { subjId: string; minutes: number; task: string; date?: string }) => {
    const sessionDate = sessionData.date || new Date().toISOString().split('T')[0];
    const sessionTs = new Date(sessionDate).getTime() || Date.now();
    const newSession: Session = {
      id: `s_${Date.now()}`,
      minutes: sessionData.minutes,
      tsStart: sessionTs,
      tsEnd: sessionTs + sessionData.minutes * 60 * 1000,
      date: sessionDate,
      entries: [
        {
          subj: sessionData.subjId,
          task: sessionData.task.trim() || 'مذاكرة مستقلة'
        }
      ]
    };

    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    try {
      localStorage.setItem('kareem_sessions', JSON.stringify(updatedSessions));
    } catch (e) {}

    showToast(`تم تسجيل وحفظ الجلسة (${sessionData.minutes} دقيقة) بنجاح ⚡`);

    saveDbData({
      sessions: updatedSessions,
      exemptions,
      weeklyTasks,
      completedTaskIds: Array.from(completedTaskIds),
      lectures,
      exams,
      subjects,
      customAiInstructions
    });
  };

  // Save Directives
  const handleSaveCustomInstructions = (text: string) => {
    setCustomAiInstructions(text);
    localStorage.setItem('kareem_ai_custom_instructions', text);
    showToast('تم حفظ تعليماتك بنجاح! المراقب يعمل الآن وفقاً لها');
    setTimeout(() => triggerAutoSync(), 400);
  };

  // Focus Timer actions with instant Firebase and LocalStorage sync
  const handleStartTimer = () => {
    const now = Date.now();
    // Strictly anchor sessionStartTimeRef to now minus the already accumulated study seconds.
    // This guarantees that any time spent while paused or taking a break is NEVER counted as study time!
    const stTime = now - (elapsedSeconds * 1000);
    sessionStartTimeRef.current = stTime;
    setIsRunning(true);
    saveActiveSession({
      isRunning: true,
      startTime: stTime,
      subjId: activeSubjId,
      taskNote: taskNote
    });
    showToast('بدأت جلسة التركيز وتم حفظها سحابياً في Firebase ⚡');
  };

  const handlePauseTimer = () => {
    setIsRunning(false);
    // Clear sessionStartTimeRef so upon resume it will re-anchor cleanly to the exact frozen elapsedSeconds
    sessionStartTimeRef.current = null;
    saveActiveSession({
      isRunning: false,
      startTime: Date.now() - (elapsedSeconds * 1000),
      subjId: activeSubjId,
      taskNote: taskNote,
      pausedElapsed: elapsedSeconds
    });
    showToast('تم إيقاف الجلسة مؤقتاً وتجميد العداد وحفظ الحالة سحابياً');
  };

  const handleOpenBreak = () => {
    // If the timer is actively running, freeze and pause it first so break time is strictly excluded from study time
    if (isRunning) {
      handlePauseTimer();
    }
    setIsBreakOpen(true);
  };

  const handleFinishSession = () => {
    const mins = Math.max(Math.round(elapsedSeconds / 60), 1);
    const nowTs = Date.now();
    const newSession: Session = {
      id: `s_${nowTs}`,
      minutes: mins,
      tsStart: nowTs - Math.max(elapsedSeconds, 60) * 1000,
      tsEnd: nowTs,
      entries: [
        {
          subj: activeSubjId,
          task: taskNote.trim() || 'مذاكرة مركزة'
        }
      ]
    };

    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    try {
      localStorage.setItem('kareem_sessions', JSON.stringify(updatedSessions));
    } catch (e) {}

    setIsRunning(false);
    setElapsedSeconds(0);
    sessionStartTimeRef.current = null;
    setTaskNote('');
    saveActiveSession(null);
    showToast(`تم إنهاء وحفظ الجلسة (${mins} دقيقة) بنجاح ⚡`);

    saveDbData({
      sessions: updatedSessions,
      exemptions,
      weeklyTasks,
      completedTaskIds: Array.from(completedTaskIds),
      lectures,
      exams,
      subjects,
      customAiInstructions
    });
  };

  const handleCancelSession = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    sessionStartTimeRef.current = null;
    setTaskNote('');
    saveActiveSession(null);
    showToast('تم إلغاء الجلسة وتصفير العداد');
  };

  const handleSelectSubject = (id: string) => {
    setActiveSubjId(id);
    if (isRunning && sessionStartTimeRef.current) {
      saveActiveSession({
        isRunning: true,
        startTime: sessionStartTimeRef.current,
        subjId: id,
        taskNote: taskNote
      });
    }
  };

  const handleTaskNoteChange = (note: string) => {
    setTaskNote(note);
    if (isRunning && sessionStartTimeRef.current) {
      saveActiveSession({
        isRunning: true,
        startTime: sessionStartTimeRef.current,
        subjId: activeSubjId,
        taskNote: note
      });
    }
  };

  // AI Schedule Generator Action
  const handleGenerateSchedule = async (hours: string, bedtime: string, focusLevel: string) => {
    setIsGeneratingSchedule(true);
    const sched = await callAiSchedule({
      availableHours: hours,
      bedtime,
      focusLevel,
      studyInput: getLiveStudyInput(),
      customInstructions: customAiInstructions
    });
    setAiScheduleText(sched);
    setIsGeneratingSchedule(false);
  };

  // AI Exam Audit Action (Per-Subject & Per-Score Diagnostic)
  const handleTriggerExamAudit = async () => {
    setIsAuditingExams(true);
    const report = await callAiExamAudit(getLiveStudyInput(), customAiInstructions);
    setExamAuditReport(report);
    setIsAuditingExams(false);
  };

  // AI Backlog Interrogation & Direct Accountability Action
  const handleTriggerInterrogation = async () => {
    setIsInterrogating(true);
    setIsInterrogationOpen(true);
    const text = await callAiInterrogate(getLiveStudyInput(), customAiInstructions);
    setInterrogationText(text);
    setIsInterrogating(false);
  };

  // Calculate All-Time total minutes
  const allTimeMinutes = sessions.reduce((acc, s) => acc + (s.minutes || 0), 0);

  const activeSubj = subjects.find((s) => s.id === activeSubjId) || subjects[0];

  return (
    <div>
      {/* Toast */}
      {toastMsg && (
        <div className="toast show">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        theme={theme}
        onThemeChange={setTheme}
        allTimeMinutes={allTimeMinutes}
        aiMood={aiMood}
        syncCountdown={syncCountdown}
        isSyncing={isSyncing}
        onTriggerEmergencySync={handleTriggerEmergencySync}
        onTriggerManualSync={handleTriggerManualSync}
        onInstallPwa={handleInstallPwa}
        unreadNotificationsCount={notifications.filter(n => !n.read).length}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
      />

      <main className="container">
        {/* Navigation Tabs */}
        <ViewNav currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Smart Companion Periodic Check-In / Alert Banner */}
        {activePopupNotification && (
          <div
            className="card"
            style={{
              marginBottom: 16,
              padding: '14px 18px',
              background: activePopupNotification.type === 'inactivity_12h'
                ? 'rgba(239, 68, 68, 0.12)'
                : activePopupNotification.type === 'exam_alert'
                  ? 'rgba(139, 92, 246, 0.12)'
                  : 'rgba(16, 185, 129, 0.10)',
              border: `1.5px solid ${
                activePopupNotification.type === 'inactivity_12h'
                  ? 'rgba(239, 68, 68, 0.45)'
                  : activePopupNotification.type === 'exam_alert'
                    ? 'rgba(139, 92, 246, 0.45)'
                    : 'rgba(16, 185, 129, 0.45)'
              }`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 15, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  {activePopupNotification.title}
                </strong>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                  {activePopupNotification.body}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      setCurrentTab(activePopupNotification.actionTab || 'focusView');
                      setActivePopupNotification(null);
                    }}
                  >
                    {activePopupNotification.actionTab === 'weeklyView' ? 'عرض جدول النهاردة 📋' : 'ابدأ المذاكرة الآن ⚡'}
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => setIsNotificationCenterOpen(true)}
                  >
                    مركز التنبيهات والرسائل 🔔
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => setActivePopupNotification(null)}
                    style={{ color: 'var(--text-muted)' }}
                  >
                    إخفاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Running Session Alert Banner */}
        <ActiveSessionBanner
          isRunning={isRunning && currentTab !== 'focusView'}
          subject={activeSubj}
          elapsedSeconds={elapsedSeconds}
          onGoToFocus={() => setCurrentTab('focusView')}
        />

        {/* VIEW 1: DASHBOARD */}
        {currentTab === 'dashView' && (
          <DashboardView
            sessions={sessions}
            subjects={subjects}
            exemptions={exemptions}
            exams={exams}
            weeklyTasks={weeklyTasks}
            completedTaskIds={completedTaskIds}
            lectures={lectures}
            customAiInstructions={customAiInstructions}
            onSaveCustomInstructions={handleSaveCustomInstructions}
            onStartFocus={(subjId) => {
              setActiveSubjId(subjId);
              setCurrentTab('focusView');
              setIsRunning(true);
            }}
            onOpenAiSchedule={() => setIsAiScheduleOpen(true)}
            onOpenInterrogation={handleTriggerInterrogation}
            onOpenEditSubjects={() => setIsEditSubjectsOpen(true)}
            onTriggerAudit={() => {
              handleTriggerAiAudit(true);
              setCurrentTab('aiSupervisorView');
            }}
            onSpeakAi={() => speakText(aiMood.speech)}
            onNavigateToView={setCurrentTab}
            onOpenManualSession={() => setIsManualSessionOpen(true)}
            aiMood={aiMood}
            vizMode={vizMode}
            onVizModeChange={setVizMode}
          />
        )}

        {/* VIEW 2: AI SUPERVISOR COMMAND CENTER */}
        {currentTab === 'aiSupervisorView' && (
          <AISupervisorView
            sessions={sessions}
            subjects={subjects}
            exams={exams}
            weeklyTasks={weeklyTasks}
            completedTaskIds={completedTaskIds}
            lectures={lectures}
            customAiInstructions={customAiInstructions}
            onSaveCustomInstructions={handleSaveCustomInstructions}
            onTriggerAudit={() => handleTriggerAiAudit(true)}
            onOpenSchedule={() => setIsAiScheduleOpen(true)}
            onOpenInterrogation={handleTriggerInterrogation}
            onSpeak={speakText}
            auditReport={auditReport}
            isAuditing={isAuditing}
            aiMood={aiMood}
          />
        )}

        {/* VIEW 3: WEEKLY TASKS & DYNAMIC INTERACTIVE BOARD */}
        {currentTab === 'weeklyView' && (
          <WeeklyView
            tasks={weeklyTasks}
            subjects={subjects}
            completedTaskIds={completedTaskIds}
            onToggleTask={handleToggleTask}
            onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
            onOpenEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTask}
            onUpdateAllTasks={handleUpdateAllTasks}
            archivedWeeks={archivedWeeks}
            onArchiveWeek={handleArchiveWeek}
            onOpenNotificationsCenter={() => setIsNotificationCenterOpen(true)}
            sessions={sessions}
            exams={exams}
            lectures={lectures}
            onStartFocus={(subjId) => {
              setActiveSubjId(subjId);
              setCurrentTab('focusView');
              setIsRunning(true);
            }}
          />
        )}

        {/* VIEW 4: PLATFORM & CENTER LECTURES */}
        {currentTab === 'lecturesView' && (
          <LecturesView
            lectures={lectures}
            subjects={subjects}
            onToggleLecture={handleToggleLecture}
            onOpenNewLectureModal={() => setIsNewLectureModalOpen(true)}
            onOpenEditLecture={handleOpenEditLecture}
            onDeleteLecture={handleDeleteLecture}
            onStartFocus={(subjId) => {
              setActiveSubjId(subjId);
              setCurrentTab('focusView');
              setIsRunning(true);
            }}
          />
        )}

        {/* VIEW 5: EXAMS & 95% RULE */}
        {currentTab === 'examsView' && (
          <ExamsView
            exams={exams}
            subjects={subjects}
            onOpenExamModal={() => setIsExamModalOpen(true)}
            onOpenEditExam={handleOpenEditExam}
            onDeleteExam={handleDeleteExam}
            onTriggerAudit={handleTriggerExamAudit}
            isAuditing={isAuditingExams}
            auditDiagnostic={examAuditReport}
          />
        )}

        {/* VIEW 6: FOCUS ROOM */}
        {currentTab === 'focusView' && (
          <FocusView
            subjects={subjects}
            activeSubjId={activeSubjId}
            onSelectSubject={handleSelectSubject}
            taskNote={taskNote}
            onTaskNoteChange={handleTaskNoteChange}
            isRunning={isRunning}
            elapsedSeconds={elapsedSeconds}
            onStartTimer={handleStartTimer}
            onPauseTimer={handlePauseTimer}
            onFinishSession={handleFinishSession}
            onCancelSession={handleCancelSession}
            onOpenBreak={handleOpenBreak}
            onOpenManualSession={() => setIsManualSessionOpen(true)}
            quotes={quotes}
          />
        )}

        {/* VIEW 7: WASTED TIME & 24H EQUATION */}
        {currentTab === 'wastedView' && (
          <WastedView
            exemptions={exemptions}
            sessions={sessions}
            onOpenExemptionModal={() => setIsExemptionModalOpen(true)}
            onDeleteExemption={handleDeleteExemption}
          />
        )}

        {/* VIEW 8: SESSIONS LOG */}
        {currentTab === 'logView' && (
          <LogView
            sessions={sessions}
            subjects={subjects}
            onDeleteSession={handleDeleteSession}
            onOpenManualSession={() => setIsManualSessionOpen(true)}
            onOpenAllTimeMatrix={() => setCurrentTab('allTimeHeatmapView')}
          />
        )}

        {/* VIEW 9: ALL-TIME STUDY MATRIX (DEDICATED PAGE) */}
        {currentTab === 'allTimeHeatmapView' && (
          <AllTimeMatrixView
            sessions={sessions}
            subjects={subjects}
            onStartFocus={(subjId) => {
              setActiveSubjId(subjId);
              setCurrentTab('focusView');
              setIsRunning(true);
            }}
            onSessionsUpdated={(updatedSessions) => {
              setSessions(updatedSessions);
              try {
                localStorage.setItem('kareem_sessions', JSON.stringify(updatedSessions));
              } catch (e) {}
            }}
          />
        )}
      </main>

      {/* Modals */}
      <BreakModal
        isOpen={isBreakOpen}
        onClose={() => setIsBreakOpen(false)}
        onResumeStudy={() => {
          setIsBreakOpen(false);
          handleStartTimer();
        }}
      />

      <ExamModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        subjects={subjects}
        onSave={handleSaveExam}
      />

      <EditExamModal
        isOpen={isEditExamOpen}
        onClose={() => setIsEditExamOpen(false)}
        exam={examToEdit}
        subjects={subjects}
        onUpdate={handleUpdateExam}
        onDelete={handleDeleteExam}
      />

      <ExamReactionModal
        isOpen={isExamReactionOpen}
        onClose={() => setIsExamReactionOpen(false)}
        exam={lastExamForReaction}
        reactionText={examReactionText}
        onSpeak={() => speakText(examReactionText)}
      />

      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        subjects={subjects}
        onSave={handleSaveNewTask}
      />

      <EditTaskModal
        isOpen={isEditTaskOpen}
        onClose={() => setIsEditTaskOpen(false)}
        task={taskToEdit}
        subjects={subjects}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      <NewLectureModal
        isOpen={isNewLectureModalOpen}
        onClose={() => setIsNewLectureModalOpen(false)}
        subjects={subjects}
        onSave={handleSaveNewLecture}
      />

      <EditLectureModal
        isOpen={isEditLectureOpen}
        onClose={() => setIsEditLectureOpen(false)}
        lecture={lectureToEdit}
        subjects={subjects}
        onUpdate={handleUpdateLecture}
        onDelete={handleDeleteLecture}
      />

      <EditSubjectsModal
        isOpen={isEditSubjectsOpen}
        onClose={() => setIsEditSubjectsOpen(false)}
        subjects={subjects}
        onSave={handleSaveSubjects}
      />

      <ExemptionModal
        isOpen={isExemptionModalOpen}
        onClose={() => setIsExemptionModalOpen(false)}
        onSave={handleSaveExemption}
      />

      <AiScheduleModal
        isOpen={isAiScheduleOpen}
        onClose={() => setIsAiScheduleOpen(false)}
        onGenerate={handleGenerateSchedule}
        isLoading={isGeneratingSchedule}
        generatedSchedule={aiScheduleText}
      />

      <InterrogationModal
        isOpen={isInterrogationOpen}
        onClose={() => setIsInterrogationOpen(false)}
        interrogationText={interrogationText}
        isLoading={isInterrogating}
        onRefresh={handleTriggerInterrogation}
        onSpeak={speakText}
        onStartEmergencyFocus={(subjId) => {
          setActiveSubjId(subjId);
          setCurrentTab('focusView');
          setIsRunning(true);
        }}
        undoneLecturesCount={lectures.filter((l) => !l.isDone).length}
        backlogTasksCount={weeklyTasks.filter((t) => !completedTaskIds.has(t.id) && !completedTaskIds.has(String(t.id))).length}
        lowExamsCount={exams.filter((e) => (e.pct || Math.round((e.score / e.total) * 100)) < 95).length}
        prioritySubjId={computeLiveStudySnapshot(getLiveStudyInput()).prioritySubjectId}
        prioritySubjName={computeLiveStudySnapshot(getLiveStudyInput()).prioritySubjectName}
      />

      <ManualSessionModal
        isOpen={isManualSessionOpen}
        onClose={() => setIsManualSessionOpen(false)}
        subjects={subjects}
        onSave={handleSaveManualSession}
      />

      <PwaInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onNativeInstall={() => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
          }
        }}
        isInstallable={!!deferredPrompt}
        isInstalled={isInstalled}
      />

      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        prefs={notificationPrefs}
        onUpdatePrefs={(next) => {
          setNotificationPrefs(next);
          try { localStorage.setItem('kareem_notification_prefs', JSON.stringify(next)); } catch (e) {}
          showToast('تم حفظ إعدادات التنبيهات والرسائل الدورية ✓');
        }}
        onMarkAllRead={() => {
          const marked = notifications.map(n => ({ ...n, read: true }));
          setNotifications(marked);
          try { localStorage.setItem('kareem_smart_notifications', JSON.stringify(marked)); } catch (e) {}
        }}
        onClearAll={() => {
          setNotifications([]);
          try { localStorage.setItem('kareem_smart_notifications', JSON.stringify([])); } catch (e) {}
        }}
        onTriggerTestCheckIn={() => {
          const checkIn = buildCheckInNotification(weeklyTasks, completedTaskIds, subjects, undefined, sessions);
          pushSmartNotification(checkIn, true);
          showToast('🔔 تم إرسال رسالة الاطمئنان بمهام النهاردة!');
        }}
        onRunAlertsNow={() => {
          runSmartNotificationsCheck(false, true);
          showToast('⚡ تم فحص إنذار الـ 12 ساعة والامتحانات القريبة');
        }}
        onNavigateToTab={(tab) => setCurrentTab(tab)}
        hoursSinceLastSession={getHoursSinceLastSession(sessions)}
      />
    </div>
  );
};
