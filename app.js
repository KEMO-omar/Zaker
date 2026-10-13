/**
 * SHAPAP | Kareem Workspace - Core Engine
 * Complete interactive study suite with continuous spirals, multi-gauge counters,
 * session persistence across reloads, wasted time calculations, and lesson exemptions.
 */

// --- FIREBASE CLOUD INTEGRATION ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBMBd9C41EyU7kWi06CVMgXrYFBVAvU1v8",
  authDomain: "shapap-13c58.firebaseapp.com",
  databaseURL: "https://shapap-13c58-default-rtdb.firebaseio.com",
  projectId: "shapap-13c58",
  storageBucket: "shapap-13c58.firebasestorage.app",
  messagingSenderId: "818487036065",
  appId: "1:818487036065:web:350734adcc4fcd779c48e0",
  measurementId: "G-8L138W57KK"
};

let firebaseApp = null;
let rtdb = null;
let sessionsDbRef = null;
let exemptionsDbRef = null;
let isFirebaseConnected = false;

// --- SUBJECTS CONFIGURATION ---
const DEFAULT_SUBJECTS = [
  { id: 'history', name: 'تاريخ', color: '#10b981', targetMinutes: 120, icon: 'book-open' },
  { id: 'arabic', name: 'لغة عربية', color: '#f59e0b', targetMinutes: 150, icon: 'feather' },
  { id: 'english', name: 'لغة إنجليزية', color: '#38bdf8', targetMinutes: 90, icon: 'globe' },
  { id: 'physics', name: 'فيزياء', color: '#818cf8', targetMinutes: 180, icon: 'atom' },
];

// SVG Icon Generator (Strictly vector icons, no emojis)
function getSvgIcon(name, size = 18) {
  const icons = {
    'sparkles': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
    'timer': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    'history': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>`,
    'flame': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
    'book-open': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    'feather': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>`,
    'globe': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    'atom': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.4-2.4 2.4-6.3 0-8.7L12 3.3 3.8 11.5c-2.4 2.4-2.4 6.3 0 8.7 2.4 2.4 6.3 2.4 8.7 0l7.7-7.7"/><path d="m3.8 3.8c-2.4 2.4-2.4 6.3 0 8.7l8.2 8.2 8.2-8.2c2.4-2.4 2.4-6.3 0-8.7-2.4-2.4-6.3-2.4-8.7 0L3.8 3.8"/></svg>`,
    'play': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    'pause': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
    'stop': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`,
    'coffee': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
    'cloud-rain': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>`,
    'alert-triangle': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    'plus': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    'check': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    'trash': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    'refresh': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
    'settings': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  };
  return icons[name] || '';
}

// Load and merge all legacy (v2) and current (v3) sessions so past history is preserved 100%
function loadInitialSessions() {
  const v3 = JSON.parse(localStorage.getItem('kareem_sessions_v3') || '[]');
  const v2 = JSON.parse(localStorage.getItem('kareem_sessions_v2') || '[]');
  const map = new Map();
  v2.forEach(s => {
    if (s && (s.minutes || s.tsStart)) {
      const key = s.id || (s.tsStart ? `ts_${s.tsStart}` : `rnd_${Math.random()}`);
      map.set(key, s);
    }
  });
  v3.forEach(s => {
    if (s && (s.minutes || s.tsStart)) {
      const key = s.id || (s.tsStart ? `ts_${s.tsStart}` : `rnd_${Math.random()}`);
      map.set(key, s);
    }
  });
  const merged = Array.from(map.values());
  // Keep both local storage keys in sync
  try {
    localStorage.setItem('kareem_sessions_v3', JSON.stringify(merged));
    localStorage.setItem('kareem_sessions_v2', JSON.stringify(merged));
  } catch(e) {}
  return merged;
}

// --- WEEKLY TASKS DATA & ENGINE ---
const DEFAULT_WEEKLY_TASKS = [
  // السبت (نزول محاضرة العربي 4:00 عصراً + تحضير)
  { id: 41, dayId: 'sat', subjId: 'arabic', text: 'حضور وسماع محاضرة العربي الجديدة أ. محمد صلاح (4:00 م)', priority: 'class', contextInfo: 'تنزل السبت 4:00 عصراً' },
  { id: 42, dayId: 'sat', subjId: 'arabic', text: 'تدوين ملاحظات محاضرة العربي وتلخيص النحو والبلاغة', priority: 'high' },
  { id: 43, dayId: 'sat', subjId: 'physics', text: 'تجهيز شيتات فيزياء الأسبوع وترتيب جدول المذاكرة', priority: 'normal' },

  // الأحد (فيزياء منصة + مهام)
  { id: 1, dayId: 'sun', subjId: 'physics', text: 'متابعة وحضور فيزياء منصة أ. محمد عبد المعبود', priority: 'class', contextInfo: 'منصة الفيزياء الأحد', overlay: { top: 19.2, height: 3.6, left: 73.2, width: 22.8 } },
  { id: 2, dayId: 'sun', subjId: 'physics', text: 'مذاكرة اتزان القوى وحل (الواجب + امتحان)', priority: 'normal', overlay: { top: 23.3, height: 3.6, left: 73.2, width: 22.8 } },
  { id: 3, dayId: 'sun', subjId: 'physics', text: 'مذاكرة القدرة و الكفاءة وحل (الواجب + امتحان)', priority: 'normal', overlay: { top: 27.3, height: 3.6, left: 73.2, width: 22.8 } },
  { id: 4, dayId: 'sun', subjId: 'arabic', text: 'مذاكرة الجزء الثاني من الأسلوب الإنشائي والإطناب', priority: 'normal', overlay: { top: 31.4, height: 3.6, left: 73.2, width: 22.8 } },
  { id: 5, dayId: 'sun', subjId: 'arabic', text: 'إنهاء المحاضرة (2) أ. محمد صلاح', priority: 'normal', overlay: { top: 35.5, height: 3.6, left: 73.2, width: 22.8 } },
  { id: 6, dayId: 'sun', subjId: 'arabic', text: 'مذاكرة درس العلم نور وحل تدريباته', priority: 'normal', overlay: { top: 39.5, height: 3.6, left: 73.2, width: 22.8 } },
  { id: 7, dayId: 'sun', subjId: 'english', text: 'حفظ كلمات الدرس الثاني والثالث الوحدة الأولى', priority: 'normal', overlay: { top: 43.6, height: 3.6, left: 73.2, width: 22.8 } },
  { id: 10, dayId: 'sun', subjId: 'arabic', text: 'إنهاء المحاضرة (3) أ. محمد صلاح ومذاكرة الخلق', priority: 'normal', overlay: { top: 55.8, height: 3.6, left: 73.2, width: 22.8 } },
  { id: 13, dayId: 'sun', subjId: 'arabic', text: 'مذاكرة قاعدة المشتقات وقصة حكايات الغريب', priority: 'normal', overlay: { top: 68.0, height: 3.6, left: 73.2, width: 22.8 } },
  { id: 14, dayId: 'sun', subjId: 'english', text: 'حفظ كلمات الوحدة الثانية استعداداً لدرس الاثنين', priority: 'high', overlay: { top: 72.1, height: 3.6, left: 73.2, width: 22.8 } },

  // الاثنين (تاريخ 1:00 ظهراً + إنجليزي 7:00 مساءً)
  { id: 18, dayId: 'mon', subjId: 'history', text: 'مذاكرة درس التحولات الكبرى ومراجعة ملزمة التاريخ', priority: 'high', contextInfo: 'قبل سنتر التاريخ 1:00 ظ', overlay: { top: 32.5, height: 8.5, left: 50.8, width: 21.2 } },
  { id: 20, dayId: 'mon', subjId: 'history', text: 'الذهاب لدرس التاريخ 1:00 ظهراً 🏛️', priority: 'class', contextInfo: 'سنتر التاريخ 1:00 ظهراً', overlay: { top: 52.5, height: 8.5, left: 50.8, width: 21.2 } },
  { id: 21, dayId: 'mon', subjId: 'english', text: 'مراجعة قاعدة الأفعال والواجب قبل درس الإنجليزي', priority: 'urgent', contextInfo: 'ضروري إنهاؤها قبل 7:00 م', overlay: { top: 62.5, height: 8.5, left: 50.8, width: 21.2 } },
  { id: 22, dayId: 'mon', subjId: 'english', text: 'الذهاب لدرس الإنجليزي 7:00 مساءً 🌐', priority: 'class', contextInfo: 'سنتر الإنجليزي 7:00 مساءً', overlay: { top: 72.5, height: 8.5, left: 50.8, width: 21.2 } },
  { id: 23, dayId: 'mon', subjId: 'physics', text: 'سماع ورشة مستر محمد عبد المعبود', priority: 'high', overlay: { top: 82.5, height: 8.5, left: 50.8, width: 21.2 } },

  // الثلاثاء (عربي 4:00 عصراً - تسليم الواجب)
  { id: 24, dayId: 'tue', subjId: 'arabic', text: 'حل وإنهاء واجب المحاضرة العربي بالكامل قبل الحصة', priority: 'urgent', contextInfo: 'تسليم الواجب اليوم' },
  { id: 33, dayId: 'tue', subjId: 'arabic', text: 'الذهاب لدرس العربي 4:00 عصراً 📖', priority: 'class', contextInfo: 'سنتر العربي 4:00 عصراً', overlay: { top: 88.6, height: 5.2, left: 27.5, width: 22.5 } },
  { id: 25, dayId: 'tue', subjId: 'arabic', text: 'مذاكرة درس العلم بين القانون والضمير وقصة عودة الروح', priority: 'normal', overlay: { top: 39.0, height: 5.2, left: 27.5, width: 22.5 } },
  { id: 27, dayId: 'tue', subjId: 'physics', text: 'تجهيز واستعداد لمحاضرة فيزياء المنصة للأربعاء', priority: 'normal', overlay: { top: 51.4, height: 5.2, left: 27.5, width: 22.5 } },

  // الأربعاء (فيزياء منصة)
  { id: 34, dayId: 'wed', subjId: 'physics', text: 'حضور وسماع محاضرة فيزياء منصة أ. محمد عبد المعبود ⚛️', priority: 'class', contextInfo: 'منصة الفيزياء الأربعاء', overlay: { top: 32.8, height: 7.2, left: 4.2, width: 22.5 } },
  { id: 35, dayId: 'wed', subjId: 'physics', text: 'مذاكرة تفاصيل المحاضرة وتلخيص القوانين', priority: 'normal', overlay: { top: 41.0, height: 7.2, left: 4.2, width: 22.5 } },
  { id: 36, dayId: 'wed', subjId: 'physics', text: 'حل واجب شيت فيزياء المنصة', priority: 'high', overlay: { top: 49.2, height: 7.2, left: 4.2, width: 22.5 } },
  { id: 40, dayId: 'wed', subjId: 'arabic', text: 'مذاكرة الهمزات والتاءات والياءات وحل تدريبات النحو', priority: 'normal', overlay: { top: 82.0, height: 7.2, left: 4.2, width: 22.5 } },

  // الخميس (تاريخ 1:00 ظهراً + إنجليزي 7:00 مساءً)
  { id: 44, dayId: 'thu', subjId: 'history', text: 'الذهاب لدرس التاريخ 1:00 ظهراً 🏛️', priority: 'class', contextInfo: 'درس تاريخ 1:00 ظهراً' },
  { id: 45, dayId: 'thu', subjId: 'english', text: 'مذاكرة كلمات وقواعد الإنجليزي والذهاب 7:00 مساءً 🌐', priority: 'class', contextInfo: 'درس إنجليزي 7:00 مساءً' },
  { id: 43, dayId: 'thu', subjId: 'physics', text: 'مراجعة شاملة لاختبار الفيزياء الأسبوعي', priority: 'exam', contextInfo: 'امتحان فيزياء شامل الخميس' },

  // الجمعة (مراجعة وتجهيز حر)
  { id: 46, dayId: 'fri', subjId: 'arabic', text: 'حل قطع بلاغة ونصوص متحررة أسبوعية', priority: 'normal' },
  { id: 47, dayId: 'fri', subjId: 'physics', text: 'مراجعة كمية التحرك ومسائل المتفوقين', priority: 'high' },
  { id: 48, dayId: 'backlog', subjId: 'history', text: 'تلخيص الفصل الأول تاريخ ومراجعة الخرائط المتراكمة', priority: 'normal' }
];

