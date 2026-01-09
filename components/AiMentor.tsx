import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface AiMentorProps {
    topic: string;
}

const AiMentor: React.FC<AiMentorProps> = ({ topic }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsTyping(true);

        try {
            const { callGeminiDynamic } = await import('../geminiService');

            const prompt = `Actúa como un Mentor de Ingeniería senior del TecNM. Tu enfoque es profundamente humano, ético y motivador. 
      CONTEXTO: Estás ayudando a un estudiante en la materia "${topic}".
      PREGUNTA DEL ESTUDIANTE: "${userMsg}"
      
      OBJETIVO: Responde de forma técnica pero inspiradora, resaltando cómo este conocimiento sirve para mejorar el mundo o la industria con ética profesional. Sé breve pero impactante.`;

            const text = await callGeminiDynamic(prompt);
            setMessages(prev => [...prev, { role: 'ai', content: text }]);
        } catch (error) {
            console.error("Mentor Error:", error);
            setMessages(prev => [...prev, { role: 'ai', content: "Hubo un pequeño error en mi nodo de procesamiento, pero recuerda: un ingeniero siempre encuentra la solución. Por favor, intenta preguntarme de nuevo." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className={`fixed bottom-8 right-8 z-[10000] flex flex-col items-end transition-all duration-500 ${isOpen ? 'w-80 md:w-96' : 'w-20'}`}>
            {isOpen && (
                <div className="w-full h-[450px] bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl flex flex-col overflow-hidden mb-6 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="p-6 bg-gradient-to-r from-cyan-600 to-blue-700 flex justify-between items-center">
                        <div>
                            <h3 className="text-white font-black uppercase text-[10px] tracking-widest">Mentor IA</h3>
                            <p className="text-cyan-100 text-[8px] font-bold uppercase">Human-Centric Engineering</p>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white opacity-50 hover:opacity-100">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="text-center py-10">
                                <div className="text-4xl mb-4">🤝</div>
                                <p className="text-slate-400 text-[10px] font-black uppercase leading-relaxed">
                                    Soy tu mentor. ¿Tienes dudas sobre cómo aplicar {topic} para mejorar el mundo?
                                </p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-3xl text-xs font-medium leading-relaxed ${m.role === 'user' ? 'bg-cyan-500 text-slate-950 rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 p-4 rounded-3xl animate-pulse flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-white/5 flex gap-2">
                        <input
                            className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-cyan-500"
                            placeholder="Pregunta a tu mentor..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button onClick={handleSend} className="w-12 h-12 bg-white text-slate-950 rounded-2xl flex items-center justify-center font-bold">➔</button>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-[30px] shadow-2xl shadow-cyan-500/30 flex items-center justify-center text-3xl hover:scale-110 active:scale-90 transition-all group"
            >
                <span className="group-hover:animate-bounce">🤖</span>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-[#020617] rounded-full"></div>
            </button>
        </div>
    );
};

export default AiMentor;
