import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Middleware
app.use(express.json({ limit: '20mb' }));

// Database storage setup
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const DB_BAK = path.join(DATA_DIR, 'database.json.bak');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure database file exists
if (!fs.existsSync(DB_FILE)) {
  const initialDb = {
    version: 1,
    lastUpdated: Date.now(),
    data: {
      sessions: [],
      exemptions: [],
      weeklyTasks: null,
      completedTaskIds: [],
      lectures: null,
      exams: [],
      subjects: null,
      displayTimeMode: 'today'
    }
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
}

// In-Memory AI Cache with 1-Hour TTL to minimize API calls
const aiCache = new Map<string, { value: string; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCacheKey(prefix: string, data: any) {
  const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').substring(0, 16);
  return `${prefix}_${hash}`;
}

function getFromCache(key: string) {
  const item = aiCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    aiCache.delete(key);
    return null;
  }
  return item.value;
}

function setInCache(key: string, value: string) {
  aiCache.set(key, { value, timestamp: Date.now() });
  if (aiCache.size > 200) {
    const oldestKey = aiCache.keys().next().value;
    if (oldestKey) aiCache.delete(oldestKey);
  }
}

// Gemini AI Client & Direct API Caller with gemini-2.5-flash / gemini-2.5-pro / gemini-1.5-flash
const MODELS_TO_TRY = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'];

async function callGeminiAPI(promptText: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[AI Supervisor] No GEMINI_API_KEY provided; using local intelligence engine.');
    return generateLocalSupervisorResponse(promptText);
  }

  for (const model of MODELS_TO_TRY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'aistudio-build'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        }),
        signal: AbortSignal.timeout(12000)
      });

      if (res.ok) {
        const data: any = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } else {
        const errJson: any = await res.json().catch(() => ({}));
        console.warn(`[AI Supervisor] Model ${model} returned ${res.status}:`, errJson.error?.message || '');
      }
    } catch (err: any) {
      console.warn(`[AI Supervisor] Attempt with ${model} note:`, err.message);
    }
  }

  console.warn('[AI Supervisor] Using resilient local academic intelligence fallback due to temporary API unavailability');
  return generateLocalSupervisorResponse(promptText);
}

function generateLocalSupervisorResponse(promptText: string) {
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

// Explicit routing for quotes file with UTF-8 support
const quotesPath = path.join(__dirname, 'تحفيز.json');
app.get(['/تحفيز.json', encodeURI('/تحفيز.json')], (req, res) => {
  if (fs.existsSync(quotesPath)) {
    res.sendFile(quotesPath);
  } else {
    res.json([]);
  }
});

// DEFAULT SUBJECTS
const DEFAULT_SERVER_SUBJECTS = [
  { id: 'history', name: 'تاريخ', color: '#10b981', targetMinutes: 120, icon: 'book-open' },
  { id: 'arabic', name: 'لغة عربية', color: '#f59e0b', targetMinutes: 150, icon: 'feather' },
  { id: 'english', name: 'لغة إنجليزية', color: '#38bdf8', targetMinutes: 90, icon: 'globe' },
  { id: 'physics', name: 'فيزياء', color: '#818cf8', targetMinutes: 180, icon: 'atom' }
];

function toArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'object') return Object.values(val).filter(Boolean);
  return [];
}

function mergeItemLists(existingList: any[] = [], incomingList: any[] = [], keyFn: (item: any) => string | null) {
  const map = new Map<string, any>();
  toArray(existingList).forEach(item => {
    if (!item) return;
    const k = keyFn(item);
    if (k) map.set(String(k), item);
  });
  toArray(incomingList).forEach(item => {
    if (!item) return;
    const k = keyFn(item);
    if (k) {
      const prev = map.get(String(k));
      map.set(String(k), { ...(prev || {}), ...item });
    }
  });
  return Array.from(map.values());
}

