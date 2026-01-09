
import React, { useState } from 'react';
import { Transaction, performConciliation, cleanAmount } from '../conciliadorService';

const ConciliadorPanel = () => {
    const [innovatData, setInnovatData] = useState<Transaction[]>([]);
    const [bancoData, setBancoData] = useState<Transaction[]>([]);
    const [results, setResults] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Simulador de carga de archivos (Pronto lo conectaremos a tu CSV real)
    const handleFileUpload = (e: any, type: 'innovat' | 'banco') => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');

            const processed: Transaction[] = lines.map((line, idx) => {
                const parts = line.split(',');
                // Lógica simplificada basada en tu archivo:
                // Fecha[0], Nombre[1], Clave[2], Monto[3]
                if (parts.length < 4) return null;

                return {
                    date: parts[0],
                    name: parts[1],
                    id: parts[2],
                    amount: cleanAmount(parts[3]),
                    source: type,
                    status: 'pending',
                    originalLine: line
                };
            }).filter(x => x && x.amount > 0) as Transaction[];

            if (type === 'innovat') setInnovatData(processed);
            else setBancoData(processed);
        };
        reader.readAsText(file);
    };

    const runAnalysis = () => {
        setIsProcessing(true);
        setTimeout(() => {
            const res = performConciliation(innovatData, bancoData);
            setResults(res);
            setIsProcessing(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8 font-sans">
            <header className="mb-12 flex justify-between items-end border-b border-emerald-500/20 pb-8">
                <div>
                    <p className="text-emerald-500 font-black uppercase tracking-[0.4em] text-[10px] mb-2">Módulo de Auditoría</p>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic">Conciliador <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Pro</span></h1>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Colegio Dominio • Diciembre 2025</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Panel de Carga */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900/50 p-8 rounded-[40px] border border-white/5 backdrop-blur-xl">
                        <h2 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Fuente de Datos
                        </h2>

                        <div className="space-y-4">
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer relative group">
                                <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Reporte Innovat (Ingresos)</p>
                                <input type="file" onChange={(e) => handleFileUpload(e, 'innovat')} className="opacity-0 absolute inset-0 cursor-pointer" />
                                <p className="text-sm font-bold text-white">{innovatData.length > 0 ? `✅ ${innovatData.length} Registros` : '✚ Seleccionar Archivo'}</p>
                            </div>

                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer relative group">
                                <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Estado de Cuenta (Banco)</p>
                                <input type="file" onChange={(e) => handleFileUpload(e, 'banco')} className="opacity-0 absolute inset-0 cursor-pointer" />
                                <p className="text-sm font-bold text-white">{bancoData.length > 0 ? `✅ ${bancoData.length} Registros` : '✚ Seleccionar Archivo'}</p>
                            </div>
                        </div>

                        <button
                            onClick={runAnalysis}
                            disabled={innovatData.length === 0 || bancoData.length === 0 || isProcessing}
                            className="w-full mt-8 py-5 bg-emerald-500 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                        >
                            {isProcessing ? 'Procesando Inteligencia...' : 'Ejecutar Conciliación ➔'}
                        </button>
                    </div>

                    {results && (
                        <div className="bg-slate-900/50 p-8 rounded-[40px] border border-white/5 space-y-6">
                            <div className="flex justify-between items-center py-4 border-b border-white/5">
                                <span className="text-[10px] uppercase font-black text-slate-500">Total Innovat</span>
                                <span className="text-lg font-black text-white">${results.totalAmountInnovat.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b border-white/5 text-emerald-400">
                                <span className="text-[10px] uppercase font-black">Total Banco</span>
                                <span className="text-lg font-black">${results.totalAmountBanco.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4">
                                <span className="text-[10px] uppercase font-black text-slate-500">Diferencia</span>
                                <span className={`text-xl font-black ${results.totalAmountBanco - results.totalAmountInnovat === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    ${(results.totalAmountBanco - results.totalAmountInnovat).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Panel de Resultados */}
                <div className="lg:col-span-2 space-y-6">
                    {!results ? (
                        <div className="h-full min-h-[500px] border-4 border-dashed border-white/5 rounded-[60px] flex flex-col items-center justify-center text-slate-700">
                            <span className="text-6xl mb-6">📊</span>
                            <p className="text-[10px] font-black uppercase tracking-[0.5em]">Esperando Datos para Análisis</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl text-center">
                                    <p className="text-[10px] font-black uppercase text-emerald-500 mb-1">Cruce Exitoso</p>
                                    <p className="text-3xl font-black text-white">{results.matches.length}</p>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl text-center">
                                    <p className="text-[10px] font-black uppercase text-red-500 mb-1">Solo en Banco</p>
                                    <p className="text-3xl font-black text-white">{results.onlyBanco.length}</p>
                                </div>
                                <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl text-center">
                                    <p className="text-[10px] font-black uppercase text-amber-500 mb-1">Pendiente Innovat</p>
                                    <p className="text-3xl font-black text-white">{results.onlyInnovat.length}</p>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 rounded-[40px] border border-white/5 p-8">
                                <h3 className="text-xs font-black uppercase tracking-widest mb-8">Detalle de Conciliación</h3>
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                                    {results.matches.map((m: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-all">
                                            <div className="flex-1">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Innovat: {m.a.id}</p>
                                                <p className="text-sm font-bold text-white truncate">{m.a.name}</p>
                                            </div>
                                            <div className="w-20 text-center">
                                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                                    {m.confidence}%
                                                </span>
                                            </div>
                                            <div className="flex-1 text-right">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Banco: {m.b.date}</p>
                                                <p className="text-sm font-black text-emerald-400">${m.a.amount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConciliadorPanel;
