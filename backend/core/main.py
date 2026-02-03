from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional
import os
import tempfile
import httpx
from dotenv import load_dotenv

load_dotenv()

try:
    from backend.utils.mongodb import (
        get_all_songs, get_song_by_id, update_song_metadata, delete_song_by_id
    )
    from backend.utils.gcs import generate_signed_url, GCS_BUCKET_NAME, delete_file
    from backend.utils.utils import parse_lrc_content
    from backend.utils.gemini import generate_robot_comment
except ImportError:
    pass

app = FastAPI(title="Music Player API", version="1.0.0")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
IMPORT_PASSWORD = os.getenv("IMPORT_PASSWORD", "Bavinh2704!@#")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Music Player API is running", "version": "1.0.0"}


@app.get("/api/debug/songs")
async def debug_songs():
    """Debug endpoint to check raw MongoDB data"""
    try:
        songs_from_db = get_all_songs()
        return {"songs": songs_from_db, "total": len(songs_from_db)}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/songs")
async def get_songs():
    """Lấy danh sách tất cả bài hát từ MongoDB"""
    try:
        songs_from_db = get_all_songs()
        songs = []
        
        backend_url = os.getenv('BACKEND_URL')
        if not backend_url:
            host = os.getenv('BACKEND_HOST', '127.0.0.1')
            port = os.getenv('BACKEND_PORT', '8000')
            backend_url = f"http://{host}:{port}"
        
        for song in songs_from_db:
            song_id = song["_id"]
            songs.append({
                "id": song_id,
                "title": song.get("title", "Unknown"),
                "audioUrl": f"{backend_url}/api/audio/{song_id}",
                "audioFormat": song.get("audio_format"),
                "hasLyrics": song.get("has_lyrics", False)
            })
        
        return {"songs": songs, "total": len(songs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get songs: {str(e)}")


async def get_valid_signed_url(song_id: str, url_field: str, blob_field: str):
    """
    Get a valid signed URL for audio or lyrics file.
    If URL is expired, generate a new one.
    """
    song = get_song_by_id(song_id)
    
    if not song:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài hát")
    
    current_url = song.get(url_field)
    blob_path = song.get(blob_field)
    
    if not blob_path:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy file")
    
    # Check if URL exists and is still valid
    if current_url:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.head(current_url, follow_redirects=True, timeout=10.0)
                if response.status_code == 200:
                    return current_url, song
            except Exception:
                pass
    
    # URL expired or doesn't exist, generate new one
    try:
        new_url = generate_signed_url(GCS_BUCKET_NAME, blob_path)
        update_song_metadata(song_id, {url_field: new_url})
        return new_url, song
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get valid URL: {str(e)}")


@app.get("/api/lyrics/{song_id}")
async def get_lyrics(song_id: str):
    """Lấy lời bài hát từ GCS và parse sang JSON"""
    try:
        valid_url, song = await get_valid_signed_url(song_id, "gcs_lrc_path", "gcs_lrc_blob")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(valid_url, timeout=30.0)
            
            if response.status_code != 200:
                raise HTTPException(status_code=404, detail="Không thể tải file lời bài hát")
            
            lyrics_data = parse_lrc_content(response.text)
            return {"songId": song_id, "lyrics": lyrics_data}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy lyrics: {str(e)}")


@app.get("/api/audio/{song_id}")
async def get_audio(song_id: str):
    """Stream audio từ GCS signed URL (supports MP3 and M4A)"""
    try:
        valid_url, song = await get_valid_signed_url(song_id, "gcs_audio_path", "gcs_audio_blob")
        return RedirectResponse(url=valid_url, status_code=302)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi stream audio: {str(e)}")


class PasswordVerifyRequest(BaseModel):
    password: str


@app.post("/api/verify-import-password")
async def verify_import_password(request: PasswordVerifyRequest):
    """Xác thực mật khẩu để import track"""
    if request.password == IMPORT_PASSWORD:
        return {"success": True, "message": "Password verified successfully"}
    raise HTTPException(status_code=401, detail="Incorrect password")


@app.delete("/api/track/{song_id}")
async def delete_track(song_id: str):
    """Delete a track from GCS and MongoDB"""
    try:
        song = get_song_by_id(song_id)
        if not song:
            raise HTTPException(status_code=404, detail="Track not found")
        
        gcs_audio_blob = song.get("gcs_audio_blob")
        gcs_lrc_blob = song.get("gcs_lrc_blob")
        
        if gcs_audio_blob:
            if not delete_file(GCS_BUCKET_NAME, gcs_audio_blob):
                print(f"Warning: Could not delete audio file: {gcs_audio_blob}")
        
        if gcs_lrc_blob:
            if not delete_file(GCS_BUCKET_NAME, gcs_lrc_blob):
                print(f"Warning: Could not delete LRC file: {gcs_lrc_blob}")
        
        if not delete_song_by_id(song_id):
            raise HTTPException(status_code=500, detail="Failed to delete track from database")
        
        return {
            "success": True,
            "message": "Track deleted successfully",
            "deleted_song_id": song_id,
            "deleted_audio": gcs_audio_blob,
            "deleted_lrc": gcs_lrc_blob
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


@app.put("/api/track/{song_id}")
async def update_track(
    song_id: str,
    title: str = Form(default=None),
    sound_file: UploadFile = File(default=None),
    lyrics_file: UploadFile = File(default=None)
):
    """Update a track's title, sound file (MP3/M4A), and/or lyrics file"""
    try:
        from backend.utils.gcs import upload_file, delete_file, generate_signed_url, GCS_BUCKET_NAME
        
        song = get_song_by_id(song_id)
        if not song:
            raise HTTPException(status_code=404, detail="Track not found")
        
        update_fields = {}
        updated_sound = None
        updated_lyrics = None
        
        if title and title.strip():
            update_fields["title"] = title.strip()
        
        if sound_file and sound_file.filename:
            old_audio_blob = song.get("gcs_audio_blob")
            if old_audio_blob:
                delete_file(GCS_BUCKET_NAME, old_audio_blob)
            
            _, file_ext = os.path.splitext(sound_file.filename)
            if not file_ext:
                file_ext = ".mp3"
            
            audio_format = file_ext.lstrip(".").lower()
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
                content = await sound_file.read()
                tmp.write(content)
                tmp_path = tmp.name
            
            try:
                new_audio_blob = f"sounds/{sound_file.filename}"
                upload_file(GCS_BUCKET_NAME, tmp_path, new_audio_blob)
                new_audio_url = generate_signed_url(GCS_BUCKET_NAME, new_audio_blob)
                
                update_fields["gcs_audio_blob"] = new_audio_blob
                update_fields["gcs_audio_path"] = new_audio_url
                update_fields["audio_format"] = audio_format
                updated_sound = sound_file.filename
            finally:
                os.unlink(tmp_path)
        
        if lyrics_file and lyrics_file.filename:
            old_lrc_blob = song.get("gcs_lrc_blob")
            if old_lrc_blob:
                delete_file(GCS_BUCKET_NAME, old_lrc_blob)
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=".lrc") as tmp:
                content = await lyrics_file.read()
                tmp.write(content)
                tmp_path = tmp.name
            
            try:
                new_lrc_blob = f"lyrics/{lyrics_file.filename}"
                upload_file(GCS_BUCKET_NAME, tmp_path, new_lrc_blob)
                new_lrc_url = generate_signed_url(GCS_BUCKET_NAME, new_lrc_blob)
                
                update_fields["gcs_lrc_blob"] = new_lrc_blob
                update_fields["gcs_lrc_path"] = new_lrc_url
                update_fields["has_lyrics"] = True
                updated_lyrics = lyrics_file.filename
            finally:
                os.unlink(tmp_path)
        
        if update_fields:
            update_song_metadata(song_id, update_fields)
        
        return {
            "success": True,
            "message": "Track updated successfully",
            "song_id": song_id,
            "updated_title": update_fields.get("title"),
            "updated_sound": updated_sound,
            "updated_lyrics": updated_lyrics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")


@app.post("/api/import-track")
async def import_track(
    title: str = Form(...),
    sound_file: UploadFile = File(...),
    lyrics_file: UploadFile = File(default=None)
):
    """Upload track files (MP3/M4A) to Google Cloud Storage and save metadata to MongoDB"""
    try:
        from backend.utils.gcs import upload_file, generate_signed_url, GCS_BUCKET_NAME
        from backend.utils.mongodb import insert_song_metadata, update_song_metadata, SongMetadata
        
        uploaded_sound = None
        uploaded_lyrics = None
        sound_blob_path = None
        lyrics_blob_path = None
        audio_format = None
        
        has_lyrics = lyrics_file is not None and lyrics_file.filename is not None and lyrics_file.filename != ""
        
        song_metadata = SongMetadata(
            title=title,
            gcs_audio_blob=None,
            gcs_lrc_blob=None,
            gcs_audio_path=None,
            gcs_lrc_path=None,
            audio_format=None,
            has_lyrics=has_lyrics
        )
        inserted_id = insert_song_metadata(song_metadata)
        
        if sound_file and sound_file.filename:
            _, file_ext = os.path.splitext(sound_file.filename)
            if not file_ext:
                file_ext = ".mp3"
            
            audio_format = file_ext.lstrip(".").lower()
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
                content = await sound_file.read()
                tmp.write(content)
                tmp_path = tmp.name
            
            try:
                sound_blob_path = f"sounds/{sound_file.filename}"
                upload_file(GCS_BUCKET_NAME, tmp_path, sound_blob_path)
                uploaded_sound = sound_file.filename
            finally:
                os.unlink(tmp_path)
        
        if lyrics_file and lyrics_file.filename:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".lrc") as tmp:
                content = await lyrics_file.read()
                tmp.write(content)
                tmp_path = tmp.name
            
            try:
                lyrics_blob_path = f"lyrics/{lyrics_file.filename}"
                upload_file(GCS_BUCKET_NAME, tmp_path, lyrics_blob_path)
                uploaded_lyrics = lyrics_file.filename
            finally:
                os.unlink(tmp_path)
        
        update_fields = {}
        
        if sound_blob_path:
            audio_signed_url = generate_signed_url(GCS_BUCKET_NAME, sound_blob_path)
            update_fields["gcs_audio_blob"] = sound_blob_path
            update_fields["gcs_audio_path"] = audio_signed_url
            update_fields["audio_format"] = audio_format
        
        if lyrics_blob_path:
            lrc_signed_url = generate_signed_url(GCS_BUCKET_NAME, lyrics_blob_path)
            update_fields["gcs_lrc_blob"] = lyrics_blob_path
            update_fields["gcs_lrc_path"] = lrc_signed_url
        
        if update_fields:
            update_song_metadata(inserted_id, update_fields)
        
        return {
            "success": True,
            "message": "Track imported successfully",
            "title": title,
            "uploaded_sound": uploaded_sound,
            "uploaded_lyrics": uploaded_lyrics,
            "audio_format": audio_format,
            "has_lyrics": has_lyrics,
            "mongodb_id": str(inserted_id),
            "gcs_audio_url": update_fields.get("gcs_audio_path"),
            "gcs_lrc_url": update_fields.get("gcs_lrc_path")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


class RobotCommentRequest(BaseModel):
    song_title: Optional[str] = None
    lyrics: Optional[str] = None


@app.post("/api/robot-comment")
async def get_robot_comment(request: RobotCommentRequest):
    """Lấy comment từ Gemini AI cho robot Mắm Chan"""
    try:
        comment = generate_robot_comment(request.song_title, request.lyrics)
        return {"success": True, "comment": comment}
    except Exception as e:
        return {
            "success": False,
            "comment": "Bài hát có hay không, bạn thấy thế nào? 🎵",
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("PORT", os.getenv("BACKEND_PORT", "8000")))
    uvicorn.run(app, host=host, port=port)