// --- LECTURES DATA & ENGINE (PHYSICS 3-MONTH PACKAGE + ARABIC) ---
const DEFAULT_LECTURES = [
  // باقة الفيزياء (الثلاث شهور الأولى - 14 عنصر)
  {
    id: 'phy-01-a',
    packageId: 'physics_3m',
    packageName: 'باقة الفيزياء (الثلاث شهور الأولى)',
    subjId: 'physics',
    code: 'المحاضرة (01)',
    title: 'متجهات السرعة والسرعة النسبية',
    details: 'شرح متجهات السرعة ومفهوم السرعة النسبية وتطبيقات الحركة في خط مستقيم',
    type: 'lecture',
    isDone: true,
    tag: 'منتهية الصلاحية',
    dueDay: 'الأحد / الأربعاء'
  },
  {
    id: 'phy-01-b',
    packageId: 'physics_3m',
    packageName: 'باقة الفيزياء (الثلاث شهور الأولى)',
    subjId: 'physics',
    code: 'المحاضرة (01)',
    title: 'متجهات السرعة والسرعة النسبية ٢',
    details: 'الجزء الثاني من متجهات السرعة وتدريبات متقدمة على مسائل السرعة النسبية',
    type: 'lecture',
    isDone: true,
    tag: 'منتهية الصلاحية',
    dueDay: 'الأحد / الأربعاء'
  },
  {
    id: 'phy-02',
    packageId: 'physics_3m',
    packageName: 'باقة الفيزياء (الثلاث شهور الأولى)',
    subjId: 'physics',
    code: 'المحاضرة (02)',
    title: 'حركة المقذوفات الأفقية',
    details: 'معادلات الحركة في بعدين وحساب المدى الأفقي وزمن التحليق والسرعة اللحظية',
    type: 'lecture',
    isDone: true,
    tag: 'منتهية الصلاحية',
    dueDay: 'الأحد / الأربعاء'
  },
  {
    id: 'phy-03',
    packageId: 'physics_3m',
    packageName: 'باقة الفيزياء (الثلاث شهور الأولى)',
    subjId: 'physics',
    code: 'المحاضرة (03)',
    title: 'حركة المقذوفات بزاوية',
    details: 'تحليل السرعة الابتدائية لمركبتين أفقية ورأسية وزاوية الإطلاق وأقصى ارتفاع',
    type: 'lecture',
    isDone: true,
    tag: 'منتهية الصلاحية',
    dueDay: 'الأحد / الأربعاء'
  },
  {
    id: 'phy-rev-1',
    packageId: 'physics_3m',
    packageName: 'باقة الفيزياء (الثلاث شهور الأولى)',
    subjId: 'physics',
    code: 'هدية مراجعة',
    title: 'مراجعة حركة المقذوفات',
    details: 'مراجعة شاملة وأسئلة تفكير عليا على المقذوفات الأفقية وبزاوية',
    type: 'review',
    isDone: false,
    tag: 'اشترك الآن',
    dueDay: 'الأحد / الأربعاء'
  },
  {
    id: 'phy-04',
    packageId: 'physics_3m',
    packageName: 'باقة الفيزياء (الثلاث شهور الأولى)',
    subjId: 'physics',
    code: 'المحاضرة (04)',
    title: 'عزم القوة',
    details: 'مفهوم العزم، ذراع القوة، شروط الاتزان وقاعدة اليد اليمنى وحساب العزوم',
    type: 'lecture',
    isDone: true,
    tag: 'منتهية الصلاحية',
    dueDay: 'الأحد / الأربعاء'
  },
  {
    id: 'phy-05',
    packageId: 'physics_3m',
    packageName: 'باقة الفيزياء (الثلاث شهور الأولى)',
    subjId: 'physics',
    code: 'المحاضرة (05)',
    title: 'اتزان القوى',
    details: 'الاتزان الانتقالي والدوراني وشروط اتزان جسم صلب تحت تأثير عدة قوى متلاقية وغير متلاقية',
    type: 'lecture',
    isDone: true,
    tag: 'منتهية الصلاحية',
    dueDay: 'الأحد / الأربعاء'
  },
  {
    id: 'phy-06',
    packageId: 'physics_3m',
    packageName: 'باقة الفيزياء (الثلاث شهور الأولى)',
    subjId: 'physics',
    code: 'المحاضرة (06)',
    title: 'القدرة والكفاءة',
    details: 'تعريف القدرة ووحداتها، القدرة اللحظية والمتوسطة، حساب الشغل، وكفاءة الآلات الميكانيكية',
    type: 'lecture',
    isDone: true,
    tag: 'منتهية الصلاحية',
    dueDay: 'الأحد / الأربعاء'
  },
  {
    id: 'phy-07',
    packageId: 'physics_3m',
    packageName: 'باقة الفيزياء (الثلاث شهور الأولى)',
    subjId: 'physics',
    code: 'المحاضرة (07)',
    title: 'كمية التحرك والدفع',
    details: 'العلاقة بين الدفع وكمية التحرك، التغير في الزخم الخطي ومنحنى القوة والزمن',
    type: 'lecture',
    isDone: false,
    tag: 'اشترك الآن',
    dueDay: 'الأحد / الأربعاء'
  },
  {
    id: 'phy-exam-01',
    packageId: 'physics_3m',
    packageName: 'باقة الفيزياء (الثلاث شهور الأولى)',
    subjId: 'physics',
    code: 'الامتحان الشامل',
    title: 'الامتحان الشامل 01',
    details: 'اختبار تقييمي شامل على كل ما سبق دراسته في الفيزياء حتى المحاضرة السادسة',
    type: 'exam',
    isDone: true,
    tag: 'منتهية الصلاحية',
    dueDay: 'الأحد / الأربعاء'
  },
  {
    id: 'phy-08',
    packageId: 'physics_3m',
    packageName: 'باقة الفيزياء (الثلاث شهور الأولى)',
    subjId: 'physics',
    code: 'المحاضرة (08)',
    title: 'حفظ كمية التحرك',
    details: 'قانون حفظ كمية التحرك والتصادمات المرنة وغير المرنة في بعد واحد وحل مسائل الارتداد',
    type: 'lecture',
    isDone: false,
    tag: 'اشترك الآن',
    dueDay: 'الأحد / الأربعاء'
  },
  {
    id: 'phy-ws-01',
    packageId: 'physics_3m',
    packageName: 'باقة الفيزياء (الثلاث شهور الأولى)',
    subjId: 'physics',
    code: 'الورشة 01',
    title: 'الورشة الأولي 2 بكالوريا',
    details: 'ورشة عمل وتدريبات أفكار امتحانات وزارية على الميكانيكا ومسائل الربط',
    type: 'workshop',
    isDone: false,
    tag: 'اشترك الآن',
    dueDay: 'الأحد / الأربعاء'
  },
  {
    id: 'phy-09',
    packageId: 'physics_3m',
    packageName: 'باقة الفيزياء (الثلاث شهور الأولى)',
    subjId: 'physics',
    code: 'المحاضرة (09)',
    title: 'كمية التحرك والطاقة الميكانيكية',
    details: 'الربط بين الزخم وطاقة الحركة ونظرية الشغل والطاقة في التصادمات والأنظمة المعزولة',
    type: 'lecture',
    isDone: false,
    tag: 'اشترك الآن',
    dueDay: 'الأحد / الأربعاء'
  },
  {
    id: 'phy-ws-02',
    packageId: 'physics_3m',
    packageName: 'باقة الفيزياء (الثلاث شهور الأولى)',
    subjId: 'physics',
    code: 'الورشة 02',
    title: 'الورشة الثانية (ورشة الميكانيكا) 2 بكالوريا',
    details: 'حل بنك أسئلة الميكانيكا المتقدمة ومسائل المتفوقين في الفيزياء',
    type: 'workshop',
    isDone: false,
    tag: 'اشترك الآن',
    dueDay: 'الأحد / الأربعاء'
  },

  // محاضرات اللغة العربية (من الصفرية للرابعة - أ. محمد صلاح)
  {
    id: 'ar-00',
    packageId: 'arabic_course',
    packageName: 'محاضرات اللغة العربية (أ. محمد صلاح)',
    subjId: 'arabic',
    code: 'المحاضرة (00)',
    title: 'المحاضرة الصفرية (تأسيس البلاغة والنحو)',
    details: 'أساسيات النحو، مفاتيح الإعراب، وتأسيس علم البيان والبديع والمعاني',
    type: 'lecture',
    isDone: true,
    tag: 'السبت محاضرة / الثلاثاء واجب',
    dueDay: 'السبت / الثلاثاء'
  },
  {
    id: 'ar-01',
    packageId: 'arabic_course',
    packageName: 'محاضرات اللغة العربية (أ. محمد صلاح)',
    subjId: 'arabic',
    code: 'المحاضرة (01)',
    title: 'المحاضرة الأولى: أدب وبلاغة ونحو شامل',
    details: 'مدرسة الإحياء والبعث، التشبيه والاستعارة، ووحدة النحو الأولى (همزة الوصل والقطع)',
    type: 'lecture',
    isDone: true,
    tag: 'السبت محاضرة / الثلاثاء واجب',
    dueDay: 'السبت / الثلاثاء'
  },
  {
    id: 'ar-02',
    packageId: 'arabic_course',
    packageName: 'محاضرات اللغة العربية (أ. محمد صلاح)',
    subjId: 'arabic',
    code: 'المحاضرة (02)',
    title: 'المحاضرة الثانية: الإطناب والأسلوب الإنشائي ودرس العلم نور',
    details: 'شرح الأسلوب الإنشائي والخبري، صور الإطناب، وقراءة متحررة',
    type: 'lecture',
    isDone: true,
    tag: 'السبت محاضرة / الثلاثاء واجب',
    dueDay: 'السبت / الثلاثاء'
  },
  {
    id: 'ar-03',
    packageId: 'arabic_course',
    packageName: 'محاضرات اللغة العربية (أ. محمد صلاح)',
    subjId: 'arabic',
    code: 'المحاضرة (03)',
    title: 'المحاضرة الثالثة: المشتقات وقصة حكايات الغريب والخلق',
    details: 'اسم الفاعل وصيغ المبالغة واسم المفعول وإعمال المشتقات مع النصوص',
    type: 'lecture',
    isDone: true,
    tag: 'السبت محاضرة / الثلاثاء واجب',
    dueDay: 'السبت / الثلاثاء'
  },
  {
    id: 'ar-04',
    packageId: 'arabic_course',
    packageName: 'محاضرات اللغة العربية (أ. محمد صلاح)',
    subjId: 'arabic',
    code: 'المحاضرة (04)',
    title: 'المحاضرة الرابعة: النحو الشامل وقصة عودة الروح والعلم والضمير',
    details: 'اسم التفضيل واسم الزمان والمكان والمصدر الصريح والمؤول وقصة عودة الروح',
    type: 'lecture',
    isDone: true,
    tag: 'السبت محاضرة / الثلاثاء واجب',
    dueDay: 'السبت / الثلاثاء'
  }
];

function loadSavedWeeklyTasks() {
  const saved = localStorage.getItem('kareem_weekly_tasks_v3');
  if (saved) {
    try { return JSON.parse(saved); } catch(e) {}
  }
  return DEFAULT_WEEKLY_TASKS;
}

function loadSavedCompletedTaskIds() {
  const legacy = localStorage.getItem('backlog_4days_tasks_v1');
  const v2 = localStorage.getItem('kareem_completed_task_ids_v2');
  const set = new Set();
  if (legacy) {
    try { JSON.parse(legacy).forEach(id => set.add(id)); } catch(e) {}
  }
  if (v2) {
    try { JSON.parse(v2).forEach(id => set.add(id)); } catch(e) {}
  }
  return set;
}

function loadSavedLectures() {
  const saved = localStorage.getItem('kareem_lectures_v2');
  if (saved) {
    try { return JSON.parse(saved); } catch(e) {}
  }
  return DEFAULT_LECTURES;
}

function persistLectures() {
  try {
    localStorage.setItem('kareem_lectures_v2', JSON.stringify(state.lectures));
  } catch(e) {}
}

// App State
const state = {
  subjects: JSON.parse(localStorage.getItem('kareem_subjects') || 'null') || DEFAULT_SUBJECTS,
  sessions: loadInitialSessions(),
  lessonExemptions: JSON.parse(localStorage.getItem('kareem_exemptions_today') || '[]'),
  weeklyTasks: loadSavedWeeklyTasks(),
  completedTaskIds: loadSavedCompletedTaskIds(),
  lectures: loadSavedLectures(),
  activeLectureFilter: 'all',
  activeDayFilter: 'all',
  showPoster: false,
  dayStartHour: 8, // Day considered starting at 8:00 AM
  activeSession: null, // Restored from localStorage if exists
  breakTimer: null,
  vizMode: localStorage.getItem('kareem_viz_mode') || 'spiral', // 'spiral' | 'rings' | 'flame' | 'cyber'
  displayTimeMode: localStorage.getItem('kareem_display_mode') || 'allTime', // 'allTime' | 'today'
  quotes: [],
  currentQuoteIdx: 0,
  quoteTimer: null,
  rainAudio: null,
  isRainPlaying: false
};

// --- SESSION STORAGE & REFRESH RECOVERY ---
function persistActiveSession() {
  if (state.activeSession) {
    localStorage.setItem('kareem_active_session_v3', JSON.stringify({
      startTs: state.activeSession.startTs,
      elapsedBefore: state.activeSession.elapsedBefore,
      breakStart: state.activeSession.breakStart,
      subjId: state.activeSession.subjId,
      task: state.activeSession.task
    }));
  } else {
    localStorage.removeItem('kareem_active_session_v3');
  }
}

function restoreActiveSession() {
  const saved = localStorage.getItem('kareem_active_session_v3');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      state.activeSession = {
        startTs: data.startTs,
        elapsedBefore: data.elapsedBefore || 0,
        breakStart: data.breakStart || null,
        subjId: data.subjId || 'history',
        task: data.task || '',
        timerInt: null
      };
      
      // If was in break
      if (state.activeSession.breakStart) {
        showBreakModal(true);
      }
      
      startActiveTimer();
      showView('focusView');
      toast('تم استعادة جلستك الحالية بنجاح!', 'check');
    } catch (e) {
      console.error('Session restore failed', e);
      localStorage.removeItem('kareem_active_session_v3');
    }
  }
}

// --- MATH & TIMER CALCULATIONS ---
function getActiveSessionSeconds() {
  if (!state.activeSession) return 0;
  if (state.activeSession.breakStart) {
    return Math.floor(state.activeSession.elapsedBefore / 1000);
  }
  const currentRunning = Date.now() - state.activeSession.startTs;
  return Math.floor((state.activeSession.elapsedBefore + currentRunning) / 1000);
}

