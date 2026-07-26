import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { TwitterApi } from 'twitter-api-v2';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const TOPICS_PATH = path.join(ROOT, 'data/impression-topics.json');
const HISTORY_PATH = path.join(ROOT, 'data/impression-history.json');

function loadJSON(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function saveJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}

// 直近で使ったテーマは避けて、ランダムに1つ選ぶ
function pickTopic(topics, history) {
  const recentlyUsed = new Set(history.recent || []);
  const candidates = topics.filter((t) => !recentlyUsed.has(t));
  const pool = candidates.length > 0 ? candidates : topics;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function main() {
  const topics = loadJSON(TOPICS_PATH, []);
  if (topics.length === 0) {
    console.log('data/impression-topics.json にネタが登録されていません。');
    return;
  }
  const history = loadJSON(HISTORY_PATH, { recent: [] });

  const topic = pickTopic(topics, history);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `あなたはX(旧Twitter)で「暮らし・節約・片付け」ジャンルのアカウントを
運用する担当者です。以下のテーマについて、共感を呼ぶ・保存されやすい・
リンクなしの投稿を1つ作ってください。

# テーマ
${topic}

# 条件
- 140字以内(日本語)
- リンクは絶対に含めない、宣伝色を出さない
- 「あるある」「気づき」「豆知識」のような、素直に読める文体
- 押し付けがましい断定や煽りは避ける
- ハッシュタグは0〜1個まで
- 出力はツイート本文のみ、前置き不要`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  const tweetText = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  const twitterClient = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_KEY_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
  });
  const rw = twitterClient.readWrite;

  await rw.v2.tweet(tweetText);
  console.log(`インプレッション稼ぎ投稿をしました:\n[テーマ: ${topic}]\n${tweetText}`);

  // 直近使ったテーマを記録(直近5件を保持して、しばらく重複を避ける)
  const recent = [topic, ...(history.recent || [])].slice(0, 5);
  saveJSON(HISTORY_PATH, { recent });
}

main().catch((err) => {
  console.error('投稿中にエラーが発生しました:', err);
  process.exit(1);
});
