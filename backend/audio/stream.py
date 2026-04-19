
import subprocess
import whisper
import tempfile
import os
import asyncio
from datetime import datetime
from models import TranscriptChunk
 
# Load whisper model once at startup (use "base" for speed, "small" for better accuracy)
print("Loading Whisper model...")
whisper_model = whisper.load_model("base")
print("Whisper ready")
 
 
def get_audio_stream_url(youtube_url: str) -> str:
    """Use yt-dlp to extract the raw audio stream URL from a YouTube link"""
    result = subprocess.run(
        ["yt-dlp", "-f", "bestaudio", "--get-url", youtube_url],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        raise Exception(f"yt-dlp failed: {result.stderr}")
    
    stream_url = result.stdout.strip()
    print(f"Got stream URL: {stream_url[:80]}...")
    return stream_url
 
 
def download_audio_chunk(stream_url: str, start_seconds: int, duration: int = 30) -> str:
    """
    Download a specific chunk of audio using ffmpeg.
    Returns path to a temp .wav file.
    """
    import imageio_ffmpeg
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    
    tmp_file = tempfile.mktemp(suffix=".wav")
    
    subprocess.run([
        ffmpeg_exe,
        "-ss", str(start_seconds),
        "-i", stream_url,
        "-t", str(duration),
        "-ar", "16000",
        "-ac", "1",
        "-f", "wav",
        tmp_file,
        "-y",
        "-loglevel", "quiet"
    ])
    
    return tmp_file 
 
def transcribe_chunk(audio_path: str) -> str:
    """Run Whisper on an audio file and return the transcript text"""
    result = whisper_model.transcribe(audio_path, fp16=False)
    return result["text"].strip()
 
 
def format_timestamp(seconds: int) -> str:
    """Convert seconds to HH:MM:SS"""
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:02d}"
 
 
async def stream_transcript(youtube_url: str, company_ticker: str, chunk_callback):
    """
    Main streaming function.
    Pulls audio in 30-second chunks, transcribes each one,
    and calls chunk_callback with each TranscriptChunk.
    
    chunk_callback: async function that receives a TranscriptChunk
    """
    print(f"Starting stream for {youtube_url}")

    loop = asyncio.get_event_loop()
    stream_url = await loop.run_in_executor(None, get_audio_stream_url, youtube_url)

    current_second = 0
    chunk_duration = 30  # seconds per chunk

    while True:
        print(f"Processing chunk at {format_timestamp(current_second)}...")

        # Download and transcribe off the event loop thread
        audio_path = await loop.run_in_executor(None, download_audio_chunk, stream_url, current_second, chunk_duration)
        text = await loop.run_in_executor(None, transcribe_chunk, audio_path)

        # Clean up temp file
        os.remove(audio_path)
        
        if text:
            chunk = TranscriptChunk(
                speaker="Unknown",  # speaker diarization can be added later
                text=text,
                timestamp=format_timestamp(current_second),
                company_ticker=company_ticker.upper()
            )
            
            # Send to whoever is listening (the main pipeline)
            await chunk_callback(chunk)
        
        current_second += chunk_duration
        
        # Small pause to not hammer the stream
        await asyncio.sleep(1)
