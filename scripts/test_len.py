import json, urllib.request, base64

import os

KEY = os.environ.get('TTS_API_KEY', '')
BASE = os.environ.get('TTS_API_BASE_URL', 'https://token-plan-cn.xiaomimimo.com/v1')

def tts_test(text_len, desc):
    payload = {
        'model': 'mimo-v2.5-tts',
        'messages': [{'role': 'assistant', 'content': 'Test. ' * text_len}],
        'audio': {'format': 'mp3', 'voice': 'mimo_default'}
    }
    req = urllib.request.Request(
        f'{BASE}/chat/completions', data=json.dumps(payload).encode(),
        headers={'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'},
        method='POST'
    )
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode())
    sz = len(base64.b64decode(data['choices'][0]['message']['audio']['data']))
    dur_est = sz * 8 / 64000
    return f'{desc}: OK {sz}B ~{dur_est:.0f}s'

for n in [10, 50, 100, 200, 400, 600, 800, 1000]:
    try:
        result = tts_test(n, f'{n*6} chars')
        print(result)
    except Exception as e:
        print(f'{n*6} chars: FAIL - {type(e).__name__}: {str(e)[:100]}')
        break
