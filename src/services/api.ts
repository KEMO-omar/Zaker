import { Subject, Session, Exemption, WeeklyTask, Lecture, ExamRecord } from '../types';

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'history', name: 'تاريخ', color: '#10b981', targetMinutes: 120, icon: 'book-open' },
  { id: 'arabic', name: 'لغة عربية', color: '#f59e0b', targetMinutes: 150, icon: 'feather' },
  { id: 'english', name: 'لغة إنجليزية', color: '#38bdf8', targetMinutes: 90, icon: 'globe' },
  { id: 'physics', name: 'فيزياء', color: '#818cf8', targetMinutes: 180, icon: 'atom' }
];

export async function fetchDbData(): Promise<any> {
  try {
    const res = await fetch('/api/db/sync');
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Sync] Offline or failed to fetch DB from server:', err);
  }
  return null;
}

export async function saveDbData(data: {
  sessions?: Session[];
  exemptions?: Exemption[];
  weeklyTasks?: WeeklyTask[];
  completedTaskIds?: (string | number)[];
  lectures?: Lecture[];
  exams?: ExamRecord[];
  subjects?: Subject[];
  customAiInstructions?: string;
  displayTimeMode?: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/db/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, clientTimestamp: Date.now() })
    });
    return res.ok;
  } catch (err) {
    console.warn('[Sync] Offline or failed to save DB to server:', err);
    return false;
  }
}

export async function callAiMonitor(studyData: any, customInstructions?: string, forceFresh = false): Promise<string> {
  try {
    const res = await fetch('/api/ai/monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studyData, customInstructions, forceFresh })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.analysis) return data.analysis;
    }
  } catch (err) {
    console.warn('[AI Monitor] Error calling monitor API:', err);
  }
  return `### ⚡ تقرير وملاحظات المراقب الأكاديمي الحصري (لكريم عمر)

> "يا كريم.. مجموع تانية ثانوي مدمج مع تالتة ثانوي، مفيش ثانية ولا درجة مسموح بتضييعها. حلم كلية الطب وأوائل الجمهورية بيتصنع في أيام المذاكرة الصعبة دي!"

### 📊 تشخيص الموقف اللحظي:
- **إدارة الوقت:** رادارك شغال على مدار الـ 24 ساعة؛ أي دقيقة تضيع في المشتتات بتتحسب عليك فاقد.
- **قاعدة الـ 95% الإلزامية:** أي امتحان ينزل عن 95% يعتبر خطاً أحمر ووقفة محاسبة فورية.
- **توجيه اليوم لموادك الأربعة:**
  1. **الفيزياء (أ. عبد المعبود):** حل مسائل كمية التحرك والمقذوفات والقوانين بيدك مرتين.
  2. **العربي (أ. محمد صلاح ومس تقوى):** تقفيل واجب المحاضرة والنحو والبلاغة قبل الميعاد.
  3. **التاريخ (أ. أحمد سمير):** ربط الأحداث وحل أسئلة الفهم العالي.
  4. **الإنجليزي (أ. أيمن عبد العاطي):** حفظ الكلمات أولاً بأول وقراءة نصوص الريدينج.

**القرار الآن:** اقفل أي تشتت، استعن بالله، وابدأ جلسة تركيز فورية لمدة 50 دقيقة! 🦁`;
}

export async function callAiExamReaction(exam: ExamRecord, currentAvg: number, customInstructions?: string): Promise<{ reaction: string; pct: number }> {
  try {
    const res = await fetch('/api/ai/exam-reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exam, currentAvg, customInstructions })
    });
    if (res.ok) {
      const data = await res.json();
      return { reaction: data.reaction, pct: data.pct };
    }
  } catch (err) {
    console.warn('[AI Exam Reaction] Error:', err);
  }
  const pct = Math.round((exam.score / exam.total) * 100);
  const reaction = pct >= 95
    ? `عاش يا بطل! درجتك ${exam.score} من ${exam.total} بنسبة ${pct}% ممتازة وعلى عهد الأوائل. استمر وراجع أي ملاحظة بسيطة!`
    : `يا كريم.. ليه نزلت عن الـ 95%؟! جبت ${exam.score} من ${exam.total} (${pct}%). الحد الأدنى للأوائل هو 95%، افتح الكشكول وشوف الدرجات ضاعت فين وصلحها حالاً!`;
  return { reaction, pct };
}

export async function callAiSchedule(params: {
  availableHours: string | number;
  bedtime: string;
  focusLevel: string;
  pendingTasks: any[];
  examStats: any;
  customInstructions?: string;
}): Promise<string> {
  try {
    const res = await fetch('/api/ai/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.schedule) return data.schedule;
    }
  } catch (err) {
    console.warn('[AI Schedule] Error:', err);
  }
  return `### ⏱️ جدول الساعات المتبقية المقترح لليوم:
1. 17:00 - 18:15 | فيزياء: حل مسائل المقذوفات وكمية التحرك.
2. 18:15 - 18:30 | راحة ذكية بومودورو.
3. 18:30 - 19:45 | عربي: مراجعة النحو وحل تدريبات الواجب.
4. 19:45 - 20:00 | راحة واستعداد.
5. 20:00 - 21:00 | إنجليزي: حفظ كلمات وقواعد الوحدة.`;
}

export async function callAiExamAudit(exams: ExamRecord[], customInstructions?: string): Promise<string> {
  try {
    const res = await fetch('/api/ai/exam-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exams, customInstructions })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.diagnostic) return data.diagnostic;
    }
  } catch (err) {
    console.warn('[AI Exam Audit] Error:', err);
  }
  return `### 📊 تشخيص الامتحانات الشامل:
- إجمالي الامتحانات المسجلة: ${exams.length}
- الالتزام بشرط الـ 95%: حافظ على مراجعة الأخطاء في كل امتحان فورياً.
- النصيحة الأساسية: ركز على تقفيل مسائل الفيزياء وقطع النحو العربي لضمان الـ 100%.`;
}

export async function callAiChat(message: string, context: any, customInstructions?: string): Promise<string> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context, customInstructions })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.reply) return data.reply;
    }
  } catch (err) {
    console.warn('[AI Chat] Error:', err);
  }
  return `يا كريم، أنا سامعك وشايف تعبك. المهم دلوقتي تركز في هدفك الأساسي وهو كليتك وحلمك. ابدأ المذاكرة فوراً وماتسمحش لأي حاجة تشتتك!`;
}

export async function fetchQuotes(): Promise<string[]> {
  try {
    const res = await fetch('/تحفيز.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {}
  return [
    'يا كريم، حلم كلية الطب وأوائل الجمهورية بيتصنع في الساعات الصعبة دي.',
    'مجموع تانية ثانوي مدمج مع تالتة، مفيش ثانية مسموح بتضييعها.',
    'استعن بالله ولا تعجز، البداية الصعبة تصنع النهاية العظيمة.',
    'الـ 95% هي الحد الأدنى، قفل الـ 100%!',
    'كل مسألة بتحلها بتثبت مكانك بين أوائل الجمهورية.'
  ];
}
