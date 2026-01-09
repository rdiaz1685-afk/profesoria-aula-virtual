
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Course, LessonBlock, AuthorizedStudent, StudentSubmission, Unit } from '../types';
import { generateInstrumentationOpenAI } from '../openaiService';
import { generateDemoInstrumentation, generateDemoLesson } from '../demoService';
import { generateCourseSkeletonOpenAI } from '../openaiSkeletonService';
import { generateUnitContentOpenAI } from '../openaiUnitService';
import LessonContent from './LessonContent';
import UnitPortfolio from './UnitPortfolio';
import DidacticInstrumentationView from './DidacticInstrumentationView';
import AiMentor from './AiMentor';
import ThinkingCrow from './ThinkingCrow';

interface CourseViewerProps {
  course: Course;
  onExit: () => void;
  onUpdateCourse: (updated: Course) => void;
}

const CourseViewer: React.FC<CourseViewerProps> = ({ course, onExit, onUpdateCourse }) => {
  const [activeUnitIdx, setActiveUnitIdx] = useState(0);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'study' | 'portfolio' | 'instrumentation'>('study');
  const [isBuildingUnit, setIsBuildingUnit] = useState(false);
  const [isGeneratingInstrumentation, setIsGeneratingInstrumentation] = useState(false);
  const [buildStatus, setBuildStatus] = useState("");
  const [loadTimer, setLoadTimer] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const timerRef = useRef<any>(null);

  const units = course.units || [];
  const currentUnit = units[activeUnitIdx] || units[0];
  const lessons = currentUnit?.lessons || [];
  const currentLesson = lessons[activeLessonIdx];

  const hasContent = lessons.length > 0 && lessons[0].title !== "Error de Formato";

  useEffect(() => {
    if (isBuildingUnit) {
      setLoadTimer(0);
      timerRef.current = setInterval(() => setLoadTimer(p => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isGeneratingInstrumentation, isBuildingUnit, buildStatus, loadTimer]);

  const unitActivities = useMemo(() => {
    const activities: { lessonTitle: string, block: LessonBlock, blockIdx: number }[] = [];
    if (!currentUnit?.lessons) return [];
    currentUnit.lessons.forEach((lesson) => {
      if (lesson.blocks) {
        lesson.blocks.forEach((block, bIdx) => {
          if (block.type === 'activity') activities.push({ lessonTitle: lesson.title, block, blockIdx: bIdx });
        });
      }
    });
    return activities;
  }, [currentUnit]);

  const handleBuildUnit = useCallback(async (idx: number) => {
    const unitToBuild = units[idx];
    if (!unitToBuild || isBuildingUnit) return;

    setIsBuildingUnit(true);
    setBuildStatus(`DISEÑANDO: ${unitToBuild.title.toUpperCase()}...`);
    setIsMobileMenuOpen(false);

    try {
      let lessons: any[] = [];

      // Intento 1: Gemini (GRATIS)
      try {
        setBuildStatus(`DISEÑANDO CON GEMINI: ${unitToBuild.title.toUpperCase()}...`);
        console.log('🔷 Intentando unidad con Gemini (gratis)...');
        const { generateUnitContent } = await import('../geminiService');
        lessons = await generateUnitContent(unitToBuild, course.description, course.syllabusImages);
        console.log('✅ Unidad generada con Gemini');
      } catch (geminiError: any) {
        console.warn('⚠️ Gemini no disponible:', geminiError.message);

        // Intento 2: OpenAI
        try {
          setBuildStatus(`DISEÑANDO CON OPENAI: ${unitToBuild.title.toUpperCase()}...`);
          console.log('🔶 Intentando unidad con OpenAI...');
          lessons = await generateUnitContentOpenAI(unitToBuild, course.description);
          console.log('✅ Unidad generada con OpenAI');
        } catch (openaiError: any) {
          console.warn('⚠️ OpenAI no disponible:', openaiError.message);

          // Intento 3: Modo Demo
          setBuildStatus(`MODO DEMO (SIN LLAVE IA): ${unitToBuild.title.toUpperCase()}...`);
          console.log('🟢 Usando modo demo para unidad...');
          lessons = [generateDemoLesson(unitToBuild.title)];
          console.log('✅ Unidad generada en modo demo');
        }
      }

      const updatedCourse = { ...course, units: course.units.map(u => u === unitToBuild ? { ...u, lessons } : u) };
      onUpdateCourse(updatedCourse);
      setViewMode('study');
    } catch (e: any) {
      console.error('❌ Error crítico generando unidad:', e);
      alert("Error generando unidad. Intenta de nuevo.");
    } finally {
      setIsBuildingUnit(false);
      setBuildStatus("");
    }
  }, [units, course, onUpdateCourse, isBuildingUnit]);

  const handleGenerateInstrumentation = useCallback(async () => {
    if (isGeneratingInstrumentation || !course) return;

    setIsGeneratingInstrumentation(true);
    setBuildStatus(`GENERANDO INSTRUMENTACIÓN DIDÁCTICA...`);
    setIsMobileMenuOpen(false);

    try {
      let instrumentation: any = null;

      // Intento 1: Gemini (GRATIS)
      try {
        setBuildStatus(`CONECTANDO CON NODO GEMINI...`);
        console.log('🔷 Intentando instrumentación con Gemini (gratis)...');
        const { generateInstrumentation } = await import('../geminiService');
        instrumentation = await generateInstrumentation(course);
        console.log('✅ Instrumentación generada con Gemini');
      } catch (geminiError: any) {
        console.warn('⚠️ Gemini no disponible para instrumentación:', geminiError.message);

        // Intento 2: OpenAI
        try {
          setBuildStatus(`CONECTANDO CON OPENAI ENGINE...`);
          console.log('🔶 Intentando instrumentación con OpenAI...');
          instrumentation = await generateInstrumentationOpenAI(course);
          console.log('✅ Instrumentación generada con OpenAI');
        } catch (openaiError: any) {
          console.warn('⚠️ OpenAI no disponible para instrumentación:', openaiError.message);

          // Intento 3: Modo Demo
          setBuildStatus(`ACTIVANDO MODO DEMO...`);
          console.log('🟢 Usando modo demo para instrumentación...');
          instrumentation = generateDemoInstrumentation(course);
          console.log('✅ Instrumentación generada en modo demo');
        }
      }

      if (instrumentation) {
        const updatedCourse = { ...course, instrumentation };
        onUpdateCourse(updatedCourse);
        setViewMode('instrumentation');
      }
    } catch (e: any) {
      console.error('❌ Error crítico generando instrumentación:', e);
      alert("Error generando instrumentación. Intenta de nuevo.");
    } finally {
      setIsGeneratingInstrumentation(false);
      setBuildStatus("");
    }
  }, [course, onUpdateCourse, isGeneratingInstrumentation]);

  const handleUpdateRoster = (roster: AuthorizedStudent[]) => {
    onUpdateCourse({ ...course, studentList: roster });
  };

  const handleUpdateGrades = (grades: StudentSubmission[]) => {
    onUpdateCourse({ ...course, masterGrades: grades });
  };

  const exportStudentHtml = () => {
    if (!hasContent) return alert("Diseña esta unidad antes de exportar.");
    const blob = new Blob([generateHtmlTemplate(course)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Aula_Alumno_${course.title.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-8 border-b border-white/5 bg-slate-900/40">
        <button onClick={onExit} className="text-[10px] font-black text-cyan-500 uppercase mb-4 hover:text-white transition-colors">← SALIR AL MENÚ</button>
        <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-tight line-clamp-2">{course.title}</h2>
      </div>

      <nav className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div
            onClick={() => { setViewMode('instrumentation'); setIsMobileMenuOpen(false); }}
            className={`cursor-pointer flex flex-col items-center justify-center py-5 px-2 rounded-3xl border transition-all hover:scale-[1.02] active:scale-95 ${viewMode === 'instrumentation' ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'border-white/5 bg-slate-900'
              }`}
          >
            <span className="text-xl mb-2">📄</span>
            <span className={`text-[8px] font-black uppercase tracking-widest ${viewMode === 'instrumentation' ? 'text-amber-500' : 'text-slate-500'}`}>Instrumentación</span>
            {!course.instrumentation && (
              <button
                onClick={(e) => { e.stopPropagation(); handleGenerateInstrumentation(); }}
                disabled={isGeneratingInstrumentation}
                className="mt-2 px-3 py-1 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 disabled:opacity-50 relative z-20"
              >
                {isGeneratingInstrumentation ? 'Generando...' : 'Generar'}
              </button>
            )}
          </div>
          <div
            onClick={() => { setViewMode('portfolio'); setIsMobileMenuOpen(false); }}
            className={`cursor-pointer flex flex-col items-center justify-center py-5 px-2 rounded-3xl border transition-all hover:scale-[1.02] active:scale-95 ${viewMode === 'portfolio' ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-white/5 bg-slate-900'
              }`}
          >
            <span className="text-xl mb-2">📥</span>
            <span className={`text-[8px] font-black uppercase tracking-widest ${viewMode === 'portfolio' ? 'text-cyan-400' : 'text-slate-500'}`}>Portafolio</span>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <p className="px-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">Temario del Curso</p>
          {units.map((unit, uIdx) => (
            <div key={unit.id} className="space-y-1">
              <button
                onClick={() => { setActiveUnitIdx(uIdx); setViewMode('study'); setActiveLessonIdx(0); setIsMobileMenuOpen(false); }}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${activeUnitIdx === uIdx && viewMode === 'study' ? 'bg-white/5 border-white/20' : 'border-transparent opacity-50 hover:opacity-100 hover:bg-white/5'
                  }`}
              >
                <p className="text-[10px] font-bold text-slate-200 uppercase tracking-tighter line-clamp-2">{unit.title}</p>
              </button>
              {activeUnitIdx === uIdx && viewMode === 'study' && unit.lessons && unit.lessons.length > 0 && (
                <div className="ml-4 space-y-1 border-l border-white/10 pl-4 py-1 animate-in slide-in-from-left-2 duration-300">
                  {unit.lessons.map((l, lIdx) => (
                    <button key={l.id} onClick={() => { setActiveLessonIdx(lIdx); setIsMobileMenuOpen(false); }} className={`w-full text-left p-2 rounded-lg text-[9px] font-black uppercase transition-colors ${activeLessonIdx === lIdx ? 'text-cyan-400' : 'text-slate-500 hover:text-white'}`}>
                      {l.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      <div className="p-6 bg-slate-950 border-t border-white/10 space-y-3">
        {hasContent && (
          <button onClick={exportStudentHtml} className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-lg active:scale-95">
            GENERAR AULA ALUMNO
          </button>
        )}
        <button onClick={() => handleBuildUnit(activeUnitIdx)} disabled={isBuildingUnit}
          className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 ${!hasContent ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'} disabled:opacity-50`}>
          {isBuildingUnit ? 'DISEÑANDO...' : (hasContent ? 'REDISEÑAR UNIDAD' : 'DISEÑAR ESTA UNIDAD')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden animate-in fade-in duration-300 relative">

      <aside className={`hidden md:flex w-80 bg-slate-950 border-r border-white/5 flex-col h-full z-30 shadow-2xl shrink-0 ${isBuildingUnit ? 'opacity-30 pointer-events-none' : ''}`}>
        <SidebarContent />
      </aside>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative w-[85%] max-w-sm bg-slate-950 h-full flex flex-col shadow-2xl border-r border-white/10 animate-in slide-in-from-left duration-300">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white font-bold z-50"
            >✕</button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 overflow-y-auto bg-slate-950 custom-scrollbar relative">

        <div className="md:hidden sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-cyan-500 font-black text-[10px] uppercase tracking-widest"
          >
            <span>☰</span> MENÚ
          </button>
          <button onClick={onExit} className="text-slate-500 font-black text-[9px] uppercase px-2">SALIR</button>
        </div>

        <div className="p-6 md:p-10 lg:p-20 max-w-5xl mx-auto w-full">
          {viewMode === 'instrumentation' ? (
            <DidacticInstrumentationView course={course} />
          ) : isGeneratingInstrumentation ? (
            <div className="py-20 md:py-40 text-center animate-in fade-in duration-500">
              <ThinkingCrow />
              <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">{buildStatus}</h2>
              <div className="space-y-4">
                <p className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
                  Tiempo transcurrido: {loadTimer}s
                </p>
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Generando instrumentación didáctica...</p>
              </div>
            </div>
          ) : isBuildingUnit ? (
            <div className="py-20 md:py-40 text-center animate-in fade-in duration-500">
              <ThinkingCrow />
              <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">{buildStatus}</h2>
              <div className="space-y-4">
                <p className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
                  Tiempo transcurrido: {loadTimer}s
                </p>
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Usando motor de alta velocidad...</p>
              </div>
            </div>
          ) : viewMode === 'portfolio' ? (
            <UnitPortfolio
              unitTitle={currentUnit.title}
              activities={unitActivities}
              studentList={course.studentList || []}
              masterGrades={course.masterGrades || []}
              onUpdateRoster={handleUpdateRoster}
              onUpdateGrades={handleUpdateGrades}
            />
          ) : (lessons.length > 0 && currentLesson) ? (
            <LessonContent
              key={`${currentUnit.id}-${activeLessonIdx}`}
              lesson={currentLesson}
              unitTitle={currentUnit.title}
              totalActivitiesInUnit={unitActivities.length}
              isCompleted={completedLessons.has(currentLesson.id)}
              onToggleComplete={() => {
                const newC = new Set(completedLessons);
                if (currentLesson) {
                  newC.has(currentLesson.id) ? newC.delete(currentLesson.id) : newC.add(currentLesson.id);
                  setCompletedLessons(newC);
                }
              }}
              onGradeUpdate={() => { }}
            />
          ) : (
            <div className="py-20 md:py-40 text-center bg-slate-900/20 rounded-[30px] md:rounded-[50px] border border-white/5 px-6">
              <div className="text-5xl mb-10 opacity-30">📖</div>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase mb-4 tracking-tighter">{currentUnit.title}</h2>
              <p className="text-slate-400 text-xs font-medium max-w-md mx-auto mb-10 leading-relaxed italic">"{currentUnit.summary}"</p>
              <button
                onClick={() => handleBuildUnit(activeUnitIdx)}
                className="px-10 py-5 bg-cyan-500 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-cyan-500/20 active:scale-95"
              >
                GENERAR CONTENIDO TÉCNICO
              </button>
            </div>
          )}
        </div>
        <AiMentor topic={course.title} />
      </main>
    </div>
  );
};

// ... Rest of the helper functions (generateHtmlTemplate) stay the same as in the original file ...
function generateHtmlTemplate(course: Course) {
  return `
<!DOCTYPE html>
<html lang="es" translate="no">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AULA: ${course.title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        body { background: #020617; color: #f8fafc; font-family: 'Inter', sans-serif; height: 100vh; overflow: hidden; margin: 0; }
        .card { background: #1e293b; border-radius: 2.5rem; padding: 2rem; margin-bottom: 2.5rem; border: 1px solid rgba(255,255,255,0.05); position: relative; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .weight-badge { position: absolute; top: 0; right: 0; background: #06b6d4; color: #020617; padding: 0.6rem 1.5rem; font-size: 0.65rem; font-weight: 900; border-bottom-left-radius: 1.5rem; text-transform: uppercase; letter-spacing: 0.15rem; z-index: 10; }
        .weight-badge.test { background: #f59e0b; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .option-btn { width: 100%; text-align: left; padding: 1.2rem; border-radius: 1.5rem; border: 2px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.3); transition: all 0.3s; font-weight: 700; margin-bottom: 0.8rem; color: #94a3b8; font-size: 0.85rem; }
        .option-btn:hover:not(:disabled) { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2); transform: translateX(5px); color: white; }
        .option-btn.correct { background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #10b981; }
        .option-btn.wrong { background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #ef4444; }
        .final-btn { width: 100%; padding: 1.5rem; border-radius: 1.5rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3rem; font-size: 0.7rem; transition: all 0.4s; box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        .final-btn.pending { background: white; color: #020617; }
        .final-btn.completed { background: #10b981; color: #020617; }
        .input-area { width: 100%; background: #0f172a; border: 2px solid rgba(255,255,255,0.1); border-radius: 1.5rem; padding: 1.5rem; color: white; font-family: inherit; resize: vertical; min-height: 200px; outline: none; transition: border-color 0.3s; }
        .input-area:focus { border-color: #06b6d4; }
    </style>
</head>
<body class="flex h-screen overflow-hidden">
    <aside class="hidden md:flex w-80 border-r border-white/5 p-8 flex-col bg-slate-950 shrink-0 shadow-2xl z-50">
        <div class="mb-10">
          <p class="text-[8px] font-black text-cyan-500 uppercase tracking-[0.4em] mb-2">AULA VIRTUAL</p>
          <h1 class="text-lg font-black uppercase tracking-tighter text-white leading-tight">${course.title}</h1>
        </div>
        <nav id="nav-desktop" class="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar"></nav>
        <div class="pt-6 mt-6 border-t border-white/5">
           <p class="text-[7px] font-bold text-slate-600 uppercase tracking-widest">Estudiante</p>
           <div id="student-info" class="mt-2 flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-black text-[10px]">?</div>
              <span id="display-name" class="text-[10px] font-black text-white uppercase truncate">Sin Identificar</span>
           </div>
        </div>
    </aside>

    <main id="content" class="flex-1 min-w-0 overflow-y-auto bg-slate-900/20 custom-scrollbar relative">
        <div id="content-inner" class="max-w-4xl mx-auto p-6 md:p-12 lg:p-20 pb-40">
           <div id="login-screen" class="py-20 text-center">
              <div class="w-20 h-20 bg-white text-slate-950 rounded-3xl flex items-center justify-center text-3xl font-black mx-auto mb-10 shadow-2xl">A</div>
              <h2 class="text-3xl font-black text-white uppercase tracking-tighter mb-4">Acceso al Aula</h2>
              <div class="max-w-xs mx-auto space-y-4">
                 <input id="input-cn" type="text" placeholder="NÚMERO DE CONTROL" class="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl text-center font-black uppercase text-sm text-white outline-none focus:border-cyan-500">
                 <input id="input-name" type="text" placeholder="NOMBRE COMPLETO" class="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl text-center font-black uppercase text-sm text-white outline-none focus:border-cyan-500">
                 <button onclick="saveStudent()" class="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Entrar al Aula</button>
              </div>
           </div>
        </div>
    </main>

    <script>
        const course = ${JSON.stringify(course)};
        const navD = document.getElementById('nav-desktop');
        const inner = document.getElementById('content-inner');
        let studentData = JSON.parse(localStorage.getItem('aula_student') || 'null');
        let completedSet = new Set(JSON.parse(localStorage.getItem('completed_lessons') || '[]'));

        function saveStudent() {
          const cn = document.getElementById('input-cn').value.trim();
          const name = document.getElementById('input-name').value.trim();
          if(!cn || !name) return alert("Completa tus datos");
          studentData = { controlNumber: cn, name: name };
          localStorage.setItem('aula_student', JSON.stringify(studentData));
          init();
        }

        function updateSidebar() {
            navD.innerHTML = '';
            (course.units || []).forEach((u, uIdx) => {
                if (!u.lessons || u.lessons.length === 0) return;
                const container = document.createElement('div');
                container.className = "space-y-3";
                container.innerHTML = \`<p class="text-[8px] font-black text-slate-600 uppercase tracking-widest">UNIDAD 0\${uIdx + 1}</p>
                                         <p class="text-[10px] font-black text-white uppercase leading-tight">\${u.title}</p>\`;
                const list = document.createElement('div');
                list.className = "space-y-1 ml-2 border-l border-white/5 pl-4 py-1";
                u.lessons.forEach((l, lIdx) => {
                    const btn = document.createElement('button');
                    btn.className = "w-full text-left p-2 text-[9px] font-bold uppercase transition-all rounded-lg " + (completedSet.has(l.id) ? 'text-emerald-400' : 'text-slate-500 hover:text-white hover:bg-white/5');
                    btn.innerHTML = \`\${completedSet.has(l.id) ? '✓ ' : '○ '}\${l.title}\`;
                    btn.onclick = () => showLesson(uIdx, lIdx);
                    list.appendChild(btn);
                });
                container.appendChild(list);
                navD.appendChild(container);
            });
        }

        function showLesson(uIdx, lIdx) {
            const unit = course.units[uIdx];
            const lesson = unit.lessons[lIdx];
            inner.innerHTML = \`
                <div class="mb-16 animate-in slide-in-from-top duration-500">
                  <span class="px-4 py-2 bg-cyan-500/10 text-cyan-400 text-[8px] font-black uppercase rounded-full border border-cyan-500/20 mb-6 inline-block">\${unit.title}</span>
                  <h1 class="text-2xl md:text-4xl font-black uppercase text-white tracking-tighter leading-tight">\${lesson.title}</h1>
                </div>
                <div id="lesson-blocks" class="space-y-12"></div>
                <div class="mt-20 pt-10 border-t border-white/5 flex flex-col items-center">
                    <button id="final-btn" onclick="toggleComplete('\${lesson.id}')" class="final-btn \${completedSet.has(lesson.id) ? 'completed' : 'pending'}">
                      \${completedSet.has(lesson.id) ? '✓ LECCIÓN FINALIZADA' : 'FINALIZAR ESTUDIO'}
                    </button>
                </div>
            \`;

            const blocksContainer = document.getElementById('lesson-blocks');
            (lesson.blocks || []).forEach((b, bIdx) => {
                const card = document.createElement('div');
                card.className = "card";
                
                let extraContent = "";
                if(b.type === 'test' && b.testQuestions) {
                  card.classList.add('border-amber-500/20');
                  extraContent = \`<div class="mt-10 space-y-8 border-t border-white/5 pt-10">\` + 
                    b.testQuestions.map((q, qIdx) => \`
                      <div class="space-y-4">
                        <p class="text-sm font-black text-white">\${q.question}</p>
                        <div class="grid md:grid-cols-2 gap-3">
                          \${q.options.map((opt, oIdx) => \`
                            <button onclick="checkTest(this, \${oIdx}, \${q.correctAnswerIndex}, '\${q.feedback.replace(/'/g, "\\'")}')" class="option-btn">\${opt}</button>
                          \`).join('')}
                        </div>
                      </div>
                    \`).join('') + \`</div>\`;
                }

                if(b.type === 'activity') {
                  card.classList.add('border-cyan-500/20');
                  extraContent = \`
                    <div class="mt-10 space-y-6 border-t border-white/5 pt-10">
                      <div class="p-5 bg-black/40 rounded-3xl border border-white/5">
                        <p class="text-[7px] font-black text-cyan-500 uppercase tracking-widest mb-4">Criterios</p>
                        \${(b.rubric || []).map(r => \`
                          <div class="flex justify-between items-center py-2 border-b border-white/5 last:border-0 text-[9px] font-bold">
                            <span class="text-slate-400">\${r.criterion}</span>
                            <span class="text-white">\${r.points} PTS</span>
                          </div>
                        \`).join('')}
                      </div>
                      <textarea id="ans-\${bIdx}" class="input-area" placeholder="Respuesta técnica..."></textarea>
                      <button onclick="downloadSubmission('\${lesson.title}', '\${b.title}', 'ans-\${bIdx}')" class="w-full py-4 bg-cyan-500 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest">Generar Entrega</button>
                    </div>\`;
                }

                if(b.type === 'example') {
                  card.classList.add('border-indigo-500/20', 'bg-indigo-500/5');
                }

                card.innerHTML = \`
                  \${b.weight ? \`<div class="weight-badge \${b.type === 'test' ? 'test' : ''}">\${b.weight} Pts</div>\` : ''}
                  <h3 class="text-white font-black mb-6 uppercase text-[9px] tracking-widest opacity-50 flex items-center gap-2">
                    \${b.type === 'theory' ? '📖' : b.type === 'example' ? '🌍' : b.type === 'activity' ? '🛠️' : '⚡'} \${b.title}
                  </h3>
                  <div class="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-medium">\${b.content}</div>
                  \${extraContent}
                \`;
    blocksContainer.appendChild(card);
  });
  document.getElementById('content').scrollTo({ top: 0, behavior: 'smooth' });
}

function checkTest(btn, selected, correct, feedback) {
  const parent = btn.parentElement;
  const buttons = parent.querySelectorAll('button');
  buttons.forEach(b => b.disabled = true);
  if (selected === correct) btn.classList.add('correct'); else { btn.classList.add('wrong'); buttons[correct].classList.add('correct'); }
  const fbDiv = document.createElement('div');
  fbDiv.className = "mt-4 p-4 bg-white/5 rounded-xl border border-white/5 text-[10px] text-slate-400";
  fbDiv.innerHTML = feedback;
  parent.parentElement.appendChild(fbDiv);
}

function downloadSubmission(lessonTitle, activityTitle, textAreaId) {
  const content = document.getElementById(textAreaId).value;
  if (!content.trim()) return alert("Escribe tu respuesta.");
  const sub = { studentName: studentData.name, studentControlNumber: studentData.controlNumber, lessonTitle, activityTitle, content, timestamp: Date.now() };
  const blob = new Blob([JSON.stringify(sub, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = \`Entrega_\${studentData.controlNumber}_\${activityTitle.replace(/\\s+/g, '_')}.json\`;
            a.click();
        }

        function toggleComplete(id) {
            if (completedSet.has(id)) completedSet.delete(id); else completedSet.add(id);
            localStorage.setItem('completed_lessons', JSON.stringify(Array.from(completedSet)));
            updateSidebar();
            const btn = document.getElementById('final-btn');
            btn.className = "final-btn " + (completedSet.has(id) ? 'completed' : 'pending');
            btn.innerHTML = completedSet.has(id) ? '✓ LECCIÓN FINALIZADA' : 'FINALIZAR ESTUDIO';
        }

        function init() {
          if(!studentData) return;
          document.getElementById('display-name').innerText = studentData.name;
          inner.innerHTML = \`<div class="py-20 text-center"><h2 class="text-4xl font-black text-white uppercase tracking-tighter mb-4">Bienvenido, \${studentData.name.split(' ')[0]}</h2><p class="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Selecciona una lección para comenzar</p></div>\`;
          updateSidebar();
        }

        if(studentData) init();
    </script>
</body>
</html>`;
}

export default CourseViewer;
