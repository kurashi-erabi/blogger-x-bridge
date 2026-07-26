import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { TwitterApi } from 'twitter-api-v2';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const POSTED_PATH = path.join(ROOT, 'data/posted-articles.json');

const BLOGGER_API_KEY = process.env.BLOGGER_API_KEY;
const BLOGGER_BLOG_ID = process.env.BLOGGER_BLOG_ID;

function loadPosted() {
  return JSON.parse(fs.readFileSync(POSTED_PATH, 'utf-8'));
}

function savePosted(data) {
  fs.writeFileSync(POSTED_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

async function fetchLatestPosts() {
  const url = `https://www.googleapis.com/blogger/v3/blogs/${BLOGGER_BLOG_ID}/posts?key=${BLOGGER_API_KEY}&maxResults=10&fetchBodies=false`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Blogger API error: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.items || [];
}

async function generateTweet(client, post) {
  const prompt = `以下のブログ記事を紹介するツイート文を1つ作ってください。

# 条件
- 140字以内（日本語）
- 記事タイトル: 「${post.title}」
- 記事URL: ${post.url}
- 煽りすぎず、悩みへの共感や興味を引く一文＋URLで構成
- ハッシュタグは最大2つまで（例: #暮らし #買取）
- 出力はツイート本文のみ、前置き不要`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

async function main() {
  if (!BLOGGER_API_KEY || !BLOGGER_BLOG_ID) {
    throw new Error('BLOGGER_API_KEY / BLOGGER_BLOG_ID が設定されていません。');
  }

  const posted = loadPosted();
  const posts = await fetchLatestPosts();

  const newPosts = posts.filter((p) => !posted.posted_urls.includes(p.url));

  if (newPosts.length === 0) {
    console.log('新しい記事はありません。今回は何も投稿しません。');
    return;
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const twitterClient = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_KEY_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
  });
  const rw = twitterClient.readWrite;

  // 直近の未紹介記事を1件だけ処理（一度に大量投稿しないため）
  const target = newPosts[0];
  const tweetText = await generateTweet(anthropic, target);

  await rw.v2.tweet(tweetText);
  console.log(`Xに投稿しました:\n${tweetText}`);

  posted.posted_urls.push(target.url);
  savePosted(posted);
}

main().catch((err) => {
  console.error('エラーが発生しました:', err);
  process.exit(1);
});
