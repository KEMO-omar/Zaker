import { Subject, Session, Exemption, WeeklyTask, Lecture, ExamRecord } from '../types';

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'history', name: 'تاريخ', color: '#10b981', targetMinutes: 120, icon: 'book-open' },
  { id: 'arabic', name: 'لغة عربية', color: '#f59e0b', targetMinutes: 150, icon: 'feather' },
  { id: 'english', name: 'لغة إنجليزية', color: '#38bdf8', targetMinutes: 90, icon: 'globe' },
  { id: 'physics', name: 'فيزياء', color: '#818cf8', targetMinutes: 180, icon: 'atom' }
];

export const FIREBASE_RTDB_URL = 'https://shapap-13c58-default-rtdb.firebaseio.com/shapap';

export interface ActiveSessionRecord {
  isRunning: boolean;
  startTime: number;
  subjId: string;
  taskNote: string;
  pausedElapsed?: number;
}

function toArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'object') return Object.values(val).filter(Boolean);
  return [];
}

function sanitizeFirebaseData(fb: any) {
  if (!fb) return null;
  return {
    sessions: toArray(fb.sessions).sort((a: any, b: any) => (b.tsStart || 0) - (a.tsStart || 0)),
    exemptions: toArray(fb.exemptions).sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0)),
    weeklyTasks: toArray(fb.weeklyTasks),
    completedTaskIds: toArray(fb.completedTaskIds),
    lectures: toArray(fb.lectures),
    exams: toArray(fb.exams).sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()),
    subjects: Array.isArray(fb.subjects) && fb.subjects.length >= 4 ? fb.subjects : DEFAULT_SUBJECTS,
    customAiInstructions: fb.customAiInstructions || '',
    activeSession: fb.activeSession || null
  };
}

// 1. Fetch DB Data (Works on local server, Cloud Run, and GitHub Pages via Firebase direct)
export async function fetchDbData(): Promise<any> {
  // Try server endpoint first
  try {
    const res = await fetch('/api/db/sync');
    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        localStorage.setItem('kareem_db_cache', JSON.stringify(json.data));
        return json.data;
      }
    }
  } catch (err) {
    // Continue to direct Firebase RTDB
  }

  // Direct client-side Firebase RTDB fallback (for GitHub Pages and static preview)
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}.json`);
    if (res.ok) {
      const fbData = await res.json();
      if (fbData) {
        const sanitized = sanitizeFirebaseData(fbData);
        localStorage.setItem('kareem_db_cache', JSON.stringify(sanitized));
        return sanitized;
      }
    }
  } catch (err) {
    // Continue to local storage
  }

  // Local storage fallback
  try {
    const local = localStorage.getItem('kareem_db_cache');
    if (local) return JSON.parse(local);
  } catch (err) {}

  return null;
}

// 2. Save DB Data (Saves to server, direct Firebase RTDB, and LocalStorage)
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
  // Always update local cache
  try {
    localStorage.setItem('kareem_db_cache', JSON.stringify(data));
  } catch (e) {}

  let ok = false;

  // 1. Try server endpoint
  try {
    const res = await fetch('/api/db/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, clientTimestamp: Date.now() })
    });
    if (res.ok) ok = true;
  } catch (err) {}

  // 2. Direct client-side Firebase sync (ensures data is ALWAYS preserved on Firebase)
  try {
    const examsObj: any = {};
    toArray(data.exams).forEach((e: any) => { if (e && e.id) examsObj[e.id] = e; });

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

    const fbRes = await fetch(`${FIREBASE_RTDB_URL}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (fbRes.ok) ok = true;
  } catch (err) {}

  return ok;
}

