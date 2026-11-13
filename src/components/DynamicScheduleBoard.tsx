import React, { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Subject, WeeklyTask, Lecture, ArchivedWeek } from '../types';
import {
  FIXED_WEEKLY_CLASSES,
  ORDERED_WEEK_DAYS,
  DYNAMIC_STUDY_POOL,
  buildRandomizedWeeklySchedule,
  getCurrentArabicDayId,
  getArabicDayLabel
} from '../utils/scheduleEngine';
import {
  Calendar,
  CalendarCheck,
  Clock,
  Download,
  Flame,
  Building2,
  Laptop,
  FileCheck,
  RotateCcw,
  ArrowRightLeft,
  Plus,
  Trash2,
  Pencil,
  Bell,
  Archive,
  Sparkles,
  Eye,
  History,
  Shuffle,
  Search,
  Star,
  BookOpen,
  X
} from 'lucide-react';

// Exact coordinates derived from the 2000x1414 template image
export const SCHEDULE_GRID_CONFIG = {
  width: 2000,
  height: 1414,
  columns: [
    { dayId: 'fri', label: 'الجمعة', startX: 34, width: 259, leftPct: 1.7 },
    { dayId: 'thu', label: 'الخميس', startX: 314, width: 259, leftPct: 15.7 },
    { dayId: 'wed', label: 'الأربعاء', startX: 593, width: 260, leftPct: 29.65 },
    { dayId: 'tue', label: 'الثلاثاء', startX: 873, width: 260, leftPct: 43.65 },
    { dayId: 'mon', label: 'الاثنين', startX: 1153, width: 260, leftPct: 57.65 },
    { dayId: 'sun', label: 'الأحد', startX: 1433, width: 259, leftPct: 71.65 },
    { dayId: 'sat', label: 'السبت', startX: 1713, width: 259, leftPct: 85.65 }
  ],
  rows: [
    { index: 0, startY: 377, height: 85, topPct: 26.66 },
    { index: 1, startY: 475, height: 86, topPct: 33.59 },
    { index: 2, startY: 574, height: 85, topPct: 40.59 },
    { index: 3, startY: 672, height: 85, topPct: 47.52 },
    { index: 4, startY: 770, height: 86, topPct: 54.46 },
    { index: 5, startY: 868, height: 86, topPct: 61.39 },
    { index: 6, startY: 967, height: 85, topPct: 68.39 },
    { index: 7, startY: 1065, height: 86, topPct: 75.32 },
    { index: 8, startY: 1163, height: 86, topPct: 82.25 },
    { index: 9, startY: 1262, height: 85, topPct: 89.25 }
  ]
};

const SUBJECT_SHORT_LABELS: Record<string, { name: string; color: string }> = {
  physics: { name: 'فيزياء', color: '#6366f1' },
  arabic: { name: 'عربي', color: '#d97706' },
  english: { name: 'إنجليزي', color: '#0284c7' },
  history: { name: 'تاريخ', color: '#059669' }
};