function fmtClock(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fmtHM(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} دقيقة`;
  return `${h} س و ${m} د`;
}

function fmtHMEn(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

// Total study minutes today
function getStudyMinutesToday() {
  const today = new Date().toDateString();
  const pastMins = state.sessions
    .filter(s => new Date(s.tsEnd).toDateString() === today)
    .reduce((acc, s) => acc + (s.minutes || 0), 0);
    
  const currentMins = state.activeSession ? Math.floor(getActiveSessionSeconds() / 60) : 0;
  return pastMins + currentMins;
}

// Study minutes this week (Sat through Fri)
function getStudyMinutesThisWeek() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
  const daysSinceSat = (dayOfWeek + 1) % 7;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceSat, 0, 0, 0);

  const past = state.sessions
    .filter(s => new Date(s.tsEnd) >= startOfWeek)
    .reduce((acc, s) => acc + (s.minutes || 0), 0);
  const current = state.activeSession ? Math.floor(getActiveSessionSeconds() / 60) : 0;
  return past + current;
}

// Study minutes this month
function getStudyMinutesThisMonth() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

  const past = state.sessions
    .filter(s => new Date(s.tsEnd) >= startOfMonth)
    .reduce((acc, s) => acc + (s.minutes || 0), 0);
  const current = state.activeSession ? Math.floor(getActiveSessionSeconds() / 60) : 0;
  return past + current;
}

// Productivity Score Calculation (out of 100)
function calculateProductivityScore() {
  const todayMins = getStudyMinutesToday();
  const wasted = calculateWastedTime();
  
  const totalTasks = state.weeklyTasks.length;
  const doneTasks = state.completedTaskIds.size;
  const taskPct = totalTasks > 0 ? (doneTasks / totalTasks) : 0.5;

  const awake = wasted.awakeMinutes || 1;
  const productive = wasted.studyMins + wasted.exemptMins;
  const efficiencyRate = Math.min(100, Math.round((productive / awake) * 100));

  const studyScore = Math.min(50, Math.round((todayMins / 360) * 50));
  const wastedScore = Math.max(0, Math.round((1 - (wasted.wastedPercentage / 100)) * 30));
  const taskScore = Math.round(taskPct * 20);

  const totalScore = Math.min(100, Math.max(10, studyScore + wastedScore + taskScore));

  let rank = 'متقدم 🛡️';
  if (totalScore >= 90) rank = 'أسطوري 👑';
  else if (totalScore >= 75) rank = 'فوق العادة ⚡';
  else if (totalScore >= 55) rank = 'محارب صامد ⚔️';
  else rank = 'يحتاج شحن 🔥';

  return {
    score: totalScore,
    rank,
    efficiencyRate
  };
}

// Synthesizer Chime Sound for Task Completion
function playChimeSound(isSuccess = true) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isSuccess ? 'triangle' : 'sine';
    if (isSuccess) {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12);
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.25);
    } else {
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.18);
    }
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch(e) {}
}

// Confetti Effect
function triggerConfetti() {
  const container = document.body;
  for (let i = 0; i < 35; i++) {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.zIndex = '9999';
    el.style.width = '8px';
    el.style.height = '8px';
    el.style.backgroundColor = ['#56c2a6', '#63b3ed', '#f59e0b', '#ef5350', '#a78bfa'][Math.floor(Math.random() * 5)];
    el.style.borderRadius = '50%';
    el.style.left = `${50 + (Math.random() - 0.5) * 40}%`;
    el.style.top = '60%';
    el.style.pointerEvents = 'none';
    el.style.transition = 'all 1s cubic-bezier(0.1, 1, 0.1, 1)';
    container.appendChild(el);
    setTimeout(() => {
      el.style.transform = `translate(${(Math.random() - 0.5) * 450}px, -${150 + Math.random() * 280}px) scale(${Math.random() + 0.5})`;
      el.style.opacity = '0';
    }, 10);
    setTimeout(() => el.remove(), 1200);
  }
}

// All-time study minutes (كله في كله - التراكمي الشامل)
function getAllTimeStudyMinutes() {
  const pastMins = state.sessions.reduce((acc, s) => acc + (s.minutes || 0), 0);
  const currentMins = state.activeSession ? Math.floor(getActiveSessionSeconds() / 60) : 0;
  return pastMins + currentMins;
}

// All-time minutes for a specific subject
function getSubjectAllTimeMinutes(subjId) {
  const past = state.sessions.reduce((acc, s) => {
    const en = (s.entries || []).find(e => e.subj === subjId);
    return acc + (en ? (s.minutes || 0) : 0);
  }, 0);
  let current = 0;
  if (state.activeSession && state.activeSession.subjId === subjId) {
    current = Math.floor(getActiveSessionSeconds() / 60);
  }
  return past + current;
}

// Total lesson exemption minutes today
function getExemptMinutesToday() {
  const today = new Date().toDateString();
  return state.lessonExemptions
    .filter(e => new Date(e.timestamp).toDateString() === today)
    .reduce((acc, e) => acc + e.minutes, 0);
}

// Wasted Time of Day Calculation
function calculateWastedTime() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), state.dayStartHour, 0, 0);
  
  let awakeMinutes = Math.floor((now - startOfDay) / (1000 * 60));
  if (awakeMinutes < 0) awakeMinutes = 0; // before dayStartHour
  
  const studyMins = getStudyMinutesToday();
  const exemptMins = getExemptMinutesToday();
  const productiveMins = studyMins + exemptMins;
  
  let wastedMins = awakeMinutes - productiveMins;
  if (wastedMins < 0) wastedMins = 0;
  
  const wastedPercentage = awakeMinutes > 0 ? Math.min(100, Math.round((wastedMins / awakeMinutes) * 100)) : 0;
  const isTragic = wastedMins >= 180 || wastedPercentage >= 65; // Over 3 hours or > 65% wasted
  
  return {
    awakeMinutes,
    studyMins,
    exemptMins,
    wastedMins,
    wastedPercentage,
    isTragic
  };
}

// --- VISUALIZATIONS (Canvas Drawing with 4 Supercharged Modes) ---
const mainCanvas = document.getElementById('mainVisualizerCanvas');
const mainCtx = mainCanvas ? mainCanvas.getContext('2d') : null;

// Ambient floating particles for visual depth
const ambientParticles = Array.from({ length: 18 }, () => ({
  x: Math.random(),
  y: Math.random(),
  speed: 0.15 + Math.random() * 0.35,
  size: 1 + Math.random() * 2,
  alpha: 0.2 + Math.random() * 0.5
}));

function drawMainVisualizer() {
  if (!mainCanvas || !mainCtx) return;
  const rect = mainCanvas.getBoundingClientRect();
  const size = Math.floor(rect.width * (window.devicePixelRatio || 1));
  
  // Guard: if canvas is hidden (e.g., in other tabs) or not yet laid out, skip drawing this frame
  if (size <= 20) {
    requestAnimationFrame(drawMainVisualizer);
    return;
  }

  if (mainCanvas.width !== size) {
    mainCanvas.width = size;
    mainCanvas.height = size;
  }
  
  const ctx = mainCtx;
  const cx = size / 2;
  const cy = size / 2;
  ctx.clearRect(0, 0, size, size);
  
  const todayMins = getStudyMinutesToday();
  const allTimeMins = getAllTimeStudyMinutes();
  const activeDisplayMins = state.displayTimeMode === 'today' ? todayMins : allTimeMins;
  const t = performance.now() / 1000;
  
  const style = getComputedStyle(document.body);
  const primaryColor = style.getPropertyValue('--accent-primary').trim() || '#56c2a6';
  const secondaryColor = style.getPropertyValue('--accent-secondary').trim() || '#63b3ed';
  
  // Ambient Star Dust
  ambientParticles.forEach(p => {
    p.y -= (p.speed * 0.002);
    if (p.y < 0) p.y = 1;
    ctx.beginPath();
    ctx.arc(p.x * size, p.y * size, Math.max(0.5, p.size * (window.devicePixelRatio || 1)), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.25})`;
    ctx.fill();
  });

  if (state.vizMode === 'spiral') {
    // MODE 1: Archimedean Connected Helix Ribbon with smooth math
    const maxRadius = Math.max(10, size * 0.44);
    const baseR = Math.max(2, size * 0.08);
    const turns = 3.5;
    const RING_MINUTES = 300;
    const progressRings = Math.min(turns, Math.max(0.08, activeDisplayMins / RING_MINUTES));
    
    // Background faint spiral path
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 4 * (window.devicePixelRatio || 1);
    for (let theta = 0; theta < Math.PI * 2 * turns; theta += 0.05) {
      const r = baseR + (maxRadius - baseR) * (theta / (Math.PI * 2 * turns));
      const x = cx + Math.cos(theta) * r;
      const y = cy + Math.sin(theta) * r;
      if (theta === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Active glowing spiral line
    ctx.save();
    ctx.beginPath();
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, primaryColor);
    grad.addColorStop(1, secondaryColor);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 5.5 * (window.devicePixelRatio || 1);
    ctx.lineCap = 'round';
    ctx.shadowBlur = 18 * (window.devicePixelRatio || 1);
    ctx.shadowColor = primaryColor;
    
    const activeMaxTheta = Math.PI * 2 * progressRings;
    for (let theta = 0; theta <= activeMaxTheta; theta += 0.04) {
      const r = baseR + (maxRadius - baseR) * (theta / (Math.PI * 2 * turns));
      const wobble = Math.sin(theta * 2 - t) * (size * 0.003);
      const x = cx + Math.cos(theta + t * 0.05) * (r + wobble);
      const y = cy + Math.sin(theta + t * 0.05) * (r + wobble);
      if (theta === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Head Particle orb with breathing halo
    const headTheta = activeMaxTheta;
    const headR = baseR + (maxRadius - baseR) * (headTheta / (Math.PI * 2 * turns));
    const hx = cx + Math.cos(headTheta + t * 0.05) * headR;
    const hy = cy + Math.sin(headTheta + t * 0.05) * headR;
    
    ctx.beginPath();
    ctx.arc(hx, hy, Math.max(1, 7 * (window.devicePixelRatio || 1)), 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = secondaryColor;
    ctx.shadowBlur = 22;
    ctx.fill();
    ctx.restore();
    
  } else if (state.vizMode === 'rings') {
    // MODE 2: Concentric Radar Orbital Rings
    const rings = 4;
    const maxR = Math.max(10, size * 0.43);
    for (let i = 1; i <= rings; i++) {
      const r = (maxR / rings) * i;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1, r), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 2 * (window.devicePixelRatio || 1);
      ctx.stroke();
    }
    
    const subjs = state.subjects;
    subjs.forEach((s, idx) => {
      const r = (maxR / rings) * (idx + 1);
      const subMins = state.displayTimeMode === 'today' ? getSubjectMinutesToday(s.id) : getSubjectAllTimeMinutes(s.id);
      const target = state.displayTimeMode === 'today' ? (s.targetMinutes || 120) : (s.targetMinutes * 5 || 600);
      const ratio = Math.min(1, subMins / target);
      if (ratio > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1, r), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 5 * (window.devicePixelRatio || 1);
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = s.color;
        ctx.stroke();

        // Pulsing head bead
        const endAngle = -Math.PI / 2 + Math.PI * 2 * ratio;
        const bx = cx + Math.cos(endAngle) * r;
        const by = cy + Math.sin(endAngle) * r;
        ctx.beginPath();
        ctx.arc(bx, by, Math.max(1, 3.5 * (window.devicePixelRatio || 1)), 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      }
    });
    
  } else if (state.vizMode === 'flame') {
    // MODE 3: Zen Productivity Flame (شعلة الطاقة الحية)
    ctx.save();
    const flameBaseR = Math.max(5, size * 0.38);
    // Outer flame aura
    const flameGrad = ctx.createRadialGradient(cx, cy + size * 0.08, Math.max(1, size * 0.05), cx, cy, flameBaseR);
    flameGrad.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
    flameGrad.addColorStop(0.5, 'rgba(86, 194, 166, 0.2)');
    flameGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, flameBaseR, 0, Math.PI * 2);
    ctx.fill();

    // Rising Flame Curves
    const flamePoints = 40;
    ctx.beginPath();
    for (let i = 0; i <= flamePoints; i++) {
      const angle = (i / flamePoints) * Math.PI * 2;
      const wave = Math.sin(angle * 4 + t * 3) * (size * 0.02) + Math.cos(angle * 2 - t * 2) * (size * 0.015);
      const r = Math.max(5, (size * 0.32) + wave);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3.5 * (window.devicePixelRatio || 1);
    ctx.shadowBlur = 15;
    ctx.shadowColor = primaryColor;
    ctx.stroke();

    // Inner fiery tongue
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.12, cy + size * 0.16);
    ctx.quadraticCurveTo(cx - size * 0.05, cy - size * 0.18 + Math.sin(t * 4) * 12, cx, cy - size * 0.28 + Math.cos(t * 3) * 15);
    ctx.quadraticCurveTo(cx + size * 0.05, cy - size * 0.18 + Math.cos(t * 4) * 12, cx + size * 0.12, cy + size * 0.16);
    ctx.closePath();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5 * (window.devicePixelRatio || 1);
    ctx.stroke();
    ctx.fill();
    ctx.restore();

  } else {
    // MODE 4: Cyberpunk Pulse Radar (رادار سايبر المستقبلي)
    ctx.save();
    const r = Math.max(10, size * 0.42);

    // Outer Reticle Ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(86, 194, 166, 0.25)';
    ctx.lineWidth = 2 * (window.devicePixelRatio || 1);
    ctx.stroke();

    // Radar Dial Ticks
    const totalTicks = 48;
    for (let i = 0; i < totalTicks; i++) {
      const angle = (i / totalTicks) * Math.PI * 2;
      const isMajor = i % 4 === 0;
      const inner = Math.max(1, r - (isMajor ? 12 : 5));
      const outer = Math.max(1, r - 1);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      ctx.strokeStyle = isMajor ? primaryColor : 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = isMajor ? 2.5 : 1;
      ctx.stroke();
    }

    // Rotary Sweeping Radar Line
    const sweepAngle = (t * 1.6) % (Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepAngle) * r, cy + Math.sin(sweepAngle) * r);
    ctx.strokeStyle = 'rgba(99, 179, 237, 0.7)';
    ctx.lineWidth = 2.5 * (window.devicePixelRatio || 1);
    ctx.stroke();

    // Radar Sweep Cone
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, Math.max(1, r), sweepAngle - 0.35, sweepAngle);
    ctx.closePath();
    ctx.fillStyle = 'rgba(99, 179, 237, 0.12)';
    ctx.fill();

    // Active Study Arc
    const target = state.displayTimeMode === 'today' ? 360 : 1800;
    const pct = Math.min(1, activeDisplayMins / target);
    const innerArcR = Math.max(2, r - 16);
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1, innerArcR), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 6 * (window.devicePixelRatio || 1);
    ctx.lineCap = 'round';
    ctx.shadowBlur = 16;
    ctx.shadowColor = primaryColor;
    ctx.stroke();

    ctx.restore();
  }
  
  requestAnimationFrame(drawMainVisualizer);
}

