import React, { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Subject, WeeklyTask, Session, ExamRecord, Lecture, ArchivedWeek } from '../types';
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Download,
  Flame,
  Zap,
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
  BookOpen,
  Sparkles,
  ChevronRight,
  Eye,
  AlertTriangle,
  History
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

// Fixed weekly recurring classes per user specifications
export const FIXED_WEEKLY_CLASSES: Array<{
  dayId: string;
  subjId: string;
  text: string;
  category: 'center' | 'platform' | 'exam' | 'study';
  priority: 'class' | 'exam' | 'urgent' | 'high';
  teacher: string;
  time: string;
  slotIndex: number;
}> = [
  // Saturday
  {
    dayId: 'sat',
    subjId: 'arabic',
    text: 'سنتر عربي: أ. تقوى مرزوق',
    category: 'center',
    priority: 'class',
    teacher: 'أ. تقوى مرزوق',
    time: '4:00 مساءً',
    slotIndex: 0
  },
  {
    dayId: 'sat',
    subjId: 'english',
    text: 'سنتر إنجليزي: أ. أيمن عبد العاطي',
    category: 'center',
    priority: 'class',
    teacher: 'أ. أيمن عبد العاطي',
    time: '7:00 مساءً',
    slotIndex: 1
  },
  {
    dayId: 'sat',
    subjId: 'arabic',
    text: 'منصة عربي: أ. محمد صلاح',
    category: 'platform',
    priority: 'class',
    teacher: 'أ. محمد صلاح',
    time: 'منصة',
    slotIndex: 2
  },

  // Sunday
  {
    dayId: 'sun',
    subjId: 'physics',
    text: 'منصة فيزياء: أ. محمد عبد المعبود',
    category: 'platform',
    priority: 'class',
    teacher: 'أ. محمد عبد المعبود',
    time: 'منصة',
    slotIndex: 0
  },

  // Monday
  {
    dayId: 'mon',
    subjId: 'history',
    text: 'تاريخ: أ. أحمد سمير (سنتر/منصة)',
    category: 'platform',
    priority: 'class',
    teacher: 'أ. أحمد سمير',
    time: '1:00 ظهراً',
    slotIndex: 0
  },

  // Tuesday
  {
    dayId: 'tue',
    subjId: 'arabic',
    text: 'سنتر عربي: أ. تقوى مرزوق',
    category: 'center',
    priority: 'class',
    teacher: 'أ. تقوى مرزوق',
    time: '4:00 مساءً',
    slotIndex: 0
  },
  {
    dayId: 'tue',
    subjId: 'english',
    text: 'سنتر إنجليزي: أ. أيمن عبد العاطي',
    category: 'center',
    priority: 'class',
    teacher: 'أ. أيمن عبد العاطي',
    time: '7:00 مساءً',
    slotIndex: 1
  },
  {
    dayId: 'tue',
    subjId: 'arabic',
    text: 'منصة عربي: واجب وكويز أ. محمد صلاح',
    category: 'platform',
    priority: 'class',
    teacher: 'أ. محمد صلاح',
    time: 'منصة',
    slotIndex: 2
  },

  // Wednesday
  {
    dayId: 'wed',
    subjId: 'physics',
    text: 'منصة فيزياء: أ. محمد عبد المعبود',
    category: 'platform',
    priority: 'class',
    teacher: 'أ. محمد عبد المعبود',
    time: 'منصة',
    slotIndex: 0
  },

  // Thursday
  {
    dayId: 'thu',
    subjId: 'history',
    text: 'تاريخ: أ. أحمد سمير (سنتر/منصة)',
    category: 'platform',
    priority: 'class',
    teacher: 'أ. أحمد سمير',
    time: '1:00 ظهراً',
    slotIndex: 0
  },
  {
    dayId: 'thu',
    subjId: 'arabic',
    text: '🏆 امتحان عربي شامل الوحدة 2 (جوائز)',
    category: 'exam',
    priority: 'exam',
    teacher: 'أ. تقوى مرزوق / أ. محمد صلاح',
    time: 'امتحان جوائز',
    slotIndex: 1
  },

  // Friday
  {
    dayId: 'fri',
    subjId: 'english',
    text: '🏆 امتحان إنجليزي شامل Unit 3',
    category: 'exam',
    priority: 'exam',
    teacher: 'أ. أيمن عبد العاطي',
    time: 'امتحان شامل',
    slotIndex: 0
  },
  {
    dayId: 'fri',
    subjId: 'physics',
    text: 'مراجعة وحل متراكم الفيزياء الشامل',
    category: 'study',
    priority: 'high',
    teacher: 'أ. محمد عبد المعبود',
    time: 'ماراثون أسبوعي',
    slotIndex: 1
  }
];