function getCategoryMeta(task: WeeklyTask) {
  if (task.category === 'center') return { label: 'سنتر', emoji: '🏢', color: '#0284c7' };
  if (task.category === 'review') return { label: 'مراجعة', emoji: '🔄', color: '#0d9488' };
  if (task.category === 'exam' || task.priority === 'exam') return { label: 'امتحان', emoji: '🏆', color: '#7c3aed' };
  if (task.category === 'manual' || task.isUserAdded) return { label: 'مهمتك', emoji: '⚡', color: '#ea580c' };
  if (task.category === 'platform') return { label: 'محاضرة', emoji: '💻', color: '#d97706' };
  if (task.priority === 'urgent' || task.isRolled) return { label: 'عاجل', emoji: '🚨', color: '#dc2626' };
  return { label: 'مذاكرة', emoji: '📖', color: '#10b981' };
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
  const [selectedDayTab, setSelectedDayTab] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'pending' | 'review' | 'center' | 'manual'>('all');
  const [activeViewMode, setActiveViewMode] = useState<'board' | 'checklist' | 'timeblock' | 'archive'>('board');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [quickAddInput, setQuickAddInput] = useState<{ [dayId: string]: string }>({});
  const [boardNotice, setBoardNotice] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<string>('default');

  // Inline bottom-slot quick-add modal state (replaces window.prompt)
  const [slotQuickAddDay, setSlotQuickAddDay] = useState<string | null>(null);
  const [slotQuickText, setSlotQuickText] = useState<string>('');
  const [slotQuickSubj, setSlotQuickSubj] = useState<string>('physics');
  const [slotQuickCategory, setSlotQuickCategory] = useState<NonNullable<WeeklyTask['category']>>('manual');

  // Inline archive confirm modal state (replaces window.confirm)
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState<boolean>(false);

  // Enhanced 3-Mode Task Swap Modal State
  const [swapModalOpen, setSwapModalOpen] = useState<boolean>(false);
  const [taskToSwap, setTaskToSwap] = useState<WeeklyTask | null>(null);
  const [swapMode, setSwapMode] = useState<'schedule' | 'lectures' | 'move'>('schedule');
  const [selectedScheduleTargetId, setSelectedScheduleTargetId] = useState<string>('');
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
    setTimeout(() => setBoardNotice(null), 4500);
  };

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

  // Map tasks to columns (up to 10 slots per day: 0..8 automated, 9 reserved for manual bottom entry)
  const daySlotsMap = useMemo(() => {
    const map = new Map<string, Array<WeeklyTask | null>>();
    ORDERED_WEEK_DAYS.forEach(d => {
      map.set(d.id, new Array(10).fill(null));
    });

    tasks.forEach(t => {
      if (t.dayId && map.has(t.dayId)) {
        const slots = map.get(t.dayId)!;
        const targetSlot = (typeof t.slotIndex === 'number' && t.slotIndex >= 0 && t.slotIndex < 10)
          ? t.slotIndex
          : slots.findIndex((s, i) => s === null && i < 9);

        if (targetSlot !== -1 && slots[targetSlot] === null) {
          slots[targetSlot] = t;
        } else {
          // If desired slot occupied, look for empty auto slot [0..8] first, then slot 9
          const firstAutoEmpty = slots.findIndex((s, i) => s === null && i < 9);
          if (firstAutoEmpty !== -1) {
            slots[firstAutoEmpty] = t;
          } else if (slots[9] === null && (t.isUserAdded || t.category === 'manual')) {
            slots[9] = t;
          }
        }
      }
    });

    return map;
  }, [tasks]);

  // Overall statistics
  const totalTasksCount = tasks.length;
  const completedCount = tasks.filter(t => completedTaskIds.has(t.id) || completedTaskIds.has(String(t.id))).length;
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

  // Handle task check with confetti
  const handleCheck = (taskId: string | number) => {
    const isDone = completedTaskIds.has(taskId) || completedTaskIds.has(String(taskId));
    onToggleTask(taskId);
    if (!isDone) {
      try {
        confetti({
          particleCount: 55,
          spread: 70,
          origin: { y: 0.65 }
        });
      } catch (e) {}
    }
  };

  // Quick add emergency task in checklist (prefers open slot or bottom slot 9)
  const handleQuickAdd = (dayId: string) => {
    const text = quickAddInput[dayId]?.trim();
    if (!text || !onUpdateAllTasks) return;

    const slots = daySlotsMap.get(dayId) || [];
    const targetSlot = slots[9] === null ? 9 : Math.max(0, slots.findIndex(s => s === null));

    const newTask: WeeklyTask = {
      id: `task_quick_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dayId,
      subjId: 'physics',
      text,
      priority: 'urgent',
      category: 'manual',
      isUserAdded: true,
      slotIndex: targetSlot === -1 ? 9 : targetSlot
    };

    onUpdateAllTasks([...tasks, newTask]);
    setQuickAddInput(prev => ({ ...prev, [dayId]: '' }));
    flashNotice(`⚡ تمت إضافة مهمتك اليدوية ليوم ${getArabicDayLabel(dayId)} وإظهارها على الجدول!`);
  };

  // Save inline modal for the bottom reserved slot 9
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
      slotIndex: 9
    };

    onUpdateAllTasks([...tasks, newTask]);
    flashNotice(`✅ أُضيفت المهمة (${SUBJECT_SHORT_LABELS[slotQuickSubj]?.name || slotQuickSubj}) في الخانة الأخيرة ليوم ${getArabicDayLabel(slotQuickAddDay)}!`);
    setSlotQuickAddDay(null);
    setSlotQuickText('');
  };

  // Generate Randomized Dynamic Schedule (keeping centers + user-added tasks, filling 0..8 randomly, leaving slot 9 empty!)
  const handleGenerateRandomWeek = (startFromToday = false) => {
    if (!onUpdateAllTasks) return;

    // Preserve user-added manual/urgent/exam tasks so Karim's own additions stay prioritized!
    const preservedUserTasks = tasks.filter(
      t => t.isUserAdded || t.category === 'manual' || t.category === 'exam' || t.slotIndex === 9
    );

    const freshTasks = buildRandomizedWeeklySchedule({
      lectures,
      preserveUserTasks: preservedUserTasks,
      startFromToday
    });

    onUpdateAllTasks(freshTasks);
    flashNotice(
      startFromToday
        ? '🎲 تم توليد جدول عشوائي نشط بدءاً من اليوم بمحاضراتك والسناتر، مع ترك الخانة الأخيرة فارغة لإضافاتك!'
        : '🎲 تم توليد أسبوع عشوائي جديد من محاضراتك والسناتر مع ترك الخانة الأخيرة أسفل كل يوم فارغة لمهامك!'
    );
  };

  // Rollover uncompleted non-center tasks to next day
  const handleRolloverTasks = () => {
    if (!onUpdateAllTasks) return;

    const dayKeys = ORDERED_WEEK_DAYS.map(d => d.id);
    let rolledCount = 0;
    let updatedTasks = [...tasks];

    for (let i = 0; i < dayKeys.length - 1; i++) {
      const currentDay = dayKeys[i];
      const nextDay = dayKeys[i + 1];

      updatedTasks = updatedTasks.map(t => {
        const isDone = completedTaskIds.has(t.id) || completedTaskIds.has(String(t.id));
        if (t.dayId === currentDay && !isDone && t.category !== 'center') {
          rolledCount++;
          return {
            ...t,
            dayId: nextDay,
            priority: 'urgent',
            isRolled: true,
            originalDayId: t.originalDayId || currentDay,
            text: t.isRolled ? t.text : `[مرحّل] ${t.text}`
          };
        }
        return t;
      });
    }

    if (rolledCount > 0) {
      onUpdateAllTasks(updatedTasks);
      flashNotice(`🚨 تم ترحيل ${rolledCount} مهمة غير منجزة إلى اليوم التالي بأولوية عاجلة!`);
    } else {
      flashNotice('✅ ممتاز يا دكتور! كل مهام الأيام السابقة منجزة ولا توجد مهام متأخرة.');
    }
  };

  // Open Enhanced 3-Mode Swap Modal
  const handleOpenSwap = (task: WeeklyTask) => {
    setTaskToSwap(task);
    setSwapMode('schedule');
    setSelectedScheduleTargetId('');
    setSelectedLectureId('');
    setSwapLectureSearch('');
    setSwapTargetDay(task.dayId);
    setSwapBankSelect('');
    setSwapModalOpen(true);
  };

  const handleExecuteSwap = () => {
    if (!taskToSwap || !onUpdateAllTasks) return;

    let updatedTasks = [...tasks];

    if (swapMode === 'schedule' && selectedScheduleTargetId) {
      // True 2-way swap of (dayId, slotIndex) between taskToSwap and targetTask
      const targetTask = tasks.find(t => String(t.id) === selectedScheduleTargetId);
      if (!targetTask) return;

      const sourceDay = taskToSwap.dayId;
      const sourceSlot = taskToSwap.slotIndex;
      const destDay = targetTask.dayId;
      const destSlot = targetTask.slotIndex;

      updatedTasks = updatedTasks.map(t => {
        if (String(t.id) === String(taskToSwap.id)) {
          return { ...t, dayId: destDay, slotIndex: destSlot };
        }
        if (String(t.id) === String(targetTask.id)) {
          return { ...t, dayId: sourceDay, slotIndex: sourceSlot };
        }
        return t;
      });

      onUpdateAllTasks(updatedTasks);
      flashNotice(`🔁 تم تبديل الأيام والأماكن بين المهمتين بنجاح!`);
    } else if (swapMode === 'lectures' && selectedLectureId) {
      // Replace current task with chosen real lecture from lectures catalog
      const lec = lectures.find(l => l.id === selectedLectureId);
      if (!lec) return;

      updatedTasks = updatedTasks.map(t => {
        if (String(t.id) === String(taskToSwap.id)) {
          return {
            ...t,
            subjId: lec.subjId,
            text: lec.isDone ? `[مراجعة] ${lec.code}: ${lec.title}` : `${lec.code}: ${lec.title}`,
            category: lec.isDone ? 'review' : 'platform',
            priority: lec.isDone ? 'normal' : 'high',
            teacher: lec.packageName || 'محاضرة',
            time: lec.dueDay || ''
          };
        }
        return t;
      });

      onUpdateAllTasks(updatedTasks);
      flashNotice(`📚 تم استبدال الخانة بالمحاضرة: ${lec.title}`);
    } else if (swapMode === 'move') {
      if (swapBankSelect) {
        const bankItem = DYNAMIC_STUDY_POOL.find(item => item.text === swapBankSelect);
        if (bankItem) {
          updatedTasks = updatedTasks.map(t =>
            String(t.id) === String(taskToSwap.id)
              ? { ...t, subjId: bankItem.subjId, text: bankItem.text, category: 'study' }
              : t
          );
          onUpdateAllTasks(updatedTasks);
          flashNotice('✅ تم استبدال المهمة من بنك المذاكرة السريعة.');
        }
      } else if (swapTargetDay !== taskToSwap.dayId) {
        // Move to first free slot [0..8] in target day
        const usedInDest = new Set(
          tasks.filter(t => t.dayId === swapTargetDay && typeof t.slotIndex === 'number').map(t => t.slotIndex as number)
        );
        let freeSlot: number | undefined = undefined;
        for (let i = 0; i <= 8; i++) {
          if (!usedInDest.has(i)) { freeSlot = i; break; }
        }
        updatedTasks = updatedTasks.map(t =>
          String(t.id) === String(taskToSwap.id)
            ? { ...t, dayId: swapTargetDay, slotIndex: freeSlot ?? t.slotIndex }
            : t
        );
        onUpdateAllTasks(updatedTasks);
        flashNotice(`📅 تم نقل المهمة إلى يوم ${getArabicDayLabel(swapTargetDay)}.`);
      }
    }

    setSwapModalOpen(false);
    setTaskToSwap(null);
  };

  // Execute Week Archive & Start Fresh Randomized Week
  const confirmExecuteArchive = (autoFillNewWeek: boolean) => {
    if (!onArchiveWeek) return;

    const archiveRecord: ArchivedWeek = {
      id: `archive_${Date.now()}`,
      weekTitle: `الأسبوع المنتهي في ${new Date().toLocaleDateString('ar-EG')}`,
      archivedAt: new Date().toISOString(),
      totalCount: totalTasksCount,
      completedCount,
      completionPct: completionPercentage,
      tasks: [...tasks]
    };

    const cleanTasks = autoFillNewWeek
      ? buildRandomizedWeeklySchedule({ lectures, preserveUserTasks: [] })
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
    flashNotice('📦 تمت أرشفة الأسبوع وتجهيز الأسبوع الجديد بنجاح!');
  };

  // Filtered lectures for Swap Tab 2
  const filteredSwapLectures = useMemo(() => {
    return lectures.filter(l => {
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
  }, [lectures, swapLectureFilter, swapLectureSubjFilter, swapLectureSearch]);

  // Other tasks on schedule for 2-way Swap Tab 1
  const swappableScheduleTasks = useMemo(() => {
    if (!taskToSwap) return [];
    return tasks.filter(t => String(t.id) !== String(taskToSwap.id) && t.dayId !== 'backlog');
  }, [tasks, taskToSwap]);

  // Generate & Download visual poster PNG showing BOTH Subject + Category on every capsule
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
      await document.fonts.load('bold 18px "AraHamahHoms"');
    } catch (e) {}

    SCHEDULE_GRID_CONFIG.columns.forEach(col => {
      const dayTasks = daySlotsMap.get(col.dayId) || [];

      SCHEDULE_GRID_CONFIG.rows.forEach(row => {
        const task = dayTasks[row.index];
        if (!task) return;

        const isDone = completedTaskIds.has(task.id) || completedTaskIds.has(String(task.id));
        const capsuleX = col.startX;
        const capsuleY = row.startY;
        const capsuleW = col.width;
        const capsuleH = row.height;
        const catMeta = getCategoryMeta(task);
        const subjMeta = SUBJECT_SHORT_LABELS[task.subjId] || { name: task.subjId || 'مادة', color: '#475569' };

        if (isDone) {
          ctx.save();
          ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
          ctx.beginPath();
          ctx.roundRect(capsuleX + 4, capsuleY + 4, capsuleW - 8, capsuleH - 8, 20);
          ctx.fill();
          ctx.restore();
        }

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(capsuleX + 6, capsuleY + 6, capsuleW - 12, capsuleH - 12, 18);
        ctx.clip();

        // Colored subject accent bar on right side of capsule
        ctx.fillStyle = subjMeta.color;
        ctx.fillRect(capsuleX + capsuleW - 11, capsuleY + 10, 5, capsuleH - 20);

        // Subject Label pill (top-left) & Category Badge (top-right)
        ctx.font = 'bold 11px "Cairo", sans-serif';
        ctx.direction = 'rtl';

        // Right: Category
        ctx.fillStyle = catMeta.color;
        ctx.textAlign = 'right';
        ctx.fillText(`${catMeta.emoji} ${catMeta.label}`, capsuleX + capsuleW - 16, capsuleY + 22);

        // Left: Subject Name + Done mark
        ctx.fillStyle = isDone ? '#10b981' : subjMeta.color;
        ctx.textAlign = 'left';
        ctx.fillText(isDone ? `✓ ${subjMeta.name}` : subjMeta.name, capsuleX + 14, capsuleY + 22);

        // Draw task text in AraHamahHoms
        ctx.fillStyle = isDone ? '#475569' : '#0f172a';
        ctx.font = 'bold 15px "AraHamahHoms", "Cairo", sans-serif';
        ctx.textAlign = 'center';
        ctx.direction = 'rtl';

        const words = task.text.split(' ');
        let line1 = '';
        let line2 = '';
        for (const w of words) {
          if ((line1 + ' ' + w).length <= 22) {
            line1 += (line1 ? ' ' : '') + w;
          } else if ((line2 + ' ' + w).length <= 24) {
            line2 += (line2 ? ' ' : '') + w;
          }
        }

        if (line2) {
          ctx.fillText(line1, capsuleX + capsuleW / 2, capsuleY + 46);
          ctx.fillText(line2, capsuleX + capsuleW / 2, capsuleY + 68);
        } else {
          ctx.fillText(line1, capsuleX + capsuleW / 2, capsuleY + 54);
        }

        if (isDone) {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(capsuleX + 20, capsuleY + capsuleH / 2 + 6);
          ctx.lineTo(capsuleX + capsuleW - 20, capsuleY + capsuleH / 2 + 6);
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
    flashNotice('🖼️ تم توليد وتحميل صورة الجدول بكافة المواد والتصنيفات!');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Live Feedback Notice */}
      {boardNotice && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            background: 'rgba(16, 185, 129, 0.14)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#10b981',
            fontWeight: 700,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>{boardNotice}</span>
          <button
            onClick={() => setBoardNotice(null)}
            style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Banner & Control Deck */}
      <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <CalendarCheck size={22} style={{ color: 'var(--accent-primary)' }} />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                جدول الأسبوع الديناميكي الذكي (السبت ← الجمعة)
              </h2>
              <span className="tabular" style={{ fontSize: 13, color: 'var(--accent-primary)', background: 'var(--bg-elevated)', padding: '2px 10px', borderRadius: 'var(--radius-full)' }}>
                {completedCount} من {totalTasksCount} مكتمل ({completionPercentage}%)
              </span>
              <span style={{ fontSize: 11, color: '#fbbf24', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                اليوم: {getArabicDayLabel(todayDayId)}
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
              يتجدد تلقائياً كل سبت بعد أرشفة الأسبوع السابق، ويملأ 9 خانات عشوائياً من محاضراتك والسناتر مع ترك الخانة الأخيرة أسفل كل يوم فارغة لإضافاتك اليدوية.
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-sm btn-primary"
              onClick={onOpenNewTaskModal}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <Plus size={14} />
              <span>إضافة مهمة وتصنيف +</span>
            </button>

            <button
              className="btn btn-sm"
              onClick={() => handleGenerateRandomWeek(false)}
              title="إعادة توزيع المهام عشوائياً من المحاضرات المتبقية والمراجعة مع ترك الخانة الأخيرة فارغة"
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)', background: 'rgba(86, 194, 166, 0.08)', fontWeight: 700 }}
            >
              <Shuffle size={14} />
              <span>توليد أسبوع عشوائي جديد 🎲</span>
            </button>

            <button
              className="btn btn-sm"
              onClick={generateScheduleCanvas}
              disabled={isGeneratingImage}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={14} />
              <span>{isGeneratingImage ? 'جارٍ التوليد...' : 'تحميل صورة الجدول (PNG)'}</span>
            </button>

            <button
              className="btn btn-sm"
              onClick={handleRolloverTasks}
              title="نقل المهام غير المنجزة لليوم التالي بأولوية عاجلة"
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--warning)', color: 'var(--warning)' }}
            >
              <RotateCcw size={14} />
              <span>ترحيل المتأخر 🚨</span>
            </button>

            <button
              className="btn btn-sm"
              onClick={handleRequestNotifications}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderColor: notificationStatus === 'granted' ? 'var(--success)' : 'var(--border-subtle)',
                color: notificationStatus === 'granted' ? 'var(--success)' : 'var(--text-main)'
              }}
            >
              <Bell size={14} />
              <span>إعدادات التنبيهات والرسائل 🔔</span>
            </button>

            <button
              className="btn btn-sm"
              onClick={() => setArchiveConfirmOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}
            >
              <Archive size={14} />
              <span>أرشفة وبدء أسبوع جديد</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 14, overflowX: 'auto' }}>
          <button
            className={`btn btn-sm ${activeViewMode === 'board' ? 'btn-primary' : ''}`}
            onClick={() => setActiveViewMode('board')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <Eye size={14} />
            <span>البوستر التفاعلي (المواد والتصنيفات)</span>
          </button>

          <button
            className={`btn btn-sm ${activeViewMode === 'checklist' ? 'btn-primary' : ''}`}
            onClick={() => setActiveViewMode('checklist')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <CalendarCheck size={14} />
            <span>قائمة المهام والاستبدال ({totalTasksCount})</span>
          </button>

          <button
            className={`btn btn-sm ${activeViewMode === 'timeblock' ? 'btn-primary' : ''}`}
            onClick={() => setActiveViewMode('timeblock')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <Clock size={14} />
            <span>خطة البومودورو اليومية ⏱️</span>
          </button>

          <button
            className={`btn btn-sm ${activeViewMode === 'archive' ? 'btn-primary' : ''}`}
            onClick={() => setActiveViewMode('archive')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <History size={14} />
            <span>أرشيف الأسابيع السابقة ({archivedWeeks.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: INTERACTIVE BOARD OVERLAY OVER TEMPLATE */}
      {activeViewMode === 'board' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#090d0f' }}>
          {/* Legend Header showing Subjects + Categories */}
          <div style={{ padding: '12px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-main)' }}>
              <Sparkles size={15} style={{ color: 'var(--accent-primary)' }} />
              <span>اضغط على أي خانة لتسجيل الإنجاز ✓، أو اضغط أيقونة (🔁) للاستبدال بمهمة أو محاضرة، أو الخانة الأخيرة للإضافة اليدوية!</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, flexWrap: 'wrap' }}>
              {Object.entries(SUBJECT_SHORT_LABELS).map(([id, meta]) => (
                <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: meta.color, fontWeight: 700 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
                  {meta.name}
                </span>
              ))}
              <span style={{ opacity: 0.3 }}>|</span>
              <span style={{ color: '#0284c7', fontWeight: 700 }}>🏢 سنتر</span>
              <span style={{ color: '#d97706', fontWeight: 700 }}>💻 محاضرة</span>
              <span style={{ color: '#0d9488', fontWeight: 700 }}>🔄 مراجعة</span>
              <span style={{ color: '#ea580c', fontWeight: 700 }}>⚡ مهمتك</span>
            </div>
          </div>

          {/* Interactive Poster Area */}
          <div style={{ position: 'relative', width: '100%', overflowX: 'auto', padding: '16px 8px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 1240, minWidth: 820, aspectRatio: '2000 / 1414', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              {/* Background Template Image */}
              <img
                src="/weekly_schedule_template.png"
                alt="جدول الأسبوع"
                style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
              />

              {/* Today's highlight indicator pill over today's column header */}
              {SCHEDULE_GRID_CONFIG.columns.map(col => {
                if (col.dayId !== todayDayId) return null;
                return (
                  <div
                    key={`today_badge_${col.dayId}`}
                    style={{
                      position: 'absolute',
                      left: `${col.leftPct + 1}%`,
                      top: '18.2%',
                      width: '10.95%',
                      textAlign: 'center',
                      background: 'linear-gradient(90deg, #10b981, #059669)',
                      color: '#fff',
                      fontSize: 'clamp(8px, 0.75vw, 11px)',
                      fontWeight: 800,
                      padding: '2px 4px',
                      borderRadius: 99,
                      boxShadow: '0 2px 8px rgba(16,185,129,0.5)',
                      zIndex: 3,
                      pointerEvents: 'none'
                    }}
                  >
                    ★ النهاردة ★
                  </div>
                );
              })}

              {/* Dynamic Interactive Slots mapped to 7 columns x 10 rows */}
              {SCHEDULE_GRID_CONFIG.columns.map(col => {
                const dayTasks = daySlotsMap.get(col.dayId) || [];

                return SCHEDULE_GRID_CONFIG.rows.map(row => {
                  const task = dayTasks[row.index];
                  const isDone = task ? (completedTaskIds.has(task.id) || completedTaskIds.has(String(task.id))) : false;

                  return (
                    <div
                      key={`slot_${col.dayId}_${row.index}`}
                      style={{
                        position: 'absolute',
                        left: `${col.leftPct}%`,
                        top: `${row.topPct}%`,
                        width: '12.95%',
                        height: '6.01%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: '2px 5px',
                        boxSizing: 'border-box',
                        transition: 'all 0.15s ease',
                        zIndex: 2
                      }}
                      title={
                        task
                          ? `${SUBJECT_SHORT_LABELS[task.subjId]?.name || task.subjId} | ${task.text}`
                          : row.index === 9
                            ? `إضافة مهمة يدوية أسفل يوم ${col.label}`
                            : 'خانة فارغة'
                      }
                    >
                      {task ? (
                        (() => {
                          const catMeta = getCategoryMeta(task);
                          const subjMeta = SUBJECT_SHORT_LABELS[task.subjId] || { name: task.subjId || 'مادة', color: '#475569' };
                          const isManualOrFocus = Boolean(task.isUserAdded || task.category === 'manual');

                          return (
                            <div
                              onClick={() => handleCheck(task.id)}
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: 14,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                textAlign: 'center',
                                padding: '2px 5px',
                                background: isDone
                                  ? 'rgba(16, 185, 129, 0.2)'
                                  : isManualOrFocus
                                    ? 'rgba(249, 115, 22, 0.08)'
                                    : 'transparent',
                                borderRight: `3.5px solid ${subjMeta.color}`,
                                color: isDone ? '#475569' : '#0f172a',
                                fontFamily: 'AraHamahHoms, Cairo, sans-serif',
                                fontWeight: 700,
                                lineHeight: 1.12,
                                userSelect: 'none',
                                position: 'relative'
                              }}
                            >
                              {/* Top bar: Category Badge + Subject Pill + Quick Swap button */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  width: '100%',
                                  padding: '0 2px',
                                  fontSize: 'clamp(7px, 0.62vw, 9.5px)',
                                  fontFamily: 'Cairo, sans-serif',
                                  gap: 2
                                }}
                              >
                                {/* Category Tag */}
                                <span style={{ color: catMeta.color, fontWeight: 800, whiteSpace: 'nowrap' }}>
                                  {catMeta.emoji} {catMeta.label}
                                </span>

                                {/* Subject Colored Pill + Quick Swap Trigger */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <span
                                    style={{
                                      background: `${subjMeta.color}1e`,
                                      color: subjMeta.color,
                                      padding: '0px 4px',
                                      borderRadius: 4,
                                      fontWeight: 800,
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {subjMeta.name}
                                  </span>
                                  {isDone ? (
                                    <span style={{ color: '#10b981', fontWeight: 900 }}>✓</span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenSwap(task);
                                      }}
                                      title="استبدال أو نقل المهمة"
                                      style={{
                                        border: 'none',
                                        background: 'rgba(15, 23, 42, 0.08)',
                                        color: '#334155',
                                        borderRadius: 4,
                                        padding: '0 3px',
                                        fontSize: 'clamp(7px, 0.6vw, 9px)',
                                        cursor: 'pointer',
                                        lineHeight: 1.2
                                      }}
                                    >
                                      🔁
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Task Title in AraHamahHoms */}
                              <div
                                style={{
                                  fontSize: 'clamp(8.5px, 0.8vw, 11.5px)',
                                  textDecoration: isDone ? 'line-through' : 'none',
                                  overflow: 'hidden',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  wordBreak: 'break-word',
                                  textAlign: 'center',
                                  marginBottom: 1
                                }}
                              >
                                {isManualOrFocus && !task.text.includes('⭐') ? `⭐ ${task.text}` : task.text}
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        // Reserved empty bottom slot (Row 9) or open slot quick trigger
                        row.index === 9 && (
                          <div
                            onClick={() => {
                              setSlotQuickAddDay(col.dayId);
                              setSlotQuickText('');
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: 14,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1.5px dashed rgba(234, 88, 12, 0.45)',
                              background: 'rgba(249, 115, 22, 0.05)',
                              color: '#c2410c',
                              fontSize: 'clamp(8px, 0.7vw, 10.5px)',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontFamily: 'Cairo, sans-serif'
                            }}
                          >
                            + خانة يدوية
                          </div>
                        )
                      )}
                    </div>
                  );
                });
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: INTERACTIVE CHECKLIST BELOW THE BOARD */}
      {activeViewMode === 'checklist' && (
        <div className="card" style={{ padding: '16px 20px' }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className={`btn btn-sm ${selectedDayTab === 'all' ? 'btn-primary' : ''}`}
                onClick={() => setSelectedDayTab('all')}
                style={{ fontWeight: 700 }}
              >
                جميع الأيام ({totalTasksCount})
              </button>
              {ORDERED_WEEK_DAYS.map(d => {
                const dayTasks = tasks.filter(t => t.dayId === d.id);
                const doneCount = dayTasks.filter(t => completedTaskIds.has(t.id) || completedTaskIds.has(String(t.id))).length;
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
                      borderColor: isToday ? 'var(--accent-primary)' : undefined
                    }}
                  >
                    <span>{d.label} {isToday ? '★' : ''}</span>
                    <span style={{ fontSize: 10, opacity: 0.8 }}>({doneCount}/{dayTasks.length})</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
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
                style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <Star size={13} style={{ color: '#f97316' }} />
                <span>مهامك المضافة ⚡ ({tasks.filter(t => t.category === 'manual' || t.isUserAdded).length})</span>
              </button>
              <button
                className={`btn btn-sm ${selectedCategoryFilter === 'pending' ? 'btn-primary' : ''}`}
                onClick={() => setSelectedCategoryFilter('pending')}
                style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <Laptop size={13} style={{ color: '#fbbf24' }} />
                <span>محاضرات للإنجاز ({tasks.filter(t => t.category === 'platform' || t.category === 'study').length})</span>
              </button>
              <button
                className={`btn btn-sm ${selectedCategoryFilter === 'review' ? 'btn-primary' : ''}`}
                onClick={() => setSelectedCategoryFilter('review')}
                style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <RotateCcw size={13} style={{ color: '#14b8a6' }} />
                <span>محاضرات للمراجعة 🔄 ({tasks.filter(t => t.category === 'review').length})</span>
              </button>
              <button
                className={`btn btn-sm ${selectedCategoryFilter === 'center' ? 'btn-primary' : ''}`}
                onClick={() => setSelectedCategoryFilter('center')}
                style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <Building2 size={13} style={{ color: '#38bdf8' }} />
                <span>السناتر الحضورية 🏢 ({tasks.filter(t => t.category === 'center').length})</span>
              </button>
            </div>
          </div>

          {/* Tasks list grouped by day */}
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

                return (
                  <div key={d.id} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 14, border: d.id === todayDayId ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <strong style={{ fontSize: 15, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={16} />
                        <span>يوم {d.label} {d.id === todayDayId ? '(النهاردة ★)' : ''}</span>
                      </strong>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {dayTasks.filter(t => completedTaskIds.has(t.id) || completedTaskIds.has(String(t.id))).length} من {dayTasks.length} منجز
                      </span>
                    </div>

                    {dayTasks.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>لا توجد مهام مطابقة لهذا الفلتر.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {dayTasks.map(t => {
                          const isDone = completedTaskIds.has(t.id) || completedTaskIds.has(String(t.id));
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
                                borderRight: `4px solid ${subj?.color || 'var(--accent-primary)'}`,
                                background: isDone ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-surface)',
                                borderTop: '1px solid var(--border-subtle)',
                                borderBottom: '1px solid var(--border-subtle)',
                                borderLeft: '1px solid var(--border-subtle)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={() => handleCheck(t.id)}
                                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                                />

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    {subj && (
                                      <span style={{
                                        fontSize: 10,
                                        padding: '2px 8px',
                                        borderRadius: 6,
                                        background: `${subj.color}22`,
                                        color: subj.color,
                                        fontWeight: 800
                                      }}>
                                        {subj.name}
                                      </span>
                                    )}

                                    <span style={{
                                      fontSize: 10,
                                      padding: '2px 8px',
                                      borderRadius: 6,
                                      background: `${catMeta.color}1e`,
                                      color: catMeta.color,
                                      fontWeight: 700
                                    }}>
                                      {catMeta.emoji} {catMeta.label}
                                    </span>

                                    <span
                                      style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                                        textDecoration: isDone ? 'line-through' : 'none'
                                      }}
                                    >
                                      {t.text}
                                    </span>

                                    {t.slotIndex === 9 && (
                                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', fontWeight: 700 }}>
                                        الخانة اليدوية الأخيرة
                                      </span>
                                    )}
                                  </div>

                                  {(t.teacher || t.time) && (
                                    <div style={{ fontSize: 11, color: 'var(--text-faint)', display: 'flex', gap: 10 }}>
                                      {t.teacher && <span>{t.teacher}</span>}
                                      {t.time && <span>{t.time}</span>}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Task actions */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <button
                                  className="btn btn-sm"
                                  onClick={() => handleOpenSwap(t)}
                                  title="استبدال بمهمة أخرى في الجدول أو من المحاضرات"
                                  style={{ padding: '3px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                  <ArrowRightLeft size={12} />
                                  <span>استبدال</span>
                                </button>

                                <button
                                  className="btn btn-sm"
                                  onClick={() => onOpenEditTask(t)}
                                  style={{ padding: '3px 8px', fontSize: 11 }}
                                >
                                  <Pencil size={12} />
                                </button>

                                {onDeleteTask && (
                                  <button
                                    className="btn btn-sm"
                                    onClick={() => onDeleteTask(t.id)}
                                    style={{ padding: '3px 8px', fontSize: 11, color: 'var(--danger)' }}
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

                    {/* Quick Add box at the bottom of day */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder={`+ إضافة في الخانة الأخيرة ليوم ${d.label}...`}
                        value={quickAddInput[d.id] || ''}
                        onChange={(e) => setQuickAddInput(prev => ({ ...prev, [d.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleQuickAdd(d.id);
                        }}
                        style={{ fontSize: 12, padding: '6px 12px', margin: 0 }}
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

      {/* VIEW MODE 3: POMODORO PLAN */}
      {activeViewMode === 'timeblock' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
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
                <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.1)', borderRight: '3px solid #10b981' }}>
                  <strong>10:00 ص - 1:00 ظ:</strong> إنجاز محاضرتين + مراجعة تثبيت
                </div>
                <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.15)', borderRight: '3px solid #0284c7' }}>
                  <strong>4:00 م - 6:30 م:</strong> 🏢 سنتر عربي أ. تقوى مرزوق
                </div>
                <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.15)', borderRight: '3px solid #0284c7' }}>
                  <strong>7:00 م - 9:30 م:</strong> 🏢 سنتر إنجليزي أ. أيمن عبد العاطي
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--accent-primary)', fontSize: 14 }}>🗓️ أيام سنتر التاريخ (الإثنين والخميس)</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, fontSize: 12 }}>
                <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.15)', borderRight: '3px solid #0284c7' }}>
                  <strong>1:00 ظ - 3:00 ع:</strong> 🏢 سنتر تاريخ الفشن أ. أحمد سمير
                </div>
                <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(99, 102, 241, 0.12)', borderRight: '3px solid #6366f1' }}>
                  <strong>5:00 م - 9:00 م:</strong> جلسات فيزياء وعربي من المحاضرات المتبقية
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--accent-primary)', fontSize: 14 }}>🔥 أيام التقفيل الحرة (الأحد، الأربعاء، الجمعة)</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, fontSize: 12 }}>
                <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.12)', borderRight: '3px solid #f59e0b' }}>
                  <strong>أوقات مفتوحة:</strong> مثالية لإنهاء دفعات كبيرة من المحاضرات غير المنجزة + حل امتحانات شاملة.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 4: ARCHIVED WEEKS */}
      {activeViewMode === 'archive' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Archive size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>أرشيف الجداول السابقة (يتم الترحيل والأرشفة تلقائياً كل سبت)</span>
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
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
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
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

      {/* INLINE BOTTOM SLOT QUICK ADD MODAL */}
      {slotQuickAddDay && (
        <div className="modal-overlay show" onClick={() => setSlotQuickAddDay(null)}>
          <div className="modal-box" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={18} style={{ color: '#f97316' }} />
              <span>إضافة مهمة في الخانة اليدوية — يوم {getArabicDayLabel(slotQuickAddDay)}</span>
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
                  placeholder="اكتب مهمتك الطارئة هنا..."
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
              سيتم حفظ سجل الأسبوع الحالي ({completedCount} من {totalTasksCount} مهمة — {completionPercentage}%) في الأرشيف كما هو (اللي اتعمل اتعمل واللي ماتعملش خلص)، وتجهيز أسبوع جديد نظيف.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => confirmExecuteArchive(true)}
              >
                🎲 أرشفة + توليد مهام عشوائية جديدة من المحاضرات والسناتر
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
              <span>استبدال وتبديل المهمة</span>
            </div>

            <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                المهمة الحالية ({getArabicDayLabel(taskToSwap.dayId)} - {SUBJECT_SHORT_LABELS[taskToSwap.subjId]?.name || taskToSwap.subjId}):
              </span>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginTop: 3 }}>
                {taskToSwap.text}
              </div>
            </div>

            {/* 3 Swap Mode Tabs */}
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

            {/* MODE 1: Two-way Swap with another existing task on the schedule */}
            {swapMode === 'schedule' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  اختر مهمة أخرى من الجدول لتبديل أيامهما وأماكنهما معاً:
                </label>
                <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 4 }}>
                  {swappableScheduleTasks.map(other => {
                    const isSelected = selectedScheduleTargetId === String(other.id);
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
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5, background: `${subjMeta.color}22`, color: subjMeta.color, fontWeight: 800, flexShrink: 0 }}>
                            {subjMeta.name}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-main)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {other.text}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>
                          {getArabicDayLabel(other.dayId)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MODE 2: Replace from real Lectures Catalog (82+ lectures) */}
            {swapMode === 'lectures' && (
              <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={13} style={{ position: 'absolute', right: 10, top: 10, color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="ابحث في جدول المحاضرات..."
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
                    الكل ({lectures.length})
                  </button>
                  <button type="button" className={`btn btn-sm ${swapLectureFilter === 'pending' ? 'btn-primary' : ''}`} onClick={() => setSwapLectureFilter('pending')} style={{ fontSize: 11 }}>
                    غير منجزة 💻 ({lectures.filter(l => !l.isDone).length})
                  </button>
                  <button type="button" className={`btn btn-sm ${swapLectureFilter === 'review' ? 'btn-primary' : ''}`} onClick={() => setSwapLectureFilter('review')} style={{ fontSize: 11 }}>
                    منجزة للمراجعة 🔄 ({lectures.filter(l => l.isDone).length})
                  </button>
                </div>

                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filteredSwapLectures.slice(0, 40).map(lec => {
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
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5, background: `${subjMeta.color}22`, color: subjMeta.color, fontWeight: 800, flexShrink: 0 }}>
                            {subjMeta.name}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-main)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {lec.code}: {lec.title}
                          </span>
                        </div>
                        <span style={{ fontSize: 10, color: lec.isDone ? '#14b8a6' : '#fbbf24', fontWeight: 700, flexShrink: 0 }}>
                          {lec.isDone ? '🔄 مراجعة' : '💻 غير منجزة'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MODE 3: Move to another day or replace from flexible pool */}
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
                  (swapMode === 'lectures' && !selectedLectureId)
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
