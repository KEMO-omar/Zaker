import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Subject, Session, Exemption, WeeklyTask, Lecture, ExamRecord, ThemeType, ViewTab } from './types';
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
  fetchQuotes
} from './services/api';

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
  ManualSessionModal
} from './components/Modals';

import { DashboardView } from './views/DashboardView';
import { AISupervisorView } from './views/AISupervisorView';
import { WeeklyView } from './views/WeeklyView';
import { LecturesView } from './views/LecturesView';
import { ExamsView } from './views/ExamsView';
import { FocusView } from './views/FocusView';
import { WastedView } from './views/WastedView';
import { LogView } from './views/LogView';

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
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [customAiInstructions, setCustomAiInstructions] = useState<string>('');
  const [quotes, setQuotes] = useState<string[]>([]);
  const [isManualSessionOpen, setIsManualSessionOpen] = useState(false);

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

  // PWA Install State for Chrome
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        showToast('تم تثبيت التطبيق بنجاح على جهازك!');
        setDeferredPrompt(null);
      }
    } else {
      showToast('للتثبيت في كروم: اضغط على القائمة (⋮) ثم "تثبيت التطبيق" أو "Install App"');
    }
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
        if (Array.isArray(db.weeklyTasks)) {
          setWeeklyTasks(db.weeklyTasks);
        }
        if (Array.isArray(db.completedTaskIds)) {
          setCompletedTaskIds(new Set(db.completedTaskIds));
        }
        if (Array.isArray(db.lectures)) {
          setLectures(db.lectures);
        }
        if (Array.isArray(db.exams)) {
          setExams(db.exams);
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

  // Focus Stopwatch Interval - calculates accurate elapsed time against sessionStartTimeRef
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
        } else {
          setElapsedSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, elapsedSeconds]);

  // Trigger Sync with Server
  const triggerAutoSync = useCallback(async () => {
    setIsSyncing(true);
    const success = await saveDbData({
      sessions,
      exemptions,
      weeklyTasks,
      completedTaskIds: Array.from(completedTaskIds),
      lectures,
      exams,
      subjects,
      customAiInstructions
    });
    setIsSyncing(false);
    return success;
  }, [sessions, exemptions, weeklyTasks, completedTaskIds, lectures, exams, subjects, customAiInstructions]);

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

  // AI Supervisor Audit
  const handleTriggerAiAudit = async (forceFresh = false) => {
    setIsAuditing(true);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let todayMins = 0;
    sessions.forEach((s) => {
      const ts = s.tsStart || (s.date ? new Date(s.date).getTime() : 0);
      if (ts >= startOfToday) todayMins += s.minutes || 0;
    });

    const pendingTasksCount = weeklyTasks.filter((t) => !completedTaskIds.has(t.id) && !completedTaskIds.has(String(t.id))).length;
    const completedTodayCount = completedTaskIds.size;

    const studyData = {
      todayStudyMins: todayMins,
      examsCount: exams.length,
      pendingTasksCount,
      completedTodayCount,
      examsAvg: exams.length > 0 ? Math.round(exams.reduce((a, b) => a + (b.pct || Math.round((b.score / b.total) * 100)), 0) / exams.length) : 0
    };

    const analysis = await callAiMonitor(studyData, customAiInstructions, forceFresh);
    setAuditReport(analysis);

    // Update dynamic mood based on results
    if (todayMins >= 240) {
      setAiMood({
        avatar: '🦁',
        label: 'أسطوري وفخور',
        score: 95,
        reason: 'إنجاز بطولي في المذاكرة وساعات متقدمة!',
        speech: 'عاش يا دكتور كريم! مجموعك وأداؤك اليوم مشرف وعلى طريق أوائل الجمهورية. استمر بنفس القوة ولا تتنازل!'
      });
    } else if (todayMins >= 120) {
      setAiMood({
        avatar: '🌿',
        label: 'إيجابي ومتقدم',
        score: 75,
        reason: 'مستوى طيب ولكن باقي الساعات بحاجة لتركيز مضاعف.',
        speech: 'خطوة ممتازة يا كريم، بس حلم الطب محتاج ندوس أكتر. قدامك لسه ساعات في اليوم لازم تستغلها!'
      });
    } else {
      setAiMood({
        avatar: '⚠️',
        label: 'محاسبة وعتاب حار',
        score: 45,
        reason: 'فاقد زمني كبير وتأخر في تحقيق الساعات المطلوبة.',
        speech: 'مزاكرتش ليه ليه لحد دلوقتي يا كريم؟! الساعات بتضيع من حلمك وتعب أهلك! اقفل كل المشتتات وابدأ فوراً!'
      });
    }

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
      return next;
    });
    setTimeout(() => triggerAutoSync(), 400);
  };

  // Add Task
  const handleSaveNewTask = (taskData: { dayId: string; subjId: string; text: string; priority: WeeklyTask['priority'] }) => {
    const newTask: WeeklyTask = {
      id: Date.now(),
      dayId: taskData.dayId,
      subjId: taskData.subjId,
      text: taskData.text,
      priority: taskData.priority
    };
    setWeeklyTasks((prev) => [newTask, ...prev]);
    showToast('تمت إضافة المهمة بنجاح!');
    setTimeout(() => triggerAutoSync(), 400);
  };

  // Edit Task
  const handleOpenEditTask = (task: WeeklyTask) => {
    setTaskToEdit(task);
    setIsEditTaskOpen(true);
  };

  const handleUpdateTask = (updatedTask: WeeklyTask) => {
    setWeeklyTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    showToast('تم حفظ تعديلات المهمة بنجاح!');
    setTimeout(() => triggerAutoSync(), 400);
  };

  // Delete Task
  const handleDeleteTask = (taskId: string | number) => {
    setWeeklyTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast('تم حذف المهمة');
    setTimeout(() => triggerAutoSync(), 400);
  };

  // Lecture Toggle
  const handleToggleLecture = (lecId: string) => {
    setLectures((prev) =>
      prev.map((l) => (l.id === lecId ? { ...l, isDone: !l.isDone } : l))
    );
    showToast('تم تحديث حالة المحاضرة');
    setTimeout(() => triggerAutoSync(), 400);
  };

  // Add Lecture
  const handleSaveNewLecture = (lecData: Omit<Lecture, 'id' | 'isDone'>) => {
    const newLec: Lecture = {
      ...lecData,
      id: `lec_${Date.now()}`,
      isDone: false
    };
    setLectures((prev) => [newLec, ...prev]);
    showToast('تمت إضافة المحاضرة بنجاح');
    setTimeout(() => triggerAutoSync(), 400);
  };

  // Edit Lecture
  const handleOpenEditLecture = (lecture: Lecture) => {
    setLectureToEdit(lecture);
    setIsEditLectureOpen(true);
  };

  const handleUpdateLecture = (updatedLecture: Lecture) => {
    setLectures((prev) => prev.map((l) => (l.id === updatedLecture.id ? updatedLecture : l)));
    showToast('تم حفظ تعديلات المحاضرة بنجاح!');
    setTimeout(() => triggerAutoSync(), 400);
  };

  const handleDeleteLecture = (id: string) => {
    setLectures((prev) => prev.filter((l) => l.id !== id));
    showToast('تم حذف المحاضرة');
    setTimeout(() => triggerAutoSync(), 400);
  };

  // Add Exam
  const handleSaveExam = async (examData: Omit<ExamRecord, 'id' | 'pct'>) => {
    const pct = Math.round((examData.score / examData.total) * 100);
    const newExam: ExamRecord = {
      ...examData,
      id: `exam_${Date.now()}`,
      pct
    };

    setExams((prev) => [newExam, ...prev]);
    showToast('تم تسجيل نتيجة الامتحان!');

    // Call instant AI reaction
    const currentAvg = exams.length > 0
      ? Math.round(exams.reduce((a, b) => a + (b.pct || 0), 0) / exams.length)
      : pct;

    const res = await callAiExamReaction(newExam, currentAvg, customAiInstructions);
    setLastExamForReaction(newExam);
    setExamReactionText(res.reaction);
    setIsExamReactionOpen(true);

    setTimeout(() => triggerAutoSync(), 400);
  };

  // Edit Exam
  const handleOpenEditExam = (exam: ExamRecord) => {
    setExamToEdit(exam);
    setIsEditExamOpen(true);
  };

  const handleUpdateExam = (updatedExam: ExamRecord) => {
    setExams((prev) => prev.map((e) => (e.id === updatedExam.id ? updatedExam : e)));
    showToast('تم حفظ تعديلات الامتحان بنجاح!');
    setTimeout(() => triggerAutoSync(), 400);
  };

  // Delete Exam
  const handleDeleteExam = (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    showToast('تم حذف سجل الامتحان');
    setTimeout(() => triggerAutoSync(), 400);
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
    const stTime = sessionStartTimeRef.current || (now - elapsedSeconds * 1000);
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
    saveActiveSession({
      isRunning: false,
      startTime: sessionStartTimeRef.current || Date.now(),
      subjId: activeSubjId,
      taskNote: taskNote,
      pausedElapsed: elapsedSeconds
    });
    showToast('تم إيقاف الجلسة مؤقتاً وحفظ حالتها سحابياً');
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
    const pendingTasks = weeklyTasks.filter((t) => !completedTaskIds.has(t.id));
    const sched = await callAiSchedule({
      availableHours: hours,
      bedtime,
      focusLevel,
      pendingTasks,
      examStats: { count: exams.length },
      customInstructions: customAiInstructions
    });
    setAiScheduleText(sched);
    setIsGeneratingSchedule(false);
  };

  // AI Exam Audit Action
  const handleTriggerExamAudit = async () => {
    setIsAuditingExams(true);
    const report = await callAiExamAudit(exams, customAiInstructions);
    setExamAuditReport(report);
    setIsAuditingExams(false);
  };

  // AI Backlog Interrogation & Direct Accountability Action
  const handleTriggerInterrogation = async () => {
    setIsInterrogating(true);
    setIsInterrogationOpen(true);
    const undoneLectures = lectures.filter((l) => !l.isDone).map((l) => `${l.title} (${l.code})`);
    const pendingTasks = weeklyTasks
      .filter((t) => !completedTaskIds.has(t.id) && !completedTaskIds.has(String(t.id)))
      .map((t) => `${t.text} [${t.dayId}]`);
    const lowExams = exams
      .filter((e) => (e.pct || Math.round((e.score / e.total) * 100)) < 95)
      .map((e) => `${e.topic} (${e.score}/${e.total} = ${e.pct || Math.round((e.score / e.total) * 100)}%) مع ${e.teacher}`);

    const backlogData = {
      student: 'كريم عمر سيد',
      track: 'تانية ثانوي علمي علوم - طب وحياة',
      goal: 'أوائل الجمهورية والطب البشري',
      undoneLectures,
      pendingTasks,
      lowExams
    };

    const text = await callAiInterrogate(backlogData, customAiInstructions);
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
      />

      <main className="container">
        {/* Navigation Tabs */}
        <ViewNav currentTab={currentTab} onSelectTab={setCurrentTab} />

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
            onTriggerAudit={() => handleTriggerAiAudit(true)}
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

        {/* VIEW 3: WEEKLY TASKS & 4-DAY POSTER */}
        {currentTab === 'weeklyView' && (
          <WeeklyView
            tasks={weeklyTasks}
            subjects={subjects}
            completedTaskIds={completedTaskIds}
            onToggleTask={handleToggleTask}
            onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
            onOpenEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTask}
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
            onOpenBreak={() => setIsBreakOpen(true)}
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
          />
        )}
      </main>

      {/* Modals */}
      <BreakModal
        isOpen={isBreakOpen}
        onClose={() => setIsBreakOpen(false)}
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
      />

      <ManualSessionModal
        isOpen={isManualSessionOpen}
        onClose={() => setIsManualSessionOpen(false)}
        subjects={subjects}
        onSave={handleSaveManualSession}
      />
    </div>
  );
};
