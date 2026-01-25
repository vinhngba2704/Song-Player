import os
import re

def normalize_song_name(name):
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

def parse_lrc(path):
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


def parse_lrc_content(content: str):
    """Parse LRC content from string instead of file"""
    data = []
    if not content:
        return [{"time": 0, "text": "Không có lời bài hát"}]
    
    pattern = re.compile(r'\[(\d+):(\d+\.\d+)\](.*)')
    
    for line in content.splitlines():
        match = pattern.match(line)
        if match:
            t = int(match.group(1)) * 60 + float(match.group(2))
            data.append({"time": t, "text": match.group(3).strip()})
    
    data.append({"time": 9999, "text": ""})
    return data