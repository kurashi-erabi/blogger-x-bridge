import { createCanvas } from 'canvas';

const WIDTH = 1200;
const HEIGHT = 675;
const BG_COLOR = '#F1EADF'; // ベージュ
const ACCENT_COLOR = '#2F4F3F'; // 深緑
const TEXT_COLOR = '#33302B';

function wrapText(ctx, text, maxWidth) {
  const chars = Array.from(text);
  const lines = [];
  let line = '';
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * テーマ文字列からシンプルな引用カード画像(PNG Buffer)を生成する。
 * @param {string} mainText カードの中心に大きく表示する文言
 * @param {string} label 右下などに置く小さなラベル(例: "暮らしノート")
 * @returns {Buffer} PNG画像データ
 */
export function generateCardImage(mainText, label = '比べて選ぶ暮らしノート') {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 装飾ライン(上下に細い線)
  ctx.strokeStyle = ACCENT_COLOR;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(80, 80);
  ctx.lineTo(200, 80);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(WIDTH - 200, HEIGHT - 80);
  ctx.lineTo(WIDTH - 80, HEIGHT - 80);
  ctx.stroke();

  // メインテキスト
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = 'bold 56px sans-serif';
  ctx.textBaseline = 'top';
  const lines = wrapText(ctx, mainText, WIDTH - 200);
  const lineHeight = 76;
  const totalHeight = lines.length * lineHeight;
  let y = (HEIGHT - totalHeight) / 2;
  for (const line of lines) {
    ctx.fillText(line, 100, y);
    y += lineHeight;
  }

  // ラベル(右下)
  ctx.font = '32px sans-serif';
  ctx.fillStyle = ACCENT_COLOR;
  const labelWidth = ctx.measureText(label).width;
  ctx.fillText(label, WIDTH - labelWidth - 80, HEIGHT - 140);

  return canvas.toBuffer('image/png');
}