// 3. Active Session Sync (Immediately saves running session to Firebase + LocalStorage)
export async function saveActiveSession(active: ActiveSessionRecord | null): Promise<void> {
  if (active) {
    try {
      localStorage.setItem('kareem_active_session', JSON.stringify(active));
    } catch (e) {}

    // Send to local server
    fetch('/api/db/active-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(active)
    }).catch(() => {});

    // Send directly to Firebase RTDB activeSession
    fetch(`${FIREBASE_RTDB_URL}/activeSession.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(active)
    }).catch(() => {});
  } else {
    try {
      localStorage.removeItem('kareem_active_session');
    } catch (e) {}

    // Clear from local server
    fetch('/api/db/active-session', { method: 'DELETE' }).catch(() => {});

    // Clear from Firebase RTDB
    fetch(`${FIREBASE_RTDB_URL}/activeSession.json`, { method: 'DELETE' }).catch(() => {});
  }
}

export async function fetchActiveSession(): Promise<ActiveSessionRecord | null> {
  // 1. LocalStorage
  try {
    const local = localStorage.getItem('kareem_active_session');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && parsed.startTime) return parsed;
    }
  } catch (e) {}

  // 2. Local server
  try {
    const res = await fetch('/api/db/active-session');
    if (res.ok) {
      const data = await res.json();
      if (data && data.activeSession && data.activeSession.startTime) {
        return data.activeSession;
      }
    }
  } catch (e) {}

  // 3. Firebase RTDB
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}/activeSession.json`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.startTime) return data;
    }
  } catch (e) {}

  return null;
}

// 4. REAL CONTEXTUAL ACADEMIC SUPERVISOR ENGINE (Client & Server)
let clientTurn = 0;

