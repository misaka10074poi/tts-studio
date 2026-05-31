#!/usr/bin/env python3
"""閫愬潡 TTS 鐢熸垚 鈫?鐙珛 MP3 淇濆瓨 鈫?Python 浜岃繘鍒跺悎骞?""
import json, base64, urllib.request, sys, os, time

import os

API_KEY = os.environ.get("TTS_API_KEY", "")
URL = os.environ.get("TTS_API_URL", "https://token-plan-cn.xiaomimimo.com/v1/chat/completions")
CHUNK_DIR = r"C:\Users\46027\WorkBuddy\2026-05-30-21-47-18\chunks"
OUT_DIR = r"C:\Users\46027\WorkBuddy\2026-05-30-21-47-18\chunks_mp3"
FINAL = r"C:\Users\46027\WorkBuddy\2026-05-30-21-47-18\鍦扮悊绗旇_璇煶.mp3"

os.makedirs(OUT_DIR, exist_ok=True)

# Step 1: Generate each chunk as separate MP3
total = 18
for i in range(total):
    chunk_file = os.path.join(CHUNK_DIR, f"{i:02d}.txt")
    mp3_file = os.path.join(OUT_DIR, f"chunk_{i:02d}.mp3")
    
    # Skip if already generated
    if os.path.exists(mp3_file) and os.path.getsize(mp3_file) > 1000:
        print(f"[{i+1}/{total}] SKIP (already exists): {mp3_file}")
        continue
    
    # Read chunk text
    with open(chunk_file, "r", encoding="utf-8") as f:
        text = f.read()
    
    print(f"[{i+1}/{total}] requesting... ({len(text)} chars)", end=" ", flush=True)
    
    # Build request
    payload = {
        "model": "mimo-v2.5-tts",
        "messages": [{"role": "assistant", "content": text}],
        "audio": {"format": "mp3", "voice": "mimo_default"}
    }
    data = json.dumps(payload).encode("utf-8")
    
    req = urllib.request.Request(URL, data=data, headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    })
    
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"FAIL: {e}")
        continue
    
    # Extract base64 audio
    b64_data = body["choices"][0]["message"]["audio"]["data"]
    
    # Decode and save
    audio_bytes = base64.b64decode(b64_data)
    with open(mp3_file, "wb") as f:
        f.write(audio_bytes)
    
    print(f"OK ({len(audio_bytes)} bytes)")
    time.sleep(0.3)  # Rate limit buffer

# Step 2: Concatenate all chunks
print("\n--- Merging ---")
total_bytes = 0
with open(FINAL, "wb") as out:
    for i in range(total):
        mp3_file = os.path.join(OUT_DIR, f"chunk_{i:02d}.mp3")
        if not os.path.exists(mp3_file):
            print(f"WARNING: missing {mp3_file}")
            continue
        with open(mp3_file, "rb") as inf:
            data = inf.read()
            out.write(data)
            total_bytes += len(data)
            print(f"  [{i+1}/{total}] {os.path.basename(mp3_file)}: {len(data)} bytes")

print(f"\nDONE! Final: {total_bytes} bytes 鈫?{FINAL}")

# Verify with mutagen if available
try:
    from mutagen.mp3 import MP3
    audio = MP3(FINAL)
    print(f"Duration: {audio.info.length:.1f}s ({audio.info.length/60:.1f} min)")
except ImportError:
    print("(mutagen not available for duration check)")
