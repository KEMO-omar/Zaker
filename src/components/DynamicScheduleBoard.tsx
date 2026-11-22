import React, { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Subject, WeeklyTask, Lecture, ArchivedWeek } from '../types';
import {
  FIXED_WEEKLY_CLASSES,
  ORDERED_WEEK_DAYS,
  DYNAMIC_STUDY_POOL,
  buildRandomizedWeeklySchedule,
  getCurrentArabicDayId,
  getArabicDayLabel,
  normalizeDaySlots,
  sortLecturesByOrder
} from '../utils/scheduleEngine';
import {
  Calendar,
  CalendarCheck,
  Clock,
  Download,
  Building2,
  Laptop,
  RotateCcw,
  ArrowRightLeft,
  Plus,
  Trash2,
  Pencil,
  Bell,
  Archive,
  Eye,
  History,
  Shuffle,
  Search,
  Star,
  LayoutGrid,
  Check,
  X
} from 'lucide-react';

// Exact calibrated coordinates measured directly from public/weekly_schedule_template.png (2000x1414)
export const SCHEDULE_GRID_CONFIG = {
  width: 2000,
  height: 1414,
  weekHeaderPill: { minX: 1239, minY: 81, width: 317, height: 76, leftPct: 61.95, topPct: 5.73, widthPct: 15.85, heightPct: 5.37 },
  columns: [
    { dayId: 'fri', label: 'الجمعة', startX: 30, width: 267, leftPct: 1.5, widthPct: 13.35 },
    { dayId: 'thu', label: 'الخميس', startX: 310, width: 267, leftPct: 15.5, widthPct: 13.35 },
    { dayId: 'wed', label: 'الأربعاء', startX: 590, width: 266, leftPct: 29.5, widthPct: 13.3 },
    { dayId: 'tue', label: 'الثلاثاء', startX: 870, width: 266, leftPct: 43.5, widthPct: 13.3 },
    { dayId: 'mon', label: 'الاثنين', startX: 1149, width: 267, leftPct: 57.45, widthPct: 13.35 },
    { dayId: 'sun', label: 'الأحد', startX: 1429, width: 267, leftPct: 71.45, widthPct: 13.35 },
    { dayId: 'sat', label: 'السبت', startX: 1709, width: 267, leftPct: 85.45, widthPct: 13.35 }
  ],
  rows: [
    { index: 0, startY: 377, height: 85, topPct: 26.66, heightPct: 6.01 },
    { index: 1, startY: 475, height: 86, topPct: 33.59, heightPct: 6.08 },
    { index: 2, startY: 574, height: 85, topPct: 40.59, heightPct: 6.01 },
    { index: 3, startY: 672, height: 85, topPct: 47.52, heightPct: 6.01 },
    { index: 4, startY: 770, height: 86, topPct: 54.46, heightPct: 6.08 },
    { index: 5, startY: 868, height: 86, topPct: 61.39, heightPct: 6.08 },
    { index: 6, startY: 967, height: 85, topPct: 68.39, heightPct: 6.01 },
    { index: 7, startY: 1065, height: 86, topPct: 75.32, heightPct: 6.08 },
    { index: 8, startY: 1163, height: 86, topPct: 82.25, heightPct: 6.08 },
    { index: 9, startY: 1262, height: 85, topPct: 89.25, heightPct: 6.01 }
  ]
};

const SUBJECT_SHORT_LABELS: Record<string, { name: string; color: string }> = {
  physics: { name: 'فيزياء', color: '#818cf8' },
  arabic: { name: 'عربي', color: '#f59e0b' },
  english: { name: 'إنجليزي', color: '#38bdf8' },
  history: { name: 'تاريخ', color: '#10b981' }
};

function getCategoryMeta(task: WeeklyTask) {
  if (task.category === 'center') return { label: 'سنتر', color: '#38bdf8' };
  if (task.category === 'review') return { label: 'مراجعة', color: '#14b8a6' };
  if (task.category === 'exam' || task.priority === 'exam') return { label: 'امتحان', color: '#a78bfa' };
  if (task.category === 'manual' || task.isUserAdded) return { label: 'مهمتك', color: '#f97316' };
  if (task.category === 'platform') return { label: 'محاضرة', color: '#fbbf24' };
  if (task.priority === 'urgent' || task.isRolled) return { label: 'عاجل', color: '#ef4444' };
  return { label: 'مذاكرة', color: '#10b981' };
}

interface DynamicScheduleBoardProps {
  tasks: WeeklyTask[];
  subjects: Subject[];
  completedTaskIds: Set<string | number>;
  onToggleTask: (taskId: string | number) => void;
  onOpenNewTaskModal: () => void;
  onOpenEditTask: (task: WeeklyTask) => void;
  onDeleteTask?: (taskId: string | number) => void;
  onUpdateAllTasks?: (tasks: WeeklyTask[]) => void;
  archivedWeeks?: ArchivedWeek[];
  onArchiveWeek?: (archive: ArchivedWeek, cleanTasks: WeeklyTask[]) => void;
  lectures?: Lecture[];
  onOpenNotificationsCenter?: () => void;
}

