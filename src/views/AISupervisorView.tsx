import React, { useState } from 'react';
import { Subject, Session, ExamRecord, WeeklyTask } from '../types';
import { callAiChat } from '../services/api';
import {
  Bot,
  Volume2,
  Send,
  Save,
  AlertTriangle,
  Calendar,
  Zap,
  Sparkles,
  Clock,
  Pencil,
  CheckCircle2,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

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
  onOpenInterrogation: () => void;
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
  onOpenInterrogation,
  onSpeak,
  auditReport,
  isAuditing,
  aiMood
}) => {
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `أهلاً يا كريم. راداري شغال معاك على مدار الـ 24 ساعة لمراقبة تقدمك. مجموع تانية ثانوي مدمج مع تالتة، مفيش ثانية ولا درجة مسموح بتضييعها. اسألني عن أي مادة، أو متراكماتك، أو استشرني في تنظيم وقتك وسأوجهك فوراً.`,
      time: 'الآن'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [directivesText, setDirectivesText] = useState(customAiInstructions);
  const [directivesSaved, setDirectivesSaved] = useState(false);

  const quickQuestions = [
    'إزاي أبدأ فيزياء دلوقتي بدون تسويف؟',
    'نصيحة لتقفيل درجات العربي والـ 95%+',
    'مراكم كمية التحرك ومحاضرات، أعمل إيه؟',
    'وزعلي وقت المذاكرة المتبقي النهاردة'
  ];

  const handleSendMessage = async (userTextToSend?: string) => {
    const text = (userTextToSend || inputMsg).trim();
    if (!text || isSending) return;

    const timeNow = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    setInputMsg('');
    setChatMessages((prev) => [...prev, { sender: 'user', text, time: timeNow }]);
    setIsSending(true);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const currentDayOfWeek = now.getDay();
    const diffToSaturday = (currentDayOfWeek + 1) % 7;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToSaturday).getTime();

    let todayMins = 0;
    let weekMins = 0;
    const subjTimes: Record<string, number> = {};
    subjects.forEach((s) => { subjTimes[s.id] = 0; });
    sessions.forEach((s) => {
      const ts = s.tsStart || (s.date ? new Date(s.date).getTime() : 0);
      const m = s.minutes || 0;
      if (ts >= startOfToday) todayMins += m;
      if (ts >= startOfWeek) weekMins += m;
      if (s.entries) {
        s.entries.forEach((e) => {
          if (e.subj && subjTimes[e.subj] !== undefined) {
            subjTimes[e.subj] += m / s.entries.length;
          }
        });
      } else if (s.subjId && subjTimes[s.subjId] !== undefined) {
        subjTimes[s.subjId] += m;
      }
    });

    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const sleepMins = 420;
    const elapsedAwakeMins = Math.max(minutesSinceMidnight - (now.getHours() < 7 ? 0 : sleepMins), 0);
    const wastedMins = Math.max(elapsedAwakeMins - todayMins, 0);

    const context = {
      todayStudyMins: todayMins,
      todayMins,
      weekMins,
      wastedMins,
      subjTimes,
      aiMood,
      examsCount: exams.length,
      tasksCount: weeklyTasks.length,
      completedCount: completedTaskIds.size,
      exams: exams.map((e) => ({
        id: e.id,
        subjId: e.subjId,
        teacher: e.teacher,
        topic: e.topic,
        score: e.score,
        total: e.total,
        pct: e.pct || Math.round((e.score / e.total) * 100),
        date: e.date
      })),
      pendingTasks: weeklyTasks.filter((t) => !completedTaskIds.has(t.id) && !completedTaskIds.has(String(t.id))),
      lastReport: auditReport ? auditReport.slice(0, 300) : ''
    };

    const reply = await callAiChat(text, context, customAiInstructions);
    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'ai',
        text: reply,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
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
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-elevated))', marginBottom: 24, border: '1px solid var(--border-subtle)' }}>
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
              color: 'var(--accent-primary)'
            }}>
              <Bot size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>
                  المراقب الأكاديمي الحصري لكريم عمر
                </h2>
                <span className="ai-mood-pill">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', display: 'inline-block' }} />
                  {aiMood.label}
                </span>
                <span className="ai-mood-score tabular">رضا المراقب: {aiMood.score}%</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {aiMood.reason} | المستهدف: أوائل الجمهورية والطب البشري
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-sm" onClick={onOpenInterrogation} style={{ borderColor: 'var(--danger)', color: 'var(--danger)', fontWeight: 700 }}>
              <AlertTriangle size={13} />
              <span>جلسة مساءلة المتراكمات</span>
            </button>
            <button className="btn btn-primary" onClick={onTriggerAudit} disabled={isAuditing}>
              {isAuditing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>جاري التحليل...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={13} />
                  <span>فحص وتحديث التقرير الشامل</span>
                </div>
              )}
            </button>
            <button className="btn" onClick={onOpenSchedule}>
              <Clock size={13} />
              <span>جدول الساعات المتبقية</span>
            </button>
            <button className="btn btn-speak" onClick={() => onSpeak(auditReport || aiMood.speech)}>
              <Volume2 size={13} />
              <span>استمع للتقرير صوتياً</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
        {/* Left: Detailed Audit Report & Directives */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>التقرير والتشخيص الأكاديمي الشامل لليوم</span>
            </div>
            <button className="btn btn-sm btn-speak" onClick={() => onSpeak(auditReport || aiMood.speech)}>
              <Volume2 size={13} />
              <span>قراءة صوتية</span>
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
            maxHeight: 460,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {auditReport || `جاري إعداد التقرير اللحظي... اضغط زر "فحص وتحديث التقرير الشامل" بالأعلى لاستدعاء المراقب فورياً.`}
          </div>

          {/* Karim's Explicit Directives Box */}
          <div style={{ marginTop: 20, padding: 16, background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Pencil size={14} style={{ color: 'var(--accent-primary)' }} />
                <strong style={{ fontSize: 13, color: 'var(--text-main)' }}>
                  تعليمات وقواعد كريم الصريحة للمراقب الذكي:
                </strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {directivesSaved && (
                  <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={12} />
                    <span>تم الإلزام</span>
                  </span>
                )}
                <button className="btn btn-sm btn-primary" onClick={handleSaveDirectives} style={{ padding: '4px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Save size={12} />
                  <span>حفظ وإلزام</span>
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
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={16} style={{ color: 'var(--accent-secondary)' }} />
              <span>محادثة واستشارة المراقب المباشرة</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', display: 'inline-block' }} />
              <span>متصل ومتابع</span>
            </span>
          </div>

          {/* Quick suggestions pills */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', marginBottom: 8 }}>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                className="btn btn-sm"
                onClick={() => handleSendMessage(q)}
                style={{ fontSize: 11, padding: '3px 8px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}
              >
                {q}
              </button>
            ))}
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
                  maxWidth: '88%',
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
                    {msg.sender === 'user' ? 'كريم' : 'المراقب الأكاديمي'}
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
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <RefreshCw size={12} className="animate-spin" />
                <span>المراقب يكتب رده وتوجيهاته لك...</span>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: 'flex', gap: 8, marginTop: 12 }}
          >
            <input
              type="text"
              className="input-field"
              style={{ margin: 0 }}
              placeholder="اكتب سؤالك، شعورك، أو أي مادة مقلقة هنا..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              disabled={isSending}
            />
            <button type="submit" className="btn btn-primary" disabled={isSending || !inputMsg.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Send size={13} />
              <span>إرسال</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
