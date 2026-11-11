import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 1. BRAND-NEW SPRINT SCHEDULE (THIS WEEK & NEXT WEEK)
const newWeeklyTasks = [
  // --- SATURDAY (السبت) ---
  {
    id: 'task_sat_1',
    dayId: 'sat',
    subjId: 'english',
    text: 'حضور سنتر اللغة الإنجليزية - مستر أيمن عبد العاطي (7:00 مساءً - الميعاد الجديد!) 🚨',
    priority: 'class',
    contextInfo: 'السبت 7:00 مساءً (الميعاد الجديد بدلاً من الإثنين)'
  },
  {
    id: 'task_sat_2',
    dayId: 'sat',
    subjId: 'english',
    text: 'حفظ وإتقان كلمات وقراءة Unit 3 بالكامل تمهيداً لحصة السنتر وامتحان الوحدة 3',
    priority: 'high',
    contextInfo: 'Unit 3 Vocab & Reading'
  },
  {
    id: 'task_sat_3',
    dayId: 'sat',
    subjId: 'physics',
    text: 'فيزياء: إنهاء المحاضرة (1) كمية التحرك وقانون نيوتن الثاني + حل 30 مسألة',
    priority: 'high',
    contextInfo: 'تصفية أول محاضرة من المتراكم'
  },
  {
    id: 'task_sat_4',
    dayId: 'sat',
    subjId: 'history',
    text: 'تاريخ: مذاكرة الفتح الإسلامي لمصر وأحوال مصر قبل وبعد الفتح (أ. أحمد سمير)',
    priority: 'normal',
    contextInfo: 'تثبيت التواريخ وأسباب الفتح'
  },

  // --- SUNDAY (الأحد) ---
  {
    id: 'task_sun_1',
    dayId: 'sun',
    subjId: 'physics',
    text: 'منصة أ. محمد عبد المعبود: محاضرة الحركة الدائرية والعجلة المركزية وقوة الجذب',
    priority: 'high',
    contextInfo: 'تنزل على المنصة الأحد'
  },
  {
    id: 'task_sun_2',
    dayId: 'sun',
    subjId: 'arabic',
    text: 'عربي: إتقان اسم الفاعل وصيغ المبالغة وشروط إعمالها (الوحدة الثانية)',
    priority: 'urgent',
    contextInfo: 'استعداداً لامتحان الوحدة الثانية ذو الجوائز'
  },
  {
    id: 'task_sun_3',
    dayId: 'sun',
    subjId: 'english',
    text: 'إنجليزي: حل تدريبات جرامر Unit 3 (أشكال المستقبل Future Forms & Continuous)',
    priority: 'normal',
    contextInfo: 'تثبيت قواعد الأزمنة'
  },
  {
    id: 'task_sun_4',
    dayId: 'sun',
    subjId: 'history',
    text: 'تاريخ: تلخيص أسباب استقلال الدولة الطولونية والإخشيدية وحل بنك الأسئلة',
    priority: 'normal',
    contextInfo: 'ربط العلاقات التاريخية'
  },

  // --- MONDAY (الإثنين) ---
  {
    id: 'task_mon_1',
    dayId: 'mon',
    subjId: 'history',
    text: 'حضور سنتر التاريخ - مستر أحمد سمير (سنتر الفشن 1:00 ظهراً)',
    priority: 'class',
    contextInfo: 'الإثنين 1:00 ظهراً'
  },
  {
    id: 'task_mon_2',
    dayId: 'mon',
    subjId: 'arabic',
    text: 'عربي: مذاكرة اسم المفعول والمصادر الصريحة والميمية والصناعية (الوحدة 2)',
    priority: 'urgent',
    contextInfo: 'الوحدة الثانية نحو وقراءة'
  },
  {
    id: 'task_mon_3',
    dayId: 'mon',
    subjId: 'physics',
    text: 'فيزياء: ورشة حل مسائل تطبيقات نيوتن الثاني والتصادمات وقانون بقاء كمية التحرك',
    priority: 'high',
    contextInfo: 'حل شيت المنصة والتريكات'
  },
  {
    id: 'task_mon_4',
    dayId: 'mon',
    subjId: 'english',
    text: 'إنجليزي: كتابة مقال Unit 3 وحل قطعتي فهم متحررة على الكلمات الجديدة',
    priority: 'normal',
    contextInfo: 'مهارات المقال والترجمة'
  },

  // --- TUESDAY (الثلاثاء) ---
  {
    id: 'task_tue_1',
    dayId: 'tue',
    subjId: 'english',
    text: 'حضور سنتر اللغة الإنجليزية - مستر أيمن عبد العاطي (7:00 مساءً - الميعاد الجديد!) 🚨',
    priority: 'class',
    contextInfo: 'الثلاثاء 7:00 مساءً (الميعاد الجديد بدلاً من الخميس)'
  },
  {
    id: 'task_tue_2',
    dayId: 'tue',
    subjId: 'arabic',
    text: 'حضور سنتر اللغة العربية - مس تقوى أحمد (4:00 عصراً)',
    priority: 'class',
    contextInfo: 'الثلاثاء 4:00 عصراً'
  },
  {
    id: 'task_tue_3',
    dayId: 'tue',
    subjId: 'english',
    text: 'كويز السنتر الأسبوعي للإنجليزي على كلمات وتريكات Unit 3 (المستهدف 100%)',
    priority: 'exam',
    contextInfo: 'كويز سنتر مستر أيمن'
  },
  {
    id: 'task_tue_4',
    dayId: 'tue',
    subjId: 'physics',
    text: 'فيزياء: مذاكرة الموائع الساكنة والكثافة والكثافة النسبية وتطبيقاتها الطبية',
    priority: 'high',
    contextInfo: 'محاضرة عبد المعبود'
  },

  // --- WEDNESDAY (الأربعاء) ---
  {
    id: 'task_wed_1',
    dayId: 'wed',
    subjId: 'physics',
    text: 'منصة أ. محمد عبد المعبود: محاضرة الضغط في باطن سائل والأنبوبة ذات الشعبتين',
    priority: 'high',
    contextInfo: 'تنزل على المنصة الأربعاء'
  },
  {
    id: 'task_wed_2',
    dayId: 'wed',
    subjId: 'arabic',
    text: '🚨 ليلة الامتحان التكريمي: مراجعة شاملة للوحدة الثانية عربي (نحو وبلاغة ونصوص)',
    priority: 'urgent',
    contextInfo: 'استعداد تام لامتحان الجوائز والتكريم غداً'
  },
  {
    id: 'task_wed_3',
    dayId: 'wed',
    subjId: 'history',
    text: 'تاريخ: الدولة الفاطمية وجوهر الصقلي وبناء الجامع الأزهر والخرائط الذهنية',
    priority: 'normal',
    contextInfo: 'مراجعة أسباب النقل للقاهرة'
  },
  {
    id: 'task_wed_4',
    dayId: 'wed',
    subjId: 'english',
    text: 'إنجليزي: مراجعة حروف الجر والمتلازمات لـ Unit 3 لتفادي تكرار أخطاء الامتحانين السابقين',
    priority: 'high',
    contextInfo: 'سد ثغرات الـ 95%'
  },

  // --- THURSDAY (الخميس) ---
  {
    id: 'task_thu_1',
    dayId: 'thu',
    subjId: 'arabic',
    text: '🏆 امتحان لغة عربية شامل معتمد على الوحدة الثانية (امتحان الجوائز والتكريم للمتفوقين) 🎯',
    priority: 'exam',
    contextInfo: 'إلزامي تحقيق 95%+ لانتزاع شهادة التكريم والجائزة'
  },
  {
    id: 'task_thu_2',
    dayId: 'thu',
    subjId: 'history',
    text: 'حضور سنتر التاريخ - مستر أحمد سمير (سنتر الفشن 1:00 ظهراً)',
    priority: 'class',
    contextInfo: 'الخميس 1:00 ظهراً'
  },
  {
    id: 'task_thu_3',
    dayId: 'thu',
    subjId: 'physics',
    text: 'فيزياء: حل شيت الأنبوبة ذات الشعبتين ومسائل خلط السوائل المتعددة',
    priority: 'high',
    contextInfo: 'أفكار كتاب الامتحان وبنك المعرفة'
  },
  {
    id: 'task_thu_4',
    dayId: 'thu',
    subjId: 'english',
    text: 'إنجليزي: مراجعة ليلة الامتحان الشامل لـ Unit 3 وحل نموذجين تجريبيين',
    priority: 'urgent',
    contextInfo: 'التجهيز لامتحان الغد الشامل'
  },

  // --- FRIDAY (الجمعة) ---
  {
    id: 'task_fri_1',
    dayId: 'fri',
    subjId: 'english',
    text: '🏆 امتحان لغة إنجليزية شامل معتمد على الوحدة الثالثة Unit 3 (تقفيل 50/50 وجائزة التميز) 🎯',
    priority: 'exam',
    contextInfo: 'امتحان شامل الوحدة 3 بالكامل'
  },
  {
    id: 'task_fri_2',
    dayId: 'fri',
    subjId: 'physics',
    text: 'ماراثون كسر المتراكم (1): إنهاء ومذاكرة محاضرتين فيزياء متراكمة (الجاذبية الكونية)',
    priority: 'high',
    contextInfo: 'تصفية 2 من الـ 82 محاضرة'
  },
  {
    id: 'task_fri_3',
    dayId: 'fri',
    subjId: 'history',
    text: 'ماراثون كسر المتراكم (2): إنهاء ومذاكرة محاضرتين تاريخ (الحروب الصليبية وصلاح الدين)',
    priority: 'normal',
    contextInfo: 'تصفية 2 من الـ 82 محاضرة'
  },
  {
    id: 'task_fri_4',
    dayId: 'fri',
    subjId: 'arabic',
    text: 'تقييم الأسبوع مع المراقب الذكي وإدخال شهادات الامتحانين والتجهيز لجدول الأسبوع القادم',
    priority: 'normal',
    contextInfo: 'حصاد الأسبوع وتحديث السجل'
  },

  // --- BACKLOG SPRINT (تصفية باقي الـ 82 محاضرة) ---
  {
    id: 'task_backlog_1',
    dayId: 'backlog',
    subjId: 'physics',
    text: 'سبرنت إنقاذ الفيزياء: تصفية باقي محاضرات الموائع والبارومتر والمانومتر (10 محاضرات)',
    priority: 'urgent',
    contextInfo: 'موزعة بمعدل محاضرتين أسبوعياً'
  },
  {
    id: 'task_backlog_2',
    dayId: 'backlog',
    subjId: 'arabic',
    text: 'سبرنت إنقاذ العربي: تصفية بنك أسئلة النحو التراكمي وتطبيقات المشتقات والمصادر',
    priority: 'high',
    contextInfo: 'تطبيقات كتاب الامتحان والأضواء'
  },
  {
    id: 'task_backlog_3',
    dayId: 'backlog',
    subjId: 'english',
    text: 'سبرنت إنقاذ الإنجليزي: حل كشكول الواجب الشامل لـ Unit 1 و 2 وسد فجوات الأزمنة السابقة',
    priority: 'high',
    contextInfo: 'معالجة أخطاء الـ 43 والـ 44.5'
  },
  {
    id: 'task_backlog_4',
    dayId: 'backlog',
    subjId: 'history',
    text: 'سبرنت إنقاذ التاريخ: إنهاء محاضرات المماليك وجهاد المغول وعين جالوت وبنك الأسئلة',
    priority: 'normal',
    contextInfo: 'رفع ساعات التاريخ لمنع نزول المجموع'
  }
];

