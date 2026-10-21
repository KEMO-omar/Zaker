import React, { useState } from 'react';
import { Subject, Session, ExamRecord, WeeklyTask } from '../types';
import { callAiChat } from '../services/api';

interface AISupervisorViewProps {
  sessions: Session[];
  subjects: Subject[];
  exams: ExamRecord[];
  weeklyTasks: WeeklyTask[];
  completedTaskIds: Set<string | number>;
  customAiInstructions: string;
  onSaveCustomInstructions: (text: string) => void;
  onTriggerAudit: () => void;
  onOpenSchedule: () => void;
  onSpeak: (text: string) => void;
  auditReport: string;
  isAuditing: boolean;
  aiMood: {
    avatar: string;
    label: string;
    score: number;
    reason: string;
    speech: string;
  };
}

export const AISupervisorView: React.FC<AISupervisorViewProps> = ({
  sessions,
  subjects,
  exams,
  weeklyTasks,
  completedTaskIds,
  customAiInstructions,
  onSaveCustomInstructions,
  onTriggerAudit,
  onOpenSchedule,
  onSpeak,
  auditReport,
  isAuditing,
  aiMood
}) => {
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `أهلاً يا كريم. راداري شغال معاك على مدار الـ 24 ساعة. مجموع تانية ثانوي مدمج مع تالتة، مفيش ثانية ولا درجة مسموح بتضييعها. اسألني أو فضفض بأي عقبة بتواجهك وسأوجهك فوراً! 🦁`,
      time: 'الآن'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [directivesText, setDirectivesText] = useState(customAiInstructions);
  const [directivesSaved, setDirectivesSaved] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || isSending) return;

    const userText = inputMsg.trim();
    const timeNow = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    setInputMsg('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText, time: timeNow }]);
    setIsSending(true);

    const context = {
      aiMood,
      examsCount: exams.length,
      tasksCount: weeklyTasks.length,
      completedCount: completedTaskIds.size,
      lastReport: auditReport ? auditReport.slice(0, 300) : ''
    };

    const reply = await callAiChat(userText, context, customAiInstructions);
    setChatMessages((prev) => [...prev, { sender: 'ai', text: reply, time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }]);
    setIsSending(false);
  };

  const handleSaveDirectives = () => {
    onSaveCustomInstructions(directivesText);
    setDirectivesSaved(true);
    setTimeout(() => setDirectivesSaved(false), 3000);
  };

  return (
    <section className="view-panel active">
      {/* Top Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-elevated))', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 54,
              height: 54,
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28
            }}>
              {aiMood.avatar}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>
                  المراقب الأكاديمي الحصري لكريم عمر
                </h2>
                <span className="ai-mood-pill">{aiMood.avatar} {aiMood.label}</span>
                <span className="ai-mood-score tabular">رضا المراقب: {aiMood.score}%</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {aiMood.reason} | مستهدفك: أوائل الجمهورية والطب البشري 🦁
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={onTriggerAudit} disabled={isAuditing}>
              <span>{isAuditing ? '⏳ جاري التحليل...' : '⚡ فحص وتحديث التقرير الشامل'}</span>
            </button>
            <button className="btn" onClick={onOpenSchedule}>
              <span>⏱️ جدول الساعات المتبقية</span>
            </button>
            <button className="btn btn-speak" onClick={() => onSpeak(auditReport || aiMood.speech)}>
              <span>🔊 استمع للتقرير صوتياً</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
        {/* Left: Detailed Audit Report */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              <span>التقرير والتشخيص الأكاديمي الشامل لليوم</span>
            </div>
            <button className="btn btn-sm btn-speak" onClick={() => onSpeak(auditReport || aiMood.speech)}>
              <span>🔊 قراءة صوتية</span>
            </button>
          </div>

          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 20,
            fontSize: 14,
            lineHeight: 1.8,
            color: 'var(--text-main)',
            maxHeight: 520,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {auditReport || `جاري إعداد التقرير اللحظي... اضغط زر "فحص وتحديث التقرير الشامل" بالأعلى لاستدعاء المراقب فورياً.`}
          </div>

          {/* Karim's Explicit Directives Box */}
          <div style={{ marginTop: 20, padding: 16, background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <strong style={{ fontSize: 13, color: 'var(--text-main)' }}>
                ✍️ تعليمات وقواعد كريم الصريحة للمراقب الذكي:
              </strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {directivesSaved && <span style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 700 }}>✅ تم الإلزام</span>}
                <button className="btn btn-sm btn-primary" onClick={handleSaveDirectives} style={{ padding: '4px 10px', fontSize: 11 }}>
                  <span>حفظ وإلزام 💾</span>
                </button>
              </div>
            </div>
            <textarea
              className="kareem-directives-textarea"
              style={{ minHeight: 70 }}
              value={directivesText}
              onChange={(e) => setDirectivesText(e.target.value)}
              placeholder="اكتب للمراقب كيف يعاتبك وبأي لهجة يتكلم..."
            />
          </div>
        </div>

        {/* Right: Interactive Chat with Academic Supervisor */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 680 }}>
          <div className="card-header">
            <div className="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>محادثة واستشارة المراقب المباشرة</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 700 }}>⚡ متصل ومتابع</span>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 4px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: msg.sender === 'user' ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                  border: `1px solid ${msg.sender === 'user' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  color: 'var(--text-main)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  fontSize: 13,
                  lineHeight: 1.6
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                  <strong style={{ fontSize: 11, color: msg.sender === 'user' ? 'var(--accent-primary)' : 'var(--accent-secondary)' }}>
                    {msg.sender === 'user' ? 'كريم 🧑‍🎓' : 'المراقب الأكاديمي 🦁'}
                  </strong>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{msg.time}</span>
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
              </div>
            ))}
            {isSending && (
              <div style={{
                alignSelf: 'flex-start',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: 12,
                color: 'var(--text-muted)'
              }}>
                المراقب يكتب رده وتوجيهاته لك...
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              type="text"
              className="input-field"
              style={{ margin: 0 }}
              placeholder="اكتب سؤالك، شعورك، أو أي مادة مقلقة هنا..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              disabled={isSending}
            />
            <button type="submit" className="btn btn-primary" disabled={isSending}>
              إرسال ⚡
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
