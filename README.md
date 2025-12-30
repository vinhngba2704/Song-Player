### 📂 File Structure:
```
Song_Player/
├── .git/
├── .gitignore
├── .python-version
├── .venv/
├── README.md
├── lyrics/
├── main.py
├── pyproject.toml
├── sounds/
├── test.ipynb
└── uv.lock
```

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