// 2. THE 82 PENDING LECTURES / LESSONS STRUCTURE
// 24 Physics + 22 Arabic + 20 English + 16 History = exactly 82 pending lectures!
const pendingLectures = [
  // --- PHYSICS (24 uncompleted lectures) ---
  {
    id: 'phy-p-01',
    code: 'محاضرة فيزياء (01)',
    subjId: 'physics',
    title: 'كمية التحرك والتصادمات وقانون نيوتن الثاني',
    details: 'شرح العلاقة بين كمية التحرك والكتلة والسرعة، واستنتاج صيغة قانون نيوتن الثاني F=dp/dt مع تطبيقات الرسم البياني',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة ميكانيكا الحركة والجاذبية (أ. عبد المعبود)',
    tag: 'متراكم حاسم',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-02',
    code: 'محاضرة فيزياء (02)',
    subjId: 'physics',
    title: 'تطبيقات قانون نيوتن الثاني ومسائل قوة الاحتكاك وحبل الشد',
    details: 'مسائل حركة الأجسام على المستويات الملساء والخشنة، وحساب العجلة المشتركة وحساب قوى الشد بين الكتل',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة ميكانيكا الحركة والجاذبية (أ. عبد المعبود)',
    tag: 'ورشة حل وتطبيقات',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-03',
    code: 'محاضرة فيزياء (03)',
    subjId: 'physics',
    title: 'الحركة الدائرية المنتظمة: مفهوم السرعة المماسية والعجلة المركزية',
    details: 'استنتاج قانون العجلة المركزية a=v^2/r، واتجاه متجه السرعة المماسية وعلاقة الزمن الدوري بالتردد ونصف القطر',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة ميكانيكا الحركة والجاذبية (أ. عبد المعبود)',
    tag: 'شرح أساسي',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-04',
    code: 'محاضرة فيزياء (04)',
    subjId: 'physics',
    title: 'القوة الجاذبة المركزية وأنواعها وتطبيقات المنعطفات',
    details: 'قوة الشد، قوة التجاذب المادي، قوى الاحتكاك، ورد الفعل العمودي للمنعطفات المائلة ومركبات القوى',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة ميكانيكا الحركة والجاذبية (أ. عبد المعبود)',
    tag: 'تطبيقات الأوائل',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-05',
    code: 'محاضرة فيزياء (05)',
    subjId: 'physics',
    title: 'قانون الجذب العام لنيوتن وثابت الجذب الكوني G',
    details: 'شرح التناسب الطردي مع الكتل والعكسي مع مربع المسافة، واستنتاج وحدة وأبعاد ثابت الجذب الكوني',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة ميكانيكا الحركة والجاذبية (أ. عبد المعبود)',
    tag: 'شرح مفاهيم',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-06',
    code: 'محاضرة فيزياء (06)',
    subjId: 'physics',
    title: 'شدة مجال الجاذبية (عجلة الجاذبية g) وتغيرها مع الارتفاع والعمق',
    details: 'حساب عجلة الجاذبية على أسطح الكواكب المختلفة والمقارنة بين كوكب الأرض والقمر والكتل السماوية',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة ميكانيكا الحركة والجاذبية (أ. عبد المعبود)',
    tag: 'مسائل استنتاجية',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-07',
    code: 'محاضرة فيزياء (07)',
    subjId: 'physics',
    title: 'الأقمار الاصطناعية: حساب السرعة المدارية والزمن الدوري للمدار',
    details: 'إثبات قانون السرعة المدارية للأقمار الاصطناعية v=sqrt(GM/r) والأقمار الثابتة فوق خط الاستواء واستخدامات الاتصالات',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة ميكانيكا الحركة والجاذبية (أ. عبد المعبود)',
    tag: 'قوانين ونظريات',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-08',
    code: 'محاضرة فيزياء (08)',
    subjId: 'physics',
    title: 'ورشة حل كتاب الامتحان على الجاذبية الكونية والأقمار الاصطناعية',
    details: 'حل تفصيلي لـ 45 مسألة اختيار من متعدد مع التريكات البيانية والنسب الرياضية بين أنصاف الأقطار',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة ميكانيكا الحركة والجاذبية (أ. عبد المعبود)',
    tag: 'حل بنك أسئلة',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-09',
    code: 'محاضرة فيزياء (09)',
    subjId: 'physics',
    title: 'مفهوم الشغل الفيزيائي W=F.d.cos(theta) وحالات انعدام الشغل',
    details: 'الشغل الموجب والسالب والصفري، وتطبيقات تحرك الأجسام عمودياً على اتجاه القوة الجاذبة المركزية',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة الشغل والطاقة والموائع (أ. عبد المعبود)',
    tag: 'تأسيس الشغل',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-10',
    code: 'محاضرة فيزياء (10)',
    subjId: 'physics',
    title: 'طاقة الحركة KE وطاقة الوضع PE وإثبات نظرية الشغل والطاقة',
    details: 'علاقة الشغل المبذول بالتغير في طاقة الحركة، وطاقة وضع الجاذبية وعلاقتها بالارتفاع عن سطح الأرض',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة الشغل والطاقة والموائع (أ. عبد المعبود)',
    tag: 'قوانين وإثباتات',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-11',
    code: 'محاضرة فيزياء (11)',
    subjId: 'physics',
    title: 'قانون بقاء الطاقة الميكانيكية وتطبيقات حركة البندول والمقذوفات',
    details: 'ثبات مجموع طاقتي الوضع والحركة في غياب الاحتكاك، ومسائل سقوط الأجسام وحساب السرعات عند مختلف الارتفاعات',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة الشغل والطاقة والموائع (أ. عبد المعبود)',
    tag: 'مستويات عليا',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-12',
    code: 'محاضرة فيزياء (12)',
    subjId: 'physics',
    title: 'ورشة حل شاملة على الشغل وبقاء الطاقة من بنك المعرفة المصري',
    details: 'حل مسائل المقذوفات الرأسية ومسائل العربات على المسارات المنحنية وتأثير قوى الاحتكاك الضائعة',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة الشغل والطاقة والموائع (أ. عبد المعبود)',
    tag: 'بنك المعرفة',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-13',
    code: 'محاضرة فيزياء (13)',
    subjId: 'physics',
    title: 'الموائع الساكنة: مفهوم الكثافة والكثافة النسبية وخلط السوائل',
    details: 'تعريف الكثافة رو=الكتلة/الحجم، الكثافة النسبية، قانون خلط السوائل التي لا تتفاعل دون تغير الحجم الكلي',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة الشغل والطاقة والموائع (أ. عبد المعبود)',
    tag: 'خواص المادة',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-14',
    code: 'محاضرة فيزياء (14)',
    subjId: 'physics',
    title: 'التطبيقات الحياتية والطبية للكثافة (بطاريات السيارات ونسبة الأنيميا)',
    details: 'قياس كثافة المحلول الإلكتروليتي في بطارية الرصاص، وقياس كثافة الدم والبول وتشخيص الأنيميا والأملاح',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة الشغل والطاقة والموائع (أ. عبد المعبود)',
    tag: 'تطبيقات طبية حيوية',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-15',
    code: 'محاضرة فيزياء (15)',
    subjId: 'physics',
    title: 'الضغط العام P=F/A وتطبيقات إطارات السيارات والمباني',
    details: 'الضغط والوحدات (النيوتن/م2 والبار والباسكال)، وتأثير مساحة التلامس على الضغط في الإطارات العريضة وإبر الحقن',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة الشغل والطاقة والموائع (أ. عبد المعبود)',
    tag: 'مفاهيم الضغط',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-16',
    code: 'محاضرة فيزياء (16)',
    subjId: 'physics',
    title: 'الضغط عند نقطة في باطن سائل ساكن P = P0 + rho.g.h',
    details: 'استنتاج قانون الضغط في باطن سائل، العوامل المؤثرة (الكثافة والعمق والضغط الجوي)، والتمثيل البياني',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة الشغل والطاقة والموائع (أ. عبد المعبود)',
    tag: 'استنتاج ورسم بياني',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-17',
    code: 'محاضرة فيزياء (17)',
    subjId: 'physics',
    title: 'الأواني المستطرقة وفكرة تساوي الضغط عند جميع النقاط في مستوى أفقي واحد',
    details: 'شرح الأساس العلمي لشبكات توزيع المياه والأبراج المائية والسدود وتصميم قواعد السدود العريضة',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة الشغل والطاقة والموائع (أ. عبد المعبود)',
    tag: 'قوانين الموائع',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-18',
    code: 'محاضرة فيزياء (18)',
    subjId: 'physics',
    title: 'الأنبوبة ذات الشعبتين (الجزء الأول): سائلين غير ممتزجين',
    details: 'اتزان السوائل في الأنبوبة، استنتاج h1.rho1 = h2.rho2 وتعيين الكثافة النسبية لسائل مجهول عملياً',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة الشغل والطاقة والموائع (أ. عبد المعبود)',
    tag: 'مسائل اتزان السوائل',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-19',
    code: 'محاضرة فيزياء (19)',
    subjId: 'physics',
    title: 'الأنبوبة ذات الشعبتين (الجزء الثاني): مسائل خلط 3 سوائل واختلاف مساحات المقاطع',
    details: 'مسائل المستويات العليا للأوائل: عند صب الزيت والزئبق والماء في فرع ضيق وحساب الارتفاع في الفرع المتسع',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة الشغل والطاقة والموائع (أ. عبد المعبود)',
    tag: 'تريكات الأوائل',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-20',
    code: 'محاضرة فيزياء (20)',
    subjId: 'physics',
    title: 'البارومتر الزئبقي (تورشيلي) وقياس الضغط الجوي المعتاد',
    details: 'فراغ تورشيلي، قيمة الضغط الجوي 76 سم زئبق، وتحويلات وحدات الضغط (تور، ضغط جوي، باسكال، بار)',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة الشغل والطاقة والموائع (أ. عبد المعبود)',
    tag: 'أجهزة قياس الضغط',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-21',
    code: 'محاضرة فيزياء (21)',
    subjId: 'physics',
    title: 'مسائل تعيين ارتفاع الجبال والمباني الشاهقة باستخدام البارومتر',
    details: 'قانون دلتا P زئبق = دلتا P هواء rho_Hg . delta_h_Hg = rho_air . H_mountain وحل 15 مسألة فنية',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة الشغل والطاقة والموائع (أ. عبد المعبود)',
    tag: 'مسائل الجبال والمباني',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-22',
    code: 'محاضرة فيزياء (22)',
    subjId: 'physics',
    title: 'المانومتر السائل (الزئبقي والمائي) وقياس ضغط غاز محبوس',
    details: 'حساب فرق الضغط delta_P وضغط الغاز P_gas في حالات تساوي الفرعين وارتفاع الفرع الخالص أو المستودع',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة الشغل والطاقة والموائع (أ. عبد المعبود)',
    tag: 'أجهزة الضغط المحبوس',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-23',
    code: 'محاضرة فيزياء (23)',
    subjId: 'physics',
    title: 'قاعدة باسكال وتطبيقات المكبس الهيدروليكي والفائدة الآلية',
    details: 'انتقال الضغط بتمامه في السوائل المحبوسة، صيغ الفائدة الآلية eta = F/f = A/a = y1/y2 = v1/v2، وكفاءة المكبس',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة الشغل والطاقة والموائع (أ. عبد المعبود)',
    tag: 'المكبس الهيدروليكي',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'phy-p-24',
    code: 'محاضرة فيزياء (24)',
    subjId: 'physics',
    title: 'الورشة الختامية وحل الامتحان الشامل على منهج الفيزياء (محاكاة نصف العام)',
    details: 'امتحان إلكتروني شامل 40 سؤال محاكاة للوزارة ومنصة عبد المعبود لتقفيل 100%',
    dueDay: 'الأحد / الأربعاء',
    packageId: 'physics_backlog',
    packageName: 'باقة الشغل والطاقة والموائع (أ. عبد المعبود)',
    tag: 'امتحان شامل وتقفيل',
    type: 'lecture',
    isDone: false
  },

  // --- ARABIC (22 uncompleted lectures) ---
  {
    id: 'ar-p-01',
    code: 'محاضرة عربي (01)',
    subjId: 'arabic',
    title: 'الوحدة الثانية: صياغة اسم الفاعل الثلاثي وغير الثلاثي وإعماله',
    details: 'شروط عمل اسم الفاعل المجرد من أل (الاعتماد على مبتدأ، نفي، استفهام، موصوف، نداء) وحالات المعمول',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات اللغة العربية - الوحدة الثانية (أ. محمد صلاح)',
    tag: 'نحو الوحدة 2',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-02',
    code: 'محاضرة عربي (02)',
    subjId: 'arabic',
    title: 'الوحدة الثانية: صيغ المبالغة القياسية الخمسة وشروط إعمالها',
    details: 'أوزان (مفعال، فعّال، فعول، فَعيل، فَعِل) وعملها عمل الفعل المبني للمعلوم ونصب المفعول به',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات اللغة العربية - الوحدة الثانية (أ. محمد صلاح)',
    tag: 'نحو الوحدة 2',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-03',
    code: 'محاضرة عربي (03)',
    subjId: 'arabic',
    title: 'الوحدة الثانية: اسم المفعول وصياغته ورفع نائب الفاعل',
    details: 'اسم المفعول من الفعل المبني للمجهول، صياغة الأجوف والناقص (مقضي، مبوع، مصون)، وإعراب المعمول',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات اللغة العربية - الوحدة الثانية (أ. محمد صلاح)',
    tag: 'نحو الوحدة 2',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-04',
    code: 'محاضرة عربي (04)',
    subjId: 'arabic',
    title: 'الوحدة الثانية: اسما الزمان والمكان والفروق الدقيقة في السياق',
    details: 'الصياغة على وزن مَفْعَل ومَفْعِل، وغير الثلاثي على وزن اسم المفعول، والتمييز بين المشتقات بالسياق الدلالي',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات اللغة العربية - الوحدة الثانية (أ. محمد صلاح)',
    tag: 'نحو الوحدة 2',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-05',
    code: 'محاضرة عربي (05)',
    subjId: 'arabic',
    title: 'الوحدة الثانية: اسما المرة والهيئة وشروط صياغتهما من الثلاثي وغيره',
    details: 'وزن فَعْلَة وفِعْلَة، واستخدام كلمة (واحدة) عند تشابه المصدر الصريح مع اسم المرة، وشواهد الامتحان',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات اللغة العربية - الوحدة الثانية (أ. محمد صلاح)',
    tag: 'نحو الوحدة 2',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-06',
    code: 'محاضرة عربي (06)',
    subjId: 'arabic',
    title: 'الوحدة الثانية: المصادر الصريحة القياسية (الرباعي والخماسي والسداسي)',
    details: 'أوزان مصادر الرباعي (إفعال، تفعيل، فعال ومفاعلة، فعللة وفعلال)، وأوزان الخماسي المبدوء بهمزة وصل أو تاء زائدة',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات اللغة العربية - الوحدة الثانية (أ. محمد صلاح)',
    tag: 'نحو الوحدة 2',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-07',
    code: 'محاضرة عربي (07)',
    subjId: 'arabic',
    title: 'الوحدة الثانية: المصدر الميمي والمصدر الصناعي والاسم المنسوب',
    details: 'صياغة المصدر الميمي وإحلال المصدر الصريح محله، وشروط المصدر الصناعي والفرق بينه وبين النعت المنسوب',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات اللغة العربية - الوحدة الثانية (أ. محمد صلاح)',
    tag: 'نحو الوحدة 2',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-08',
    code: 'محاضرة عربي (08)',
    subjId: 'arabic',
    title: 'الوحدة الثانية: جزم المضارع في جواب الطلب وأحكامه الدقيقة',
    details: 'شروط الجزم في جواب النهي (أن يكون أمراً محبوباً)، وجواب الأمر، وجواز الرفع، وفروق جمل الامتحان',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات اللغة العربية - الوحدة الثانية (أ. محمد صلاح)',
    tag: 'قواعد الأفعال',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-09',
    code: 'محاضرة عربي (09)',
    subjId: 'arabic',
    title: 'الوحدة الثانية: حالات اقتران جواب الشرط بالفاء (اسمية طلبية وبجامد...)',
    details: 'بيت الشعر الشهير، وإعراب الفعل المضارع المقترن بالفاء (يعرب حسب موقعه في الجملة)، ومحل الجملة من الإعراب',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات اللغة العربية - الوحدة الثانية (أ. محمد صلاح)',
    tag: 'قواعد الأفعال',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-10',
    code: 'محاضرة عربي (10)',
    subjId: 'arabic',
    title: 'الوحدة الثانية: أحكام توكيد الفعل بالنون وجوباً وجوازاً وامتناعاً',
    details: 'شروط الوجوب الأربعة (جواب قسم، متصل بلام القسم، دال على الاستقبال، مثبت)، وحالات الجواز مع الطلب، ونفي التوكيد',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات اللغة العربية - الوحدة الثانية (أ. محمد صلاح)',
    tag: 'أحكام التوكيد',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-11',
    code: 'محاضرة عربي (11)',
    subjId: 'arabic',
    title: 'بلاغة الوحدة الثانية: أسرار الإيجاز بالحذف والإيجاز بالقصر',
    details: 'حذف الفاعل، حذف المبتدأ، حذف المفعول به، حذف أداة النداء، وأغراض كل حذف في إثارة العقل والتشويق',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات البلاغة والنصوص (أ. محمد صلاح / مس تقوى)',
    tag: 'بلاغة تفاعلية',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-12',
    code: 'محاضرة عربي (12)',
    subjId: 'arabic',
    title: 'بلاغة الوحدة الثانية: صور الإطناب السبعة وأثرها في المعنى',
    details: 'ذكر الخاص بعد العام، ذكر العام بعد الخاص، الاعتراض، الترادف، التعليل، التذييل، والتكرار',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات البلاغة والنصوص (أ. محمد صلاح / مس تقوى)',
    tag: 'بلاغة تفاعلية',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-13',
    code: 'محاضرة عربي (13)',
    subjId: 'arabic',
    title: 'المحسنات البديعية اللفظية والمعنوية (جناس، حسن تقسيم، سجع، طباق، مقابلة)',
    details: 'تطبيقات على الأبيات الشعرية والنصوص النثرية وتحديد الأثر الموسيقي والدلالي في الامتحان',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات البلاغة والنصوص (أ. محمد صلاح / مس تقوى)',
    tag: 'محسنات بديعية',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-14',
    code: 'محاضرة عربي (14)',
    subjId: 'arabic',
    title: 'أدب: الغزل العفيف والغزل الصريح في العصر العباسي ورواده',
    details: 'أسباب ازدهار الغزل الصريح (أبو نواس ومطيع بن إياس) مقابل الغزل العفيف (العباس بن الأحنف) وخصائص الأسلوب',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات البلاغة والنصوص (أ. محمد صلاح / مس تقوى)',
    tag: 'أدب تاريخي',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-15',
    code: 'محاضرة عربي (15)',
    subjId: 'arabic',
    title: 'أدب: ملامح تطور الشعر في عصر الدويلات المستقلة والمدائح النبوية',
    details: 'أثر الحروب الصليبية وهجمات التتار على موضوعات الأدب، وظهور شعر الجهاد والمدائح النبوية (البوصيري)',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات البلاغة والنصوص (أ. محمد صلاح / مس تقوى)',
    tag: 'أدب تاريخي',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-16',
    code: 'محاضرة عربي (16)',
    subjId: 'arabic',
    title: 'نصوص متحررة: تحليل نص شعري غزل عفيف واستخراج الصور المركبة والمبتكرة',
    details: 'تطبيق عملي على استنتاج المغزى الضمني، العاطفة المسيطرة، وموسيقى الأبيات الظاهرة والخفية',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات البلاغة والنصوص (أ. محمد صلاح / مس تقوى)',
    tag: 'نصوص متحررة',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-17',
    code: 'محاضرة عربي (17)',
    subjId: 'arabic',
    title: 'قراءة متحررة: استراتيجيات تحديد الفكرة العامة والفكر الفرعية والتناقض',
    details: 'حل مقال علمي ومقال أدبي من امتحانات الوزارة والتدريب على نوع العلاقات (نتيجة، تعليل، تفصيل، استدراك)',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات البلاغة والنصوص (أ. محمد صلاح / مس تقوى)',
    tag: 'قراءة متحررة',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-18',
    code: 'محاضرة عربي (18)',
    subjId: 'arabic',
    title: 'التعبير الوظيفي والإبداعي: فن المقال ورسائل الدعوة وتجنب الأخطاء الإملائية',
    details: 'كيفية حصد الدرجة النهائية في سؤال التعبير، علامات الترقيم، وتفادي همزات الوصل والقطع الشائعة',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات البلاغة والنصوص (أ. محمد صلاح / مس تقوى)',
    tag: 'تعبير وكتابة',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-19',
    code: 'محاضرة عربي (19)',
    subjId: 'arabic',
    title: 'حل وتدريب كتاب الامتحان الشامل على الوحدة الثانية نحو (100 سؤال اختيار)',
    details: 'تطبيق مباشر وتصويب الأخطاء لكل مشتق وإعراب المعمول مع مستر محمد صلاح',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات اللغة العربية - الوحدة الثانية (أ. محمد صلاح)',
    tag: 'حل تدريبات مكثف',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-20',
    code: 'محاضرة عربي (20)',
    subjId: 'arabic',
    title: 'ورشة سنتر مس تقوى أحمد: تريكات أسئلة الأوائل في المشتقات والمصادر',
    details: 'حل أوراق عمل السنتر الخاصة بالفروق الخفية بين اسم الفاعل والمفعول واسم الزمان في الجمل المتطابقة',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات اللغة العربية - سنتر مس تقوى أحمد',
    tag: 'سنتر الفشن',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-21',
    code: 'محاضرة عربي (21)',
    subjId: 'arabic',
    title: '🚨 المراجعة الشاملة لليلة الامتحان التكريمي للوحدة الثانية (تفريغ الخرائط الذهنية)',
    details: 'تلخيص الوحدة في كبسولات مكثفة لمراجعة النحو والبلاغة والنصوص قبل الامتحان المعتمد ذو الجوائز',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات اللغة العربية - الوحدة الثانية (أ. محمد صلاح)',
    tag: 'مراجعة ليلة الامتحان',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'ar-p-22',
    code: 'محاضرة عربي (22)',
    subjId: 'arabic',
    title: '🏆 نموذج اختبار محاكاة شامل للوحدة الثانية (نموذج جوائز الأوائل 60 درجة)',
    details: 'امتحان كامل يحاكي مواصفات امتحان التكريم للتأكد من تخطي نسبة الـ 95% بجدارة',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'arabic_unit2',
    packageName: 'محاضرات اللغة العربية - الوحدة الثانية (أ. محمد صلاح)',
    tag: 'محاكاة الجوائز',
    type: 'lecture',
    isDone: false
  },

  // --- ENGLISH (20 uncompleted lectures) ---
  {
    id: 'eng-p-01',
    code: 'محاضرة إنجليزي (01)',
    subjId: 'english',
    title: 'Unit 3: Key Vocabulary & Collocations (المفردات الأساسية والمتلازمات اللفظية)',
    details: 'شرح كلمات الوحدة الثالثة، المتلازمات مع do و make و have و take، والمترادفات والمتضادات',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'كلمات ومتلازمات',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-02',
    code: 'محاضرة إنجليزي (02)',
    subjId: 'english',
    title: 'Unit 3: Reading Text & Listening Scripts Analysis (تحليل نصوص القراءة والاستماع)',
    details: 'استخراج التعبيرات الهامة والملاحظات اللغوية من نصوص كتاب الطالب والتدريبات',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'قراءة واستماع',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-03',
    code: 'محاضرة إنجليزي (03)',
    subjId: 'english',
    title: 'Unit 3: Future Forms Part 1 - Will vs Going to vs Present Continuous',
    details: 'الفروق الحاسمة: القرارات السريعة والتنبؤ بدون دليل، مقابل الخطط والنوايا والأدلة القائمة، والترتيبات المؤكدة',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'جرامر المستقبل',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-04',
    code: 'محاضرة إنجليزي (04)',
    subjId: 'english',
    title: 'Unit 3: Future Forms Part 2 - Future Continuous & Future Perfect (المستمر والتام)',
    details: 'قاعدة will be + v-ing للتعبير عن حدث مستمر في وقت محدد مستقبلاً، وقاعدة will have + p.p مع تعبيرات by next month',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'جرامر متقدم',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-05',
    code: 'محاضرة إنجليزي (05)',
    subjId: 'english',
    title: 'Unit 3: Phrasal Verbs & Preposition Traps (الأفعال الاصطلاحية وحروف الجر)',
    details: 'معالجة نقاط النزيف السابقة: أفعال carry on, look forward to, result in/from, depend on, insist on',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'سد ثغرات الامتحان',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-06',
    code: 'محاضرة إنجليزي (06)',
    subjId: 'english',
    title: 'Unit 3: Language Notes & Tricky Word Confusions (الفروق الدقيقة بين الكلمات)',
    details: 'الفروق بين achieve/reach/gain/win، و sensible/sensitive، و discover/invent/explore وتطبيقات الجمل الفنية',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'ملاحظات لغوية',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-07',
    code: 'محاضرة إنجليزي (07)',
    subjId: 'english',
    title: 'Advanced Writing Skills: Argumentative & Persuasive Essay Structure',
    details: 'مكونات المقال: Thesis Statement, Topic Sentences, Transition words (However, In addition, Consequently), Conclusion',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'مهارات المقال',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-08',
    code: 'محاضرة إنجليزي (08)',
    subjId: 'english',
    title: 'Translation Mastery: Contemporary Vocab & Sentence Structure (عربي/إنجليزي)',
    details: 'قواعد ترجمة الجملة الفعلية إلى اسمية، التعامل مع المضاف والمضاف إليه، وحل 30 جملة ترجمة حديثة',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'مهارات الترجمة',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-09',
    code: 'محاضرة إنجليزي (09)',
    subjId: 'english',
    title: 'Reading Comprehension Drills: Skimming, Scanning & Inference Tactics',
    details: 'حل 3 قطع متحررة من أصعب قطع امتحانات الثانوية العامة مع استنتاج معاني الكلمات الصعبة من السياق',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'قطع الفهم',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-10',
    code: 'محاضرة إنجليزي (10)',
    subjId: 'english',
    title: 'حل مذكرة الواجب الكاملة لـ Unit 3 مع مستر أيمن عبد العاطي',
    details: 'حل 120 سؤال اختيار من متعدد وتدقيق أسباب استبعاد الخيارات الخاطئة وتثبيت القواعد',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'حل الواجب',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-11',
    code: 'محاضرة إنجليزي (11)',
    subjId: 'english',
    title: 'Punctuation & Mechanics Workshop for New System Exam',
    details: 'قواعد الكوما والفاصلة المنقوطة والـ Hyphen وعلامات التنصيص وكيف تأتي في أسئلة الامتحان',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'علامات الترقيم',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-12',
    code: 'محاضرة إنجليزي (12)',
    subjId: 'english',
    title: 'Remedial Session: Unit 1 Past Mistakes & Tense Remediation',
    details: 'تشريح امتحان Unit 1 (الذي حصل فيه على 43/50) وتصحيح كل خطأ ضاعت فيه الدرجات لضمان عدم تكراره',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'علاج الأخطاء السابقة',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-13',
    code: 'محاضرة إنجليزي (13)',
    subjId: 'english',
    title: 'Remedial Session: Unit 2 Past Mistakes & Passive/Modal Remediation',
    details: 'تشريح امتحان Unit 2 (الذي حصل فيه على 44.5/50) ومراجعة المتلازمات وحروف الجر التي نقصت فيها الدرجات',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'علاج الأخطاء السابقة',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-14',
    code: 'محاضرة إنجليزي (14)',
    subjId: 'english',
    title: 'Unit 3: Center Weekly Quiz Simulation (محاكاة كويز السنتر الأسبوعي)',
    details: 'كويز سريع في 20 دقيقة يحاكي كويز سنتر السبت والثلاثاء 7:00 م لضمان قفل الدرجة النهائية',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'كويز السنتر',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-15',
    code: 'محاضرة إنجليزي (15)',
    subjId: 'english',
    title: 'Unit 4 Preview: Early Vocabulary & Theme Introduction',
    details: 'نظرة مسبقة على كلمات وقواعد الوحدة الرابعة لتكون متقدماً على السنتر بخطوة كاملة',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'تحضير مسبق',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-16',
    code: 'محاضرة إنجليزي (16)',
    subjId: 'english',
    title: 'Unit 4 Preview: Conditionals (If Clauses 0, 1, 2, 3) & Alternatives (Unless, In case)',
    details: 'تأسيس حالات إف الشرطية وبدائلها (Provided that, Should, Had, Were) لدخول الوحدة 4 بأعلى ثقة',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'تحضير مسبق',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-17',
    code: 'محاضرة إنجليزي (17)',
    subjId: 'english',
    title: 'High-Score Drills: 50 Tricky Questions on Future Tenses and Modals',
    details: 'تجميعة أسئلة المتفوقين من كتاب المعاصر وجيم وA1 لكسر أي سؤال غير مألوف',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'تريكات الأوائل',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-18',
    code: 'محاضرة إنجليزي (18)',
    subjId: 'english',
    title: 'Mock Comprehensive Exam 1 on Unit 3 (النموذج التجريبي الأول)',
    details: 'امتحان تجريبي كامل 50 درجة بوقت محدد 60 دقيقة وتصحيح فوري',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'امتحان تجريبي',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-19',
    code: 'محاضرة إنجليزي (19)',
    subjId: 'english',
    title: 'Mock Comprehensive Exam 2 on Unit 3 with Mr. Ayman\'s Signature Questions',
    details: 'النموذج التجريبي الثاني مركز على التريكات اللفظية والترجمة والمقال',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'امتحان تجريبي',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'eng-p-20',
    code: 'محاضرة إنجليزي (20)',
    subjId: 'english',
    title: '🏆 الماراثون النهائي لتقفيل امتحان الوحدة الثالثة Unit 3 (المستهدف: 50 من 50 والتكريم)',
    details: 'مراجعة الكبسولة النهائية لجميع المفردات والجرامر والمقال ليلة الامتحان الكبير',
    dueDay: 'السبت / الثلاثاء',
    packageId: 'english_unit3',
    packageName: 'منهج اللغة الإنجليزية - Unit 3 & Skills (مستر أيمن عبد العاطي)',
    tag: 'تقفيل الامتحان الكبير',
    type: 'lecture',
    isDone: false
  },

  // --- HISTORY (16 uncompleted lectures) ---
  {
    id: 'hist-p-01',
    code: 'محاضرة تاريخ (01)',
    subjId: 'history',
    title: 'مصر من الفتح الإسلامي حتى قيام الدول المستقلة',
    details: 'دوافع الفتح الإسلامي لمصر (دينية، عسكرية، اقتصادية)، خط سير جيش عمرو بن العاص من العريش حتى حصن بابليون والإسكندرية',
    dueDay: 'الإثنين / الخميس',
    packageId: 'history_course',
    packageName: 'منهج التاريخ الإسلامي والحضارة (أ. أحمد سمير - سنتر الفشن)',
    tag: 'تاريخ إسلامي',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'hist-p-02',
    code: 'محاضرة تاريخ (02)',
    subjId: 'history',
    title: 'أحوال مصر الاقتصادية والاجتماعية في عصر الولاة وتأسيس الفسطاط',
    details: 'إعادة حفر خليج تراجان (خليج أمير المؤمنين)، بناء مدينة الفسطاط، وتسامح المسلمين مع أقباط مصر وعودة البطريرك بنيامين',
    dueDay: 'الإثنين / الخميس',
    packageId: 'history_course',
    packageName: 'منهج التاريخ الإسلامي والحضارة (أ. أحمد سمير - سنتر الفشن)',
    tag: 'عصر الولاة',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'hist-p-03',
    code: 'محاضرة تاريخ (03)',
    subjId: 'history',
    title: 'الدولة الطولونية: أحمد بن طولون وتأسيس أول دولة مستقلة عن الخلافة العباسية',
    details: 'عوامل تثبيت حكم ابن طولون: شخصيته، ضعف الخلافة في بغداد، وموقع مصر وثرواتها، وبناء مدينة القطائع ومسجده الشهير',
    dueDay: 'الإثنين / الخميس',
    packageId: 'history_course',
    packageName: 'منهج التاريخ الإسلامي والحضارة (أ. أحمد سمير - سنتر الفشن)',
    tag: 'الدول المستقلة',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'hist-p-04',
    code: 'محاضرة تاريخ (04)',
    subjId: 'history',
    title: 'خمارويه بن أحمد بن طولون وتثبيت نفوذ الطولونيين وعلاقتهم بالخليفة المعتضد',
    details: 'معركة الطواحين، عقد الصلح وزواج قطر الندى، وتدهور الدولة بعد مقتل خمارويه وعودة مصر للتبعية العباسية المباشرة',
    dueDay: 'الإثنين / الخميس',
    packageId: 'history_course',
    packageName: 'منهج التاريخ الإسلامي والحضارة (أ. أحمد سمير - سنتر الفشن)',
    tag: 'الدول المستقلة',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'hist-p-05',
    code: 'محاضرة تاريخ (05)',
    subjId: 'history',
    title: 'الدولة الإخشيدية: محمد بن طغج الإخشيد وتصدي مصر للأخطار الخارجية',
    details: 'منح الخليفة العباسي لقب الإخشيد (ملك الملوك) لمحمد بن طغج لشجاعته في صد هجمات الفاطميين عن مصر وتأمين طريق الحج',
    dueDay: 'الإثنين / الخميس',
    packageId: 'history_course',
    packageName: 'منهج التاريخ الإسلامي والحضارة (أ. أحمد سمير - سنتر الفشن)',
    tag: 'الدول المستقلة',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'hist-p-06',
    code: 'محاضرة تاريخ (06)',
    subjId: 'history',
    title: 'كافور الإخشيدي وإدارة شؤون مصر وأسباب سقوط الدولة الإخشيدية',
    details: 'وصاية كافور على أبناء الإخشيد وحنكته الدبلوماسية، والاضطراب الاقتصادي الذي مهد لغزو الفاطميين بقيادة جوهر الصقلي',
    dueDay: 'الإثنين / الخميس',
    packageId: 'history_course',
    packageName: 'منهج التاريخ الإسلامي والحضارة (أ. أحمد سمير - سنتر الفشن)',
    tag: 'الدول المستقلة',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'hist-p-07',
    code: 'محاضرة تاريخ (07)',
    subjId: 'history',
    title: 'الدولة الفاطمية: جوهر الصقلي وتأسيس القاهرة والجامع الأزهر الشريف',
    details: 'سقوط الإخشيديين سنة 358 هـ، بناء عاصمة جديدة لتكون مقراً للخلافة الفاطمية، وقدوم المعز لدين الله الفاطمي إلى مصر',
    dueDay: 'الإثنين / الخميس',
    packageId: 'history_course',
    packageName: 'منهج التاريخ الإسلامي والحضارة (أ. أحمد سمير - سنتر الفشن)',
    tag: 'الدولة الفاطمية',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'hist-p-08',
    code: 'محاضرة تاريخ (08)',
    subjId: 'history',
    title: 'اتساع الدولة الفاطمية وبسط نفوذها على الشام والحجاز واليمن وصقلية',
    details: 'الصراع المذهبي والسياسي بين الفاطميين في القاهرة والعباسيين في بغداد، وتأمين الحدود البحرية في البحر المتوسط',
    dueDay: 'الإثنين / الخميس',
    packageId: 'history_course',
    packageName: 'منهج التاريخ الإسلامي والحضارة (أ. أحمد سمير - سنتر الفشن)',
    tag: 'الدولة الفاطمية',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'hist-p-09',
    code: 'محاضرة تاريخ (09)',
    subjId: 'history',
    title: 'ضعف الدولة الفاطمية وعصر الوزراء (صراع شاور ودرغام واستنجاد الصليبيين)',
    details: 'استنجاد شاور بنور الدين محمود في الشام، واستنجاد درغام بعموري ملك بيت المقدس الصليبي، ودور أسد الدين شيركوه وصلاح الدين',
    dueDay: 'الإثنين / الخميس',
    packageId: 'history_course',
    packageName: 'منهج التاريخ الإسلامي والحضارة (أ. أحمد سمير - سنتر الفشن)',
    tag: 'ضعف الفاطميين',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'hist-p-10',
    code: 'محاضرة تاريخ (10)',
    subjId: 'history',
    title: 'الحروب الصليبية: الحملة الصليبية الأولى وظهور الإمارات الصليبية في المشرق',
    details: 'أسباب ودوافع الحروب الصليبية (دينية واقتصادية واجتماعية)، وتأسيس إمارات الرها وأنطاكية وطرابلس ومملكة بيت المقدس',
    dueDay: 'الإثنين / الخميس',
    packageId: 'history_course',
    packageName: 'منهج التاريخ الإسلامي والحضارة (أ. أحمد سمير - سنتر الفشن)',
    tag: 'الحروب الصليبية',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'hist-p-11',
    code: 'محاضرة تاريخ (11)',
    subjId: 'history',
    title: 'صلاح الدين الأيوبي ومعركة حطين الخالدة (583 هـ) وتحرير بيت المقدس',
    details: 'توحيد جبهة مصر والشام، خطة معركة حطين وعزل الصليبيين عن بحيرة طبرية، ودخول القدس وتسامح صلاح الدين مع أهلها',
    dueDay: 'الإثنين / الخميس',
    packageId: 'history_course',
    packageName: 'منهج التاريخ الإسلامي والحضارة (أ. أحمد سمير - سنتر الفشن)',
    tag: 'الدولة الأيوبية',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'hist-p-12',
    code: 'محاضرة تاريخ (12)',
    subjId: 'history',
    title: 'الدولة الأيوبية بعد صلاح الدين ومواجهة الحملتين الصليبيتين الخامسة والسابعة',
    details: 'الملك العادل والملك الكامل والحملة على دمياط، والحملة السابعة بقيادة لويس التاسع ملك فرنسا ومعركة المنصورة وأسر لويس في دار ابن لقمان',
    dueDay: 'الإثنين / الخميس',
    packageId: 'history_course',
    packageName: 'منهج التاريخ الإسلامي والحضارة (أ. أحمد سمير - سنتر الفشن)',
    tag: 'الدولة الأيوبية',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'hist-p-13',
    code: 'محاضرة تاريخ (13)',
    subjId: 'history',
    title: 'قيام دولة المماليك: شجر الدر وعز الدين أيبك وبناء القوة العسكرية في مصر',
    details: 'مقتل توران شاه، تولي شجر الدر الحكم ثم تنازلها لعز الدين أيبك، ومفهوم المماليك البحرية والمماليك البرجية',
    dueDay: 'الإثنين / الخميس',
    packageId: 'history_course',
    packageName: 'منهج التاريخ الإسلامي والحضارة (أ. أحمد سمير - سنتر الفشن)',
    tag: 'دولة المماليك',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'hist-p-14',
    code: 'محاضرة تاريخ (14)',
    subjId: 'history',
    title: 'سيف الدين قطز ومعركة عين جالوت (658 هـ) وإنقاذ الحضارة الإسلامية من المغول',
    details: 'سقوط بغداد على يد هولاكو، رسالة التهديد لقطز، وحدة الشعب والجيش وإعلان الجهاد، خطة المعركة وصيحة واإسلاماه!',
    dueDay: 'الإثنين / الخميس',
    packageId: 'history_course',
    packageName: 'منهج التاريخ الإسلامي والحضارة (أ. أحمد سمير - سنتر الفشن)',
    tag: 'عين جالوت',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'hist-p-15',
    code: 'محاضرة تاريخ (15)',
    subjId: 'history',
    title: 'الظاهر بيبرس والسلطان قلاوون وتصفية الوجود الصليبي وإحياء الخلافة العباسية بمصر',
    details: 'استرداد أنطاكية وحصن الأكراد، إحياء الخلافة العباسية بالقاهرة، وفتح عكا على يد الأشرف خليل بن قلاوون وإنهاء الصليبيين تماماً',
    dueDay: 'الإثنين / الخميس',
    packageId: 'history_course',
    packageName: 'منهج التاريخ الإسلامي والحضارة (أ. أحمد سمير - سنتر الفشن)',
    tag: 'جهاد المماليك',
    type: 'lecture',
    isDone: false
  },
  {
    id: 'hist-p-16',
    code: 'محاضرة تاريخ (16)',
    subjId: 'history',
    title: 'ورشة الخرائط الذهنية وحل بنك أسئلة التاريخ لسنتر الفشن (محاكاة امتحان نصف العام)',
    details: 'حل 80 سؤال استنتاجي يربط بين الشخصيات والأحداث التاريخية وسؤال مقالي تحليلي للتفوق وضمان الـ 95%+',
    dueDay: 'الإثنين / الخميس',
    packageId: 'history_course',
    packageName: 'منهج التاريخ الإسلامي والحضارة (أ. أحمد سمير - سنتر الفشن)',
    tag: 'حل بنك أسئلة',
    type: 'lecture',
    isDone: false
  }
];

