"use strict";

/* ============ データ定義 ============ */

const EVIDENCE = {
  temp:      { name: "温度低下",   tool: "thermometer" },
  emf:       { name: "EMF反応",    tool: "emf" },
  footsteps: { name: "足音",       tool: "mic" },
  shadow:    { name: "影の目撃",   tool: "camera" },
  evp:       { name: "声(EVP)",    tool: "recorder" },
  salt:      { name: "塩の異常",   tool: "salt" },
  mirror:    { name: "鏡の異変",   tool: "mirror" },
  ofuda:     { name: "御札の反応", tool: "ofuda" },
};

const TOOLS = {
  thermometer: { name: "温度計",       starter: true,  price: 0 },
  emf:         { name: "EMFリーダー",  starter: true,  price: 0 },
  mic:         { name: "集音マイク",   starter: false, price: 120 },
  camera:      { name: "暗視カメラ",   starter: false, price: 150 },
  recorder:    { name: "ICレコーダー", starter: false, price: 150 },
  salt:        { name: "盛り塩セット", starter: false, price: 100 },
  mirror:      { name: "合わせ鏡",     starter: false, price: 130 },
  ofuda:       { name: "御札",         starter: false, price: 160 },
};

const CONSUMABLES = {
  charm:   { name: "お守り",       desc: "調査中のサニティ減少を軽減（次の調査1回）", price: 60 },
  timeAmulet: { name: "延命の御札", desc: "調査の制限時間を+20秒（次の調査1回）", price: 60 },
};

const TOOL_ICONS = {
  thermometer: "🌡️",
  emf: "📟",
  mic: "🎙️",
  camera: "📷",
  recorder: "📼",
  salt: "🧂",
  mirror: "🪞",
  ofuda: "📜",
};

const RANKS = ["E", "D", "C", "B", "A", "SS"];

const ROSTER = [
  { id: "zashiki",  name: "座敷童子",   rank: "E",  evi: ["footsteps", "shadow", "temp"], flavor: "家に幸運をもたらすとされる童子姿の妖怪。悪戯好きで危険度は低い。" },
  { id: "yanari",   name: "家鳴り",     rank: "E",  evi: ["emf", "footsteps", "ofuda"],    flavor: "古い家屋を軋ませる小さな怪異。実害は少ない。" },
  { id: "okuriinu", name: "送り犬",     rank: "D",  evi: ["footsteps", "shadow", "evp"],   flavor: "夜道を跟いてくる犬の妖怪。転ばなければ危害はないという。" },
  { id: "hitotsume",name: "一つ目小僧", rank: "D",  evi: ["shadow", "evp", "emf"],         flavor: "驚かすのが好きな一つ目の妖怪。" },
  { id: "noppera",  name: "のっぺらぼう", rank: "D", evi: ["shadow", "mirror", "evp"],      flavor: "顔のない怪異。鏡や水面に真の姿が映るとされる。" },
  { id: "kappa",    name: "河童",       rank: "C",  evi: ["temp", "footsteps", "salt"],    flavor: "水辺に潜む妖怪。相撲好きで力が強い。" },
  { id: "tengu",    name: "天狗",       rank: "C",  evi: ["emf", "footsteps", "shadow"],   flavor: "山に棲む強力な怪異。神出鬼没。" },
  { id: "yukionna", name: "雪女",       rank: "C",  evi: ["temp", "mirror", "evp"],        flavor: "雪の夜に現れるとされる怪異。強い冷気を伴う。" },
  { id: "rokuro",   name: "ろくろ首",   rank: "B",  evi: ["shadow", "mirror", "ofuda"],    flavor: "夜な夜な首が伸びるという怪異。目撃情報は多いが正体は謎。" },
  { id: "inugami",  name: "犬神",       rank: "B",  evi: ["emf", "footsteps", "ofuda"],    flavor: "強い執念を持つとされる憑き物の一種。" },
  { id: "hannya",   name: "般若",       rank: "B",  evi: ["evp", "salt", "ofuda"],         flavor: "強い怒りや嫉妬から生まれるとされる怪異。" },
  { id: "kijo",     name: "鬼女",       rank: "A",  evi: ["temp", "emf", "salt"],          flavor: "鬼と化した怪異。危険度が高く、脅かしも激しい。" },
  { id: "ubume",    name: "産女",       rank: "A",  evi: ["evp", "shadow", "salt"],        flavor: "夜道に現れるとされる怪異。悲痛な声を発するという。" },
  { id: "omukade",  name: "大百足",     rank: "A",  evi: ["footsteps", "emf", "mirror"],   flavor: "山中に潜む巨大な怪異。移動が速く痕跡を残しやすい。" },
  { id: "shuten",   name: "酒呑童子",   rank: "SS", evi: ["temp", "evp", "ofuda"],         flavor: "伝説級の怪異。最も脅かしが激しく、報酬も最大。" },
];

const ROOM_POOL = ["客間", "廊下の突き当り", "台所", "浴室", "離れの庭", "蔵", "二階の寝室", "神棚の間", "地下室", "図書室", "縁側", "納戸"];

const RANK_INDEX = (r) => RANKS.indexOf(r);

const SCARE_LINES = [
  "ふすまが独りでに動いた……",
  "冷たい視線を感じる。",
  "どこかでラップ音が響いた。",
  "耳元で誰かが囁いた気がした。",
  "灯りが一瞬だけ揺れた。",
  "背後に気配を感じ、思わず振り返った。",
];