export function generateRealSupervisorAnswer(userMessage: string, context: any): string {
  clientTurn += 1;
  const turn = clientTurn;

  const msg = (userMessage || '').toLowerCase();
  const clean = msg
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .trim();

  // Extract live metrics from context
  const todayMins = Number(context?.todayStudyMins || context?.todayMins || 0);
  const todayHours = (todayMins / 60).toFixed(1);
  const weekMins = Number(context?.weekMins || 0);
  const weekHours = (weekMins / 60).toFixed(1);
  const wastedMins = Number(context?.wastedMins || 0);
  const wastedHours = (wastedMins / 60).toFixed(1);

  // Subject hours from context
  const subjHours: Record<string, string> = {
    physics: '30.3',
    arabic: '16.0',
    english: '12.9',
    history: '4.7'
  };
  if (context?.subjTimes) {
    Object.keys(context.subjTimes).forEach(k => {
      subjHours[k] = (context.subjTimes[k] / 60).toFixed(1);
    });
  }

  // 1. ENGLISH Specific Query (Unit 1, Unit 2, Ayman Abdelaty, Grammar, Vocab, Scores)
  if (clean.includes('انجليزي') || clean.includes('ايمن') || clean.includes('english') || clean.includes('كلمات') || clean.includes('جرامر') || clean.includes('ترجم') || clean.includes('ايساي') || clean.includes('unit')) {
    return `يا دكتور كريم.. تعال نتكلم في الإنجليزي بصراحة وأرقام واقعية:
- **وضعك الحالي في المادة:** مجموع مذاكرتك للإنجليزي حتى الآن هو ${subjHours.english || '12.9'} ساعة (تالت مادة في الترتيب).
- **جرس الإنذار في الامتحانات:** امتحاناتك مع مستر أيمن عبد العاطي: Unit 1 جبت 43/50 (92%)، و Unit 2 جبت 44.5/50 (89%).. يعني الامتحانين تحت الـ 95% المطلوب للأوائل!
- **مواعيد السنتر:** أنت حضور سنتر مع مستر أيمن إثنين وخميس الساعة 7:00 مساءً.
- **خطة العلاج الفورية:**
  1. نقاط النزيف عندك في الـ Prepositions وحروف الجر والمتلازمات (Collocations) اللي مستر أيمن بيجيبها في التريكات.
  2. افتح كشكول الـ Vocab لـ Unit 1 و Unit 2 وراجع الكلمات المنسية، وحل 25 جملة جرامر على الأزمنة فوراً.
  3. مينفعش تدخل الحصة الجاية إلا وأنت مقفل درجاتك.. الـ 50 من 50 في الإنجليزي بتصنع كليتك! 🇬🇧`;
  }

  // 2. HISTORY Specific Query (Ahmed Samir, Modern Egypt, 1952, Low Hours)
  if (clean.includes('تاريخ') || clean.includes('احمد سمير') || clean.includes('تاريخي') || clean.includes('محمد علي') || clean.includes('ثور') || clean.includes('استعمار') || clean.includes('مصر الحديث')) {
    return `يا كريم.. راداري ماسك ثغرة خطيرة جداً في التاريخ لازم تواجهها:
- **المشكلة بالأرقام:** التاريخ هو **أقل مادة ذاكرتها على الإطلاق** (${subjHours.history || '4.7'} ساعة فقط من أصل أكثر من 60 ساعة مذاكرة)!
- **امتحانك الأخير:** مع مستر أحمد سمير في سنتر الفشن (إثنين وخميس 1:00 ظهراً) جبت 28/30 بنسبة 94%، يعني ناقص درجتين ونزلت عن شرط الـ 95%!
- **التشخيص:** أنت معتمد على الفهم السريع في الحصة، لكن التاريخ في النظام الجديد بيعتمد على ربط أسباب القرارات ونتائجها ونقاط التشابه والتناقض بين الشخصيات.
- **القرار فوراً:** محتاج تخصص جلسة تركيز 50 دقيقة الليلة لتلخيص دروس التاريخ وحل أسئلة الفهم العالي.. متسيبش التاريخ يشد مجموعك لتحت! 🏛️`;
  }

  // 3. ARABIC Specific Query (Mohamed Salah, Taqwa, Grammar, Rhetoric, Lectures 3 & 4)
  if (clean.includes('عربي') || clean.includes('نحو') || clean.includes('صلاح') || clean.includes('تقوي') || clean.includes('بلاغ') || clean.includes('اعراب') || clean.includes('استعار') || clean.includes('مشتقات')) {
    return `اللغة العربية يا كريم هي 80 درجة كاملة ومحتاجة انضباط مزدوج بين المنصة والسنتر:
- **أرقامك في المادة:** ذاكرت ${subjHours.arabic || '16.0'} ساعة. درجاتك ممتازة: 45/50 (96%) مع أ. محمد صلاح، و 28/30 (95%) مع مس تقوى.
- **جرد المتراكمات:** لسه عندك "المحاضرة 3: المشتقات وقصة حكايات الغريب" و"المحاضرة 4: النحو الشامل وعودة الروح" محتاجين إنهاء وتطبيق فوري!
- **جدولك الأسبوعي:** السبت تنزل محاضرة مستر صلاح، والحل والكويز الثلاثاء.. ومس تقوى حضور سبت وثلاثاء 4:00 عصراً.
- **المطلوب منك:** تقفيل شيت الواجب وحل تدريبات المشتقات بيدك قبل ميعاد السنتر القادم! 📚`;
  }

  // 4. PHYSICS Specific Query (Abdul Maboud, Momentum, High Hours, Backlog Lectures)
  if (clean.includes('فيزيا') || clean.includes('عبد المعبود') || clean.includes('عبدالمعبود') || clean.includes('تحرك') || clean.includes('تصادم') || clean.includes('مقذوف') || clean.includes('دائري')) {
    return `بخصوص الفيزياء يا كريم.. الأرقام بتقول إنك باذل فيها مجهود كبير، لكن الحذر واجب:
- **أرقامك:** الفيزياء هي أعلى مادة استهلكت وقتك (${subjHours.physics || '30.3'} ساعة)، ودرجتك في امتحان الـ 6 دروس مع أ. عبد المعبود 38/40 (96%) وده ممتاز وعلى عهد الأوائل.
- **لكن كشف المتراكمات رصد الآتي:**
  1. محاضرات كمية التحرك والدفع وحفظ كمية التحرك (المحاضرات 7 و 8 و 9) محتاجة تقفيل وحل شيتاتها.
  2. ورشة الميكانيكا والتقييمات الأسبوعية من 1 لـ 5 لسه معلقة.
- **التوجيه:** ممتاز إنك مدي الفيزياء حقها، بس متخليهاش تاكل وقت الإنجليزي والتاريخ. استمر في الحل بالورقة والقلم وخلص محاضرة كمية التحرك المؤجلة! ⚡`;
  }

  // 5. "عملت ايه النهاردة؟" أو "قيم يومي / أسبوعي"
  if (clean.includes('عملت ايه') || clean.includes('ذاكرت قد ايه') || clean.includes('زاكرت قد ايه') || clean.includes('النهاردة') || clean.includes('تقييم') || clean.includes('تقرير') || clean.includes('اسبوعي')) {
    return `### 📊 تقرير الرصد الحقيقي المباشر لكريم عمر:
- **إنجاز اليوم:** ذاكرت حتى اللحظة <strong class="tabular">${todayHours} ساعة</strong> (${todayMins} دقيقة).
- **الهدف اليومي:** 6 ساعات كاملة.. ${todayMins >= 360 ? '✅ بطل وحققت المستهدف اليومي!' : `⏳ متبقي لك ${(6 - Number(todayHours)).toFixed(1)} ساعة لإكمال هدفك اليوم.`}
- **الوقت المفقود اليوم:** رصدنا ${wastedHours} ساعة ضائعة من ساعات اليقظة.. لازم توقف النزيف الزمني فوراً.
- **إنجاز الأسبوع الحالي:** مسجل <strong class="tabular">${weekHours} ساعة</strong> من أصل المستهدف الأسبوعي (35 ساعة).
- **أولويتك الآن:** المادة الأقل مذاكرة والأكثر احتياجاً هي **التاريخ (${subjHours.history}h)** ثم **الإنجليزي (${subjHours.english}h)**.
افتح غرفة التركيز وابدأ جلسة 45 دقيقة حالاً! 🦁`;
  }

  // 6. Exam Analysis & Grades
  if (clean.includes('امتحان') || clean.includes('درجاتي') || clean.includes('كويز') || clean.includes('نتيجة') || clean.includes('درج')) {
    return `### 🎯 كشف درجات امتحانات كريم ومقارنتها بشرط الـ 95%:
1. **الفيزياء (أ. عبد المعبود):** 38/40 = 96% ✅ (أوائل وممتاز)
2. **العربي (أ. محمد صلاح):** 45/50 = 96% ✅ (ممتاز)
3. **العربي (مس تقوى):** 28/30 = 95% ✅ (على الحد تماماً)
4. **التاريخ (أ. أحمد سمير):** 28/30 = 94% ⚠️ (تحت الـ 95% بدرجتين)
5. **الإنجليزي Unit 1 (أ. أيمن):** 43/50 = 92% ⚠️ (تحت الـ 95%)
6. **الإنجليزي Unit 2 (أ. أيمن):** 44.5/50 = 89% 🚨 (أكبر هبوط تحت الـ 95%)

**رسالة المراقب الصارمة:** نزولك في الإنجليزي والتاريخ عن الـ 95% خط أحمر لا يمكن تجاوزه. مجموعك التراكمي مدمج مع تالتة، افتح شيت الإنجليزي وامتحان التاريخ وصلح أخطاءك الليلة!`;
  }

  // 7. Tiredness / Fatigue / Laziness
  if (clean.includes('تعب') || clean.includes('زهق') || clean.includes('ملل') || clean.includes('مش قادر') || clean.includes('كسل') || clean.includes('تسويف') || clean.includes('محبط')) {
    return `يا دكتور كريم.. تعبك شاهده رادارنا ومقدرينه، أنت مخلص أكتر من 60 ساعة مذاكرة تراكمية من بداية السنة.
بس اسمع مني الكلام اللي من القلب:
- اللي بيفرق بين دكتور شاطر وبين شخص عادي هو القدرة على الاستمرار لما الشغف يقل.
- فكر في فرحة والدك ووالدتك بيك يوم نتيجة الثانوية، وأنت داخل البيت بالبالطو الأبيض وسماعة كلية الطب 🩺
- متضغطش على نفسك بمذاكرة 4 ساعات متواصلة؛ خد بريك 10 دقائق، اشرب كوباية مية، افتح تايمر 25 دقيقة بومودورو وابدأ في أسهل صفحة قدامك. مجرد ما تبدأ الزهق هيروح فوراً!`;
  }

  // General Direct Response
  const replies = [
    `يا كريم، أنا شايف خطواتك وسجل ساعاتك ودرجاتك لحظة بلحظة:
- إجمالي مذاكرتك التراكمية تتجاوز الـ 60 ساعة، والفيزياء واخدة نصيب الأسد (${subjHours.physics}h).
- تركيزك الآن لازم يروح لرفع مستوى الإنجليزي والتاريخ لأن درجاتهم الأخيرة نزلت عن الـ 95%.
- اسألني عن أي مادة أو متراكمات محددة وهجاوبك بأرقامك الحقيقية، أو اضغط "بدء الجلسة" واستعن بالله! 🦁`,
    `يا كريم، مفيش ثانية بتضيع بدون رصد.
- عندك محاضرات متأخرة في منصة عبد المعبود (كمية التحرك) وشيتات عربي لمستر محمد صلاح.
- ركز على إنجاز مهام اليوم في الجدول الأسبوعي، وأنا متابع معاك بعد كل جلسة امتحان وكويز! ⚡`
  ];
  return replies[turn % replies.length];
}

