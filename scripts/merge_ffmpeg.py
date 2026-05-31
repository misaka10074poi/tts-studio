"""
Use ffmpeg concat to properly merge 18 MP3 chunks into a single file.
Tries stream-copy first; falls back to re-encode if needed.
"""
import subprocess, os, sys

WORK = r"C:\Users\46027\WorkBuddy\2026-05-30-21-47-18"
CHUNKS_DIR = os.path.join(WORK, "chunks_mp3")
FFMPEG = r"C:\Users\46027\.workbuddy\binaries\python\envs\default\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
OUTPUT = os.path.join(WORK, "鍦扮悊绗旇_璇煶_瀹屾暣.mp3")

chunks = sorted(f for f in os.listdir(CHUNKS_DIR) if f.endswith('.mp3'))
print(f"Found {len(chunks)} MP3 chunks")

# Method 1: concat demuxer (stream-copy)
concat_list = os.path.join(WORK, "concat_list.txt")
with open(concat_list, 'w', encoding='utf-8') as f:
    for c in chunks:
        path = os.path.join(CHUNKS_DIR, c).replace('\\', '/')
        f.write(f"file '{path}'\n")
print("Created concat_list.txt")

print(f"\nTrying method 1: concat demuxer (stream copy)...")
result = subprocess.run([
    FFMPEG, '-y',
    '-f', 'concat', '-safe', '0',
    '-i', concat_list,
    '-c', 'copy',
    OUTPUT
], capture_output=True, text=True, cwd=WORK)

if result.returncode == 0:
    size_mb = os.path.getsize(OUTPUT) / 1024 / 1024
    print(f"Success! Output: {size_mb:.1f} MB -> {OUTPUT}")
    # Verify duration
    from mutagen.mp3 import MP3
    audio = MP3(OUTPUT)
    print(f"Duration: {audio.info.length:.1f}s ({audio.info.length/60:.1f} min)")
else:
    print(f"Stream copy failed: {result.stderr[:500]}")
    # Method 2: concat protocol
    print("\nTrying method 2: concat protocol...")
    concat_input = "concat:" + "|".join(os.path.join(CHUNKS_DIR, c) for c in chunks)
    result = subprocess.run([
        FFMPEG, '-y',
        '-i', concat_input,
        '-c', 'copy',
        OUTPUT
    ], capture_output=True, text=True, cwd=WORK)
    
    if result.returncode == 0:
        size_mb = os.path.getsize(OUTPUT) / 1024 / 1024
        print(f"Success! Output: {size_mb:.1f} MB -> {OUTPUT}")
        from mutagen.mp3 import MP3
        audio = MP3(OUTPUT)
        print(f"Duration: {audio.info.length:.1f}s ({audio.info.length/60:.1f} min)")
    else:
        print(f"Concat protocol also failed: {result.stderr[:500]}")
        # Method 3: re-encode
        print("\nTrying method 3: re-encode via concat filter...")
        result = subprocess.run([
            FFMPEG, '-y',
            '-f', 'concat', '-safe', '0',
            '-i', concat_list,
            '-c:a', 'libmp3lame', '-b:a', '64k',
            '-ar', '24000', '-ac', '1',
            '-map_metadata', '-1',
            OUTPUT
        ], capture_output=True, text=True, cwd=WORK)
        
        if result.returncode == 0:
            size_mb = os.path.getsize(OUTPUT) / 1024 / 1024
            print(f"Success (re-encoded)! Output: {size_mb:.1f} MB -> {OUTPUT}")
            from mutagen.mp3 import MP3
            audio = MP3(OUTPUT)
            print(f"Duration: {audio.info.length:.1f}s ({audio.info.length/60:.1f} min)")
        else:
            print(f"All methods failed: {result.stderr}")

# Clean up concat list
os.remove(concat_list)