/* ============ 一人称マップ定義（レイキャスティング用グリッド） ============ */
/*
  中央の廊下を軸に6部屋（上段3・下段3）を配置した固定間取り。
  1マス=1グリッド単位。0=床、1=壁。各部屋は廊下との間に扉（1マスの隙間）を持つ。
*/
const GRID_W = 21, GRID_H = 15;
const CORRIDOR_Y = 7;
const ROOM_RECTS = [
  { x0: 1,  y0: 1, x1: 6,  y1: 5 },
  { x0: 8,  y0: 1, x1: 12, y1: 5 },
  { x0: 14, y0: 1, x1: 19, y1: 5 },
  { x0: 1,  y0: 9, x1: 6,  y1: 13 },
  { x0: 8,  y0: 9, x1: 12, y1: 13 },
  { x0: 14, y0: 9, x1: 19, y1: 13 },
];
const DOOR_X = [3, 10, 16, 3, 10, 16]; // left edge of each 2-cell-wide doorway

function buildMap() {
  const grid = [];
  for (let y = 0; y < GRID_H; y++) grid.push(new Array(GRID_W).fill(1));
  const carve = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y][x] = 0; };
  carve(1, CORRIDOR_Y, GRID_W - 2, CORRIDOR_Y);
  ROOM_RECTS.forEach(r => carve(r.x0, r.y0, r.x1, r.y1));
  DOOR_X.slice(0, 3).forEach(x => { for (let dx = 0; dx < 3; dx++) grid[CORRIDOR_Y - 1][x + dx] = 0; });
  DOOR_X.slice(3, 6).forEach(x => { for (let dx = 0; dx < 3; dx++) grid[CORRIDOR_Y + 1][x + dx] = 0; });
  return grid;
}

function isWallAt(x, y, grid) {
  const cx = Math.floor(x), cy = Math.floor(y);
  if (cy < 0 || cy >= grid.length || cx < 0 || cx >= grid[0].length) return true;
  return grid[cy][cx] === 1;
}

function roomIndexAt(x, y) {
  const cx = Math.floor(x), cy = Math.floor(y);
  for (let i = 0; i < ROOM_RECTS.length; i++) {
    const r = ROOM_RECTS[i];
    if (cx >= r.x0 && cx <= r.x1 && cy >= r.y0 && cy <= r.y1) return i;
  }
  return null;
}

/* ============ セーブデータ ============ */

const SAVE_KEY = "kaii-sousa-file-save-v1";

function defaultSave() {
  return {
    level: 1,
    xp: 0,
    xpToNext: 100,
    currency: 200,
    gems: 80,
    ownedTools: Object.keys(TOOLS).filter(t => TOOLS[t].starter),
    consumables: { charm: 0, timeAmulet: 0 },
    discovered: [],
    adsRemoved: false,
    seasonPass: false,
    skins: ["護符・標準"],
    settings: {
      controlSide: "right",
      mouseSens: 1.0,
      touchSens: 1.0,
      fovDeg: 66,
      attackEffects: true,
    },
  };
}

let save = loadSave();

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    return Object.assign(defaultSave(), JSON.parse(raw));
  } catch (e) {
    return defaultSave();
  }
}

function persist() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function unlockedYokaiCount() {
  return Math.min(ROSTER.length, 2 + save.level);
}

function unlockedRoster() {
  return ROSTER.slice(0, unlockedYokaiCount());
}

/* ============ 画面切替 ============ */

const screens = document.querySelectorAll(".screen");
const navBtns = document.querySelectorAll(".nav-btn");

function showScreen(id) {
  screens.forEach(s => s.classList.toggle("active", s.id === "screen-" + id));
  navBtns.forEach(b => b.classList.toggle("active", b.dataset.nav === id));
  document.body.classList.toggle("fp-active", id === "investigation");
}

navBtns.forEach(b => b.addEventListener("click", () => {
  showScreen(b.dataset.nav);
  if (b.dataset.nav === "shop") renderShop();
  if (b.dataset.nav === "zukan") renderZukan();
  if (b.dataset.nav === "store") renderStore();
  if (b.dataset.nav === "settings") renderSettings();
}));

function renderPlayerStats() {
  document.getElementById("playerStats").innerHTML =
    `Lv <b>${save.level}</b> (${save.xp}/${save.xpToNext}) ・ 霊符 <b>${save.currency}</b> ・ 勾玉 <b>${save.gems}</b>`;
}

/* ============ 依頼選択 ============ */

let currentCases = [];

