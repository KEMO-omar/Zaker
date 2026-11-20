import express from 'express';
import path from 'path';
import fs from 'fs';
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

import { GoogleGenAI } from '@google/genai';
import {
  computeLiveStudySnapshot,
  buildComprehensiveReport,
  buildBacklogInterrogationReport,
  buildExamsDiagnosticReport,
  buildDynamicExamReaction,
  buildDynamicTimeBlockSchedule,
  buildSupervisorChatAnswer,
  LiveStudySnapshot
} from './src/services/reportEngine';

function loadServerDbData(): any {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      return parsed?.data || {};
    }
  } catch (e) {}
  return {};
}

// Initialize Gemini Client only if valid API key format is present
const RAW_GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const hasValidGeminiKey = Boolean(RAW_GEMINI_KEY && RAW_GEMINI_KEY.startsWith('AIza') && RAW_GEMINI_KEY.length > 20);

let aiClient: GoogleGenAI | null = null;
if (hasValidGeminiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey: RAW_GEMINI_KEY });
  } catch {
    aiClient = null;
  }
}

async function callGeminiTextOnly(promptText: string): Promise<string | null> {
  if (aiClient) {
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    for (const modelName of modelsToTry) {
      try {
        const response = await aiClient.models.generateContent({
          model: modelName,
          contents: promptText
        });
        const text = response.text;
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } catch {
        // Quiet fallback to dynamic engine
      }
    }
  }
  return null;
}