// Keep previously completed foundation lectures if any
const existingDoneLectures = (db.data.lectures || []).filter(l => l.isDone);

// If there were no prior done lectures, keep the 4 core foundation ones
const foundationDone = existingDoneLectures.length > 0 ? existingDoneLectures : [
  {
    code: "المحاضرة (00)",
    details: "أساسيات النحو، مفاتيح الإعراب، وتأسيس علم البيان والبديع والمعاني",
    dueDay: "السبت / الثلاثاء",
    id: "ar-00",
    isDone: true,
    packageId: "arabic_course",
    packageName: "محاضرات اللغة العربية (أ. محمد صلاح)",
    subjId: "arabic",
    tag: "تأسيس معتمد",
    title: "المحاضرة الصفرية (تأسيس البلاغة والنحو)",
    type: "lecture"
  },
  {
    code: "المحاضرة (01)",
    details: "مدرسة الإحياء والبعث، التشبيه والاستعارة، ووحدة النحو الأولى (همزة الوصل والقطع)",
    dueDay: "السبت / الثلاثاء",
    id: "ar-01",
    isDone: true,
    packageId: "arabic_course",
    packageName: "محاضرات اللغة العربية (أ. محمد صلاح)",
    subjId: "arabic",
    tag: "مكتملة",
    title: "المحاضرة الأولى: أدب وبلاغة ونحو شامل",
    type: "lecture"
  },
  {
    code: "المحاضرة (01)",
    details: "شرح متجهات السرعة ومفهوم السرعة النسبية وتطبيقات الحركة في خط مستقيم",
    dueDay: "الأحد / الأربعاء",
    id: "phy-01-a",
    isDone: true,
    packageId: "physics_3m",
    packageName: "باقة الفيزياء (الثلاث شهور الأولى)",
    subjId: "physics",
    tag: "مكتملة",
    title: "متجهات السرعة والسرعة النسبية",
    type: "lecture"
  }
];

// Combine foundation done + the 82 pending lectures
const allLectures = [...foundationDone, ...pendingLectures];

// Apply to db
db.data.weeklyTasks = newWeeklyTasks;
db.data.completedTaskIds = [];
db.data.lectures = allLectures;
db.version = (db.version || 1) + 1;
db.lastUpdated = Date.now();

// Write backup and new file
fs.writeFileSync(dbPath + '.bak', fs.readFileSync(dbPath));
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

console.log('Successfully updated database.json:');
console.log('Total weekly tasks:', newWeeklyTasks.length);
console.log('Total lectures:', allLectures.length);
console.log('Undone lectures count:', allLectures.filter(l => !l.isDone).length);
