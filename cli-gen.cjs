#!/usr/bin/env node
/**
 * TTS Studio 命令行生成器
 * 用法: node cli-gen.cjs "你的文本" [选项]
 * 
 * 需要先设置环境变量 MIMO_API_KEY
 * 或者用 --key YOUR_KEY
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 解析参数
const args = process.argv.slice(2);
let text = '';
let apiKey = process.env.MIMO_API_KEY || '';
let outputDir = './output';
let voice = 'mimo-default';
let concurrency = 3;

for (const arg of args) {
  if (arg.startsWith('--key=')) apiKey = arg.slice(6);
  else if (arg.startsWith('--output=')) outputDir = arg.slice(9);
  else if (arg.startsWith('--voice=')) voice = arg.slice(8);
  else if (arg.startsWith('--concurrency=')) concurrency = parseInt(arg.slice(14));
  else if (!arg.startsWith('--')) text += arg + ' ';
}
text = text.trim();

if (!text) {
  console.log('用法: node cli-gen.cjs "文本内容" [--key=API_KEY] [--output=./output] [--voice=mimo-default] [--concurrency=3]');
  process.exit(1);
}
if (!apiKey) {
  console.error('错误: 未设置 API Key。用 --key=YOUR_KEY 参数或设置环境变量 MIMO_API_KEY');
  process.exit(1);
}

// 按标点拆分（简单版）
function splitText(txt) {
  const chunks = txt.split(/(?<=[。！？.!?\n])/g).filter(c => c.trim());
  const merged = [];
  let current = '';
  for (const c of chunks) {
    if (current.length + c.length < 300) {
      current += c;
    } else {
      if (current) merged.push(current.trim());
      current = c;
    }
  }
  if (current) merged.push(current.trim());
  return merged.length ? merged : [txt];
}

// 调用 MiMo TTS API
function generateTTS(textChunk, signal) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'mimo-v2.5-tts',
      messages: [
        { role: 'system', content: `Use the voice: ${voice}. Output audio in mp3 format encoded as base64.` },
        { role: 'assistant', content: textChunk }
      ],
      max_tokens: 4096,
    });

    const req = https.request({
      hostname: 'token-plan-cn.xiaomimimo.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 180000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) { reject(new Error(json.error.message || JSON.stringify(json.error))); return; }
          const content = json.choices?.[0]?.message?.content || '';
          if (!content) { reject(new Error('Empty response')); return; }
          // 提取 base64
          const match = content.match(/[A-Za-z0-9+/=]{100,}/);
          if (match) resolve(match[0]);
          else resolve(content);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    if (signal) signal.addEventListener('abort', () => req.destroy());
    req.write(body);
    req.end();
  });
}

// 主流程
async function main() {
  const chunks = splitText(text);
  console.log(`文本 ${text.length} 字 → ${chunks.length} 段, ${concurrency} 并发`);
  
  const outPath = path.resolve(outputDir);
  fs.mkdirSync(outPath, { recursive: true });
  const taskName = 'cli_' + new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const taskDir = path.join(outPath, taskName);
  fs.mkdirSync(taskDir, { recursive: true });
  const segDir = path.join(taskDir, 'segments');
  fs.mkdirSync(segDir, { recursive: true });

  let completed = 0;
  const queue = [...chunks];

  async function worker(id) {
    while (queue.length > 0) {
      const chunk = queue.shift();
      if (!chunk) break;
      const index = chunks.indexOf(chunk);
      console.log(`[${id}] 生成 ${index + 1}/${chunks.length}: ${chunk.substring(0, 30)}...`);
      try {
        const base64 = await generateTTS(chunk);
        const buf = Buffer.from(base64, 'base64');
        const filePath = path.join(segDir, `s${String(index + 1).padStart(3, '0')}.mp3`);
        fs.writeFileSync(filePath, buf);
        completed++;
        console.log(`[${id}] ✓ ${index + 1}/${chunks.length} (${(buf.length / 1024).toFixed(1)}KB)`);
      } catch (e) {
        console.error(`[${id}] ✗ ${index + 1}: ${e.message}`);
      }
    }
  }

  const workers = [];
  for (let i = 0; i < concurrency; i++) workers.push(worker(i + 1));
  await Promise.all(workers);

  // 合并 WAV（如果安装了 ffmpeg）
  console.log(`\n完成! 文件在: ${taskDir}`);
  console.log(`  分段: ${segDir}/`);
  console.log(`  共 ${completed} 个文件`);
  
  if (completed > 1) {
    console.log('\n合并 WAV 命令:');
    console.log(`  cd "${segDir}" && for f in s*.mp3; do ffmpeg -i "$f" -f wav - >> ../full.wav; done`);
    console.log(`  或使用: python ${__dirname}/scripts/merge_mp3.py "${taskDir}"`);
  }
}

main().catch(e => { console.error('致命错误:', e.message); process.exit(1); });
