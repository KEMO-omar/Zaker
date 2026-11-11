import React, { useState } from 'react';
import { Subject, ExamRecord } from '../types';
import { CertificateViewerModal } from '../components/Modals';
import {
  Award,
  AlertTriangle,
  Plus,
  Sparkles,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Search,
  BookOpen,
  Image,
  ExternalLink,
  Trophy
} from 'lucide-react';

interface ExamsViewProps {
  exams: ExamRecord[];
  subjects: Subject[];
  onOpenExamModal: () => void;
  onOpenEditExam: (exam: ExamRecord) => void;
  onDeleteExam: (id: string) => void;
  onTriggerAudit: () => void;
  isAuditing: boolean;
  auditDiagnostic: string | null;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  exams,
  subjects,
  onOpenExamModal,
  onOpenEditExam,
  onDeleteExam,
  onTriggerAudit,
  isAuditing,
  auditDiagnostic
}) => {
  const [selectedSubj, setSelectedSubj] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCertExam, setSelectedCertExam] = useState<ExamRecord | null>(null);

  const certExams = exams.filter((e) => Boolean(e.certificateImage || e.certificateUrl || e.certificateTitle));

  const filteredExams = exams.filter((e) => {
    if (selectedSubj !== 'all' && e.subjId !== selectedSubj) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = e.topic.toLowerCase().includes(q) ||
                    e.teacher.toLowerCase().includes(q) ||
                    (e.notes && e.notes.toLowerCase().includes(q));
      if (!match) return false;
    }
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
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(56, 189, 248, 0.04))'
          : 'linear-gradient(135deg, rgba(239, 83, 80, 0.08), rgba(245, 158, 11, 0.04))',
        border: `1px solid ${overallAvg >= 95 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 83, 80, 0.3)'}`,
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {overallAvg >= 95 ? (
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                  <Award size={24} />
                </div>
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239, 83, 80, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                  <AlertTriangle size={24} />
                </div>
              )}
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>
                قاعدة الـ 95% الإلزامية لامتحانات كريم
              </h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, maxWidth: 640, lineHeight: 1.6 }}>
              الـ 95% هي الحد الأدنى للأوائل. أي امتحان ينزل عن 95% وقفة محاسبة فورية ومعرفة أين ضاعت الدرجات لتقفيل 100%.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={onOpenExamModal}>
              <Plus size={14} />
              <span>تسجيل امتحان جديد</span>
            </button>
            <button className="btn" onClick={onTriggerAudit} disabled={isAuditing}>
              {isAuditing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>جاري التشخيص...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={13} style={{ color: 'var(--accent-secondary)' }} />
                  <span>تشخيص ونقاط الضعف (AI)</span>
                </div>
              )}
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
            <div className="tabular" style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{highScoringExams} امتحان</span>
              <CheckCircle2 size={16} />
            </div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>تنبيه نقص (&lt;95%):</div>
            <div className="tabular" style={{ fontSize: 22, fontWeight: 800, color: lowScoringExams > 0 ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{lowScoringExams} امتحان</span>
              {lowScoringExams > 0 && <AlertTriangle size={16} />}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Milestone Prize Exams (امتحانات قادمة ذات جوائز وتكريم) */}
      <div className="card" style={{
        marginBottom: 20,
        background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1), rgba(56, 189, 248, 0.08))',
        border: '1px solid rgba(167, 139, 250, 0.35)',
        padding: '16px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(167, 139, 250, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
              <Trophy size={20} />
            </div>
            <div>
              <strong style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🎯 محطات الامتحانات الكبرى القادمة (امتحانات ذات جوائز وتكريم رسمي)</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(167, 139, 250, 0.25)', color: '#c4b5fd', fontWeight: 700 }}>فرصة التكريم</span>
              </strong>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                امتحانان حاسمان هذا الأسبوع لتثبيت مكانتك بين أوائل الجمهورية ورفع شهادات تفوق جديدة.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {/* 1. Arabic Unit 2 Exam */}
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 10,
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={14} />
                <span>الخميس القادم • امتحان جوائز وتكريم</span>
              </span>
              <span className="tabular" style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                المستهدف: 95%+
              </span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>
              امتحان اللغة العربية الشامل على الوحدة الثانية
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.5 }}>
              يشمل إعمال المشتقات (اسم فاعل، مفعول، مبالغة)، المصادر الصريحة والميمية، توكيد الأفعال، وبلاغة الإيجاز والإطناب.
            </p>
          </div>

          {/* 2. English Unit 3 Exam */}
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 10,
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} />
                <span>الجمعة القادم • تقفيل 50/50</span>
              </span>
              <span className="tabular" style={{ fontSize: 11, background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-secondary)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                مستر أيمن عبد العاطي
              </span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>
              امتحان اللغة الإنجليزية الشامل على Unit 3
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.5 }}>
              فرصة غلق ثغرات الامتحانات السابقة وقفل الـ 50/50 في أشكال المستقبل، المفردات، المتلازمات، والمقال.
            </p>
          </div>
        </div>
      </div>

      {/* Honors & Certificates Gallery (معرض شهادات التكريم والتفوق) */}
      {certExams.length > 0 && (
        <div className="card" style={{
          marginBottom: 20,
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(16, 185, 129, 0.05))',
          border: '1px solid rgba(245, 158, 11, 0.3)'
        }}>
          <div className="card-header" style={{ marginBottom: 12 }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={18} style={{ color: 'var(--warning)' }} />
              <span style={{ fontSize: 16, fontWeight: 800 }}>معرض شهادات التكريم والتفوق ({certExams.length}) 🏆</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>توثيق رسمي لإنجازات أوائل الجمهورية</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 12
          }}>
            {certExams.map((ce) => {
              const subj = subjects.find((s) => s.id === ce.subjId);
              const img = ce.certificateImage || ce.certificateUrl;

              return (
                <div
                  key={ce.id}
                  onClick={() => setSelectedCertExam(ce)}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--warning)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                >
                  {img ? (
                    <div style={{ height: 120, background: '#0b1212', borderRadius: 4, overflow: 'hidden', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={img} alt="شهادة" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ height: 90, background: 'rgba(245, 158, 11, 0.08)', borderRadius: 4, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                      <Award size={36} />
                    </div>
                  )}

                  <div>
                    <strong style={{ fontSize: 13, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                      {ce.certificateTitle || `شهادة تفوق: ${ce.topic}`}
                    </strong>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: subj?.color || 'var(--accent-primary)', fontWeight: 700 }}>{subj?.name}</span>
                      <span className="tabular">{ce.score}/{ce.total}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {ce.teacher}
                    </div>
                  </div>

                  <button
                    className="btn btn-sm"
                    style={{
                      marginTop: 8,
                      width: '100%',
                      background: 'rgba(245, 158, 11, 0.12)',
                      color: 'var(--warning)',
                      borderColor: 'rgba(245, 158, 11, 0.3)',
                      fontSize: 11,
                      fontWeight: 700
                    }}
                  >
                    عرض الشهادة بالحجم الكامل ↗
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Diagnostic Output Banner */}
      {auditDiagnostic && (
        <div className="card" style={{ marginBottom: 20, background: 'var(--bg-elevated)', border: '1px solid var(--border-active)' }}>
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>تقرير وتشخيص نقاط الضعف وثغرات الامتحانات:</span>
            </div>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
            {auditDiagnostic}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
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

        <div style={{ position: 'relative', width: 220 }}>
          <input
            type="text"
            className="input-field"
            style={{ margin: 0, paddingRight: 32, paddingLeft: 10, fontSize: 12 }}
            placeholder="بحث في الامتحانات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
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
            const hasCert = Boolean(exam.certificateImage || exam.certificateUrl || exam.certificateTitle);

            return (
              <div
                key={exam.id}
                className="log-item"
                style={{
                  borderLeft: `4px solid ${isTargetMet ? 'var(--success)' : 'var(--danger)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
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
                      {hasCert && (
                        <button
                          className="btn btn-sm"
                          onClick={() => setSelectedCertExam(exam)}
                          style={{
                            background: 'rgba(245, 158, 11, 0.12)',
                            borderColor: 'rgba(245, 158, 11, 0.4)',
                            color: 'var(--warning)',
                            padding: '2px 8px',
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Award size={12} />
                          <span>شهادة مرفقة 🏆</span>
                        </button>
                      )}
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
                        ملاحظة: {exam.notes}
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

                  {hasCert && (
                    <button
                      className="btn btn-sm"
                      onClick={() => setSelectedCertExam(exam)}
                      title="عرض شهادة التكريم"
                      style={{ padding: '6px 10px', color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                    >
                      <Award size={13} />
                      <span>الشهادة</span>
                    </button>
                  )}

                  {/* Edit Exam Button */}
                  <button
                    className="btn btn-sm"
                    onClick={() => onOpenEditExam(exam)}
                    title="تعديل الامتحان والشهادة"
                    style={{ padding: '6px 10px', color: 'var(--text-main)', borderColor: 'var(--border-subtle)' }}
                  >
                    <Pencil size={13} />
                    <span>تعديل</span>
                  </button>

                  {/* Delete Exam Button */}
                  <button
                    className="btn btn-sm"
                    onClick={() => onDeleteExam(exam.id)}
                    title="حذف الامتحان"
                    style={{ color: 'var(--danger)', borderColor: 'rgba(239, 83, 80, 0.3)', padding: '6px 8px' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Certificate Viewer Modal */}
      <CertificateViewerModal
        isOpen={Boolean(selectedCertExam)}
        onClose={() => setSelectedCertExam(null)}
        exam={selectedCertExam}
      />
    </section>
  );
};
