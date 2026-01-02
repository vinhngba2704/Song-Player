'use client';

import { useState, useEffect, useRef } from 'react';
import SearchBar from './components/SearchBar';
import LyricsViewer from './components/LyricsViewer';
import PlaylistPanel from './components/PlaylistPanel';
import PlayerControls from './components/PlayerControls';
import SongHeader from './components/SongHeader';
import { API_URL } from './lib/config';

interface Song {
  id: string;
  title: string;
  audioUrl: string;
  hasLyrics: boolean;
}

interface Lyric {
  time: number;
  text: string;
}

export default function MusicPlayer() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(0);
  const [lyricProgress, setLyricProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const requestRef = useRef<number>(null);

  // 1. Fetch danh sách bài hát
  useEffect(() => {
    fetch(`${API_URL}/api/songs`)
      .then(res => res.json())
      .then(data => setSongs(data.songs || []))
      .catch(err => console.error('Error fetching songs:', err));
  }, []);

  // 2. Load lyrics khi đổi bài
  useEffect(() => {
    if (songs.length > 0 && songs[currentSongIndex]) {
      const songId = songs[currentSongIndex].id;
      fetch(`${API_URL}/api/lyrics/${songId}`)
        .then(res => res.json())
        .then(data => {
          setLyrics(data.lyrics || []);
          setCurrentLyricIndex(0);
          setLyricProgress(0);
        })
        .catch(() => setLyrics([]));
    }
  }, [currentSongIndex, songs]);

  // 3. Logic đồng bộ hóa 60fps (Mượt như Spotify)
  useEffect(() => {
    const sync = () => {
      if (audioRef.current && isPlaying) {
        const time = audioRef.current.currentTime + offset;
        setCurrentTime(audioRef.current.currentTime);

        // Tìm lyric hiện tại
        let foundIndex = 0;
        for (let i = 0; i < lyrics.length; i++) {
          if (lyrics[i].time <= time) foundIndex = i;
          else break;
        }
        setCurrentLyricIndex(foundIndex);

        // Tính progress mượt mà giữa 2 dòng
        if (lyrics[foundIndex] && lyrics[foundIndex + 1]) {
          const start = lyrics[foundIndex].time;
          const end = lyrics[foundIndex + 1].time;
          const progress = Math.max(0, Math.min((time - start) / (end - start), 1));
          setLyricProgress(progress);
        } else {
          setLyricProgress(0);
        }
      }
      requestRef.current = requestAnimationFrame(sync);
    };

    if (isPlaying) requestRef.current = requestAnimationFrame(sync);
    else if (requestRef.current) cancelAnimationFrame(requestRef.current);

    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isPlaying, lyrics, offset]);

  // Cập nhật duration khi audio load
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [currentSongIndex]);

  // Điều khiển
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleSongSelect = (index: number) => {
    setCurrentSongIndex(index);
    setCurrentLyricIndex(0);
    setLyricProgress(0);
    setCurrentTime(0);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }, 150);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const currentSong = songs[currentSongIndex];
  const filteredSongs = songs.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    /* THAY ĐỔI: bg-[#121212] (Đen Spotify) và thêm gradient mờ ảo ở góc */
    <div className="h-screen w-full bg-[#121212] text-white flex flex-col overflow-hidden relative">
      
      {/* Background Decor: Tạo các đốm màu mờ ảo phía sau để nhìn chuyên nghiệp hơn */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* 1. Header: Trong suốt và gọn gàng hơn */}
      <header className="relative z-10 flex-none py-6 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
            <span className="text-black text-xl font-bold">T</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter">
            Tunify<span className="text-blue-500">.</span>
          </h1>
        </div>

        {currentSong && (
          <div className="hidden md:block">
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl px-4 py-2 rounded-full flex items-center gap-3">
              <div className="flex items-end gap-1 h-3">
                <div className={`w-1 bg-blue-500 rounded-full ${isPlaying ? 'animate-[music-bar_0.8s_ease-in-out_infinite_100ms]' : 'h-1'}`} />
                <div className={`w-1 bg-blue-400 rounded-full ${isPlaying ? 'animate-[music-bar_0.8s_ease-in-out_infinite_300ms]' : 'h-2'}`} />
                <div className={`w-1 bg-blue-600 rounded-full ${isPlaying ? 'animate-[music-bar_0.8s_ease-in-out_infinite_500ms]' : 'h-1.5'}`} />
              </div>
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
                {isPlaying ? 'Now Playing' : 'Paused'}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* 2. Search Bar Section */}
      <div className="relative z-10 flex-none px-8 pb-6">
        <div className="max-w-4xl mx-auto">
          <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        </div>
      </div>

      {/* 3. Main Content: Grid Layout */}
      <main className="relative z-10 flex-1 min-h-0 px-8 pb-6">
        <div className="max-w-[1920px] mx-auto h-full grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Cột trái: Song Header + Lyrics - Chiếm 2/3 */}
          <div className="lg:col-span-3 h-full min-h-0 flex flex-col gap-4">
            {/* Song Header */}
            <SongHeader songTitle={currentSong?.title} isPlaying={isPlaying} />
            
            {/* Lyrics Viewer */}
            <div className="flex-1 min-h-0"> 
               <LyricsViewer 
                lyrics={lyrics} 
                currentLyricIndex={currentLyricIndex} 
                currentSongTitle={currentSong?.title}
                progress={lyricProgress} 
              />
            </div>
          </div>
          
          {/* Cột phải: Playlist - CHỈ GIỮ LẠI layout, bỏ khung viền */}
          <div className="h-full min-h-0"> {/* Xóa rounded-3xl, overflow-hidden, border ở đây */}
            <PlaylistPanel 
              songs={filteredSongs} 
              currentSongIndex={currentSongIndex} 
              onSongSelect={(i) => handleSongSelect(songs.findIndex(s => s.id === filteredSongs[i].id))} 
            />
          </div>
        </div>
      </main>

      {/* 4. Footer: Control Bar */}
      <footer className="relative z-10 flex-none bg-black/40 backdrop-blur-2xl border-t border-white/5 p-6">
        <div className="max-w-6xl mx-auto">
          <PlayerControls 
            isPlaying={isPlaying} 
            currentSongIndex={currentSongIndex} 
            totalSongs={songs.length} 
            offset={offset}
            currentTime={currentTime}
            duration={duration}
            onPlayPause={handlePlayPause} 
            onPrevious={() => handleSongSelect(currentSongIndex - 1)} 
            onNext={() => handleSongSelect(currentSongIndex + 1)}
            onOffsetUp={() => setOffset(o => o + 0.1)} 
            onOffsetDown={() => setOffset(o => o - 0.1)}
            onSeek={handleSeek}
          />
        </div>
      </footer>

      {currentSong && <audio ref={audioRef} key={currentSong.id} src={currentSong.audioUrl} onEnded={() => handleSongSelect(currentSongIndex + 1)} />}
      
      {/* CSS Animation cho cột nhạc (Thêm vào global.css hoặc dùng style tag) */}
      <style jsx global>{`
        @keyframes music-bar {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
      `}</style>
    </div>
  );
}