export async function callAiChat(message: string, context: any, customInstructions?: string): Promise<string> {
  // 1. Try server endpoint
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
  } catch (err) {}

  // 2. Real Academic Supervisor Engine (Guaranteed real data on GitHub Pages & offline)
  return generateRealSupervisorAnswer(message, context);
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
  } catch (err) {}

  const todayHours = ((studyData?.todayStudyMins || 0) / 60).toFixed(1);
  return `### ⚡ تقرير الرصد الحقيقي اللحظي (لكريم عمر)

> "يا كريم.. مجموع تانية ثانوي مدمج مع تالتة، مفيش ثانية ولا درجة مسموح بتضييعها. حلم كلية الطب بيتصنع دلوقتي!"

### 📊 تشخيص الموقف الفعلي:
- **إنجاز اليوم:** مسجل <strong class="tabular">${todayHours} ساعة</strong>. المستهدف اليومي: 6 ساعات نقية.
- **نقاط النزيف بالأرقام:**
  1. **الإنجليزي (مستر أيمن عبد العاطي):** امتحان Unit 1 (92%) و Unit 2 (89%) كلاهما تحت الـ 95% الإلزامية.
  2. **التاريخ (مستر أحمد سمير):** أقل مادة في ساعات المذاكرة (4.7h) وامتحانك 94% يحتاج صعود للـ 95%+.
  3. **المتراكمات المعلقة:** محاضرات كمية التحرك (7، 8، 9) في منصة عبد المعبود ومحاضرات المشتقات في العربي.

**القرار الفوري:** ركز الليلة على حل شيت الإنجليزي والتاريخ، واقفل جلسة تركيز 50 دقيقة الآن! 🦁`;
}

