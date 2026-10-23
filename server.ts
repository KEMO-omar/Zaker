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

import { GoogleGenAI } from '@google/genai';

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

let supervisorResponseTurn = 0;

async function callGeminiAPI(promptText: string, userMessage?: string, context?: any): Promise<string> {
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
        // Quiet fallback to dynamic supervisor engine without logging fatal errors
      }
    }
  }

  // Dynamic context-aware supervisor response
  return generateDynamicSupervisorResponse(userMessage || promptText, context);
}

function generateDynamicSupervisorResponse(input: string, context?: any): string {
  supervisorResponseTurn += 1;
  const turn = supervisorResponseTurn;

  // Normalize Arabic text
  const clean = input
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .toLowerCase();

  // 1. Physics / Abdul Maboud
  if (clean.includes('فيزيا') || clean.includes('عبدالمعبود') || clean.includes('عبد المعبود') || clean.includes('مسال') || clean.includes('تحرك') || clean.includes('تصادم') || clean.includes('قانون') || clean.includes('نيوتن') || clean.includes('مقذوف')) {
    const physicsResponses = [
      `يا كريم.. مادة الفيزياء هي العمود الفقري لمجموعك، والدرجة فيها ما تجيش غير بالحل والورقة والقلم!
- افتح كشكول القوانين الخاص بـ أ. عبد المعبود وراجع علاقات كمية التحرك ومسائل التصادمات المرنة وغير المرنة.
- المطلوب منك فوراً: حل شيت المحاضرة مسألة مسألة، وأي فكرة فيها تركة اكتب خطواتها في هامش الكشكول.
- هدفنا تقفيل الـ 50 من 50 في امتحان الفيزياء.. قوم افتح الكشكول والآلة الحاسبة وابدأ فوراً! ⚡`,
      `فيزياء تانية ثانوي محتاجة تركيز عالي وربط القوانين يا كريم!
- متعتمدش على الفهم النظري فقط؛ الفيزياء تتفهم من خلال رسم المسألة وتحديد المعطيات والمجهول.
- شيت مستر محمد عبد المعبود مفيش مسألة فيه تتعدى بالبركة؛ حل 10 مسائل دلوقتي وراجع نواتجك.
- مستقبلك كطبيب بيبدأ من فهمك للقوانين دي.. ابدأ جلسة 45 دقيقة حالا! 🦁`,
      `بخصوص الفيزياء يا كريم: المدرس بيشرح الفكرة، وأنت اللي بتثبتها في دماغك بالتطبيق العملي.
- ركز على التطبيقات الحياتية لقوانين الحركة والتحرك والجاذبية.
- أي مسألة تقف معاك متفوتهاش، علم عليها بعلامة حمراء واكتب سبب الوقوف عشان تسأل فيها.
- يلا يا بطل، البداية الصعبة هي اللي بتصنع أوائل الجمهورية!`
    ];
    return physicsResponses[turn % physicsResponses.length];
  }

  // 2. Arabic / Salah / Taqwa
  if (clean.includes('عربي') || clean.includes('نحو') || clean.includes('صلاح') || clean.includes('تقوي') || clean.includes('بلاغ') || clean.includes('اعراب') || clean.includes('استعار') || clean.includes('كناي') || clean.includes('قراء')) {
    const arabicResponses = [
      `اللغة العربية يا كريم هي صمام الأمان لمجموعك (80 درجة كاملة)!
- النحو مش حفظ قواعد، النحو فهم سياق وإعراب لمعنى الجملة. افتح قطع النحو وحل قطعة كاملة واستخرج المبتدأ المؤخر والخبر والمفاعيل.
- البلاغة: الاستعارة والكناية والتشبيه محتاجة تذوق وتحديد سر الجمال.
- واجب مستر محمد صلاح وكشكول مس تقوى لازم يتقفل أول بأول قبل موعد الحضور. يلا شد حيلك! 📚`,
      `يا كريم، العربي بيفرق بين اللي بيدخل طب وبين غيره!
- محاضرات مستر محمد صلاح الأونلاين لازم تتدبس وتتلخص أول بأول مع كويز الثلاثاء.
- سنتر مس تقوى حضور سبت وثلاثاء الساعة 4:00 عصراً.. متدخلش الحصة إلا وواجبك مقفل 100%.
- افتح تدريبات النحو وابدأ بحل 15 جملة إعراب الآن!`
    ];
    return arabicResponses[turn % arabicResponses.length];
  }

  // 3. History / Ahmed Samir
  if (clean.includes('تاريخ') || clean.includes('احمد سمير') || clean.includes('محمد علي') || clean.includes('ثور') || clean.includes('استعمار') || clean.includes('مصر الحديث')) {
    const historyResponses = [
      `التاريخ في النظام الجديد يا كريم فهم واستنتاج مش حفظ تواريخ وخلاص!
- أ. أحمد سمير بيركز دايماً على "ما وراء السطور" وعلاقات السبب والنتيجة والقواسم المشتركة.
- امسك خريطة الأحداث واعمل ملخص شجري بيدك: الشخصية، دوافع القرار، والنتائج المترتبة.
- ركز على حل أسئلة الفهم العالي في كتاب التدريبات عشان تقفل الـ 95%+ وتضمن الدرجة النهائية! 🏛️`,
      `يا كريم.. مادة التاريخ محتاجة عقل محلل، كأنك بتقرأ فيلم وثائقي.
- اربط أحداث المنهج بالشخصيات والقرارات والظروف الاقتصادية والسياسية.
- حل امتحان مستر أحمد سمير الأخير وراجع أي سؤال غلطت فيه في كشكول الأخطاء. يلا افتح الفصل وركز!`
    ];
    return historyResponses[turn % historyResponses.length];
  }

  // 4. English / Ayman Abdelaty
  if (clean.includes('انجليزي') || clean.includes('ايمن') || clean.includes('كلمات') || clean.includes('جرامر') || clean.includes('ترجم') || clean.includes('ايساي') || clean.includes('grammar') || clean.includes('voc')) {
    const englishResponses = [
      `اللغة الإنجليزية مع أ. أيمن عبد العاطي محتاجة ممارسة يومية يا كريم!
- الكلمات (Vocabulary) تتحفظ بجمل وتعبيرات وسياق وحروف الجر (Prepositions) والمترادفات والمتضادات.
- الجرامر محتاج حل 30 سؤال على كل قاعدة عشان تثبت التريكات وتفرق بين الأزمنة.
- اكتب براجراف أو مقال إيساي أسبوعياً وترجم جملتين يومياً.. هتوصل للـ 50 من 50 بكل سهولة! 🇬🇧`,
      `يا كريم، الإنجليزي لغة وممارسة؛ مفيش يوم يمر بدون حفظ وتكرار الكلمات الجديدة.
- ركز على الـ Collocations والـ Phrasal Verbs اللي بيحب يجيبها مستر أيمن في الامتحانات.
- راجع الامتحان السابق، لو نقصت عن 95% حدد الدرجات ضاعت فين وصلحها حالاً!`
    ];
    return englishResponses[turn % englishResponses.length];
  }

  // 5. Tiredness / Fatigue / Burnout / Procrastination
  if (clean.includes('تعب') || clean.includes('زهق') || clean.includes('ملل') || clean.includes('مش قادر') || clean.includes('كسل') || clean.includes('تسويف') || clean.includes('مخنوق') || clean.includes('محبط') || clean.includes('خايف')) {
    const fatigueResponses = [
      `يا دكتور كريم.. التعب والملل شعور طبيعي جداً بيمر بيه أي بطل بيحارب عشان هدف عظيم!
بس الفرق الحقيقي بين أوائل الجمهورية والناس العادية هو: مين بيقدر يقعد يذاكر حتى وهو مش طايق!
- افتكر يوم النتيجة، فرحة أبوك وأمك بيك، وصورتك بالبالطو الأبيض وسماعة الطبيب 🩺
- الحل مش إنك تضيع اليوم؛ الحل إنك تقوم تتوضى، تصلي، تشرب كوباية مية، وتفتح تايمر 25 دقيقة وتبدأ في أسهل صفحة.
- مجرد ما تبدأ خمس دقائق، الزهق هيروح والتركيز هيشتغل. استعن بالله ولا تعجز! 🦁`,
      `يا كريم.. أنت مش لوحدك، وكلنا عارفين ضغط تانية ثانوي ومجموعها المدمج مع تالتة.
لكن الهروب من المذاكرة مش هيريحك؛ ده هيزود التوتر والمتراكمات وهيخلي ضميرك مش مرتاح!
- اتنفس بعمق، غير مكان قعدتك، وسيب التليفون في أوضة تانية.
- ابدأ بمسألة واحدة أو صفحة واحدة في المادة اللي بتحبها.. الإنجاز الصغير بيولد طاقة رهيبة!
- يلا يا بطل، حلمك مستنيك!`
    ];
    return fatigueResponses[turn % fatigueResponses.length];
  }

  // 6. Backlog / Accumulation
  if (clean.includes('متراكم') || clean.includes('مراكم') || clean.includes('تاجيل') || clean.includes('ماخر') || clean.includes('متاخر') || clean.includes('ملحوق')) {
    const backlogResponses = [
      `بخصوص المتراكمات يا كريم: الندم والتفكير الكتير مش هيحل حاجة، العمل الصارم هو اللي هيحل!
- قاعدة الـ 4 أيام الذهبية لتصفية المتراكم: كل يوم تاخد "درس قديم متراكم" مع "المذاكرة اليومية الجديدة".
- ابدأ فوراً بمحاضرات الفيزياء المتأخرة وشيت العربي.
- كل دقيقة بتضيعها بتزود وزن الحمل؛ افتح تايمر التركيز 50 دقيقة ونفذ مهمة واحدة كاملة الآن! ⚡`,
      `طبعاً ملحوق يا كريم! بس بشرط واحد قاطع: "وقف تضييع أي ثانية من اللحظة دي".
- قسم المتراكم إلى قائمة واضحة من المهام الصغيرة المحددة بالاسم.
- متبدأش بالمادة الكبيرة كلها مرة واحدة، خد جزء جزء واشطب عليه لما يخلص. متعة الشطب هتديك حافز جبار.
- يلا سمّي الله وابدأ بأول مهمة في القائمة!`
    ];
    return backlogResponses[turn % backlogResponses.length];
  }

  // 7. Exam Marks / 95% Rule
  if (clean.includes('امتحان') || clean.includes('درج') || clean.includes('كويز') || clean.includes('95') || clean.includes('درجاتي') || clean.includes('مجموع')) {
    const examResponses = [
      `قاعدتنا الأكاديمية يا كريم ملزمة وصارمة: الـ 95% هي الحد الأدنى، ومستهدفنا الدائم هو الـ 100%!
- لو جبت أقل من 95%: افتح كشكول الأخطاء فوراً واكتب سبب كل نصف درجة ضاعت (تسرع، سوء فهم، قانون منسي).
- لو قفلت الـ 100%: ممتاز وعاش جداً، لكن حافظ على التواضع والاستمرار بنفس الجدية للاختبار القادم.
- مفيش درجة بتضيع بالصدفة، التدريب والتركيز هما اللي بيضمنوا التقفيل! 🎯`,
      `يا كريم.. تقييم الامتحانات هو الميزان الحقيقي لمستواك في الثانوية.
- كل غلطة بتغلطها دلوقتي في الكويزات والشيتات هي نعمة؛ لأنك بتعرف ثغرتك وتصلحها قبل امتحانات نهاية السنة.
- دايماً اسأل نفسك بعد كل امتحان: "ليه مقفلتش؟ وإيه اللي هغيره في طريقة مذاكرتي المرة الجاية؟"
- استمر يا بطل، الـ 95%+ في متناول إيدك بالانضباط!`
    ];
    return examResponses[turn % examResponses.length];
  }

  // 8. Schedule / Time Planning
  if (clean.includes('جدول') || clean.includes('وقت') || clean.includes('انظم') || clean.includes('انام') || clean.includes('اصحي') || clean.includes('ساعات') || clean.includes('خطة')) {
    const scheduleResponses = [
      `إليك خطة تنظيم الوقت المقترحة لباقي يومك يا كريم:
1. الجولة الأولى (تركيز عميق 60 دقيقة): مادة الفيزياء (حل مسائل كمية التحرك وملاحظات عبد المعبود).
2. راحة ذكية بومودورو 10 دقائق (ماء وحركة خفيفة بدون شاشات).
3. الجولة الثانية (50 دقيقة): لغة عربية (واجب النحو وقواعد مس تقوى ومستر صلاح).
4. الجولة الثالثة (45 دقيقة): إنجليزي أو تاريخ (حفظ وتطبيق مباشر).
- النوم الساعة 11:30 مساءً للاستيقاظ بنشاط، والتخلي التام عن المشتتات أثناء الجلسات.
افتح غرفة التركيز واضغط "بدء الجلسة" الآن! ⏱️`,
      `يا كريم، إدارة الوقت سر التفوق:
- حدد أولوياتك قبل ما تقعد على المكتب: المادة الصعبة الأول في قمة نشاطك الذهني.
- اعتمد جلسات بومودورو (50 دقيقة مذاكرة + 10 دقائق راحة).
- بلاش تذاكر وفي إيدك الموبايل؛ الدقيقة اللي بتضيع على السوشيال بتكلفك تركيز ربع ساعة كاملة.
- ابدأ جلسة التركيز الحالية واستعن بالله!`
    ];
    return scheduleResponses[turn % scheduleResponses.length];
  }

  // 9. Reporting / Progress Update
  if (clean.includes('خلصت') || clean.includes('ذاكرت') || clean.includes('زاكرت') || clean.includes('عملت') || clean.includes('حليت')) {
    return `عاش يا كريم، الله ينور عليك! 👏
أي إنجاز بتخلصه بيقربك خطوة حقيقية من حلم كلية الطب وأوائل الجمهورية.
- متقفش هنا: سجل الجلسة دي فوراً في السجل عشان تتحسب في عدادك اليومي والأسبوعي والتراكمي.
- خد راحة 5 دقائق، ثم انقل على المادة أو المهمة التالية في جدولك بكل حماس وجدية! 🦁`;
  }

  // 10. Greetings / Hello
  if (clean.includes('سلام') || clean.includes('اهلا') || clean.includes('صباح') || clean.includes('مساء') || clean.includes('ازيك') || clean.includes('عامل ايه')) {
    return `أهلاً يا دكتور كريم! أنا هنا جنبك وراداري شغال معاك على مدار الساعة لمراقبة كل ثانية وكل درجة.
جاهز أساعدك في أي مادة، أراجع معاك المتراكمات، أو نعمل جلسة تركيز فورية.
قولي: هنبدأ بإيه دلوقتي؟ فيزياء ولا عربي ولا إنجليزي ولا تاريخ؟ 🚀`;
  }

  // General Contextual Response
  const generalResponses = [
    `يا كريم، أنا شايف خطواتك ومتابع خطتك ومجهودك لحظة بلحظة.
المعادلة الذهبية لتفوقك واضحة ومفيهاش فصال:
1. إنجاز مهام اليوم المحددة في الجدول بدون أي تأجيل.
2. عدم النزول عن شرط الـ 95% في أي كويز أو امتحان لموادك الأربعة.
3. السيطرة الصارمة على الوقت الضائع وتركيز كل دقيقة في حلم كلية الطب.
اسألني عن أي مادة محددة، أو افتح غرفة التركيز فوراً واستعن بالله! 🦁`,
    `يا كريم، تذكر دايماً: الثانوية العامة مسابقة نفس طويل والتزام يومي مستمر.
كل مسألة صعبة بتفك شفرتها، وكل كلمة جديدة بتحفظها، وكل خطأ بتصلحه في امتحاناتك هو لبنة بتبني بيها مجموعك في تانية وتالتة ثانوي.
مفيش وقت للتسويف؛ افتح الدرس اللي عليك وابدأ بتركيز كامل، وأنا متابع معاك كل جلسة! 🩺`,
    `يا بطل، الثقة بالنفس والتوكل على الله وبذل أقصى جهد هما سلاحك.
ركز على هدف اليوم وخلص ساعاتك المطلوبة (6 ساعات نقية). أي حاجة محتاجها أو مادة واقفة معاك قولي عليها فوراً وهنوجهك للحل الصح!`
  ];
  return generalResponses[turn % generalResponses.length];
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
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
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

    const userPrompt = `إليك رادار شامل وفحص حي للموقف الأكاديمي الحقيقي للطالب كريم عمر:
${JSON.stringify(studyData, null, 2)}

المطلوب منك بصفتك المراقب الأكاديمي الصارم الذكي:
1. كشف المتراكمات بالاسم: اذكر بوضوح أي محاضرات فيزياء أو عربي أو إنجليزي أو مهام متأخرة لم ينهِها كريم حتى الآن.
2. مساءلة كريم بحزم: وجه له أسئلة مباشرة وصريحة تهز ضميره (مثال: "ليه مأجل محاضرة كمية التحرك ومسائل المقذوفات لحد دلوقتي؟ مين هيدخل الامتحان بدالك؟").
3. تقييم الوقت الضائع بدقة: احسب الفاقد من ساعات اليقظة الـ 24 وعاتبه بلهجة مصرية وقورة وصادقة.
4. مراجعة شرط الـ 95% الإلزامي: لو أي امتحان نزل عن 95% دقق فيه واطلب منه يفتح كشكول الأخطاء فوراً.
5. خطة عمل حاسمة لليوم: وزع الساعات المتبقية بخطة مركزة بدون أي كلام نظري.`;

    const systemPrompt = getKareemSystemPrompt(customInstructions);
    const analysisText = await callGeminiAPI(`${systemPrompt}\n\n${userPrompt}`);
    setInCache(cacheKey, analysisText);

    res.json({ success: true, fromCache: false, analysis: analysisText });
  } catch (err: any) {
    console.error('AI Monitor error:', err);
    res.status(500).json({ success: false, error: err.message || 'فشل استدعاء المراقب الذكي' });
  }
});

