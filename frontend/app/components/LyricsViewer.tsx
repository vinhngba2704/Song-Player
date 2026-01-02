'use client';

import { useEffect, useRef } from 'react';

interface Lyric { time: number; text: string; }

interface LyricsViewerProps {
  lyrics: Lyric[];
  currentLyricIndex: number;
  currentSongTitle?: string;
  progress: number;
}

export default function LyricsViewer({ lyrics, currentLyricIndex, currentSongTitle, progress }: LyricsViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentItem = containerRef.current?.children[currentLyricIndex] as HTMLElement;
    if (currentItem) {
      currentItem.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLyricIndex]);

  return (
    /* KHUNG DUY NHẤT: Đồng bộ 32px và border với Playlist Panel */
    <div className="h-full w-full bg-[#020617] rounded-[32px] border border-white/10 flex flex-col relative overflow-hidden group shadow-2xl">
      
      {/* 1. HIỆU ỨNG DẢI SỢI CHỈ (Silk threads) */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none transform scale-125">
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="lyricThreadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[...Array(6)].map((_, i) => (
            <path
              key={i}
              className="animate-silk-thread"
              stroke="url(#lyricThreadGradient)"
              strokeWidth="1"
              fill="none"
              d={`M-100,${200 + i * 150} Q300,${100 + i * 50} 500,${500} T1100,${800 - i * 100}`}
              style={{ animationDelay: `${i * -3}s`, animationDuration: '40s' }}
            />
          ))}
        </svg>
      </div>

      {/* 2. CONTENT LYRICS */}
      <div className="flex-1 relative z-10 overflow-hidden"> 
        <div 
          ref={containerRef}
          className="h-full w-full overflow-y-auto scrollbar-hide flex flex-col items-start px-8 sm:px-20 py-[50%] transition-all duration-500"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
          }}
        >
          {lyrics.length > 0 ? (
            lyrics.map((lyric, index) => {
              const isCurrent = index === currentLyricIndex;
              const distance = Math.abs(index - currentLyricIndex);
              
              return (
                <div key={index} className="w-full flex justify-start items-center py-4">
                  <div 
                    className={`
                      flex items-start gap-6 transition-all duration-[700ms] ease-[cubic-bezier(0.2, 1, 0.2, 1)] transform-gpu
                      ${isCurrent ? 'scale-[1.05] translate-x-2' : 'scale-100 translate-x-0'}
                    `}
                    style={{
                      opacity: isCurrent ? 1 : Math.max(0.1, 0.4 - distance * 0.1),
                      filter: !isCurrent ? `blur(${Math.min(distance * 0.8, 2)}px)` : 'none',
                      willChange: 'transform, opacity, filter'
                    }}
                  >
                    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-2">
                      {isCurrent && (
                        <div className="relative">
                           <span className="text-blue-400 text-xl drop-shadow-[0_0_10px_#3b82f6]">♫</span>
                        </div>
                      )}
                    </div>
                    
                    <span 
                      className={`
                        leading-tight tracking-tight select-none transition-colors duration-500
                        text-xl sm:text-[32px] font-bold
                        ${isCurrent ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'text-slate-500'}
                      `}
                    >
                      {lyric.text}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="w-full text-center opacity-30 text-lg italic">
              Đang tải lời bài hát...
            </div>
          )}
        </div>
        
        {/* Lớp phủ mờ Vignette (Gradient mờ trên/dưới) */}
        {/* <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#020617] to-transparent z-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#020617] to-transparent z-20 pointer-events-none" /> */}
      </div>

      <style jsx>{`
        @keyframes silk-thread {
          0% { stroke-dashoffset: 2000; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-silk-thread {
          stroke-dasharray: 500 1500;
          animation: silk-thread 40s linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}