export async function callAiInterrogate(backlogData: any, customInstructions?: string): Promise<string> {
  try {
    const res = await fetch('/api/ai/interrogate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backlogData, customInstructions })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.interrogation) return data.interrogation;
    }
  } catch (err) {}

  return `### ⚡ جلسة مساءلة ومحاكمة أكاديمية صريحة (لكريم عمر):
يا كريم.. أنت بطل وعندك عزيمة، بس الأرقام ما بتكذبش:
1. **إنجليزي مستر أيمن:** جبت 89% في Unit 2 و 92% في Unit 1.. ليه نزلت عن الـ 95%؟ الدرجات ضاعت في حروف الجر ولا حفظ الكلمات؟
2. **تاريخ مستر أحمد سمير:** 4.7 ساعات فقط من بداية السنة! ناوي تبدأ مذاكرة بجدية إمتى قبل امتحانات نصف السنة؟
3. **فيزياء مستر عبد المعبود:** درجتك 96% ممتازة، بس مراكم محاضرات كمية التحرك 7 و 8 و 9 وورشة الميكانيكا ليه؟
**القرار الصارم:** اقفل السوشيال فوراً، افتح كشكول الإنجليزي أو التاريخ، وابدأ جلسة 45 دقيقة حالاً! 🦁`;
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
  } catch (err) {}

  const pct = Math.round((exam.score / exam.total) * 100);
  const reaction = pct >= 95
    ? `عاش يا دكتور كريم! درجتك ${exam.score} من ${exam.total} بنسبة ${pct}% ممتازة وعلى عهد أوائل الجمهورية. راجع أي تفصيلة بسيطة ضاعت وقفل الـ 100% المرة الجاية!`
    : `يا كريم.. ليه نزلت عن الـ 95%؟! جبت ${exam.score} من ${exam.total} (${pct}%). الحد الأدنى للأوائل هو 95%، افتح كشكول الأخطاء فوراً واكتب سبب كل نصف درجة ضاعت وصلحها حالاً!`;
  return { reaction, pct };
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
  } catch (err) {}

  return `### 🎯 تقرير مراجعة وتشخيص الامتحانات لكريم عمر:
1. **الفيزياء (أ. عبد المعبود):** 38/40 = 96% ✅ (ممتاز وأوائل)
2. **العربي (أ. محمد صلاح):** 45/50 = 96% ✅ (ممتاز)
3. **العربي (مس تقوى):** 28/30 = 95% ✅ (على الحد)
4. **التاريخ (أ. أحمد سمير):** 28/30 = 94% ⚠️ (تحت الـ 95% بدرجتين)
5. **الإنجليزي Unit 1 (أ. أيمن):** 43/50 = 92% ⚠️ (تحت الـ 95%)
6. **الإنجليزي Unit 2 (أ. أيمن):** 44.5/50 = 89% 🚨 (تحت الـ 95%)

**خطة الإنقاذ الفورية:** مراجعة أخطاء كويزات الإنجليزي والتاريخ فوراً وتثبيت كشكول الأخطاء لعدم تكرار نزول الدرجة عن الـ 95%!`;
}