function genCases() {
  const roster = unlockedRoster();
  currentCases = [];
  const usedRanks = new Set();
  for (let i = 0; i < 3; i++) {
    const candidates = roster.filter(y => !usedRanks.has(y.rank) || usedRanks.size >= roster.length);
    const pool = candidates.length ? candidates : roster;
    const yokai = pool[Math.floor(Math.random() * pool.length)];
    usedRanks.add(yokai.rank);
    const rooms = shuffle(ROOM_POOL).slice(0, 6);
    currentCases.push({
      yokai,
      location: ["山中の廃屋", "旧校舎", "空き家", "神社の裏手", "古い旅館", "峠の茶屋跡"][Math.floor(Math.random() * 6)],
      rooms,
    });
  }
  renderCaseList();
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rewardBase(rank) {
  const idx = RANK_INDEX(rank);
  return { currency: 40 + idx * 35, xp: 20 + idx * 15 };
}

function renderCaseList() {
  const el = document.getElementById("caseList");
  el.innerHTML = "";
  currentCases.forEach((c, i) => {
    const r = rewardBase(c.yokai.rank);
    const div = document.createElement("div");
    div.className = "card case-card";
    div.innerHTML = `
      <span class="rank rank-${c.yokai.rank}">RANK ${c.yokai.rank}</span>
      <div class="loc">${c.location}</div>
      <div class="hint">部屋数: ${c.rooms.length}（一人称視点で探索）</div>
      <div class="reward">推定報酬: 霊符 ${r.currency} / XP ${r.xp}</div>
      <button class="primary-btn">調査を開始する</button>
    `;
    div.querySelector("button").addEventListener("click", () => startCase(i));
    el.appendChild(div);
  });
}

document.getElementById("rerollCases").addEventListener("click", genCases);

/* ============ 調査フェーズ（一人称視点） ============ */

let investigation = null;
let animId = null;
let lastFrameTime = 0;

const keys = {};
let mouseYawDelta = 0;
let touchYawDelta = 0;
const touchMove = { active: false, pointerId: null, originX: 0, originY: 0, x: 0, y: 0 };
const touchLook = { active: false, pointerId: null, lastX: 0, lastY: 0 };

const MOVE_SPEED = 2.6;
const TURN_SPEED = 2.4;
const MOUSE_SENS = 0.0028;
const TOUCH_LOOK_SENS = 0.006;
const COL_RADIUS = 0.18;
function fovRadians() { return (save.settings.fovDeg || 66) * Math.PI / 180; }
const WALL_RGB = { r: 138, g: 92, b: 66 };

function startCase(idx) {
  const c = currentCases[idx];
  const rankIdx = RANK_INDEX(c.yokai.rank);

  const clueRooms = shuffle(c.rooms).slice(0, c.yokai.evi.length);
  const roomEvidence = {};
  clueRooms.forEach((room, i) => { roomEvidence[room] = c.yokai.evi[i]; });

  let timeLimit = 130 - rankIdx * 8;
  const sanityMax = 100;
  if (save.consumables.timeAmulet > 0) { timeLimit += 20; save.consumables.timeAmulet--; }
  const charmActive = save.consumables.charm > 0;
  if (charmActive) save.consumables.charm--;
  persist();

  investigation = {
    caseData: c,
    rankIdx,
    roomEvidence,
    hauntRoom: clueRooms[0],
    searchedRooms: new Set(),
    foundEvidence: new Set(),
    selectedTool: null,
    time: timeLimit,
    timeMax: timeLimit,
    sanity: sanityMax,
    sanityMax,
    charmActive,
    ended: false,
    pendingEnd: false,
    stunnedUntil: 0,
    grid: buildMap(),
    player: { x: DOOR_X[1] + 1.5, y: CORRIDOR_Y + 0.5, angle: 0 },
  };

  Object.keys(keys).forEach(k => delete keys[k]);
  mouseYawDelta = 0; touchYawDelta = 0;
  touchMove.active = false; touchLook.active = false;
  resetJoystick();

  showScreen("investigation");
  applyControlSide();
  renderToolbar();
  updateJournalPanel();
  logEvent(`${c.location}に到着した。調査を開始する。`, "");

  requestAnimationFrame(() => { resizeFpCanvas(); });
  lastFrameTime = 0;
  if (animId) cancelAnimationFrame(animId);
  animId = requestAnimationFrame(gameLoop);
}

function gameLoop(ts) {
  if (!investigation || investigation.ended) { animId = null; return; }
  const screenActive = document.getElementById("screen-investigation").classList.contains("active");
  const blockedByOrientation = window.matchMedia("(orientation: portrait)").matches;
  if (!screenActive || blockedByOrientation) {
    lastFrameTime = 0;
    animId = requestAnimationFrame(gameLoop);
    return;
  }
  const dt = lastFrameTime ? Math.min(0.05, (ts - lastFrameTime) / 1000) : 0;
  lastFrameTime = ts;
  updatePlayer(dt);
  updateTimers(dt);
  renderFpFrame();
  updateRoomPrompt();
  animId = requestAnimationFrame(gameLoop);
}

function updatePlayer(dt) {
  const inv = investigation;
  if (inv.stunnedUntil && performance.now() < inv.stunnedUntil) return;
  let turn = 0;
  if (keys["arrowleft"]) turn -= TURN_SPEED * dt;
  if (keys["arrowright"]) turn += TURN_SPEED * dt;
  turn += mouseYawDelta + touchYawDelta;
  mouseYawDelta = 0; touchYawDelta = 0;
  inv.player.angle += turn;

  const fwd = { x: Math.cos(inv.player.angle), y: Math.sin(inv.player.angle) };
  const right = { x: Math.cos(inv.player.angle + Math.PI / 2), y: Math.sin(inv.player.angle + Math.PI / 2) };
  let fAxis = 0, rAxis = 0;
  if (keys["w"]) fAxis += 1;
  if (keys["s"]) fAxis -= 1;
  if (keys["d"]) rAxis += 1;
  if (keys["a"]) rAxis -= 1;
  if (touchMove.active) { fAxis += -touchMove.y; rAxis += touchMove.x; }
  const len = Math.hypot(fAxis, rAxis);
  if (len > 1) { fAxis /= len; rAxis /= len; }

  const dx = (fwd.x * fAxis + right.x * rAxis) * MOVE_SPEED * dt;
  const dy = (fwd.y * fAxis + right.y * rAxis) * MOVE_SPEED * dt;
  tryMove(dx, dy);
}

function tryMove(dx, dy) {
  const inv = investigation;
  const grid = inv.grid;
  const p = inv.player;
  const r = COL_RADIUS;
  if (dx !== 0) {
    const sx = Math.sign(dx);
    const nx = p.x + dx;
    if (!isWallAt(nx + sx * r, p.y - r, grid) && !isWallAt(nx + sx * r, p.y + r, grid)) p.x = nx;
  }
  if (dy !== 0) {
    const sy = Math.sign(dy);
    const ny = p.y + dy;
    if (!isWallAt(p.x - r, ny + sy * r, grid) && !isWallAt(p.x + r, ny + sy * r, grid)) p.y = ny;
  }
}

function updateTimers(dt) {
  const inv = investigation;
  if (inv.pendingEnd) { updateHud(); return; }
  inv.time -= dt;
  inv.sanity -= dt * 0.18;
  updateHud();
  if (inv.time <= 0 || inv.sanity <= 0) {
    inv.time = Math.max(0, inv.time);
    inv.sanity = Math.max(0, inv.sanity);
    updateHud();
    endCase(false, inv.time <= 0 ? "time" : "sanity");
  }
}

function updateHud() {
  const inv = investigation;
  document.getElementById("timeBar").style.width = `${Math.max(0, (inv.time / inv.timeMax) * 100)}%`;
  document.getElementById("sanityBar").style.width = `${Math.max(0, (inv.sanity / inv.sanityMax) * 100)}%`;
}

function logEvent(text, cls) {
  const el = document.getElementById("eventLog");
  el.textContent = text;
  el.className = "event-log" + (cls ? " " + cls : "");
}

function shadeColor(rgb, factor) {
  const r = Math.max(0, Math.min(255, rgb.r * factor)) | 0;
  const g = Math.max(0, Math.min(255, rgb.g * factor)) | 0;
  const b = Math.max(0, Math.min(255, rgb.b * factor)) | 0;
  return `rgb(${r},${g},${b})`;
}

function castRay(px, py, angle, grid) {
  const dx = Math.cos(angle), dy = Math.sin(angle);
  let mapX = Math.floor(px), mapY = Math.floor(py);
  const deltaDistX = Math.abs(1 / dx), deltaDistY = Math.abs(1 / dy);
  let stepX, stepY, sideDistX, sideDistY;
  if (dx < 0) { stepX = -1; sideDistX = (px - mapX) * deltaDistX; }
  else { stepX = 1; sideDistX = (mapX + 1 - px) * deltaDistX; }
  if (dy < 0) { stepY = -1; sideDistY = (py - mapY) * deltaDistY; }
  else { stepY = 1; sideDistY = (mapY + 1 - py) * deltaDistY; }
  let side = 0;
  let hit = false;
  for (let i = 0; i < 64; i++) {
    if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; }
    else { sideDistY += deltaDistY; mapY += stepY; side = 1; }
    if (mapY < 0 || mapY >= grid.length || mapX < 0 || mapX >= grid[0].length) { hit = true; break; }
    if (grid[mapY][mapX] === 1) { hit = true; break; }
  }
  if (!hit) return { dist: 20, side };
  const perpDist = side === 0
    ? (mapX - px + (1 - stepX) / 2) / dx
    : (mapY - py + (1 - stepY) / 2) / dy;
  return { dist: Math.max(perpDist, 0.0001), side };
}

