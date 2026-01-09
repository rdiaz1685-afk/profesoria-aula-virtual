
import React, { useState, useEffect, useRef } from 'react';
import { UserPreferences, Course, TeacherProfile } from './types';
import { generateCourseSkeletonOpenAI } from './openaiSkeletonService';
import { generateInstrumentationOpenAI } from './openaiService';
import CourseForm from './components/CourseForm';
import CourseViewer from './components/CourseViewer';
import ThinkingCrow from './components/ThinkingCrow';

const APP_VERSION = '2.9-chrome-fix';

function App() {
  const [error, setError] = useState<string | null>(null);
  const [loginInput, setLoginInput] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [genTimer, setGenTimer] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('profesoria_user_api_key') || "");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const [teacher, setTeacher] = useState<TeacherProfile | null>(() => {
    try {
      const session = localStorage.getItem('profesoria_teacher_session');
      return session ? JSON.parse(session) : null;
    } catch { return null; }
  });

  const [savedCourses, setSavedCourses] = useState<Course[]>(() => {
    if (!teacher) return [];
    try {
      const library = localStorage.getItem(`profesoria_library_${teacher.id}`);
      return library ? JSON.parse(library) : [];
    } catch { return []; }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (isGenerating) {
      setGenTimer(0);
      timerRef.current = setInterval(() => {
        setGenTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isGenerating]);

  useEffect(() => {
    if (teacher) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const teacherLibraryKey = `profesoria_library_${teacher.id}`;
        try {
          localStorage.setItem(teacherLibraryKey, JSON.stringify(savedCourses));
        } catch (e: any) {
          if (e.name === 'QuotaExceededError') {
            alert("⚠️ Memoria llena. Exporta tus materias y limpia el caché.");
          }
        }
      }, 1000);
    }
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [savedCourses, teacher]);

  const handleLogin = (id: string) => {
    if (!id.trim()) return;
    const profile: TeacherProfile = { id: id.toUpperCase().trim(), name: id, role: 'teacher', joinedAt: Date.now() };
    setTeacher(profile);
    localStorage.setItem('profesoria_teacher_session', JSON.stringify(profile));
    const library = localStorage.getItem(`profesoria_library_${profile.id}`);
    setSavedCourses(library ? JSON.parse(library) : []);
  };

  const clearBrowserCache = () => {
    if (confirm("¿Limpiar optimizaciones temporales? Tus materias guardadas NO se borrarán, solo se refrescará el motor gráfico.")) {
      // Limpiamos claves que no sean la biblioteca principal
      Object.keys(localStorage).forEach(key => {
        if (!key.startsWith('profesoria_library_') && key !== 'profesoria_teacher_session') {
          localStorage.removeItem(key);
        }
      });
      window.location.reload();
    }
  };

  const [generatingEngine, setGeneratingEngine] = useState<string>("");

  const handleGenerate = async (prefs: UserPreferences) => {
    setIsGenerating(true);
    setError(null);
    try {
      let skeleton: Course | null = null;

      // Intento 1: Gemini (GRATIS)
      try {
        setGeneratingEngine("CONECTANDO CON GOOGLE GEMINI...");
        await new Promise(r => setTimeout(r, 1500)); // Delay para que el usuario vea
        console.log('🔷 Intentando con Gemini (gratis)...');
        const { generateCourseSkeleton } = await import('./geminiService');
        skeleton = await generateCourseSkeleton(prefs);
        console.log('✅ Generado con Gemini exitosamente');
      } catch (geminiError: any) {
        console.warn('⚠️ Gemini no disponible:', geminiError.message);
        setGeneratingEngine("⚠️ GEMINI FALLÓ (404/API KEY). REINTENTANDO CON OTRO MOTOR...");
        await new Promise(r => setTimeout(r, 2000));

        // Intento 2: OpenAI (si tiene API key)
        try {
          setGeneratingEngine("CONECTANDO CON OPENAI ENGINE...");
          await new Promise(r => setTimeout(r, 1000));
          console.log('🔶 Intentando con OpenAI...');
          skeleton = await generateCourseSkeletonOpenAI(prefs);
          console.log('✅ Generado con OpenAI exitosamente');
        } catch (openaiError: any) {
          console.warn('⚠️ OpenAI no disponible:', openaiError.message);

          // Intento 3: Modo Demo (SIEMPRE FUNCIONA)
          setGeneratingEngine("ACTIVANDO MODO DEMO (SIN CONEXIÓN IA)");
          await new Promise(r => setTimeout(r, 1500));
          console.log('🟢 Usando modo demo local...');
          const { generateDemoSkeleton } = await import('./demoSkeletonService');
          skeleton = generateDemoSkeleton(prefs);
          console.log('✅ Generado en modo demo');
        }
      }

      if (skeleton) {
        setSavedCourses(prev => [skeleton, ...prev]);
        setCurrentCourse(skeleton);
        setShowForm(false);
      }
    } catch (err: any) {
      console.error("❌ Error crítico:", err);
      alert("Error generando estructura. Por favor intenta de nuevo.");
    } finally {
      setIsGenerating(false);
      // No limpiamos el engine inmediatamente si hubo error
      setTimeout(() => setGeneratingEngine(""), 1000);
    }
  };

  const handleUpdateCourse = (updated: Course) => {
    setSavedCourses(prev => prev.map(c => c.id === updated.id ? updated : c));
    setCurrentCourse(updated);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (Array.isArray(imported)) setSavedCourses(prev => [...imported, ...prev]);
        else if (imported.id) setSavedCourses(prev => [imported, ...prev]);
      } catch { alert("Archivo inválido."); }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const data = JSON.stringify(savedCourses, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Biblioteca_TecNM_${teacher?.id}.json`;
    a.click();
  };

  return (
    <div className="h-screen w-full bg-[#020617] text-slate-200 flex flex-col font-sans overflow-hidden selection:bg-cyan-500/30">
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[11000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-white/10 p-10 rounded-[40px] max-w-sm w-full text-center">
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">¿Cerrar Sesión?</h2>
            <div className="grid grid-cols-2 gap-3 mt-8">
              <button onClick={() => setShowLogoutConfirm(false)} className="py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
              <button onClick={() => { setTeacher(null); setCurrentCourse(null); setShowLogoutConfirm(false); localStorage.removeItem('profesoria_teacher_session'); }} className="py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Salir</button>
            </div>
          </div>
        </div>
      )}

      {courseToDelete && (
        <div className="fixed inset-0 z-[11000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-red-500/20 p-10 rounded-[40px] max-w-sm w-full text-center">
            <h2 className="text-xl font-black text-white mb-8 uppercase tracking-tighter">¿Eliminar Materia?</h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setCourseToDelete(null)} className="py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
              <button onClick={() => { setSavedCourses(prev => prev.filter(c => c.id !== courseToDelete.id)); setCourseToDelete(null); }} className="py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[11000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-white/10 p-10 rounded-[40px] max-w-lg w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>

            <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white text-2xl">×</button>

            <div className="flex flex-col items-center text-center space-y-6">
              <ThinkingCrow />
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Llave de Inteligencia</h2>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                Para garantizar que el sistema siempre responda, te recomendamos usar tu propia llave de Google Gemini (es gratuita).
              </p>

              <div className="w-full space-y-4">
                <input
                  type="password"
                  className="w-full p-5 rounded-2xl bg-black/40 border border-white/10 text-white text-center font-mono text-sm outline-none focus:border-cyan-500 transition-all"
                  placeholder="PEGA TU API KEY AQUÍ"
                  value={userApiKey}
                  onChange={(e) => {
                    const key = e.target.value.trim();
                    setUserApiKey(key);
                    localStorage.setItem('profesoria_user_api_key', key);
                  }}
                />

                <div className="grid grid-cols-1 gap-2">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="py-4 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-slate-950 transition-all"
                  >
                    1. Obtener Llave Gratis ➔
                  </a>
                  <button
                    onClick={() => {
                      setUserApiKey("");
                      localStorage.removeItem('profesoria_user_api_key');
                    }}
                    className="py-4 text-slate-600 text-[8px] font-black uppercase tracking-widest hover:text-red-400 transition-colors"
                  >
                    Eliminar llave guardada
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 w-full">
                <p className="text-[8px] text-slate-600 uppercase tracking-widest leading-loose">
                  Tu llave se guarda únicamente en este navegador.<br />
                  Nunca se comparte con otros usuarios.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!teacher ? (
        <div className="h-full flex items-center justify-center p-6 bg-[#020617] relative overflow-hidden text-slate-200">
          {/* LUXURY BACKGROUND ELEMENTS */}
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-cyan-500/10 blur-[150px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full"></div>
          <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-purple-600/5 blur-[100px] rounded-full animate-bounce duration-[10s]"></div>

          <div className="relative z-10 max-w-5xl w-full grid md:grid-cols-2 gap-16 items-center">
            <div className="text-left space-y-10 animate-in slide-in-from-left duration-1000">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-[28px] flex items-center justify-center text-3xl font-black text-slate-950 shadow-[0_0_40px_rgba(6,182,212,0.3)] transform hover:rotate-6 transition-transform">
                IA
              </div>
              <h1 className="text-7xl font-black text-white leading-[0.85] tracking-tighter uppercase italic">
                Cátedra <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Inteligente</span>
              </h1>
              <div className="space-y-6 border-l-4 border-cyan-500/20 pl-8">
                <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-md">
                  "Redefiniendo la educación técnica superior con Inteligencia Artificial generativa. Transformamos temarios oficiales en experiencias de aprendizaje inmersivas."
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-[2px] w-12 bg-cyan-500/30"></div>
                  <p className="text-[11px] font-black text-cyan-500/60 uppercase tracking-[0.3em]">
                    Ecosistema TecNM • 2026
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 p-14 rounded-[70px] border border-white/10 w-full text-center backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in duration-700 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <h2 className="text-xs font-black text-cyan-500 uppercase tracking-[0.4em] mb-10 relative z-10">Acceso al Nodo Académico</h2>
              <div className="space-y-5 relative z-10">
                <input
                  className="w-full p-7 rounded-[30px] bg-black/60 border border-white/10 text-white outline-none focus:border-cyan-500 text-center font-black text-lg mb-2 placeholder:text-slate-800 transition-all focus:ring-[15px] focus:ring-cyan-500/5"
                  placeholder="ID DE CATEDRÁTICO"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin(loginInput)}
                />
                <button
                  onClick={() => handleLogin(loginInput)}
                  className="w-full py-7 bg-white text-slate-950 rounded-[30px] font-black uppercase text-xs tracking-[0.4em] hover:bg-cyan-400 transition-all active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:shadow-cyan-500/20"
                >
                  Sincronizar ➔
                </button>
              </div>
              <div className="mt-12 flex items-center justify-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Canal Seguro AES-256
                </p>
              </div>
            </div>
          </div>
        </div>
      ) :
        currentCourse ? (
          <CourseViewer key={currentCourse.id} course={currentCourse} onExit={() => setCurrentCourse(null)} onUpdateCourse={handleUpdateCourse} />
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* DYNAMIC BACKGROUND */}
            <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-cyan-500/5 blur-[120px] rounded-full -z-10 animate-pulse"></div>

            <div className="px-10 py-16 shrink-0 border-b border-white/5 bg-slate-950/20 backdrop-blur-md">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-5">
                    <div className="h-1 w-12 bg-cyan-500"></div>
                    <button onClick={() => setShowLogoutConfirm(true)} className="text-[10px] font-black text-slate-500 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2">
                      <span className="text-lg">⏻</span> CERRAR SESIÓN
                    </button>
                  </div>
                  <h1 className="text-6xl font-black text-white uppercase tracking-tighter leading-[0.8] drop-shadow-2xl">
                    Biblioteca <br />
                    <span className="text-cyan-500 drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">Docente</span>
                  </h1>
                </div>

                <div className="flex flex-wrap gap-3 p-2 bg-slate-900/50 rounded-[35px] border border-white/5 backdrop-blur-md shadow-2xl">
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
                  <button onClick={clearBrowserCache} className="px-6 py-4 rounded-3xl font-black uppercase text-[9px] tracking-widest text-slate-500 hover:text-white transition-all">Limpiar</button>
                  <button onClick={() => fileInputRef.current?.click()} className="px-6 py-4 rounded-3xl font-black uppercase text-[9px] tracking-widest text-slate-400 hover:bg-white/5">Importar</button>
                  <button onClick={handleExport} className="px-6 py-4 rounded-3xl font-black uppercase text-[9px] tracking-widest text-slate-400 hover:bg-white/5">Exportar</button>
                  <button onClick={() => setShowForm(true)} className="px-10 py-4 bg-white text-slate-950 rounded-[28px] font-black uppercase text-[10px] tracking-widest hover:bg-cyan-400 transition-all active:scale-95 shadow-xl shadow-cyan-500/10 hover:shadow-cyan-500/30">
                    + Nueva Materia
                  </button>
                  <button onClick={() => setShowSettings(true)} className="w-12 h-12 flex items-center justify-center bg-slate-900 border border-white/10 rounded-full hover:border-cyan-500 transition-all text-xl" title="Configuración de IA">
                    ⚙️
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-10 pb-32 custom-scrollbar">
              {isGenerating && (
                <div className="sticky top-10 z-[500] max-w-xl mx-auto mb-16 animate-in slide-in-from-top duration-700">
                  <div className="bg-slate-900/80 border border-cyan-500/30 text-white rounded-[50px] p-12 text-center shadow-[0_50px_100px_rgba(0,0,0,0.7)] backdrop-blur-3xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-shimmer"></div>
                    <ThinkingCrow />
                    <p className="text-sm font-black uppercase tracking-[0.5em] animate-pulse text-cyan-400 mb-6 font-mono">CONSTRUYENDO ARQUITECTURA DIGITAL</p>
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-cyan-500/10 py-3 px-8 rounded-full border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                        <p className="text-[11px] text-white font-black uppercase tracking-[0.2em]">{generatingEngine}</p>
                      </div>
                      <div className="w-full max-w-xs bg-white/5 h-1 rounded-full overflow-hidden mt-4">
                        <div className="h-full bg-cyan-500 animate-[loading_10s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-black mt-2 uppercase tracking-[0.3em]">Tiempo en Proceso: {genTimer}S</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pt-16">
                {showForm ? (
                  <div className="col-span-full pb-32">
                    <button onClick={() => setShowForm(false)} className="mb-10 px-8 py-4 bg-white/5 border border-white/5 rounded-2xl text-slate-400 hover:text-white font-black uppercase text-[10px] tracking-widest transition-all">← Cancelar y Volver</button>
                    <CourseForm onSubmit={handleGenerate} isLoading={isGenerating} />
                  </div>
                ) : savedCourses.length === 0 ? (
                  <div className="col-span-full py-60 bg-slate-900/10 rounded-[80px] border-4 border-dashed border-white/5 text-center flex flex-col items-center justify-center group hover:border-cyan-500/10 transition-all">
                    <div className="text-8xl mb-10 opacity-10 group-hover:opacity-30 transition-opacity grayscale group-hover:grayscale-0">📚</div>
                    <p className="text-slate-500 text-sm uppercase font-black tracking-[0.5em]">Laboratorio Académico Vacío</p>
                    <button onClick={() => setShowForm(true)} className="mt-10 text-[10px] font-black text-cyan-500 uppercase tracking-widest border-b border-cyan-500/20 pb-1 hover:border-cyan-500 transition-all">Comienza a diseñar tu primera materia</button>
                  </div>
                ) : (
                  savedCourses.map((c) => (
                    <div key={c.id} onClick={() => setCurrentCourse(c)} className="bg-slate-900/40 p-12 rounded-[60px] border border-white/5 hover:border-cyan-500/40 cursor-pointer transition-all hover:-translate-y-4 group shadow-2xl relative overflow-hidden backdrop-blur-sm">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-cyan-500/20 transition-all"></div>

                      <div className="flex justify-between items-start mb-10 relative z-10">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest bg-cyan-500/10 px-4 py-1.5 rounded-full border border-cyan-500/20 inline-block">
                            {c.subjectCode || 'TEC'}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500/60 uppercase ml-1 italic">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setCourseToDelete(c); }} className="w-12 h-12 rounded-[20px] bg-white/5 flex items-center justify-center hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-all border border-transparent hover:border-red-500/30">
                          <span className="text-xl">×</span>
                        </button>
                      </div>

                      <h3 className="font-black text-white text-3xl mb-16 line-clamp-2 uppercase tracking-tighter leading-[0.9] group-hover:text-cyan-400 transition-colors">
                        {c.title}
                      </h3>

                      <div className="flex justify-between items-center pt-8 border-t border-white/5 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Digitalizada</span>
                        </div>
                        <div className="flex items-center gap-2 group-hover:gap-4 transition-all">
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">Abrir Nodo</span>
                          <div className="w-12 h-12 bg-white/5 rounded-[22px] flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all border border-white/5 group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                            <span className="text-xl font-bold">→</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <footer className="p-10 text-center border-t border-white/5 bg-slate-950/40 shrink-0 backdrop-blur-md">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] mb-2 drop-shadow-sm">
                SISTEMA DE DISEÑO ACADÉMICO INTEGRAL • <span className="text-cyan-600">v{APP_VERSION}</span>
              </p>
              <p className="text-[8px] font-medium text-slate-800 uppercase tracking-[0.3em]">
                Tecnológico Nacional de México • Centro de Innovación IA
              </p>
            </footer>
          </div>
        )}
    </div>
  );
}

export default App;
