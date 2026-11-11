import React, { useState, useMemo, useEffect } from 'react';
import { Session, Subject } from '../types';
import {
  Grid,
  Calendar,
  Flame,
  Award,
  Clock,
  Sparkles,
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  BookOpen
} from 'lucide-react';

interface AllTimeMatrixViewProps {
  sessions: Session[];
  subjects: Subject[];
  onStartFocus?: (subjId: string) => void;
  onSessionsUpdated?: (newSessions: Session[]) => void;
}

const LOCAL_STORAGE_CACHE_KEY = 'kareem_alltime_matrix_sessions_cache';
const LOCAL_STORAGE_LAST_SYNC_KEY = 'kareem_alltime_matrix_last_sync';

export const AllTimeMatrixView: React.FC<AllTimeMatrixViewProps> = ({
  sessions: parentSessions,
  subjects,
  onStartFocus,
  onSessionsUpdated
}) => {
  // Local cached sessions state (offline-first, no automatic Firebase call)
  const [localSessions, setLocalSessions] = useState<Session[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse local all-time sessions cache:', e);
    }
    return parentSessions;
  });

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem(LOCAL_STORAGE_LAST_SYNC_KEY) || null;
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters & Inspector
  const [selectedSubj, setSelectedSubj] = useState<string>('all');
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    key: string;
    dateStr: string;
    dayName: string;
    fullDate: string;
    minutes: number;
    hours: string;
    level: number;
    daySessions: Session[];
  } | null>(null);

  // Sync to local cache whenever parentSessions changes if no cache exists
  useEffect(() => {
    if (parentSessions.length > 0 && !localStorage.getItem(LOCAL_STORAGE_CACHE_KEY)) {
      try {
        localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(parentSessions));
        setLocalSessions(parentSessions);
      } catch (e) {}
    }
  }, [parentSessions]);

  // ON-DEMAND Firebase Sync: STRICTLY only when the user clicks the connect button
  const handleManualFirebaseConnect = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const res = await fetch('https://shapap-13c58-default-rtdb.firebaseio.com/shapap/sessions.json', {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) {
        throw new Error(`تعذر الاتصال بقاعدة الفايربيس (كود: ${res.status})`);
      }
      const remoteData = await res.json();
      if (!remoteData) {
        throw new Error('لم يتم العثور على سجلات في الفايربيس');
      }

      // Convert remote map or array into Session array
      let remoteSessions: Session[] = [];
      if (Array.isArray(remoteData)) {
        remoteSessions = remoteData.filter(Boolean);
      } else if (typeof remoteData === 'object') {
        remoteSessions = Object.entries(remoteData).map(([key, val]: [string, any]) => ({
          ...val,
          fbKey: key,
          id: val.id || key
        }));
      }

      // Merge remote with local to ensure nothing is lost
      const sessionsMap = new Map<string, Session>();
      localSessions.forEach((s) => {
        const k = s.id || s.fbKey || `${s.tsStart}_${s.minutes}`;
        sessionsMap.set(k, s);
      });
      remoteSessions.forEach((s) => {
        const k = s.id || s.fbKey || `${s.tsStart}_${s.minutes}`;
        sessionsMap.set(k, s);
      });

      const mergedSessions = Array.from(sessionsMap.values()).sort(
        (a, b) => (b.tsStart || 0) - (a.tsStart || 0)
      );

      // Save to localStorage
      localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(mergedSessions));
      const syncDateStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('ar-EG');
      localStorage.setItem(LOCAL_STORAGE_LAST_SYNC_KEY, syncDateStr);
      setLastSyncTime(syncDateStr);
      setLocalSessions(mergedSessions);

      if (onSessionsUpdated) {
        onSessionsUpdated(mergedSessions);
      }

      setSyncStatusMsg({
        type: 'success',
        text: `⚡ تم الاتصال بالفايربيس وتحديث جميع الأيام التاريخية بنجاح! (${mergedSessions.length} جلسة مسجلة)`
      });
    } catch (err: any) {
      console.error('Firebase manual connect error:', err);
      setSyncStatusMsg({
        type: 'error',
        text: err.message || 'حدث خطأ أثناء الاتصال بالفايربيس، يرجى المحاولة مرة أخرى.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtered sessions based on selected subject
  const effectiveSessions = useMemo(() => {
    if (selectedSubj === 'all') return localSessions;
    return localSessions.filter((s) => {
      if (s.subjId === selectedSubj) return true;
      if (s.entries && s.entries.some((e) => e.subj === selectedSubj)) return true;
      return false;
    });
  }, [localSessions, selectedSubj]);

  // Compute All-Time Matrix spanning from earliest session to today
  const matrixData = useMemo(() => {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // Find the exact earliest session timestamp in the database (strictly delete any day prior to it)
    let minSessionTs: number | null = null;
    localSessions.forEach((s) => {
      const ts = s.tsStart || (s.date ? new Date(s.date).getTime() : 0);
      if (ts > 0) {
        if (minSessionTs === null || ts < minSessionTs) {
          minSessionTs = ts;
        }
      }
    });

    // Start strictly on the day of the first recorded session on the site
    const earliestTs = minSessionTs !== null ? minSessionTs : todayMidnight;
    const earliestDate = new Date(earliestTs);
    const alignedStartTs = new Date(
      earliestDate.getFullYear(),
      earliestDate.getMonth(),
      earliestDate.getDate()
    ).getTime();

    // Map each day to total minutes and sessions
    const dayMap = new Map<string, { mins: number; sessions: Session[] }>();

    effectiveSessions.forEach((s) => {
      const ts = s.tsStart || (s.date ? new Date(s.date).getTime() : 0);
      if (ts > 0) {
        const d = new Date(ts);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const existing = dayMap.get(key) || { mins: 0, sessions: [] };
        existing.mins += s.minutes || 0;
        existing.sessions.push(s);
        dayMap.set(key, existing);
      }
    });

    // Generate continuous list of days from alignedStartTs to today
    const totalDaysCount = Math.floor((todayMidnight - alignedStartTs) / ONE_DAY_MS) + 1;
    const allDays = [];
    const arabicDays = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    let totalRecordedMins = 0;
    let activeDaysCount = 0;
    let maxDayMins = 0;
    let maxDayDate = '';
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < totalDaysCount; i++) {
      const cellTs = alignedStartTs + i * ONE_DAY_MS;
      const cellDate = new Date(cellTs);
      const key = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
      const record = dayMap.get(key) || { mins: 0, sessions: [] };

      const dayMins = record.mins;
      totalRecordedMins += dayMins;

      if (dayMins > 0) {
        activeDaysCount++;
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        if (dayMins > maxDayMins) {
          maxDayMins = dayMins;
          maxDayDate = `${cellDate.getDate()} ${arabicMonths[cellDate.getMonth()]} ${cellDate.getFullYear()}`;
        }
      } else {
        tempStreak = 0;
      }

      // Calculate level (0 to 4)
      let level = 0;
      if (dayMins >= 360) level = 4; // 6h+
      else if (dayMins >= 240) level = 3; // 4h+
      else if (dayMins >= 120) level = 2; // 2h+
      else if (dayMins > 0) level = 1; // >0

      const isToday = cellTs === todayMidnight;
      if (isToday) {
        currentStreak = tempStreak;
      }

      allDays.push({
        key,
        ts: cellTs,
        dateStr: `${cellDate.getDate()}/${cellDate.getMonth() + 1}`,
        fullDate: `${cellDate.getDate()} ${arabicMonths[cellDate.getMonth()]} ${cellDate.getFullYear()}`,
        dayName: arabicDays[cellDate.getDay()],
        dayOfWeek: cellDate.getDay(),
        monthIndex: cellDate.getMonth(),
        monthName: arabicMonths[cellDate.getMonth()],
        year: cellDate.getFullYear(),
        minutes: dayMins,
        hours: (dayMins / 60).toFixed(1),
        level,
        isToday,
        sessions: record.sessions
      });
    }

    // Group days by Month for structured exploration
    const monthGroups: {
      id: string;
      title: string;
      year: number;
      monthIndex: number;
      days: typeof allDays;
      totalMins: number;
      activeDays: number;
    }[] = [];

    allDays.forEach((day) => {
      const groupId = `${day.year}-${day.monthIndex}`;
      let group = monthGroups.find((g) => g.id === groupId);
      if (!group) {
        group = {
          id: groupId,
          title: `${day.monthName} ${day.year}`,
          year: day.year,
          monthIndex: day.monthIndex,
          days: [],
          totalMins: 0,
          activeDays: 0
        };
        monthGroups.push(group);
      }
      group.days.push(day);
      group.totalMins += day.minutes;
      if (day.minutes > 0) {
        group.activeDays++;
      }
    });

    const totalHours = (totalRecordedMins / 60).toFixed(1);
    const avgActiveHours = activeDaysCount > 0 ? (totalRecordedMins / activeDaysCount / 60).toFixed(1) : '0';

    return {
      allDays,
      monthGroups,
      stats: {
        totalDaysCount,
        activeDaysCount,
        inactiveDaysCount: totalDaysCount - activeDaysCount,
        totalHours,
        avgActiveHours,
        longestStreak,
        currentStreak,
        maxDayMins,
        maxDayHours: (maxDayMins / 60).toFixed(1),
        maxDayDate
      }
    };
  }, [effectiveSessions, localSessions]);

  // Color generator based on intensity level
  const getCellBackground = (level: number) => {
    switch (level) {
      case 4:
        return 'linear-gradient(135deg, #38bdf8, #0ea5e9)'; // 6h+ Vibrant Cyan
      case 3:
        return '#059669'; // 4h+ Deep Emerald
      case 2:
        return '#10b981'; // 2h+ Green
      case 1:
        return 'rgba(16, 185, 129, 0.4)'; // >0 Light Green
      default:
        return 'rgba(255, 255, 255, 0.04)'; // 0h
    }
  };

  const getCellBorder = (level: number, isToday: boolean) => {
    if (isToday) return '2px solid var(--accent-secondary)';
    if (level === 4) return '1px solid rgba(56, 189, 248, 0.8)';
    if (level > 0) return '1px solid rgba(16, 185, 129, 0.4)';
    return '1px solid rgba(255, 255, 255, 0.06)';
  };

  return (
    <section className="view-panel active" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* 1. TOP HEADER & ON-DEMAND FIREBASE SYNC BAR */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(16, 185, 129, 0.2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-secondary)'
              }}>
                <Grid size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>المصفوفة الكبرى لتاريخ المذاكرة الشاملة</span>
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-secondary)', fontWeight: 700 }}>
                    كل الأيام المسجلة ⚡
                  </span>
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  سجل الاستمرارية التاريخي الشامل لكريم عمر منذ بداية العام الدراسي وحتى اليوم (محفوظ محلياً ولا يستدعي الفايربيس إلا بطلبك).
                </p>
              </div>
            </div>
          </div>

          {/* On-Demand Firebase Sync Trigger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <WifiOff size={13} style={{ color: 'var(--warning)' }} />
                <span>وضع التخزين المحلي (توفير الباقة)</span>
              </span>
              {lastSyncTime && (
                <span>آخر مزامنة: <strong className="tabular">{lastSyncTime}</strong></span>
              )}
            </div>

            <button
              className="btn btn-primary btn-sm"
              onClick={handleManualFirebaseConnect}
              disabled={isSyncing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(56, 189, 248, 0.25)'
              }}
            >
              <RefreshCw size={15} className={isSyncing ? 'spin-anim' : ''} />
              <span>{isSyncing ? 'جارِ الاتصال بالفايربيس...' : 'اتصال وتحديث من الفايربيس 🔄'}</span>
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncStatusMsg && (
          <div style={{
            marginTop: 16,
            padding: '10px 16px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: syncStatusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${syncStatusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: syncStatusMsg.type === 'success' ? 'var(--success)' : 'var(--danger)'
          }}>
            <CheckCircle2 size={16} />
            <span>{syncStatusMsg.text}</span>
          </div>
        )}
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-header">
            <span>إجمالي ساعات التاريخ</span>
            <Clock size={16} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="stat-value tabular" style={{ color: 'var(--accent-primary)' }}>
            {matrixData.stats.totalHours}h
          </div>
          <div className="stat-sub">
            عبر <strong className="tabular">{matrixData.stats.totalDaysCount}</strong> يوماً مسجلاً
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>الأيام النشطة بالمذاكرة</span>
            <Flame size={16} style={{ color: 'var(--warning)' }} />
          </div>
          <div className="stat-value tabular" style={{ color: 'var(--warning)' }}>
            {matrixData.stats.activeDaysCount} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>يوم</span>
          </div>
          <div className="stat-sub">
            بمعدل <strong className="tabular">{Math.round((matrixData.stats.activeDaysCount / (matrixData.stats.totalDaysCount || 1)) * 100)}%</strong> التزام
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>أطول سلسلة متواصلة</span>
            <Award size={16} style={{ color: '#a78bfa' }} />
          </div>
          <div className="stat-value tabular" style={{ color: '#a78bfa' }}>
            {matrixData.stats.longestStreak} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>أيام</span>
          </div>
          <div className="stat-sub">
            السلسلة الحالية: <strong className="tabular">{matrixData.stats.currentStreak}</strong> يوم
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>متوسط اليوم النشط</span>
            <BarChart2 size={16} style={{ color: 'var(--accent-secondary)' }} />
          </div>
          <div className="stat-value tabular" style={{ color: 'var(--accent-secondary)' }}>
            {matrixData.stats.avgActiveHours}h
          </div>
          <div className="stat-sub">
            أعلى يوم: <strong className="tabular">{matrixData.stats.maxDayHours}h</strong> ({matrixData.stats.maxDayDate})
          </div>
        </div>
      </div>

      {/* 3. SUBJECT FILTER TOOLBAR */}
      <div className="card" style={{ padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={14} />
            <span>تصفية حسب المادة:</span>
          </span>
          <button
            className={`btn btn-sm ${selectedSubj === 'all' ? 'btn-primary' : ''}`}
            onClick={() => setSelectedSubj('all')}
            style={{ fontWeight: 700 }}
          >
            جميع المواد ({localSessions.length} جلسة)
          </button>
          {subjects.map((s) => {
            const count = localSessions.filter((sess) => sess.subjId === s.id || sess.entries?.some((e) => e.subj === s.id)).length;
            return (
              <button
                key={s.id}
                className={`btn btn-sm ${selectedSubj === s.id ? 'btn-primary' : ''}`}
                onClick={() => setSelectedSubj(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  borderColor: selectedSubj === s.id ? s.color : 'var(--border-subtle)'
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                <span>{s.name}</span>
                <span className="tabular" style={{ fontSize: 11, opacity: 0.8 }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
          <span>أقل</span>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }} title="0 ساعات" />
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(16, 185, 129, 0.4)' }} title="أقل من ساعتين" />
          <span style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981' }} title="من ساعتين إلى 4 ساعات" />
          <span style={{ width: 12, height: 12, borderRadius: 3, background: '#059669' }} title="من 4 إلى 6 ساعات" />
          <span style={{ width: 12, height: 12, borderRadius: 3, background: '#38bdf8' }} title="أكثر من 6 ساعات (أبطال)" />
          <span>أكثر</span>
        </div>
      </div>

      {/* 4. EXPANDED ALL-TIME MATRIX GRID (MONTH-BY-MONTH) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {matrixData.monthGroups.map((group) => {
          const monthHours = (group.totalMins / 60).toFixed(1);

          return (
            <div key={group.id} className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {group.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    أيام النشاط: <strong className="tabular" style={{ color: 'var(--warning)' }}>{group.activeDays}</strong> من {group.days.length} يوم
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    إجمالي ساعات الشهر: <strong className="tabular" style={{ color: 'var(--accent-primary)', fontSize: 15 }}>{monthHours}h</strong>
                  </span>
                </div>
              </div>

              {/* Grid of days */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))',
                gap: 8
              }}>
                {group.days.map((day) => {
                  const isSelected = selectedDayDetail?.key === day.key;

                  return (
                    <div
                      key={day.key}
                      onClick={() => setSelectedDayDetail({
                        key: day.key,
                        dateStr: day.dateStr,
                        dayName: day.dayName,
                        fullDate: day.fullDate,
                        minutes: day.minutes,
                        hours: day.hours,
                        level: day.level,
                        daySessions: day.sessions
                      })}
                      style={{
                        height: 52,
                        borderRadius: 8,
                        background: getCellBackground(day.level),
                        border: isSelected ? '2px solid #fff' : getCellBorder(day.level, day.isToday),
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                        boxShadow: day.level === 4 ? '0 0 10px rgba(56, 189, 248, 0.4)' : undefined,
                        transform: isSelected ? 'scale(1.08)' : undefined,
                        zIndex: isSelected ? 2 : 1
                      }}
                      title={`${day.dayName} (${day.fullDate}): ${day.hours}h (${day.minutes} دقيقة) - ${day.sessions.length} جلسات`}
                    >
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: day.level >= 2 ? '#ffffff' : 'var(--text-muted)',
                        lineHeight: 1
                      }}>
                        {day.dateStr.split('/')[0]}
                      </span>
                      <span className="tabular" style={{
                        fontSize: 11,
                        fontWeight: 800,
                        marginTop: 3,
                        color: day.level >= 2 ? '#ffffff' : (day.minutes > 0 ? 'var(--text-main)' : 'rgba(255, 255, 255, 0.2)'),
                        lineHeight: 1
                      }}>
                        {day.minutes > 0 ? `${day.hours}h` : '—'}
                      </span>
                      {day.isToday && (
                        <div style={{
                          position: 'absolute',
                          top: -3,
                          right: -3,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--accent-secondary)',
                          boxShadow: '0 0 6px var(--accent-secondary)'
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. DAY INSPECTION DRAWER / MODAL */}
      {selectedDayDetail && (
        <div className="modal-overlay" onClick={() => setSelectedDayDetail(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 560, width: '90%' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: getCellBackground(selectedDayDetail.level),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: selectedDayDetail.level >= 2 ? '#fff' : 'var(--text-main)',
                  fontWeight: 800
                }}>
                  {selectedDayDetail.hours}h
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>
                    تفاصيل مذاكرة {selectedDayDetail.dayName} ({selectedDayDetail.fullDate})
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                    إجمالي الوقت: <strong className="tabular" style={{ color: 'var(--accent-primary)' }}>{selectedDayDetail.hours} ساعة</strong> ({selectedDayDetail.minutes} دقيقة)
                  </p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedDayDetail(null)}>✕</button>
            </div>

            <div style={{ padding: '16px 20px', maxHeight: '60vh', overflowY: 'auto' }}>
              {selectedDayDetail.daySessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                  <Clock size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: 14 }}>لم يتم تسجيل أي جلسات مذاكرة في هذا اليوم.</p>
                  <p style={{ margin: '6px 0 0 0', fontSize: 12 }}>حافظ على عدم ترك أي يوم بدون إنجاز لحماية سلسلة تفوقك!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                    الجلسات المسجلة ({selectedDayDetail.daySessions.length} جلسة):
                  </div>
                  {selectedDayDetail.daySessions.map((sess, idx) => {
                    const subj = subjects.find((s) => s.id === sess.subjId || (sess.entries && sess.entries[0]?.subj === s.id));
                    const taskText = sess.entries?.map((e) => e.task).filter(Boolean).join(' + ') || 'مذاكرة مركزة';
                    const startTimeStr = sess.tsStart ? new Date(sess.tsStart).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '';

                    return (
                      <div
                        key={sess.id || idx}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 8,
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: subj?.color || '#56c2a6' }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                              {taskText}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              {subj?.name || sess.subjId || 'عام'} {startTimeStr && `• البدء: ${startTimeStr}`}
                            </div>
                          </div>
                        </div>

                        <div className="tabular" style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-primary)' }}>
                          {sess.minutes} د
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ justifyContent: 'space-between', padding: '14px 20px', background: 'var(--bg-surface)' }}>
              {onStartFocus && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setSelectedDayDetail(null);
                    onStartFocus('physics');
                  }}
                >
                  <Sparkles size={14} />
                  <span>بدء جلسة مذاكرة الآن</span>
                </button>
              )}
              <button className="btn btn-sm" onClick={() => setSelectedDayDetail(null)}>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