// Mini Gauge for Individual Subjects (Mini spiral / circular gauge)
function drawSubjectGauges() {
  state.subjects.forEach(s => {
    const canvas = document.getElementById(`gauge-${s.id}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 50 * dpr;
    if (canvas.width !== size) {
      canvas.width = size;
      canvas.height = size;
    }
    
    const cx = size / 2;
    const cy = size / 2;
    ctx.clearRect(0, 0, size, size);
    
    const subMins = getSubjectMinutesToday(s.id);
    const target = s.targetMinutes || 120;
    const pct = Math.min(1, subMins / target);
    
    // Background spiral/circle
    const gaugeR = Math.max(1, size * 0.38);
    ctx.beginPath();
    ctx.arc(cx, cy, gaugeR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 3.5 * dpr;
    ctx.stroke();
    
    // Active progress arc
    if (pct > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, gaugeR, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * pct));
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 4 * dpr;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  });
}

function getSubjectMinutesToday(subjId) {
  const today = new Date().toDateString();
  const past = state.sessions
    .filter(s => new Date(s.tsEnd).toDateString() === today)
    .reduce((acc, s) => {
      const en = (s.entries || []).find(e => e.subj === subjId);
      return acc + (en ? s.minutes : 0);
    }, 0);
    
  let current = 0;
  if (state.activeSession && state.activeSession.subjId === subjId) {
    current = Math.floor(getActiveSessionSeconds() / 60);
  }
  return past + current;
}

// --- DAYS CONFIG & CONSTANTS ---
const DAYS_CONFIG = [
  { id: 'sat', name: 'السبت', short: 'السبت', routineBadge: '📖 عربي 4:00 م (نزول المحاضرة)', routineClass: 'routine-arabic' },
  { id: 'sun', name: 'الأحد', short: 'الأحد', routineBadge: '⚛️ فيزياء منصة (أ. محمد عبد المعبود)', routineClass: 'routine-physics' },
  { id: 'mon', name: 'الاثنين', short: 'الاثنين', routineBadge: '🏛️ تاريخ 1:00 ظ | 🌐 إنجليزي 7:00 م', routineClass: 'routine-history' },
  { id: 'tue', name: 'الثلاثاء', short: 'الثلاثاء', routineBadge: '📖 عربي 4:00 م (تسليم الواجب)', routineClass: 'routine-arabic' },
  { id: 'wed', name: 'الأربعاء', short: 'الأربعاء', routineBadge: '⚛️ فيزياء منصة (أ. محمد عبد المعبود)', routineClass: 'routine-physics' },
  { id: 'thu', name: 'الخميس', short: 'الخميس', routineBadge: '🏛️ تاريخ 1:00 ظ | 🌐 إنجليزي 7:00 م', routineClass: 'routine-history' },
  { id: 'fri', name: 'الجمعة', short: 'الجمعة', routineBadge: '🌿 مراجعة وتجهيز حر', routineClass: 'routine-workshop' },
  { id: 'backlog', name: 'صندوق المتراكم 📦', short: 'المتراكم', routineBadge: 'مهام مؤجلة ومتراكمة', routineClass: 'routine-workshop' }
];

function getTodayDayId() {
  const map = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return map[new Date().getDay()];
}

function persistWeeklyTasks() {
  try {
    localStorage.setItem('kareem_weekly_tasks_v2', JSON.stringify(state.weeklyTasks));
    localStorage.setItem('kareem_completed_task_ids_v2', JSON.stringify(Array.from(state.completedTaskIds)));
    localStorage.setItem('backlog_4days_tasks_v1', JSON.stringify(Array.from(state.completedTaskIds)));
  } catch(e) {}
}

// --- RENDER APPLICATION VIEWS ---
function renderUI() {
  const todayMins = getStudyMinutesToday();
  const allTimeMins = getAllTimeStudyMinutes();
  
  // Top Header Badge
  const headerVal = document.getElementById('headerAllTimeValue');
  if (headerVal) headerVal.textContent = fmtHMEn(allTimeMins);

  // Center Clock in Canvas (Shows all-time and today simultaneously)
  const centerNum = document.getElementById('canvasCenterNum');
  const centerLbl = document.getElementById('canvasCenterLbl');
  const centerSub = document.getElementById('canvasCenterToday');
  
  if (state.displayTimeMode === 'today') {
    if (centerNum) centerNum.textContent = fmtHMEn(todayMins);
    if (centerLbl) centerLbl.textContent = 'إنجاز اليوم';
    if (centerSub) centerSub.innerHTML = `كله في كله: <strong class="tabular" style="color:var(--accent-primary);">${fmtHMEn(allTimeMins)}</strong>`;
  } else {
    if (centerNum) centerNum.textContent = fmtHMEn(allTimeMins);
    if (centerLbl) centerLbl.textContent = 'إجمالي المسيرة (كله في كله)';
    if (centerSub) centerSub.innerHTML = `طاقة اليوم: <strong class="tabular" style="color:var(--accent-secondary);">${fmtHMEn(todayMins)}</strong>`;
  }

  // Under-canvas quick stat numbers
  const statAllTime = document.getElementById('statAllTimeNum');
  if (statAllTime) statAllTime.textContent = fmtHMEn(allTimeMins);
  const statToday = document.getElementById('statTodayNum');
  if (statToday) statToday.textContent = fmtHMEn(todayMins);
  
  // Header Active Session Banner
  const banner = document.getElementById('activeSessionBanner');
  if (banner) {
    if (state.activeSession) {
      const sub = state.subjects.find(s => s.id === state.activeSession.subjId) || state.subjects[0];
      banner.style.display = 'flex';
      document.getElementById('bannerSubjName').textContent = sub.name;
      document.getElementById('bannerSecNum').textContent = fmtClock(getActiveSessionSeconds());
    } else {
      banner.style.display = 'none';
    }
  }
  
  // Focus Mode Screen Values
  if (state.activeSession) {
    const sec = getActiveSessionSeconds();
    const sub = state.subjects.find(s => s.id === state.activeSession.subjId) || state.subjects[0];
    const timerElem = document.getElementById('focusSessionTimer');
    if (timerElem) timerElem.textContent = fmtClock(sec);
    const subBadge = document.getElementById('focusSubjBadge');
    if (subBadge) {
      subBadge.textContent = sub.name;
      subBadge.style.color = sub.color;
    }
  }
  const focusToday = document.getElementById('focusTodayTotal');
  if (focusToday) focusToday.textContent = fmtHMEn(todayMins);
  const focusAll = document.getElementById('focusAllTimeTotal');
  if (focusAll) focusAll.textContent = fmtHMEn(allTimeMins);
  
  // Wasted Time Card
  const wasted = calculateWastedTime();
  const wastedCard = document.getElementById('wastedTimeCard');
  if (wastedCard) {
    document.getElementById('wastedValueNum').textContent = fmtHM(wasted.wastedMins);
    document.getElementById('wastedSubText').textContent = 
      `من إجمالي ${fmtHM(wasted.awakeMinutes)} نشطة اليوم (نسبة الهدر: ${wasted.wastedPercentage}%)`;
    document.getElementById('wastedBarFill').style.width = `${wasted.wastedPercentage}%`;
    
    if (wasted.isTragic) {
      wastedCard.classList.add('critical');
      document.getElementById('wastedDramaBadge').innerHTML = 
        `${getSvgIcon('alert-triangle', 14)} تحذير: استنزاف مرتفع للوقت اليوم! استعد السيطرة`;
    } else {
      wastedCard.classList.remove('critical');
      document.getElementById('wastedDramaBadge').innerHTML = 
        `${getSvgIcon('check', 14)} إدارة وقتك اليوم تحت السيطرة يا بطل`;
    }
  }

  // Update Wasted Breakdown Panel
  const statStudy = document.getElementById('statStudyTime');
  if (statStudy) statStudy.textContent = fmtHM(wasted.studyMins);
  const statLesson = document.getElementById('statLessonTime');
  if (statLesson) statLesson.textContent = fmtHM(wasted.exemptMins);
  const statWasted = document.getElementById('statWastedTime');
  if (statWasted) statWasted.textContent = fmtHM(wasted.wastedMins);
  
  // Lesson Exemptions List
  renderExemptions();
  
  // Subjects Cards Grid
  renderSubjectsGrid();
  drawSubjectGauges();
  
  // Log Screen
  renderLogList();

  // Advanced Dashboard Metrics & 7-Day Chart
  renderDashboardMetrics();
  render7DayChart();

  // Weekly Tasks, Timetable Board & Lectures Hub
  renderWeeklyPlannerUI();
  renderVisualTimetableBoard();
  renderLecturesUI();
}

function renderDashboardMetrics() {
  const todayMins = getStudyMinutesToday();
  const weekMins = getStudyMinutesThisWeek();
  const monthMins = getStudyMinutesThisMonth();
  const prod = calculateProductivityScore();

  // Today Metric (Target 6h = 360m)
  const todayTarget = 360;
  const todayPct = Math.min(100, Math.round((todayMins / todayTarget) * 100));
  const elTodayHours = document.getElementById('metricTodayHours');
  if (elTodayHours) elTodayHours.textContent = fmtHMEn(todayMins);
  const elTodayPct = document.getElementById('metricTodayPct');
  if (elTodayPct) elTodayPct.textContent = `${todayPct}% من الهدف`;
  const elTodayBar = document.getElementById('metricTodayBar');
  if (elTodayBar) elTodayBar.style.width = `${todayPct}%`;

  // Week Metric (Target 35h = 2100m)
  const weekTarget = 2100;
  const weekPct = Math.min(100, Math.round((weekMins / weekTarget) * 100));
  const elWeekHours = document.getElementById('metricWeekHours');
  if (elWeekHours) elWeekHours.textContent = fmtHMEn(weekMins);
  const elWeekPct = document.getElementById('metricWeekPct');
  if (elWeekPct) elWeekPct.textContent = `${weekPct}%`;
  const elWeekBar = document.getElementById('metricWeekBar');
  if (elWeekBar) elWeekBar.style.width = `${weekPct}%`;

  // Month Metric
  const elMonthHours = document.getElementById('metricMonthHours');
  if (elMonthHours) elMonthHours.textContent = fmtHMEn(monthMins);
  const elMonthBar = document.getElementById('metricMonthBar');
  if (elMonthBar) elMonthBar.style.width = `${Math.min(100, Math.round((monthMins / 6000) * 100))}%`;

  // Productivity Score
  const elScoreNum = document.getElementById('metricScoreNum');
  if (elScoreNum) elScoreNum.textContent = `${prod.score} / 100`;
  const elScoreRank = document.getElementById('metricScoreRank');
  if (elScoreRank) elScoreRank.textContent = prod.rank;
  const elEff = document.getElementById('metricEfficiencyRate');
  if (elEff) elEff.textContent = `${prod.efficiencyRate}%`;
  const elScoreBar = document.getElementById('metricScoreBar');
  if (elScoreBar) elScoreBar.style.width = `${prod.score}%`;
}

function render7DayChart() {
  const container = document.getElementById('weekActivityBarsContainer');
  if (!container) return;

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sun, 6 is Sat
  const daysSinceSat = (dayOfWeek + 1) % 7;
  const satStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceSat, 0, 0, 0);

  const daysList = [
    { name: 'السبت', offset: 0 },
    { name: 'الأحد', offset: 1 },
    { name: 'الاثنين', offset: 2 },
    { name: 'الثلاثاء', offset: 3 },
    { name: 'الأربعاء', offset: 4 },
    { name: 'الخميس', offset: 5 },
    { name: 'الجمعة', offset: 6 }
  ];

  let totalWeekMins = 0;

  container.innerHTML = daysList.map(d => {
    const curDate = new Date(satStart);
    curDate.setDate(satStart.getDate() + d.offset);
    const dateStr = curDate.toDateString();
    const isToday = (dateStr === now.toDateString());

    const dayPastMins = state.sessions
      .filter(s => new Date(s.tsEnd).toDateString() === dateStr)
      .reduce((acc, s) => acc + (s.minutes || 0), 0);
    const dayRunningMins = isToday && state.activeSession ? Math.floor(getActiveSessionSeconds() / 60) : 0;
    const totalDayMins = dayPastMins + dayRunningMins;
    totalWeekMins += totalDayMins;

    // Daily target 6 hours = 360 mins
    const heightPct = Math.min(100, Math.max(6, Math.round((totalDayMins / 360) * 100)));

    return `
      <div class="bar-col ${isToday ? 'today' : ''}">
        <div class="bar-fill-track">
          <div class="bar-fill-colored" style="height: ${heightPct}%;"></div>
          <div class="bar-time-tooltip tabular">${fmtHM(totalDayMins)}</div>
        </div>
        <div class="bar-day-label">${d.name}</div>
      </div>
    `;
  }).join('');

  const summary = document.getElementById('chartWeeklyTotalSummary');
  if (summary) summary.textContent = `إجمالي الأسبوع: ${fmtHMEn(totalWeekMins)}`;
}

// --- WEEKLY PLANNER & BACKLOG MATRIX ENGINE ---
function renderWeeklyPlannerUI() {
  const totalTasks = state.weeklyTasks.length;
  const nonBacklogTasks = state.weeklyTasks.filter(t => t.dayId !== 'backlog');
  const weeklyTotal = nonBacklogTasks.length;
  const weeklyCompleted = nonBacklogTasks.filter(t => state.completedTaskIds.has(t.id)).length;
  const weeklyPct = weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0;

  const monthlyCompleted = state.weeklyTasks.filter(t => state.completedTaskIds.has(t.id)).length;
  const monthlyPct = totalTasks > 0 ? Math.round((monthlyCompleted / totalTasks) * 100) : 0;

  const pendingWeekly = weeklyTotal - weeklyCompleted;
  const examClassCount = state.weeklyTasks.filter(t => 
    (t.priority === 'exam' || t.priority === 'class' || t.priority === 'urgent') && 
    !state.completedTaskIds.has(t.id)
  ).length;

  // Header Boxes
  const elWeeklyPct = document.getElementById('statWeeklyTasksPct');
  if (elWeeklyPct) elWeeklyPct.textContent = `${weeklyPct}%`;
  const elWeeklyRatio = document.getElementById('statWeeklyTasksRatio');
  if (elWeeklyRatio) elWeeklyRatio.textContent = `${weeklyCompleted} من أصل ${weeklyTotal} مهمة`;
  const elWeeklyBar = document.getElementById('statWeeklyTasksBar');
  if (elWeeklyBar) elWeeklyBar.style.width = `${weeklyPct}%`;

  const elMonthPct = document.getElementById('statMonthlyTasksPct');
  if (elMonthPct) elMonthPct.textContent = `${monthlyPct}%`;
  const elMonthRatio = document.getElementById('statMonthlyTasksRatio');
  if (elMonthRatio) elMonthRatio.textContent = `${monthlyCompleted} من ${totalTasks} مهمة`;
  const elMonthBar = document.getElementById('statMonthlyTasksBar');
  if (elMonthBar) elMonthBar.style.width = `${monthlyPct}%`;

  const elPending = document.getElementById('statPendingTasksNum');
  if (elPending) elPending.textContent = pendingWeekly;
  const elExams = document.getElementById('statExamsTasksNum');
  if (elExams) elExams.textContent = examClassCount;

  // Render Visual Weekly Strip (8 cards)
  const strip = document.getElementById('weeklyVisualStrip');
  if (strip) {
    const todayDayId = getTodayDayId();
    strip.innerHTML = DAYS_CONFIG.map(d => {
      const dTasks = state.weeklyTasks.filter(t => t.dayId === d.id);
      const dDone = dTasks.filter(t => state.completedTaskIds.has(t.id)).length;
      const dTotal = dTasks.length;
      const dPct = dTotal > 0 ? Math.round((dDone / dTotal) * 100) : 0;
      const isActive = state.activeDayFilter === d.id;
      const isToday = d.id === todayDayId;

      return `
        <div class="strip-day-card ${isActive ? 'active' : ''} ${isToday ? 'today-highlight' : ''}" onclick="window.filterTasksByDay('${d.id}')">
          <div class="strip-day-title">${d.name}</div>
          <div class="strip-day-count">${dDone}/${dTotal} مهمة (${dPct}%)</div>
          <div class="stat-progress-bar">
            <div class="stat-progress-fill" style="width: ${dPct}%; background: ${dPct === 100 ? 'var(--success)' : 'var(--accent-primary)'};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render Poster Layer on 43611.png
  const posterLayer = document.getElementById('posterSlotsLayer');
  if (posterLayer) {
    posterLayer.innerHTML = state.weeklyTasks
      .filter(t => t.overlay)
      .map(t => {
        const isDone = state.completedTaskIds.has(t.id);
        const ov = t.overlay;
        return `
          <div class="poster-slot-interactive ${isDone ? 'done' : ''}" 
               style="top:${ov.top}%; height:${ov.height}%; left:${ov.left}%; width:${ov.width}%;"
               title="${t.text}"
               onclick="window.toggleTaskCompletion(${t.id})">
          </div>
        `;
      }).join('');
  }

  // Render Filter Pills Active Class
  document.querySelectorAll('#dayFilterPillsContainer .pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === state.activeDayFilter);
  });

  // Render Tasks Grid
  const grid = document.getElementById('plannerTasksGrid');
  if (!grid) return;

  let filtered = [...state.weeklyTasks];
  if (state.activeDayFilter !== 'all') {
    filtered = filtered.filter(t => t.dayId === state.activeDayFilter);
  }

  if (!filtered.length) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding:40px; background:var(--bg-surface); border:1px dashed var(--border-subtle); border-radius:var(--radius-lg); color:var(--text-muted);">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 10px; display:block; opacity:0.6;"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
        <div style="font-weight:700; color:var(--text-main);">لا توجد مهام مسجلة لهذا القسم حالياً!</div>
        <p style="font-size:12px; margin-top:4px;">اضغط على "إضافة مهمة جديدة" أعلاه لإضافة أي واجب، محاضرة، أو متراكم.</p>
      </div>
    `;
    return;
  }

  // Smart Sorting: Uncompleted first, then Exam/Urgent -> Class -> High -> Normal
  const priorityScore = { exam: 5, urgent: 4, class: 3, high: 2, normal: 1 };
  filtered.sort((a, b) => {
    const doneA = state.completedTaskIds.has(a.id) ? 1 : 0;
    const doneB = state.completedTaskIds.has(b.id) ? 1 : 0;
    if (doneA !== doneB) return doneA - doneB;
    return (priorityScore[b.priority] || 1) - (priorityScore[a.priority] || 1);
  });

  grid.innerHTML = filtered.map(t => {
    const isDone = state.completedTaskIds.has(t.id);
    const sub = state.subjects.find(s => s.id === t.subjId) || { name: 'عام', color: '#64748b' };
    const dayConfig = DAYS_CONFIG.find(d => d.id === t.dayId) || { name: 'المتراكم' };

    // Badges
    let priorityBadge = '';
    if (t.priority === 'exam') {
      priorityBadge = `<span class="task-pill pill-exam">🎓 قبل الامتحان: ${t.contextInfo || 'مراجعة عاجلة'}</span>`;
    } else if (t.priority === 'class') {
      priorityBadge = `<span class="task-pill pill-class">🏫 قبل الدرس: ${t.contextInfo || 'تحضير مسبق'}</span>`;
    } else if (t.priority === 'urgent') {
      priorityBadge = `<span class="task-pill pill-urgent">🔴 أولوية قصوى</span>`;
    } else if (t.priority === 'high') {
      priorityBadge = `<span class="task-pill" style="background:rgba(245, 158, 11, 0.12); color:#f59e0b; border:1px solid rgba(245, 158, 11, 0.25);">⚡ أولوية عالية</span>`;
    }

    const rolledBadge = t.isRolled ? `<span class="task-pill pill-rolled">🔁 مرحّلة</span>` : '';

    return `
      <div class="planner-task-card ${isDone ? 'is-completed' : ''}" data-task-id="${t.id}">
        <div class="task-header">
          <input type="checkbox" class="task-checkbox-custom" ${isDone ? 'checked' : ''} onchange="window.toggleTaskCompletion(${t.id})" aria-label="اكتمال المهمة">
          <div class="task-body">
            <div class="task-text">${t.text}</div>
            <div class="task-badges-row">
              <span class="task-pill pill-subject" style="border-color:${sub.color}55; color:${sub.color};">
                <span style="width:6px; height:6px; border-radius:50%; background:${sub.color};"></span>
                ${sub.name}
              </span>
              <span class="task-pill" style="background:rgba(255,255,255,0.04); color:var(--text-muted); border:1px solid var(--border-subtle);">
                📅 ${dayConfig.name}
              </span>
              ${priorityBadge}
              ${rolledBadge}
            </div>
          </div>
        </div>

        <div class="task-footer">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:11px; color:var(--text-muted);">نقل إلى:</span>
            <select class="task-reschedule-select" onchange="window.moveTaskToDay(${t.id}, this.value)">
              ${DAYS_CONFIG.map(d => `
                <option value="${d.id}" ${d.id === t.dayId ? 'selected' : ''}>${d.name}</option>
              `).join('')}
            </select>
          </div>

          <div class="task-actions">
            ${!isDone ? `
              <button class="btn-launch-task" onclick="window.launchTaskIntoFocus(${t.id})" title="بدء جلسة تركيز لهذه المهمة في الحال">
                🚀 ذاكرها الآن
              </button>
            ` : ''}
            ${t.id > 40 ? `
              <button class="btn btn-sm btn-icon" onclick="window.deleteWeeklyTask(${t.id})" title="حذف المهمة" style="color:var(--danger);">
                ${getSvgIcon('trash', 14)}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Global actions exposed for event bindings
window.toggleTaskCompletion = function(taskId) {
  const wasDone = state.completedTaskIds.has(taskId);
  if (wasDone) {
    state.completedTaskIds.delete(taskId);
    playChimeSound(false);
  } else {
    state.completedTaskIds.add(taskId);
    playChimeSound(true);
  }

  persistWeeklyTasks();
  renderWeeklyPlannerUI();

  if (!wasDone && state.completedTaskIds.size === state.weeklyTasks.length) {
    triggerConfetti();
    toast('🎉 أسطورة! أنجزت جميع مهام الأسبوع والمتراكم بالكامل!', 'sparkles');
  } else if (!wasDone) {
    toast('أحسنت! خطوة إضافية نحو القمة ⚡', 'check');
  }
};

window.moveTaskToDay = function(taskId, newDayId) {
  const t = state.weeklyTasks.find(x => x.id === taskId);
  if (!t) return;
  t.dayId = newDayId;
  persistWeeklyTasks();
  renderWeeklyPlannerUI();
  const dayName = (DAYS_CONFIG.find(d => d.id === newDayId) || {}).name || newDayId;
  toast(`تم نقل المهمة بنجاح إلى: ${dayName}`, 'refresh');
};

window.launchTaskIntoFocus = function(taskId) {
  const t = state.weeklyTasks.find(x => x.id === taskId);
  if (!t) return;
  startNewSession(t.subjId, t.text);
  showView('focusView');
  toast(`بدأت جلسة المذاكرة للمهمة: ${t.text.substring(0, 30)}...`, 'flame');
};

window.deleteWeeklyTask = function(taskId) {
  state.weeklyTasks = state.weeklyTasks.filter(t => t.id !== taskId);
  state.completedTaskIds.delete(taskId);
  persistWeeklyTasks();
  renderWeeklyPlannerUI();
  toast('تم حذف المهمة من الجدول', 'trash');
};

window.filterTasksByDay = function(dayId) {
  state.activeDayFilter = dayId;
  renderWeeklyPlannerUI();
};

window.togglePosterSection = function() {
  const body = document.getElementById('posterCollapseBody');
  const chevron = document.getElementById('posterToggleChevron');
  const txt = document.getElementById('posterToggleStatusText');
  if (!body) return;

  state.showPoster = !state.showPoster;
  if (state.showPoster) {
    body.style.display = 'flex';
    if (chevron) chevron.style.transform = 'rotate(180deg)';
    if (txt) txt.textContent = 'إخفاء الصورة';
  } else {
    body.style.display = 'none';
    if (chevron) chevron.style.transform = 'rotate(0deg)';
    if (txt) txt.textContent = 'عرض الصورة التفاعلية';
  }
};

window.carryOverUnfinishedTasks = function(targetDayId) {
  const actualTarget = targetDayId === 'today' ? getTodayDayId() : targetDayId;
  let count = 0;
  state.weeklyTasks.forEach(t => {
    if (!state.completedTaskIds.has(t.id) && t.dayId !== actualTarget && t.dayId !== 'backlog') {
      t.dayId = actualTarget;
      t.isRolled = true;
      count++;
    }
  });

  if (count > 0) {
    persistWeeklyTasks();
    renderWeeklyPlannerUI();
    const dayName = (DAYS_CONFIG.find(d => d.id === actualTarget) || {}).name || actualTarget;
    toast(`تم ترحيل ${count} مهمة غير مكتملة بنجاح إلى ${dayName}! استعن بالله ⚡`, 'refresh');
  } else {
    toast('رائع! ليس لديك مهام متأخرة لترحيلها', 'check');
  }
};

window.resetTasksProgress = function(mode) {
  if (mode === 'completed_only') {
    state.completedTaskIds.clear();
    toast('تم إلغاء تحديد المهام لبدء دورة إنجاز جديدة!', 'refresh');
  } else {
    state.weeklyTasks = JSON.parse(JSON.stringify(DEFAULT_WEEKLY_TASKS));
    state.completedTaskIds.clear();
    toast('تمت استعادة الجدول الأصلي بالكامل!', 'refresh');
  }
  persistWeeklyTasks();
  renderWeeklyPlannerUI();
};

// --- DYNAMIC VISUAL TIMETABLE BOARD ---
function renderVisualTimetableBoard() {
  const container = document.getElementById('timetableGrid7');
  if (!container) return;

  const todayId = getTodayDayId();
  const daysToShow = DAYS_CONFIG.filter(d => d.id !== 'backlog');

  container.innerHTML = daysToShow.map(day => {
    const isToday = day.id === todayId;
    const dayTasks = state.weeklyTasks.filter(t => t.dayId === day.id);
    const completedCount = dayTasks.filter(t => state.completedTaskIds.has(t.id)).length;
    const totalCount = dayTasks.length;
    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const tasksHtml = dayTasks.length ? dayTasks.slice(0, 5).map(t => {
      const isDone = state.completedTaskIds.has(t.id);
      const sub = state.subjects.find(s => s.id === t.subjId) || { name: 'عام', color: '#64748b' };
      return `
        <div class="day-task-mini-item ${isDone ? 'done' : ''}" onclick="window.toggleTaskCompletion(${t.id})">
          <div style="display:flex; align-items:center; gap:6px; flex:1; overflow:hidden;">
            <input type="checkbox" ${isDone ? 'checked' : ''} onclick="event.stopPropagation(); window.toggleTaskCompletion(${t.id})" style="accent-color:var(--accent-primary); width:14px; height:14px; cursor:pointer;">
            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:600; color:var(--text-main);" title="${t.text}">${t.text}</span>
          </div>
          <span style="font-size:10px; padding:1px 6px; border-radius:4px; background:${sub.color}22; color:${sub.color}; border:1px solid ${sub.color}44; white-space:nowrap;">
            ${sub.name}
          </span>
        </div>
      `;
    }).join('') : `<div style="font-size:11px; color:var(--text-faint); text-align:center; padding:12px;">لا توجد مهام إضافية مسجلة</div>`;

    const remainingMore = dayTasks.length > 5 ? `<div style="font-size:11px; text-align:center; color:var(--accent-secondary); font-weight:700; cursor:pointer;" onclick="window.filterTasksByDay('${day.id}')">+ ${dayTasks.length - 5} مهام أخرى</div>` : '';

    return `
      <div class="day-timetable-col ${isToday ? 'is-today' : ''}">
        <div class="day-col-header">
          <div class="day-col-title">
            <span>${day.name}</span>
            ${isToday ? `<span style="font-size:10px; background:var(--accent-primary); color:#0b1212; padding:2px 7px; border-radius:10px; font-weight:800;">اليوم ⚡</span>` : ''}
          </div>
          <span style="font-size:11px; color:var(--text-muted); font-weight:700;">${completedCount}/${totalCount}</span>
        </div>

        <div style="margin:2px 0;">
          <div class="routine-badge ${day.routineClass || 'routine-arabic'}">
            ${day.routineBadge || 'مذاكرة حرة'}
          </div>
        </div>

        <div class="stat-progress-bar" style="margin:4px 0 8px;">
          <div class="stat-progress-fill" style="width:${pct}%; background:${pct === 100 ? '#10b981' : 'var(--accent-primary)'};"></div>
        </div>

        <div class="day-tasks-mini-list">
          ${tasksHtml}
          ${remainingMore}
        </div>

        <button class="btn btn-sm" onclick="window.openNewTaskModalForDay('${day.id}')" style="margin-top:auto; font-size:11px; padding:4px 8px; justify-content:center; border-style:dashed;">
          + إضافة مهمة لـ ${day.short}
        </button>
      </div>
    `;
  }).join('');
}

window.openNewTaskModalForDay = function(dayId) {
  const modal = document.getElementById('newWeeklyTaskModal');
  const daySel = document.getElementById('newTaskDaySelect');
  if (daySel) daySel.value = dayId;
  if (modal) modal.classList.add('show');
};

// --- LECTURES & PLATFORMS SUITE ---
function renderLecturesUI() {
  const container = document.getElementById('lecturePackagesContainer');
  if (!container) return;

  const total = state.lectures.length;
  const doneCount = state.lectures.filter(l => l.isDone).length;
  const pendingCount = total - doneCount;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  // Header metric updates
  const elPct = document.getElementById('statLecturesPct');
  if (elPct) elPct.textContent = `${pct}%`;
  const elRatio = document.getElementById('statLecturesRatio');
  if (elRatio) elRatio.textContent = `${doneCount} من ${total} محاضرة`;
  const elBar = document.getElementById('statLecturesBar');
  if (elBar) elBar.style.width = `${pct}%`;

  const elDone = document.getElementById('statLecturesDoneCount');
  if (elDone) elDone.textContent = doneCount;
  const elPending = document.getElementById('statLecturesPendingCount');
  if (elPending) elPending.textContent = pendingCount;

  // Physics package 3-months metrics (14 items)
  const phyList = state.lectures.filter(l => l.packageId === 'physics_3m');
  const phyDone = phyList.filter(l => l.isDone).length;
  const elPhy = document.getElementById('statPhysicsPackageStatus');
  if (elPhy) elPhy.textContent = `${phyDone} / ${phyList.length || 14}`;
  const elPhyBar = document.getElementById('statPhysicsPackageBar');
  if (elPhyBar) elPhyBar.style.width = `${Math.round((phyDone / (phyList.length || 14)) * 100)}%`;

  // Filtering
  let filtered = [...state.lectures];
  if (state.activeLectureFilter === 'physics') {
    filtered = filtered.filter(l => l.subjId === 'physics');
  } else if (state.activeLectureFilter === 'arabic') {
    filtered = filtered.filter(l => l.subjId === 'arabic');
  } else if (state.activeLectureFilter === 'history') {
    filtered = filtered.filter(l => l.subjId === 'history');
  } else if (state.activeLectureFilter === 'english') {
    filtered = filtered.filter(l => l.subjId === 'english');
  } else if (state.activeLectureFilter === 'done') {
    filtered = filtered.filter(l => l.isDone);
  } else if (state.activeLectureFilter === 'pending') {
    filtered = filtered.filter(l => !l.isDone);
  }

  // Group by package
  const packagesMap = new Map();
  filtered.forEach(item => {
    const pkgId = item.packageId || 'custom_pkg';
    const pkgName = item.packageName || 'محاضرات إضافية ومنصات';
    if (!packagesMap.has(pkgId)) {
      packagesMap.set(pkgId, { id: pkgId, name: pkgName, items: [] });
    }
    packagesMap.get(pkgId).items.push(item);
  });

  if (!packagesMap.size) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding:40px; background:var(--bg-surface); border:1px dashed var(--border-subtle); border-radius:var(--radius-lg); color:var(--text-muted);">
        <div style="font-size:16px; font-weight:700; color:var(--text-main);">لا توجد محاضرات تطابق هذا التصنيف!</div>
        <p style="font-size:13px; margin-top:4px;">يمكنك إضافة أي محاضرة جديدة تنزل على المنصة بالضغط على "إضافة محاضرة جديدة".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = Array.from(packagesMap.values()).map(pkg => {
    const pkgDone = pkg.items.filter(i => i.isDone).length;
    const pkgTotal = pkg.items.length;
    const pkgPct = pkgTotal > 0 ? Math.round((pkgDone / pkgTotal) * 100) : 0;

    const itemsHtml = pkg.items.map(lec => {
      const isDone = !!lec.isDone;
      const sub = state.subjects.find(s => s.id === lec.subjId) || { name: 'مادة', color: '#818cf8' };
      
      let tagClass = 'tag-pending';
      let tagText = lec.tag || (isDone ? 'تمت المشاهدة ✅' : 'قيد المشاهدة ⏳');
      if (isDone) tagClass = 'tag-done';
      else if (lec.type === 'workshop') tagClass = 'tag-workshop';

      return `
        <div class="lecture-item-card ${isDone ? 'completed' : ''}" data-lec-id="${lec.id}">
          <div class="lecture-item-left">
            <input type="checkbox" ${isDone ? 'checked' : ''} onchange="window.toggleLectureDone('${lec.id}')" style="accent-color:var(--accent-primary); width:18px; height:18px; cursor:pointer;" title="تحديد كمنتهية">
            <div class="lecture-num-badge" style="border:1px solid ${sub.color}44; color:${sub.color};">
              ${lec.code || 'محاضرة'}
            </div>
            <div style="flex:1;">
              <div class="lecture-info-title">
                ${lec.title}
                <span class="lecture-tag-pill ${tagClass}" style="margin-right:6px;">${tagText}</span>
              </div>
              <div class="lecture-info-details">
                ${lec.details || 'تفاصيل المحاضرة والشروحات'}
              </div>
              <div style="display:flex; align-items:center; gap:8px; margin-top:5px; font-size:11px; color:var(--text-faint);">
                <span>📅 موعدها: ${lec.dueDay || 'أسبوعياً'}</span>
                <span>•</span>
                <span style="color:${sub.color}; font-weight:700;">${sub.name}</span>
              </div>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
            <button class="btn btn-sm" onclick="window.launchLectureIntoFocus('${lec.id}')" title="بدء جلسة مذاكرة في غرفة التركيز لهذه المحاضرة" style="font-size:11px; padding:5px 10px; color:var(--accent-primary); border-color:var(--border-active);">
              🚀 ذاكرها الآن
            </button>
            <button class="btn btn-sm" onclick="window.addLectureTasksToWeekly('${lec.id}')" title="إدراج مهام المحاضرة في جدول الأسبوع" style="font-size:11px; padding:5px 10px;">
              📅 أضف للجدول
            </button>
            ${lec.id.startsWith('cust-') ? `
              <button class="btn btn-sm btn-icon" onclick="window.deleteLecture('${lec.id}')" title="حذف المحاضرة" style="color:var(--danger);">
                ${getSvgIcon('trash', 14)}
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="package-card">
        <div class="package-header">
          <div>
            <div class="package-title">${pkg.name}</div>
            <div class="package-sub">إنجاز: ${pkgDone} من أصل ${pkgTotal} محاضرة وعنصر (${pkgPct}%)</div>
          </div>
          <div style="text-align:left;">
            <span class="tabular" style="font-size:18px; font-weight:900; color:var(--accent-primary);">${pkgPct}%</span>
          </div>
        </div>

        <div class="stat-progress-bar">
          <div class="stat-progress-fill" style="width:${pkgPct}%; background:${pkgPct === 100 ? '#10b981' : 'var(--accent-primary)'};"></div>
        </div>

        <div class="lecture-list-stack">
          ${itemsHtml}
        </div>
      </div>
    `;
  }).join('');
}

window.toggleLectureDone = function(lecId) {
  const lec = state.lectures.find(l => l.id === lecId);
  if (!lec) return;
  lec.isDone = !lec.isDone;
  persistLectures();
  renderLecturesUI();
  playChimeSound(lec.isDone);
  toast(lec.isDone ? `أحسنت! تم إنهاء "${lec.title}" ✅` : `تمت إعادة فتح "${lec.title}"`, 'check');
};

window.filterLectures = function(filterType, element) {
  state.activeLectureFilter = filterType;
  if (element && element.parentElement) {
    element.parentElement.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
    element.classList.add('active');
  }
  renderLecturesUI();
};

window.openNewLectureModal = function() {
  const modal = document.getElementById('newLectureModal');
  if (modal) {
    document.getElementById('newLectureTitleInput').value = '';
    document.getElementById('newLectureCodeInput').value = '';
    document.getElementById('newLectureDetailsInput').value = '';
    modal.classList.add('show');
  }
};

window.saveNewLecture = function() {
  const subjId = document.getElementById('newLectureSubjSelect').value;
  const code = document.getElementById('newLectureCodeInput').value.trim() || 'محاضرة جديدة';
  const title = document.getElementById('newLectureTitleInput').value.trim();
  const details = document.getElementById('newLectureDetailsInput').value.trim();
  const dayId = document.getElementById('newLectureDaySelect').value;
  const isDone = document.getElementById('newLectureDoneSelect').value === 'true';
  const autoTasks = document.getElementById('newLectureAutoTasksCheck').checked;

  if (!title) {
    toast('يرجى كتابة عنوان المحاضرة', 'alert-triangle');
    return;
  }

  const subObj = state.subjects.find(s => s.id === subjId) || { name: 'مادة' };
  const dayObj = DAYS_CONFIG.find(d => d.id === dayId) || { name: 'الأسبوع' };

  const newLec = {
    id: 'cust-' + Date.now(),
    packageId: `${subjId}_custom`,
    packageName: `محاضرات ${subObj.name} (المضافة)`,
    subjId,
    code,
    title,
    details: details || `محتوى وشروحات ${title}`,
    type: 'lecture',
    isDone,
    tag: isDone ? 'منتهية ✅' : 'جديدة ⏳',
    dueDay: dayObj.name
  };

  state.lectures.push(newLec);
  persistLectures();

  // If auto tasks checked, add to weekly tasks
  if (autoTasks) {
    const tId1 = Date.now();
    const tId2 = Date.now() + 1;
    state.weeklyTasks.push({
      id: tId1,
      dayId: dayId,
      subjId: subjId,
      text: `سماع ${code}: ${title}`,
      priority: 'high',
      contextInfo: `محاضرة المنصة (${subObj.name})`
    });
    state.weeklyTasks.push({
      id: tId2,
      dayId: dayId,
      subjId: subjId,
      text: `مذاكرة وحل واجب ${code}: ${title}`,
      priority: 'normal',
      contextInfo: `واجب ${subObj.name}`
    });
    persistWeeklyTasks();
    renderWeeklyPlannerUI();
  }

  renderLecturesUI();
  document.getElementById('newLectureModal').classList.remove('show');
  toast(`تم تسجيل المحاضرة "${title}" بنجاح في المنصة ⚡`, 'sparkles');
};

window.deleteLecture = function(lecId) {
  state.lectures = state.lectures.filter(l => l.id !== lecId);
  persistLectures();
  renderLecturesUI();
  toast('تم حذف المحاضرة من السجل', 'trash');
};

window.launchLectureIntoFocus = function(lecId) {
  const lec = state.lectures.find(l => l.id === lecId);
  if (!lec) return;
  startNewSession(lec.subjId, `مذاكرة: ${lec.title}`);
  showView('focusView');
  toast(`بدأت جلسة المذاكرة للمحاضرة: ${lec.title}`, 'flame');
};

window.addLectureTasksToWeekly = function(lecId) {
  const lec = state.lectures.find(l => l.id === lecId);
  if (!lec) return;

  let targetDay = 'sat';
  if (lec.subjId === 'physics') targetDay = 'sun';
  else if (lec.subjId === 'arabic') targetDay = 'sat';
  else if (lec.subjId === 'history' || lec.subjId === 'english') targetDay = 'mon';

  const tId = Date.now();
  state.weeklyTasks.push({
    id: tId,
    dayId: targetDay,
    subjId: lec.subjId,
    text: `إنهاء ومذاكرة ${lec.code}: ${lec.title}`,
    priority: 'high',
    contextInfo: `من منصة ${lec.packageName}`
  });

  persistWeeklyTasks();
  renderWeeklyPlannerUI();
  const dayName = (DAYS_CONFIG.find(d => d.id === targetDay) || {}).name || targetDay;
  toast(`تمت إضافة مهمة المحاضرة بنجاح إلى جدول يوم ${dayName}! ⚡`, 'check');
};

// --- DYNAMIC SCHEDULE IMAGE GENERATOR (PNG) ---
window.generateAndShowScheduleImage = function() {
  const canvas = document.createElement('canvas');
  canvas.width = 1360;
  canvas.height = 840;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGrad.addColorStop(0, '#0c1113');
  bgGrad.addColorStop(0.5, '#131c1f');
  bgGrad.addColorStop(1, '#0c1113');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle accent border
  ctx.strokeStyle = 'rgba(86, 194, 166, 0.4)';
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

  // Decorative glow
  ctx.save();
  const glowGrad = ctx.createRadialGradient(canvas.width / 2, 60, 10, canvas.width / 2, 60, 400);
  glowGrad.addColorStop(0, 'rgba(86, 194, 166, 0.15)');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, canvas.width, 240);
  ctx.restore();

  // Header Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#56c2a6';
  ctx.font = 'bold 28px Cairo, sans-serif';
  ctx.fillText('SHAPAP | مساحة كريم للمذاكرة ⚡', canvas.width / 2, 54);

  ctx.fillStyle = '#f0f4f5';
  ctx.font = 'bold 22px Cairo, sans-serif';
  ctx.fillText('جدول المذاكرة الأسبوعي ومواعيد الدروس المنظمة', canvas.width / 2, 88);

  ctx.fillStyle = '#8b9ea3';
  ctx.font = '14px Cairo, sans-serif';
  const totalT = state.weeklyTasks.filter(t => t.dayId !== 'backlog').length;
  const doneT = state.weeklyTasks.filter(t => t.dayId !== 'backlog' && state.completedTaskIds.has(t.id)).length;
  const weeklyPct = totalT > 0 ? Math.round((doneT / totalT) * 100) : 0;
  ctx.fillText(`إنجاز الأسبوع: ${doneT} من ${totalT} مهمة (${weeklyPct}%) • السبت إلى الجمعة`, canvas.width / 2, 114);

  // 7 Days Columns Grid
  const daysToShow = DAYS_CONFIG.filter(d => d.id !== 'backlog');
  const startX = 40;
  const gap = 14;
  const colW = (canvas.width - 80 - (gap * 6)) / 7;
  const startY = 140;
  const colH = 630;

  daysToShow.forEach((day, idx) => {
    const x = startX + idx * (colW + gap);
    const dayTasks = state.weeklyTasks.filter(t => t.dayId === day.id);
    const completedCount = dayTasks.filter(t => state.completedTaskIds.has(t.id)).length;

    // Column background card
    ctx.fillStyle = '#172226';
    ctx.beginPath();
    ctx.roundRect(x, startY, colW, colH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Column Header Box
    ctx.fillStyle = '#1e2d33';
    ctx.beginPath();
    ctx.roundRect(x + 2, startY + 2, colW - 4, 48, [10, 10, 0, 0]);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0f4f5';
    ctx.font = 'bold 17px Cairo, sans-serif';
    ctx.fillText(day.name, x + colW / 2, startY + 28);

    ctx.fillStyle = '#8b9ea3';
    ctx.font = '11px Cairo, sans-serif';
    ctx.fillText(`${completedCount}/${dayTasks.length} مهام`, x + colW / 2, startY + 44);

    // Routine Badge
    ctx.fillStyle = '#23363e';
    ctx.beginPath();
    ctx.roundRect(x + 8, startY + 58, colW - 16, 42, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(86, 194, 166, 0.3)';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#56c2a6';
    ctx.font = 'bold 11px Cairo, sans-serif';
    const routineShort = day.routineBadge.length > 25 ? day.routineBadge.substring(0, 24) + '..' : day.routineBadge;
    ctx.fillText(routineShort, x + colW / 2, startY + 83);

    // Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(x + 10, startY + 110);
    ctx.lineTo(x + colW - 10, startY + 110);
    ctx.stroke();

    // Tasks list inside column
    let taskY = startY + 130;
    const tasksToDraw = dayTasks.slice(0, 8);

    tasksToDraw.forEach(t => {
      const isDone = state.completedTaskIds.has(t.id);
      const sub = state.subjects.find(s => s.id === t.subjId) || { name: 'عام', color: '#818cf8' };

      // Task item background
      ctx.fillStyle = isDone ? 'rgba(16, 185, 129, 0.08)' : '#1b272c';
      ctx.beginPath();
      ctx.roundRect(x + 8, taskY, colW - 16, 46, 6);
      ctx.fill();
      ctx.strokeStyle = isDone ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Checkbox circle
      ctx.fillStyle = isDone ? '#10b981' : '#2b3b41';
      ctx.beginPath();
      ctx.arc(x + 22, taskY + 23, 7, 0, Math.PI * 2);
      ctx.fill();

      // Task Text
      ctx.textAlign = 'right';
      ctx.fillStyle = isDone ? '#8b9ea3' : '#f0f4f5';
      ctx.font = '600 11px Cairo, sans-serif';
      const cleanText = t.text.length > 22 ? t.text.substring(0, 21) + '..' : t.text;
      ctx.fillText(cleanText, x + colW - 16, taskY + 20);

      // Subject tag
      ctx.fillStyle = sub.color;
      ctx.font = '10px Cairo, sans-serif';
      ctx.fillText(sub.name, x + colW - 16, taskY + 36);

      taskY += 52;
    });

    if (dayTasks.length > 8) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px Cairo, sans-serif';
      ctx.fillText(`+ ${dayTasks.length - 8} مهام أخرى مسجلة`, x + colW / 2, taskY + 15);
    }
  });

  // Export to image
  const dataUrl = canvas.toDataURL('image/png');
  const imgElem = document.getElementById('schedulePosterImg');
  const downloadLink = document.getElementById('downloadSchedulePosterLink');
  if (imgElem) imgElem.src = dataUrl;
  if (downloadLink) {
    downloadLink.href = dataUrl;
    downloadLink.download = 'kareem-weekly-schedule.png';
  }

  const modal = document.getElementById('scheduleImageModal');
  if (modal) modal.classList.add('show');
};


function renderSubjectsGrid() {
  const container = document.getElementById('subjectsContainer');
  if (!container) return;
  
  container.innerHTML = state.subjects.map(s => {
    const todayMins = getSubjectMinutesToday(s.id);
    const allMins = getSubjectAllTimeMinutes(s.id);
    return `
      <div class="subject-card" style="--sub-color:${s.color}">
        <div class="subject-info">
          <div class="subject-icon-box">
            ${getSvgIcon(s.icon, 20)}
          </div>
          <div>
            <div class="subject-name">${s.name}</div>
            <div class="subject-time tabular">
              <div style="font-weight:700; color:var(--text-main);">كله في كله: ${fmtHM(allMins)}</div>
              <div style="font-size:11px; color:var(--text-muted);">اليوم: ${fmtHM(todayMins)}</div>
            </div>
          </div>
        </div>
        <div class="subject-gauge">
          <canvas id="gauge-${s.id}"></canvas>
        </div>
      </div>
    `;
  }).join('');
}

function renderExemptions() {
  const list = document.getElementById('exemptList');
  if (!list) return;
  
  const today = new Date().toDateString();
  const todayExempts = state.lessonExemptions.filter(e => new Date(e.timestamp).toDateString() === today);
  
  if (!todayExempts.length) {
    list.innerHTML = `<div style="font-size:12px; color:var(--text-faint); margin-top:8px;">لم تسجل حصصاً أو دروساً خارج المذاكرة بعد.</div>`;
    return;
  }
  
  list.innerHTML = todayExempts.map((e, idx) => `
    <div class="exempt-box">
      <div class="exempt-info">
        <span class="exempt-tag">${getSvgIcon('book-open', 14)} ${e.title}</span>
        <span>${fmtHM(e.minutes)}</span>
      </div>
      <button class="btn btn-sm btn-icon" onclick="deleteExemption(${idx})" title="حذف">
        ${getSvgIcon('trash', 14)}
      </button>
    </div>
  `).join('');
}

function renderLogList() {
  const list = document.getElementById('logItemsContainer');
  if (!list) return;
  
  if (!state.sessions.length) {
    list.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">لا يوجد جلسات مسجلة بعد. انطلق في أول جلسة!</div>`;
    return;
  }
  
  const sorted = [...state.sessions].sort((a, b) => b.tsEnd - a.tsEnd);
  list.innerHTML = sorted.map((s, idx) => {
    const dateStr = new Date(s.tsEnd).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const entries = (s.entries || []).map(en => {
      const sub = state.subjects.find(x => x.id === en.subj);
      return `
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="log-badge" style="background:${sub ? sub.color : '#888'}">${sub ? sub.name : 'مهمة'}</span>
          <span class="log-item-task">${en.task}</span>
        </div>
      `;
    }).join('');
    
    return `
      <div class="log-item">
        <div class="log-item-left">
          <div>
            ${entries}
            <div class="log-item-date">${dateStr}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:14px;">
          <div class="log-item-duration tabular">${s.minutes} دقيقة</div>
          <button class="btn btn-sm btn-icon" onclick="deleteSession(${idx})" title="حذف">${getSvgIcon('trash', 14)}</button>
        </div>
      </div>
    `;
  }).join('');
}

// --- ACTIONS & CONTROLS ---

// Start or Resume Session
function startNewSession(subjId, task) {
  state.activeSession = {
    startTs: Date.now(),
    elapsedBefore: 0,
    breakStart: null,
    subjId: subjId || state.subjects[0].id,
    task: task || 'مذاكرة مركزة',
    timerInt: null
  };
  
  persistActiveSession();
  startActiveTimer();
  showView('focusView');
  toast('انطلقت جلسة التركيز! بالتوفيق يا بطل', 'flame');
}

function startActiveTimer() {
  if (!state.activeSession) return;
  clearInterval(state.activeSession.timerInt);
  state.activeSession.timerInt = setInterval(() => {
    persistActiveSession();
    renderUI();
  }, 500);
}

// Pause / Take Break
function startBreak() {
  if (!state.activeSession || state.activeSession.breakStart) return;
  
  state.activeSession.elapsedBefore += (Date.now() - state.activeSession.startTs);
  state.activeSession.breakStart = Date.now();
  persistActiveSession();
  
  showBreakModal(true);
}

function resumeFromBreak() {
  if (!state.activeSession || !state.activeSession.breakStart) return;
  
  state.activeSession.startTs = Date.now();
  state.activeSession.breakStart = null;
  persistActiveSession();
  
  showBreakModal(false);
  toast('استأنفت المذاكرة! مرحباً بعودتك للتركيز', 'play');
}

function showBreakModal(show) {
  const modal = document.getElementById('breakModal');
  if (!modal) return;
  
  if (show) {
    modal.classList.add('show');
    clearInterval(state.breakTimer);
    state.breakTimer = setInterval(() => {
      if (state.activeSession && state.activeSession.breakStart) {
        const sec = Math.floor((Date.now() - state.activeSession.breakStart) / 1000);
        document.getElementById('breakClockNum').textContent = fmtClock(sec);
      }
    }, 1000);
  } else {
    modal.classList.remove('show');
    clearInterval(state.breakTimer);
  }
}

// End Session
function finishSession() {
  if (!state.activeSession) return;
  
  if (state.activeSession.breakStart) {
    state.activeSession.breakStart = null;
    showBreakModal(false);
  }
  
  const sec = getActiveSessionSeconds();
  clearInterval(state.activeSession.timerInt);
  
  if (sec < 60) {
    toast('الجلسة أقل من دقيقة، لم تُحتسب.', 'alert-triangle');
    state.activeSession = null;
    persistActiveSession();
    showView('dashView');
    renderUI();
    return;
  }
  
  // Open Mission Finish Modal
  const mins = Math.floor(sec / 60);
  document.getElementById('logDurationNotice').textContent = `أنجزت ${mins} دقيقة تركيز تام ⏱️`;
  
  // Fill subject options
  const sel = document.getElementById('finishSubjSelect');
  sel.innerHTML = state.subjects.map(s => `
    <option value="${s.id}" ${s.id === state.activeSession.subjId ? 'selected' : ''}>${s.name}</option>
  `).join('');
  
  document.getElementById('finishTaskInput').value = state.activeSession.task || '';
  document.getElementById('finishModal').classList.add('show');
}

// --- FIREBASE SYNC FUNCTIONS ---
function updateCloudIndicator(connected) {
  const el = document.getElementById('cloudStatusIndicator');
  if (!el) return;
  if (connected) {
    el.style.background = 'rgba(16, 185, 129, 0.12)';
    el.style.color = '#10b981';
    el.innerHTML = `<span style="width:6px; height:6px; border-radius:50%; background:#10b981; display:inline-block;"></span> سحابي (Firebase متصل)`;
  } else {
    el.style.background = 'rgba(245, 158, 11, 0.12)';
    el.style.color = '#f59e0b';
    el.innerHTML = `<span style="width:6px; height:6px; border-radius:50%; background:#f59e0b; display:inline-block;"></span> وضع محلي آمن`;
  }
}

function initFirebase() {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    rtdb = getDatabase(firebaseApp);
    sessionsDbRef = ref(rtdb, 'shapap/sessions');
    exemptionsDbRef = ref(rtdb, 'shapap/exemptions');

    // Live sync for sessions
    onValue(sessionsDbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, item]) => ({
          fbKey: key,
          ...item
        }));
        state.sessions = list;
        localStorage.setItem('kareem_sessions_v3', JSON.stringify(list));
        isFirebaseConnected = true;
        updateCloudIndicator(true);
        renderUI();
      }
    }, (err) => {
      console.warn('Firebase sessions note (local mode active):', err.message);
      updateCloudIndicator(false);
    });

    // Live sync for exemptions
    onValue(exemptionsDbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, item]) => ({
          fbKey: key,
          ...item
        }));
        state.lessonExemptions = list;
        localStorage.setItem('kareem_exemptions_today', JSON.stringify(list));
        renderUI();
      }
    }, (err) => {
      console.warn('Firebase exemptions note:', err.message);
    });

    isFirebaseConnected = true;
    updateCloudIndicator(true);
  } catch (err) {
    console.warn('Firebase init fallback:', err);
    updateCloudIndicator(false);
  }
}