function resizeFpCanvas() {
  const canvas = document.getElementById("fpCanvas");
  if (!canvas || !canvas.isConnected) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
}
window.addEventListener("resize", () => { if (investigation && !investigation.ended) resizeFpCanvas(); });

function renderFpFrame() {
  const canvas = document.getElementById("fpCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  if (W < 2 || H < 2) return;

  const ceilGrad = ctx.createLinearGradient(0, 0, 0, H / 2);
  ceilGrad.addColorStop(0, "#050608");
  ceilGrad.addColorStop(1, "#161a24");
  ctx.fillStyle = ceilGrad;
  ctx.fillRect(0, 0, W, H / 2);

  const floorGrad = ctx.createLinearGradient(0, H / 2, 0, H);
  floorGrad.addColorStop(0, "#1b130e");
  floorGrad.addColorStop(1, "#0b0806");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, H / 2, W, H / 2);

  const inv = investigation;
  const grid = inv.grid;
  const p = inv.player;
  const fov = fovRadians();
  const numRays = W;
  for (let i = 0; i < numRays; i++) {
    const rayAngle = p.angle - fov / 2 + (i / numRays) * fov;
    const { dist, side } = castRay(p.x, p.y, rayAngle, grid);
    const corrected = dist * Math.cos(rayAngle - p.angle);
    const wallHeight = Math.min(H * 1.5, H / Math.max(corrected, 0.0001));
    const shade = Math.max(0.12, 1 - corrected / 13) * (side === 1 ? 0.72 : 1);
    ctx.fillStyle = shadeColor(WALL_RGB, shade);
    ctx.fillRect(i, (H - wallHeight) / 2, 1, wallHeight);
  }
}

function updateRoomPrompt() {
  const el = document.getElementById("fpRoomPrompt");
  if (!el) return;
  const inv = investigation;
  if (!inv || inv.ended) { el.classList.add("hidden"); return; }
  const idx = roomIndexAt(inv.player.x, inv.player.y);
  if (idx === null) { el.classList.add("hidden"); return; }
  const room = inv.caseData.rooms[idx];
  el.classList.remove("hidden");
  if (inv.searchedRooms.has(room)) {
    el.textContent = `${room}（調査済み）`;
    el.classList.add("done");
  } else {
    el.textContent = `『${room}』を調べる（Eキー / タップ）`;
    el.classList.remove("done");
  }
}

