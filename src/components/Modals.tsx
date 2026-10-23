import React, { useState, useEffect } from 'react';
import { Subject, ExamRecord, WeeklyTask, Lecture } from '../types';
import {
  Coffee,
  FileText,
  FilePlus,
  Award,
  AlertTriangle,
  Volume2,
  Calendar,
  Clock,
  Zap,
  Trash2,
  Pencil,
  BookOpen,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  XCircle
} from 'lucide-react';

// ================= BREAK MODAL =================
interface BreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakDurationMinutes?: number;
}

export const BreakModal: React.FC<BreakModalProps> = ({ isOpen, onClose, breakDurationMinutes = 5 }) => {
  const [secondsLeft, setSecondsLeft] = useState(breakDurationMinutes * 60);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(breakDurationMinutes * 60);
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, breakDurationMinutes]);

  if (!isOpen) return null;

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const timeFormatted = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;

  return (
    <div className="break-modal show">
      <div style={{ color: 'var(--accent-primary)', marginBottom: 16 }}>
        <Coffee size={48} />
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>
        استراحة ذكية (بومودورو)
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 440, lineHeight: 1.6 }}>
        تنفس بعمق، تحرك قليلاً، اشرب ماءً، وتجنب الشاشات والمشتتات حتى يعود تركيزك في أعلى مستوياته.
      </p>
      <div className="break-clock tabular">{timeFormatted}</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-primary" onClick={onClose}>
          إنهاء الاستراحة والعودة للتركيز
        </button>
      </div>
    </div>
  );
};

// ================= NEW EXAM MODAL =================
interface ExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onSave: (exam: Omit<ExamRecord, 'id' | 'pct'>) => void;
}

