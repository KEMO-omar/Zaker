import React, { useState } from 'react';
import { Subject, ExamRecord } from '../types';

interface ExamsViewProps {
  exams: ExamRecord[];
  subjects: Subject[];
  onOpenExamModal: () => void;
  onDeleteExam: (id: string) => void;
  onTriggerAudit: () => void;
  isAuditing: boolean;
  auditDiagnostic: string | null;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  exams,
  subjects,
  onOpenExamModal,
  onDeleteExam,
  onTriggerAudit,
  isAuditing,
  auditDiagnostic
}) => {
  const [selectedSubj, setSelectedSubj] = useState<string>('all');

  const filteredExams = exams.filter((e) => {
    if (selectedSubj !== 'all' && e.subjId !== selectedSubj) return false;
    return true;
  });

  const totalExams = exams.length;
  const examPcts = exams.map((e) => e.pct || Math.round((e.score / e.total) * 100));
  const overallAvg = examPcts.length > 0 ? Math.round(examPcts.reduce((a, b) => a + b, 0) / examPcts.length) : 0;
  const highScoringExams = exams.filter((e) => (e.pct || Math.round((e.score / e.total) * 100)) >= 95).length;
  const lowScoringExams = totalExams - highScoringExams;

  return (
    <section className="view-panel active">
      {/* 95% Target Rule Banner */}
      <div className="card" style={{
        background: overallAvg >= 95
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(56, 189, 248, 0.05))'
          : 'linear-gradient(135deg, rgba(239, 83, 80, 0.1), rgba(245, 158, 11, 0.05))',
        border: `1px solid ${overallAvg >= 95 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 83, 80, 0.4)'}`,
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{overallAvg >= 95 ? '🦁🏆' : '⚠️⚡'}</span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>
                قاعدة الـ 95% الإلزامية لامتحانات كريم
              </h2>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, maxWidth: 640 }}>
              "الـ 95% هي الحد الأدنى للأوائل! أي امتحان ينزل عن 95% وقفة محاسبة فورية ومعرفة أين ضاعت الدرجات لتقفيل 100%."
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={onOpenExamModal}>
              <span>➕ تسجيل امتحان جديد</span>
            </button>
            <button className="btn" onClick={onTriggerAudit} disabled={isAuditing}>
              <span>{isAuditing ? '⏳ جاري التشخيص...' : '⚡ تشخيص ونقاط الضعف (AI)'}</span>
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 18 }}>
          <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>المتوسط العام:</div>
            <div className="tabular" style={{ fontSize: 22, fontWeight: 800, color: overallAvg >= 95 ? 'var(--success)' : 'var(--danger)' }}>
              {overallAvg}%
            </div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>إجمالي الامتحانات:</div>
            <div className="tabular" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>
              {totalExams}
            </div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>المحققة للهدف (≥95%):</div>
            <div className="tabular" style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>
              {highScoringExams} امتحان ✅
            </div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>تنبيه نقص (&lt;95%):</div>
            <div className="tabular" style={{ fontSize: 22, fontWeight: 800, color: lowScoringExams > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
              {lowScoringExams} امتحان ⚠️
            </div>
          </div>
        </div>
      </div>

      {/* AI Diagnostic Output Banner */}
      {auditDiagnostic && (
        <div className="card" style={{ marginBottom: 20, background: 'var(--bg-elevated)', border: '1px solid var(--border-active)' }}>
          <div className="card-header">
            <div className="card-title">
              <span>🩺 تقرير وتشخيص نقاط الضعف وثغرات الامتحانات:</span>
            </div>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
            {auditDiagnostic}
          </div>
        </div>
      )}

      {/* Filter by Subject */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${selectedSubj === 'all' ? 'btn-primary' : ''}`}
            onClick={() => setSelectedSubj('all')}
          >
            الكل ({exams.length})
          </button>
          {subjects.map((s) => {
            const count = exams.filter((e) => e.subjId === s.id).length;
            return (
              <button
                key={s.id}
                className={`btn btn-sm ${selectedSubj === s.id ? 'btn-primary' : ''}`}
                onClick={() => setSelectedSubj(s.id)}
              >
                {s.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Exam List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredExams.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            لا توجد امتحانات مسجلة لهذا التصنيف.
          </div>
        ) : (
          filteredExams.map((exam) => {
            const pct = exam.pct || Math.round((exam.score / exam.total) * 100);
            const isTargetMet = pct >= 95;
            const subj = subjects.find((s) => s.id === exam.subjId);

            return (
              <div
                key={exam.id}
                className="log-item"
                style={{
                  borderLeft: `4px solid ${isTargetMet ? 'var(--success)' : 'var(--danger)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 'var(--radius-sm)',
                      background: isTargetMet ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 83, 80, 0.12)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span className="tabular" style={{ fontSize: 16, fontWeight: 800, color: isTargetMet ? 'var(--success)' : 'var(--danger)' }}>
                      {pct}%
                    </span>
                    <span style={{ fontSize: 10, color: isTargetMet ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                      {isTargetMet ? 'أوائل' : 'نقص'}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
                        {exam.topic}
                      </span>
                      <span style={{ fontSize: 11, background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-muted)' }}>
                        {exam.examType || 'امتحان شامل'}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ color: subj?.color || 'var(--accent-primary)', fontWeight: 600 }}>
                        {subj?.name || exam.subjId}
                      </span>
                      <span>•</span>
                      <span>{exam.teacher}</span>
                      <span>•</span>
                      <span className="tabular">{exam.date}</span>
                    </div>

                    {exam.notes && (
                      <div style={{ fontSize: 11, color: 'var(--warning)', marginTop: 4 }}>
                        💬 الملاحظة: {exam.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ textAlign: 'left' }}>
                    <div className="tabular" style={{ fontSize: 18, fontWeight: 800, color: isTargetMet ? 'var(--success)' : 'var(--danger)' }}>
                      {exam.score} / {exam.total}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      الفاقد: {(exam.total - exam.score).toFixed(1)} درجة
                    </div>
                  </div>

                  <button
                    className="btn btn-sm"
                    onClick={() => onDeleteExam(exam.id)}
                    title="حذف سجل الامتحان"
                    style={{ color: 'var(--danger)', padding: '4px 8px' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