function tryInteract() {
  const inv = investigation;
  if (!inv || inv.ended) return;
  if (inv.stunnedUntil && performance.now() < inv.stunnedUntil) return;
  const idx = roomIndexAt(inv.player.x, inv.player.y);
  if (idx === null) { logEvent("ここは廊下だ。部屋の中で調べよう。", ""); return; }
  const room = inv.caseData.rooms[idx];
  if (inv.searchedRooms.has(room)) { logEvent(`「${room}」はすでに調べた。`, ""); return; }
  if (!inv.selectedTool) { logEvent("道具を選んでから調べてください。", ""); return; }
  searchRoom(room);
}

document.getElementById("fpRoomPrompt").addEventListener("click", tryInteract);

window.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === "e") tryInteract();
});
window.addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });

function renderToolbar() {
  const inv = investigation;
  const belt = document.getElementById("fpHotbar");
  belt.innerHTML = "";
  save.ownedTools.forEach(toolId => {
    const btn = document.createElement("button");
    btn.className = "fp-tool-btn" + (inv.selectedTool === toolId ? " selected" : "");
    btn.textContent = TOOL_ICONS[toolId] || "🔧";
    btn.title = TOOLS[toolId].name;
    btn.addEventListener("click", () => {
      inv.selectedTool = (inv.selectedTool === toolId) ? null : toolId;
      renderToolbar();
    });
    belt.appendChild(btn);
  });
}

function updateJournalPanel() {
  const inv = investigation;
  const journal = document.getElementById("journalList");
  journal.innerHTML = "";
  Object.entries(EVIDENCE).forEach(([key, evi]) => {
    const li = document.createElement("li");
    const found = inv.foundEvidence.has(key);
    li.className = found ? "found" : "";
    li.textContent = (found ? "✓ " : "・") + evi.name;
    journal.appendChild(li);
  });
  document.getElementById("btnIdentify").disabled = inv.foundEvidence.size === 0;
}

function searchRoom(room) {
  const inv = investigation;
  inv.searchedRooms.add(room);
  inv.time -= 9;
  inv.sanity -= (6 + inv.rankIdx) * (inv.charmActive ? 0.6 : 1);

  const evidenceKey = inv.roomEvidence[room];
  if (evidenceKey && EVIDENCE[evidenceKey].tool === inv.selectedTool && !inv.foundEvidence.has(evidenceKey)) {
    inv.foundEvidence.add(evidenceKey);
    logEvent(`「${room}」で${EVIDENCE[evidenceKey].name}を検出した！`, "result-good");
  } else if (evidenceKey && EVIDENCE[evidenceKey].tool !== inv.selectedTool) {
    logEvent(`「${room}」で反応があったが、道具が合っていないようだ……`, "");
  } else {
    logEvent(`「${room}」を調べたが、特に異常はなかった。`, "");
  }

  updateJournalPanel();
  updateHud();

  if (room === inv.hauntRoom) {
    const attackChance = 0.35 + inv.rankIdx * 0.08;
    if (Math.random() < attackChance) {
      triggerAttack();
      return;
    }
  }

  const scareChance = 0.06 + inv.rankIdx * 0.035;
  if (Math.random() < scareChance) {
    inv.sanity -= 10 + inv.rankIdx * 3;
    const line = SCARE_LINES[Math.floor(Math.random() * SCARE_LINES.length)];
    logEvent(line, "result-bad");
    updateHud();
  }

  if (inv.time <= 0 || inv.sanity <= 0) {
    inv.time = Math.max(0, inv.time);
    inv.sanity = Math.max(0, inv.sanity);
    endCase(false, "sanity");
  }
}

function triggerAttack() {
  const inv = investigation;
  const name = inv.caseData.yokai.name;
  const sanityLoss = 32 + inv.rankIdx * 6;
  const timeLoss = 14 + inv.rankIdx * 2;
  inv.sanity -= sanityLoss;
  inv.time -= timeLoss;
  logEvent(`『${name}』に襲われた！`, "result-bad");
  updateHud();
  playAttackEffect(name);
  inv.stunnedUntil = performance.now() + 900;

  if (inv.time <= 0 || inv.sanity <= 0) {
    inv.time = Math.max(0, inv.time);
    inv.sanity = Math.max(0, inv.sanity);
    inv.pendingEnd = true;
    updateHud();
    setTimeout(() => { if (!inv.ended) endCase(false, "attack"); }, 700);
  }
}

function playAttackEffect(name) {
  if (!save.settings.attackEffects) return;
  const flash = document.getElementById("fpAttackFlash");
  const text = document.getElementById("fpAttackText");
  const viewport = document.getElementById("fpViewport");
  text.textContent = `『${name}』に襲われた！`;
  flash.classList.remove("play"); void flash.offsetWidth; flash.classList.add("play");
  text.classList.remove("play"); void text.offsetWidth; text.classList.add("play");
  viewport.classList.remove("shake"); void viewport.offsetWidth; viewport.classList.add("shake");
  setTimeout(() => {
    flash.classList.remove("play");
    text.classList.remove("play");
    viewport.classList.remove("shake");
  }, 1200);
}

document.getElementById("btnIdentify").addEventListener("click", () => {
  if (!investigation || investigation.ended) return;
  showScreen("identify");
  renderIdentifyList();
});

document.getElementById("btnCancelIdentify").addEventListener("click", () => showScreen("investigation"));