export const ExamModal: React.FC<ExamModalProps> = ({ isOpen, onClose, subjects, onSave }) => {
  const [subjId, setSubjId] = useState('physics');
  const [teacher, setTeacher] = useState('أ. محمد عبد المعبود');
  const [topic, setTopic] = useState('');
  const [score, setScore] = useState<number | ''>(48);
  const [total, setTotal] = useState<number | ''>(50);
  const [examType, setExamType] = useState('امتحان شامل');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (score === '' || total === '' || !topic.trim()) return;

    onSave({
      subjId,
      teacher: teacher.trim() || 'أستاذ المادة',
      topic: topic.trim(),
      score: Number(score),
      total: Number(total),
      examType,
      date,
      notes: notes.trim()
    });
    onClose();
  };

  const calculatedPct = score !== '' && total !== '' && Number(total) > 0
    ? Math.round((Number(score) / Number(total)) * 100)
    : 0;

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FilePlus size={18} style={{ color: 'var(--accent-primary)' }} />
          <span>تسجيل نتيجة امتحان جديد</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>المادة الدراسية:</label>
            <select
              className="input-field"
              value={subjId}
              onChange={(e) => {
                const s = e.target.value;
                setSubjId(s);
                if (s === 'physics') setTeacher('أ. محمد عبد المعبود (منصة أونلاين)');
                else if (s === 'arabic') setTeacher('أ. محمد صلاح / مس تقوى');
                else if (s === 'english') setTeacher('مستر أيمن عبد العاطي');
                else if (s === 'history') setTeacher('مستر أحمد سمير');
              }}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>المدرس / السنتر:</label>
              <input
                type="text"
                className="input-field"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>نوع الامتحان:</label>
              <select className="input-field" value={examType} onChange={(e) => setExamType(e.target.value)}>
                <option value="امتحان شامل">امتحان شامل</option>
                <option value="امتحان شهر">امتحان شهر</option>
                <option value="كويز حصة">كويز حصة</option>
                <option value="واجب مقيم">واجب مقيم</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>موضوع / تفاصيل الامتحان:</label>
            <input
              type="text"
              className="input-field"
              placeholder="مثال: الفصل الأول كمية التحرك والمقذوفات"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>الدرجة المحققة:</label>
              <input
                type="number"
                step="0.5"
                className="input-field tabular"
                value={score}
                onChange={(e) => setScore(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>الدرجة الكلية:</label>
              <input
                type="number"
                step="0.5"
                className="input-field tabular"
                value={total}
                onChange={(e) => setTotal(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>النسبة المئوية:</label>
              <div
                className="input-field tabular"
                style={{
                  fontWeight: 800,
                  color: calculatedPct >= 95 ? 'var(--success)' : 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-primary)'
                }}
              >
                {calculatedPct}% {calculatedPct >= 95 ? 'أوائل' : 'نقص'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>تاريخ الامتحان:</label>
              <input
                type="date"
                className="input-field tabular"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>ملاحظات / أين ضاعت الدرجات؟</label>
              <input
                type="text"
                className="input-field"
                placeholder="تسرع، عدم مراجعة، فكرة جديدة..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn btn-primary">
              حفظ الامتحان وتحليل المراقب
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= EDIT EXAM MODAL =================
interface EditExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: ExamRecord | null;
  subjects: Subject[];
  onUpdate: (updatedExam: ExamRecord) => void;
  onDelete: (id: string) => void;
}

export const EditExamModal: React.FC<EditExamModalProps> = ({
  isOpen,
  onClose,
  exam,
  subjects,
  onUpdate,
  onDelete
}) => {
  const [subjId, setSubjId] = useState('');
  const [teacher, setTeacher] = useState('');
  const [topic, setTopic] = useState('');
  const [score, setScore] = useState<number | ''>(0);
  const [total, setTotal] = useState<number | ''>(50);
  const [examType, setExamType] = useState('امتحان شامل');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (exam) {
      setSubjId(exam.subjId);
      setTeacher(exam.teacher);
      setTopic(exam.topic);
      setScore(exam.score);
      setTotal(exam.total);
      setExamType(exam.examType || 'امتحان شامل');
      setDate(exam.date);
      setNotes(exam.notes || '');
    }
  }, [exam]);

  if (!isOpen || !exam) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (score === '' || total === '' || !topic.trim()) return;

    const numScore = Number(score);
    const numTotal = Number(total);
    const pct = numTotal > 0 ? Math.round((numScore / numTotal) * 100) : 0;

    onUpdate({
      ...exam,
      subjId,
      teacher: teacher.trim() || 'أستاذ المادة',
      topic: topic.trim(),
      score: numScore,
      total: numTotal,
      pct,
      examType,
      date,
      notes: notes.trim()
    });
    onClose();
  };

  const calculatedPct = score !== '' && total !== '' && Number(total) > 0
    ? Math.round((Number(score) / Number(total)) * 100)
    : 0;

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pencil size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>تعديل بيانات الامتحان</span>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              onDelete(exam.id);
              onClose();
            }}
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: 11 }}
          >
            <Trash2 size={12} />
            <span>حذف الامتحان</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>المادة الدراسية:</label>
            <select
              className="input-field"
              value={subjId}
              onChange={(e) => setSubjId(e.target.value)}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>المدرس / السنتر:</label>
              <input
                type="text"
                className="input-field"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>نوع الامتحان:</label>
              <select className="input-field" value={examType} onChange={(e) => setExamType(e.target.value)}>
                <option value="امتحان شامل">امتحان شامل</option>
                <option value="امتحان شهر">امتحان شهر</option>
                <option value="كويز حصة">كويز حصة</option>
                <option value="واجب مقيم">واجب مقيم</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>موضوع / تفاصيل الامتحان:</label>
            <input
              type="text"
              className="input-field"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>الدرجة المحققة:</label>
              <input
                type="number"
                step="0.5"
                className="input-field tabular"
                value={score}
                onChange={(e) => setScore(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>الدرجة الكلية:</label>
              <input
                type="number"
                step="0.5"
                className="input-field tabular"
                value={total}
                onChange={(e) => setTotal(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>النسبة المئوية:</label>
              <div
                className="input-field tabular"
                style={{
                  fontWeight: 800,
                  color: calculatedPct >= 95 ? 'var(--success)' : 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-primary)'
                }}
              >
                {calculatedPct}% {calculatedPct >= 95 ? 'أوائل' : 'نقص'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>تاريخ الامتحان:</label>
              <input
                type="date"
                className="input-field tabular"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>الملاحظات:</label>
              <input
                type="text"
                className="input-field"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn btn-primary">
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= EXAM REACTION MODAL =================
interface ExamReactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: ExamRecord | null;
  reactionText: string;
  onSpeak: () => void;
}

export const ExamReactionModal: React.FC<ExamReactionModalProps> = ({
  isOpen,
  onClose,
  exam,
  reactionText,
  onSpeak
}) => {
  if (!isOpen || !exam) return null;
  const isHigh = exam.pct >= 95;

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            {isHigh ? (
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                <Award size={32} />
              </div>
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 83, 80, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                <AlertTriangle size={32} />
              </div>
            )}
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: isHigh ? 'var(--success)' : 'var(--danger)', marginTop: 6 }}>
            {isHigh ? 'تقييم مشرف لأوائل الجمهورية!' : 'وقفة محاسبة فورية من المراقب الأكاديمي'}
          </h3>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            الدرجة: <strong className="tabular" style={{ color: 'var(--text-main)', fontSize: 16 }}>{exam.score} / {exam.total}</strong> ({exam.pct}%)
          </div>
        </div>

        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          fontSize: 14,
          lineHeight: 1.8,
          color: 'var(--text-main)',
          whiteSpace: 'pre-wrap'
        }}>
          {reactionText || 'جاري استدعاء تعليق المراقب...'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
          <button className="btn btn-sm btn-speak" onClick={onSpeak}>
            <Volume2 size={14} />
            <span>استمع لرد المراقب</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            فهمت ومستمر في المذاكرة
          </button>
        </div>
      </div>
    </div>
  );
};