function saveFinishedSession() {
  const sec = getActiveSessionSeconds();
  const mins = Math.floor(sec / 60);
  const subjId = document.getElementById('finishSubjSelect').value;
  const task = document.getElementById('finishTaskInput').value.trim() || 'مذاكرة';
  
  const sessionRecord = {
    id: 's_' + Date.now(),
    tsStart: state.activeSession.startTs,
    tsEnd: Date.now(),
    minutes: mins,
    entries: [{ subj: subjId, task }]
  };
  
  // Realtime Database Push
  if (rtdb && sessionsDbRef) {
    try {
      push(sessionsDbRef, sessionRecord).catch(e => console.warn('Firebase push offline:', e));
    } catch (e) {
      console.warn('Firebase error:', e);
    }
  }

  state.sessions.push(sessionRecord);
  localStorage.setItem('kareem_sessions_v3', JSON.stringify(state.sessions));
  
  state.activeSession = null;
  persistActiveSession();
  
  document.getElementById('finishModal').classList.remove('show');
  showView('dashView');
  renderUI();
  toast('تم توثيق إنجازك وحفظه سحابياً في تاريخك!', 'check');
}

// Exemption (Lesson / Class)
function addExemption(title, minutes) {
  const record = {
    id: 'ex_' + Date.now(),
    title,
    minutes: parseInt(minutes, 10),
    timestamp: Date.now()
  };
  
  // Realtime Database Push
  if (rtdb && exemptionsDbRef) {
    try {
      push(exemptionsDbRef, record).catch(e => console.warn('Exemption push note:', e));
    } catch(e) {}
  }

  state.lessonExemptions.push(record);
  localStorage.setItem('kareem_exemptions_today', JSON.stringify(state.lessonExemptions));
  renderUI();
  toast('تم تسجيل الحصة ولن تُحسب كوقت ضائع!', 'check');
}