document.getElementById("btnRetreat").addEventListener("click", () => {
  if (!investigation || investigation.ended) return;
  endCase(false, "retreat");
});

document.getElementById("btnJournalToggle").addEventListener("click", () => {
  document.getElementById("fpJournalPanel").classList.toggle("hidden");
});
document.getElementById("btnJournalClose").addEventListener("click", () => {
  document.getElementById("fpJournalPanel").classList.add("hidden");
});

function renderIdentifyList() {
  const el = document.getElementById("identifyList");
  el.innerHTML = "";
  unlockedRoster().forEach(y => {
    const div = document.createElement("div");
    div.className = "identify-card";
    div.innerHTML = `<div class="name">${y.name}（${y.rank}）</div>
      <div class="evi">${y.evi.map(e => EVIDENCE[e].name).join(" / ")}</div>`;
    div.addEventListener("click", () => {
      showScreen("investigation");
      submitGuess(y);
    });
    el.appendChild(div);
  });
}

function submitGuess(guessYokai) {
  const inv = investigation;
  if (inv.ended) return;
  const correct = guessYokai.id === inv.caseData.yokai.id;
  endCase(correct, "guess", guessYokai);
}

function endCase(success, reason, guessYokai) {
  const inv = investigation;
  if (inv.ended) return;
  inv.ended = true;
  if (animId) { cancelAnimationFrame(animId); animId = null; }
  if (document.pointerLockElement) document.exitPointerLock();
  document.getElementById("fpJournalPanel").classList.add("hidden");

  const base = rewardBase(inv.caseData.yokai.rank);
  let currencyGained = 0;
  let xpGained = 0;
  let title = "";
  const lines = [];

  if (success) {
    const timeFrac = inv.time / inv.timeMax;
    const sanityFrac = inv.sanity / inv.sanityMax;
    const efficiency = 0.7 + 0.3 * ((timeFrac + sanityFrac) / 2);
    const mult = efficiency * (save.seasonPass ? 1.3 : 1.0);
    currencyGained = Math.round(base.currency * mult);
    xpGained = base.xp;
    title = `正体特定成功：${inv.caseData.yokai.name}だった！`;
    lines.push(["判定", "成功", "result-good"]);
    if (!save.discovered.includes(inv.caseData.yokai.id)) {
      save.discovered.push(inv.caseData.yokai.id);
      lines.push(["図鑑", "新規登録！", "result-good"]);
    }
  } else if (reason === "guess") {
    currencyGained = Math.round(base.currency * 0.15);
    xpGained = Math.round(base.xp * 0.4);
    title = `推理失敗……正体は${inv.caseData.yokai.name}だった`;
    lines.push(["判定", `失敗（回答: ${guessYokai.name}）`, "result-bad"]);
  } else if (reason === "attack") {
    currencyGained = Math.round(base.currency * 0.12);
    xpGained = Math.round(base.xp * 0.3);
    title = `『${inv.caseData.yokai.name}』に襲われて意識を失った……`;
    lines.push(["判定", "強制送還（襲撃）", "result-bad"]);
  } else if (reason === "sanity") {
    currencyGained = Math.round(base.currency * 0.1);
    xpGained = Math.round(base.xp * 0.25);
    title = "サニティが尽きて撤退した……";
    lines.push(["判定", "強制撤退", "result-bad"]);
  } else if (reason === "time") {
    currencyGained = Math.round(base.currency * 0.1);
    xpGained = Math.round(base.xp * 0.25);
    title = "制限時間切れ……";
    lines.push(["判定", "タイムアップ", "result-bad"]);
  } else {
    currencyGained = Math.round(base.currency * 0.1);
    xpGained = Math.round(base.xp * 0.2);
    title = "自主的に撤退した";
    lines.push(["判定", "撤退", ""]);
  }

  save.currency += currencyGained;
  addXp(xpGained);
  persist();

  document.getElementById("resultTitle").textContent = title;
  const body = document.getElementById("resultBody");
  body.innerHTML = "";
  lines.forEach(([k, v, cls]) => {
    const div = document.createElement("div");
    div.className = "line" + (cls ? " " + cls : "");
    div.innerHTML = `<span>${k}</span><span>${v}</span>`;
    body.appendChild(div);
  });
  [["獲得 霊符ポイント", `+${currencyGained}`, "result-good"], ["獲得 経験値", `+${xpGained}`, "result-good"]].forEach(([k, v, cls]) => {
    const div = document.createElement("div");
    div.className = "line " + cls;
    div.innerHTML = `<span>${k}</span><span>${v}</span>`;
    body.appendChild(div);
  });

  showScreen("result");
  renderPlayerStats();
}

document.getElementById("btnResultNext").addEventListener("click", () => {
  showScreen("caseselect");
  genCases();
  renderPlayerStats();
});

function addXp(amount) {
  save.xp += amount;
  while (save.xp >= save.xpToNext) {
    save.xp -= save.xpToNext;
    save.level += 1;
    save.xpToNext = Math.round(save.xpToNext * 1.25);
  }
}

/* ============ 移動・視点操作（マウス／タッチ） ============ */

const fpViewport = document.getElementById("fpViewport");
const fpCanvas = document.getElementById("fpCanvas");

function applyControlSide() {
  const isLeft = save.settings.controlSide === "left";
  fpViewport.classList.toggle("ctrl-left", isLeft);
  fpViewport.classList.toggle("ctrl-right", !isLeft);
}