// ================= NEW TASK MODAL =================
interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onSave: (task: { dayId: string; subjId: string; text: string; priority: WeeklyTask['priority'] }) => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, subjects, onSave }) => {
  const [dayId, setDayId] = useState('sat');
  const [subjId, setSubjId] = useState('arabic');
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<WeeklyTask['priority']>('normal');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSave({ dayId, subjId, text: text.trim(), priority });
    setText('');
    onClose();
  };

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
          <span>إضافة مهمة جديدة للجدول الأسبوعي</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>اليوم المستهدف:</label>
              <select className="input-field" value={dayId} onChange={(e) => setDayId(e.target.value)}>
                <option value="sat">السبت</option>
                <option value="sun">الأحد</option>
                <option value="mon">الاثنين</option>
                <option value="tue">الثلاثاء</option>
                <option value="wed">الأربعاء</option>
                <option value="thu">الخميس</option>
                <option value="fri">الجمعة</option>
                <option value="backlog">المتراكم (Backlog)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>المادة:</label>
              <select className="input-field" value={subjId} onChange={(e) => setSubjId(e.target.value)}>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>نص المهمة:</label>
            <input
              type="text"
              className="input-field"
              placeholder="مثال: حل شيت الفيزياء على كمية التحرك"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>مستوى الأولوية:</label>
            <select className="input-field" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
              <option value="normal">عادي</option>
              <option value="high">هام ومطلوب</option>
              <option value="urgent">عاجل جداً</option>
              <option value="class">موعد حصة / سنتر</option>
              <option value="exam">امتحان أو كويز</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn btn-primary">إضافة المهمة</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= EDIT TASK MODAL =================
interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: WeeklyTask | null;
  subjects: Subject[];
  onUpdate: (updatedTask: WeeklyTask) => void;
  onDelete: (taskId: string | number) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  subjects,
  onUpdate,
  onDelete
}) => {
  const [dayId, setDayId] = useState('sat');
  const [subjId, setSubjId] = useState('arabic');
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<WeeklyTask['priority']>('normal');

  useEffect(() => {
    if (task) {
      setDayId(task.dayId);
      setSubjId(task.subjId);
      setText(task.text);
      setPriority(task.priority || 'normal');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onUpdate({
      ...task,
      dayId,
      subjId,
      text: text.trim(),
      priority
    });
    onClose();
  };

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pencil size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>تعديل المهمة</span>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              onDelete(task.id);
              onClose();
            }}
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: 11 }}
          >
            <Trash2 size={12} />
            <span>حذف</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>اليوم المستهدف:</label>
              <select className="input-field" value={dayId} onChange={(e) => setDayId(e.target.value)}>
                <option value="sat">السبت</option>
                <option value="sun">الأحد</option>
                <option value="mon">الاثنين</option>
                <option value="tue">الثلاثاء</option>
                <option value="wed">الأربعاء</option>
                <option value="thu">الخميس</option>
                <option value="fri">الجمعة</option>
                <option value="backlog">المتراكم (Backlog)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>المادة:</label>
              <select className="input-field" value={subjId} onChange={(e) => setSubjId(e.target.value)}>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>نص المهمة:</label>
            <input
              type="text"
              className="input-field"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>مستوى الأولوية:</label>
            <select className="input-field" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
              <option value="normal">عادي</option>
              <option value="high">هام ومطلوب</option>
              <option value="urgent">عاجل جداً</option>
              <option value="class">موعد حصة / سنتر</option>
              <option value="exam">امتحان أو كويز</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn btn-primary">حفظ التعديلات</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= NEW LECTURE MODAL =================