window.deleteExemption = function(idx) {
  const item = state.lessonExemptions[idx];
  if (item && item.fbKey && rtdb) {
    try {
      remove(ref(rtdb, `shapap/exemptions/${item.fbKey}`)).catch(e => console.warn('Exemption remove note', e));
    } catch(e) {}
  }
  state.lessonExemptions.splice(idx, 1);
  localStorage.setItem('kareem_exemptions_today', JSON.stringify(state.lessonExemptions));
  renderUI();
};

window.deleteSession = function(idx) {
  const item = state.sessions[idx];
  if (item && item.fbKey && rtdb) {
    try {
      remove(ref(rtdb, `shapap/sessions/${item.fbKey}`)).catch(e => console.warn('Remove error', e));
    } catch(e) {}
  }
  state.sessions.splice(idx, 1);
  localStorage.setItem('kareem_sessions_v3', JSON.stringify(state.sessions));
  renderUI();
  toast('تم حذف الجلسة', 'trash');
};

// Ambient Rain Audio
function toggleRainAudio() {
  if (!state.rainAudio) {
    state.rainAudio = new Audio('https://cdn.pixabay.com/download/audio/2021/08/09/audio_6b825eb94c.mp3?filename=light-rain-109591.mp3');
    state.rainAudio.loop = true;
  }
  
  const btn = document.getElementById('rainAudioBtn');
  if (state.isRainPlaying) {
    state.rainAudio.pause();
    state.isRainPlaying = false;
    btn.classList.remove('btn-primary');
    btn.innerHTML = `${getSvgIcon('cloud-rain', 16)} صوت المطر`;
  } else {
    state.rainAudio.play().catch(e => console.warn('Audio play restricted', e));
    state.isRainPlaying = true;
    btn.classList.add('btn-primary');
    btn.innerHTML = `${getSvgIcon('cloud-rain', 16)} إيقاف المطر`;
  }
}

