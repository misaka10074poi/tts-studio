#!/bin/bash
# 閫愪釜鍚堟垚 18 娈佃闊冲苟鎷兼帴
CHUNK_DIR="C:/Users/46027/WorkBuddy/2026-05-30-21-47-18/chunks"
OUTPUT="C:/Users/46027/WorkBuddy/2026-05-30-21-47-18/鍦扮悊绗旇_璇煶.mp3"
API_KEY="${TTS_API_KEY:-}"
URL="${TTS_API_URL:-https://token-plan-cn.xiaomimimo.com/v1/chat/completions}"
PY="C:/Users/46027/.workbuddy/binaries/python/versions/3.13.12/python.exe"

rm -f "$OUTPUT"

for i in $(seq 0 17); do
  f=$(printf "%s/%02d.txt" "$CHUNK_DIR" $i)
  content=$("$PY" -c "import json,sys; f=open('$f',encoding='utf-8'); print(json.dumps(f.read()))")
  echo "[$((i+1))/18] chunk $i: $(wc -c < "$f" | tr -d ' ') chars 鈫?requesting..."
  
  resp=$(curl -s -X POST "$URL" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"mimo-v2.5-tts\",\"messages\":[{\"role\":\"assistant\",\"content\":$content}],\"audio\":{\"format\":\"mp3\",\"voice\":\"mimo_default\"}}" \
    -w "\n%{http_code}")
  
  http_code=$(echo "$resp" | tail -1)
  json_body=$(echo "$resp" | head -n -1)
  
  if [ "$http_code" != "200" ]; then
    echo "  FAIL: HTTP $http_code"
    continue
  fi
  
  b64=$(echo "$json_body" | "$PY" -c "import json,sys; print(json.load(sys.stdin)['choices'][0]['message']['audio']['data'])")
  echo "$b64" | base64 -d >> "$OUTPUT"
  echo "  OK: appended audio segment"
done

echo ""
echo "DONE! Total: $(wc -c < "$OUTPUT" | tr -d ' ') bytes 鈫?$OUTPUT"