interface NewLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onSave: (lecture: Omit<Lecture, 'id' | 'isDone'>) => void;
}

export const NewLectureModal: React.FC<NewLectureModalProps> = ({ isOpen, onClose, subjects, onSave }) => {
  const [code, setCode] = useState('المحاضرة (01)');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [dueDay, setDueDay] = useState('الأحد / الأربعاء');
  const [subjId, setSubjId] = useState('physics');
  const [packageName, setPackageName] = useState('باقة الفيزياء');
  const [tag, setTag] = useState('متاح الآن');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      code,
      title: title.trim(),
      details: details.trim(),
      dueDay,
      subjId,
      packageName,
      tag,
      type: 'lecture'
    });
    onClose();
  };

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={18} style={{ color: 'var(--accent-primary)' }} />
          <span>إضافة محاضرة منصة أو سنتر</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>المادة:</label>
              <select className="input-field" value={subjId} onChange={(e) => setSubjId(e.target.value)}>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>كود المحاضرة:</label>
              <input type="text" className="input-field" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>عنوان المحاضرة:</label>
            <input
              type="text"
              className="input-field"
              placeholder="مثال: كمية التحرك والدفع وقوانين الحركة"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>التفاصيل والمحاور:</label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="ملخص محتوى المحاضرة..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>مواعيد التنزيل / الحضور:</label>
              <input type="text" className="input-field" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>الباقة / المدرس:</label>
              <input type="text" className="input-field" value={packageName} onChange={(e) => setPackageName(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn btn-primary">إضافة المحاضرة</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= EDIT LECTURE MODAL =================
interface EditLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  lecture: Lecture | null;
  subjects: Subject[];
  onUpdate: (updatedLecture: Lecture) => void;
  onDelete: (id: string) => void;
}

export const EditLectureModal: React.FC<EditLectureModalProps> = ({
  isOpen,
  onClose,
  lecture,
  subjects,
  onUpdate,
  onDelete
}) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [subjId, setSubjId] = useState('');
  const [packageName, setPackageName] = useState('');
  const [tag, setTag] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (lecture) {
      setCode(lecture.code);
      setTitle(lecture.title);
      setDetails(lecture.details || '');
      setDueDay(lecture.dueDay || '');
      setSubjId(lecture.subjId);
      setPackageName(lecture.packageName || '');
      setTag(lecture.tag || '');
      setIsDone(lecture.isDone);
    }
  }, [lecture]);

  if (!isOpen || !lecture) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onUpdate({
      ...lecture,
      code,
      title: title.trim(),
      details: details.trim(),
      dueDay,
      subjId,
      packageName,
      tag,
      isDone
    });
    onClose();
  };

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pencil size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>تعديل المحاضرة</span>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              onDelete(lecture.id);
              onClose();
            }}
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: 11 }}
          >
            <Trash2 size={12} />
            <span>حذف</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>المادة:</label>
              <select className="input-field" value={subjId} onChange={(e) => setSubjId(e.target.value)}>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>كود المحاضرة:</label>
              <input type="text" className="input-field" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>عنوان المحاضرة:</label>
            <input
              type="text"
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>التفاصيل والمحاور:</label>
            <textarea
              className="input-field"
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>مواعيد التنزيل / الحضور:</label>
              <input type="text" className="input-field" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>الباقة / المدرس:</label>
              <input type="text" className="input-field" value={packageName} onChange={(e) => setPackageName(e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="lectureDoneCheckbox"
              checked={isDone}
              onChange={(e) => setIsDone(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
            <label htmlFor="lectureDoneCheckbox" style={{ fontSize: 13, color: 'var(--text-main)', cursor: 'pointer' }}>
              تم استماع المحاضرة وإنجازها بالكامل
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn btn-primary">حفظ التعديلات</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= EDIT SUBJECTS MODAL =================
interface EditSubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onSave: (updatedSubjects: Subject[]) => void;
}

export const EditSubjectsModal: React.FC<EditSubjectsModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onSave
}) => {
  const [localSubjects, setLocalSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    if (subjects) {
      setLocalSubjects(JSON.parse(JSON.stringify(subjects)));
    }
  }, [subjects, isOpen]);

  if (!isOpen) return null;

  const handleMinutesChange = (index: number, mins: number) => {
    setLocalSubjects((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], targetMinutes: Math.max(mins, 15) };
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSubjects);
    onClose();
  };

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sliders size={18} style={{ color: 'var(--accent-primary)' }} />
          <span>تعديل الأهداف اليومية للمواد</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          حدد عدد دقائق المذاكرة المستهدفة يومياً لكل مادة وفقاً لجدولك الدراسي.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {localSubjects.map((s, idx) => {
              const hours = (s.targetMinutes / 60).toFixed(1);
              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{s.name}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="number"
                      step="15"
                      min="15"
                      max="360"
                      className="input-field tabular"
                      style={{ width: 90, margin: 0, padding: '4px 8px', textAlign: 'center' }}
                      value={s.targetMinutes}
                      onChange={(e) => handleMinutesChange(idx, Number(e.target.value))}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      دقيقة ({hours}h)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn btn-primary">حفظ الأهداف</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= EXEMPTION MODAL =================
interface ExemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exemption: { title: string; minutes: number }) => void;
}

export const ExemptionModal: React.FC<ExemptionModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('مدرسة');
  const [hours, setHours] = useState('3');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = Math.round(Number(hours) * 60);
    if (!title.trim() || isNaN(mins) || mins <= 0) return;
    onSave({ title: title.trim(), minutes: mins });
    onClose();
  };

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} style={{ color: 'var(--accent-primary)' }} />
          <span>تسجيل إعفاء وقت (دروس سنتر / مدرسة / نوم)</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>سبب الإعفاء:</label>
            <input
              type="text"
              className="input-field"
              placeholder="مثال: سنتر التاريخ، المدرسة، مشوار عائلي..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>المدة بالساعات:</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="16"
              className="input-field tabular"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              required
            />
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '8px 0' }}>
            * يتم خصم ساعات الإعفاء تلقائياً من معادلة حساب الوقت الضائع لليوم (الـ 24 ساعة).
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
            <button type="button" className="btn" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn btn-primary">حفظ الإعفاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= AI SCHEDULE MODAL =================