fpViewport.addEventListener("pointerdown", e => {
  if (!investigation || investigation.ended) return;
  if (e.target.closest(".fp-action-cluster, .fp-hotbar, .fp-prompt")) return;
  if (e.pointerType === "mouse") {
    if (fpCanvas.requestPointerLock) {
      const p = fpCanvas.requestPointerLock();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
    return;
  }
  const rect = fpViewport.getBoundingClientRect();
  const localX = e.clientX - rect.left;
  const isRightHalf = localX >= rect.width / 2;
  const moveIsHere = save.settings.controlSide === "left" ? !isRightHalf : isRightHalf;
  if (moveIsHere) {
    touchMove.pointerId = e.pointerId;
    touchMove.originX = e.clientX;
    touchMove.originY = e.clientY;
    touchMove.active = true;
    touchMove.x = 0; touchMove.y = 0;
    positionJoystick(e.clientX - rect.left, e.clientY - rect.top);
  } else {
    touchLook.pointerId = e.pointerId;
    touchLook.lastX = e.clientX;
    touchLook.lastY = e.clientY;
    touchLook.active = true;
  }
});

fpViewport.addEventListener("pointermove", e => {
  if (touchMove.active && e.pointerId === touchMove.pointerId) {
    const dx = e.clientX - touchMove.originX, dy = e.clientY - touchMove.originY;
    const max = 42;
    const len = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(len, max);
    touchMove.x = (dx / len) * (clamped / max);
    touchMove.y = (dy / len) * (clamped / max);
    updateJoystickKnob((dx / len) * clamped, (dy / len) * clamped);
  } else if (touchLook.active && e.pointerId === touchLook.pointerId) {
    const dx = e.clientX - touchLook.lastX;
    touchYawDelta += dx * TOUCH_LOOK_SENS * save.settings.touchSens;
    touchLook.lastX = e.clientX;
    touchLook.lastY = e.clientY;
  }
});

function endTouch(e) {
  if (e.pointerId === touchMove.pointerId) { touchMove.active = false; touchMove.x = 0; touchMove.y = 0; resetJoystick(); }
  if (e.pointerId === touchLook.pointerId) { touchLook.active = false; }
}
fpViewport.addEventListener("pointerup", endTouch);
fpViewport.addEventListener("pointercancel", endTouch);

document.addEventListener("mousemove", e => {
  if (document.pointerLockElement === fpCanvas) {
    mouseYawDelta += e.movementX * MOUSE_SENS * save.settings.mouseSens;
  }
});

function positionJoystick(localX, localY) {
  const base = document.getElementById("fpJoystickBase");
  base.style.left = `${localX}px`;
  base.style.top = `${localY}px`;
  base.classList.remove("hidden");
}
function updateJoystickKnob(dx, dy) {
  document.getElementById("fpJoystickKnob").style.transform = `translate(${dx}px, ${dy}px)`;
}
function resetJoystick() {
  const base = document.getElementById("fpJoystickBase");
  if (base) base.classList.add("hidden");
  const knob = document.getElementById("fpJoystickKnob");
  if (knob) knob.style.transform = "translate(0px, 0px)";
}

/* ============ ショップ ============ */

function renderShop() {
  const toolsEl = document.getElementById("shopTools");
  toolsEl.innerHTML = "";
  Object.entries(TOOLS).forEach(([id, t]) => {
    const owned = save.ownedTools.includes(id);
    const div = document.createElement("div");
    div.className = "card shop-item";
    div.innerHTML = `
      <div class="name">${t.name}</div>
      <div class="desc">対応証拠: ${Object.entries(EVIDENCE).filter(([,e]) => e.tool === id).map(([,e]) => e.name).join(" / ")}</div>
      <div class="price">${owned ? "所持済み" : `霊符 ${t.price}`}</div>
      <button class="secondary-btn" ${owned ? "disabled" : ""}>${owned ? "購入済み" : "購入する"}</button>
    `;
    if (!owned) {
      div.querySelector("button").addEventListener("click", () => {
        if (save.currency < t.price) { alert("霊符ポイントが足りません。"); return; }
        save.currency -= t.price;
        save.ownedTools.push(id);
        persist();
        renderShop();
        renderPlayerStats();
      });
    }
    toolsEl.appendChild(div);
  });

  const consEl = document.getElementById("shopConsumables");
  consEl.innerHTML = "";
  Object.entries(CONSUMABLES).forEach(([id, c]) => {
    const div = document.createElement("div");
    div.className = "card shop-item";
    div.innerHTML = `
      <div class="name">${c.name}（所持: ${save.consumables[id] || 0}）</div>
      <div class="desc">${c.desc}</div>
      <div class="price">霊符 ${c.price}</div>
      <button class="secondary-btn">購入する</button>
    `;
    div.querySelector("button").addEventListener("click", () => {
      if (save.currency < c.price) { alert("霊符ポイントが足りません。"); return; }
      save.currency -= c.price;
      save.consumables[id] = (save.consumables[id] || 0) + 1;
      persist();
      renderShop();
      renderPlayerStats();
    });
    consEl.appendChild(div);
  });
}

/* ============ 図鑑 ============ */

function renderZukan() {
  const el = document.getElementById("zukanGrid");
  el.innerHTML = "";
  ROSTER.forEach((y, i) => {
    const unlocked = i < unlockedYokaiCount();
    const discovered = save.discovered.includes(y.id);
    const div = document.createElement("div");
    div.className = "card zukan-card" + (unlocked ? "" : " locked");
    if (!unlocked) {
      const requiredLevel = Math.max(1, i - 1);
      div.innerHTML = `<div class="name">？？？</div><div class="rank">Lv${requiredLevel}で解放</div>`;
    } else {
      div.innerHTML = `
        <div class="name">${y.name}</div>
        <div class="rank">RANK ${y.rank}${discovered ? " ・ 発見済み" : ""}</div>
        <div class="evi">${discovered ? y.flavor : "証拠: " + y.evi.map(e => EVIDENCE[e].name).join(" / ")}</div>
      `;
    }
    el.appendChild(div);
  });
}

/* ============ ストア（課金モック） ============ */

const SKIN_POOL = ["護符・桜柄", "護符・墨絵", "護符・金箔", "護符・夜光", "護符・和紙", "護符・雷紋"];

function renderStore() {
  document.getElementById("adsStatus").textContent = save.adsRemoved ? "購入済み" : "";
  document.getElementById("passStatus").textContent = save.seasonPass ? "加入中" : "";
  document.getElementById("btnRemoveAds").disabled = save.adsRemoved;
  document.getElementById("btnSeasonPass").disabled = save.seasonPass;

  const skinList = document.getElementById("skinList");
  skinList.innerHTML = "";
  save.skins.forEach(s => {
    const chip = document.createElement("div");
    chip.className = "skin-chip";
    chip.textContent = s;
    skinList.appendChild(chip);
  });
  document.getElementById("gachaResult").textContent = "";
}

document.getElementById("btnWatchAd").addEventListener("click", () => {
  save.currency += 50;
  persist();
  renderPlayerStats();
  alert("（デモ）広告視聴が完了しました。霊符+50を獲得！");
});

document.getElementById("btnRemoveAds").addEventListener("click", () => {
  save.adsRemoved = true;
  persist();
  renderStore();
  alert("（デモ）広告除去を購入しました。実際の決済は発生していません。");
});

document.getElementById("btnSeasonPass").addEventListener("click", () => {
  save.seasonPass = true;
  persist();
  renderStore();
  alert("（デモ）シーズンパスに加入しました。依頼報酬が1.3倍になります。");
});

document.querySelectorAll(".buy-gems").forEach(btn => {
  btn.addEventListener("click", () => {
    save.gems += Number(btn.dataset.gems);
    persist();
    renderPlayerStats();
    alert(`（デモ）勾玉ジェムを${btn.dataset.gems}個獲得しました。実際の決済は発生していません。`);
  });
});

document.getElementById("btnGacha").addEventListener("click", () => {
  const cost = 30;
  if (save.gems < cost) { alert("勾玉ジェムが足りません。"); return; }
  save.gems -= cost;
  const pull = SKIN_POOL[Math.floor(Math.random() * SKIN_POOL.length)];
  const dup = save.skins.includes(pull);
  if (!dup) save.skins.push(pull);
  persist();
  renderPlayerStats();
  document.getElementById("gachaResult").textContent = dup
    ? `「${pull}」が出た（重複のため霊符+20に変換）`
    : `「${pull}」を獲得！（コスメティックのみ、効果に差はありません）`;
  if (dup) { save.currency += 20; persist(); }
  renderStore();
});

/* ============ 設定 ============ */

function renderSettings() {
  const cs = save.settings;
  document.querySelectorAll("#settingControlSide .seg-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.value === cs.controlSide);
  });
  document.getElementById("settingMouseSens").value = cs.mouseSens;
  document.getElementById("settingMouseSensVal").textContent = `${cs.mouseSens.toFixed(1)}x`;
  document.getElementById("settingTouchSens").value = cs.touchSens;
  document.getElementById("settingTouchSensVal").textContent = `${cs.touchSens.toFixed(1)}x`;
  document.getElementById("settingFov").value = cs.fovDeg;
  document.getElementById("settingFovVal").textContent = `${cs.fovDeg}°`;
  const effBtn = document.getElementById("settingAttackEffects");
  effBtn.textContent = cs.attackEffects ? "有効" : "無効";
  effBtn.classList.toggle("on", cs.attackEffects);
}

