/**
 * SHAPAP | Kareem Workspace - Core Engine
 * Complete interactive study suite with continuous spirals, multi-gauge counters,
 * session persistence across reloads, wasted time calculations, and lesson exemptions.
 */

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

// App State
const state = {
  subjects: JSON.parse(localStorage.getItem('kareem_subjects') || 'null') || DEFAULT_SUBJECTS,
  sessions: JSON.parse(localStorage.getItem('kareem_sessions_v3') || '[]'),
  lessonExemptions: JSON.parse(localStorage.getItem('kareem_exemptions_today') || '[]'),
  dayStartHour: 8, // Day considered starting at 8:00 AM
  activeSession: null, // Restored from localStorage if exists
  breakTimer: null,
  vizMode: localStorage.getItem('kareem_viz_mode') || 'spiral', // 'spiral' | 'rings' | 'zen'
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
    .reduce((acc, s) => acc + s.minutes, 0);
    
  const currentMins = state.activeSession ? Math.floor(getActiveSessionSeconds() / 60) : 0;
  return pastMins + currentMins;
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

// --- VISUALIZATIONS (Canvas Drawing) ---
const mainCanvas = document.getElementById('mainVisualizerCanvas');
const mainCtx = mainCanvas.getContext('2d');

function drawMainVisualizer() {
  if (!mainCanvas) return;
  const rect = mainCanvas.getBoundingClientRect();
  const size = Math.floor(rect.width * (window.devicePixelRatio || 1));
  if (mainCanvas.width !== size) {
    mainCanvas.width = size;
    mainCanvas.height = size;
  }
  
  const ctx = mainCtx;
  const cx = size / 2;
  const cy = size / 2;
  ctx.clearRect(0, 0, size, size);
  
  const studyMins = getStudyMinutesToday();
  const t = performance.now() / 1000;
  
  const style = getComputedStyle(document.body);
  const primaryColor = style.getPropertyValue('--accent-primary').trim() || '#56c2a6';
  const secondaryColor = style.getPropertyValue('--accent-secondary').trim() || '#63b3ed';
  
  if (state.vizMode === 'spiral') {
    // Archimedean Connected Helix Ribbon with Smooth Math
    const maxRadius = size * 0.44;
    const baseR = size * 0.08;
    const turns = 3.5;
    const progressRings = Math.min(turns, Math.max(0.1, (studyMins / 60) * 0.6));
    
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
    ctx.lineWidth = 5 * (window.devicePixelRatio || 1);
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
    
    // Head Particle orb
    const headTheta = activeMaxTheta;
    const headR = baseR + (maxRadius - baseR) * (headTheta / (Math.PI * 2 * turns));
    const hx = cx + Math.cos(headTheta + t * 0.05) * headR;
    const hy = cy + Math.sin(headTheta + t * 0.05) * headR;
    ctx.beginPath();
    ctx.arc(hx, hy, 6 * (window.devicePixelRatio || 1), 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = secondaryColor;
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.restore();
    
  } else if (state.vizMode === 'rings') {
    // Concentric Radar Rings
    const rings = 4;
    const maxR = size * 0.43;
    for (let i = 1; i <= rings; i++) {
      const r = (maxR / rings) * i;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 2 * (window.devicePixelRatio || 1);
      ctx.stroke();
    }
    
    // Fill rings based on subjects
    const subjs = state.subjects;
    subjs.forEach((s, idx) => {
      const r = (maxR / rings) * (idx + 1);
      const subMins = getSubjectMinutesToday(s.id);
      const ratio = Math.min(1, subMins / (s.targetMinutes || 120));
      if (ratio > 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 4.5 * (window.devicePixelRatio || 1);
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    });
    
  } else {
    // Zen Minimalist Gauge with Subtle Ticks
    const r = size * 0.42;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 8 * (window.devicePixelRatio || 1);
    ctx.stroke();
    
    // Ticks
    const totalTicks = 60;
    for (let i = 0; i < totalTicks; i++) {
      const angle = (i / totalTicks) * Math.PI * 2;
      const isMajor = i % 5 === 0;
      const inner = r - (isMajor ? 12 : 6);
      const outer = r - 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      ctx.strokeStyle = isMajor ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = isMajor ? 2 : 1;
      ctx.stroke();
    }
    
    // Main target sweep
    const target = 300; // 5 hours goal
    const pct = Math.min(1, studyMins / target);
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 8 * (window.devicePixelRatio || 1);
    ctx.lineCap = 'round';
    ctx.stroke();
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
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.38, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 3.5 * dpr;
    ctx.stroke();
    
    // Active progress arc
    if (pct > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.38, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * pct));
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

// --- RENDER APPLICATION VIEWS ---
function renderUI() {
  const studyMins = getStudyMinutesToday();
  const clockText = fmtHMEn(studyMins);
  
  // Center Clock in Canvas
  const centerNum = document.getElementById('canvasCenterNum');
  if (centerNum) centerNum.textContent = clockText;
  
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
}

function renderSubjectsGrid() {
  const container = document.getElementById('subjectsContainer');
  if (!container) return;
  
  container.innerHTML = state.subjects.map(s => {
    const mins = getSubjectMinutesToday(s.id);
    return `
      <div class="subject-card" style="--sub-color:${s.color}">
        <div class="subject-info">
          <div class="subject-icon-box">
            ${getSvgIcon(s.icon, 20)}
          </div>
          <div>
            <div class="subject-name">${s.name}</div>
            <div class="subject-time tabular">${fmtHM(mins)} / هدف ${fmtHM(s.targetMinutes)}</div>
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
  
  state.sessions.push(sessionRecord);
  localStorage.setItem('kareem_sessions_v3', JSON.stringify(state.sessions));
  
  state.activeSession = null;
  persistActiveSession();
  
  document.getElementById('finishModal').classList.remove('show');
  showView('dashView');
  renderUI();
  toast('تم توثيق إنجازك بنجاح في السجل!', 'check');
}

// Exemption (Lesson / Class)
function addExemption(title, minutes) {
  state.lessonExemptions.push({
    id: 'ex_' + Date.now(),
    title,
    minutes: parseInt(minutes, 10),
    timestamp: Date.now()
  });
  localStorage.setItem('kareem_exemptions_today', JSON.stringify(state.lessonExemptions));
  renderUI();
  toast('تم تسجيل الحصة ولن تُحسب كوقت ضائع!', 'check');
}

window.deleteExemption = function(idx) {
  state.lessonExemptions.splice(idx, 1);
  localStorage.setItem('kareem_exemptions_today', JSON.stringify(state.lessonExemptions));
  renderUI();
};

window.deleteSession = function(idx) {
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
  
  // Load quotes and start render loops
  loadMotivationQuotes();
  drawMainVisualizer();
  restoreActiveSession();
  renderUI();
  
  // Continuous UI clock tick
  setInterval(renderUI, 1000);
});
