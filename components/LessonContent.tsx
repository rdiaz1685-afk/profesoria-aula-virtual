
import React, { useState, useEffect, useMemo } from 'react';
import { Lesson, Grade } from '../types';

interface LessonContentProps {
  lesson: Lesson;
  unitTitle: string;
  totalActivitiesInUnit: number;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onGradeUpdate: (grade: Grade) => void;
}

const LessonContent: React.FC<LessonContentProps> = ({
  lesson,
  unitTitle,
  isCompleted,
  onToggleComplete
}) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setAnswers({});
    setShowFeedback({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lesson?.id]);

  const handleTestAnswer = (qIdx: number, bIdx: number, oIdx: number) => {
    const key = `${bIdx}-${qIdx}`;
    if (showFeedback[key]) return;
    setAnswers(prev => ({ ...prev, [key]: oIdx }));
    setShowFeedback(prev => ({ ...prev, [key]: true }));
  };

  const { correctCount, totalQuestions, answeredCount } = useMemo(() => {
    let correct = 0;
    let total = 0;
    let answered = 0;

    const blocks = lesson?.blocks || [];
    blocks.forEach((block, bIdx) => {
      if (block.type === 'test' && block.testQuestions) {
        block.testQuestions.forEach((q, qIdx) => {
          total++;
          const key = `${bIdx}-${qIdx}`;
          if (showFeedback[key]) {
            answered++;
            if (answers[key] === q.correctAnswerIndex) correct++;
          }
        });
      }
    });

    return { correctCount: correct, totalQuestions: total, answeredCount: answered };
  }, [lesson?.blocks, answers, showFeedback]);

  const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  if (!lesson) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-40 animate-in fade-in zoom-in-95 duration-700">
      <header className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="h-[1px] w-8 bg-cyan-500"></span>
          <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em]">
            {unitTitle}
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white leading-[1.1] tracking-tighter">
          {lesson.title}
        </h1>
      </header>

      <div className="space-y-14">
        {(lesson.blocks || []).map((block, bIdx) => {
          const isTest = block.type === 'test';
          const isActivity = block.type === 'activity';
          const shouldShowWeight = (isActivity || isTest) && block.weight && block.weight > 0;

          return (
            <section key={bIdx} className={`rounded-[48px] border transition-all duration-700 relative overflow-hidden ${isActivity ? 'border-cyan-500/20 bg-slate-900/60 shadow-cyan-900/10' :
                isTest ? 'border-amber-500/20 bg-slate-900/60 shadow-amber-900/10' :
                  'border-white/5 bg-slate-900/30'
              } shadow-2xl`}>

              {shouldShowWeight && (
                <div className="absolute top-0 right-0 z-20">
                  <div className={`px-6 py-3 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest border-l border-b ${isTest ? 'bg-amber-500 text-slate-950 border-amber-600' : 'bg-cyan-500 text-slate-950 border-cyan-600'
                    }`}>
                    {isTest ? `Examen: ${block.weight} PTS` : `Valor: ${block.weight} PTS`}
                  </div>
                </div>
              )}

              <div className={`px-10 py-6 border-b border-white/5 flex items-center gap-4 relative z-10 ${isActivity ? 'bg-cyan-500/5' : isTest ? 'bg-amber-500/5' : block.type === 'example' ? 'bg-indigo-500/5' : 'bg-slate-950/40'
                }`}>
                <span className="text-2xl">{isActivity ? '⚒️' : isTest ? '🚀' : block.type === 'example' ? '🌍' : '📔'}</span>
                <h3 className={`font-black uppercase tracking-[0.2em] text-[11px] ${isActivity ? 'text-cyan-400' : isTest ? 'text-amber-500' : block.type === 'example' ? 'text-indigo-400' : 'text-slate-400'
                  }`}>
                  {block.title}
                </h3>
              </div>

              <div className="p-10 md:p-14">
                <div className="text-slate-200 leading-[1.8] text-lg mb-10 whitespace-pre-line font-medium tracking-tight max-w-[90%]">
                  {block.content}
                </div>

                {isTest && block.testQuestions && block.testQuestions.length > 0 && (
                  <div className="space-y-14 mt-12 border-t border-white/5 pt-12">
                    {block.testQuestions.map((q, qIdx) => {
                      const key = `${bIdx}-${qIdx}`;
                      const answeredIdx = answers[key];
                      const isShowingFeedback = showFeedback[key];
                      const isCorrect = answeredIdx === q.correctAnswerIndex;

                      return (
                        <div key={qIdx} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <h4 className="text-xl font-black text-white tracking-tight leading-snug">{q.question}</h4>
                          <div className="grid md:grid-cols-2 gap-5">
                            {(q.options || []).map((opt, oIdx) => {
                              const isSelected = answeredIdx === oIdx;
                              const isThisCorrect = oIdx === q.correctAnswerIndex;
                              let btnStyle = "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10";
                              if (isShowingFeedback) {
                                if (isThisCorrect) btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]";
                                else if (isSelected) btnStyle = "bg-red-500/20 border-red-500 text-red-400";
                                else btnStyle = "bg-slate-950/50 border-white/5 opacity-20";
                              }
                              return (
                                <button key={oIdx} disabled={isShowingFeedback} onClick={() => handleTestAnswer(qIdx, bIdx, oIdx)} className={`text-left p-7 rounded-[32px] border-2 transition-all font-bold text-sm leading-tight ${btnStyle}`}>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {isShowingFeedback && (
                            <div className={`mt-4 p-6 rounded-3xl border flex gap-4 animate-in zoom-in-95 duration-300 ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400/80' : 'bg-red-500/5 border-red-500/20 text-red-400/80'}`}>
                              <span className="text-xl">{isCorrect ? '✅' : '❌'}</span>
                              <p className="text-[11px] italic font-black uppercase tracking-wider leading-relaxed">"{q.feedback}"</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {isActivity && block.rubric && block.rubric.length > 0 && (
                  <div className="mt-12 p-8 bg-black/40 rounded-[40px] border border-white/5">
                    <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-8 text-center">Matriz de Evaluación Técnica</p>
                    <div className="space-y-4">
                      {block.rubric.map((r, ri) => (
                        <div key={ri} className="flex justify-between items-center text-[11px] border-b border-white/5 pb-4 last:border-0">
                          <span className="text-slate-400 font-bold uppercase tracking-tight">{r.criterion}</span>
                          <span className="text-cyan-400 font-black tracking-widest bg-cyan-500/10 px-4 py-2 rounded-full border border-cyan-500/20">{r.points} PTS</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {totalQuestions > 0 && answeredCount > 0 && (
        <div className="mt-24 p-12 bg-slate-900 border border-white/10 rounded-[64px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-12 duration-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="text-center md:text-left">
              <p className="text-[11px] font-black text-cyan-500 uppercase tracking-[0.4em] mb-3">Progreso de Evaluación</p>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Resumen de Unidad</h2>
              <p className="text-slate-500 text-xs font-medium mt-3">Has completado {answeredCount} de {totalQuestions} reactivos técnicos.</p>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full group-hover:bg-cyan-500/30 transition-all"></div>
              <div className={`relative text-7xl md:text-8xl font-black tracking-tighter ${scorePercentage >= 70 ? 'text-emerald-400' : 'text-red-400'}`}>
                {scorePercentage}%
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-40 pt-24 border-t border-white/5 flex flex-col items-center">
        <button
          onClick={onToggleComplete}
          className={`group relative px-24 py-10 rounded-[40px] font-black transition-all active:scale-95 text-[12px] tracking-[0.5em] uppercase shadow-2xl overflow-hidden ${isCompleted ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' : 'bg-white text-slate-950 hover:bg-cyan-400'
            }`}
        >
          {isCompleted ? '✓ LECCIÓN FINALIZADA' : 'COMPLETAR LECCIÓN'}
        </button>
      </footer>
    </div>
  );
};

export default LessonContent;