interface AiScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (hours: string, bedtime: string, focusLevel: string) => void;
  isLoading: boolean;
  generatedSchedule: string | null;
}

export const AiScheduleModal: React.FC<AiScheduleModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isLoading,
  generatedSchedule
}) => {
  const [hours, setHours] = useState('4');
  const [bedtime, setBedtime] = useState('23:30');
  const [focusLevel, setFocusLevel] = useState('عالي جداً');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
          <span>توليد جدول ذكي بالدقائق للساعات المتبقية</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>الساعات المتاحة:</label>
            <input
              type="number"
              min="1"
              max="12"
              className="input-field tabular"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>موعد النوم المستهدف:</label>
            <input
              type="text"
              className="input-field tabular"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>مستوى التركيز:</label>
            <select className="input-field" value={focusLevel} onChange={(e) => setFocusLevel(e.target.value)}>
              <option value="عالي جداً">عالي جداً</option>
              <option value="متوسط">متوسط</option>
              <option value="استثنائي">استثنائي</option>
            </select>
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 14 }}
          onClick={() => onGenerate(hours, bedtime, focusLevel)}
          disabled={isLoading}
        >
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={14} className="animate-spin" />
              <span>جاري الحساب والتوزيع بالدقائق...</span>
            </div>
          ) : (
            <span>توليد وتوزيع الجدول الذكي</span>
          )}
        </button>

        {generatedSchedule && (
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            fontSize: 13,
            lineHeight: 1.8,
            color: 'var(--text-main)',
            maxHeight: 280,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {generatedSchedule}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  );
};

// ================= INTERROGATION MODAL =================
interface InterrogationModalProps {
  isOpen: boolean;
  onClose: () => void;
  interrogationText: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  onSpeak: (text: string) => void;
  onStartEmergencyFocus: (subjId: string) => void;
  undoneLecturesCount: number;
  backlogTasksCount: number;
  lowExamsCount: number;
}

