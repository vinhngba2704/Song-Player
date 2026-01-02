# 🎵 Tunify - Music Player Web Application

Ứng dụng phát nhạc web với giao diện hiện đại, hỗ trợ hiển thị lời bài hát đồng bộ với animation mượt mà (karaoke style).

## ✨ Tính năng

### 🎧 Phát nhạc
- Stream nhạc trực tiếp từ backend FastAPI
- Điều khiển phát/dừng, next/previous track
- Seek bar tương tác với preview thời gian khi hover
- Tự động chuyển bài khi kết thúc

### 🎤 Lyrics Đồng bộ
- Hiển thị lời bài hát theo thời gian thực (karaoke style)
- Animation mượt mà 60fps với progress bar cho từng dòng
- Điều chỉnh offset để đồng bộ chính xác
- Tự động scroll theo dòng đang phát

### 🎨 Giao diện
- Dark theme theo phong cách Spotify (#121212)
- Gradient background mờ ảo tạo chiều sâu
- Hiệu ứng glassmorphism (backdrop blur)
- Music bar animation khi đang phát
- Responsive design

### 🔍 Tính năng khác
- Tìm kiếm bài hát realtime
- Playlist management
- Environment variables configuration (.env)
- CORS configuration linh hoạt

## 🛠️ Tech Stack

### Backend
- **FastAPI** - High-performance web framework
- **Uvicorn** - ASGI server
- **python-dotenv** - Environment variables management
- **Python 3.12+**

### Frontend
- **Next.js 16** - React framework với App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first CSS
- **Lucide React** - Icon library

## 📂 Cấu trúc Project

```
Song_Player/
├── backend/
│   ├── core/
│   │   ├── main.py           # FastAPI server với CORS & static files
│   │   └── utils.py          # Parse LRC & normalize song names
│   ├── sounds/               # File nhạc .mp3
│   ├── lyrics/               # File lời bài hát .lrc
│   └── pyproject.toml        # Backend dependencies (uv)
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # Main music player component
│   │   ├── layout.tsx        # Root layout
│   │   ├── globals.css       # Global styles & animations
│   │   ├── components/
│   │   │   ├── LyricsViewer.tsx      # Lyrics display với animation
│   │   │   ├── PlayerControls.tsx    # Play/pause, seek, offset controls
│   │   │   ├── PlaylistPanel.tsx     # Song list với active state
│   │   │   ├── SearchBar.tsx         # Search input
│   │   │   └── SongHeader.tsx        # Current song display
│   │   └── lib/
│   │       └── config.ts     # API URL configuration
│   └── package.json
├── .env                      # Environment variables (gitignored)
├── .env.example              # Environment template
├── start_app.bat             # Windows launcher script
├── pyproject.toml            # Root project config (uv workspace)
└── README.md
```

## 🚀 Cài đặt và Chạy

### Yêu cầu
- **Python 3.12+**
- **Node.js 18+**
- **uv** (Python package manager)

### 1️⃣ Cài đặt uv (nếu chưa có)

**Windows:**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**Linux/macOS:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2️⃣ Cấu hình Environment Variables

Tạo file `.env` từ template:
```bash
cp .env.example .env
```

### 3️⃣ Cài đặt Dependencies

**Backend:**
```bash
cd Song_Player
uv sync
```

**Frontend:**
```bash
cd frontend
npm install
```

### 4️⃣ Chạy ứng dụng

#### Cách 1: Sử dụng launcher script (Khuyến nghị cho Windows)
```bash
start_app.bat
```

Script này sẽ tự động:
- Chạy backend server trên http://127.0.0.1:8000
- Chạy frontend server trên http://localhost:3000
- Mở 2 terminal riêng biệt

#### Cách 2: Chạy thủ công

**Terminal 1 - Backend:**
```bash
cd backend
uv run core/main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5️⃣ Truy cập ứng dụng

- **Music Player:** http://localhost:3000
- **Backend API:** http://127.0.0.1:8000
- **API Documentation:** http://127.0.0.1:8000/docs

## 📝 API Endpoints

### `GET /api/songs`
Lấy danh sách tất cả bài hát có trong thư mục `sounds/`

**Response:**
```json
{
  "songs": [
    {
      "id": "CauseILoveYou",
      "title": "Cause I Love You",
      "audioUrl": "http://127.0.0.1:8000/static/sounds/CauseILoveYou.mp3",
      "hasLyrics": true
    }
  ],
  "total": 1
}
```

### `GET /api/lyrics/{song_id}`
Lấy lời bài hát đã được parse thành JSON

**Response:**
```json
{
  "songId": "CauseILoveYou",
  "lyrics": [
    {
      "time": 0.0,
      "text": "First line of lyrics"
    },
    {
      "time": 5.5,
      "text": "Second line of lyrics"
    }
  ]
}
```

### `GET /api/audio/{song_id}`
Stream file audio trực tiếp

### `GET /static/sounds/{filename}`
Static file serving cho audio files

## 📌 Thêm bài hát mới

### Bước 1: Thêm file nhạc
Đặt file `.mp3` vào thư mục `backend/sounds/`
```
backend/sounds/TenBaiHat.mp3
```

### Bước 2: Thêm file lyrics
Đặt file `.lrc` vào thư mục `backend/lyrics/` với tên giống file nhạc
```
backend/lyrics/TenBaiHat.lrc
```

### Bước 3: Format file .lrc
File lyrics phải theo chuẩn LRC format:
```
[00:12.50]Dòng lời đầu tiên
[00:18.20]Dòng lời thứ hai
[00:24.80]Dòng lời thứ ba
```

Format: `[mm:ss.xx]Text`
- `mm`: Phút (2 chữ số)
- `ss`: Giây (2 chữ số)
- `xx`: Phần trăm giây (2 chữ số)

### Bước 4: Refresh
Reload trang web, bài hát mới sẽ tự động xuất hiện trong playlist

## 🎮 Hướng dẫn sử dụng

### Điều khiển cơ bản
1. **Tìm kiếm:** Gõ tên bài hát vào search bar
2. **Chọn bài:** Click vào bài hát trong playlist
3. **Phát/Dừng:** Click nút Play/Pause hoặc nhấn `Space`
4. **Previous/Next:** Click nút ⏮/⏭ hoặc nhấn `←/→`
5. **Seek:** Kéo thanh progress bar hoặc click vào vị trí mong muốn

### Điều khiển Lyrics
- **Offset Up ▲:** Tăng độ trễ (lyrics chạy nhanh hơn) - Increment +0.1s
- **Offset Down ▼:** Giảm độ trễ (lyrics chạy chậm hơn) - Decrement -0.1s
- **Current offset:** Hiển thị ngay trên control panel

### Tính năng nâng cao
- **Hover preview:** Di chuột lên seek bar để xem thời gian
- **Drag seek:** Kéo seek bar mượt mà với real-time update
- **Auto-scroll:** Lyrics tự động scroll theo dòng đang phát
- **Progress animation:** Mỗi dòng lyrics có progress bar riêng

## 📊 Performance

- **60 FPS** lyrics sync với `requestAnimationFrame`
- **Real-time seek** với debounce cho smooth experience
- **Optimized re-renders** với React hooks
- **Static file serving** cho audio streaming hiệu quả

---

## Legacy Python Version

### 📦 Requirements:
- uv: Go to the uv documentation to download or run the below command:
  - Window: ```powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"```
  - Linux: ```curl -LsSf https://astral.sh/uv/install.sh | sh```

### 🪜 Steps to run:
1. Clone the repository
2. Install uv
3. Go into the cloned directory
4. Create 2 folders **lyrics** (contains .lrc files) and **sounds** (contain .mp3 files)
4. Run ```uv sync``` to recreate the required enviroment
5. Run ```uv run runalone.py``` to start

### 📒 Note:
- Filename (without extension) of .lrc files and .mp3 files need to be the same (e.g. MatKetNoi.lrc & MatKetNoi.mp3)
- In case you want to modify the playlist, you need to modify the **runalone.py**

### 🎮 Controlling Instructions:
- ```Space``` button: Pause/Resume
- ```↑↓``` button: Adjust Offset (Speed of lyrics vs. sounds)
- ```←→``` button: Go to the prev/next song

---

## 📄 License

Made by **vinhngba2704** 🎵

---

**Enjoy your music! 🎧✨**