// Motivational Quotes
async function loadMotivationQuotes() {
  try {
    const res = await fetch(encodeURI('تحفيز.json'));
    if (res.ok) {
      state.quotes = await res.json();
    }
  } catch (e) {
    console.warn('Quotes fetch fallback', e);
  }
  if (!state.quotes.length) {
    state.quotes = [
      "يا كريم، اسْعَ بكل قوتك وكأن النجاح بيدِك وحده، وتوكّل بكل قلبك وكأن التوفيق بيد الله وحده.",
      "على قَدْرِ أهْلِ العَزْم تأتي العَزائِمُ، والهمة العالية تصنع المعجزات.",
      "التعب المؤقت يزول، لكن شرف الإنجاز ومذاق التفوق يدوم دائماً يا بطل."
    ];
  }
  nextQuote();
  clearInterval(state.quoteTimer);
  state.quoteTimer = setInterval(nextQuote, 25000);
}

function nextQuote() {
  const quoteElem = document.getElementById('motivationQuoteBox');
  if (!quoteElem || !state.quotes.length) return;
  
  quoteElem.style.opacity = '0';
  setTimeout(() => {
    state.currentQuoteIdx = Math.floor(Math.random() * state.quotes.length);
    quoteElem.textContent = state.quotes[state.currentQuoteIdx];
    quoteElem.style.opacity = '1';
  }, 350);
}