const FIREBASE_RTDB_URL = 'https://shapap-13c58-default-rtdb.firebaseio.com/shapap';

async function pullFromFirebaseRTDB() {
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}.json`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn('[Firebase RTDB] Pull warning:', err.message);
  }
  return null;
}

async function pushToFirebaseRTDB(data: any) {
  try {
    const examsObj: any = {};
    toArray(data.exams).forEach((e: any) => { if (e && e.id) examsObj[e.id] = e; });

    const tasksObj: any = {};
    toArray(data.weeklyTasks).forEach((t: any) => { if (t && (t.id !== undefined)) tasksObj[t.id] = t; });

    const lecturesObj: any = {};
    toArray(data.lectures).forEach((l: any) => { if (l && l.id) lecturesObj[l.id] = l; });

    const sessionsObj: any = {};
    toArray(data.sessions).forEach((s: any) => {
      const k = s.fbKey || s.id || (s.tsStart ? `ts_${s.tsStart}` : null);
      if (k) sessionsObj[k] = s;
    });

    const exemptionsObj: any = {};
    toArray(data.exemptions).forEach((x: any) => {
      const k = x.fbKey || x.id || (x.timestamp ? `exm_${x.timestamp}` : null);
      if (k) exemptionsObj[k] = x;
    });

    const payload = {
      exams: examsObj,
      weeklyTasks: toArray(data.weeklyTasks),
      completedTaskIds: toArray(data.completedTaskIds),
      lectures: lecturesObj,
      sessions: sessionsObj,
      exemptions: exemptionsObj,
      customAiInstructions: data.customAiInstructions || '',
      subjects: toArray(data.subjects),
      lastUpdated: Date.now()
    };

    await fetch(`${FIREBASE_RTDB_URL}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err: any) {
    console.warn('[Firebase RTDB] Push warning:', err.message);
  }
}

// GET /api/db/sync
app.get('/api/db/sync', async (req, res) => {
  try {
    let currentDb = { version: 1, lastUpdated: Date.now(), data: {} as any };
    if (fs.existsSync(DB_FILE)) {
      try {
        currentDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } catch (e) {}
    }

    const fbData: any = await pullFromFirebaseRTDB();
    if (fbData) {
      const prevData = currentDb.data || {};

      if (fbData.sessions) {
        const sessMap = new Map();
        toArray(prevData.sessions).forEach(s => sessMap.set(s.id || s.fbKey || s.tsStart, s));
        toArray(fbData.sessions).forEach(v => {
          if (v) {
            const k = v.id || v.fbKey || (v.tsStart ? `ts_${v.tsStart}` : null);
            if (k) sessMap.set(String(k), v);
          }
        });
        prevData.sessions = Array.from(sessMap.values()).sort((a,b) => (b.tsStart||0) - (a.tsStart||0));
      }

      if (fbData.exemptions) {
        const exmMap = new Map();
        toArray(prevData.exemptions).forEach(x => exmMap.set(x.id || x.fbKey, x));
        toArray(fbData.exemptions).forEach(v => {
          if (v) {
            const k = v.id || v.fbKey || (v.timestamp ? `exm_${v.timestamp}` : null);
            if (k) exmMap.set(String(k), v);
          }
        });
        prevData.exemptions = Array.from(exmMap.values()).sort((a,b) => (b.timestamp||0) - (a.timestamp||0));
      }

      if (fbData.weeklyTasks) {
        const taskMap = new Map();
        toArray(prevData.weeklyTasks).forEach(t => taskMap.set(String(t.id), t));
        toArray(fbData.weeklyTasks).forEach(t => {
          if (t && t.id !== undefined) taskMap.set(String(t.id), t);
        });
        prevData.weeklyTasks = Array.from(taskMap.values());
      }

      if (fbData.exams) {
        const examMap = new Map();
        toArray(prevData.exams).forEach(e => examMap.set(String(e.id), e));
        toArray(fbData.exams).forEach(e => {
          if (e && e.id) examMap.set(String(e.id), e);
        });
        prevData.exams = Array.from(examMap.values()).sort((a,b) => new Date(b.date||0).getTime() - new Date(a.date||0).getTime());
      }

      if (fbData.completedTaskIds) {
        prevData.completedTaskIds = Array.from(new Set([...toArray(prevData.completedTaskIds), ...toArray(fbData.completedTaskIds)]));
      }

      if (fbData.lectures) {
        const lecMap = new Map();
        toArray(prevData.lectures).forEach(l => lecMap.set(String(l.id), l));
        toArray(fbData.lectures).forEach(l => {
          if (l && l.id) lecMap.set(String(l.id), l);
        });
        prevData.lectures = Array.from(lecMap.values());
      }

      if (fbData.customAiInstructions) {
        prevData.customAiInstructions = fbData.customAiInstructions;
      }

      currentDb.data = prevData;
      fs.writeFileSync(DB_FILE, JSON.stringify(currentDb, null, 2), 'utf-8');
    }

    if (currentDb.data && (!Array.isArray(currentDb.data.subjects) || currentDb.data.subjects.length < 4)) {
      currentDb.data.subjects = DEFAULT_SERVER_SUBJECTS;
    }

    res.json({ success: true, ...currentDb });
  } catch (err) {
    console.error('Error reading database:', err);
    res.status(500).json({ success: false, error: 'فشل قراءة قاعدة البيانات' });
  }
});

