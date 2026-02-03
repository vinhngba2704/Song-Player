import yt_dlp
import os

# Supported audio formats
SUPPORTED_FORMATS = ['mp3', 'm4a']


def download_audio(url, output_folder="music_downloads", audio_format="mp3"):
    """
    Hàm tải âm thanh từ YouTube và chuyển sang định dạng mong muốn.
    
    Args:
        url: YouTube video URL
        output_folder: Thư mục lưu file
        audio_format: Định dạng audio ('mp3' hoặc 'm4a'). Mặc định là 'mp3'
    
    Returns: 
        Đường dẫn file audio đã tải hoặc None nếu lỗi
    """
    # Validate format
    audio_format = audio_format.lower()
    if audio_format not in SUPPORTED_FORMATS:
        print(f"❌ Lỗi: Format '{audio_format}' không được hỗ trợ. Chỉ hỗ trợ: {SUPPORTED_FORMATS}")
        return None
    
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        print(f"📁 Đã tạo thư mục lưu trữ: {output_folder}")

    # Configure quality based on format
    if audio_format == 'm4a':
        # M4A uses AAC codec, quality is in kbps
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': f'{output_folder}/%(title)s.%(ext)s',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'm4a',
                'preferredquality': '192',
            }],
            'quiet': False,
            'no_warnings': False,
        }
    else:
        # Default MP3
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': f'{output_folder}/%(title)s.%(ext)s',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'quiet': False,
            'no_warnings': False,
        }

    try:
        print(f"\n🚀 Đang xử lý: {url}")
        print(f"📀 Định dạng: {audio_format.upper()}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:  # type: ignore[arg-type]
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            audio_path = os.path.splitext(filename)[0] + f'.{audio_format}'
        print(f"\n✅ Hoàn tất! File: {audio_path}")
        return audio_path
    except Exception as e:
        print(f"\n❌ Lỗi: Không thể tải video này. Chi tiết: {e}")
        return None


if __name__ == "__main__":
    print("=== TRÌNH TẢI NHẠC YOUTUBE ===")
    print(f"📀 Định dạng hỗ trợ: {', '.join(SUPPORTED_FORMATS)}")
    
    # Nhận input từ người dùng
    link = input("🔗 Dán link YouTube vào đây (hoặc nhấn Enter để thoát): ").strip()
    
    if not link:
        print("Cửa sổ sẽ đóng sau vài giây...")
    else:
        # Chọn định dạng
        format_choice = input("🎵 Chọn định dạng (mp3/m4a) [mặc định: mp3]: ").strip().lower()
        if not format_choice:
            format_choice = "mp3"
        
        output_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sounds")
        download_audio(link, output_folder=output_folder, audio_format=format_choice)