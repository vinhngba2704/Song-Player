import sys
import re
import os
import pygame
from PyQt6.QtWidgets import QApplication, QWidget, QVBoxLayout, QLabel
from PyQt6.QtCore import QTimer, Qt, QRect
from PyQt6.QtGui import QPainter, QColor, QFont

class KaraokeApp(QWidget):
    def __init__(self, song_name):
        super().__init__()
        
        # Chuẩn hóa tên bài hát
        normalized_name = self.normalize_song_name(song_name)
        
        self.setWindowTitle(f"Song Player - Made by vinhngba2704 🤟 - ({song_name})")
        self.setFixedSize(1400, 600)
        self.setStyleSheet("background-color: #1a1a1a;")

        # Đường dẫn file
        self.mp3_path = f"sounds/{normalized_name}.mp3"
        self.lrc_path = f"lyrics/{normalized_name}.lrc"
        
        # Khởi tạo âm thanh
        pygame.mixer.init()
        if os.path.exists(self.mp3_path):
            pygame.mixer.music.load(self.mp3_path)
        else:
            print(f"Không tìm thấy file nhạc: {self.mp3_path}")
            sys.exit()

        # Biến điều khiển
        self.lyrics = self.parse_lrc(self.lrc_path)
        self.offset = 0.0
        self.current_line_idx = 0
        self.progress = 0.0
        self.is_paused = False
        
        # Biến cho hiệu ứng scroll
        self.scroll_offset = 0.0
        self.target_scroll = 0.0

        # Timer cập nhật (120 FPS)
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_logic)
        
        pygame.mixer.music.play()
        self.timer.start(8)

    def normalize_song_name(self, name):
        """Chuyển tên bài hát thành dạng PascalCase không dấu"""
        import unicodedata
        
        # Loại bỏ khoảng trắng thừa
        name = name.strip()
        
        # Loại bỏ dấu tiếng Việt
        name = unicodedata.normalize('NFD', name)
        name = ''.join(char for char in name if unicodedata.category(char) != 'Mn')
        
        # Tách thành các từ
        words = name.split()
        
        # Viết hoa chữ cái đầu mỗi từ, ghép lại không khoảng trắng
        normalized = ''.join(word.capitalize() for word in words)
        
        return normalized

    def parse_lrc(self, path):
        data = []
        if not os.path.exists(path): return [{"time": 0, "text": "Thiếu file .lrc"}]
        pattern = re.compile(r'\[(\d+):(\d+\.\d+)\](.*)')
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                match = pattern.match(line)
                if match:
                    t = int(match.group(1)) * 60 + float(match.group(2))
                    data.append({"time": t, "text": match.group(3).strip()})
        data.append({"time": 9999, "text": ""})
        return data

    def keyPressEvent(self, event):
        if event.key() == Qt.Key.Key_Up:
            self.offset += 0.1
        elif event.key() == Qt.Key.Key_Down:
            self.offset -= 0.1
        elif event.key() == Qt.Key.Key_Space:
            # Toggle pause/resume
            if self.is_paused:
                pygame.mixer.music.unpause()
                self.is_paused = False
                print("▶ Resumed")
            else:
                pygame.mixer.music.pause()
                self.is_paused = True
                print("⏸ Paused")
        else:
            return
        
        if event.key() in (Qt.Key.Key_Up, Qt.Key.Key_Down):
            print(f"Current Offset: {self.offset:.1f}s")

    def calculate_y_position(self, index):
        """Tính vị trí Y của dòng với khoảng cách động"""
        normal_spacing = 90
        current_spacing = 120
        
        y = 0
        for i in range(index):
            if i == self.current_line_idx - 1:
                # Dòng ngay trước dòng hiện tại
                y += current_spacing
            elif i == self.current_line_idx:
                # Dòng hiện tại
                y += current_spacing
            else:
                y += normal_spacing
        
        return y

    def update_logic(self):
        # Chỉ cập nhật logic khi không pause
        if not self.is_paused:
            curr_time = (pygame.mixer.music.get_pos() / 1000.0) + self.offset
            
            prev_idx = self.current_line_idx
            
            for i in range(len(self.lyrics) - 1):
                if self.lyrics[i]["time"] <= curr_time < self.lyrics[i+1]["time"]:
                    self.current_line_idx = i
                    duration = self.lyrics[i+1]["time"] - self.lyrics[i]["time"]
                    elapsed = curr_time - self.lyrics[i]["time"]
                    self.progress = min(elapsed / duration, 1.0)
                    break
            
            # Khi chuyển dòng, cập nhật target scroll
            if prev_idx != self.current_line_idx:
                self.target_scroll = self.calculate_y_position(self.current_line_idx)
            
            # Smooth scroll
            self.scroll_offset += (self.target_scroll - self.scroll_offset) * 0.1
        
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        # Vẽ thông tin trạng thái
        painter.setPen(QColor("gray"))
        painter.setFont(QFont("Arial", 10))
        status = "⏸ PAUSED" if self.is_paused else "▶ PLAYING"
        painter.drawText(20, 30, f"Offset: {self.offset:.1f}s | {status} (Space: Pause/Resume | ↑↓: Adjust)")

        center_y = self.height() // 2
        
        for i, lyric in enumerate(self.lyrics[:-1]):
            y_pos = center_y + self.calculate_y_position(i) - self.scroll_offset
            
            if y_pos < -100 or y_pos > self.height() + 100:
                continue
            
            text = lyric["text"]
            if not text: continue
            
            is_current = (i == self.current_line_idx)
            
            if is_current:
                # Cấu hình Font cho dòng hiện tại
                font = QFont("Segoe UI", 40, QFont.Weight.Bold)
                painter.setFont(font)
                
                metrics = painter.fontMetrics()
                tw = metrics.horizontalAdvance(text)
                th = metrics.height()
                
                start_x = (self.width() - tw) / 2
                text_rect = QRect(0, int(y_pos - th//2), self.width(), th)
                
                # 1. Vẽ chữ nền (Xám)
                painter.setPen(QColor(80, 80, 80))
                painter.drawText(text_rect, Qt.AlignmentFlag.AlignCenter, text)
                
                # 2. Vẽ phần chữ vàng (Progress)
                painter.save()
                clip_width = int(tw * self.progress)
                clip_rect = QRect(int(start_x), int(y_pos - th//2), clip_width, th)
                
                painter.setClipRect(clip_rect)
                painter.setPen(QColor("#FFD700"))
                painter.drawText(text_rect, Qt.AlignmentFlag.AlignCenter, text)
                painter.restore()
                
                # 3. Vẽ biểu tượng âm nhạc hai bên
                icon_font = QFont("Segoe UI Emoji", 30)  # Font hỗ trợ emoji
                painter.setFont(icon_font)
                painter.setPen(QColor("#FFD700"))
                
                # Icon bên trái
                left_icon_x = int(start_x - 50)
                painter.drawText(left_icon_x, int(y_pos - 20), "♫")
                
            else:
                # Các dòng khác
                font = QFont("Segoe UI", 25)
                painter.setFont(font)
                metrics = painter.fontMetrics()
                th = metrics.height()
                
                distance = abs(i - self.current_line_idx)
                opacity = max(50, 200 - distance * 30)
                painter.setPen(QColor(opacity, opacity, opacity))
                
                text_rect = QRect(0, int(y_pos - th//2), self.width(), th)
                painter.drawText(text_rect, Qt.AlignmentFlag.AlignCenter, text)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    song_name = "Mất kết nối" 
    ex = KaraokeApp(song_name)
    ex.show()
    sys.exit(app.exec())