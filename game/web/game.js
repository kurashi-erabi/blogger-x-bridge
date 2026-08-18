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

const ROOM_POOL = ["客間", "廊下", "台所", "浴室", "庭", "蔵", "二階の寝室", "神棚の間", "地下室", "図書室", "縁側", "納戸"];

const RANK_INDEX = (r) => RANKS.indexOf(r);

const SCARE_LINES = [
  "ふすまが独りでに動いた……",
  "冷たい視線を感じる。",
  "どこかでラップ音が響いた。",
  "耳元で誰かが囁いた気がした。",
  "灯りが一瞬だけ揺れた。",
  "背後に気配を感じ、思わず振り返った。",
];

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
  // Lv1 -> 3体、以降レベル毎に+1体（最大ロースター数まで）
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
}

navBtns.forEach(b => b.addEventListener("click", () => {
  showScreen(b.dataset.nav);
  if (b.dataset.nav === "shop") renderShop();
  if (b.dataset.nav === "zukan") renderZukan();
  if (b.dataset.nav === "store") renderStore();
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
      <div class="hint">部屋数: ${c.rooms.length}</div>
      <div class="reward">推定報酬: 霊符 ${r.currency} / XP ${r.xp}</div>
      <button class="primary-btn">調査を開始する</button>
    `;
    div.querySelector("button").addEventListener("click", () => startCase(i));
    el.appendChild(div);
  });
}

document.getElementById("rerollCases").addEventListener("click", genCases);

/* ============ 調査フェーズ ============ */

let investigation = null;

function startCase(idx) {
  const c = currentCases[idx];
  const rankIdx = RANK_INDEX(c.yokai.rank);

  const clueRooms = shuffle(c.rooms).slice(0, c.yokai.evi.length);
  const roomEvidence = {};
  clueRooms.forEach((room, i) => { roomEvidence[room] = c.yokai.evi[i]; });

  let timeLimit = 130 - rankIdx * 8;
  let sanityMax = 100;
  if (save.consumables.timeAmulet > 0) { timeLimit += 20; save.consumables.timeAmulet--; }
  const charmActive = save.consumables.charm > 0;
  if (charmActive) save.consumables.charm--;
  persist();

  investigation = {
    caseData: c,
    rankIdx,
    roomEvidence,
    searchedRooms: new Set(),
    foundEvidence: new Set(),
    selectedTool: null,
    time: timeLimit,
    timeMax: timeLimit,
    sanity: sanityMax,
    sanityMax,
    charmActive,
    timer: null,
    ended: false,
  };

  showScreen("investigation");
  renderInvestigation();
  logEvent(`${c.location}に到着した。調査を開始する。`, "");

  investigation.timer = setInterval(tickTime, 1000);
}

function tickTime() {
  if (!investigation || investigation.ended) return;
  investigation.time -= 1;
  investigation.sanity -= 0.15;
  if (investigation.time <= 0 || investigation.sanity <= 0) {
    investigation.time = Math.max(0, investigation.time);
    investigation.sanity = Math.max(0, investigation.sanity);
    updateHud();
    endCase(false, "time");
    return;
  }
  updateHud();
}

function updateHud() {
  const inv = investigation;
  document.getElementById("timeBar").style.width = `${(inv.time / inv.timeMax) * 100}%`;
  document.getElementById("sanityBar").style.width = `${(inv.sanity / inv.sanityMax) * 100}%`;
}

function logEvent(text, cls) {
  const el = document.getElementById("eventLog");
  el.textContent = text;
  el.className = "event-log" + (cls ? " " + cls : "");
}

function renderInvestigation() {
  const inv = investigation;
  updateHud();

  const roomGrid = document.getElementById("roomGrid");
  roomGrid.innerHTML = "";
  inv.caseData.rooms.forEach(room => {
    const div = document.createElement("div");
    const searched = inv.searchedRooms.has(room);
    div.className = "room-tile" + (searched ? " searched" : "");
    div.textContent = room;
    div.addEventListener("click", () => searchRoom(room));
    roomGrid.appendChild(div);
  });

  const belt = document.getElementById("toolBelt");
  belt.innerHTML = "";
  save.ownedTools.forEach(toolId => {
    const chip = document.createElement("div");
    chip.className = "tool-chip" + (inv.selectedTool === toolId ? " selected" : "");
    chip.textContent = TOOLS[toolId].name;
    chip.addEventListener("click", () => {
      inv.selectedTool = (inv.selectedTool === toolId) ? null : toolId;
      renderInvestigation();
    });
    belt.appendChild(chip);
  });

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
  if (inv.ended || inv.searchedRooms.has(room)) return;
  if (!inv.selectedTool) {
    logEvent("道具を選んでから部屋を調べてください。", "");
    return;
  }

  inv.searchedRooms.add(room);
  inv.time -= 9;
  inv.sanity -= (6 + inv.rankIdx) * (inv.charmActive ? 0.6 : 1);

  const evidenceKey = inv.roomEvidence[room];
  if (evidenceKey && EVIDENCE[evidenceKey].tool === inv.selectedTool && !inv.foundEvidence.has(evidenceKey)) {
    inv.foundEvidence.add(evidenceKey);
    logEvent(`「${room}」で${EVIDENCE[evidenceKey].name}を検出した！`, "result-good");
    document.querySelectorAll(".room-tile").forEach(t => { if (t.textContent === room) t.classList.add("has-clue"); });
  } else if (evidenceKey && EVIDENCE[evidenceKey].tool !== inv.selectedTool) {
    logEvent(`「${room}」で反応があったが、道具が合っていないようだ……`, "");
  } else {
    logEvent(`「${room}」を調べたが、特に異常はなかった。`, "");
  }

  const scareChance = 0.06 + inv.rankIdx * 0.035;
  if (Math.random() < scareChance) {
    inv.sanity -= 10 + inv.rankIdx * 3;
    const line = SCARE_LINES[Math.floor(Math.random() * SCARE_LINES.length)];
    logEvent(line, "result-bad");
  }

  if (inv.time <= 0 || inv.sanity <= 0) {
    inv.time = Math.max(0, inv.time);
    inv.sanity = Math.max(0, inv.sanity);
    renderInvestigation();
    endCase(false, "sanity");
    return;
  }

  renderInvestigation();
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
  clearInterval(inv.timer);

  const base = rewardBase(inv.caseData.yokai.rank);
  let currencyGained = 0;
  let xpGained = 0;
  let title = "";
  const lines = [];

  if (success) {
    const timeFrac = inv.time / inv.timeMax;
    const sanityFrac = inv.sanity / inv.sanityMax;
    const efficiency = 0.7 + 0.3 * ((timeFrac + sanityFrac) / 2);
    let mult = efficiency * (save.seasonPass ? 1.3 : 1.0);
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

/* ============ 初期化 ============ */

renderPlayerStats();
genCases();
