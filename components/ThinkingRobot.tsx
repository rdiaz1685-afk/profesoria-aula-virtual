
import React from 'react';

const ThinkingRobot = () => {
    return (
        <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-cyan-500/10 blur-[60px] rounded-full animate-pulse"></div>

            <svg
                viewBox="0 0 160 160"
                className="w-full h-full relative z-10 drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
                <defs>
                    <linearGradient id="robotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0f172a" />
                        <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>
                </defs>

                {/* Laptop/Computer */}
                <g transform="translate(40, 100)">
                    {/* Base/Keyboard */}
                    <path d="M0,10 L80,10 L70,25 L10,25 Z" fill="#1e293b" stroke="#06b6d4" strokeWidth="1.5" />
                    {/* Screen */}
                    <path d="M10,-35 L70,-35 L80,10 L0,10 Z" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
                    {/* Screen Content Pulse */}
                    <rect x="15" y="-28" width="50" height="30" fill="#06b6d4" fillOpacity="0.1" className="animate-pulse" />
                    {/* Code Lines */}
                    <line x1="20" y1="-20" x2="45" y2="-20" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.5" className="animate-[code_2s_infinite]" />
                    <line x1="20" y1="-12" x2="55" y2="-12" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.5" className="animate-[code_2.5s_infinite]" />
                    <line x1="20" y1="-4" x2="40" y2="-4" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.5" className="animate-[code_1.5s_infinite]" />
                </g>

                {/* Robot Body Group */}
                <g className="animate-[float_4s_ease-in-out_infinite]">
                    {/* Body/Torso */}
                    <rect x="55" y="55" width="50" height="40" rx="10" fill="url(#robotGrad)" stroke="#06b6d4" strokeWidth="2" />

                    {/* Head */}
                    <g transform="translate(60, 20)">
                        <rect width="40" height="30" rx="8" fill="url(#robotGrad)" stroke="#06b6d4" strokeWidth="2" />
                        {/* Eyes */}
                        <rect x="8" y="10" width="6" height="8" rx="3" fill="#06b6d4" className="animate-[blink_4s_infinite]" />
                        <rect x="26" y="10" width="6" height="8" rx="3" fill="#06b6d4" className="animate-[blink_4s_infinite]" />
                        {/* Mouth */}
                        <rect x="15" y="22" width="10" height="1.5" rx="1" fill="#06b6d4" opacity="0.5" />
                    </g>

                    {/* Arms and Hands typing */}
                    {/* Left Arm */}
                    <path d="M55,70 Q40,70 45,95" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="45" cy="95" r="4" fill="#06b6d4" className="animate-[typingLeft_0.4s_infinite]" />

                    {/* Right Arm */}
                    <path d="M105,70 Q120,70 115,95" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="115" cy="95" r="4" fill="#06b6d4" className="animate-[typingRight_0.45s_infinite]" />

                    {/* Neck */}
                    <rect x="72" y="50" width="16" height="5" fill="#06b6d4" opacity="0.3" />
                </g>
            </svg>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes blink {
          0%, 45%, 55%, 100% { height: 8px; transform: translateY(0); }
          50% { height: 1px; transform: translateY(3.5px); }
        }
        @keyframes typingLeft {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-4px) translateX(-2px); }
        }
        @keyframes typingRight {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-5px) translateX(2px); }
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

export default ThinkingRobot;
