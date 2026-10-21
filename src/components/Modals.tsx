import React, { useState, useEffect } from 'react';
import { Subject, ExamRecord, WeeklyTask, Lecture } from '../types';

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
      <div style={{ fontSize: 44, marginBottom: 12 }}>☕</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>
        وقت الراحة الذكية (بومودورو)
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 440 }}>
        تنفس بعمق، تحرك قليلاً، اشرب ماءً، ولا تمسك بالهاتف حتى يعود عقلك في قمة صفائه!
      </p>
      <div className="break-clock tabular">{timeFormatted}</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-primary" onClick={onClose}>
          إنهاء الاستراحة والعودة للتركيز 🦁
        </button>
      </div>
    </div>
  );
};

// ================= EXAM MODAL =================
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
        <div className="modal-title">
          <span>📝 تسجيل نتيجة امتحان جديد</span>
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
                {calculatedPct}% {calculatedPct >= 95 ? '✅' : '⚠️'}
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
              💾 حفظ الامتحان وتحليل المراقب
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
          <div style={{ fontSize: 44 }}>{isHigh ? '🦁🏆' : '⚠️⚡'}</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: isHigh ? 'var(--success)' : 'var(--danger)', marginTop: 6 }}>
            {isHigh ? 'عاش يا بطل الأوائل! تقفيل مشرف!' : 'وقفة محاسبة فورية من المراقب الأكاديمي!'}
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
          lineHeight: 1.7,
          color: 'var(--text-main)',
          whiteSpace: 'pre-wrap'
        }}>
          {reactionText || 'جاري استدعاء تعليق المراقب...'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
          <button className="btn btn-sm btn-speak" onClick={onSpeak}>
            <span>🔊 استمع لرد المراقب</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            فهمت ومستمر في المذاكرة ⚡
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
        <div className="modal-title">
          <span>➕ إضافة مهمة جديدة للجدول الأسبوعي</span>
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
              <option value="normal">عادي (Normal)</option>
              <option value="high">هام ومطلوب (High)</option>
              <option value="urgent">عاجل جداً (Urgent)</option>
              <option value="class">موعد حصة / سنتر (Class)</option>
              <option value="exam">امتحان أو كويز (Exam)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn btn-primary">➕ إضافة المهمة</button>
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
  const [packageName, setPackageName] = useState('باقة الفيزياء (الثلاث شهور الأولى)');
  const [tag, setTag] = useState('اشترك الآن');

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
        <div className="modal-title">
          <span>📚 إضافة محاضرة منصة أو سنتر</span>
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
            <button type="submit" className="btn btn-primary">💾 إضافة المحاضرة</button>
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
        <div className="modal-title">
          <span>⏳ تسجيل إعفاء وقت (دروس سنتر / مدرسة / نوم)</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>سبب الإعفاء:</label>
            <input
              type="text"
              className="input-field"
              placeholder="مثال: سنتر التاريخ بالفشن، المدرسة، مشوار عائلي..."
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
            <button type="submit" className="btn btn-primary">💾 حفظ الإعفاء</button>
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
        <div className="modal-title">
          <span>⏱️ توليد جدول ذكي بالدقائق للساعات المتبقية</span>
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
              <option value="عالي جداً">عالي جداً 🔥</option>
              <option value="متوسط">متوسط 🌿</option>
              <option value="استثنائي">استثنائي 🦁</option>
            </select>
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 14 }}
          onClick={() => onGenerate(hours, bedtime, focusLevel)}
          disabled={isLoading}
        >
          {isLoading ? '⏳ جاري الحساب والتوزيع بالدقائق...' : '⚡ توليد وتوزيع الجدول الذكي'}
        </button>

        {generatedSchedule && (
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            fontSize: 13,
            lineHeight: 1.7,
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
