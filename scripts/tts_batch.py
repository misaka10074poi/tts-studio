#!/usr/bin/env python3
"""鎵归噺 TTS锛氬皢鏂囨湰鍒嗘鍚堟垚涓鸿闊冲苟鎷兼帴"""
import base64, json, sys, os, urllib.request, re

import os

API_KEY = os.environ.get("TTS_API_KEY", "")
BASE_URL = os.environ.get("TTS_API_BASE_URL", "https://token-plan-cn.xiaomimimo.com")
VOICE = "mimo_default"
FORMAT = "mp3"

def tts(text):
    """璋冪敤 MiMo TTS"""
    payload = {
        "model": "mimo-v2.5-tts",
        "messages": [{"role": "assistant", "content": text}],
        "audio": {"format": FORMAT, "voice": VOICE}
    }
    req = urllib.request.Request(
        f"{BASE_URL}/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
    )
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode("utf-8"))
    return base64.b64decode(data["choices"][0]["message"]["audio"]["data"])

def split_text(text, max_chars=400):
    """鎸夋钀藉垎鍓叉枃鏈紝姣忔涓嶈秴杩?max_chars"""
    paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
    chunks = []
    current = ""
    for p in paragraphs:
        if len(current) + len(p) + 1 > max_chars and current:
            chunks.append(current)
            current = p
        else:
            current = (current + "銆? + p) if current else p
    if current:
        chunks.append(current)
    return chunks

def main():
    txt_path = sys.argv[1] if len(sys.argv) > 1 else "鍦扮悊绗旇.txt"
    out_path = sys.argv[2] if len(sys.argv) > 2 else "鍦扮悊绗旇_璇煶.mp3"

    with open(txt_path, 'r', encoding='utf-8') as f:
        text = f.read()

    # 娓呯悊锛氱Щ闄ゅ彧鏈夌┖鏍肩殑娈佃惤鍜岃繃澶氳繛缁┖琛?    text = re.sub(r'\n{3,}', '\n\n', text)

    chunks = split_text(text, max_chars=350)
    print(f"鏂囨湰 {len(text)} 瀛?鈫?鍒嗘 {len(chunks)} 娈?)

    all_audio = b''
    for i, chunk in enumerate(chunks):
        print(f"\n[{i+1}/{len(chunks)}] 鍚堟垚: {chunk[:60]}... ({len(chunk)}瀛?")
        try:
            audio = tts(chunk)
            all_audio += audio
            print(f"  鉁?{len(audio)} bytes")
        except Exception as e:
            print(f"  鉁?澶辫触: {e}")
            # 閲嶈瘯涓€娆?            try:
                audio = tts(chunk)
                all_audio += audio
                print(f"  鉁?閲嶈瘯鎴愬姛")
            except Exception as e2:
                print(f"  鉁?閲嶈瘯涔熷け璐? {e2}")

    with open(out_path, 'wb') as f:
        f.write(all_audio)
    print(f"\n瀹屾垚锛佹€婚煶棰?{len(all_audio)} bytes 鈫?{out_path}")

if __name__ == '__main__':
    main()
