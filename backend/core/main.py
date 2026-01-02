from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
from dotenv import load_dotenv
load_dotenv()

import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from core.utils import normalize_song_name, parse_lrc
except ImportError:
    from utils import normalize_song_name, parse_lrc

app = FastAPI(title="Music Player API", version="1.0.0")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

# 1. Cấu hình CORS: Cho phép Frontend (Next.js) truy cập API này
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Định nghĩa đường dẫn thư mục (Dựa trên cấu trúc file bạn đã gửi)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # Lên 1 cấp
SOUNDS_DIR = os.path.join(BASE_DIR, "sounds")
LYRICS_DIR = os.path.join(BASE_DIR, "lyrics")

# 3. Mount các file tĩnh để trình duyệt có thể phát nhạc trực tiếp
app.mount("/static/sounds", StaticFiles(directory=SOUNDS_DIR), name="sounds")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Music Player API is running", "version": "1.0.0"}

@app.get("/api/songs")
async def get_songs():
    """Lấy danh sách tất cả bài hát hiện có"""
    songs = []
    if not os.path.exists(SOUNDS_DIR):
        return []
    
    backend_url = f"http://{os.getenv('BACKEND_HOST', '127.0.0.1')}:{os.getenv('BACKEND_PORT', '8000')}"
        
    for filename in os.listdir(SOUNDS_DIR):
        if filename.endswith(".mp3"):
            # Lấy tên bài hát (loại bỏ đuôi .mp3)
            song_id = filename.replace(".mp3", "")
            # Kiểm tra xem có file lyrics không
            lrc_path = os.path.join(LYRICS_DIR, f"{song_id}.lrc")
            has_lyrics = os.path.exists(lrc_path)
            
            songs.append({
                "id": song_id,
                "title": song_id.replace("_", " "),  # Chuyển underscore thành khoảng trắng
                "audioUrl": f"{backend_url}/static/sounds/{filename}",
                "hasLyrics": has_lyrics
            })
    
    return {"songs": songs, "total": len(songs)}

@app.get("/api/lyrics/{song_id}")
async def get_lyrics(song_id: str):
    """Lấy lời bài hát đã được parse sang JSON"""
    lrc_filename = f"{song_id}.lrc"
    lrc_path = os.path.join(LYRICS_DIR, lrc_filename)
    
    if not os.path.exists(lrc_path):
        raise HTTPException(status_code=404, detail="Không tìm thấy file lời bài hát")
    
    # Sử dụng hàm parse_lrc
    lyrics_data = parse_lrc(lrc_path)
    return {"songId": song_id, "lyrics": lyrics_data}

@app.get("/api/audio/{song_id}")
async def get_audio(song_id: str):
    """Trả về file audio để stream"""
    audio_path = os.path.join(SOUNDS_DIR, f"{song_id}.mp3")
    
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Không tìm thấy file nhạc")
    
    return FileResponse(audio_path, media_type="audio/mpeg")

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("BACKEND_HOST", "127.0.0.1")
    port = int(os.getenv("BACKEND_PORT", "8000"))
    uvicorn.run(app, host=host, port=port)