// Toast
function toast(msg, iconName = 'sparkles') {
  const el = document.getElementById('appToast');
  if (!el) return;
  el.innerHTML = `${getSvgIcon(iconName, 16)} <span>${msg}</span>`;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3200);
}

// View Navigation
function showView(viewId) {
  document.querySelectorAll('.view-panel').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  
  const target = document.getElementById(viewId);
  if (target) target.classList.add('active');
  
  const tabBtn = document.querySelector(`[data-tab="${viewId}"]`);
  if (tabBtn) tabBtn.classList.add('active');
  
  window.scrollTo(0, 0);
  renderUI();
}

// --- EVENT BINDINGS & INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Navigation tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showView(btn.dataset.tab);
    });
  });
  
  // Theme selection
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    const savedTheme = localStorage.getItem('kareem_theme_v3') || 'default';
    document.body.setAttribute('data-theme', savedTheme);
    themeSelect.value = savedTheme;
    themeSelect.addEventListener('change', (e) => {
      document.body.setAttribute('data-theme', e.target.value);
      localStorage.setItem('kareem_theme_v3', e.target.value);
      renderUI();
    });
  }
  
  // Visualizer switcher
  document.querySelectorAll('.viz-btn').forEach(btn => {
    if (btn.dataset.viz === state.vizMode) btn.classList.add('active');
    btn.addEventListener('click', () => {
      document.querySelectorAll('.viz-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.vizMode = btn.dataset.viz;
      localStorage.setItem('kareem_viz_mode', state.vizMode);
      renderUI();
    });
  });
  
  // Launch button
  const launchBtn = document.getElementById('launchFocusBtn');
  if (launchBtn) {
    launchBtn.addEventListener('click', () => {
      document.getElementById('startModalSubjSelect').innerHTML = state.subjects.map(s => `
        <option value="${s.id}">${s.name}</option>
      `).join('');
      document.getElementById('startSessionModal').classList.add('show');
    });
  }
  
  // Confirm Start Session Modal
  document.getElementById('confirmStartSessionBtn').addEventListener('click', () => {
    const subjId = document.getElementById('startModalSubjSelect').value;
    const task = document.getElementById('startModalTaskInput').value.trim();
    document.getElementById('startSessionModal').classList.remove('show');
    startNewSession(subjId, task);
  });
  
  // Focus action buttons
  document.getElementById('focusBreakBtn').addEventListener('click', startBreak);
  document.getElementById('focusEndBtn').addEventListener('click', finishSession);
  document.getElementById('resumeBreakBtn').addEventListener('click', resumeFromBreak);
  document.getElementById('saveSessionBtn').addEventListener('click', saveFinishedSession);
  
  // Sound toggle
  const rainBtn = document.getElementById('rainAudioBtn');
  if (rainBtn) rainBtn.addEventListener('click', toggleRainAudio);
  
  // Next quote button
  const nextQBtn = document.getElementById('nextQuoteBtn');
  if (nextQBtn) nextQBtn.addEventListener('click', nextQuote);
  
  // Lesson Exemption Modal
  const addExemptBtn = document.getElementById('addExemptModalBtn');
  if (addExemptBtn) {
    addExemptBtn.addEventListener('click', () => {
      document.getElementById('exemptModal').classList.add('show');
    });
  }
  
  document.getElementById('confirmExemptBtn').addEventListener('click', () => {
    const title = document.getElementById('exemptTitleInput').value.trim() || 'درس خارجي';
    const mins = document.getElementById('exemptMinutesInput').value;
    if (mins && mins > 0) {
      addExemption(title, mins);
      document.getElementById('exemptModal').classList.remove('show');
      document.getElementById('exemptTitleInput').value = '';
    }
  });
  
  // Modal cancel buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('show'));
    });
  });
  
  // Toggle time mode on canvas center click
  const centerInfo = document.querySelector('.canvas-center-info');
  if (centerInfo) {
    centerInfo.style.pointerEvents = 'auto';
    centerInfo.style.cursor = 'pointer';
    centerInfo.addEventListener('click', () => {
      state.displayTimeMode = state.displayTimeMode === 'allTime' ? 'today' : 'allTime';
      localStorage.setItem('kareem_display_mode', state.displayTimeMode);
      toast(state.displayTimeMode === 'allTime' ? 'تم تحويل العرض إلى: إجمالي المسيرة (كله في كله)' : 'تم تحويل العرض إلى: طاقة اليوم', 'timer');
      renderUI();
    });
  }

  // --- WEEKLY PLANNER EVENT BINDINGS ---
  // Open Add Task Modal
  const openNewTaskBtn = document.getElementById('openNewTaskModalBtn');
  if (openNewTaskBtn) {
    openNewTaskBtn.addEventListener('click', () => {
      const modal = document.getElementById('newWeeklyTaskModal');
      if (modal) {
        document.getElementById('newTaskTitleInput').value = '';
        document.getElementById('newTaskPrioritySelect').value = 'normal';
        document.getElementById('newTaskContextWrap').style.display = 'none';
        modal.classList.add('show');
      }
    });
  }

  // Priority change handles context wrap
  const prioritySelect = document.getElementById('newTaskPrioritySelect');
  if (prioritySelect) {
    prioritySelect.addEventListener('change', (e) => {
      const wrap = document.getElementById('newTaskContextWrap');
      const label = document.getElementById('newTaskContextLabel');
      const input = document.getElementById('newTaskContextInput');
      if (e.target.value === 'exam') {
        wrap.style.display = 'block';
        label.textContent = 'موعد وتفاصيل الامتحان:';
        input.placeholder = 'مثال: امتحان فيزياء شامل الخميس 6:00 م';
      } else if (e.target.value === 'class') {
        wrap.style.display = 'block';
        label.textContent = 'موعد الحصة أو السنتر:';
        input.placeholder = 'مثال: قبل درس الإنجليزي 7:00 مساءً';
      } else {
        wrap.style.display = 'none';
      }
    });
  }

  // Save New Task
  const saveNewTaskBtn = document.getElementById('saveNewTaskBtn');
  if (saveNewTaskBtn) {
    saveNewTaskBtn.addEventListener('click', () => {
      const title = document.getElementById('newTaskTitleInput').value.trim();
      if (!title) {
        toast('من فضلك اكتب عنوان أو تفاصيل المهمة أولاً', 'alert-triangle');
        return;
      }
      const subjId = document.getElementById('newTaskSubjSelect').value;
      const dayId = document.getElementById('newTaskDaySelect').value;
      const priority = document.getElementById('newTaskPrioritySelect').value;
      const contextInfo = document.getElementById('newTaskContextInput').value.trim();

      const newTask = {
        id: Date.now(),
        dayId,
        subjId,
        text: title,
        priority,
        contextInfo: contextInfo || ''
      };

      state.weeklyTasks.push(newTask);
      persistWeeklyTasks();
      renderWeeklyPlannerUI();
      document.getElementById('newWeeklyTaskModal').classList.remove('show');
      toast('تمت إضافة المهمة بنجاح إلى جدول الأسبوع! ⚡', 'check');
    });
  }

  // Carry Over Modal
  const triggerCarryBtn = document.getElementById('triggerCarryOverBtn');
  if (triggerCarryBtn) {
    triggerCarryBtn.addEventListener('click', () => {
      const modal = document.getElementById('carryOverModal');
      if (modal) modal.classList.add('show');
    });
  }

  const confirmCarryBtn = document.getElementById('confirmCarryOverBtn');
  if (confirmCarryBtn) {
    confirmCarryBtn.addEventListener('click', () => {
      const targetDay = document.getElementById('carryOverTargetDaySelect').value;
      document.getElementById('carryOverModal').classList.remove('show');
      window.carryOverUnfinishedTasks(targetDay);
    });
  }

  // Reset Tasks Modal
  const openResetBtn = document.getElementById('openResetTasksBtn');
  if (openResetBtn) {
    openResetBtn.addEventListener('click', () => {
      const modal = document.getElementById('resetTasksModal');
      if (modal) modal.classList.add('show');
    });
  }

  const confirmResetCompletedOnlyBtn = document.getElementById('confirmResetCompletedOnlyBtn');
  if (confirmResetCompletedOnlyBtn) {
    confirmResetCompletedOnlyBtn.addEventListener('click', () => {
      document.getElementById('resetTasksModal').classList.remove('show');
      window.resetTasksProgress('completed_only');
    });
  }

  const confirmResetAllTasksBtn = document.getElementById('confirmResetAllTasksBtn');
  if (confirmResetAllTasksBtn) {
    confirmResetAllTasksBtn.addEventListener('click', () => {
      document.getElementById('resetTasksModal').classList.remove('show');
      window.resetTasksProgress('all');
    });
  }

  // Day Filter Pills
  document.querySelectorAll('#dayFilterPillsContainer .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.filterTasksByDay(btn.dataset.filter);
    });
  });

  // Load quotes and start render loops
  initFirebase();
  loadMotivationQuotes();
  drawMainVisualizer();
  restoreActiveSession();
  renderUI();
  
  // Continuous UI clock tick
  setInterval(renderUI, 1000);
});
