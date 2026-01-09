
import React, { useState, useEffect, useMemo } from 'react';
import { LessonBlock, StudentSubmission, AuthorizedStudent } from '../types';
import { gradeSubmission } from '../geminiService';

interface UnitPortfolioProps {
  unitTitle: string;
  activities: {lessonTitle: string, block: LessonBlock, blockIdx: number}[];
  studentList: AuthorizedStudent[];
  masterGrades: StudentSubmission[];
  onUpdateRoster: (roster: AuthorizedStudent[]) => void;
  onUpdateGrades: (grades: StudentSubmission[]) => void;
}

const UnitPortfolio: React.FC<UnitPortfolioProps> = ({ 
  unitTitle, 
  activities = [], 
  studentList = [], 
  masterGrades = [], 
  onUpdateRoster, 
  onUpdateGrades 
}) => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'roster' | 'rubrics'>('submissions');
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [localSubmissions, setLocalSubmissions] = useState<StudentSubmission[]>([]);
  const [isGrading, setIsGrading] = useState(false);
  const [rosterInput, setRosterInput] = useState("");
  const [selectedRubricIdx, setSelectedRubricIdx] = useState(0);

  useEffect(() => {
    if (masterGrades && masterGrades.length > 0) {
      setLocalSubmissions(prev => {
        const combined = [...prev];
        masterGrades.forEach(mg => {
          const index = combined.findIndex(s => s.studentControlNumber === mg.studentControlNumber && s.activityTitle === mg.activityTitle);
          if (index !== -1) combined[index] = mg;
          else combined.push(mg);
        });
        return combined;
      });
    }
  }, [masterGrades]);

  const handleImportRoster = () => {
    const lines = rosterInput.split('\n').filter(l => l.trim() !== "");
    const newStudents: AuthorizedStudent[] = lines.map((line, i) => {
      const parts = line.split(/[,\t]/);
      return {
        id: `std_${Date.now()}_${i}`,
        controlNumber: parts[0]?.trim() || `S${i+1}`,
        name: parts[1]?.trim() || parts[0]?.trim() || "Alumno Desconocido"
      };
    });
    onUpdateRoster(newStudents);
    setRosterInput("");
    setActiveTab('submissions');
  };

  const handleProcessSubmissions = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data && data.studentControlNumber) {
            setLocalSubmissions(prev => {
              const exists = prev.find(s => s.studentControlNumber === data.studentControlNumber && s.activityTitle === data.activityTitle);
              if (exists) return prev;
              return [...prev, data];
            });
          }
        } catch (err) { alert("Archivo de entrega inválido."); }
      };
      reader.readAsText(file);
    });
  };

  const handleAudit = async (sub: StudentSubmission) => {
    setIsGrading(true);
    try {
      const result = await gradeSubmission(sub);
      const graded = { ...sub, ...result };
      
      setLocalSubmissions(prev => prev.map(s => 
        (s.studentControlNumber === sub.studentControlNumber && s.activityTitle === sub.activityTitle) ? graded : s
      ));
      setSelectedSubmission(graded);

      const newMaster = [...masterGrades];
      const mIdx = newMaster.findIndex(m => m.studentControlNumber === graded.studentControlNumber && m.activityTitle === graded.activityTitle);
      if (mIdx !== -1) newMaster[mIdx] = graded;
      else newMaster.push(graded);
      onUpdateGrades(newMaster);

    } catch (e) {
      alert("Error en la auditoría IA.");
    } finally {
      setIsGrading(false);
    }
  };

  const exportGradesBackup = () => {
    const data = JSON.stringify(masterGrades, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Respaldo_Calificaciones_${unitTitle.replace(/\s+/g, '_')}.json`;
    a.click();
  };

  const importGradesBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (Array.isArray(imported)) onUpdateGrades(imported);
      } catch { alert("Archivo de respaldo inválido."); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto pb-40">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Portafolio <span className="text-cyan-400">Técnico</span></h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">{unitTitle}</p>
        </div>
        
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-white/5">
          <button onClick={() => setActiveTab('submissions')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'submissions' ? 'bg-white text-slate-950' : 'text-slate-500 hover:text-white'}`}>Entregas</button>
          <button onClick={() => setActiveTab('roster')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'roster' ? 'bg-white text-slate-950' : 'text-slate-500 hover:text-white'}`}>Lista Nominal</button>
          <button onClick={() => setActiveTab('rubrics')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'rubrics' ? 'bg-white text-slate-950' : 'text-slate-500 hover:text-white'}`}>Rúbricas</button>
        </div>
      </div>

      {activeTab === 'roster' && (
        <div className="grid md:grid-cols-2 gap-10 animate-in fade-in duration-500">
          <div className="space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Importar Alumnos</h3>
            <textarea 
              value={rosterInput}
              onChange={(e) => setRosterInput(e.target.value)}
              placeholder="21010001, GARCIA PEREZ JUAN"
              className="w-full h-64 bg-slate-950 border border-white/10 rounded-3xl p-6 text-xs text-white outline-none focus:border-cyan-500 transition-all font-mono"
            />
            <button onClick={handleImportRoster} className="w-full py-5 bg-cyan-500 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest">Sincronizar Lista</button>
          </div>
          <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Lista Actual ({studentList.length})</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {studentList.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                  <div>
                    <p className="text-[10px] font-black text-white uppercase">{s.name}</p>
                    <p className="text-[8px] text-slate-500 font-bold">{s.controlNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 flex flex-col justify-between group hover:border-cyan-500/30 transition-all cursor-pointer relative overflow-hidden">
                <input type="file" multiple accept=".json" onChange={(e) => e.target.files && handleProcessSubmissions(e.target.files)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Cargar Entregas</h4>
             </div>
             <div onClick={exportGradesBackup} className="bg-slate-900 border border-white/10 rounded-3xl p-6 flex flex-col justify-between group hover:border-emerald-500/30 transition-all cursor-pointer">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Respaldar Notas</h4>
             </div>
             <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 flex flex-col justify-between group hover:border-amber-500/30 transition-all cursor-pointer relative overflow-hidden">
                <input type="file" accept=".json" onChange={importGradesBackup} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Cargar Respaldo</h4>
             </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-3">
              {localSubmissions.map((sub, i) => (
                <button 
                  key={i}
                  onClick={() => setSelectedSubmission(sub)}
                  className={`w-full text-left p-5 rounded-3xl border transition-all ${selectedSubmission === sub ? 'bg-white border-white' : 'bg-slate-900 border-white/5'}`}
                >
                  <p className={`text-[8px] font-black uppercase ${selectedSubmission === sub ? 'text-slate-500' : 'text-cyan-500'}`}>{sub.studentControlNumber}</p>
                  <h4 className={`text-xs font-black uppercase truncate ${selectedSubmission === sub ? 'text-slate-950' : 'text-white'}`}>{sub.studentName}</h4>
                </button>
              ))}
            </div>

            <div className="lg:col-span-8">
              {selectedSubmission ? (
                <div className="bg-slate-900 border border-white/5 rounded-[50px] p-10 space-y-10 animate-in slide-in-from-right-4 duration-500">
                  <div className="flex justify-between items-start gap-6 border-b border-white/5 pb-8">
                    <div>
                      <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{selectedSubmission.studentName}</h3>
                      <p className="text-cyan-500 text-[9px] font-black uppercase mt-1 tracking-widest">{selectedSubmission.activityTitle}</p>
                    </div>
                    {selectedSubmission.score === undefined && (
                      <button onClick={() => handleAudit(selectedSubmission)} disabled={isGrading} className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest">
                        {isGrading ? 'AUDITANDO...' : 'AUDITAR CON IA'}
                      </button>
                    )}
                  </div>
                  <div className="p-6 bg-black/40 rounded-3xl text-slate-300 text-sm whitespace-pre-line border border-white/5">
                    {selectedSubmission.content}
                  </div>
                </div>
              ) : (
                <div className="py-40 border-2 border-dashed border-white/5 rounded-[60px] text-center">
                  <p className="text-slate-600 font-black uppercase text-[8px] tracking-widest">Selecciona un alumno</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rubrics' && (
        <div className="grid md:grid-cols-3 gap-8 animate-in fade-in duration-500">
           <div className="space-y-2">
              {activities.map((act, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedRubricIdx(i)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all ${selectedRubricIdx === i ? 'bg-white border-white text-slate-950' : 'bg-slate-900 border-white/5 text-slate-400'}`}
                >
                  <h4 className="text-[11px] font-black uppercase truncate">{act.block?.title || "Actividad"}</h4>
                </button>
              ))}
           </div>
           {activities.length > 0 && (
             <div className="md:col-span-2 bg-slate-900 border border-white/5 rounded-[40px] p-10">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8">{activities[selectedRubricIdx]?.block?.title}</h3>
                <div className="space-y-4">
                   {(activities[selectedRubricIdx]?.block?.rubric || []).map((r, i) => (
                      <div key={i} className="p-5 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center">
                         <div>
                            <p className="text-[10px] font-black text-white uppercase">{r.criterion}</p>
                            <p className="text-[8px] text-slate-500 mt-1">{r.description}</p>
                         </div>
                         <div className="text-right shrink-0">
                            <span className="text-xl font-black text-cyan-400">{r.points}</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default UnitPortfolio;