document.querySelectorAll("#settingControlSide .seg-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    save.settings.controlSide = btn.dataset.value;
    persist();
    applyControlSide();
    renderSettings();
  });
});

document.getElementById("settingMouseSens").addEventListener("input", e => {
  save.settings.mouseSens = Number(e.target.value);
  persist();
  document.getElementById("settingMouseSensVal").textContent = `${save.settings.mouseSens.toFixed(1)}x`;
});
document.getElementById("settingTouchSens").addEventListener("input", e => {
  save.settings.touchSens = Number(e.target.value);
  persist();
  document.getElementById("settingTouchSensVal").textContent = `${save.settings.touchSens.toFixed(1)}x`;
});
document.getElementById("settingFov").addEventListener("input", e => {
  save.settings.fovDeg = Number(e.target.value);
  persist();
  document.getElementById("settingFovVal").textContent = `${save.settings.fovDeg}°`;
});
document.getElementById("settingAttackEffects").addEventListener("click", () => {
  save.settings.attackEffects = !save.settings.attackEffects;
  persist();
  renderSettings();
});
document.getElementById("btnResetSave").addEventListener("click", () => {
  if (!confirm("セーブデータをリセットします。よろしいですか？")) return;
  localStorage.removeItem(SAVE_KEY);
  save = defaultSave();
  persist();
  renderPlayerStats();
  renderSettings();
  applyControlSide();
  showScreen("caseselect");
  genCases();
});

/* ============ 初期化 ============ */

renderPlayerStats();
genCases();