function buildServerSnapshotFromPayload(payload?: any): LiveStudySnapshot {
  const dbData = loadServerDbData();
  const snapFromPayload = payload?.snapshot;
  if (snapFromPayload && Array.isArray(snapFromPayload.subjectStudies) && Array.isArray(snapFromPayload.subjectExams)) {
    // Re-anchor inactivity label cleanly using live clock on server if lastSessionTs exists
    return snapFromPayload as LiveStudySnapshot;
  }

  return computeLiveStudySnapshot({
    sessions: Array.isArray(payload?.sessions) ? payload.sessions : (dbData.sessions || []),
    subjects: Array.isArray(payload?.subjects) && payload.subjects.length >= 4
      ? payload.subjects
      : (Array.isArray(dbData.subjects) && dbData.subjects.length >= 4 ? dbData.subjects : DEFAULT_SERVER_SUBJECTS),
    exemptions: Array.isArray(payload?.exemptions) ? payload.exemptions : (dbData.exemptions || []),
    exams: Array.isArray(payload?.exams) ? payload.exams : (dbData.exams || []),
    weeklyTasks: Array.isArray(payload?.weeklyTasks) ? payload.weeklyTasks : (dbData.weeklyTasks || []),
    completedTaskIds: Array.isArray(payload?.completedTaskIds) ? payload.completedTaskIds : (dbData.completedTaskIds || []),
    lectures: Array.isArray(payload?.lectures) ? payload.lectures : (dbData.lectures || [])
  });
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

// DEFAULT SUBJECTS WITH NOTEBOOKLM LINKS
const DEFAULT_SERVER_SUBJECTS = [
  {
    id: 'history',
    name: 'تاريخ',
    color: '#10b981',
    targetMinutes: 120,
    icon: 'book-open',
    notebookUrl: 'https://notebook.google.com/notebook/53915592-d0da-4e14-b9cf-fe7959189d34'
  },
  {
    id: 'arabic',
    name: 'لغة عربية',
    color: '#f59e0b',
    targetMinutes: 150,
    icon: 'feather',
    notebookUrl: 'https://notebook.google.com/notebook/31a885de-d1e6-4a7a-8782-56652ad528d5'
  },
  {
    id: 'english',
    name: 'لغة إنجليزية',
    color: '#38bdf8',
    targetMinutes: 90,
    icon: 'globe',
    notebookUrl: 'https://notebook.google.com/notebook/66252a85-8af2-4478-830f-90c32838e905'
  },
  {
    id: 'physics',
    name: 'فيزياء',
    color: '#818cf8',
    targetMinutes: 180,
    icon: 'atom',
    notebookUrl: 'https://notebook.google.com/notebook/95907ec1-8d37-4598-bdb0-0d47d9cd4af0'
  }
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
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${FIREBASE_RTDB_URL}.json`, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    // Non-blocking fallback to local database
  }
  return null;
}

async function pushToFirebaseRTDB(data: any) {
  try {
    const examsObj: any = {};
    toArray(data.exams).forEach((e: any) => { if (e && e.id) examsObj[e.id] = e; });

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

    await Promise.allSettled([
      fetch(`${FIREBASE_RTDB_URL}/exams.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(examsObj) }),
      fetch(`${FIREBASE_RTDB_URL}/weeklyTasks.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toArray(data.weeklyTasks)) }),
      fetch(`${FIREBASE_RTDB_URL}/completedTaskIds.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toArray(data.completedTaskIds)) }),
      fetch(`${FIREBASE_RTDB_URL}/lectures.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toArray(data.lectures)) }),
      fetch(`${FIREBASE_RTDB_URL}/sessions.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sessionsObj) }),
      fetch(`${FIREBASE_RTDB_URL}/exemptions.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(exemptionsObj) }),
      fetch(`${FIREBASE_RTDB_URL}/subjects.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toArray(data.subjects)) }),
      fetch(`${FIREBASE_RTDB_URL}/customAiInstructions.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data.customAiInstructions || '') }),
      fetch(`${FIREBASE_RTDB_URL}/lastUpdated.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Date.now()) })
    ]);
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
        const localLastUpdated = Number(currentDb.lastUpdated || 0);
        const fbLastUpdated = Number(fbData.lastUpdated || 0);
        const localExams = toArray(prevData.exams);
        const fbExams = toArray(fbData.exams);

        if (fbLastUpdated > localLastUpdated || localExams.length === 0) {
          const examMap = new Map();
          localExams.forEach(e => { if (e && e.id) examMap.set(String(e.id), e); });
          fbExams.forEach(e => { if (e && e.id) examMap.set(String(e.id), e); });
          prevData.exams = Array.from(examMap.values()).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        } else {
          // Local database is newer or equal: preserve local edits & deletions while filling only missing records if local was partial
          const examMap = new Map();
          localExams.forEach(e => { if (e && e.id) examMap.set(String(e.id), e); });
          prevData.exams = Array.from(examMap.values()).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        }
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

    const mergedExams = Array.isArray(incomingData.exams)
      ? incomingData.exams.map((ex: any) => {
          const parsedScore = Number(ex.score);
          const parsedTotal = Number(ex.total);
          const score = Number.isFinite(parsedScore) ? parsedScore : 0;
          const total = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : 50;
          const pct = ex.pct !== undefined && Number.isFinite(Number(ex.pct))
            ? Number(ex.pct)
            : Math.round((score / total) * 100);
          return {
            id: ex.id || `exam_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            subjId: ex.subjId || 'physics',
            teacher: ex.teacher || 'أستاذ المادة',
            topic: ex.topic || 'امتحان شامل',
            score: score,
            total: total,
            pct: pct,
            examType: ex.examType || 'امتحان شامل',
            date: ex.date || new Date().toISOString().split('T')[0],
            notes: ex.notes || '',
            certificateUrl: ex.certificateUrl || '',
            certificateImage: ex.certificateImage || '',
            certificateTitle: ex.certificateTitle || ''
          };
        }).sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      : (prevData.exams || []);

    const mergedTasks = Array.isArray(incomingData.weeklyTasks)
      ? incomingData.weeklyTasks
      : (prevData.weeklyTasks || []);

    const mergedCompleted = Array.isArray(incomingData.completedTaskIds)
      ? incomingData.completedTaskIds
      : (prevData.completedTaskIds || []);

    const mergedSessions = Array.isArray(incomingData.sessions)
      ? incomingData.sessions.sort((a: any, b: any) => (b.tsStart || 0) - (a.tsStart || 0))
      : (prevData.sessions || []);

    const mergedExemptions = Array.isArray(incomingData.exemptions)
      ? incomingData.exemptions
      : (prevData.exemptions || []);

    const mergedLectures = Array.isArray(incomingData.lectures)
      ? incomingData.lectures
      : (prevData.lectures || []);

    const mergedInstructions = (incomingData.customAiInstructions !== undefined)
      ? incomingData.customAiInstructions
      : (prevData.customAiInstructions || '');

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

// GET /api/db/active-session
app.get('/api/db/active-session', async (req, res) => {
  try {
    let currentDb = { version: 1, lastUpdated: Date.now(), data: {} as any };
    if (fs.existsSync(DB_FILE)) {
      try {
        currentDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } catch (e) {}
    }
    const activeSession = currentDb.data?.activeSession || null;
    res.json({ success: true, activeSession });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/db/active-session
app.post('/api/db/active-session', async (req, res) => {
  try {
    const active = req.body;
    let currentDb = { version: 1, lastUpdated: Date.now(), data: {} as any };
    if (fs.existsSync(DB_FILE)) {
      try {
        currentDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } catch (e) {}
    }
    if (!currentDb.data) currentDb.data = {};
    currentDb.data.activeSession = active;
    fs.writeFileSync(DB_FILE, JSON.stringify(currentDb, null, 2), 'utf-8');

    // Push to Firebase RTDB activeSession
    try {
      fetch(`${FIREBASE_RTDB_URL}/activeSession.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(active)
      }).catch(() => {});
    } catch (e) {}

    res.json({ success: true, activeSession: active });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/db/active-session