export const InterrogationModal: React.FC<InterrogationModalProps> = ({
  isOpen,
  onClose,
  interrogationText,
  isLoading,
  onRefresh,
  onSpeak,
  onStartEmergencyFocus,
  undoneLecturesCount,
  backlogTasksCount,
  lowExamsCount
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
            <span>جلسة استجواب ومساءلة المتراكمات الصريحة</span>
          </div>
          <button className="btn btn-sm" onClick={onRefresh} disabled={isLoading} style={{ fontSize: 11 }}>
            <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'قيد الفحص...' : 'إعادة الفحص'}</span>
          </button>
        </div>

        {/* Backlog Quick Counters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          <div style={{ background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: 8, textAlign: 'center', border: '1px solid rgba(239, 83, 80, 0.25)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>محاضرات مؤجلة</div>
            <div className="tabular" style={{ fontSize: 18, fontWeight: 800, color: 'var(--danger)' }}>
              {undoneLecturesCount} محاضرة
            </div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: 8, textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>مهام معلقة</div>
            <div className="tabular" style={{ fontSize: 18, fontWeight: 800, color: 'var(--warning)' }}>
              {backlogTasksCount} مهمة
            </div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: 8, textAlign: 'center', border: '1px solid rgba(167, 139, 250, 0.25)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>امتحانات دون الـ 95%</div>
            <div className="tabular" style={{ fontSize: 18, fontWeight: 800, color: '#a78bfa' }}>
              {lowExamsCount} امتحان
            </div>
          </div>
        </div>

        {/* AI Interrogation Text Box */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid rgba(239, 83, 80, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          fontSize: 13,
          lineHeight: 1.8,
          color: 'var(--text-main)',
          maxHeight: 340,
          overflowY: 'auto',
          whiteSpace: 'pre-wrap'
        }}>
          {isLoading
            ? 'المراقب يفحص كشوفات محاضراتك ومهامك المسجلة وامتحاناتك ليواجهك بأسئلة دقيقة...'
            : (interrogationText || 'اضغط زر إعادة الفحص لبدء المساءلة.')}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
          <button
            className="btn btn-sm btn-speak"
            onClick={() => interrogationText && onSpeak(interrogationText)}
            disabled={!interrogationText || isLoading}
          >
            <Volume2 size={13} />
            <span>استمع للمساءلة صوتياً</span>
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                onClose();
                onStartEmergencyFocus('physics');
              }}
            >
              <Zap size={13} />
              <span>بدء جلسة إنقاذ 50 دقيقة (فيزياء)</span>
            </button>
            <button className="btn btn-sm" onClick={onClose}>
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================= MANUAL SESSION MODAL =================
export interface ManualSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onSave: (data: { subjId: string; minutes: number; task: string; date?: string }) => void;
}

export const ManualSessionModal: React.FC<ManualSessionModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onSave
}) => {
  const [subjId, setSubjId] = useState(subjects[0]?.id || 'physics');
  const [minutes, setMinutes] = useState<number | ''>(50);
  const [task, setTask] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const quickMinutes = [25, 45, 50, 60, 90, 120];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = Number(minutes);
    if (!m || m <= 0) return;
    onSave({
      subjId,
      minutes: m,
      task: task.trim() || 'مذاكرة مركزة ومستقلة',
      date
    });
    onClose();
  };

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} style={{ color: 'var(--accent-primary)' }} />
          <span>تسجيل جلسة مذاكرة يدوية</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>المادة الدراسية:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 6 }}>
              {subjects.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  className={`btn btn-sm ${subjId === s.id ? 'btn-primary' : ''}`}
                  onClick={() => setSubjId(s.id)}
                  style={{
                    justifyContent: 'center',
                    fontWeight: 700,
                    borderColor: subjId === s.id ? s.color : 'var(--border-subtle)',
                    background: subjId === s.id ? s.color : 'var(--bg-elevated)',
                    color: subjId === s.id ? '#0b1212' : 'var(--text-main)'
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>مدة المذاكرة الصافية (بالدقائق):</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '6px 0 8px' }}>
              {quickMinutes.map((qm) => (
                <button
                  type="button"
                  key={qm}
                  className="btn btn-sm tabular"
                  onClick={() => setMinutes(qm)}
                  style={{
                    background: minutes === qm ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                    color: minutes === qm ? '#0b1212' : 'var(--text-main)',
                    fontWeight: 700
                  }}
                >
                  {qm} دقيقة
                </button>
              ))}
            </div>
            <input
              type="number"
              className="input-field tabular"
              min="1"
              max="600"
              required
              value={minutes}
              onChange={(e) => setMinutes(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
              placeholder="أدخل عدد الدقائق بالضبط..."
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>الدرس أو المهمة التي أنجزتها:</label>
            <input
              type="text"
              className="input-field"
              placeholder="مثال: حل شيت الفيزياء، أو واجب النحو، أو كلمات الوحدة..."
              value={task}
              onChange={(e) => setTask(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>تاريخ الجلسة:</label>
            <input
              type="date"
              className="input-field tabular"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-sm" onClick={onClose}>
              إلغاء
            </button>
            <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
              <CheckCircle2 size={14} />
              <span>حفظ الجلسة في السجل والعدادات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

