'use client';

import { Mic2, PlayCircle, ListMusic } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  audioUrl: string;
  hasLyrics: boolean;
}

interface PlaylistPanelProps {
  songs: Song[];
  currentSongIndex: number;
  onSongSelect: (index: number) => void;
}

export default function PlaylistPanel({ songs, currentSongIndex, onSongSelect }: PlaylistPanelProps) {
  return (
    <div className="h-full w-full bg-[#020617] rounded-[32px] border border-white/10 flex flex-col relative overflow-hidden shadow-2xl">
      {/* GIẢI THÍCH:
        - rounded-[32px] & border: Đặt chung trên 1 div để góc bo và viền khớp tuyệt đối.
        - overflow-hidden: Cắt bỏ các phần nội dung (như SVG sợi chỉ) thò ra ngoài góc bo.
        - relative: Để làm gốc tọa độ cho các sợi chỉ absolute bên dưới.
      */}

      {/* 1. HIỆU ỨNG DẢI SỢI CHỈ (Silk threads) */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="threadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
              <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[...Array(5)].map((_, i) => (
            <path
              key={i}
              className="animate-silk-thread"
              stroke="url(#threadGradient)"
              strokeWidth="1.5"
              fill="none"
              d={`M-100,${150 + i * 200} Q250,${50 + i * 100} 500,${500} T1100,${850 - i * 150}`}
              style={{ animationDelay: `${i * -2.5}s` }}
            />
          ))}
        </svg>
      </div>

      {/* 2. HEADER - relative z-10 để nằm trên lớp sợi chỉ */}
      <div className="flex-none flex items-center justify-between p-6 pb-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl ring-1 ring-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <ListMusic className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white text-base font-black tracking-tight uppercase">Library</h3>
            <p className="text-[10px] text-blue-400/50 font-bold tracking-[0.2em]">PLAYLIST</p>
          </div>
        </div>
      </div>

      {/* 3. DANH SÁCH BÀI HÁT */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar relative z-10 px-5 mt-4">
        <div className="space-y-2 pb-8">
          {songs.map((song, index) => {
            const isActive = index === currentSongIndex;
            return (
              <button
                key={song.id}
                onClick={() => onSongSelect(index)}
                /* ring-inset giúp viền của item active vẽ vào bên trong, 
                   không bao giờ chạm vào viền của khung PlaylistPanel ngoài cùng 
                */
                className={`w-full text-left px-5 py-4 rounded-2xl transition-all duration-300 group relative outline-none ${
                  isActive
                    ? 'bg-blue-500/10 ring-1 ring-inset ring-blue-400/30 shadow-lg z-20' 
                    : 'hover:bg-white/5 text-slate-400 hover:text-white z-10'
                }`}
              >
                <div className="flex items-center gap-5 relative z-30">
                  {/* Số thứ tự hoặc Music Bar */}
                  <div className="w-10 flex justify-center items-center">
                    {isActive ? (
                      <div className="flex gap-1 items-end h-4">
                        <div className="w-1 bg-blue-400 animate-[music-bar_0.8s_ease-in-out_infinite]" />
                        <div className="w-1 bg-blue-400 animate-[music-bar_1.2s_ease-in-out_infinite]" />
                        <div className="w-1 bg-blue-400 animate-[music-bar_1.0s_ease-in-out_infinite]" />
                      </div>
                    ) : (
                      <span className="text-xl font-black font-mono text-slate-600 group-hover:opacity-0 transition-opacity">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    )}
                    {!isActive && (
                      <PlayCircle className="absolute w-7 h-7 text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100" />
                    )}
                  </div>

                  {/* Thông tin bài hát */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-base font-bold truncate transition-colors ${
                      isActive ? 'text-white' : 'text-slate-300'
                    }`}>
                      {song.title}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-400' : 'text-slate-600'}`}>
                        ARTIST
                      </span>
                      {song.hasLyrics && (
                        <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md ring-1 ring-inset ${
                          isActive ? 'bg-blue-500/20 ring-blue-500/30 text-blue-300' : 'bg-white/5 ring-white/10 text-slate-600'
                        }`}>
                          <Mic2 className="w-2.5 h-2.5" /> LYRICS
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dấu chấm trạng thái đang phát */}
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa] animate-pulse" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes music-bar {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        @keyframes silk-thread {
          0% { stroke-dashoffset: 2000; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-silk-thread {
          stroke-dasharray: 400 600;
          animation: silk-thread 30s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}