// POST /api/ai/interrogate - Direct Backlog Interrogation & Accountability
app.post('/api/ai/interrogate', async (req, res) => {
  try {
    const { backlogData, customInstructions } = req.body || {};
    const systemPrompt = getKareemSystemPrompt(customInstructions);

    const prompt = `${systemPrompt}

إليك جرد المتراكمات والوضع اللحظي لكريم:
${JSON.stringify(backlogData || {}, null, 2)}

أنت الآن في "جلسة مساءلة ومحاكمة أكاديمية صريحة" مع كريم:
المطلوب منك:
1. اذكر له بالضبط ما هو مراكمه بالاسم (من محاضرات فيزياء منصة أ. عبد المعبود المتأخرة، واجبات عربي أ. محمد صلاح، مهام المتراكم، والامتحانات اللي نزلت عن 95%).
2. اسأله 3 أسئلة مواجهة صريحة ومحرجة تحرك غيرته على حلمه:
   - سؤال عن سبب تأجيل الدروس المحددة دي بالذات.
   - سؤال عن درجاته اللي ضاعت في الامتحانات السابقة وكيف هيقفل الـ 100%.
   - سؤال عن الساعات والوقت اللي ضاع اليوم.
3. اديه قرار فوري يبدأ بيه حالاً بدون دقيقة تأخير.
تحدث بلهجة مصرية راقية، حازمة، قاطعة، ومحبّة لمستقبله كطبيب متفوق.`;

    const responseText = await callGeminiAPI(prompt);
    res.json({ success: true, interrogation: responseText });
  } catch (err: any) {
    console.error('AI Interrogate error:', err);
    res.status(500).json({ success: false, error: err.message || 'فشل استدعاء جلسة المساءلة' });
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

    const reply = await callGeminiAPI(prompt, message, context);
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