// POST /api/db/sync
app.post('/api/db/sync', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, error: 'بيانات غير صالحة' });
    }

    const currentTimestamp = Date.now();
    let currentDb = { version: 1, lastUpdated: currentTimestamp, data: {} as any };

    if (fs.existsSync(DB_FILE)) {
      try {
        currentDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } catch (e) {
        console.warn('Recovering corrupted DB file...');
      }
    }

    const incomingData = payload.data || payload;
    const prevData = currentDb.data || {};

    const rawMergedExams = mergeItemLists(
      prevData.exams,
      incomingData.exams,
      (e) => e.id ? String(e.id) : `exam_${e.subjId}_${e.score}_${e.total}_${e.date || ''}`
    );

    const mergedExams = rawMergedExams.map(ex => {
      const score = Number(ex.score) || 0;
      const total = Number(ex.total) || 50;
      const pct = ex.pct !== undefined ? Number(ex.pct) : Math.round((score / total) * 100);
      return {
        id: ex.id || `exam_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        subjId: ex.subjId || 'physics',
        teacher: ex.teacher || (ex.subjId === 'physics' ? 'أ. محمد عبد المعبود (منصة أونلاين)' : ex.subjId === 'arabic' ? 'أ. محمد صلاح' : 'أستاذ المادة'),
        topic: ex.topic || 'امتحان شامل',
        score: score,
        total: total,
        pct: pct,
        examType: ex.examType || 'امتحان شامل',
        date: ex.date || new Date().toISOString().split('T')[0],
        notes: ex.notes || ''
      };
    }).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

    const mergedTasks = mergeItemLists(
      prevData.weeklyTasks,
      incomingData.weeklyTasks,
      (t) => (t.id !== undefined && t.id !== null) ? String(t.id) : `task_${t.dayId}_${t.text}`
    );

    const mergedCompleted = Array.from(new Set([
      ...(Array.isArray(prevData.completedTaskIds) ? prevData.completedTaskIds : []),
      ...(Array.isArray(incomingData.completedTaskIds) ? incomingData.completedTaskIds : [])
    ]));

    const mergedSessions = mergeItemLists(
      prevData.sessions,
      incomingData.sessions,
      (s) => s.id ? String(s.id) : (s.tsStart ? `ts_${s.tsStart}` : `sess_${s.subjId}_${s.minutes}_${s.date || ''}`)
    ).sort((a, b) => (b.tsStart || 0) - (a.tsStart || 0));

    const mergedExemptions = mergeItemLists(
      prevData.exemptions,
      incomingData.exemptions,
      (x) => x.id ? String(x.id) : `exm_${x.subjId}_${x.dayId}_${x.date || x.timestamp || ''}`
    );

    const mergedLectures = mergeItemLists(
      prevData.lectures,
      incomingData.lectures,
      (l) => l.id ? String(l.id) : `lec_${l.code}_${l.title}`
    );

    const mergedInstructions = (incomingData.customAiInstructions && incomingData.customAiInstructions.trim()) ||
      (prevData.customAiInstructions && prevData.customAiInstructions.trim()) ||
      '';

    const mergedSubjects = (Array.isArray(incomingData.subjects) && incomingData.subjects.length >= 4)
      ? incomingData.subjects
      : (Array.isArray(prevData.subjects) && prevData.subjects.length >= 4)
        ? prevData.subjects
        : DEFAULT_SERVER_SUBJECTS;

    const updatedData = {
      ...prevData,
      ...incomingData,
      subjects: mergedSubjects,
      exams: mergedExams,
      weeklyTasks: mergedTasks,
      completedTaskIds: mergedCompleted,
      sessions: mergedSessions,
      exemptions: mergedExemptions,
      lectures: mergedLectures,
      customAiInstructions: mergedInstructions
    };

    const newRecord = {
      version: (currentDb.version || 1) + 1,
      lastUpdated: currentTimestamp,
      clientTimestamp: payload.clientTimestamp || currentTimestamp,
      data: updatedData
    };

    if (fs.existsSync(DB_FILE)) {
      fs.copyFileSync(DB_FILE, DB_BAK);
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(newRecord, null, 2), 'utf-8');

    pushToFirebaseRTDB(updatedData).catch(err => console.warn('[Firebase RTDB] Async push error:', err.message));

    res.json({
      success: true,
      lastUpdated: newRecord.lastUpdated,
      version: newRecord.version,
      data: updatedData,
      message: 'تم دمج وحفظ كافة البيانات بنجاح ⚡'
    });
  } catch (err) {
    console.error('Error saving to database:', err);
    res.status(500).json({ success: false, error: 'فشل حفظ البيانات في قاعدة البيانات' });
  }
});

// AI System Prompt & Academic Supervisor
const KAREEM_BASE_SYSTEM_PROMPT = `أنت "المراقب الأكاديمي الحصري وخبير إدارة الوقت والمذاكرة" للطالب "كريم عمر سيد".
بيانات الطالب وسياقه الحاسم:
- الطالب: كريم عمر سيد - الصف الثاني الثانوي (تانية ثانوي مسار علمي علوم - طب وحياة)، من سدس / الفشن بمحافظة بني سويف.
- الهدف الأسمى: أوائل الجمهورية في الثانوية العامة والالتحاق بكلية الطب البشري.
- الأهمية القصوى: مجموع الصف الثاني الثانوي مدمج مع الصف الثالث الثانوي، هذه السنة مصيرية وحاسمة جداً ولا مجال لأي تهاون أو تفريط في أي ثانية أو أي درجة.
- المواد الأربعة المقررة فقط ومدرسيها وجدولها الأسبوعي:
  1) لغة عربية:
     - أ. محمد صلاح (منصة أونلاين): تنزل المحاضرة كل سبت، والحل والكويز كل ثلاثاء.
     - مس تقوى أحمد (سنتر): حضور سبت وثلاثاء الساعة 4:00 عصراً.
  2) فيزياء:
     - أ. محمد عبد المعبود (منصة أونلاين): تنزل المحاضرات كل أحد وأربعاء.
  3) لغة إنجليزية:
     - مستر أيمن عبد العاطي (سنتر): حضور إثنين وخميس الساعة 7:00 مساءً.
  4) تاريخ:
     - مستر أحمد سمير (سنتر الفشن): حضور إثنين وخميس الساعة 1:00 ظهراً.