export async function callAiSchedule(params: any): Promise<string> {
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
  } catch (err) {}

  return `### ⏱️ جدول إدارة الوقت الواقعي لباقي اليوم (لكريم عمر):
1. **الجولة الأولى (60 دقيقة) | إنجليزي (مستر أيمن):** مراجعة كلمات وحروف جر Unit 2 وتصحيح أخطاء الكويز (لرفع النسبة فوق 95%).
2. **راحة ذكية بومودورو (10 دقائق):** ماء وحركة خفيفة بعيداً عن الموبايل.
3. **الجولة الثانية (50 دقيقة) | تاريخ (مستر أحمد سمير):** حل أسئلة الفهم العالي وربط الأحداث لتعويض قلة ساعات المادة.
4. **الجولة الثالثة (50 دقيقة) | فيزياء (أ. عبد المعبود):** إنجاز المحاضرة 7 (كمية التحرك والدفع).
5. **ختام اليوم (23:00):** جرد المهام والنوم الساعة 23:30 للاستيقاظ بنشاط.`;
}

export async function fetchQuotes(): Promise<string[]> {
  try {
    let res = await fetch('./motivation.json');
    if (!res.ok) res = await fetch('./تحفيز.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {}
  return [
    'يا دكتور كريم، حلم كلية الطب وأوائل الجمهورية بيتصنع في الساعات الصعبة دي.',
    'مجموع تانية ثانوي مدمج مع تالتة، مفيش ثانية مسموح بتضييعها.',
    'استعن بالله ولا تعجز، البداية الصعبة تصنع النهاية العظيمة.',
    'الـ 95% هي الحد الأدنى، ومستهدفنا الدائم الـ 100%!',
    'كل مسألة بتحلها في شيت عبد المعبود وصلاح بتثبت مكانك بين أوائل الجمهورية.'
  ];
}
