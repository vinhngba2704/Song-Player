'use client';

import { Music, Radio } from 'lucide-react';

interface SongHeaderProps {
  songTitle?: string;
  isPlaying?: boolean;
}

export default function SongHeader({ songTitle, isPlaying }: SongHeaderProps) {
  return (
    /* Container: Giữ màu nền tối sâu để làm nổi bật chữ trắng */
    <div className="flex-none bg-[#020617] rounded-2xl p-3 flex items-center gap-4 border border-white/5 shadow-2xl relative overflow-hidden group">
      
      {/* 1. LAYER VÂN SÓNG (Background Waves) */}
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
        <svg 
          viewBox="0 0 1000 1000" 
          className={`w-full h-full object-cover transition-transform duration-[3000ms] ${isPlaying ? 'scale-125' : 'scale-100'}`}
        >
          <path 
            className={`${isPlaying ? 'animate-wave-slow' : ''}`}
            fill="url(#waveGradientMini)" 
            d="M0,1000 C300,800 400,950 700,700 C900,500 1000,600 1000,400 L1000,1000 L0,1000 Z" 
          />
          <defs>
            <linearGradient id="waveGradientMini" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 2. ARTWORK: Thu nhỏ và bo góc */}
      <div className="relative z-10 flex-shrink-0">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center shadow-lg transition-all duration-500 ${isPlaying ? 'rotate-[-6deg] scale-105 shadow-blue-500/20' : ''}`}>
          <Music className="text-white w-5 h-5" />
          
          {/* Status Dot */}
          {isPlaying && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-[#020617] animate-pulse" />
          )}
        </div>
      </div>

      {/* 3. CONTENT: Tên bài hát màu trắng sáng */}
      <div className="relative z-10 overflow-hidden flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          {/* SỬA: text-white và drop-shadow giúp chữ cực kỳ nổi bật */}
          <h2 className="text-sm lg:text-base font-extrabold tracking-tight truncate text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]">
            {songTitle || 'Select Track'}
          </h2>
          
          {isPlaying && (
            <div className="flex gap-0.5 items-end h-3">
              <div className="w-0.5 bg-blue-400 animate-[music-bar_0.8s_ease-in-out_infinite]" />
              <div className="w-0.5 bg-blue-400 animate-[music-bar_1.2s_ease-in-out_infinite]" />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-[8px] font-black tracking-[0.2em] ${isPlaying ? 'text-blue-400' : 'text-zinc-500'}`}>
            <Radio className="w-2.5 h-2.5" />
            {isPlaying ? 'ON AIR' : 'STANDBY'}
          </div>
          <span className="w-0.5 h-0.5 bg-zinc-700 rounded-full" />
          <p className="text-zinc-500 text-[8px] font-bold uppercase tracking-widest">Lossless</p>
        </div>
      </div>

      {/* Gradient phủ nhẹ bên phải để tránh text đè sát mép */}
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#020617] to-transparent pointer-events-none" />

      <style jsx>{`
        @keyframes waveMove {
          0% { transform: translateX(0); }
          50% { transform: translateX(-30px); }
          100% { transform: translateX(0); }
        }
        .animate-wave-slow {
          animation: waveMove 10s ease-in-out infinite;
        }
        @keyframes music-bar {
          0%, 100% { height: 3px; }
          50% { height: 10px; }
        }
      `}</style>
    </div>
  );
}