قواعد المراقبة والمحاسبة الصارمة:
1. مراقبة الوقت والفاقد: راقب ساعات المذاكرة الصافية والوقت الضائع لحظة بلحظة. إذا ضيع وقتاً عاتبه بعتاب صادق ومؤثر يحرك ضميره. وإذا لم يذاكر شيئاً، اسأله بصدمة وعتاب: "مزاكرتش ليه ليه لحد دلوقتي يا كريم؟! الساعات بتضيع من حلمك وتعب أهلك!".
2. قاعدة الـ 95% الإلزامية في الامتحانات والكويزات:
   - إذا حصل على 100%: احتفل به كبطل وأسد للأوائل، وهنئه بفخر واعتزاز.
   - إذا كانت درجته بين 95% و 99%: بارك له بقوة وحثه على غلق النقص البسيط (1-5%) لتقفيل 100% في الامتحان القادم.
   - إذا نزلت درجته عن 95% (حتى لو 94% أو 90%): عاتبه بحزم واسأله: "ليه نزلت عن الـ 95% يا كريم؟! الـ 95% هي الحد الأدنى للأوائل! ضيعت درجات فين؟ تسرع ولا إهمال؟ افتح كشكول الملاحظات وراجع الغلطة فوراً!".
   - إذا نزلت الدرجة عن 80%: دق جرس إنذار أحمر طارئ ووقفة حاسمة.