app.delete('/api/db/active-session', async (req, res) => {
  try {
    let currentDb = { version: 1, lastUpdated: Date.now(), data: {} as any };
    if (fs.existsSync(DB_FILE)) {
      try {
        currentDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } catch (e) {}
    }
    if (currentDb.data) {
      currentDb.data.activeSession = null;
      fs.writeFileSync(DB_FILE, JSON.stringify(currentDb, null, 2), 'utf-8');
    }

    // Delete from Firebase RTDB activeSession
    try {
      fetch(`${FIREBASE_RTDB_URL}/activeSession.json`, {
        method: 'DELETE'
      }).catch(() => {});
    } catch (e) {}

    res.json({ success: true, activeSession: null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI System Prompt & Academic Supervisor
const KAREEM_BASE_SYSTEM_PROMPT = `أنت "المراقب الأكاديمي الحصري وكوتش الضمير القاسي والناصح الأمين" للطالب "كريم عمر سيد".
بيانات الطالب وسياقه الحاسم:
- الطالب: كريم عمر سيد - الصف الثاني الثانوي (مسار علمي علوم)، من سدس / الفشن بمحافظة بني سويف.
- الهدف الأسمى: أوائل الجمهورية في الثانوية العامة والالتحاق بكلية الطب البشري (المنافسة بالثانية والدرجة، ومجموع 2ث + 3ث متكامل).
- القاعدة الذهبية للامتحانات: 95% هو الحد الأدنى الإلزامي، وأي نزول عنها جرس إنذار لا يقبل التبرير، والمستهدف 100%.
- المواد الأربعة ومدرسوها المعتمدون:
  1) لغة عربية: أ. تقوى مرزوق (سنتر: سبت وثلاثاء 4:00 م) & أ. محمد صلاح (منصة: سبت وثلاثاء).
  2) فيزياء: أ. محمد عبد المعبود (منصة: أحد وأربعاء).
  3) لغة إنجليزية: أ. أيمن عبد العاطي (سنتر: سبت وثلاثاء 7:00 م).
  4) تاريخ: أ. أحمد سمير (منصة/سنتر: إثنين وخميس 1:00 ظ).
- أسلوب الخطاب الإجباري ("كلام يطلع من النافوخ"):
  • لا تكتفِ بسرد الأرقام أو الكلام البارد المجامِل أبداً! اربط كل رقم ومركم بضميره وحلم كلية الطب وتعب أهله في سدس/الفشن والوقت اللي بيجري.
  • زوّد حدة الكلام وقوته طردياً مع الواقع: كلما زادت ساعات الانقطاع أو الساعات الضائعة أو المحاضرات المتروكة أو نزلت الدرجات عن 95%، تكون نبرتك أشد، أجرأ، وتهز ضميره بصدق يوجع ويفوّق من الغفلة، ولو ملتزم ومنضبط فخّمه بشرف وحذّره من الغرور أو التراخي.
- قاعدة صارمة: اعتمد حصراً على الأرقام والأسماء والدرجات والمحاضرات المرسلة لك في بيانات الجلسة الحية أدناه. لا تخترع ولا تكرر أرقاماً قديمة أبداً.`;

function getKareemSystemPrompt(customInstructions?: string) {
  let instructionsText = customInstructions;
  if (!instructionsText && fs.existsSync(DB_FILE)) {
    try {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      instructionsText = db?.data?.customAiInstructions;
    } catch(e) {}
  }
  const effectiveDirectives = instructionsText || "متطبطبش عليا لما أقصّر! راقب كل دقيقة بضيعها وكل محاضرة سبتها، وهزّ ضميري بكلام حاد ومؤثر يطلع من النافوخ، مع الحفاظ على دور كل تقرير مستقل بالأرقام الحقيقية اللحظية.";

  return `${KAREEM_BASE_SYSTEM_PROMPT}

⚡ تعليمات وقواعد كريم الصريحة:
"${effectiveDirectives}"`;
}

// POST /api/ai/monitor -> Role 1: Comprehensive Performance, Time Discipline & Plan Overview
app.post('/api/ai/monitor', async (req, res) => {
  try {
    const { studyData, customInstructions } = req.body || {};
    const snap = buildServerSnapshotFromPayload(studyData || {});
    const systemPrompt = getKareemSystemPrompt(customInstructions);

    const userPrompt = `دورك الآن: كتابة "التقرير الشامل للتوازن الزمني والأداء العام" (بأسلوب استراتيجي هزّاز للضمير — يركز على الانضباط الزمني وتوازن المواد ونسب الإنجاز، مع رسالة ضمير موجعة ومؤثرة تناسب حالته الحالية، ومختلف تماماً عن جلسة استجواب المتراكمات وعن تقرير الامتحانات).
البيانات الحية الفعلية الآن (${snap.generatedAtLabel}):
- آخر جلسة مذاكرة: ${snap.inactivityLabel}
- مذاكرة اليوم (${snap.todayDayName}): ${snap.todayStudyHours}h | الأسبوع: ${snap.weekStudyHours}h | الفاقد اليوم: ${snap.wastedHours}h
- توزيع المواد: ${JSON.stringify(snap.subjectStudies.map((s) => ({ name: s.subjName, totalHours: s.totalHours, weekMins: s.weekMinutes, pendingLectures: s.pendingLecturesCount })))}
- جدول الأسبوع: ${snap.doneTasks}/${snap.totalTasks} (${snap.tasksCompletionPct}%) | مهام اليوم المتبقية: ${snap.todayPendingTasks.map((t) => t.text).join(' | ') || 'لا يوجد'}
- المحاضرات الكلية: ${snap.doneLectures}/${snap.totalLectures} (${snap.lecturesCompletionPct}%)
- مؤشر الامتحانات العام: ${snap.examsAvgPct}% عبر ${snap.examsCount} امتحانات.

اكتب التقرير الشامل باللهجة المصرية القوية والفصحى المنضبطة بأقسام واضحة (كلمة الضمير التي توجع وتفوّق، مؤشرات الوقت والفاقد، توازن المواد، وضع الخطة، الخلاصة والقرار الفوري) باستخدام هذه الأرقام الحقيقية فقط وبلا مجاملة باردة.`;

    const geminiReply = await callGeminiTextOnly(`${systemPrompt}\n\n${userPrompt}`);
    const analysisText = geminiReply || buildComprehensiveReport(snap);
    res.json({ success: true, fromCache: false, analysis: analysisText });
  } catch (err: any) {
    console.error('AI Monitor error:', err);
    res.status(500).json({ success: false, error: err.message || 'فشل استدعاء التقرير الشامل' });
  }
});

// POST /api/ai/interrogate -> Role 2: Direct Backlog & Procrastination Interrogation
app.post('/api/ai/interrogate', async (req, res) => {
  try {
    const { backlogData, customInstructions } = req.body || {};
    const snap = buildServerSnapshotFromPayload(backlogData || {});
    const systemPrompt = getKareemSystemPrompt(customInstructions);

    const prompt = `${systemPrompt}

دورك الآن: إدارة "جلسة محاكمة واستجواب عسكري للمتراكمات" (أسلوب حاد ولاذع ومؤثر يطلع من النافوخ — لا تسرد المتروكات ببرود أبداً، واجعل كريم يواجه ثمن كل تأجيل على مستقبله!).
ركز على محاكمة المتروكات الحقيقية الموجودة الآن:
- مدة الانقطاع عن المذاكرة: ${snap.inactivityLabel}
- محاضرات المنصات المتروكة (${snap.undonePlatformLectures.length}): ${JSON.stringify(snap.undonePlatformLectures.slice(0, 10).map((l) => l.title))}
- حصص السناتر المتروكة (${snap.undoneCenterLectures.length}): ${JSON.stringify(snap.undoneCenterLectures.slice(0, 10).map((l) => l.title))}
- مهام الجدول المعلقة الآن: ${JSON.stringify((snap.todayPendingTasks.length ? snap.todayPendingTasks : snap.urgentPendingTasks).slice(0, 8).map((t) => t.text))}
- الامتحانات التي نزلت عن 95%: ${JSON.stringify(snap.examsBelow95.map((e) => ({ topic: e.topic, score: `${e.score}/${e.total}`, notes: e.notes })))}

المطلوب:
1. كلمة افتتحية حادة توقظ ضميره على الفاقد الحقيقي وتعب أهله وثمن المماطلة.
2. كشف المتروكات مصنفاً (منصة مقابل سنتر) لكل مادة مع تعليق قاسٍ وصادق على كل تراكم.
3. مواجهة بالمهام المعلقة والثغرات <95% ومدة الانقطاع.
4. توجيه 3 أسئلة محاكمة قاسية ومباشرة على أكثر مادة متراكمة (${snap.prioritySubjectName}) وحكم تنفيذي لا يقبل التأجيل.`;

    const geminiReply = await callGeminiTextOnly(prompt);
    const responseText = geminiReply || buildBacklogInterrogationReport(snap);
    res.json({ success: true, interrogation: responseText });
  } catch (err: any) {
    console.error('AI Interrogate error:', err);
    res.status(500).json({ success: false, error: err.message || 'فشل استدعاء جلسة المساءلة' });
  }
});

// POST /api/ai/exam-reaction -> Instant Per-Exam & Trend Reaction
app.post('/api/ai/exam-reaction', async (req, res) => {
  try {
    const { exam, sameSubjHistory, subjStudyHours, allExamsCount, customInstructions } = req.body || {};
    if (!exam) {
      return res.status(400).json({ success: false, error: 'بيانات الامتحان مطلوبة' });
    }

    const dbData = loadServerDbData();
    const allExams = Array.isArray(dbData.exams) ? dbData.exams : [];
    const subjectsList = Array.isArray(dbData.subjects) && dbData.subjects.length >= 4 ? dbData.subjects : DEFAULT_SERVER_SUBJECTS;
    const subjName = exam.subjName || subjectsList.find((s: any) => s.id === exam.subjId)?.name || exam.subjId;

    const { reaction: dynamicReaction, pct } = buildDynamicExamReaction(
      exam,
      allExams,
      subjName,
      String(subjStudyHours || '0.0')
    );

    const score = Number(exam.score) || 0;
    const total = Number(exam.total) || 50;
    const lostPoints = Math.max(total - score, 0);

    const systemPrompt = getKareemSystemPrompt(customInstructions);
    const prompt = `${systemPrompt}

سجل كريم للتو نتيجة امتحان جديد:
- المادة: ${subjName}
- المدرس: ${exam.teacher || 'أستاذ المادة'}
- موضوع الامتحان: ${exam.topic || 'اختبار'}
- الدرجة: ${score}/${total} (${pct}%) | الفاقد: ${lostPoints} درجة
- الملاحظات المسجلة: ${exam.notes || 'لا توجد'}
- ساعات مذاكرة كريم المسجلة لهذه المادة: ${subjStudyHours || '0.0'}h
- سجل الامتحانات السابقة في نفس المادة (${subjName}): ${JSON.stringify(sameSubjHistory || [])}
- إجمالي الامتحانات المسجلة: ${allExamsCount || allExams.length}

المطلوب: رد مخصص ومؤثر للغاية لهذه المادة وهذه الدرجة تحديداً، مع مقارنة واضحة بالتطور أو الهبوط عن الامتحان السابق في نفس المادة إن وجد. لو أقل من 95% اضرب جرس إنذار قاسياً يطلع من النافوخ على الدرجات الضايعة وتأثيرها على حلم الطب، ولو 95%+ احمِه من الغرور وادفعه للـ 100%.`;

    const geminiReply = await callGeminiTextOnly(prompt);
    res.json({ success: true, reaction: geminiReply || dynamicReaction, pct });
  } catch (err: any) {
    console.error('AI Exam Reaction error:', err);
    res.status(500).json({ success: false, error: err.message || 'فشل تحليل الامتحان' });
  }
});

// POST /api/ai/schedule -> Dynamic Remaining-Hours Time Blocking
app.post('/api/ai/schedule', async (req, res) => {
  try {
    const { availableHours, bedtime, focusLevel, snapshot, customInstructions } = req.body || {};
    const snap = buildServerSnapshotFromPayload({ snapshot });
    const systemPrompt = getKareemSystemPrompt(customInstructions);

    const prompt = `${systemPrompt}

دورك الآن: تقسيم الساعات المتبقية من اليوم (${snap.todayDayName}) إلى جولات بومودورو عملية مع رسالة تحفيزية حاسمة توقد العزيمة.
المعطيات الحية:
- الساعات المتاحة: ${availableHours || '4'} ساعات | موعد النوم: ${bedtime || '23:30'} | التركيز: ${focusLevel || 'عالي'}
- مذاكرة اليوم حتى الآن: ${snap.todayStudyHours}h | الفاقد: ${snap.wastedHours}h
- مهام اليوم المعلقة: ${JSON.stringify(snap.todayPendingTasks.map((t) => t.text))}
- أولويات المواد (حسب الأقل تغطية والأعلى تراكماً): ${JSON.stringify(snap.subjectStudies.map((s) => ({ subj: s.subjName, pendingLecs: s.pendingLecturesCount, hours: s.totalHours })))}

اصنع جدولاً زمنياً عملياً بجولات 50/10 يعطي الأولوية للمهام المعلقة اليوم ثم أضعف مادة/أعلى محاضرات متبقية، واختمه بكلمة قوية تمنعه من تضييع باقي اليوم.`;

    const geminiReply = await callGeminiTextOnly(prompt);
    const scheduleText = geminiReply || buildDynamicTimeBlockSchedule(snap, availableHours, bedtime, focusLevel);
    res.json({ success: true, fromCache: false, schedule: scheduleText });
  } catch (err: any) {
    console.error('AI Schedule error:', err);
    res.status(500).json({ success: false, error: err.message || 'فشل توليد جدول إدارة الوقت' });
  }
});

// POST /api/ai/exam-audit -> Role 3: Per-Subject & Per-Score Diagnostic Report
app.post('/api/ai/exam-audit', async (req, res) => {
  try {
    const { exams, snapshot, customInstructions } = req.body || {};
    if (!exams || !Array.isArray(exams)) {
      return res.status(400).json({ success: false, error: 'قائمة الامتحانات مطلوبة' });
    }

    const snap = buildServerSnapshotFromPayload({ snapshot, exams });
    const systemPrompt = getKareemSystemPrompt(customInstructions);

    const prompt = `${systemPrompt}

دورك الآن: إعداد "تقرير تشخيص الامتحانات المفصل حسب كل مادة وكل درجة" (مختلف عن التقرير الشامل ومختلف عن استجواب المحاضرات — تشريح حاد ومؤثر للدرجات المفقودة وثمن كل غلطة).
البيانات الحية لكل مادة:
${JSON.stringify(snap.subjectExams.map((se) => ({
      subj: se.subjName,
      examsCount: se.examsCount,
      avgPct: se.avgPct,
      latestPct: se.latestPct,
      deltaPct: se.deltaPct,
      totalLostMarks: se.totalLostMarks,
      band: se.band,
      notes: se.recordedNotes,
      exams: se.examsList.map((e) => ({ topic: e.topic, score: `${e.score}/${e.total}`, date: e.date }))
    })), null, 2)}

المطلوب:
- إفراد تشريح وتوصية مستقلة ومختلفة لكل مادة حسب درجتها وتطورها (تحسن +delta أو هبوط -delta) مقارنة بشرط الـ 95%، وربط كل مادة بساعات مذاكرتها الفعلية وملاحظات الأخطاء المسجلة فيها، وبلهجة صادقة وحاسمة تهز ضمير كريم على كل درجة تضيع وتبين له الخطة لرفعها لـ 100%.`;

    const geminiReply = await callGeminiTextOnly(prompt);
    const diagnosticText = geminiReply || buildExamsDiagnosticReport(snap);
    res.json({ success: true, fromCache: false, diagnostic: diagnosticText });
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

    const snap = buildServerSnapshotFromPayload(context || {});
    const systemPrompt = getKareemSystemPrompt(customInstructions);
    const prompt = `${systemPrompt}

السياق اللحظي الحقيقي للطالب كريم الآن:
- آخر جلسة: ${snap.inactivityLabel} | اليوم: ${snap.todayStudyHours}h | الأسبوع: ${snap.weekStudyHours}h | الفاقد اليوم: ${snap.wastedHours}h
- توزيع المواد: ${JSON.stringify(snap.subjectStudies.map((s) => ({ subj: s.subjName, h: s.totalHours, pendingLecs: s.pendingLecturesCount })))}
- متوسط الامتحانات: ${snap.examsAvgPct}% (${snap.examsCount} امتحانات)
- المهام المتبقية: ${snap.pendingTasksCount} | محاضرات غير منجزة: ${snap.undoneLecturesCount}

رسالة كريم:
"${message}"

أجب باللهجة المصرية الأصيلة المؤثرة القوية ("كلام يطلع من النافوخ" يهز الضمير ويواجهه بالحقيقة ولا يجامله، وبأرقام حقيقية فقط من السياق أعلاه). لو مريح أو منقطع أو مراكم شد عليه بقسوة المحب الخائف على مستقبله، ولو مجتهد شجّعه بفخر وحفّزه يحافظ على الصدارة.`;

    const geminiReply = await callGeminiTextOnly(prompt);
    const reply = geminiReply || buildSupervisorChatAnswer(message, snap);
    res.json({ success: true, reply });
  } catch (err: any) {
    console.error('AI Chat error:', err);
    res.status(500).json({ success: false, error: err.message || 'فشل الرد من المراقب' });
  }
});

// Mount Vite or dist
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.use(express.static(__dirname));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zaker React App listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