export const DynamicScheduleBoard: React.FC<DynamicScheduleBoardProps> = ({
  tasks,
  subjects,
  completedTaskIds,
  onToggleTask,
  onOpenNewTaskModal,
  onOpenEditTask,
  onDeleteTask,
  onUpdateAllTasks,
  archivedWeeks = [],
  onArchiveWeek,
  lectures = [],
  onOpenNotificationsCenter
}) => {
  // Primary schedule view is the Official Image Poster with crisp full-text capsules; Cards / Checklist / Timeblock / Archive are 1 click away
  const [activeViewMode, setActiveViewMode] = useState<'poster' | 'cards' | 'checklist' | 'timeblock' | 'archive'>('poster');
  const [boardDayFocus, setBoardDayFocus] = useState<string>('all');
  const [boardSubjFilter, setBoardSubjFilter] = useState<string>('all');

  const [selectedDayTab, setSelectedDayTab] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'pending' | 'review' | 'center' | 'manual'>('all');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [quickAddInput, setQuickAddInput] = useState<{ [dayId: string]: string }>({});
  const [quickAddSubj, setQuickAddSubj] = useState<{ [dayId: string]: string }>({});
  const [boardNotice, setBoardNotice] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<string>('default');

  // Inline day/slot quick-add modal state
  const [slotQuickAddDay, setSlotQuickAddDay] = useState<string | null>(null);
  const [slotQuickSlotIdx, setSlotQuickSlotIdx] = useState<number>(9);
  const [slotQuickText, setSlotQuickText] = useState<string>('');
  const [slotQuickSubj, setSlotQuickSubj] = useState<string>('physics');
  const [slotQuickCategory, setSlotQuickCategory] = useState<NonNullable<WeeklyTask['category']>>('manual');

  // Inline archive confirm modal state
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState<boolean>(false);

  // Enhanced 3-Mode Task Swap Modal State
  const [swapModalOpen, setSwapModalOpen] = useState<boolean>(false);
  const [taskToSwap, setTaskToSwap] = useState<WeeklyTask | null>(null);
  const [swapMode, setSwapMode] = useState<'schedule' | 'lectures' | 'move'>('schedule');
  const [selectedScheduleTargetId, setSelectedScheduleTargetId] = useState<string>('');
  const [swapScheduleSearch, setSwapScheduleSearch] = useState<string>('');
  const [swapLectureSearch, setSwapLectureSearch] = useState<string>('');
  const [swapLectureFilter, setSwapLectureFilter] = useState<'all' | 'pending' | 'review'>('all');
  const [swapLectureSubjFilter, setSwapLectureSubjFilter] = useState<string>('all');
  const [selectedLectureId, setSelectedLectureId] = useState<string>('');
  const [swapTargetDay, setSwapTargetDay] = useState<string>('sat');
  const [swapBankSelect, setSwapBankSelect] = useState<string>('');

  const templateImgRef = useRef<HTMLImageElement | null>(null);
  const todayDayId = getCurrentArabicDayId();

  const flashNotice = (msg: string) => {
    setBoardNotice(msg);
    setTimeout(() => setBoardNotice(null), 5000);
  };

  const isTaskDone = (taskId: string | number) =>
    completedTaskIds.has(taskId) || completedTaskIds.has(String(taskId));

  // Preload template image
  useEffect(() => {
    const img = new Image();
    img.src = '/weekly_schedule_template.png';
    img.onload = () => {
      templateImgRef.current = img;
    };
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  // Deterministic slot mapping per day (0..9)
  const daySlotsMap = useMemo(() => {
    const map = new Map<string, Array<WeeklyTask | null>>();
    ORDERED_WEEK_DAYS.forEach(d => {
      map.set(d.id, new Array(10).fill(null));
    });

    const normalized = normalizeDaySlots(tasks);
    normalized.forEach(t => {
      if (t.dayId && map.has(t.dayId)) {
        const slots = map.get(t.dayId)!;
        if (typeof t.slotIndex === 'number' && t.slotIndex >= 0 && t.slotIndex <= 9 && slots[t.slotIndex] === null) {
          slots[t.slotIndex] = t;
        }
      }
    });

    return map;
  }, [tasks]);

  // Lectures sorted strictly by Karim's defined order
  const orderedLectures = useMemo(() => sortLecturesByOrder(lectures), [lectures]);

  // Overall statistics
  const totalTasksCount = tasks.length;
  const completedCount = tasks.filter(t => isTaskDone(t.id)).length;
  const pendingCount = totalTasksCount - completedCount;
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

  // Handle task check with confetti
  const handleCheck = (taskId: string | number) => {
    const doneNow = isTaskDone(taskId);
    onToggleTask(taskId);
    if (!doneNow) {
      try {
        confetti({
          particleCount: 55,
          spread: 70,
          origin: { y: 0.65 }
        });
      } catch (e) {}
    }
  };

  // Quick add task in checklist (places cleanly in bottom slot 9 or open slot)
  const handleQuickAdd = (dayId: string) => {
    const text = quickAddInput[dayId]?.trim();
    if (!text || !onUpdateAllTasks) return;

    const chosenSubj = quickAddSubj[dayId] || 'physics';
    const slots = daySlotsMap.get(dayId) || [];
    const firstFree = slots.findIndex(s => s === null);

    const newTask: WeeklyTask = {
      id: `task_quick_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dayId,
      subjId: chosenSubj,
      text,
      priority: 'urgent',
      category: 'manual',
      isUserAdded: true,
      slotIndex: firstFree !== -1 ? firstFree : 9
    };

    onUpdateAllTasks([...tasks, newTask]);
    setQuickAddInput(prev => ({ ...prev, [dayId]: '' }));
    flashNotice(`⚡ تمت إضافة مهمتك (${SUBJECT_SHORT_LABELS[chosenSubj]?.name || chosenSubj}) ليوم ${getArabicDayLabel(dayId)} وحفظها!`);
  };

  // Save inline modal for a day slot
  const handleSaveSlotQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotQuickAddDay || !slotQuickText.trim() || !onUpdateAllTasks) return;

    const newTask: WeeklyTask = {
      id: `task_manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dayId: slotQuickAddDay,
      subjId: slotQuickSubj,
      text: slotQuickText.trim(),
      priority: slotQuickCategory === 'exam' ? 'exam' : 'urgent',
      category: slotQuickCategory,
      isUserAdded: true,
      slotIndex: slotQuickSlotIdx
    };

    onUpdateAllTasks([...tasks, newTask]);
    flashNotice(`✅ تم تثبيت المهمة (${SUBJECT_SHORT_LABELS[slotQuickSubj]?.name || slotQuickSubj}) ليوم ${getArabicDayLabel(slotQuickAddDay)}!`);
    setSlotQuickAddDay(null);
    setSlotQuickText('');
  };

  /**
   * Smart Partial Randomizer:
   * - LOCKS all completed tasks (isDone === true), fixed center classes, and Karim's user-added tasks in their exact slots!
   * - Fills ALL 10 slots (0..9) per day so no day is left missing a task!
   * - ONLY randomizes/replaces UNCOMPLETED auto tasks using Karim's ordered lectures!
   */
  const handleRandomizeUndoneOnly = () => {
    if (!onUpdateAllTasks) return;

    const lockedTasks = tasks.filter(
      (t) =>
        isTaskDone(t.id) ||
        t.category === 'center' ||
        t.isUserAdded ||
        t.category === 'manual' ||
        t.category === 'exam'
    );

    const lockedDoneCount = tasks.filter((t) => isTaskDone(t.id)).length;
    const replacedCount = Math.max(0, tasks.length - lockedTasks.length);

    const freshTasks = buildRandomizedWeeklySchedule({
      lectures: orderedLectures,
      lockedTasks,
      respectLectureOrder: true
    });

    onUpdateAllTasks(freshTasks);
    flashNotice(
      `🎲 تم تجديد ${replacedCount} مهمة غير منجزة في الخانات التسع الأولى وفق ترتيب دروسك (مع ترك الخانة الأخيرة فارغة لإضافاتك والحفاظ على ${lockedDoneCount} منجزة والسناتر ومهامك اليدوية)!`
    );
  };

  // Rollover uncompleted non-center tasks to next day cleanly without slot collisions
  const handleRolloverTasks = () => {
    if (!onUpdateAllTasks) return;

    const dayKeys = ORDERED_WEEK_DAYS.map(d => d.id);
    let rolledCount = 0;

    const rolledTasks = tasks.map(t => {
      if (isTaskDone(t.id) || t.category === 'center' || t.dayId === 'fri' || t.dayId === 'backlog') {
        return t;
      }
      const idx = dayKeys.indexOf(t.dayId);
      if (idx === -1 || idx >= dayKeys.length - 1) return t;
      const nextDay = dayKeys[idx + 1];
      rolledCount++;
      return {
        ...t,
        dayId: nextDay,
        slotIndex: undefined,
        priority: 'urgent' as const,
        isRolled: true,
        originalDayId: t.originalDayId || t.dayId,
        text: t.isRolled ? t.text : `[مرحّل] ${t.text}`
      };
    });

    if (rolledCount > 0) {
      onUpdateAllTasks(normalizeDaySlots(rolledTasks));
      flashNotice(`🚨 تم ترحيل ${rolledCount} مهمة غير منجزة إلى اليوم التالي بأولوية عاجلة وحفظ الجدول!`);
    } else {
      flashNotice('✅ ممتاز يا دكتور! كل مهام الأيام السابقة منجزة ولا توجد مهام متأخرة.');
    }
  };

  // Open Enhanced 3-Mode Swap Modal
  const handleOpenSwap = (task: WeeklyTask) => {
    setTaskToSwap(task);
    setSwapMode('schedule');
    setSelectedScheduleTargetId('');
    setSwapScheduleSearch('');
    setSelectedLectureId('');
    setSwapLectureSearch('');
    setSwapTargetDay(task.dayId);
    setSwapBankSelect('');
    setSwapModalOpen(true);
  };

  const handleExecuteSwap = () => {
    if (!taskToSwap || !onUpdateAllTasks) return;

    const currentNormalized = normalizeDaySlots(tasks);
    const sourceTask = currentNormalized.find(t => String(t.id) === String(taskToSwap.id)) || taskToSwap;
    let updatedTasks = [...currentNormalized];

    if (swapMode === 'schedule' && selectedScheduleTargetId) {
      const targetTask = currentNormalized.find(t => String(t.id) === selectedScheduleTargetId);
      if (!targetTask) return;

      const sourceDay = sourceTask.dayId;
      const sourceSlot = sourceTask.slotIndex;
      const destDay = targetTask.dayId;
      const destSlot = targetTask.slotIndex;

      updatedTasks = updatedTasks.map(t => {
        if (String(t.id) === String(sourceTask.id)) {
          return { ...t, dayId: destDay, slotIndex: destSlot };
        }
        if (String(t.id) === String(targetTask.id)) {
          return { ...t, dayId: sourceDay, slotIndex: sourceSlot };
        }
        return t;
      });

      onUpdateAllTasks(updatedTasks);
      flashNotice(`🔁 تم تبديل المهمتين وحفظهما في الجدول حتى نهاية الأسبوع!`);
    } else if (swapMode === 'lectures' && selectedLectureId) {
      const lec = orderedLectures.find(l => l.id === selectedLectureId);
      if (!lec) return;

      updatedTasks = updatedTasks.map(t => {
        if (String(t.id) === String(sourceTask.id)) {
          return {
            ...t,
            subjId: lec.subjId,
            text: lec.isDone ? `[مراجعة] ${lec.code}: ${lec.title}` : `${lec.code}: ${lec.title}`,
            category: lec.isDone ? 'review' : 'platform',
            priority: lec.isDone ? 'normal' : 'high',
            teacher: lec.packageName || 'محاضرة',
            time: lec.dueDay || '',
            lectureId: lec.id
          };
        }
        return t;
      });

      onUpdateAllTasks(updatedTasks);
      flashNotice(`📚 تم استبدال الخانة بالمحاضرة «${lec.title}» وحفظ الجدول!`);
    } else if (swapMode === 'move') {
      if (swapBankSelect) {
        const bankItem = DYNAMIC_STUDY_POOL.find(item => item.text === swapBankSelect);
        if (bankItem) {
          updatedTasks = updatedTasks.map(t =>
            String(t.id) === String(sourceTask.id)
              ? { ...t, subjId: bankItem.subjId, text: bankItem.text, category: 'study', lectureId: undefined }
              : t
          );
          onUpdateAllTasks(updatedTasks);
          flashNotice('✅ تم استبدال المهمة من بنك المذاكرة وحفظ الجدول.');
        }
      } else if (swapTargetDay !== sourceTask.dayId) {
        const destTasks = updatedTasks.filter(t => t.dayId === swapTargetDay);
        const usedInDest = new Set(destTasks.map(t => t.slotIndex).filter((s): s is number => typeof s === 'number'));
        let freeSlot: number | undefined = undefined;
        for (let i = 0; i <= 9; i++) {
          if (!usedInDest.has(i)) { freeSlot = i; break; }
        }

        if (freeSlot !== undefined) {
          updatedTasks = updatedTasks.map(t =>
            String(t.id) === String(sourceTask.id)
              ? { ...t, dayId: swapTargetDay, slotIndex: freeSlot }
              : t
          );
          onUpdateAllTasks(updatedTasks);
          flashNotice(`📅 تم نقل المهمة إلى يوم ${getArabicDayLabel(swapTargetDay)} وحفظها.`);
        } else {
          const candidateInDest = [...destTasks]
            .reverse()
            .find(t => !isTaskDone(t.id) && t.category !== 'center');
          if (candidateInDest) {
            const sourceDay = sourceTask.dayId;
            const sourceSlot = sourceTask.slotIndex;
            const destSlot = candidateInDest.slotIndex;
            updatedTasks = updatedTasks.map(t => {
              if (String(t.id) === String(sourceTask.id)) return { ...t, dayId: swapTargetDay, slotIndex: destSlot };
              if (String(t.id) === String(candidateInDest.id)) return { ...t, dayId: sourceDay, slotIndex: sourceSlot };
              return t;
            });
            onUpdateAllTasks(updatedTasks);
            flashNotice(`🔁 يوم ${getArabicDayLabel(swapTargetDay)} مكتمل — تم التبادل مع «${candidateInDest.text}» وحفظ الجدول!`);
          }
        }
      }
    }

    setSwapModalOpen(false);
    setTaskToSwap(null);
  };

  // Execute Week Archive & Start Fresh Schedule respecting Karim's lecture order (10/10 full)
  const confirmExecuteArchive = (autoFillNewWeek: boolean) => {
    if (!onArchiveWeek) return;

    const archiveRecord: ArchivedWeek = {
      id: `archive_${Date.now()}`,
      weekTitle: `الأسبوع المنتهي في ${new Date().toLocaleDateString('ar-EG')}`,
      archivedAt: new Date().toISOString(),
      totalCount: totalTasksCount,
      completedCount,
      completionPct: completionPercentage,
      tasks: []
    };

    const cleanTasks = autoFillNewWeek
      ? buildRandomizedWeeklySchedule({
          lectures: orderedLectures,
          preserveUserTasks: [],
          respectLectureOrder: true
        })
      : FIXED_WEEKLY_CLASSES.map((f, idx) => ({
          id: `fixed_${f.dayId}_${idx}_${Date.now()}`,
          dayId: f.dayId,
          subjId: f.subjId,
          text: f.text,
          category: f.category,
          priority: f.priority,
          teacher: f.teacher,
          time: f.time,
          slotIndex: f.slotIndex
        }));

    onArchiveWeek(archiveRecord, cleanTasks);
    setArchiveConfirmOpen(false);
    flashNotice('📦 تمت أرشفة الأسبوع وتجهيز الأسبوع الجديد بنجاح وفق ترتيب دروسك!');
  };

  // Filtered lectures for Swap Tab 2 (strictly sorted by Karim's order)
  const filteredSwapLectures = useMemo(() => {
    return orderedLectures.filter(l => {
      if (swapLectureFilter === 'pending' && l.isDone) return false;
      if (swapLectureFilter === 'review' && !l.isDone) return false;
      if (swapLectureSubjFilter !== 'all' && l.subjId !== swapLectureSubjFilter) return false;
      if (swapLectureSearch.trim()) {
        const q = swapLectureSearch.trim().toLowerCase();
        return (
          l.title.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q) ||
          (l.packageName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orderedLectures, swapLectureFilter, swapLectureSubjFilter, swapLectureSearch]);

  // Other tasks on schedule for 2-way Swap Tab 1 (supports search)
  const swappableScheduleTasks = useMemo(() => {
    if (!taskToSwap) return [];
    return tasks
      .filter(t => String(t.id) !== String(taskToSwap.id) && t.dayId !== 'backlog')
      .filter(t => {
        if (!swapScheduleSearch.trim()) return true;
        const q = swapScheduleSearch.trim().toLowerCase();
        const dayLbl = getArabicDayLabel(t.dayId).toLowerCase();
        const subjLbl = (SUBJECT_SHORT_LABELS[t.subjId]?.name || '').toLowerCase();
        return t.text.toLowerCase().includes(q) || dayLbl.includes(q) || subjLbl.includes(q);
      });
  }, [tasks, taskToSwap, swapScheduleSearch]);

  // Crisp PNG Poster Export using legible Cairo font + safe horizontal capsule bounds
  const generateScheduleCanvas = async () => {
    setIsGeneratingImage(true);
    const canvas = document.createElement('canvas');
    canvas.width = SCHEDULE_GRID_CONFIG.width;
    canvas.height = SCHEDULE_GRID_CONFIG.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsGeneratingImage(false);
      return;
    }

    let templateImg = templateImgRef.current;
    if (!templateImg || !templateImg.complete) {
      templateImg = new Image();
      templateImg.src = '/weekly_schedule_template.png';
      await new Promise(resolve => {
        templateImg!.onload = resolve;
      });
    }

    ctx.drawImage(templateImg, 0, 0, 2000, 1414);

    try {
      await document.fonts.load('700 18px "Cairo"');
    } catch (e) {}

    // Fill Top-Right Header Pill ("جدول الاسبوع :") cleanly
    const hp = SCHEDULE_GRID_CONFIG.weekHeaderPill;
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px "Cairo", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    ctx.fillText(
      `الأسبوع الحالي (${completedCount}/${totalTasksCount})`,
      hp.minX + hp.width / 2,
      hp.minY + hp.height / 2 + 2
    );
    ctx.restore();

    // Draw every day & capsule safely inside rounded boundaries
    SCHEDULE_GRID_CONFIG.columns.forEach(col => {
      const dayTasks = daySlotsMap.get(col.dayId) || [];

      SCHEDULE_GRID_CONFIG.rows.forEach(row => {
        const task = dayTasks[row.index];
        if (!task) return;

        const done = isTaskDone(task.id);
        const capsuleX = col.startX;
        const capsuleY = row.startY;
        const capsuleW = col.width;
        const capsuleH = row.height;
        const subjMeta = SUBJECT_SHORT_LABELS[task.subjId] || { name: task.subjId || 'مادة', color: '#475569' };

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(capsuleX + 5, capsuleY + 3, capsuleW - 10, capsuleH - 6, 36);
        ctx.clip();

        if (done) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
          ctx.fillRect(capsuleX, capsuleY, capsuleW, capsuleH);
        }

        // Top subtle colored indicator + subject name cleanly centered high
        ctx.font = 'bold 11.5px "Cairo", sans-serif';
        ctx.direction = 'rtl';
        ctx.fillStyle = done ? '#059669' : subjMeta.color;
        ctx.textAlign = 'center';
        ctx.fillText(
          done ? `✓ ${subjMeta.name} (منجز)` : `● ${subjMeta.name}`,
          capsuleX + capsuleW / 2,
          capsuleY + 17
        );

        // Dynamic auto-fit wrapping up to 3 lines so 100% of every task title renders clearly without cutoff
        const maxTextW = capsuleW - 30;
        const wrapForFont = (fontPx: number): string[] => {
          ctx.font = `bold ${fontPx}px "Cairo", sans-serif`;
          const words = task.text.trim().split(/\s+/);
          const wrapped: string[] = [];
          let line = '';
          for (const w of words) {
            const candidate = line ? `${line} ${w}` : w;
            if (ctx.measureText(candidate).width <= maxTextW) {
              line = candidate;
            } else {
              if (line) wrapped.push(line);
              line = w;
            }
          }
          if (line) wrapped.push(line);
          return wrapped;
        };

        let chosenFont = 16;
        let finalLines = wrapForFont(16);
        if (finalLines.length > 2) {
          chosenFont = 14;
          finalLines = wrapForFont(14);
        }
        if (finalLines.length > 3) {
          chosenFont = 12;
          finalLines = wrapForFont(12);
        }
        if (finalLines.length > 3) {
          chosenFont = 10.5;
          finalLines = wrapForFont(10.5);
        }

        ctx.fillStyle = done ? '#475569' : '#0f172a';
        ctx.font = `bold ${chosenFont}px "Cairo", sans-serif`;
        ctx.textAlign = 'center';
        ctx.direction = 'rtl';

        const displayLines = finalLines.slice(0, 3);
        const lineGap = chosenFont + 3;
        const startY =
          displayLines.length === 1
            ? capsuleY + 52
            : displayLines.length === 2
            ? capsuleY + 41
            : capsuleY + 34;

        displayLines.forEach((ln, lIdx) => {
          ctx.fillText(ln, capsuleX + capsuleW / 2, startY + lIdx * lineGap);
        });

        if (done) {
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(capsuleX + 28, capsuleY + capsuleH / 2 + 8);
          ctx.lineTo(capsuleX + capsuleW - 28, capsuleY + capsuleH / 2 + 8);
          ctx.stroke();
        }

        ctx.restore();
      });
    });

    const dataUrl = canvas.toDataURL('image/png');
    setIsGeneratingImage(false);

    const link = document.createElement('a');
    link.download = `جدول_المذاكرة_الأسبوعي_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataUrl;
    link.click();
    flashNotice('🖼️ تم توليد وتحميل صورة الجدول بتصميم واضح ومنسق!');
  };

  const getSubject = (subjId?: string) => subjects.find(s => s.id === subjId);

  const handleRequestNotifications = async () => {
    if (onOpenNotificationsCenter) {
      onOpenNotificationsCenter();
      return;
    }
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
    }
  };

  const weekLabelText = useMemo(() => {
    const d = new Date();
    return `الأسبوع الحالي · ${completedCount}/${totalTasksCount}`;
  }, [completedCount, totalTasksCount]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Live Feedback Notice */}
      {boardNotice && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#10b981',
            fontWeight: 700,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10
          }}
        >
          <span>{boardNotice}</span>
          <button
            onClick={() => setBoardNotice(null)}
            style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Clean Unified Command Bar */}
      <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          {/* Progress Overview */}
          <div style={{ minWidth: 230, flex: '1 1 260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-main)', fontWeight: 700, flexWrap: 'wrap' }}>
              <span className="tabular" style={{ fontSize: 17, fontWeight: 800, color: 'var(--accent-primary)' }}>
                {completionPercentage}%
              </span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span className="tabular">{completedCount} من {totalTasksCount} مهمة منجزة</span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span style={{ color: '#fbbf24' }}>اليوم: {getArabicDayLabel(todayDayId)}</span>
              {pendingCount > 0 && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>·</span>
                  <span className="tabular" style={{ color: 'var(--text-muted)', fontSize: 12 }}>متبقي {pendingCount}</span>
                </>
              )}
            </div>
            <div style={{ width: '100%', maxWidth: 400, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden', marginTop: 8 }}>
              <div
                style={{
                  width: `${completionPercentage}%`,
                  height: '100%',
                  background: 'var(--accent-primary)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn btn-sm btn-primary"
              onClick={onOpenNewTaskModal}
              style={{ fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              <Plus size={14} />
              <span>إضافة مهمة</span>
            </button>

            <button
              className="btn btn-sm"
              onClick={handleRandomizeUndoneOnly}
              title="يجدد المهام غير المنجزة فقط وفق ترتيب دروسك ويحافظ على المنجز والسناتر ومهامك اليدوية"
              style={{
                borderColor: 'var(--accent-primary)',
                color: 'var(--accent-primary)',
                background: 'rgba(86, 194, 166, 0.08)',
                fontWeight: 700,
                whiteSpace: 'nowrap'
              }}
            >
              <Shuffle size={14} />
              <span>تغيير عشوائي لغير المنجز</span>
            </button>

            <button
              className="btn btn-sm"
              onClick={handleRolloverTasks}
              title="ترحيل المهام غير المنجزة لليوم التالي"
              style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: 'var(--warning)', whiteSpace: 'nowrap' }}
            >
              <RotateCcw size={14} />
              <span>ترحيل المتأخر</span>
            </button>

            <button
              className="btn btn-sm"
              onClick={generateScheduleCanvas}
              disabled={isGeneratingImage}
              style={{ whiteSpace: 'nowrap' }}
            >
              <Download size={14} />
              <span>{isGeneratingImage ? 'جارٍ التوليد...' : 'تحميل PNG'}</span>
            </button>

            <button
              className="btn btn-sm"
              onClick={handleRequestNotifications}
              style={{ color: notificationStatus === 'granted' ? 'var(--success)' : 'var(--text-main)', whiteSpace: 'nowrap' }}
              title="مركز التنبيهات والرسائل"
            >
              <Bell size={14} />
              <span>التنبيهات</span>
            </button>

            <button
              className="btn btn-sm"
              onClick={() => setArchiveConfirmOpen(true)}
              style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
            >
              <Archive size={14} />
              <span>أرشفة</span>
            </button>
          </div>
        </div>

        {/* View Mode Switcher Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 14,
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 12
          }}
        >
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${activeViewMode === 'poster' ? 'btn-primary' : ''}`}
              onClick={() => setActiveViewMode('poster')}
              style={{ fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              <Eye size={14} />
              <span>البوستر الرسمي (الرئيسي)</span>
            </button>

            <button
              className={`btn btn-sm ${activeViewMode === 'cards' ? 'btn-primary' : ''}`}
              onClick={() => setActiveViewMode('cards')}
              style={{ fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              <LayoutGrid size={14} />
              <span>الجدول المنسق (كروت)</span>
            </button>

            <button
              className={`btn btn-sm ${activeViewMode === 'checklist' ? 'btn-primary' : ''}`}
              onClick={() => setActiveViewMode('checklist')}
              style={{ fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              <CalendarCheck size={14} />
              <span>قائمة التفصيل (<span className="tabular">{totalTasksCount}</span>)</span>
            </button>

            <button
              className={`btn btn-sm ${activeViewMode === 'timeblock' ? 'btn-primary' : ''}`}
              onClick={() => setActiveViewMode('timeblock')}
              style={{ fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              <Clock size={14} />
              <span>البومودورو</span>
            </button>

            <button
              className={`btn btn-sm ${activeViewMode === 'archive' ? 'btn-primary' : ''}`}
              onClick={() => setActiveViewMode('archive')}
              style={{ fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              <History size={14} />
              <span>الأرشيف (<span className="tabular">{archivedWeeks.length}</span>)</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1 (DEFAULT): CLEAN, HIGH-LEGIBILITY RESPONSIVE DAY CARDS GRID */}
      {activeViewMode === 'cards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Clean Filter Strip: Day Focus + Subject Filter */}
          <div
            className="card"
            style={{
              padding: '10px 16px',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10
            }}
          >
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                className={`btn btn-sm ${boardDayFocus === 'all' ? 'btn-primary' : ''}`}
                onClick={() => setBoardDayFocus('all')}
                style={{ fontWeight: 700, fontSize: 12 }}
              >
                كل الأسبوع (7 أيام)
              </button>
              {ORDERED_WEEK_DAYS.map(d => {
                const isToday = d.id === todayDayId;
                const active = boardDayFocus === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    className={`btn btn-sm ${active ? 'btn-primary' : ''}`}
                    onClick={() => setBoardDayFocus(d.id)}
                    style={{
                      fontSize: 12,
                      fontWeight: isToday || active ? 700 : 600,
                      borderColor: isToday && !active ? 'var(--accent-primary)' : undefined,
                      color: isToday && !active ? 'var(--accent-primary)' : undefined
                    }}
                  >
                    {d.label}{isToday ? ' (النهاردة)' : ''}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setBoardSubjFilter('all')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: boardSubjFilter === 'all' ? 800 : 600,
                  color: boardSubjFilter === 'all' ? 'var(--accent-primary)' : 'var(--text-muted)'
                }}
              >
                كل المواد
              </button>
              {Object.entries(SUBJECT_SHORT_LABELS).map(([id, meta]) => {
                const active = boardSubjFilter === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setBoardSubjFilter(active ? 'all' : id)}
                    style={{
                      border: 'none',
                      background: active ? `${meta.color}18` : 'transparent',
                      padding: '3px 8px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 12,
                      fontWeight: 700,
                      color: active ? meta.color : 'var(--text-muted)'
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color }} />
                    {meta.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Responsive Cards Grid: Today Card First when showing all, or filtered day */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: boardDayFocus === 'all' ? 'repeat(auto-fill, minmax(340px, 1fr))' : '1fr',
              gap: 16,
              alignItems: 'start'
            }}
          >
            {ORDERED_WEEK_DAYS
              .filter(d => boardDayFocus === 'all' || boardDayFocus === d.id)
              .map(day => {
                const slots = daySlotsMap.get(day.id) || [];
                const dayTasks = slots.filter((t): t is WeeklyTask => t !== null);
                const visibleSlots = slots.map((t, idx) => ({ task: t, slotIdx: idx }))
                  .filter(item => {
                    if (!item.task) return boardSubjFilter === 'all';
                    if (boardSubjFilter !== 'all' && item.task.subjId !== boardSubjFilter) return false;
                    return true;
                  });
                const dayDone = dayTasks.filter(t => isTaskDone(t.id)).length;
                const dayPct = dayTasks.length > 0 ? Math.round((dayDone / dayTasks.length) * 100) : 0;
                const isToday = day.id === todayDayId;

                return (
                  <div
                    key={day.id}
                    className="card"
                    style={{
                      padding: 16,
                      background: 'var(--bg-surface)',
                      border: isToday ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12
                    }}
                  >
                    {/* Card Header */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: isToday ? 'var(--accent-primary)' : 'var(--text-main)' }}>
                            {day.label}
                          </h3>
                          {isToday && (
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981' }}>
                              · النهاردة ★
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="tabular" style={{ fontSize: 12, fontWeight: 700, color: dayDone === dayTasks.length && dayTasks.length > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                            {dayDone}/{dayTasks.length}
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => {
                              const firstEmpty = slots.findIndex(s => s === null);
                              setSlotQuickAddDay(day.id);
                              setSlotQuickSlotIdx(firstEmpty !== -1 ? firstEmpty : 9);
                              setSlotQuickText('');
                            }}
                            title={`إضافة مهمة ليوم ${day.label}`}
                            style={{ padding: '4px 8px', fontSize: 11 }}
                          >
                            <Plus size={12} />
                            <span>إضافة</span>
                          </button>
                        </div>
                      </div>

                      {/* Thin Day Progress Bar */}
                      <div style={{ width: '100%', height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
                        <div
                          style={{
                            width: `${dayPct}%`,
                            height: '100%',
                            background: isToday ? 'var(--accent-primary)' : '#10b981',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </div>

                    {/* Clean Readable Task Rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {visibleSlots.map(({ task, slotIdx }) => {
                        if (!task) {
                          return (
                            <button
                              key={`open_${day.id}_${slotIdx}`}
                              type="button"
                              onClick={() => {
                                setSlotQuickAddDay(day.id);
                                setSlotQuickSlotIdx(slotIdx);
                                setSlotQuickText('');
                              }}
                              style={{
                                padding: '9px 12px',
                                borderRadius: 8,
                                border: '1px dashed var(--border-subtle)',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'right',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <span>+ إضافة مهمة في الخانة {slotIdx + 1}</span>
                              <Plus size={13} />
                            </button>
                          );
                        }

                        const done = isTaskDone(task.id);
                        const subjMeta = SUBJECT_SHORT_LABELS[task.subjId] || { name: task.subjId || 'مادة', color: '#64748b' };
                        const catMeta = getCategoryMeta(task);

                        return (
                          <div
                            key={task.id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 10,
                              padding: '10px 12px',
                              borderRadius: 10,
                              background: done ? 'rgba(16, 185, 129, 0.07)' : 'var(--bg-elevated)',
                              border: `1px solid ${done ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                              borderRight: `3.5px solid ${done ? '#10b981' : subjMeta.color}`,
                              transition: 'background 0.15s ease, border-color 0.15s ease'
                            }}
                          >
                            {/* Clean Checkbox */}
                            <button
                              type="button"
                              onClick={() => handleCheck(task.id)}
                              aria-label={done ? 'إلغاء الإنجاز' : 'تحديد كمنجز'}
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 6,
                                border: `1.5px solid ${done ? '#10b981' : 'var(--text-faint)'}`,
                                background: done ? '#10b981' : 'transparent',
                                color: '#0b1212',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0,
                                marginTop: 2
                              }}
                            >
                              {done && <Check size={13} strokeWidth={3} />}
                            </button>

                            {/* Readable Content */}
                            <div
                              onClick={() => handleCheck(task.id)}
                              style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                            >
                              <div
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: 700,
                                  lineHeight: 1.45,
                                  color: done ? 'var(--text-muted)' : 'var(--text-main)',
                                  textDecoration: done ? 'line-through' : 'none',
                                  wordBreak: 'break-word'
                                }}
                              >
                                {task.text}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 11.5, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                <span style={{ color: subjMeta.color, fontWeight: 700 }}>{subjMeta.name}</span>
                                <span>·</span>
                                <span style={{ color: catMeta.color, fontWeight: 600 }}>{catMeta.label}</span>
                                {task.time && (
                                  <>
                                    <span>·</span>
                                    <span>{task.time}</span>
                                  </>
                                )}
                                <span style={{ marginRight: 'auto' }} />
                                <span className="tabular" style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>#{slotIdx + 1}</span>
                              </div>
                            </div>

                            {/* Clean Compact Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => handleOpenSwap(task)}
                                title="تبديل أو استبدال المهمة"
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 6,
                                  border: '1px solid var(--border-subtle)',
                                  background: 'var(--bg-surface)',
                                  color: 'var(--text-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <ArrowRightLeft size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenEditTask(task)}
                                title="تعديل المهمة"
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 6,
                                  border: '1px solid var(--border-subtle)',
                                  background: 'var(--bg-surface)',
                                  color: 'var(--text-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <Pencil size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: AUTHENTIC POSTER OVERLAY (SHARP CAIRO TYPOGRAPHY + SAFE CAPSULE PADDING) */}
      {activeViewMode === 'poster' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '10px 18px',
              background: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              fontSize: 12
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>
              اضغط على أي كبسولة لتحديد الإنجاز · مرر الماوس أو اضغط (⇄) لتبديل المهمة
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontWeight: 700 }}>
              {Object.entries(SUBJECT_SHORT_LABELS).map(([id, meta]) => (
                <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: meta.color }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color }} />
                  {meta.name}
                </span>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative', width: '100%', overflowX: 'auto', padding: '14px 10px', background: '#0b1012', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 1240, minWidth: 920, aspectRatio: '2000 / 1414', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.45)' }}>
              <img
                src="/weekly_schedule_template.png"
                alt="جدول الأسبوع"
                style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
              />

              {/* Top-Right Week Header Pill Overlay */}
              <div
                style={{
                  position: 'absolute',
                  left: `${SCHEDULE_GRID_CONFIG.weekHeaderPill.leftPct}%`,
                  top: `${SCHEDULE_GRID_CONFIG.weekHeaderPill.topPct}%`,
                  width: `${SCHEDULE_GRID_CONFIG.weekHeaderPill.widthPct}%`,
                  height: `${SCHEDULE_GRID_CONFIG.weekHeaderPill.heightPct}%`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0f172a',
                  fontFamily: 'Cairo, sans-serif',
                  fontWeight: 800,
                  fontSize: 'clamp(11px, 1.05vw, 15px)',
                  pointerEvents: 'none',
                  zIndex: 3
                }}
              >
                {weekLabelText}
              </div>

              {/* Clean Today Indicator above day pill */}
              {SCHEDULE_GRID_CONFIG.columns.map(col => {
                if (col.dayId !== todayDayId) return null;
                return (
                  <div
                    key={`today_badge_${col.dayId}`}
                    style={{
                      position: 'absolute',
                      left: `${col.leftPct + 2}%`,
                      top: '17.2%',
                      width: `${col.widthPct - 4}%`,
                      textAlign: 'center',
                      background: '#10b981',
                      color: '#0b1212',
                      fontSize: 'clamp(9px, 0.72vw, 11px)',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 99,
                      zIndex: 3,
                      pointerEvents: 'none'
                    }}
                  >
                    اليوم ★
                  </div>
                );
              })}

              {/* 7 columns x 10 legible pill slots */}
              {SCHEDULE_GRID_CONFIG.columns.map(col => {
                const dayTasks = daySlotsMap.get(col.dayId) || [];

                return SCHEDULE_GRID_CONFIG.rows.map(row => {
                  const task = dayTasks[row.index];
                  const done = task ? isTaskDone(task.id) : false;

                  return (
                    <div
                      key={`slot_${col.dayId}_${row.index}`}
                      style={{
                        position: 'absolute',
                        left: `${col.leftPct}%`,
                        top: `${row.topPct}%`,
                        width: `${col.widthPct}%`,
                        height: `${row.heightPct}%`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px 8px',
                        boxSizing: 'border-box',
                        zIndex: 2
                      }}
                      title={task ? `${SUBJECT_SHORT_LABELS[task.subjId]?.name || task.subjId} · ${task.text}` : `إضافة مهمة أو محاضرة من عندك ليوم ${col.label}`}
                    >
                      {task ? (
                        (() => {
                          const subjMeta = SUBJECT_SHORT_LABELS[task.subjId] || { name: task.subjId || 'مادة', color: '#475569' };
                          const textLen = (task.text || '').trim().length;
                          const adaptiveFont =
                            textLen <= 20
                              ? 'clamp(9.8px, 0.88vw, 12.5px)'
                              : textLen <= 34
                              ? 'clamp(8.8px, 0.78vw, 11px)'
                              : textLen <= 50
                              ? 'clamp(7.8px, 0.68vw, 9.6px)'
                              : 'clamp(7px, 0.6vw, 8.6px)';

                          return (
                            <div
                              onClick={() => handleCheck(task.id)}
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: 999,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '2px 16px',
                                background: done ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                                color: done ? '#475569' : '#0f172a',
                                fontFamily: 'Cairo, sans-serif',
                                fontWeight: 700,
                                cursor: 'pointer',
                                userSelect: 'none',
                                position: 'relative'
                              }}
                            >
                              {/* Compact corner subject dot */}
                              <span
                                style={{
                                  position: 'absolute',
                                  right: 7,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: done ? '#10b981' : subjMeta.color,
                                  pointerEvents: 'none'
                                }}
                              />

                              {/* Subtle top-left corner swap button (does not compress text width!) */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenSwap(task);
                                }}
                                title="تبديل أو استبدال المهمة"
                                style={{
                                  position: 'absolute',
                                  left: 5,
                                  top: 3,
                                  border: 'none',
                                  background: 'rgba(15, 23, 42, 0.08)',
                                  color: '#334155',
                                  borderRadius: 99,
                                  width: 15,
                                  height: 15,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  opacity: 0.72,
                                  zIndex: 4
                                }}
                              >
                                <ArrowRightLeft size={9} />
                              </button>

                              {/* Tiny subtle edit button at bottom-left for quick inline editing */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenEditTask(task);
                                }}
                                title="تعديل المهمة"
                                style={{
                                  position: 'absolute',
                                  left: 5,
                                  bottom: 3,
                                  border: 'none',
                                  background: 'rgba(15, 23, 42, 0.06)',
                                  color: '#475569',
                                  borderRadius: 99,
                                  width: 15,
                                  height: 15,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  opacity: 0.6,
                                  zIndex: 4
                                }}
                              >
                                <Pencil size={8} />
                              </button>

                              {/* Complete Full Non-Truncated Arabic Task Title */}
                              <span
                                style={{
                                  fontSize: adaptiveFont,
                                  lineHeight: 1.14,
                                  textDecoration: done ? 'line-through' : 'none',
                                  wordBreak: 'break-word',
                                  textAlign: 'center',
                                  width: '100%'
                                }}
                              >
                                {task.text}
                              </span>
                            </div>
                          );
                        })()
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSlotQuickAddDay(col.dayId);
                            setSlotQuickSlotIdx(row.index);
                            setSlotQuickText('');
                          }}
                          style={{
                            width: '88%',
                            height: '76%',
                            borderRadius: 999,
                            border: row.index === 9 ? '1.5px dashed rgba(16, 185, 129, 0.55)' : '1px dashed rgba(100, 116, 139, 0.45)',
                            background: row.index === 9 ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                            color: row.index === 9 ? '#0f766e' : '#475569',
                            fontSize: 'clamp(8.5px, 0.7vw, 10.5px)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'Cairo, sans-serif'
                          }}
                        >
                          {row.index === 9 ? '+ أضف محاضرة من عندك' : '+ إضافة'}
                        </button>
                      )}
                    </div>
                  );
                });
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: INTERACTIVE CHECKLIST & SWAP MANAGEMENT */}
      {activeViewMode === 'checklist' && (
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                className={`btn btn-sm ${selectedDayTab === 'all' ? 'btn-primary' : ''}`}
                onClick={() => setSelectedDayTab('all')}
                style={{ fontWeight: 700 }}
              >
                جميع الأيام (<span className="tabular">{totalTasksCount}</span>)
              </button>
              {ORDERED_WEEK_DAYS.map(d => {
                const dayTasks = tasks.filter(t => t.dayId === d.id);
                const doneCount = dayTasks.filter(t => isTaskDone(t.id)).length;
                const isToday = d.id === todayDayId;
                return (
                  <button
                    key={d.id}
                    className={`btn btn-sm ${selectedDayTab === d.id ? 'btn-primary' : ''}`}
                    onClick={() => setSelectedDayTab(d.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      borderColor: isToday && selectedDayTab !== d.id ? 'var(--accent-primary)' : undefined
                    }}
                  >
                    <span>{d.label} {isToday ? '★' : ''}</span>
                    <span className="tabular" style={{ fontSize: 11, opacity: 0.85 }}>({doneCount}/{dayTasks.length})</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginLeft: 4 }}>
                تصفية النوع:
              </span>
              <button
                className={`btn btn-sm ${selectedCategoryFilter === 'all' ? 'btn-primary' : ''}`}
                onClick={() => setSelectedCategoryFilter('all')}
                style={{ fontSize: 12 }}
              >
                الكل
              </button>
              <button
                className={`btn btn-sm ${selectedCategoryFilter === 'manual' ? 'btn-primary' : ''}`}
                onClick={() => setSelectedCategoryFilter('manual')}
                style={{ fontSize: 12 }}
              >
                <Star size={12} style={{ color: '#f97316' }} />
                <span>مهامك المضافة (<span className="tabular">{tasks.filter(t => t.category === 'manual' || t.isUserAdded).length}</span>)</span>
              </button>
              <button
                className={`btn btn-sm ${selectedCategoryFilter === 'pending' ? 'btn-primary' : ''}`}
                onClick={() => setSelectedCategoryFilter('pending')}
                style={{ fontSize: 12 }}
              >
                <Laptop size={12} style={{ color: '#fbbf24' }} />
                <span>محاضرات للإنجاز (<span className="tabular">{tasks.filter(t => t.category === 'platform' || t.category === 'study').length}</span>)</span>
              </button>
              <button
                className={`btn btn-sm ${selectedCategoryFilter === 'review' ? 'btn-primary' : ''}`}
                onClick={() => setSelectedCategoryFilter('review')}
                style={{ fontSize: 12 }}
              >
                <RotateCcw size={12} style={{ color: '#14b8a6' }} />
                <span>للمراجعة (<span className="tabular">{tasks.filter(t => t.category === 'review').length}</span>)</span>
              </button>
              <button
                className={`btn btn-sm ${selectedCategoryFilter === 'center' ? 'btn-primary' : ''}`}
                onClick={() => setSelectedCategoryFilter('center')}
                style={{ fontSize: 12 }}
              >
                <Building2 size={12} style={{ color: '#38bdf8' }} />
                <span>السناتر (<span className="tabular">{tasks.filter(t => t.category === 'center').length}</span>)</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {ORDERED_WEEK_DAYS
              .filter(d => selectedDayTab === 'all' || selectedDayTab === d.id)
              .map(d => {
                const dayTasks = tasks
                  .filter(t => t.dayId === d.id)
                  .filter(t => {
                    if (selectedCategoryFilter === 'manual') return t.category === 'manual' || t.isUserAdded;
                    if (selectedCategoryFilter === 'pending') return t.category === 'platform' || t.category === 'study';
                    if (selectedCategoryFilter === 'review') return t.category === 'review';
                    if (selectedCategoryFilter === 'center') return t.category === 'center';
                    return true;
                  })
                  .sort((a, b) => (a.slotIndex ?? 5) - (b.slotIndex ?? 5));

                const dayDoneCount = dayTasks.filter(t => isTaskDone(t.id)).length;

                return (
                  <div
                    key={d.id}
                    style={{
                      background: 'var(--bg-elevated)',
                      borderRadius: 10,
                      padding: 14,
                      border: d.id === todayDayId ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <strong style={{ fontSize: 15, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={16} />
                        <span>يوم {d.label} {d.id === todayDayId ? '(النهاردة ★)' : ''}</span>
                      </strong>
                      <span className="tabular" style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>
                        {dayDoneCount} من {dayTasks.length} منجز
                      </span>
                    </div>

                    {dayTasks.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>لا توجد مهام مطابقة لهذا الفلتر.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {dayTasks.map(t => {
                          const done = isTaskDone(t.id);
                          const subj = getSubject(t.subjId);
                          const catMeta = getCategoryMeta(t);

                          return (
                            <div
                              key={t.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 10,
                                padding: '10px 14px',
                                borderRadius: 8,
                                background: done ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-surface)',
                                border: `1px solid ${done ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)'}`
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                                <input
                                  type="checkbox"
                                  checked={done}
                                  onChange={() => handleCheck(t.id)}
                                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--accent-primary)', flexShrink: 0 }}
                                />

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: subj?.color || 'var(--accent-primary)', fontWeight: 700 }}>
                                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: subj?.color || 'var(--accent-primary)' }} />
                                      {subj?.name || t.subjId}
                                    </span>
                                    <span>·</span>
                                    <span style={{ color: catMeta.color, fontWeight: 700 }}>{catMeta.label}</span>
                                    {typeof t.slotIndex === 'number' && (
                                      <>
                                        <span>·</span>
                                        <span className="tabular">خانة {t.slotIndex + 1}</span>
                                      </>
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 600,
                                      color: done ? 'var(--text-muted)' : 'var(--text-main)',
                                      textDecoration: done ? 'line-through' : 'none',
                                      wordBreak: 'break-word'
                                    }}
                                  >
                                    {t.text}
                                  </div>

                                  {(t.teacher || t.time) && (
                                    <div style={{ fontSize: 11, color: 'var(--text-faint)', display: 'flex', gap: 10 }}>
                                      {t.teacher && <span>{t.teacher}</span>}
                                      {t.time && <span>{t.time}</span>}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                <button
                                  className="btn btn-sm"
                                  onClick={() => handleOpenSwap(t)}
                                  title="تبديل مع مهمة بالجدول أو من المحاضرات"
                                  style={{ padding: '4px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                  <ArrowRightLeft size={12} />
                                  <span>استبدال</span>
                                </button>

                                <button
                                  className="btn btn-sm"
                                  onClick={() => onOpenEditTask(t)}
                                  title="تعديل المهمة"
                                  style={{ padding: '4px 8px', fontSize: 11 }}
                                >
                                  <Pencil size={12} />
                                </button>

                                {onDeleteTask && (
                                  <button
                                    className="btn btn-sm"
                                    onClick={() => onDeleteTask(t.id)}
                                    title="حذف المهمة"
                                    style={{ padding: '4px 8px', fontSize: 11, color: 'var(--danger)' }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick Add box at the bottom of day with Subject Selector */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      <select
                        className="input-field"
                        value={quickAddSubj[d.id] || 'physics'}
                        onChange={(e) => setQuickAddSubj(prev => ({ ...prev, [d.id]: e.target.value }))}
                        style={{ width: 'auto', minWidth: 115, margin: 0, fontSize: 12, padding: '6px 10px' }}
                      >
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="input-field"
                        placeholder={`+ إضافة مهمة يدوية ليوم ${d.label}...`}
                        value={quickAddInput[d.id] || ''}
                        onChange={(e) => setQuickAddInput(prev => ({ ...prev, [d.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleQuickAdd(d.id);
                        }}
                        style={{ fontSize: 12, padding: '6px 12px', margin: 0, flex: 1, minWidth: 180 }}
                      />
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleQuickAdd(d.id)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        <Plus size={13} />
                        <span>إضافة</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* VIEW MODE 4: POMODORO PLAN */}
      {activeViewMode === 'timeblock' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Clock size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>تقسيم اليوم بالبومودورو حول مواعيد السناتر الحضورية</span>
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              تنظيم أوقات الفراغ لإنهاء محاضرات المنصات والسناتر المتبقية ومراجعة الدروس المنتهية.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <div style={{ background: 'var(--bg-elevated)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--accent-primary)', fontSize: 14 }}>🗓️ أيام السناتر الثقيلة (السبت والثلاثاء)</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, fontSize: 12 }}>
                <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <strong>10:00 ص - 1:00 ظ:</strong> إنجاز محاضرتين + مراجعة تثبيت
                </div>
                <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                  <strong>4:00 م - 6:30 م:</strong> سنتر عربي أ. تقوى مرزوق
                </div>
                <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                  <strong>7:00 م - 9:30 م:</strong> سنتر إنجليزي أ. أيمن عبد العاطي
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--accent-primary)', fontSize: 14 }}>🗓️ أيام سنتر التاريخ (الإثنين والخميس)</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, fontSize: 12 }}>
                <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                  <strong>1:00 ظ - 3:00 ع:</strong> سنتر تاريخ الفشن أ. أحمد سمير
                </div>
                <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                  <strong>5:00 م - 9:00 م:</strong> جلسات فيزياء وعربي من المحاضرات المرتبة
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--accent-primary)', fontSize: 14 }}>🔥 أيام التقفيل الحرة (الأحد، الأربعاء، الجمعة)</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, fontSize: 12 }}>
                <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <strong>أوقات مفتوحة:</strong> مثالية لإنهاء المحاضرات غير المنجزة بالترتيب + حل امتحانات شاملة.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 5: ARCHIVED WEEKS */}
      {activeViewMode === 'archive' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Archive size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>أرشيف الجداول السابقة (يتم الترحيل والأرشفة تلقائياً كل سبت)</span>
            </h3>
            <span className="tabular" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {archivedWeeks.length} أسابيع مؤرشفة
            </span>
          </div>

          {archivedWeeks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
              <Archive size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ margin: 0 }}>لم يتم أرشفة أي أسبوع بعد. سيتم أرشفة الأسبوع تلقائياً مع بداية يوم السبت القادم!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {archivedWeeks.map((arch) => (
                <div key={arch.id} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 14, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong style={{ color: 'var(--text-main)', fontSize: 14 }}>{arch.weekTitle}</strong>
                    <span className="tabular" style={{ fontSize: 12, color: 'var(--accent-primary)', fontWeight: 700 }}>
                      {arch.completionPct}%
                    </span>
                  </div>
                  <div className="tabular" style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                    تم إنجاز {arch.completedCount} من أصل {arch.totalCount} مهمة
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${arch.completionPct}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INLINE QUICK ADD MODAL */}
      {slotQuickAddDay && (
        <div className="modal-overlay show" onClick={() => setSlotQuickAddDay(null)}>
          <div className="modal-box" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={18} style={{ color: '#f97316' }} />
              <span>إضافة مهمة — يوم {getArabicDayLabel(slotQuickAddDay)}</span>
            </div>
            <form onSubmit={handleSaveSlotQuickAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>المادة:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {subjects.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSlotQuickSubj(s.id)}
                      style={{
                        padding: '6px 4px',
                        borderRadius: 8,
                        border: `2px solid ${slotQuickSubj === s.id ? s.color : 'var(--border-subtle)'}`,
                        background: slotQuickSubj === s.id ? `${s.color}22` : 'var(--bg-elevated)',
                        color: slotQuickSubj === s.id ? s.color : 'var(--text-main)',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>التصنيف:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {[
                    { id: 'manual' as const, label: '⚡ مهمة خاصة' },
                    { id: 'study' as const, label: '📖 مذاكرة' },
                    { id: 'exam' as const, label: '🏆 امتحان' }
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSlotQuickCategory(c.id)}
                      className={`btn btn-sm ${slotQuickCategory === c.id ? 'btn-primary' : ''}`}
                      style={{ fontSize: 11 }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>نص المهمة:</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="اكتب مهمتك هنا..."
                  value={slotQuickText}
                  onChange={(e) => setSlotQuickText(e.target.value)}
                  required
                  autoFocus
                  style={{ margin: 0 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button type="button" className="btn" onClick={() => setSlotQuickAddDay(null)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">تثبيت في الجدول ✓</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INLINE ARCHIVE CONFIRM MODAL */}
      {archiveConfirmOpen && (
        <div className="modal-overlay show" onClick={() => setArchiveConfirmOpen(false)}>
          <div className="modal-box" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Archive size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>أرشفة الأسبوع الحالي وبدء أسبوع جديد</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.7 }}>
              سيتم أرشفة ملخص الأسبوع الحالي ({completedCount} من {totalTasksCount} مهمة منجزة — {completionPercentage}%) وحذف المهام القديمة، ثم توليد أسبوعك الجديد (9 مهام يومياً وفق ترتيب مساراتك مع ترك الخانة الأخيرة فارغة لإضافاتك اليدوية).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => confirmExecuteArchive(true)}
              >
                🎲 أرشفة + توليد أسبوع جديد مرتب من المحاضرات والسناتر
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => confirmExecuteArchive(false)}
              >
                🏢 أرشفة + وضع السناتر الحضورية فقط
              </button>
              <button
                type="button"
                className="btn"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => setArchiveConfirmOpen(false)}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENHANCED 3-MODE TASK SWAPPING MODAL */}
      {swapModalOpen && taskToSwap && (
        <div className="modal-overlay show" onClick={() => setSwapModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowRightLeft size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>استبدال وتبديل المهمة (يُحفظ حتى نهاية الأسبوع)</span>
            </div>

            <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                المهمة الحالية ({getArabicDayLabel(taskToSwap.dayId)} · {SUBJECT_SHORT_LABELS[taskToSwap.subjId]?.name || taskToSwap.subjId}):
              </span>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginTop: 3 }}>
                {taskToSwap.text}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
              <button
                type="button"
                className={`btn btn-sm ${swapMode === 'schedule' ? 'btn-primary' : ''}`}
                onClick={() => setSwapMode('schedule')}
                style={{ fontSize: 11, fontWeight: 700 }}
              >
                🔁 تبديل مع مهمة بالجدول
              </button>
              <button
                type="button"
                className={`btn btn-sm ${swapMode === 'lectures' ? 'btn-primary' : ''}`}
                onClick={() => setSwapMode('lectures')}
                style={{ fontSize: 11, fontWeight: 700 }}
              >
                📚 استبدال من المحاضرات
              </button>
              <button
                type="button"
                className={`btn btn-sm ${swapMode === 'move' ? 'btn-primary' : ''}`}
                onClick={() => setSwapMode('move')}
                style={{ fontSize: 11, fontWeight: 700 }}
              >
                📅 نقل ليوم / بنك
              </button>
            </div>

            {swapMode === 'schedule' && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <Search size={13} style={{ position: 'absolute', right: 10, top: 10, color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="ابحث بالمهمة أو اليوم أو المادة للتبديل معها..."
                    value={swapScheduleSearch}
                    onChange={(e) => setSwapScheduleSearch(e.target.value)}
                    style={{ margin: 0, paddingRight: 30, fontSize: 12 }}
                  />
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 4 }}>
                  {swappableScheduleTasks.map(other => {
                    const isSelected = selectedScheduleTargetId === String(other.id);
                    const otherDone = isTaskDone(other.id);
                    const subjMeta = SUBJECT_SHORT_LABELS[other.subjId] || { name: other.subjId, color: '#64748b' };
                    return (
                      <button
                        key={other.id}
                        type="button"
                        onClick={() => setSelectedScheduleTargetId(String(other.id))}
                        style={{
                          textAlign: 'right',
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                          background: isSelected ? 'rgba(86, 194, 166, 0.14)' : 'var(--bg-elevated)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                          <span style={{ fontSize: 11, color: subjMeta.color, fontWeight: 800, flexShrink: 0 }}>
                            {subjMeta.name}
                          </span>
                          <span style={{ fontSize: 12, color: otherDone ? 'var(--text-muted)' : 'var(--text-main)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: otherDone ? 'line-through' : 'none' }}>
                            {other.text}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>
                          {otherDone ? '✓ ' : ''}{getArabicDayLabel(other.dayId)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {swapMode === 'lectures' && (
              <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={13} style={{ position: 'absolute', right: 10, top: 10, color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="ابحث في المحاضرات (مرتبة حسب أولويتك)..."
                      value={swapLectureSearch}
                      onChange={(e) => setSwapLectureSearch(e.target.value)}
                      style={{ margin: 0, paddingRight: 30, fontSize: 12 }}
                    />
                  </div>
                  <select
                    className="input-field"
                    value={swapLectureSubjFilter}
                    onChange={(e) => setSwapLectureSubjFilter(e.target.value)}
                    style={{ width: 120, margin: 0, fontSize: 12 }}
                  >
                    <option value="all">كل المواد</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className={`btn btn-sm ${swapLectureFilter === 'all' ? 'btn-primary' : ''}`} onClick={() => setSwapLectureFilter('all')} style={{ fontSize: 11 }}>
                    الكل ({orderedLectures.length})
                  </button>
                  <button type="button" className={`btn btn-sm ${swapLectureFilter === 'pending' ? 'btn-primary' : ''}`} onClick={() => setSwapLectureFilter('pending')} style={{ fontSize: 11 }}>
                    غير منجزة ({orderedLectures.filter(l => !l.isDone).length})
                  </button>
                  <button type="button" className={`btn btn-sm ${swapLectureFilter === 'review' ? 'btn-primary' : ''}`} onClick={() => setSwapLectureFilter('review')} style={{ fontSize: 11 }}>
                    منجزة للمراجعة ({orderedLectures.filter(l => l.isDone).length})
                  </button>
                </div>

                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filteredSwapLectures.slice(0, 60).map((lec, idx) => {
                    const isSelected = selectedLectureId === lec.id;
                    const subjMeta = SUBJECT_SHORT_LABELS[lec.subjId] || { name: lec.subjId, color: '#64748b' };
                    return (
                      <button
                        key={lec.id}
                        type="button"
                        onClick={() => setSelectedLectureId(lec.id)}
                        style={{
                          textAlign: 'right',
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                          background: isSelected ? 'rgba(86, 194, 166, 0.14)' : 'var(--bg-elevated)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                          <span className="tabular" style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>
                            #{idx + 1}
                          </span>
                          <span style={{ fontSize: 11, color: subjMeta.color, fontWeight: 800, flexShrink: 0 }}>
                            {subjMeta.name}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-main)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {lec.code}: {lec.title}
                          </span>
                        </div>
                        <span style={{ fontSize: 10, color: lec.isDone ? '#14b8a6' : '#fbbf24', fontWeight: 700, flexShrink: 0 }}>
                          {lec.isDone ? 'مراجعة' : 'غير منجزة'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {swapMode === 'move' && (
              <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    1. نقل المهمة إلى يوم آخر:
                  </label>
                  <select
                    className="input-field"
                    value={swapTargetDay}
                    onChange={(e) => {
                      setSwapTargetDay(e.target.value);
                      setSwapBankSelect('');
                    }}
                    style={{ margin: 0 }}
                  >
                    {ORDERED_WEEK_DAYS.map(d => (
                      <option key={d.id} value={d.id}>
                        يوم {d.label} {d.id === taskToSwap.dayId ? '(اليوم الحالي)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    2. أو استبدالها بمهمة من بنك المذاكرة:
                  </label>
                  <select
                    className="input-field"
                    value={swapBankSelect}
                    onChange={(e) => setSwapBankSelect(e.target.value)}
                    style={{ margin: 0 }}
                  >
                    <option value="">-- اختر مهمة بديلة --</option>
                    {DYNAMIC_STUDY_POOL.map((item, idx) => (
                      <option key={idx} value={item.text}>
                        {item.text}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn" onClick={() => setSwapModalOpen(false)}>
                إلغاء
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExecuteSwap}
                disabled={
                  (swapMode === 'schedule' && !selectedScheduleTargetId) ||
                  (swapMode === 'lectures' && !selectedLectureId) ||
                  (swapMode === 'move' && !swapBankSelect && swapTargetDay === taskToSwap.dayId)
                }
              >
                تنفيذ التبديل وحفظ الجدول ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