3. التحدث بلهجة مصرية ذكية، وقورة، محفزة، حاسمة، وأخوية صادقة.`;

function getKareemSystemPrompt(customInstructions?: string) {
  let instructionsText = customInstructions;
  if (!instructionsText && fs.existsSync(DB_FILE)) {
    try {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      instructionsText = db?.data?.customAiInstructions;
    } catch(e) {}
  }
  const effectiveDirectives = instructionsText || "راقب الوقت اللي بذاكره والوقت اللي بضيعه وعاتبني وقولي كلام مؤثر جداً. في الامتحانات لو جبت درجة حلوة باركلي، ولو مقفلتش أو نزلت عن الـ 95% قولي ليه كده وعلى حسب الدرجة حاسبني، ولو ما ذاكرتش قولي ما ذاكرتش ليه ليه. ومودك يتغير على حسب مستواي وعدد الساعات اللي بذاكرها وعدد المهمات اللي عملتها.";

  return `${KAREEM_BASE_SYSTEM_PROMPT}

⚡ تعليمات وقواعد كريم الصريحة المباشرة للمراقب الأكاديمي (أوامر ملزمة بحرفيتها):
"${effectiveDirectives}"
(ملاحظة مهمة: نفذ كل حرف طلبه كريم في هذه التعليمات وطبقه على أسلوبك ونبرتك فوراً).`;
}

// POST /api/ai/monitor
app.post('/api/ai/monitor', async (req, res) => {
  try {
    const { studyData, forceFresh, customInstructions } = req.body || {};
    if (!studyData) {
      return res.status(400).json({ success: false, error: 'بيانات المذاكرة مطلوبة للتحليل' });
    }

    const cacheKey = getCacheKey('monitor', {
      tasksPending: studyData.pendingTasksCount,
      completedToday: studyData.completedTodayCount,
      examsCount: studyData.examsCount,
      todayStudyMins: Math.floor((studyData.todayStudyMins || 0) / 15),
      wastedMins: Math.floor((studyData.wastedMins || 0) / 15),
      customInst: customInstructions || ''
    });

    if (!forceFresh) {
      const cached = getFromCache(cacheKey);
      if (cached) {
        return res.json({ success: true, fromCache: true, analysis: cached });
      }
    }

    const userPrompt = `إليك سجل إنجازات وساعات المذاكرة الحالية للطالب كريم:
${JSON.stringify(studyData, null, 2)}

المطلوب منك كمراقب أكاديمي صارم ومحفز وفقاً لما حدده كريم:
1. قيّم حالته اليوم ومستوى استغلال الوقت ومقدار الوقت الضائع.
2. وجه عتاباً حاراً مؤثراً إذا كان هناك فاقد زمني كبير أو تأخر في المذاكرة، أو ثناءً وتشجيعاً إذا كان ملتزماً ومتقدماً.
3. راجع درجات امتحاناته وطبّق شرط الـ 95% بصرامة.
4. وزع الساعات المتبقية لليوم بجدول عملي مركز على مواده الأربعة (فيزياء، عربي، تاريخ، إنجليزي).
اجعل الرد منسقاً بأقسام وعناوين واضحة ولهجة مؤثرة.`;

    const systemPrompt = getKareemSystemPrompt(customInstructions);
    const analysisText = await callGeminiAPI(`${systemPrompt}\n\n${userPrompt}`);
    setInCache(cacheKey, analysisText);

    res.json({ success: true, fromCache: false, analysis: analysisText });
  } catch (err: any) {
    console.error('AI Monitor error:', err);
    res.status(500).json({ success: false, error: err.message || 'فشل استدعاء المراقب الذكي' });
  }
});

// POST /api/ai/exam-reaction
app.post('/api/ai/exam-reaction', async (req, res) => {
  try {
    const { exam, currentAvg, customInstructions } = req.body || {};
    if (!exam) {
      return res.status(400).json({ success: false, error: 'بيانات الامتحان مطلوبة' });
    }

    const score = Number(exam.score) || 0;
    const total = Number(exam.total) || 50;
    const pct = Math.round((score / total) * 100);
    const lostPoints = total - score;

    const systemPrompt = getKareemSystemPrompt(customInstructions);
    const prompt = `${systemPrompt}

سجل كريم للتو نتيجة امتحان جديد:
- المادة: ${exam.subjName || exam.subjId}
- المدرس / المكان: ${exam.teacher || 'الدرس'}
- موضوع الامتحان: ${exam.topic || 'اختبار'}
- الدرجة المحققة: ${score} من ${total} (النسبة: ${pct}%)
- الدرجات المفقودة: ${lostPoints} درجة
- الملاحظات: ${exam.notes || 'لا توجد'}
- المتوسط العام للامتحانات السابقة: ${currentAvg || pct}%

المطلوب:
رد عليه مباشرة كالمشرف الأكاديمي الصارم بكلام مؤثر في فقرة إلى فقرتين:
- إذا كانت النسبة 100%: ابتهج وهنئه بفخر كأحد أوائل الجمهورية.
- إذا كانت 95% إلى 99%: حيه على مستواه الممتاز وطالبه بقفل الدرجات القليلة الضائعة.
- إذا نزلت عن 95%: عاتبه بجدية واسأله بحزم: "ليه نزلت عن الـ 95% يا كريم؟! ضيعت درجات فين؟" ودعه يراجع أخطاءه فوراً.
- إذا كانت أقل من 80%: صدمة ومحاسبة قوية على هذا الإخفاق.`;

    const reactionText = await callGeminiAPI(prompt);
    res.json({ success: true, reaction: reactionText, pct });
  } catch (err: any) {
    console.error('AI Exam Reaction error:', err);
    res.status(500).json({ success: false, error: err.message || 'فشل تحليل الامتحان' });
  }
});

// POST /api/ai/schedule
app.post('/api/ai/schedule', async (req, res) => {
  try {
    const { availableHours, bedtime, focusLevel, pendingTasks, examStats, customInstructions } = req.body || {};

    const cacheKey = getCacheKey('schedule', {
      availableHours,
      bedtime,
      focusLevel,
      tasksLength: (pendingTasks || []).length,
      examAvg: examStats ? examStats.overallAvg : null,
      customInst: customInstructions || ''
    });

    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json({ success: true, fromCache: true, schedule: cached });
    }

    const systemPrompt = getKareemSystemPrompt(customInstructions);
    const prompt = `${systemPrompt}

