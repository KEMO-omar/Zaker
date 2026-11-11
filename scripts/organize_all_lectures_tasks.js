import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Detailed daily schedule structured around Karim's exact lectures & class timings
const organizedTasks = [
  // ==========================
  // السبت (SATURDAY)
  // ==========================
  {
    id: 'task_sat_class_eng',
    dayId: 'sat',
    subjId: 'english',
    text: 'حضور سنتر اللغة الإنجليزية - مستر أيمن عبد العاطي (7:00 م - الميعاد الجديد!) 🚨',
    priority: 'class',
    contextInfo: 'السبت 7:00 مساءً'
  },
  {
    id: 'task_sat_eng_u3_l1',
    dayId: 'sat',
    subjId: 'english',
    text: 'إنجليزي: إنجاز الدرس الأول الوحدة الثالثة (كلمات + قراءة Unit 3)',
    priority: 'high',
    contextInfo: 'محاضرة من الـ 82 (ا ايمن عبد عاطي)'
  },
  {
    id: 'task_sat_ar_lec4',
    dayId: 'sat',
    subjId: 'arabic',
    text: 'عربي: المحاضرة الرابعة لمستر محمد صلاح (النحو الشامل وقصة عودة الروح والعلم والضمير)',
    priority: 'urgent',
    contextInfo: 'محاضرة من الـ 82 (أ. محمد صلاح)'
  },
  {
    id: 'task_sat_ar_spelling',
    dayId: 'sat',
    subjId: 'arabic',
    text: 'عربي (مس تقوى): تقفيل دروس الإملاء (الألف اللينة + الهمزة المتطرفة والمتوسطة + همزة القطع والوصل)',
    priority: 'normal',
    contextInfo: 'تصفية 4 دروس إملاء متراكمة'
  },
  {
    id: 'task_sat_phy_proj_rev',
    dayId: 'sat',
    subjId: 'physics',
    text: 'فيزياء: مذاكرة هدية مراجعة حركة المقذوفات الأفقية وبزاوية وأسئلة التفكير العليا',
    priority: 'high',
    contextInfo: 'محاضرة من الـ 82 (باقة الفيزياء)'
  },

  // ==========================
  // الأحد (SUNDAY)
  // ==========================
  {
    id: 'task_sun_phy_circ_10',
    dayId: 'sun',
    subjId: 'physics',
    text: 'منصة فيزياء أ. محمد عبد المعبود: المحاضرة (10) الحركة الدائرية والقوة المركزية',
    priority: 'class',
    contextInfo: 'تنزل الأحد على المنصة'
  },
  {
    id: 'task_sun_phy_circ_11',
    dayId: 'sun',
    subjId: 'physics',
    text: 'فيزياء: المحاضرة (11) الحركة الدائرية الرأسية الجزء الأول وحل أسئلة الشد والسرعة',
    priority: 'high',
    contextInfo: 'محاضرة من الـ 82 (باقة الفيزياء)'
  },
  {
    id: 'task_sun_ar_rhetoric',
    dayId: 'sun',
    subjId: 'arabic',
    text: 'عربي (مس تقوى): إنهاء دروس البلاغة الثلاثة (الأسلوب الخبري والإنشائي + الإطناب + الإيجاز)',
    priority: 'urgent',
    contextInfo: 'تصفية 3 دروس بلاغة استعداداً لامتحان الجوائز'
  },
  {
    id: 'task_sun_eng_u3_l2',
    dayId: 'sun',
    subjId: 'english',
    text: 'إنجليزي: إنجاز الدرس الثاني الوحدة الثالثة (قواعد أشكال المستقبل Future Forms)',
    priority: 'high',
    contextInfo: 'محاضرة من الـ 82 (ا ايمن عبد عاطي)'
  },
  {
    id: 'task_sun_hist_u1_l3',
    dayId: 'sun',
    subjId: 'history',
    text: 'تاريخ: مذاكرة الدرس الثالث الوحدة الأولى (أحمد سمير - سنتر الفشن)',
    priority: 'normal',
    contextInfo: 'محاضرة من الـ 82 (ا احمد سمير)'
  },

  // ==========================
  // الإثنين (MONDAY)
  // ==========================
  {
    id: 'task_mon_class_hist',
    dayId: 'mon',
    subjId: 'history',
    text: 'حضور سنتر التاريخ - مستر أحمد سمير (سنتر الفشن 1:00 ظهراً)',
    priority: 'class',
    contextInfo: 'الإثنين 1:00 ظهراً'
  },
  {
    id: 'task_mon_hist_u1_l4',
    dayId: 'mon',
    subjId: 'history',
    text: 'تاريخ: إنجاز الدرس الرابع الوحدة الأولى وحل تدريبات سنتر الفشن',
    priority: 'high',
    contextInfo: 'محاضرة من الـ 82 (ا احمد سمير)'
  },
  {
    id: 'task_mon_ar_txt_1',
    dayId: 'mon',
    subjId: 'arabic',
    text: 'عربي (مس تقوى): نصوص (أثر الكلمة وحفظ اللسان + بين الذوق والعقل + العلم نور)',
    priority: 'high',
    contextInfo: 'تصفية 3 نصوص من الـ 82'
  },
  {
    id: 'task_mon_ar_naat',
    dayId: 'mon',
    subjId: 'arabic',
    text: 'عربي: نحو (النعت السببي) وحل تدريباته مع شيت المشتقات',
    priority: 'urgent',
    contextInfo: 'درس نحو من الـ 82'
  },
  {
    id: 'task_mon_phy_w01',
    dayId: 'mon',
    subjId: 'physics',
    text: 'فيزياء: حل الورشة الأولى (الورشة الأولى 2 بكالوريا - أفكار وزارية على الميكانيكا)',
    priority: 'high',
    contextInfo: 'محاضرة من الـ 82 (باقة الفيزياء)'
  },

  // ==========================
  // الثلاثاء (TUESDAY)
  // ==========================
  {
    id: 'task_tue_class_ar',
    dayId: 'tue',
    subjId: 'arabic',
    text: 'حضور سنتر اللغة العربية - مس تقوى أحمد (4:00 عصراً)',
    priority: 'class',
    contextInfo: 'الثلاثاء 4:00 عصراً'
  },
  {
    id: 'task_tue_class_eng',
    dayId: 'tue',
    subjId: 'english',
    text: 'حضور سنتر اللغة الإنجليزية - مستر أيمن عبد العاطي (7:00 م - الميعاد الجديد!) 🚨',
    priority: 'class',
    contextInfo: 'الثلاثاء 7:00 مساءً'
  },
  {
    id: 'task_tue_eng_u3_l3',
    dayId: 'tue',
    subjId: 'english',
    text: 'إنجليزي: إنجاز الدرس الثالث الوحدة الثالثة + حروف الجر المتلازمة',
    priority: 'high',
    contextInfo: 'محاضرة من الـ 82 (ا ايمن عبد عاطي)'
  },
  {
    id: 'task_tue_phy_91',
    dayId: 'tue',
    subjId: 'physics',
    text: 'فيزياء: المحاضرة (91) كمية التحرك والطاقة الميكانيكية وحل مسائل التصادمات',
    priority: 'high',
    contextInfo: 'محاضرة من الـ 82 (باقة الفيزياء)'
  },

  // ==========================
  // الأربعاء (WEDNESDAY)
  // ==========================
  {
    id: 'task_wed_phy_kepler_12',
    dayId: 'wed',
    subjId: 'physics',
    text: 'منصة فيزياء أ. محمد عبد المعبود: المحاضرة (12) قوانين كبلر والجاذبية الكونية',
    priority: 'class',
    contextInfo: 'تنزل الأربعاء على المنصة'
  },
  {
    id: 'task_wed_ar_eve_prep',
    dayId: 'wed',
    subjId: 'arabic',
    text: '🚨 ليلة الامتحان: مراجعة شاملة للوحدة الثانية عربي والنحو والبلاغة تمهيداً لامتحان الجوائز غداً',
    priority: 'urgent',
    contextInfo: 'مراجعة ليلة امتحان الجوائز والتكريم'
  },
  {
    id: 'task_wed_ar_stories',
    dayId: 'wed',
    subjId: 'arabic',
    text: 'عربي: قراءة ومراجعة فصول القصة (كفاح طيبة + عودة روح + حكايات الغريب)',
    priority: 'high',
    contextInfo: 'تصفية 3 فصول قصة من الـ 82'
  },
  {
    id: 'task_wed_eng_u3_l4',
    dayId: 'wed',
    subjId: 'english',
    text: 'إنجليزي: الدرس الرابع الوحدة الثالثة + عبارات التناقض (Although, However, In spite of)',
    priority: 'high',
    contextInfo: 'محاضرتان من الـ 82 (ا ايمن عبد عاطي)'
  },

  // ==========================
  // الخميس (THURSDAY)
  // ==========================
  {
    id: 'task_thu_ar_exam_prize',
    dayId: 'thu',
    subjId: 'arabic',
    text: '🏆 امتحان لغة عربية شامل معتمد على الوحدة الثانية (امتحان الجوائز والتكريم للمتفوقين) 🎯',
    priority: 'exam',
    contextInfo: 'إلزامي تحقيق 95%+ لانتزاع شهادة التكريم والجائزة'
  },
  {
    id: 'task_thu_class_hist',
    dayId: 'thu',
    subjId: 'history',
    text: 'حضور سنتر التاريخ - مستر أحمد سمير (سنتر الفشن 1:00 ظهراً)',
    priority: 'class',
    contextInfo: 'الخميس 1:00 ظهراً'
  },
  {
    id: 'task_thu_hist_u2_l1',
    dayId: 'thu',
    subjId: 'history',
    text: 'تاريخ: إنجاز الدرس الأول الوحدة الثانية (أحمد سمير - سنتر الفشن)',
    priority: 'high',
    contextInfo: 'محاضرة من الـ 82 (ا احمد سمير)'
  },
  {
    id: 'task_thu_eng_u3_eve',
    dayId: 'thu',
    subjId: 'english',
    text: 'إنجليزي: مراجعة نهائية ليلة امتحان Unit 3 الشامل وحل نموذجين تدريبيين',
    priority: 'urgent',
    contextInfo: 'التجهيز لامتحان الغد الشامل وقفل 50/50'
  },
  {
    id: 'task_thu_phy_w02',
    dayId: 'thu',
    subjId: 'physics',
    text: 'فيزياء: حل الورشة الثانية (ورشة الميكانيكا 2 بكالوريا - بنك الأسئلة المتقدم)',
    priority: 'high',
    contextInfo: 'محاضرة من الـ 82 (باقة الفيزياء)'
  },

  // ==========================
  // الجمعة (FRIDAY)
  // ==========================
  {
    id: 'task_fri_eng_exam_prize',
    dayId: 'fri',
    subjId: 'english',
    text: '🏆 امتحان لغة إنجليزية شامل معتمد على الوحدة الثالثة Unit 3 (تقفيل 50/50 وجائزة التميز) 🎯',
    priority: 'exam',
    contextInfo: 'امتحان شامل Unit 3 بالكامل لتقفيل 100%'
  },
  {
    id: 'task_fri_phy_eval_1_5',
    dayId: 'fri',
    subjId: 'physics',
    text: 'فيزياء: حل التقييمات الأسبوعية الوزارية من 1 لـ 5 بالكامل ومراجعة نماذج الإجابة',
    priority: 'high',
    contextInfo: 'محاضرة من الـ 82 (باقة الفيزياء)'
  },
  {
    id: 'task_fri_phy_harmonic_13',
    dayId: 'fri',
    subjId: 'physics',
    text: 'فيزياء: المحاضرة (13) الحركة التوافقية البسيطة والتردد والزمن الدوري',
    priority: 'normal',
    contextInfo: 'محاضرة من الـ 82 (باقة الفيزياء)'
  },
  {
    id: 'task_fri_ar_expressions',
    dayId: 'fri',
    subjId: 'arabic',
    text: 'عربي (مس تقوى): إنهاء دروس التعبير الثلاثة (الفقرة المعلوماتية + النقدية + الحجاجية)',
    priority: 'normal',
    contextInfo: 'تصفية 3 دروس تعبير من الـ 82'
  },
  {
    id: 'task_fri_weekly_audit',
    dayId: 'fri',
    subjId: 'arabic',
    text: 'تقييم الحصاد الأسبوعي مع المراقب الذكي وتسجيل درجات الامتحانين وبدء سبرنت الأسبوع الثاني',
    priority: 'normal',
    contextInfo: 'جلسة تقييم وتخطيط الأسبوع الثاني'
  },

  // ==========================
  // سبرنت المتراكم (BACKLOG SPRINT)
  // تصفية باقي المحاضرات المتبقية بالأسبوع القادم
  // ==========================
  {
    id: 'task_backlog_phy_w3',
    dayId: 'backlog',
    subjId: 'physics',
    text: 'فيزياء (المتراكم): إنهاء الورشة الثالثة ومراجعة قوانين نيوتن والجاذبية',
    priority: 'high',
    contextInfo: 'محاضرة من الـ 82 (باقة الفيزياء)'
  },
  {
    id: 'task_backlog_ar_lec5_6',
    dayId: 'backlog',
    subjId: 'arabic',
    text: 'عربي (المتراكم): إنهاء المحاضرة الخامسة والمحاضرة السادسة من باقة العربي',
    priority: 'high',
    contextInfo: 'محاضرتان من الـ 82 (باقة العربي)'
  },
  {
    id: 'task_backlog_ar_lec7_8',
    dayId: 'backlog',
    subjId: 'arabic',
    text: 'عربي (المتراكم): إنهاء المحاضرة السابعة والمحاضرة الثامنة من باقة العربي',
    priority: 'high',
    contextInfo: 'محاضرتان من الـ 82 (باقة العربي)'
  },
  {
    id: 'task_backlog_ar_txt_tech',
    dayId: 'backlog',
    subjId: 'arabic',
    text: 'عربي (المتراكم): نصوص (التقنية وصناعة الرأي العام + الخلق جوهر الفضيلة + العلم والقانون)',
    priority: 'normal',
    contextInfo: 'تصفية 3 نصوص من الـ 82 (مس تقوى)'
  },
  {
    id: 'task_backlog_ar_stories_2',
    dayId: 'backlog',
    subjId: 'arabic',
    text: 'عربي (المتراكم): قراءة وتحليل قصتي (شمس وليل + الأرض)',
    priority: 'normal',
    contextInfo: 'قصتان من الـ 82 (مس تقوى)'
  },
  {
    id: 'task_backlog_eng_u2_lessons',
    dayId: 'backlog',
    subjId: 'english',
    text: 'إنجليزي (المتراكم): تصفية دروس الوحدة الثانية (الدرس الثاني + الثالث + الرابع)',
    priority: 'high',
    contextInfo: '3 دروس من الـ 82 (ا ايمن عبد عاطي)'
  },
  {
    id: 'task_backlog_eng_u1_lessons',
    dayId: 'backlog',
    subjId: 'english',
    text: 'إنجليزي (المتراكم): تصفية دروس الوحدة الأولى (الدرس الثاني + الثالث + الرابع)',
    priority: 'normal',
    contextInfo: '3 دروس من الـ 82 (ا ايمن عبد عاطي)'
  },
  {
    id: 'task_backlog_hist_u2_l2_l3',
    dayId: 'backlog',
    subjId: 'history',
    text: 'تاريخ (المتراكم): إنهاء الدرس الثاني والدرس الثالث من الوحدة الثانية تاريخ',
    priority: 'high',
    contextInfo: 'درسان من الـ 82 (ا احمد سمير)'
  }
];

db.data.weeklyTasks = organizedTasks;
db.version = (db.version || 1) + 1;
db.lastUpdated = Date.now();

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Successfully written organized tasks to database.json!');
console.log('Total tasks:', organizedTasks.length);

const FIREBASE_RTDB_URL = 'https://shapap-13c58-default-rtdb.firebaseio.com/shapap';

async function syncTasksToFirebase() {
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}/weeklyTasks.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(organizedTasks)
    });
    console.log('Firebase weeklyTasks push status:', res.status);
  } catch (err) {
    console.error('Firebase error:', err);
  }
}

syncTasksToFirebase();
