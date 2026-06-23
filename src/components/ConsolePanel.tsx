import React, { useEffect, useRef, useState } from 'react';
import { ConsoleLog, AIPersonality } from '../types';
import { audioEngine } from './AudioEngine';
import { Terminal, Cpu, Clock, Star } from 'lucide-react';

interface ConsolePanelProps {
  logs: ConsoleLog[];
  personality: AIPersonality;
  isAiThinking: boolean;
  modelName: string;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({
  logs,
  personality,
  isAiThinking,
  modelName
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [typedSpeech, setTypedSpeech] = useState('');
  const [fullSpeechToType, setFullSpeechToType] = useState('');
  const [speechIndex, setSpeechIndex] = useState(0);

  // Scroll to bottom on new logs
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, isAiThinking]);

  // Find the last AI message
  const aiLogs = logs.filter(l => l.type === 'ai');
  const lastAiLog = aiLogs.length > 0 ? aiLogs[aiLogs.length - 1] : null;

  // Typewriter effect for the latest AI message
  useEffect(() => {
    if (lastAiLog) {
      setFullSpeechToType(lastAiLog.text);
      setTypedSpeech('');
      setSpeechIndex(0);
    }
  }, [lastAiLog]);

  useEffect(() => {
    if (speechIndex < fullSpeechToType.length) {
      const char = fullSpeechToType[speechIndex];
      const delay = char === ',' ? 180 : char === '.' || char === '!' || char === '?' ? 350 : 25;
      
      const timer = setTimeout(() => {
        setTypedSpeech(prev => prev + char);
        setSpeechIndex(prev => prev + 1);
        
        // Play retro blip sound occasionally for dialogue feel
        if (speechIndex % 2 === 0) {
          audioEngine.playTextScroll();
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [speechIndex, fullSpeechToType]);

  // Mock server diagnostics for arcade flair
  const [cpuTemp, setCpuTemp] = useState(48);
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuTemp(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.min(Math.max(prev + delta, 45), 79);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-4 border-[#1a1a1a] shadow-[0_0_20px_rgba(51,255,51,0.15)] relative overflow-hidden text-[#33ff33] font-mono text-xs select-none">
      {/* CRT Scanline Overlay effects */}
      <div className="absolute inset-0 pointer-events-none bg-crt-scanlines opacity-15 z-10" />
      <div className="absolute inset-0 pointer-events-none bg-radial-vignette z-10" />
      
      {/* Header bar */}
      <div className="bg-[#111] border-b-2 border-[#1a1a1a] px-3 py-2 flex items-center justify-between text-[10px] uppercase font-bold text-[#33ff33] shrink-0">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5" />
          <span>gemma-vlink.log</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-[#ff3333]" />
            <span className="text-[#666]">TEMP:</span>
            <span className="text-[#33ff33]">{cpuTemp}°C</span>
          </span>
          <span className="hidden sm:inline bg-[#001a00] text-[#33ff33] border border-[#33ff33]/30 px-1 py-0.5 rounded-none text-[8px] tracking-widest">
            ONLINE
          </span>
        </div>
      </div>

      {/* Main logs screen */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-retro relative h-[180px] md:h-auto bg-black"
      >
        {logs.length === 0 ? (
          <div className="text-[#666] text-center py-6 block tracking-widest text-[10px]">
            [ INITIALIZING COMM LINK... ]
            <br />
            [ WAITING FOR FIRST MOVE ]
          </div>
        ) : (
          logs.map((log) => {
            let prefix = 'SYS';
            let colorClass = 'text-[#666]';

            if (log.type === 'player') {
              prefix = 'YOU';
              colorClass = 'text-white font-bold';
            } else if (log.type === 'ai') {
              prefix = 'GEM';
              colorClass = 'text-[#33ff33] font-bold';
            } else if (log.type === 'glitch') {
              prefix = 'ERR';
              colorClass = 'text-[#ff3333] animate-pulse';
            }

            return (
              <div key={log.id} className="leading-relaxed">
                <span className="text-[9px] text-[#666] mr-1 font-bold">[{log.timestamp}]</span>
                <span className={`font-semibold text-[10px] mr-1.5 uppercase ${colorClass}`}>{prefix}:</span>
                {log.type === 'ai' && log.id === lastAiLog?.id ? (
                  // Latest AI message animates!
                  <span className="text-[#33ff33] font-bold">
                    {typedSpeech}
                    {speechIndex < fullSpeechToType.length && (
                      <span className="inline-block w-1.5 h-3 bg-[#33ff33] animate-pulse ml-0.5" />
                    )}
                  </span>
                ) : (
                  <span className={log.type === 'ai' ? 'text-[#33ff33] font-medium' : 'text-zinc-300'}>
                    {log.text}
                  </span>
                )}
              </div>
            );
          })
        )}

        {isAiThinking && (
          <div className="flex flex-col gap-1 py-1 text-[#33ff33]/90 leading-normal animate-pulse">
            <div>
              <span className="text-[9px] text-[#666] mr-1">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
              <span className="font-bold uppercase text-[10px] mr-1.5 text-cyan-400">SYS:</span>
              <span>GEMMA IS COMPUTING PLY MOVES via LM STUDIO...</span>
            </div>
            <div className="flex gap-0.5 text-[#33ff33] font-extrabold text-[10px] pl-10">
              ⚡ CONFIG: {modelName || 'Local-Gemma'} @ temp={0.7}
            </div>
            <div className="w-full bg-[#0d0d0d] h-2 border border-[#1a1a1a] p-0.5 mt-1 overflow-hidden shrink-0">
              <div 
                className="bg-[#33ff33] h-full animate-retro-progress" 
                style={{ width: '100%', imageRendering: 'pixelated' }} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Personality portrait footer (Textbox classic console) */}
      <div className="border-t-4 border-[#1a1a1a] bg-[#0d0d0d] p-3 flex gap-3 shrink-0 items-center">
        {/* Profile Avatar pixel framing */}
        <div className="w-12 h-12 bg-black border-2 border-[#1a1a1a] flex items-center justify-center text-2xl relative shrink-0">
          <div className="absolute top-0 right-0 bg-[#ff3333] w-1.5 h-1.5 animate-pulse" />
          <span>{personality.avatar}</span>
        </div>
        
        {/* Mini Speech dialog */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[9px] uppercase tracking-wider font-extrabold text-[#666] leading-none mb-1">
            <span className="flex items-center gap-1 text-[#33ff33]">
              <Star className="w-2.5 h-2.5 text-[#33ff33] fill-current" />
              {personality.name}
            </span>
            <span className="text-[8px] text-[#666]">[{personality.title}]</span>
          </div>
          <p className="text-[10px] text-zinc-100 font-bold line-clamp-2 leading-tight">
            {isAiThinking ? (
              <span className="italic animate-pulse text-[#33ff33]/80">"Calculating paths... analyzing pawn structures... wait, is that a free rook?"</span>
            ) : typedSpeech ? (
              <span className="text-white">"{typedSpeech.slice(0, 80)}{typedSpeech.length > 80 ? '...' : ''}"</span>
            ) : (
              <span className="text-zinc-400">"{personality.greeting}"</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