المعطيات لتوليد جدول اليوم بالدقائق:
- الساعات المتاحة للمذاكرة اليوم: ${availableHours || '4'} ساعات
- موعد النوم المستهدف: ${bedtime || '23:30'}
- مستوى التركيز المطلوب: ${focusLevel || 'عالي'}
- المهام المعلقة: ${JSON.stringify(pendingTasks || [])}
- إحصائيات الامتحانات الأخيرة: ${JSON.stringify(examStats || {})}

المطلوب:
اصنع جدولاً زمنياً دقيقاً بالدقائق، يوزع الوقت بذكاء ويعطي الأولوية للمادة الأضعف والمهام الحرجة، مع فترات راحة بومودورو مدروسة. أجب بتنسيق منظم باللغة العربية.`;

    const scheduleText = await callGeminiAPI(prompt);
    setInCache(cacheKey, scheduleText);

    res.json({ success: true, fromCache: false, schedule: scheduleText });
  } catch (err: any) {
    console.error('AI Schedule error:', err);
    res.status(500).json({ success: false, error: err.message || 'فشل توليد جدول إدارة الوقت' });
  }
});

// POST /api/ai/exam-audit
app.post('/api/ai/exam-audit', async (req, res) => {
  try {
    const { exams, customInstructions } = req.body || {};
    if (!exams || !Array.isArray(exams)) {
      return res.status(400).json({ success: false, error: 'قائمة الامتحانات مطلوبة' });
    }

    const cacheKey = getCacheKey('exam_audit', { examsLength: exams.length, lastExam: exams[0], customInst: customInstructions || '' });
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json({ success: true, fromCache: true, diagnostic: cached });
    }

    const systemPrompt = getKareemSystemPrompt(customInstructions);
    const prompt = `${systemPrompt}

إليك سجل امتحانات كريم ودرجاته ونسبه المئوية:
${JSON.stringify(exams, null, 2)}

المطلوب:
1. تشخيص دقيق للدرجات ونسب النجاح في كل مادة ومقارنتها بشرط الـ 95%.
2. كشف الثغرات ونقاط النزيف التي يخسر فيها درجات.
3. خطة إنقاذ محددة لرفع النسبة المئوية في الامتحانات القادمة وتقفيل الـ 100%.`;

    const text = await callGeminiAPI(prompt);
    setInCache(cacheKey, text);

    res.json({ success: true, fromCache: false, diagnostic: text });
  } catch (err: any) {
    console.error('AI Exam Audit error:', err);
    res.status(500).json({ success: false, error: err.message || 'فشل تحليل الامتحانات' });
  }
});

// POST /api/ai/chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context, customInstructions } = req.body || {};
    if (!message) {
      return res.status(400).json({ success: false, error: 'الرسالة مطلوبة' });
    }

    const systemPrompt = getKareemSystemPrompt(customInstructions);
    const prompt = `${systemPrompt}

السياق الحالي للطالب كريم:
${JSON.stringify(context || {}, null, 2)}

سؤال أو رسالة كريم:
"${message}"

أجب كالمشرف الأكاديمي الصارم والمحب لكريم، باللغة العربية واللهجة المصرية الراقية، مع التركيز التام على إدارة الوقت، علاج التسويف، والحفاظ على التفوق والـ 95%+.`;

    const reply = await callGeminiAPI(prompt);
    res.json({ success: true, reply });
  } catch (err: any) {
    console.error('AI Chat error:', err);
    res.status(500).json({ success: false, error: err.message || 'فشل الرد من المراقب' });
  }
});

// Static assets from root (images, icons)
app.use(express.static(__dirname));

// Mount Vite or dist
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zaker React App listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
