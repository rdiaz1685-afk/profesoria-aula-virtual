
import React from 'react';

const ThinkingCrow = () => {
    return (
        <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-cyan-500/10 blur-[60px] rounded-full animate-pulse"></div>

            <svg
                viewBox="0 0 160 160"
                className="w-full h-full relative z-10 drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
                <defs>
                    <linearGradient id="crowBody" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                </defs>

                {/* Laptop/Computer */}
                <g transform="translate(40, 110)">
                    {/* Base */}
                    <path d="M0,5 L80,5 L70,18 L10,18 Z" fill="#334155" stroke="#06b6d4" strokeWidth="1.5" />
                    {/* Screen */}
                    <path d="M10,-30 L70,-30 L80,5 L0,5 Z" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
                    {/* Screen Glow */}
                    <rect x="15" y="-25" width="50" height="25" fill="#06b6d4" fillOpacity="0.1" className="animate-pulse" />
                    {/* Code lines */}
                    <line x1="20" y1="-18" x2="40" y2="-18" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.4" className="animate-[code_2s_infinite]" />
                    <line x1="20" y1="-10" x2="50" y2="-10" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.4" className="animate-[code_2.5s_infinite]" />
                </g>

                {/* Crow Group */}
                <g className="animate-[float_4s_ease-in-out_infinite]">
                    {/* Legs/Feet Typing */}
                    <g className="animate-[typing_0.2s_infinite]">
                        <line x1="70" y1="105" x2="65" y2="115" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                        <line x1="90" y1="105" x2="95" y2="115" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" className="animate-[typing_0.2s_infinite_reverse]" />
                    </g>

                    {/* Body */}
                    <ellipse cx="80" cy="80" rx="35" ry="30" fill="url(#crowBody)" stroke="#334155" strokeWidth="1" />

                    {/* Wings */}
                    <path d="M45,80 Q30,60 50,60" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" className="animate-[wing_2s_infinite]" />
                    <path d="M115,80 Q130,60 110,60" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" className="animate-[wing_2s_infinite_reverse]" />

                    {/* Head */}
                    <g transform="translate(0, -5)">
                        <circle cx="80" cy="50" r="22" fill="url(#crowBody)" />
                        {/* Eyes */}
                        <circle cx="72" cy="48" r="4" fill="white" />
                        <circle cx="72" cy="48" r="2" fill="black" className="animate-[blink_4s_infinite]" />
                        <circle cx="88" cy="48" r="4" fill="white" />
                        <circle cx="88" cy="48" r="2" fill="black" className="animate-[blink_4s_infinite]" />

                        {/* Beak */}
                        <path d="M75,55 L85,55 L80,72 Z" fill="#f59e0b" />
                    </g>
                </g>
            </svg>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes typing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes wing {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-5deg); }
        }
        @keyframes code {
          0% { stroke-dasharray: 0 100; opacity: 0; }
          50% { stroke-dasharray: 100 0; opacity: 0.8; }
          100% { stroke-dasharray: 100 0; opacity: 0; }
        }
      `}} />
        </div>
    );
};

export default ThinkingCrow;