// Flexible study bank for task swapping
const STUDY_BANK_ITEMS = [
  { subjId: 'physics', text: 'فيزياء: حل أسئلة وقوانين الحركة والسرعة من كتاب الامتحان' },
  { subjId: 'arabic', text: 'عربي: مراجعة نحو مدرسة الإحياء والبعث وتطبيقات البلاغة' },
  { subjId: 'english', text: 'إنجليزي: حفظ ومراجعة كلمات Unit 3 وحل تمارين كتاب المعاصر' },
  { subjId: 'history', text: 'تاريخ: تلخيص الفصل ومراجعة أسئلة الفهم والاستنتاج' },
  { subjId: 'physics', text: 'فيزياء: حل واجب المحاضرة وتدوين الملاحظات الصعبة' },
  { subjId: 'arabic', text: 'عربي: تدريبات شاملة على المحسنات البديعية وعلم المعاني' },
  { subjId: 'english', text: 'إنجليزي: تدريب على كتابة الإيميل وترجمة الجمل الوزارية' }
];

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
  onArchiveWeek
}) => {
  const [selectedDayTab, setSelectedDayTab] = useState<string>('all');
  const [activeViewMode, setActiveViewMode] = useState<'board' | 'checklist' | 'timeblock' | 'archive'>('board');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [quickAddInput, setQuickAddInput] = useState<{ [dayId: string]: string }>({});
  const [notificationStatus, setNotificationStatus] = useState<string>('default');

  // Task swap modal state
  const [swapModalOpen, setSwapModalOpen] = useState<boolean>(false);
  const [taskToSwap, setTaskToSwap] = useState<WeeklyTask | null>(null);
  const [swapTargetDay, setSwapTargetDay] = useState<string>('sat');
  const [swapBankSelect, setSwapBankSelect] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const templateImgRef = useRef<HTMLImageElement | null>(null);

  // Preload template image
  useEffect(() => {
    const img = new Image();
    img.src = '/weekly_schedule_template.png';
    img.onload = () => {
      templateImgRef.current = img;
    };
  }, []);

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  // Days order from Saturday to Friday (RTL school week)
  const orderedDays = useMemo(() => [
    { id: 'sat', label: 'السبت', short: 'سبت' },
    { id: 'sun', label: 'الأحد', short: 'أحد' },
    { id: 'mon', label: 'الاثنين', short: 'اثنين' },
    { id: 'tue', label: 'الثلاثاء', short: 'ثلاثاء' },
    { id: 'wed', label: 'الأربعاء', short: 'أربعاء' },
    { id: 'thu', label: 'الخميس', short: 'خميس' },
    { id: 'fri', label: 'الجمعة', short: 'جمعة' }
  ], []);

  // Map tasks to columns (up to 10 slots per day)
  const daySlotsMap = useMemo(() => {
    const map = new Map<string, Array<WeeklyTask | null>>();
    orderedDays.forEach(d => {
      map.set(d.id, new Array(10).fill(null));
    });

    // Populate day tasks
    tasks.forEach(t => {
      if (t.dayId && map.has(t.dayId)) {
        const slots = map.get(t.dayId)!;
        const targetSlot = (typeof t.slotIndex === 'number' && t.slotIndex >= 0 && t.slotIndex < 10)
          ? t.slotIndex
          : slots.findIndex(s => s === null);
        if (targetSlot !== -1 && slots[targetSlot] === null) {
          slots[targetSlot] = t;
        } else {
          // find first available empty slot
          const firstEmpty = slots.findIndex(s => s === null);
          if (firstEmpty !== -1) {
            slots[firstEmpty] = t;
          }
        }
      }
    });

    return map;
  }, [tasks, orderedDays]);

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

  // Quick add emergency task to row 9 (or first empty slot)
  const handleQuickAdd = (dayId: string) => {
    const text = quickAddInput[dayId]?.trim();
    if (!text || !onUpdateAllTasks) return;

    const slots = daySlotsMap.get(dayId) || [];
    let targetSlot = slots.findIndex(s => s === null);
    if (targetSlot === -1) targetSlot = 9;

    const newTask: WeeklyTask = {
      id: `task_quick_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dayId,
      subjId: 'arabic', // default subject
      text,
      priority: 'high',
      category: 'manual',
      slotIndex: targetSlot
    };

    const updated = [...tasks, newTask];
    onUpdateAllTasks(updated);
    setQuickAddInput(prev => ({ ...prev, [dayId]: '' }));
  };

  // Smart Feature 1: Task Rollover (ترحيل المهام غير المنجزة)
  const handleRolloverTasks = () => {
    if (!onUpdateAllTasks) return;

    const dayKeys = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
    let rolledCount = 0;
    let updatedTasks = [...tasks];

    // For each day from Saturday to Thursday, any uncompleted non-fixed task rolls over to the next day
    for (let i = 0; i < dayKeys.length - 1; i++) {
      const currentDay = dayKeys[i];
      const nextDay = dayKeys[i + 1];

      updatedTasks = updatedTasks.map(t => {
        const isDone = completedTaskIds.has(t.id) || completedTaskIds.has(String(t.id));
        // Only roll over non-class uncompleted tasks
        if (t.dayId === currentDay && !isDone && t.category !== 'center' && t.category !== 'platform') {
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
      alert(`⚡ تم ترحيل ${rolledCount} مهمة غير مكتملة إلى اليوم التالي بأولوية قصوى وعلامة عاجل!`);
    } else {
      alert('ممتاز! لا توجد مهام متأخرة تحتاج ترحيل.');
    }
  };

  // Smart Feature 2: Task Swapping (استبدال المهام)
  const handleOpenSwap = (task: WeeklyTask) => {
    setTaskToSwap(task);
    setSwapTargetDay(task.dayId);
    setSwapModalOpen(true);
  };

  const handleExecuteSwap = () => {
    if (!taskToSwap || !onUpdateAllTasks) return;

    let updatedTasks = [...tasks];

    if (swapBankSelect) {
      // Replace task with study bank item
      const bankItem = STUDY_BANK_ITEMS.find(item => item.text === swapBankSelect);
      if (bankItem) {
        updatedTasks = updatedTasks.map(t => {
          if (t.id === taskToSwap.id) {
            return {
              ...t,
              subjId: bankItem.subjId,
              text: bankItem.text,
              category: 'study'
            };
          }
          return t;
        });
      }
    } else if (swapTargetDay !== taskToSwap.dayId) {
      // Move task to target day
      updatedTasks = updatedTasks.map(t => {
        if (t.id === taskToSwap.id) {
          return {
            ...t,
            dayId: swapTargetDay
          };
        }
        return t;
      });
    }

    onUpdateAllTasks(updatedTasks);
    setSwapModalOpen(false);
    setTaskToSwap(null);
    setSwapBankSelect('');
  };

  // Smart Feature 3: Browser Notifications
  const handleRequestNotifications = async () => {
    if (!('Notification' in window)) {
      alert('المتصفح الحالي لا يدعم التنبيهات المباشرة.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationStatus(permission);
    if (permission === 'granted') {
      new Notification('شباب STUDY HUB ⚡', {
        body: 'تم تفعيل التنبيهات الذكية لمواعيد السناتر وحصص المنصات بنجاح!',
        icon: '/favicon.png'
      });
    }
  };

  // Smart Feature 4: Archiving Week
  const handleArchiveCurrentWeek = () => {
    if (!onArchiveWeek) return;

    const confirmArchive = window.confirm(
      `هل أنت متأكد من أرشفة جدول الأسبوع الحالي؟\nنسبة الإنجاز الحالية: ${completionPercentage}% (${completedCount}/${totalTasksCount}).\nسيتم حفظ الأسبوع في أرشيف الجداول والبدء بأسبوع جديد نظيف.`
    );
    if (!confirmArchive) return;

    const archiveRecord: ArchivedWeek = {
      id: `archive_${Date.now()}`,
      weekTitle: `الأسبوع المنتهي في ${new Date().toLocaleDateString('ar-EG')}`,
      archivedAt: new Date().toISOString(),
      totalCount: totalTasksCount,
      completedCount,
      completionPct: completionPercentage,
      tasks: [...tasks]
    };

    // Clean weekly tasks: retain recurring fixed classes
    const cleanTasks: WeeklyTask[] = FIXED_WEEKLY_CLASSES.map((f, idx) => ({
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
  };

  // Generate & Download the updated visual poster as PNG
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

    // 1. Draw template image
    let templateImg = templateImgRef.current;
    if (!templateImg || !templateImg.complete) {
      templateImg = new Image();
      templateImg.src = '/weekly_schedule_template.png';
      await new Promise(resolve => {
        templateImg!.onload = resolve;
      });
    }

    ctx.drawImage(templateImg, 0, 0, 2000, 1414);

    // 2. Load custom font
    try {
      await document.fonts.load('bold 18px "AraHamahHoms"');
    } catch (e) {}

    // 3. Render tasks into capsules
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

        // Render completed tint if done
        if (isDone) {
          ctx.save();
          ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
          ctx.beginPath();
          ctx.roundRect(capsuleX + 4, capsuleY + 4, capsuleW - 8, capsuleH - 8, 20);
          ctx.fill();
          ctx.restore();
        }

        // Clip region to capsule
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(capsuleX + 6, capsuleY + 6, capsuleW - 12, capsuleH - 12, 18);
        ctx.clip();

        // Tag badge
        let badgeColor = '#64748b';
        let badgeText = 'مذاكرة';
        if (task.category === 'center') {
          badgeColor = '#0284c7';
          badgeText = 'سنتر 🏢';
        } else if (task.category === 'platform') {
          badgeColor = '#d97706';
          badgeText = 'منصة 💻';
        } else if (task.category === 'exam') {
          badgeColor = '#7c3aed';
          badgeText = 'امتحان 🏆';
        } else if (task.priority === 'urgent' || task.isRolled) {
          badgeColor = '#dc2626';
          badgeText = 'عاجل 🚨';
        }

        // Draw small badge in capsule
        ctx.fillStyle = badgeColor;
        ctx.font = 'bold 12px "Cairo", sans-serif';
        ctx.textAlign = 'right';
        ctx.direction = 'rtl';
        ctx.fillText(badgeText, capsuleX + capsuleW - 14, capsuleY + 22);

        // Draw completion checkmark
        if (isDone) {
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 14px "Cairo", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('✓ تم', capsuleX + 14, capsuleY + 22);
        }

        // Draw task text using AraHamahHoms font
        ctx.fillStyle = isDone ? '#475569' : '#0f172a';
        ctx.font = 'bold 16px "AraHamahHoms", "Cairo", sans-serif';
        ctx.textAlign = 'center';
        ctx.direction = 'rtl';

        // Auto wrap or truncate text into two lines
        const words = task.text.split(' ');
        let line1 = '';
        let line2 = '';
        for (const w of words) {
          if ((line1 + ' ' + w).length <= 22) {
            line1 += (line1 ? ' ' : '') + w;
          } else {
            line2 += (line2 ? ' ' : '') + w;
          }
        }

        if (line2) {
          ctx.fillText(line1, capsuleX + capsuleW / 2, capsuleY + 44);
          ctx.fillText(line2, capsuleX + capsuleW / 2, capsuleY + 66);
        } else {
          ctx.fillText(line1, capsuleX + capsuleW / 2, capsuleY + 52);
        }

        // Strikethrough if done
        if (isDone) {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(capsuleX + 20, capsuleY + capsuleH / 2 + 5);
          ctx.lineTo(capsuleX + capsuleW - 20, capsuleY + capsuleH / 2 + 5);
          ctx.stroke();
        }

        ctx.restore();
      });
    });

    const dataUrl = canvas.toDataURL('image/png');
    setGeneratedImageUrl(dataUrl);
    setIsGeneratingImage(false);

    // Trigger download
    const link = document.createElement('a');
    link.download = `جدول_المذاكرة_الأسبوعي_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Get subject helper
  const getSubject = (subjId?: string) => subjects.find(s => s.id === subjId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner & Control Deck */}
      <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CalendarCheck size={22} style={{ color: 'var(--accent-primary)' }} />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                جدول الأسبوع التفاعلي الذكي (قالب الحـد الممتـاز)
              </h2>
              <span className="tabular" style={{ fontSize: 13, color: 'var(--accent-primary)', background: 'var(--bg-elevated)', padding: '2px 10px', borderRadius: 'var(--radius-full)' }}>
                {completedCount} من {totalTasksCount} مكتمل ({completionPercentage}%)
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, margin: '6px 0 0 0' }}>
              توزيع ذكي لمواعيد السناتر والمنصات (أ. أيمن عبد العاطي، أ. تقوى مرزوق، أ. أحمد سمير، أ. محمد صلاح، أ. محمد عبد المعبود).
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-sm btn-primary"
              onClick={generateScheduleCanvas}
              disabled={isGeneratingImage}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={14} />
              <span>{isGeneratingImage ? 'جارٍ توليد الصورة...' : 'توليد وتحميل صورة الجدول (PNG)'}</span>
            </button>

            <button
              className="btn btn-sm"
              onClick={handleRolloverTasks}
              title="نقل المهام التي لم تكتمل إلى اليوم التالي بأولوية عاجلة"
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--warning)', color: 'var(--warning)' }}
            >
              <RotateCcw size={14} />
              <span>ترحيل المهام غير المنجزة 🚨</span>
            </button>

            <button
              className="btn btn-sm"
              onClick={handleRequestNotifications}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderColor: notificationStatus === 'granted' ? 'var(--success)' : 'var(--border-subtle)',
                color: notificationStatus === 'granted' ? 'var(--success)' : 'var(--text-muted)'
              }}
            >
              <Bell size={14} />
              <span>{notificationStatus === 'granted' ? 'التنبيهات مفعلة' : 'تفعيل تنبيهات السناتر'}</span>
            </button>

            <button
              className="btn btn-sm"
              onClick={handleArchiveCurrentWeek}
              style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}
            >
              <Archive size={14} />
              <span>أرشفة الأسبوع</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs between Board, Checklist, Time-blocking, and Archives */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 14, overflowX: 'auto' }}>
          <button
            className={`btn btn-sm ${activeViewMode === 'board' ? 'btn-primary' : ''}`}
            onClick={() => setActiveViewMode('board')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <Eye size={14} />
            <span>البوستر التفاعلي (الصورة والخانات)</span>
          </button>

          <button
            className={`btn btn-sm ${activeViewMode === 'checklist' ? 'btn-primary' : ''}`}
            onClick={() => setActiveViewMode('checklist')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <CalendarCheck size={14} />
            <span>قائمة المهام التفصيلية وخانات الصح</span>
          </button>

          <button
            className={`btn btn-sm ${activeViewMode === 'timeblock' ? 'btn-primary' : ''}`}
            onClick={() => setActiveViewMode('timeblock')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <Clock size={14} />
            <span>خطة اليوم الزمنية المقترحة (بومودورو) ⏱️</span>
          </button>

          <button
            className={`btn btn-sm ${activeViewMode === 'archive' ? 'btn-primary' : ''}`}
            onClick={() => setActiveViewMode('archive')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <History size={14} />
            <span>أرشيف الجداول السابقة ({archivedWeeks.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: INTERACTIVE BOARD OVERLAY OVER TEMPLATE */}
      {activeViewMode === 'board' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#090d0f' }}>
          {/* Header instructions */}
          <div style={{ padding: '12px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-main)' }}>
              <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>اضغط على أي خانة بيضاء مباشرة في البوستر لتسجيل إنجازها بختم الصح الأخضر أو استبدالها!</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#38bdf8' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284c7' }} />
                سنتر (حضوري)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#fbbf24' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97706' }} />
                منصة (أونلاين)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#a78bfa' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed' }} />
                امتحان
              </span>
            </div>
          </div>

          {/* Interactive Poster Area */}
          <div style={{ position: 'relative', width: '100%', overflowX: 'auto', padding: '16px 8px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 1200, minWidth: 800, aspectRatio: '2000 / 1414', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              {/* Background Image */}
              <img
                src="/weekly_schedule_template.png"
                alt="جدول الأسبوع"
                style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
              />

              {/* Dynamic Interactive Slots mapped exactly to the 7 columns x 10 rows */}
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
                        cursor: task ? 'pointer' : 'default',
                        padding: '2px 6px',
                        boxSizing: 'border-box',
                        transition: 'all 0.15s ease',
                        zIndex: 2
                      }}
                      title={task ? `${task.text} - اضغط للتحديد أو الاستبدال` : 'خانة فارغة'}
                    >
                      {task ? (
                        <div
                          onClick={() => handleCheck(task.id)}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 14,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: '1px 4px',
                            background: isDone ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
                            color: isDone ? '#475569' : '#0f172a',
                            fontFamily: 'AraHamahHoms, Cairo, sans-serif',
                            fontWeight: 700,
                            lineHeight: 1.15,
                            userSelect: 'none',
                            position: 'relative'
                          }}
                        >
                          {/* Tag header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 2px', fontSize: 'clamp(8px, 0.7vw, 10px)' }}>
                            <span
                              style={{
                                color: task.category === 'center' ? '#0284c7' : task.category === 'platform' ? '#d97706' : task.category === 'exam' ? '#7c3aed' : '#64748b',
                                fontWeight: 800
                              }}
                            >
                              {task.category === 'center' ? '🏢 سنتر' : task.category === 'platform' ? '💻 منصة' : task.category === 'exam' ? '🏆 امتحان' : ''}
                            </span>
                            {isDone && (
                              <span style={{ color: '#10b981', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 2 }}>
                                ✓
                              </span>
                            )}
                          </div>

                          {/* Task Text in AraHamahHoms */}
                          <div
                            style={{
                              fontSize: 'clamp(9px, 0.85vw, 12px)',
                              textDecoration: isDone ? 'line-through' : 'none',
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              wordBreak: 'break-word',
                              textAlign: 'center'
                            }}
                          >
                            {task.text}
                          </div>
                        </div>
                      ) : (
                        // Empty slot 9 (quick add trigger)
                        row.index === 9 && (
                          <div
                            onClick={() => {
                              const input = prompt(`إضافة مهمة طارئة ليوم (${col.label}):`);
                              if (input?.trim()) {
                                setQuickAddInput(prev => ({ ...prev, [col.dayId]: input.trim() }));
                                setTimeout(() => handleQuickAdd(col.dayId), 50);
                              }
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: 14,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px dashed rgba(100, 116, 139, 0.35)',
                              color: 'rgba(100, 116, 139, 0.6)',
                              fontSize: 'clamp(9px, 0.75vw, 11px)',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            + إضافة يدوية
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
          {/* Day selection pill tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <button
              className={`btn btn-sm ${selectedDayTab === 'all' ? 'btn-primary' : ''}`}
              onClick={() => setSelectedDayTab('all')}
              style={{ fontWeight: 700 }}
            >
              جميع الأيام ({totalTasksCount})
            </button>
            {orderedDays.map(d => {
              const dayTasks = tasks.filter(t => t.dayId === d.id);
              const doneCount = dayTasks.filter(t => completedTaskIds.has(t.id) || completedTaskIds.has(String(t.id))).length;
              return (
                <button
                  key={d.id}
                  className={`btn btn-sm ${selectedDayTab === d.id ? 'btn-primary' : ''}`}
                  onClick={() => setSelectedDayTab(d.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span>{d.label}</span>
                  <span style={{ fontSize: 10, opacity: 0.8 }}>({doneCount}/{dayTasks.length})</span>
                </button>
              );
            })}
          </div>

          {/* List of Tasks grouped by day */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orderedDays
              .filter(d => selectedDayTab === 'all' || selectedDayTab === d.id)
              .map(d => {
                const dayTasks = tasks.filter(t => t.dayId === d.id);

                return (
                  <div key={d.id} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 14, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <strong style={{ fontSize: 15, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={16} />
                        <span>يوم {d.label}</span>
                      </strong>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {dayTasks.filter(t => completedTaskIds.has(t.id) || completedTaskIds.has(String(t.id))).length} من {dayTasks.length} منجز
                      </span>
                    </div>

                    {dayTasks.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>لا توجد مهام مسجلة لهذا اليوم حتى الآن.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {dayTasks.map(t => {
                          const isDone = completedTaskIds.has(t.id) || completedTaskIds.has(String(t.id));
                          const subj = getSubject(t.subjId);

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
                                background: isDone ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-surface)',
                                border: isDone ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={() => handleCheck(t.id)}
                                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                                />

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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

                                    {/* Badges */}
                                    {t.category === 'center' && (
                                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <Building2 size={11} />
                                        <span>سنتر</span>
                                      </span>
                                    )}

                                    {t.category === 'platform' && (
                                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <Laptop size={11} />
                                        <span>منصة</span>
                                      </span>
                                    )}

                                    {t.priority === 'exam' && (
                                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <FileCheck size={11} />
                                        <span>امتحان</span>
                                      </span>
                                    )}

                                    {t.isRolled && (
                                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(239, 83, 80, 0.15)', color: 'var(--danger)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <Flame size={11} />
                                        <span>مرحّلة (عاجل)</span>
                                      </span>
                                    )}
                                  </div>

                                  {(t.teacher || t.time || subj) && (
                                    <div style={{ fontSize: 11, color: 'var(--text-faint)', display: 'flex', gap: 10 }}>
                                      {subj && <span style={{ color: subj.color }}>{subj.name}</span>}
                                      {t.teacher && <span>{t.teacher}</span>}
                                      {t.time && <span>{t.time}</span>}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Task actions: Swap, Edit, Delete */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <button
                                  className="btn btn-sm"
                                  onClick={() => handleOpenSwap(t)}
                                  title="استبدال المهمة بمهمة أخرى أو نقلها ليوم بديل"
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

                    {/* Quick Add box at the bottom of the day list */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder={`+ إضافة مهمة طارئة لـ ${d.label}...`}
                        value={quickAddInput[d.id] || ''}
                        onChange={(e) => setQuickAddInput(prev => ({ ...prev, [d.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleQuickAdd(d.id);
                        }}
                        style={{ fontSize: 12, padding: '6px 12px' }}
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

      {/* VIEW MODE 3: STUDY TIME-BLOCKING PLAN (POMODORO 50/10) */}
      {activeViewMode === 'timeblock' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>الخطة الزمنية المقترحة لليوم (تقسيم بومودورو 50 دقيقة تركيز / 10 دقائق استراحة)</span>
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              يحسب النظام أوقات الفراغ تلقائياً حول مواعيد السناتر والمنصات الثابتة لضمان إنهاء متراكم المحاضرات الـ 82 بدون إجهاد.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {/* Saturday Plan */}
            <div style={{ background: 'var(--bg-elevated)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--accent-primary)', fontSize: 14 }}>🗓️ خطة السبت (سنتر 4:00 ع + سنتر 7:00 م)</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, fontSize: 12 }}>
                <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.1)', borderRight: '3px solid #38bdf8' }}>
                  <strong>10:00 ص - 12:00 ظ:</strong> بومودورو 1 & 2 (عربي م. صلاح - نحو وبلاغة)
                </div>
                <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.15)', borderRight: '3px solid #0284c7' }}>
                  <strong>4:00 م - 6:30 م:</strong> 🏢 حضور سنتر أ. تقوى مرزوق (لغة عربية)
                </div>
                <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.15)', borderRight: '3px solid #0284c7' }}>
                  <strong>7:00 م - 9:30 م:</strong> 🏢 حضور سنتر أ. أيمن عبد العاطي (لغة إنجليزية)
                </div>
                <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.1)', borderRight: '3px solid #10b981' }}>
                  <strong>10:30 م - 12:00 ص:</strong> جلسة تصفية الواجب ومراجعة كلمات Unit 3
                </div>
              </div>
            </div>

            {/* Sunday Plan */}
            <div style={{ background: 'var(--bg-elevated)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--accent-primary)', fontSize: 14 }}>🗓️ خطة الأحد (منصة فيزياء أ. محمد عبد المعبود)</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, fontSize: 12 }}>
                <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.1)', borderRight: '3px solid #f59e0b' }}>
                  <strong>1:00 ظ - 3:30 ع:</strong> 💻 استماع وتدوين محاضرة الفيزياء الجديدة
                </div>
                <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(86, 194, 166, 0.1)', borderRight: '3px solid var(--accent-primary)' }}>
                  <strong>4:30 م - 6:00 م:</strong> حل مسائل وتمارين السرعة والعجلة المتراكمة
                </div>
                <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(167, 139, 250, 0.1)', borderRight: '3px solid #a78bfa' }}>
                  <strong>7:30 م - 10:00 م:</strong> مراجعة تاريخ الفصل الأول وحل كويز
                </div>
              </div>
            </div>

            {/* Thursday & Friday Exam Marathon */}
            <div style={{ background: 'var(--bg-elevated)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: '#a78bfa', fontSize: 14 }}>🏆 خطة الخميس والجمعة (الامتحانات الشاملة والجوائز)</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, fontSize: 12 }}>
                <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(167, 139, 250, 0.15)', borderRight: '3px solid #a78bfa' }}>
                  <strong>الخميس:</strong> سنتر تاريخ (1:00 ظ) + 🏆 امتحان عربي الوحدة 2 الشامل
                </div>
                <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(167, 139, 250, 0.15)', borderRight: '3px solid #a78bfa' }}>
                  <strong>الجمعة:</strong> 🏆 امتحان إنجليزي شامل Unit 3 + ماراثون لم المتراكم
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
              <span>أرشيف الجداول السابقة وسجل الإنجاز</span>
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {archivedWeeks.length} أسابيع مؤرشفة
            </span>
          </div>

          {archivedWeeks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
              <Archive size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ margin: 0 }}>لم يتم أرشفة أي أسبوع بعد. يمكنك أرشفة الأسبوع الحالي عند انتهاء يوم الجمعة.</p>
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
                    أنجزت {arch.completedCount} من أصل {arch.totalCount} مهمة
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

      {/* TASK SWAPPING MODAL */}
      {swapModalOpen && taskToSwap && (
        <div className="modal-overlay show" onClick={() => setSwapModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowRightLeft size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>استبدال / إعادة جدولة المهمة</span>
            </div>

            <div style={{ marginBottom: 14, padding: 10, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>المهمة المحددة:</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginTop: 4 }}>
                {taskToSwap.text}
              </div>
            </div>

            {/* Option A: Move to another day */}
            <div style={{ marginBottom: 14 }}>
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
              >
                {orderedDays.map(d => (
                  <option key={d.id} value={d.id}>
                    يوم {d.label} {d.id === taskToSwap.dayId ? '(اليوم الحالي)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Option B: Swap from Flexible Study Bank */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                2. أو استبدالها بمهمة جاهزة من بنك المذاكرة المرن:
              </label>
              <select
                className="input-field"
                value={swapBankSelect}
                onChange={(e) => setSwapBankSelect(e.target.value)}
              >
                <option value="">-- اختر مهمة بديلة من بنك المتراكم --</option>
                {STUDY_BANK_ITEMS.map((item, idx) => (
                  <option key={idx} value={item.text}>
                    {item.text}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn" onClick={() => setSwapModalOpen(false)}>
                إلغاء
              </button>
              <button type="button" className="btn btn-primary" onClick={handleExecuteSwap}>
                تنفيذ الاستبدال وحفظ الجدول
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
