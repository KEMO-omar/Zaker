import React from 'react';
import { SmartNotificationItem, ViewTab } from '../types';
import { NotificationPrefs } from '../services/notifications';
import {
  Bell,
  BellRing,
  Clock,
  Award,
  Sparkles,
  CheckCheck,
  Trash2,
  Play,
  CalendarCheck,
  AlertTriangle,
  X
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SmartNotificationItem[];
  prefs: NotificationPrefs;
  onUpdatePrefs: (prefs: NotificationPrefs) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onTriggerTestCheckIn: () => void;
  onRunAlertsNow: () => void;
  onNavigateToTab: (tab: ViewTab) => void;
  hoursSinceLastSession: number | null;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  prefs,
  onUpdatePrefs,
  onMarkAllRead,
  onClearAll,
  onTriggerTestCheckIn,
  onRunAlertsNow,
  onNavigateToTab,
  hoursSinceLastSession
}) => {
  if (!isOpen) return null;

  const browserPermission = typeof window !== 'undefined' && 'Notification' in window
    ? Notification.permission
    : 'unsupported';

  const handleEnableBrowserPush = async () => {
    if ('Notification' in window) {
      await Notification.requestPermission();
      onTriggerTestCheckIn();
    }
  };

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BellRing size={20} style={{ color: 'var(--accent-primary)' }} />
            <span>مركز التنبيهات الذكية ورسائل الاطمئنان 🔔</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Bar: Browser Permission + Hours since last study */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 10,
          marginBottom: 14
        }}>
          <div style={{
            padding: '10px 12px',
            borderRadius: 8,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8
          }}>
            <div style={{ fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>تنبيهات المتصفح</div>
              <div style={{ fontSize: 11, color: browserPermission === 'granted' ? 'var(--success)' : 'var(--warning)' }}>
                {browserPermission === 'granted' ? '✓ مفعلة وتصل فوراً' : 'اضغط لتفعيل الإشعارات'}
              </div>
            </div>
            {browserPermission !== 'granted' && browserPermission !== 'unsupported' && (
              <button type="button" className="btn btn-sm btn-primary" onClick={handleEnableBrowserPush}>
                تفعيل الآن
              </button>
            )}
          </div>

          <div style={{
            padding: '10px 12px',
            borderRadius: 8,
            background: 'var(--bg-elevated)',
            border: `1px solid ${hoursSinceLastSession !== null && hoursSinceLastSession >= 12 ? 'rgba(239, 83, 80, 0.4)' : 'var(--border-subtle)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8
          }}>
            <div style={{ fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>رادار الـ 12 ساعة</div>
              <div style={{ fontSize: 11, color: hoursSinceLastSession !== null && hoursSinceLastSession >= 12 ? 'var(--danger)' : 'var(--text-muted)' }}>
                {hoursSinceLastSession === null
                  ? 'لم يتم تسجيل جلسات بعد'
                  : `آخر جلسة منذ ${hoursSinceLastSession.toFixed(1)} ساعة`}
              </div>
            </div>
            <Clock size={18} style={{ color: hoursSinceLastSession !== null && hoursSinceLastSession >= 12 ? 'var(--danger)' : 'var(--accent-primary)' }} />
          </div>
        </div>

        {/* Settings Controls */}
        <div style={{
          padding: 12,
          borderRadius: 10,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          marginBottom: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)' }}>
              تكرار رسائل الاطمئنان ومهام اليوم:
            </span>
            <select
              className="input-field"
              value={prefs.enabled ? String(prefs.intervalMinutes) : 'off'}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'off') {
                  onUpdatePrefs({ ...prefs, enabled: false });
                } else {
                  onUpdatePrefs({ ...prefs, enabled: true, intervalMinutes: Number(v) });
                }
              }}
              style={{ width: 170, margin: 0, fontSize: 12 }}
            >
              <option value="30">كل 30 دقيقة ⚡</option>
              <option value="60">كل ساعة (موصى به)</option>
              <option value="120">كل ساعتين</option>
              <option value="off">إيقاف الرسائل الدورية</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={prefs.inactivity12hAlert}
                onChange={(e) => onUpdatePrefs({ ...prefs, inactivity12hAlert: e.target.checked })}
                style={{ accentColor: 'var(--accent-primary)' }}
              />
              <span>إنذار 12 ساعة بدون مذاكرة 🚨</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={prefs.preExamAlert}
                onChange={(e) => onUpdatePrefs({ ...prefs, preExamAlert: e.target.checked })}
                style={{ accentColor: 'var(--accent-primary)' }}
              />
              <span>تنبيه قبل الامتحانات 🏆</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={prefs.morningCheckIn}
                onChange={(e) => onUpdatePrefs({ ...prefs, morningCheckIn: e.target.checked })}
                style={{ accentColor: 'var(--accent-primary)' }}
              />
              <span>رسالة صباح الخير / مهام اليوم ☀️</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            <button type="button" className="btn btn-sm btn-primary" onClick={onTriggerTestCheckIn}>
              <Sparkles size={13} />
              <span>ابعتلي رسالة اطمئنان بجدول النهاردة الآن</span>
            </button>
            <button type="button" className="btn btn-sm" onClick={onRunAlertsNow}>
              <Bell size={13} />
              <span>فحص الامتحانات والـ 12 ساعة الآن</span>
            </button>
          </div>
        </div>

        {/* Notifications History List */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong style={{ fontSize: 13, color: 'var(--text-main)' }}>
            سجل التنبيهات والرسائل ({notifications.length})
          </strong>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="btn btn-sm" onClick={onMarkAllRead} style={{ fontSize: 11 }}>
              <CheckCheck size={12} />
              <span>تحديد الكل كمقروء</span>
            </button>
            <button type="button" className="btn btn-sm" onClick={onClearAll} style={{ fontSize: 11, color: 'var(--danger)' }}>
              <Trash2 size={12} />
              <span>مسح</span>
            </button>
          </div>
        </div>

        <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 12 }}>
              لا توجد تنبيهات مسجلة حالياً. اضغط على «ابعتلي رسالة اطمئنان بجدول النهاردة الآن» لتجربتها!
            </div>
          ) : (
            notifications.map((n) => {
              const borderCol = n.type === 'inactivity_12h'
                ? '#ef4444'
                : n.type === 'exam_alert'
                  ? '#8b5cf6'
                  : n.type === 'week_rollover'
                    ? '#10b981'
                    : '#38bdf8';

              return (
                <div
                  key={n.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: n.read ? 'var(--bg-elevated)' : 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid var(--border-subtle)',
                    borderRight: `4px solid ${borderCol}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong style={{ fontSize: 13, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {n.type === 'inactivity_12h' && <AlertTriangle size={14} style={{ color: '#ef4444' }} />}
                      {n.type === 'exam_alert' && <Award size={14} style={{ color: '#8b5cf6' }} />}
                      {n.type === 'checkin' && <Sparkles size={14} style={{ color: '#38bdf8' }} />}
                      {n.type === 'week_rollover' && <CalendarCheck size={14} style={{ color: '#10b981' }} />}
                      <span>{n.title}</span>
                    </strong>
                    <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                      {new Date(n.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {n.body}
                  </div>
                  {n.actionTab && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          onNavigateToTab(n.actionTab!);
                          onClose();
                        }}
                        style={{ fontSize: 11, padding: '3px 10px' }}
                      >
                        <Play size={11} />
                        <span>{n.actionTab === 'focusView' ? 'ابدأ المذاكرة الآن' : 'فتح جدول اليوم'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
