'use client';

import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ChevronUp, 
  ChevronDown,
  Timer
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

interface PlayerControlsProps {
  isPlaying: boolean;
  currentSongIndex: number;
  totalSongs: number;
  offset: number;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onOffsetUp: () => void;
  onOffsetDown: () => void;
  onSeek: (time: number) => void;
}

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function PlayerControls({
  isPlaying,
  currentSongIndex,
  totalSongs,
  offset,
  currentTime,
  duration,
  onPlayPause,
  onPrevious,
  onNext,
  onOffsetUp,
  onOffsetDown,
  onSeek
}: PlayerControlsProps) {
  // States cho việc xử lý thanh Progress
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0); 
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Tính toán % tiến trình hiển thị (Ưu tiên giá trị đang drag để mượt mà)
  const visualProgress = useMemo(() => {
    if (isDragging) return dragProgress * 100;
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  }, [isDragging, dragProgress, currentTime, duration]);

  // Hàm tính toán % từ vị trí chuột
  const getProgressFromEvent = useCallback((clientX: number) => {
    if (!progressBarRef.current) return 0;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return x / rect.width;
  }, []);

  // Xử lý khi nhấn chuột xuống
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const progress = getProgressFromEvent(e.clientX);
    setDragProgress(progress);
  };

  // Effect xử lý sự kiện chuột toàn cầu (Global Mouse Events)
  // Giúp người dùng có thể kéo ra ngoài thanh bar mà vẫn điều khiển được
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const progress = getProgressFromEvent(e.clientX);
      setDragProgress(progress);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        const progress = getProgressFromEvent(e.clientX);
        onSeek(progress * duration);
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration, onSeek, getProgressFromEvent]);

  // Thêm phím tắt cơ bản (Space để Play/Pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        onPlayPause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayPause]);

  return (
    <div className="w-full bg-[#121212] rounded-2xl p-4 shadow-2xl border border-white/5 select-none">
      <div className="flex flex-col gap-4">
        
        {/* TOP: PHẦN ĐIỀU KHIỂN CHÍNH */}
        <div className="flex items-center justify-center space-x-6 lg:space-x-8">
          <button
            onClick={onPrevious}
            disabled={currentSongIndex === 0}
            className={`transition-all ${currentSongIndex === 0 ? 'text-zinc-800' : 'text-[#b3b3b3] hover:text-white active:scale-90'}`}
          >
            <SkipBack className="w-7 h-7 lg:w-8 lg:h-8 fill-current" />
          </button>
          
          <button
            onClick={onPlayPause}
            className="w-12 h-12 lg:w-14 lg:h-14 bg-white rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 lg:w-7 lg:h-7 text-black fill-current" />
            ) : (
              <Play className="w-6 h-6 lg:w-7 lg:h-7 text-black fill-current ml-1" />
            )}
          </button>
          
          <button
            onClick={onNext}
            disabled={currentSongIndex === totalSongs - 1}
            className={`transition-all ${currentSongIndex === totalSongs - 1 ? 'text-zinc-800' : 'text-[#b3b3b3] hover:text-white active:scale-90'}`}
          >
            <SkipForward className="w-7 h-7 lg:w-8 lg:h-8 fill-current" />
          </button>
        </div>

        {/* MIDDLE: THANH PROGRESS & THỜI GIAN */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 text-[11px] font-mono min-w-[40px] text-right">
              {formatTime(isDragging ? dragProgress * duration : currentTime)}
            </span>
            
            <div className="flex-1 relative h-6 flex items-center group">
              {/* Tooltip thời gian khi Hover (Chỉ hiện khi không đang drag) */}
              {hoverTime !== null && !isDragging && (
                <div 
                  className="absolute -top-7 bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xl pointer-events-none -translate-x-1/2 z-20"
                  style={{ left: `${(hoverTime / duration) * 100}%` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}
              
              {/* Progress Track */}
              <div 
                ref={progressBarRef}
                className="w-full h-1 bg-zinc-800 rounded-full cursor-pointer relative transition-all"
                onMouseDown={handleMouseDown}
                onMouseMove={(e) => {
                  const time = getProgressFromEvent(e.clientX) * duration;
                  setHoverTime(time);
                }}
                onMouseLeave={() => setHoverTime(null)}
              >
                {/* Đệm vùng click cho dễ trúng */}
                <div className="absolute -inset-y-3 w-full" />

                {/* Progress Fill */}
                <div 
                  className={`h-full rounded-full relative transition-colors ${isDragging ? 'bg-[#1db954]' : 'bg-white group-hover:bg-[#1db954]'}`} 
                  style={{ width: `${visualProgress}%` }}
                >
                  {/* Handle (Nút tròn) */}
                  <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md transition-all ${
                    isDragging ? 'scale-125 opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`} />
                </div>
              </div>
            </div>
            
            <span className="text-zinc-400 text-[11px] font-mono min-w-[40px]">
              {formatTime(duration)}
            </span>
          </div>

          {/* BOTTOM: INFO & OFFSET */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center space-x-2">
              <div className="bg-[#1e1e1e] px-2.5 py-1 rounded-md flex items-center gap-2 border border-white/5">
                <Timer className="w-3 h-3 text-zinc-500" />
                <span className="text-zinc-400 font-medium text-[11px]">
                  {offset > 0 ? `+${offset.toFixed(1)}` : offset.toFixed(1)}s
                </span>
              </div>
              
              <div className="flex flex-col">
                <button onClick={onOffsetUp} className="p-0.5 hover:text-white text-zinc-500 transition">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={onOffsetDown} className="p-0.5 hover:text-white text-zinc-500 transition">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-white/5 px-3 py-1 rounded-full">
              <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-[0.2em] mr-2">Track</span>
              <span className="text-zinc-300 font-mono text-xs">
                {currentSongIndex + 1}<span className="text-zinc-600 mx-1">/</span>{totalSongs}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}