/* 清邁旅行 App — 主程式（資料在 data.js）
 * © 2026 YaoyaoWeng. All rights reserved.
 * 本程式的設計、程式碼與內容版權歸 YaoyaoWeng 所有，未經授權請勿複製、轉載或商業使用。 */
"use strict";
const $ = (s, el = document) => el.querySelector(s);
const ic = (n) => ICONS[n] || ICONS.pin;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const WK = ["日", "一", "二", "三", "四", "五", "六"];
const md = (iso) => { const [, m, d] = iso.split("-"); return `${+m}/${+d}`; };
const wk = (iso) => WK[new Date(iso + "T12:00:00").getDay()];
const fmt = (n) => Math.round(n).toLocaleString("en-US");

/* ---------- 本機儲存 ---------- */
const LS = {
  k: (k) => `${TRIP.id}:${k}`,
  get(k, d) { try { const v = localStorage.getItem(this.k(k)); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(this.k(k), JSON.stringify(v)); } catch {} }
};

/* ---------- 今天是第幾天（網址加 ?today=2026-11-22 可測試） ---------- */
function todayISO() {
  const q = new URLSearchParams(location.search).get("today");
  if (q) return q;
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}
function tripPhase() {
  const t = todayISO();
  if (t < TRIP.start) return { phase: "before", days: Math.round((new Date(TRIP.start) - new Date(t)) / 864e5) };
  if (t > TRIP.end) return { phase: "after" };
  return { phase: "during", day: TRIP.days.find((d) => d.date === t) };
}

/* ---------- 同步（Firebase Firestore REST，離線先存本機） ---------- */
const Sync = {
  cols: ["expenses", "checks", "meta", "places", "bookings"],
  status: "local", last: null, timer: null, busy: false,
  cfg() { return LS.get("sync", null); },
  docs(col) { return LS.get("docs:" + col, {}); },
  saveDocs(col, o) { LS.set("docs:" + col, o); },
  pending() { return LS.get("pending", []); },
  put(col, rec) {
    rec.updatedAt = Date.now();
    const all = this.docs(col); all[rec.id] = rec; this.saveDocs(col, all);
    const p = this.pending(); const key = col + "/" + rec.id;
    if (!p.includes(key)) { p.push(key); LS.set("pending", p); }
    this.soon();
  },
  list(col) { return Object.values(this.docs(col)).filter((r) => !r.deleted); },
  get(col, id) { const r = this.docs(col)[id]; return r && !r.deleted ? r : null; },
  soon() { clearTimeout(this.timer); this.timer = setTimeout(() => this.run(), 600); },
  base(c) { return (c.base || "https://firestore.googleapis.com") + `/v1/projects/${encodeURIComponent(c.p)}/databases/(default)/documents/trips/${encodeURIComponent(c.t)}`; },
  async run() {
    const c = this.cfg();
    if (!c) { this.setStatus("local"); return; }
    if (!navigator.onLine) { this.setStatus("offline"); return; }
    if (this.busy) return; this.busy = true;
    let changed = false;
    try {
      // 1. 上傳本機尚未同步的資料
      for (const key of this.pending()) {
        const [col, id] = key.split("/");
        const rec = this.docs(col)[id]; if (!rec) continue;
        const r = await fetch(`${this.base(c)}/${col}/${encodeURIComponent(id)}?key=${encodeURIComponent(c.k)}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(rec) }, updatedAt: { integerValue: String(rec.updatedAt) } } })
        });
        if (!r.ok) throw new Error("push " + r.status);
        LS.set("pending", this.pending().filter((x) => x !== key));
      }
      // 2. 下載對方的資料
      for (const col of this.cols) {
        let token = "", local = this.docs(col);
        const pend = this.pending();
        do {
          const r = await fetch(`${this.base(c)}/${col}?pageSize=300&key=${encodeURIComponent(c.k)}${token ? "&pageToken=" + token : ""}`);
          if (!r.ok) throw new Error("pull " + r.status);
          const j = await r.json();
          for (const d of j.documents || []) {
            let rec; try { rec = JSON.parse(d.fields.json.stringValue); } catch { continue; }
            const cur = local[rec.id];
            if (pend.includes(col + "/" + rec.id)) continue;
            if (!cur || (rec.updatedAt || 0) > (cur.updatedAt || 0)) { local[rec.id] = rec; changed = true; }
          }
          token = j.nextPageToken || "";
        } while (token);
        this.saveDocs(col, local);
      }
      this.last = new Date(); this.setStatus("ok");
    } catch (e) {
      console.warn(e); this.setStatus(navigator.onLine ? "err" : "offline");
    } finally { this.busy = false; }
    if (changed) render(true);
  },
  setStatus(s) { this.status = s; document.querySelectorAll(".syncbar").forEach((el) => (el.outerHTML = syncBar())); }
};
function syncBar() {
  const s = Sync.status, t = Sync.last ? Sync.last.toTimeString().slice(0, 5) : "";
  const m = { local: ["", "只存在這支手機（到「設定」開啟同步）"], ok: ["ok", `已同步 ${t}`], offline: ["off", "離線中，連上網路後自動同步"], err: ["err", "同步失敗，稍後自動重試"] }[s];
  return `<div class="syncbar"><i class="dot ${m[0]}"></i>${m[1]}${s !== "local" ? ` <button onclick="Sync.run()" style="margin-left:auto;color:var(--green)">${ic("sync")}</button>` : ""}</div>`;
}
window.addEventListener("online", () => Sync.run());
document.addEventListener("visibilitychange", () => { if (!document.hidden) Sync.run(); });
setInterval(() => { if (!document.hidden) Sync.run(); }, 20000);

/* ---------- 旅伴名字（同步） ---------- */
function people() { return (Sync.get("meta", "people") || {}).names || LS.get("names", ["我", "旅伴"]); }

/* ---------- 照片／憑證（IndexedDB，只存在本機） ---------- */
const DB = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((ok, no) => {
      const r = indexedDB.open(TRIP.id, 1);
      r.onupgradeneeded = () => { r.result.createObjectStore("photos", { keyPath: "id" }); r.result.createObjectStore("vouchers", { keyPath: "id" }); };
      r.onsuccess = () => ok((this.db = r.result)); r.onerror = () => no(r.error);
    });
  },
  async tx(store, mode, fn) { const db = await this.open(); return new Promise((ok, no) => { const t = db.transaction(store, mode); const s = t.objectStore(store); const r = fn(s); t.oncomplete = () => ok(r && r.result); t.onerror = () => no(t.error); }); },
  all(store) { return this.tx(store, "readonly", (s) => s.getAll()); },
  get(store, id) { return this.tx(store, "readonly", (s) => s.get(id)); },
  put(store, v) { return this.tx(store, "readwrite", (s) => s.put(v)); },
  del(store, id) { return this.tx(store, "readwrite", (s) => s.delete(id)); }
};
function shrink(file, max = 1600) {
  return new Promise((ok) => {
    const img = new Image(); const u = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = img.width * s; c.height = img.height * s;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
      c.toBlob((b) => ok(b || file), "image/jpeg", 0.85);
    };
    img.onerror = () => ok(file); img.src = u;
  });
}
function pickFiles(multiple) {
  return new Promise((ok) => { const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.multiple = !!multiple; i.onchange = () => ok([...i.files]); i.click(); });
}

/* ---------- 小工具 ---------- */
function ask(msg, ok = "確定") {
  return new Promise((res) => {
    const m = sheet(`<h3>${esc(msg)}</h3><div class="btnrow"><button class="btn ghost" data-a="n">取消</button><button class="btn red" data-a="y">${esc(ok)}</button></div>`, (el, close) => {
      el.querySelector('[data-a="n"]').onclick = () => { close(); res(false); };
      el.querySelector('[data-a="y"]').onclick = () => { close(); res(true); };
    });
    m.addEventListener("click", (e) => { if (e.target === m) res(false); });
  });
}
function toast(t) { const d = document.createElement("div"); d.className = "toast"; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2000); }
function sheet(html, onMount) {
  const m = document.createElement("div"); m.className = "mask";
  m.innerHTML = `<div class="sheet">${html}</div>`;
  m.addEventListener("click", (e) => { if (e.target === m) m.remove(); });
  document.body.appendChild(m); onMount && onMount(m.firstChild, () => m.remove()); return m;
}
const mapsSearch = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const placeLink = (p) => (p && p.url) || mapsSearch((p && (p.q || p.name)) || "");
const mapsDir = (o, d, w = []) => `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(o)}&destination=${encodeURIComponent(d)}${w.length ? "&waypoints=" + encodeURIComponent(w.join("|")) : ""}&travelmode=driving`;
function hdr(icon, zh, en) {
  return `<div class="hdr"><img class="deco" src="img/temple.webp" alt=""><i class="lan l1"></i><i class="lan l2"></i>
    <button class="back" onclick="goBack()" aria-label="上一頁">${ic("back")}</button><div class="hi">${ic(icon)}</div>
    <div class="ht"><h1>${zh}</h1><div class="en">${en}</div></div>
    <a class="homebtn" href="#home" aria-label="回首頁">${ic("home")}</a></div>`;
}
const NAV = { stack: [], prev: location.hash || "#home", backing: false };
window.addEventListener("hashchange", () => { if (NAV.backing) NAV.backing = false; else NAV.stack.push(NAV.prev); NAV.prev = location.hash || "#home"; });
function goBack() { if (NAV.stack.length) { NAV.backing = true; NAV.stack.pop(); history.back(); } else location.hash = "#home"; }

/* ---------- 匯率 ---------- */
function rate() { return LS.get("rate", { v: TRIP.defaultRate }).v; }
async function refreshRate() {
  const r = LS.get("rate", null);
  if (r && r.auto && Date.now() - r.t < 6 * 3600e3) return;
  if (r && r.manual) return;
  try {
    const j = await (await fetch(`https://open.er-api.com/v6/latest/${TRIP.currencyCode}`)).json();
    const v = j.rates && j.rates[TRIP.homeCurrency];
    if (v) LS.set("rate", { v, t: Date.now(), auto: true });
  } catch {}
}

/* ---------- 天氣 ---------- */
const WMO = (c) => c === 0 ? ["sun", "晴"] : c <= 2 ? ["cloudsun", "晴時多雲"] : c === 3 ? ["cloud", "多雲"] : c <= 48 ? ["cloud", "有霧"] : c <= 67 || (c >= 80 && c <= 82) ? ["rain", "有雨"] : c >= 95 ? ["rain", "雷雨"] : ["cloud", "多雲"];
async function loadWeather() {
  const w = TRIP.weather;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${w.lat}&longitude=${w.lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FBangkok&forecast_days=16`;
  try {
    const j = await (await fetch(url)).json();
    if (!j.daily) return;
    const days = j.daily.time.map((t, i) => [t, Math.round(j.daily.temperature_2m_max[i]), Math.round(j.daily.temperature_2m_min[i]), WMO(j.daily.weather_code[i])[0], j.daily.precipitation_probability_max[i]]);
    const old = LS.get("weather", { days: [] });
    const merged = Object.fromEntries(old.days.map((d) => [d[0], d])); days.forEach((d) => (merged[d[0]] = d));
    LS.set("weather", { t: Date.now(), cur: j.current ? [Math.round(j.current.temperature_2m), j.current.weather_code] : null, days: Object.values(merged) });
    render(true);
  } catch {}
}
function weatherFor(iso) {
  const w = LS.get("weather", { days: [] }).days.find((d) => d[0] === iso);
  if (w) return { hi: w[1], lo: w[2], ic: w[3], rain: w[4], live: true };
  const f = TRIP.weatherFallback.find((d) => d[0] === iso);
  return f ? { hi: f[1], lo: f[2], ic: f[3], live: false } : null;
}

/* =====================================================================
   畫面
   ===================================================================== */
const V = {};
/* ---------- 行程資料（可編輯，存本機＋同步） ---------- */
const T = (k) => TRIP.types[k] || TRIP.types.other;
const toMin = (t) => { if (!t) return null; const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function defaultDays() {
  return JSON.parse(JSON.stringify(TRIP.days)).map((d) => ({ ...d, stops: d.stops.map((s, i) => ({ id: `s${d.d}_${i}`, ...s })) }));
}
function itin() { const r = Sync.get("meta", "itin"); return r && Array.isArray(r.days) ? r.days : defaultDays(); }
function saveItin(days) { Sync.put("meta", { id: "itin", days, base: TRIP.itinVersion }); }
function dayOf(n, days = itin()) { return days.find((d) => d.d === +n) || days[0]; }
function timeText(s) { return s.t ? `${s.approx ? "約 " : ""}${s.t}${s.end ? "–" + s.end : ""}` : ""; }
function curDayN() { const p = tripPhase(); return p.phase === "during" && p.day ? p.day.d : null; }
function nowMin() { const q = new URLSearchParams(location.search).get("now"); if (q) return toMin(q); const n = new Date(); return n.getHours() * 60 + n.getMinutes(); }
// 今天的「進行中／下一站」
function liveStatus(day) {
  if (day.date !== todayISO()) return {};
  const n = nowMin(), st = day.stops, out = {};
  for (let i = 0; i < st.length; i++) {
    const a = toMin(st[i].t); if (a == null) continue;
    let b = toMin(st[i].end); if (b == null) { const nx = st.slice(i + 1).find((x) => x.t); b = nx ? toMin(nx.t) : a + 60; }
    if (n >= a && n < b) { out[st[i].id] = "now"; }
    else if (a > n && !Object.values(out).includes("next")) { out[st[i].id] = "next"; break; }
  }
  return out;
}
function bkLines(b) {
  if (b.type === "stay" && b.checkin && b.checkout) { const n = Math.round((new Date(b.checkout) - new Date(b.checkin)) / 864e5); return [`${md(b.checkin)} – ${md(b.checkout)}（${n} 晚）`].concat(b.note ? [b.note] : []); }
  return [`${b.date ? md(b.date) : "日期未定"}${b.t ? "・" + b.t : ""}${b.end ? " – " + b.end : ""}`].concat(b.note ? [b.note] : []);
}
function bookings() {
  const ov = Sync.docs("bookings"), ids = new Set(TRIP.bookings.map((b) => b.id));
  const out = TRIP.bookings.map((b) => (ov[b.id] ? { ...b, ...ov[b.id] } : b)).concat(Object.values(ov).filter((r) => !ids.has(r.id))).filter((b) => !b.deleted);
  return out.map((b) => ({ ...b, img: TRIP.bookingImg[b.id] || (TRIP.bookingTypes[b.type] || [])[2] || "img/b_car.jpg", lines: bkLines(b) }))
    .sort((a, b) => ((a.date || a.checkin || "9") + (a.t || (a.type === "stay" ? "23:59" : "12:00"))).localeCompare((b.date || b.checkin || "9") + (b.t || (b.type === "stay" ? "23:59" : "12:00"))));
}
function choose(msg, opts) {
  return new Promise((res) => {
    const m = sheet(`<h3>${esc(msg)}</h3><div class="choices">${opts.map(([v, l, cls]) => `<button class="btn ${cls || "ghost"}" data-v="${v}">${l}</button>`).join("")}<button class="btn ghost" data-v="">取消</button></div>`, (el, close) => {
      el.querySelectorAll("button").forEach((b) => (b.onclick = () => { close(); res(b.dataset.v); }));
    });
    m.addEventListener("click", (e) => { if (e.target === m) res(""); });
  });
}
function hotelFor(date) { return bookings().find((b) => b.type === "stay" && b.checkin <= date && date < b.checkout); }
function bkDone(id) { const b = bookings().find((x) => x.id === id); const r = Sync.get("checks", "bk_" + id); return r ? !!r.v : !!(b && b.done); }
function placeUses(pid) { const out = []; itin().forEach((d) => d.stops.forEach((s) => { if (s.place === pid) out.push({ d: d.d, t: s.t }); })); return out; }
const KW_IMG = [[/天燈/, "img/b_lantern.jpg"], [/瀑布|ATV|漂流/, "img/d2.jpg"], [/SPA|按摩/, "img/b_spa.jpg"], [/咖啡|早餐/, "img/a3.jpg"], [/機場|起飛|CNX|TPE/, "img/b_plane.jpg"], [/夜市|市場/, "img/f4.jpg"], [/入住|飯店/, "img/b_hotel1.jpg"], [/包車|出發/, "img/b_car.jpg"], [/古城/, "img/a5.jpg"]];
function artImg(s) { return stopImg(s) || (KW_IMG.find(([re]) => re.test(s.title + (s.sub || ""))) || [])[1]; }
function stopImg(s) { const p = s.place && TRIP.places[s.place]; return p && p.img; }
function stopRow(s, st, edit, d, i, n) {
  const ty = T(s.type), img = stopArt(s), live = st[s.id];
  return `<div class="stop ${s.hi || s.type === "massage" ? "pink" : ""} ${live ? "live-" + live : ""}" style="--c:${ty.color};--b:${ty.bg}" ${edit ? "" : `onclick="openStop(${d},'${s.id}')"`}>
    <span class="dot"></span>
    <span class="tyi">${ic(ty.icon)}</span>
    <div class="tx">${s.t ? `<span class="t">${timeText(s)}</span>` : ""}<b>${esc(s.title)}</b>${live ? `<span class="pill live">${live === "now" ? "進行中" : "下一站"}</span>` : ""}
      ${s.sub ? `<small>${esc(s.sub)}</small>` : ""}</div>
    ${edit ? `<span class="ctl"><button onclick="mvStop(${d},${i},-1)" ${i === 0 ? "disabled" : ""}>${ic("up")}</button><button onclick="mvStop(${d},${i},1)" ${i === n - 1 ? "disabled" : ""}>${ic("down")}</button><button onclick="editStop(${d},'${s.id}')">${ic("edit")}</button><button class="del" onclick="delStop(${d},'${s.id}')">${ic("trash")}</button></span>`
      : img ? `<img class="thumb" src="${img}" alt="">` : ""}
  </div>`;
}

/* ---------- 倒數 ---------- */
function nowDate() { const q = new URLSearchParams(location.search).get("today"); const n = new Date(); if (!q) return n; const [y, m, d] = q.split("-").map(Number); return new Date(y, m - 1, d, n.getHours(), n.getMinutes(), n.getSeconds()); }
function dleft(iso) { const [y, m, d] = iso.split("-").map(Number); const t = nowDate(); return Math.round((new Date(y, m - 1, d) - new Date(t.getFullYear(), t.getMonth(), t.getDate())) / 864e5); }
function cdBadge(iso) { const n = dleft(iso); return n > 0 ? `<em class="cd">倒數 ${n} 天</em>` : n === 0 ? `<em class="cd now">就是今天</em>` : `<em class="cd done">已完成 ✓</em>`; }
function cdParts() {
  const [y, mo, d] = TRIP.start.split("-").map(Number); let ms = Math.max(0, new Date(y, mo - 1, d) - nowDate());
  const D = Math.floor(ms / 864e5); ms -= D * 864e5; const H = Math.floor(ms / 36e5); ms -= H * 36e5; const M = Math.floor(ms / 6e4); const S = Math.floor((ms - M * 6e4) / 1000);
  return [D, H, M, S];
}
setInterval(() => { const el = document.getElementById("cdclock"); if (!el) return; const p = cdParts(); el.querySelectorAll("b").forEach((b, i) => (b.textContent = String(p[i]).padStart(i ? 2 : 1, "0"))); }, 1000);

/* ---------- 首頁 ---------- */
V.home = () => {
  const name = LS.get("owner", ""), p = tripPhase(), days = itin();
  let today;
  if (p.phase === "before") {
    const todo = checkItems().find((x) => !x.v), pend = bookings().filter((b) => !bkDone(b.id)).length, cp = cdParts();
    today = `<div class="lbl">${ic("today")} 距離出發 ${md(TRIP.start)}（${wk(TRIP.start)}）</div>
      <div class="cdbox" id="cdclock">${["天", "時", "分", "秒"].map((u, i) => `<div><b>${String(cp[i]).padStart(i ? 2 : 1, "0")}</b><span>${u}</span></div>`).join("")}</div>
      <div class="row">${pend ? `<a class="pill w" href="#booking">${ic("info")} 待確認預訂 ${pend} 項</a>` : `<span class="pill">${ic("ok")} 預訂都確認了</span>`}<a class="pill gold" href="#day-1">${ic("cal")} 第一天：${esc(itin()[0].title)}</a></div>
      ${todo ? `<a class="nxt" href="#checklist">${ic("check")}<span>還沒完成：${esc(todo.text)}</span>${ic("right")}</a>` : `<div class="nxt">${ic("ok")} 出發準備全部完成 🎉</div>`}`;
  } else if (p.phase === "during" && p.day) {
    const d = dayOf(p.day.d, days), live = liveStatus(d), w = weatherFor(d.date);
    const cur = d.stops.find((s) => live[s.id] === "now"), nx = d.stops.find((s) => live[s.id] === "next");
    const show = cur || nx;
    today = `<div class="lbl">${ic("today")} 今天 D${d.d}・${md(d.date)}（${wk(d.date)}）</div><h3>${esc(d.title)}</h3>
      <div class="row">${w ? `<span class="pill">${ic(w.ic)} ${w.hi}° / ${w.lo}°</span>` : ""}${hotelFor(d.date) ? `<span class="pill y">${ic("bed")} ${esc(hotelFor(d.date).title)}</span>` : ""}</div>
      <a class="nxt" href="#day-${d.d}">${ic(show ? T(show.type).icon : "route")}<span>${show ? `${cur ? "進行中" : "下一站"}：${show.t ? show.t + " " : ""}${esc(show.title)}` : "今天的行程都完成了，好好休息 ♡"}</span>${ic("right")}</a>`;
  } else today = `<div class="lbl">${ic("today")} 旅程結束</div><h3>回顧這趟美好的旅行吧 ♡</h3><a class="nxt" href="#album">${ic("album")}<span>打開旅行相冊</span>${ic("right")}</a>`;
  const hotels = bookings().filter((b) => b.type === "stay").length;
  const massages = days.reduce((n, d) => n + d.stops.filter((s) => s.type === "massage").length, 0);
  const tiles = [["#day", "cal", "每日行程", "Itinerary", "#e6ecd2", "#5f7431"], ["#map", "map", "路線地圖", "Map", "#dfeaf3", "#4f7ea8"], ["#checklist", "check", "出發準備", "Checklist", "#f5ecc9", "#a07b16"],
    ["#booking", "ticket", "預訂票券", "Booking", "#f8e0e2", "#c2566b"], ["#budget", "wallet", "旅費紀錄", "Budget", "#f6e6cf", "#b8762f"], ["#outfit", "shirt", "服裝穿搭", "Outfit", "#ece4f4", "#7a5aa6"],
    ["#weather", "weather", "天氣預報", "Weather", "#e0eef2", "#3f8aa0"], ["#guide", "food", "推薦指南", "Guide", "#f9e3d3", "#c8692f"], ["#album", "album", "旅行相冊", "Album", "#f6e1ea", "#b0507a"]];
  const recos = TRIP.guideTabs.filter(([k]) => ["food", "shop", "massage"].includes(k)).map(([k, z, i]) => `<a class="reco" href="#guide-${k}"><b>${ic(i)} ${z}</b>${Object.entries(TRIP.places).filter(([, p]) => p.guide === k).slice(0, 3).map(([, p]) => `<span>${ic("ok")}${esc(p.name)}</span>`).join("")}</a>`).join("");
  return `<div class="page home">
    <div class="hero">
      <img class="umb" src="img/umbrella.webp" alt=""><img class="tmp" src="img/temple.webp" alt="">
      <i class="lan" style="left:52%;top:30px"></i><i class="lan" style="left:66%;top:84px;--s:.7;animation-delay:-2s"></i><i class="lan" style="left:40%;top:96px;--s:.55;animation-delay:-4s"></i>
      <div class="top"><button onclick="location.hash='#setup'" aria-label="設定">${ic("menu")}</button><button onclick="remind()" aria-label="提醒">${ic("bell")}</button></div>
      <div class="htxt">
        ${name ? `<div class="who">${esc(name)}'s</div>` : ""}
        <div class="ttl">${esc(TRIP.title)}</div>
        <div class="sub"><span class="flag"></span>${esc(TRIP.subtitle)} <span class="heart">♡</span></div>
        <div class="date">${TRIP.start.replace(/-/g, ".")} – ${md(TRIP.end).replace("/", ".")}<span>｜</span>${TRIP.lengthText}</div>
      </div>
    </div>
    <div class="facts4"><span>${ic("plane")}${TRIP.from} ⇄ ${TRIP.to}</span><span>${ic("user")}${TRIP.people} 人旅行</span><span>${ic("bed")}${hotels} 間飯店</span><span>${ic("spa")}按摩 ${massages} 次</span></div>
    <div class="card today">${today}</div>
    <div class="grid9">${tiles.map(([h, i, z, e, bg, c]) => `<a class="tile" href="${h}" style="--tb:${bg};--tc:${c}"><span class="ti">${ic(i)}</span><b>${z}</b><span>${e}</span></a>`).join("")}</div>
    <a class="btn wide" href="#summary">${ic("route")} ${days.length} 天行程總覽</a>
    <div class="ribbon"><span>旅程重點推薦</span></div>
    <div class="recos">${recos}</div>
    <div class="home-foot"><img class="fab1" src="img/fabric.webp" alt=""><div class="see">See you<br>Chiang Mai ♡</div><img class="ele" src="img/elephant2.webp" alt=""></div>
    <div class="copy">${esc(TRIP.copyright)}</div>
  </div>`;
};
function remind() {
  const todo = checkItems().filter((x) => !x.v && x.tab !== "pack");
  sheet(`<h3>提醒事項</h3>${todo.length ? `<div class="card">${todo.map((x) => `<div class="ck"><span class="box"></span><span>${esc(x.text)}</span></div>`).join("")}</div>` : `<div class="empty">都完成了 🎉</div>`}
    <div class="btnrow"><a class="btn" href="#checklist">前往出發準備</a></div>`, (el, close) => el.querySelector("a.btn").addEventListener("click", close));
}

/* ---------- 每日行程 ---------- */
const DAY_ART = { 1: "plane", 2: "waterfall", 3: "whitet", 4: "market", 5: "lanterns", 6: "taipei" };
let EDIT = false;
V.day = (n) => {
  const days = itin();
  n = +n || curDayN() || LS.get("lastDay", 1); LS.set("lastDay", n);
  const d = dayOf(n, days), live = liveStatus(d), nowD = curDayN();
  const hotel = hotelFor(d.date), massages = d.stops.filter((s) => s.type === "massage");
  const bks = [...new Set(d.stops.map((s) => s.booking).filter(Boolean))].map((id) => bookings().find((b) => b.id === id)).filter(Boolean);
  const note = LS.get("notes", {})[d.d];
  return `<div class="page">${hdr("cal", "每日行程", "Itinerary")}
    <div class="daytabs">${days.map((x) => `<a class="daytab ${x.d === d.d ? "on" : ""} ${nowD === x.d ? "now" : ""} ${dleft(x.date) < 0 ? "past" : ""}" href="#day-${x.d}"><b>D${x.d}</b><span>${md(x.date)}</span></a>`).join("")}</div>
    <div class="dayhero card">
      <div class="dblk"><b>D${d.d}</b><span>${md(d.date)}（${wk(d.date)}）</span>${cdBadge(d.date)}</div>
      <img class="dart" src="img/rt/${DAY_ART[d.d] || "whitet"}.webp" alt="">
    </div>
    <div class="dtitle">${ic(d.icon || "cal")}<h2>${esc(d.title)}</h2>${EDIT ? `<button class="mini" onclick="editDayTitle(${d.d})">${ic("edit")}</button>` : ""}</div>
    <div class="side">
      ${hotel ? `<a class="chip y" href="#booking-${hotel.id}">${ic("bed")}<span><small>今晚住宿</small>${esc(hotel.title)}</span></a>` : d.d === days.length ? `<span class="chip">${ic("home")}<span><small>今晚</small>回到台灣</span></span>` : ""}
      ${massages.length ? `<span class="chip p">${ic("spa")}<span><small>按摩</small>${massages.map((m) => esc(m.t ? m.t + " " + m.title : m.title)).join("、")}</span></span>` : ""}
      ${bks.map((b) => `<a class="chip ${bkDone(b.id) ? "g" : "w"}" href="#booking-${b.id}">${ic(bkDone(b.id) ? "ok" : "info")}<span><small>${bkDone(b.id) ? "已確認" : "待確認"}</small>${esc(b.title)}</span></a>`).join("")}
    </div>
    <div class="tlbar"><span class="muted small">${d.stops.length} 個行程</span>
      <button class="btn sm ${EDIT ? "" : "ghost"}" onclick="EDIT=!EDIT;render(true)">${ic(EDIT ? "ok" : "edit")} ${EDIT ? "完成" : "編輯行程"}</button></div>
    ${EDIT ? `<div class="editbar"><button class="btn ghost sm" onclick="sortDay(${d.d})">${ic("sort")} 依時間排序</button><button class="btn ghost sm" onclick="resetDay(${d.d})">${ic("undo")} 恢復這天預設</button></div>` : ""}
    <div class="tl">${d.stops.map((s, i) => stopRow(s, live, EDIT, d.d, i, d.stops.length)).join("") || `<div class="empty">這天還沒有行程</div>`}</div>
    <button class="addstop" onclick="editStop(${d.d})">${ic("plus")} 新增行程</button>
    ${note ? `<div class="card notec" onclick="editNote(${d.d})">${ic("note")}<span>${esc(note)}</span></div>` : ""}
    <div class="btnrow"><a class="btn" href="#map-${d.d}">${ic("pin")} 地圖路線</a><button class="btn ghost" onclick="editNote(${d.d})">${ic("note")} 行程備註</button></div>
    ${syncBar()}
  </div>`;
};
function mutDay(n, fn) { const days = itin(); const d = dayOf(n, days); fn(d); saveItin(days); render(true); }
function mvStop(n, i, dir) { mutDay(n, (d) => { const j = i + dir; if (j < 0 || j >= d.stops.length) return; [d.stops[i], d.stops[j]] = [d.stops[j], d.stops[i]]; }); }
async function delStop(n, id) {
  const s = dayOf(n).stops.find((x) => x.id === id); if (!s) return;
  const b = s.booking && bookings().find((x) => x.id === s.booking);
  const usedElsewhere = b && itin().some((d) => d.stops.some((x) => x.booking === b.id && x.id !== id));
  if (b && !usedElsewhere) {
    const v = await choose(`刪除「${s.title}」？這個行程連結了預訂「${b.title}」`, [["stop", "只刪行程，預訂保留"], ["both", "行程和預訂一起刪除", "red"]]);
    if (!v) return;
    mutDay(n, (d) => (d.stops = d.stops.filter((x) => x.id !== id)));
    if (v === "both") Sync.put("bookings", { ...(Sync.docs("bookings")[b.id] || {}), id: b.id, deleted: true });
    toast(v === "both" ? "行程和預訂都已刪除" : "已刪除行程"); render(true); return;
  }
  if (await ask(`刪除「${s.title}」？`, "刪除")) { mutDay(n, (d) => (d.stops = d.stops.filter((x) => x.id !== id))); toast("已刪除"); }
}
function sortDay(n) {
  mutDay(n, (d) => { // 有時間的照時間排，沒時間的跟著前一個
    let last = -1; const keyed = d.stops.map((s, i) => { const m = toMin(s.t); if (m != null) last = m; return { s, k: last, i }; });
    keyed.sort((a, b) => a.k - b.k || a.i - b.i); d.stops = keyed.map((x) => x.s);
  });
  toast("已依時間排序");
}
async function resetDay(n) { if (await ask(`把 D${n} 恢復成原本的行程？`, "恢復")) mutDay(n, (d) => { const o = defaultDays().find((x) => x.d === +n); d.stops = o.stops; d.title = o.title; }); }
function editDayTitle(n) {
  const d = dayOf(n);
  sheet(`<h3>D${n} 標題</h3><label class="fld"><input id="x-dt" value="${esc(d.title)}"></label><div class="btnrow"><button class="btn">儲存</button></div>`, (el, close) => {
    el.querySelector(".btn").onclick = () => { const v = el.querySelector("#x-dt").value.trim(); if (v) mutDay(n, (x) => (x.title = v)); close(); };
  });
}
function insertByTime(stops, s) {
  const m = toMin(s.t); if (m == null) { stops.push(s); return; }
  let at = stops.length;
  for (let i = 0; i < stops.length; i++) { const k = toMin(stops[i].t); if (k != null && k > m) { at = i; break; } }
  stops.splice(at, 0, s);
}
function overlap(d, s) {
  const a = toMin(s.t); if (a == null) return null; const b = toMin(s.end) ?? a + 1;
  return d.stops.find((x) => { if (x.id === s.id || !x.t || !x.end) return false; const xa = toMin(x.t), xb = toMin(x.end); return a < xb && b > xa; });
}
function editStop(n, id, preset) {
  const d = dayOf(n), old = id ? d.stops.find((x) => x.id === id) : null;
  const st = old ? { ...old } : { id: uid("s"), type: "spot", title: "", ...(preset || {}) };
  const places = Object.entries(TRIP.places);
  sheet(`<h3>${old ? "編輯行程" : `新增行程到 D${n}`}</h3>
    <div class="fld"><span>類型</span><div class="seg types">${Object.entries(TRIP.types).map(([k, v]) => `<button type="button" data-v="${k}" class="${k === st.type ? "on" : ""}" style="--c:${v.color};--b:${v.bg}">${ic(v.icon)}<small>${v.name}</small></button>`).join("")}</div></div>
    <label class="fld"><span>標題</span><input id="x-title" value="${esc(st.title)}" placeholder="例如：古城散步"></label>
    <div style="display:flex;gap:8px"><label class="fld" style="flex:1"><span>開始時間（可不填）</span><input id="x-t" type="time" value="${st.t || ""}"></label>
      <label class="fld" style="flex:1"><span>結束時間</span><input id="x-end" type="time" value="${st.end || ""}"></label></div>
    <label class="fld chk"><input id="x-approx" type="checkbox" ${st.approx ? "checked" : ""}> 時間是大約（顯示「約」）</label>
    <label class="fld"><span>補充說明</span><input id="x-sub" value="${esc(st.sub || "")}" placeholder="例如：60 分鐘、記得預約"></label>
    <label class="fld"><span>連結地點（可導航、看介紹）</span><select id="x-place"><option value="">（不連結）</option>${places.map(([k, p]) => `<option value="${k}" ${k === st.place ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label>
    <label class="fld"><span>連結預訂（票券、按摩、包車…）</span><select id="x-bk"><option value="">（不連結）</option>${bookings().map((b) => `<option value="${b.id}" ${b.id === st.booking ? "selected" : ""}>${esc(b.title)}（${esc(b.lines[0])}）</option>`).join("")}</select></label>
    <label class="fld"><span>移到哪一天</span><select id="x-day">${itin().map((x) => `<option value="${x.d}" ${x.d === +n ? "selected" : ""}>D${x.d}｜${md(x.date)} ${esc(x.title)}</option>`).join("")}</select></label>
    <div class="btnrow">${old ? `<button class="btn red" data-a="del">刪除</button>` : ""}<button class="btn" data-a="save">儲存</button></div>`, (el, close) => {
    el.querySelector(".types").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; st.type = b.dataset.v; el.querySelectorAll(".types button").forEach((x) => x.classList.toggle("on", x === b)); };
    el.querySelector("#x-place").onchange = (e) => { const p = TRIP.places[e.target.value]; const t = el.querySelector("#x-title"); if (p && !t.value) t.value = p.name; if (p && p.type) { st.type = p.type; el.querySelectorAll(".types button").forEach((x) => x.classList.toggle("on", x.dataset.v === p.type)); } };
    if (!old) setTimeout(() => el.querySelector("#x-title").focus(), 250);
    el.querySelector('[data-a="save"]').onclick = () => {
      const title = el.querySelector("#x-title").value.trim(); if (!title) return toast("請填標題");
      Object.assign(st, { title, t: el.querySelector("#x-t").value || undefined, end: el.querySelector("#x-end").value || undefined, approx: el.querySelector("#x-approx").checked || undefined,
        sub: el.querySelector("#x-sub").value.trim() || undefined, place: el.querySelector("#x-place").value || undefined, booking: el.querySelector("#x-bk").value || undefined });
      const to = +el.querySelector("#x-day").value;
      const days = itin(); const from = dayOf(n, days), target = dayOf(to, days);
      const idx = from.stops.findIndex((x) => x.id === st.id);
      const timeChanged = !old || old.t !== st.t || to !== +n;
      if (idx >= 0) from.stops.splice(idx, 1);
      if (old && !timeChanged) from.stops.splice(idx, 0, st); else insertByTime(target.stops, st);
      const ov = overlap(target, st);
      saveItin(days); close();
      if (to !== +n) location.hash = "#day-" + to; else render(true);
      toast(ov ? `已儲存（注意：和「${ov.title}」時間重疊）` : "已儲存");
    };
    const del = el.querySelector('[data-a="del"]'); if (del) del.onclick = () => { close(); delStop(n, st.id); };
  });
}
function openStop(n, id) {
  const s = dayOf(n).stops.find((x) => x.id === id); if (!s) return;
  const ty = T(s.type), p = s.place && TRIP.places[s.place], b = s.booking && bookings().find((x) => x.id === s.booking);
  sheet(`<div class="stophd" style="--c:${ty.color};--b:${ty.bg}"><span class="tyi">${ic(ty.icon)}</span><div><small>${ty.name}${s.t ? "・" + timeText(s) : ""}</small><h3>${esc(s.title)}</h3></div></div>
    ${s.sub ? `<p>${esc(s.sub)}</p>` : ""}
    ${stopArt(s) ? `<img class="stopimg art" src="${stopArt(s)}" alt="">` : ""}
    ${p && p.desc ? `<p class="small" style="line-height:1.7">${esc(p.desc)}</p>` : ""}
    ${b ? `<a class="chip ${bkDone(b.id) ? "g" : "w"}" href="#booking-${b.id}" style="margin:6px 0">${ic("ticket")}<span><small>${bkDone(b.id) ? "已確認" : "待確認"}</small>${esc(b.title)}</span></a>` : ""}
    <div class="acts3">
      ${p ? `<a class="act" target="_blank" rel="noopener" href="${placeLink(p)}">${ic("nav")}導航</a>` : ""}
      ${p && (p.desc || p.img) ? `<a class="act" href="#place-${s.place}">${ic("info")}介紹</a>` : ""}
      <button class="act" data-a="exp">${ic("wallet")}記一筆</button>
      <button class="act" data-a="edit">${ic("edit")}編輯</button>
    </div>`, (el, close) => {
    el.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setTimeout(close, 50)));
    el.querySelector('[data-a="edit"]').onclick = () => { close(); editStop(n, id); };
    el.querySelector('[data-a="exp"]').onclick = () => { close(); editExp(null, { title: s.title.replace(/^.*→\s*/, ""), cat: ty.cat, date: dayOf(n).date }); };
  });
}
function editNote(d) {
  const notes = LS.get("notes", {});
  sheet(`<h3>D${d} 行程備註</h3><label class="fld"><textarea placeholder="例如：包車司機電話、集合地點、想買的東西…">${esc(notes[d] || "")}</textarea></label>
    <p class="note">備註只存在這支手機。</p><div class="btnrow"><button class="btn">儲存</button></div>`, (el, close) => {
    el.querySelector(".btn").onclick = () => { notes[d] = el.querySelector("textarea").value.trim(); LS.set("notes", notes); close(); render(true); };
  });
}
function addPlaceToDay(pid) {
  const p = TRIP.places[pid];
  sheet(`<h3>把「${esc(p.name)}」加入行程</h3><div class="fld"><span>哪一天？</span><div class="seg" id="x-days">${itin().map((d) => `<button data-d="${d.d}">D${d.d}<br><small>${md(d.date)}</small></button>`).join("")}</div></div>
    <label class="fld"><span>時間（可不填）</span><input id="x-t" type="time"></label><div class="btnrow"><button class="btn" data-a="ok">加入</button></div>`, (el, close) => {
    let day = curDayN() || 1; const seg = el.querySelector("#x-days");
    const mark = () => seg.querySelectorAll("button").forEach((b) => b.classList.toggle("on", +b.dataset.d === day)); mark();
    seg.onclick = (e) => { const b = e.target.closest("button"); if (b) { day = +b.dataset.d; mark(); } };
    el.querySelector('[data-a="ok"]').onclick = () => {
      const days = itin(); const s = { id: uid("s"), type: p.type || "spot", title: p.name, place: pid, t: el.querySelector("#x-t").value || undefined };
      insertByTime(dayOf(day, days).stops, s); saveItin(days); close(); toast(`已加入 D${day}`); render(true);
    };
  });
}

/* ---------- 路線地圖（每天依行程自動畫） ---------- */
function stopArt(s) {
  const A = TRIP.routeArt, txt = s.title + " " + (s.sub || "");
  const k = (s.place && A.place[s.place]) || (A.words.find(([re]) => re.test(s.title)) || [])[1] || (A.words.find(([re]) => re.test(txt)) || [])[1] || A.type[s.type];
  return k ? `img/rt/${k}.webp` : null;
}
function navTarget(s) { const p = s.place && TRIP.places[s.place]; return p ? p.q || p.name : null; }
V.map = (n) => {
  const days = itin(); n = +n || curDayN() || LS.get("lastDay", 1);
  const d = dayOf(n, days), th = TRIP.routeTheme[d.d] || { t: d.title, en: "", c: "#5f7431" }, r = TRIP.routes[d.d];
  const located = d.stops.filter((s) => navTarget(s));
  const legs = located.slice(1).map((s, i) => [located[i], s]);
  const live = liveStatus(d);
  const tag = (s) => { const b = s.booking && bookings().find((x) => x.id === s.booking);
    return [s.sub ? `<span class="rtag">${esc(s.sub)}</span>` : "", b && !bkDone(b.id) ? `<span class="rtag w">預訂待確認</span>` : "", live[s.id] ? `<span class="rtag live">${live[s.id] === "now" ? "進行中" : "下一站"}</span>` : ""].join(""); };
  const rows = d.stops.map((s, i) => { const art = stopArt(s), nav = navTarget(s);
    return `<div class="rrow ${s.type === "massage" || s.hi ? "pk" : ""} ${i === d.stops.length - 1 ? "last" : ""}">
      <button class="rnum" onclick="openStop(${d.d},'${s.id}')">${String(i + 1).padStart(2, "0")}</button>
      <button class="rtx" onclick="openStop(${d.d},'${s.id}')"><b>${esc(s.title.replace(/^.*→\s*/, ""))}</b>${s.t ? `<span class="rt">${timeText(s)}</span>` : ""}${tag(s)}</button>
      ${art ? `<img class="rart" src="${art}" alt="" onclick="openStop(${d.d},'${s.id}')">` : `<span></span>`}
      ${nav ? `<a class="rnav" target="_blank" rel="noopener" href="${placeLink(TRIP.places[s.place])}" title="導航">${ic("nav")}</a>` : ""}
    </div>`; }).join("");
  const whole = located.length >= 2 ? (r ? mapsDir(r.nav.origin, r.nav.destination, r.nav.waypoints) : mapsDir(navTarget(located[0]), navTarget(located.at(-1)), located.slice(1, -1).map(navTarget)))
    : located.length === 1 ? placeLink(TRIP.places[located[0].place]) : null;
  const hasFlight = d.stops.some((s) => s.type === "flight");
  return `<div class="page rpage" style="--th:${th.c}">
    <div class="rhdr"><button class="back" onclick="goBack()">${ic("back")}</button><div><h1>每日路線</h1><small>DAILY ROUTE</small></div>
      <img class="rfl" src="img/rt/rflower.webp" alt=""><a class="homebtn" href="#home">${ic("home")}</a></div>
    <div class="rtabs">${days.map((x) => `<a class="${x.d === d.d ? "on" : ""}" style="--tc:${(TRIP.routeTheme[x.d] || {}).c || "#5f7431"}" href="#map-${x.d}">D${x.d}</a>`).join("")}</div>
    <div class="rban"><img class="l" src="img/rt/bn${d.d}l.webp" alt="" onerror="this.remove()"><img class="r" src="img/rt/bn${d.d}r.webp" alt="" onerror="this.remove()">
      <div class="rd">D${d.d}・${md(d.date)}</div><h2>${esc(th.t)}</h2><div class="ren">${esc(th.en)}</div><div class="rorn">〰</div></div>
    ${th.pill ? `<div class="rpill">${ic(th.pill[0])} ${esc(th.pill[1])}</div>` : ""}
    <div class="rlist">${rows || `<div class="empty">這天還沒有行程</div>`}
      <div class="rfoot"><img src="img/rt/rflower.webp" alt="">—— 行程示意・非實際比例 ——</div></div>
    ${legs.length ? `<button class="rleg" onclick="showLegs(${d.d})">${ic("pin")}<span><b>分段導航</b><small>${esc(TRIP.places[legs[0][0].place].name)} → ${esc(TRIP.places[legs[0][1].place].name)}${legs.length > 1 ? ` 等 ${legs.length} 段` : ""}</small></span>${ic("right")}</button>` : ""}
    ${hasFlight ? `<div class="rnote">${ic("plane")} 航班時間以航空公司公告為準</div>` : ""}
    ${whole ? `<a class="rgo" target="_blank" rel="noopener" href="${whole}">${ic("pin")} 開啟 Google Maps</a>` : ""}
    ${r ? `<div class="card info"><h4>${ic("car")} ${r.title}</h4>${r.info.map(([k, v]) => `<div class="kv">${ic("ok")}<b>${k}</b>${esc(v)}</div>`).join("")}</div>` : ""}
    <a class="redit" href="#day-${d.d}">${ic("edit")} 編輯這天的行程（新增・刪除・調整時間）</a>
  </div>`;
};
function showLegs(n) {
  const d = dayOf(n), located = d.stops.filter((s) => navTarget(s));
  sheet(`<h3>D${n} 分段導航</h3><div class="card plist">${located.slice(1).map((s, i) => { const a = located[i];
    return `<a class="it" target="_blank" rel="noopener" href="${TRIP.places[s.place].url || mapsDir(navTarget(a), navTarget(s))}"><span class="leg"><small>${esc(TRIP.places[a.place].name)}</small>${ic("down")}<b>${esc(TRIP.places[s.place].name)}</b></span>${s.t ? `<span class="small muted">${s.t}</span>` : ""}<span class="round-ic">${ic("nav")}</span></a>`; }).join("")}</div>`);
}

/* ---------- 景點／店家介紹 ---------- */
function placeArtWC(id) { const A = TRIP.routeArt, p = TRIP.places[id] || {}; return `img/rt/${A.place[id] || (A.words.find(([re]) => re.test(p.name || "")) || [])[1] || A.type[p.type] || "gate"}.webp`; }
V.place = (id) => {
  const p = TRIP.places[id]; if (!p) return V.home();
  const fav = LS.get("fav", []).includes(id), ty = T(p.type), uses = placeUses(id);
  const facts = [["clock", "開放時間", p.hours], ["ticket", "門票", p.fee], ["clock", "建議停留", p.stay], ["coins", "價位", p.price], ["pin", "區域", p.area]].filter((f) => f[2]).slice(0, 3);
  return `<div class="page">
    <div class="dhero art"><img src="${placeArtWC(id)}" alt="">
      <button class="back" onclick="goBack()">${ic("back")}</button><a class="homebtn" href="#home">${ic("home")}</a></div>
    <div class="card dcard"><span class="pill" style="background:${ty.bg};color:${ty.color}">${ic(ty.icon)} ${ty.name}</span>
      <h2>${esc(p.name)}${p.en && !/^\d/.test(p.en) ? `<i>${esc(p.en)}</i>` : ""}</h2>${p.custom ? `<span class="pill gold">自己加的${p.by ? "・" + esc(p.by) : ""}</span>` : ""}
      <div class="small muted" style="margin-top:4px">${ic("pin")} ${esc(p.area || "")}${p.rating ? ` ・ <span class="rating">${ic("star")} ${p.rating}</span>${p.reviews ? ` (${p.reviews})` : ""}` : ""}${p.zh ? ` ・ ${esc(p.zh)}` : ""}</div>
      ${p.desc ? `<p style="line-height:1.75;margin:10px 0 0">${esc(p.desc)}</p>` : ""}
      ${facts.length ? `<div class="facts">${facts.map(([i, k, v]) => `<div>${ic(i)} ${k}<b>${esc(v)}</b></div>`).join("")}</div>` : ""}
      ${uses.length ? `<div class="usedin">${ic("cal")} 已排在 ${uses.map((u) => `<a href="#day-${u.d}">D${u.d}${u.t ? " " + u.t : ""}</a>`).join("、")}</div>` : ""}
      <p class="note">營業時間與價格可能變動，出發前請再確認。</p>
      <div class="btnrow"><a class="btn" target="_blank" rel="noopener" href="${placeLink(p)}">${ic("nav")} 導航</a>
        <button class="btn ghost" onclick="addPlaceToDay('${id}')">${ic("plus")} 加入行程</button>
        <button class="btn ghost ${fav ? "on-fav" : ""}" onclick="toggleFav('${id}')">${ic("bookmark")} ${fav ? "已收藏" : "收藏"}</button></div>
      ${p.custom ? `<div class="btnrow"><button class="btn ghost sm" onclick="editPlace('${id}')">${ic("edit")} 編輯</button><button class="btn ghost sm" style="color:var(--red)" onclick="delPlace('${id}')">${ic("trash")} 刪除</button></div>` : ""}
    </div></div>`;
};
function toggleFav(id) { const f = LS.get("fav", []); const i = f.indexOf(id); i < 0 ? f.push(id) : f.splice(i, 1); LS.set("fav", f); render(true); }

/* ---------- 行程總覽（海報風） ---------- */
V.summary = () => {
  const days = itin();
  const short = (t) => t.replace(/（.*?）/g, "").replace(/\s+(Wat|Baan) .*$/, "");
  return `<div class="page">${hdr("route", `${days.length} 天行程總覽`, "Trip Summary")}
  ${days.map((d) => {
    const hotel = hotelFor(d.date), ms = d.stops.filter((s) => s.type === "massage");
    const shown = d.stops.slice(0, 4);
    return `<a class="card sumx" href="#day-${d.d}">
      <div class="sx-l"><b>D${d.d}</b><span>${md(d.date)}（${wk(d.date)}）</span>${cdBadge(d.date)}</div>
      <div class="sx-r"><div class="sx-h"><h4>${esc(d.short || d.title)}</h4><img src="img/rt/${DAY_ART[d.d] || "whitet"}.webp" alt=""></div>
        <ul>${shown.map((s) => `<li class="${s.type === "massage" || s.hi ? "pk" : ""}"><em>${s.t ? s.t : "・"}</em><span>${esc(short(s.title))}</span></li>`).join("")}</ul>
        ${d.stops.length > 4 ? `<div class="sx-more">還有 ${d.stops.length - 4} 項 ›</div>` : ""}
        <div class="side">${hotel ? `<span class="chip y sm">${ic("bed")}${esc(hotel.title)}</span>` : ""}${ms.length ? `<span class="chip p sm">${ic("spa")}按摩 ${ms.length}</span>` : ""}</div>
      </div>
    </a>`;
  }).join("")}
  <div class="see2">See you Chiang Mai ♡</div></div>`;
};

/* ---------- 出發準備 ---------- */
function checkItems() {
  const out = [];
  TRIP.checklist.forEach((g) => {
    if (g.fromBookings) bookings().forEach((b) => out.push({ id: "bk_" + b.id, text: `${b.title}（${b.lines[0]}）`, v: bkDone(b.id), tab: g.tab, group: g.group, bk: b.id }));
    else g.items.forEach(([id, text, def]) => { const r = Sync.get("checks", id); out.push({ id, text, v: r ? !!r.v : !!def, tab: g.tab, group: g.group }); });
  });
  Sync.list("checks").filter((r) => r.custom).forEach((r) => out.push({ id: r.id, text: r.text, v: !!r.v, tab: r.tab, group: "我自己加的", custom: true }));
  return out;
}
V.checklist = (tab) => {
  tab = tab || LS.get("ckTab", "before"); LS.set("ckTab", tab);
  const all = checkItems(), done = all.filter((x) => x.v).length;
  const mine = all.filter((x) => x.tab === tab); const groups = [...new Set(mine.map((x) => x.group))];
  const gi = (g) => (TRIP.checklist.find((x) => x.group === g) || { icon: "heart" }).icon;
  return `<div class="page">${hdr("check", "出發準備", "Checklist")}
    <div class="card prog"><div style="display:flex;justify-content:space-between"><b>準備進度</b><span>${done} / ${all.length}（${Math.round((done / all.length) * 100)}%）</span></div><div class="bar"><i style="width:${(done / all.length) * 100}%"></i></div></div>
    <div class="tabs">${TRIP.checkTabs.map(([k, z]) => `<a class="tab ${k === tab ? "on" : ""}" href="#checklist-${k}">${z}</a>`).join("")}</div>
    ${groups.map((g) => `<div class="sec">${ic(gi(g))} ${esc(g)}${g === "預訂與確認" ? `<a class="small muted" style="margin-left:auto;font-family:inherit;font-weight:400" href="#booking">和票券連動 ${ic("right")}</a>` : ""}</div>
      <div class="card">${mine.filter((x) => x.group === g).map((x) => `<div class="ck ${x.v ? "on" : ""}"><button class="ckb" onclick="toggleCk('${x.id}')"><span class="box">${ic("ok")}</span><span>${esc(x.text)}</span></button>${x.custom ? `<button class="rm" onclick="rmCk('${x.id}')">${ic("x")}</button>` : ""}</div>`).join("")}</div>`).join("")}
    ${tab === "pack" ? `<a class="card warn" style="display:flex;gap:8px;align-items:center;margin-top:12px;background:#f3f6e6;border-color:#dfe6c4;color:var(--green-d)" href="#outfit-pack">${ic("shirt")}<span style="flex:1">衣服、鞋子、配件請看「服裝穿搭 → 打包清單」</span>${ic("right")}</a>` : ""}
    <button class="addstop" onclick="addCk('${tab}')">${ic("plus")} 新增項目</button>
    ${syncBar()}</div>`;
};
function toggleCk(id) {
  const x = checkItems().find((i) => i.id === id); if (!x) return;
  const r = Sync.get("checks", id) || { id }; Sync.put("checks", { ...r, v: !x.v }); render(true);
}
function addCk(tab) {
  sheet(`<h3>新增項目</h3><label class="fld"><input id="x-ck" placeholder="例如：買轉接頭"></label><div class="btnrow"><button class="btn">加入</button></div>`, (el, close) => {
    setTimeout(() => el.querySelector("input").focus(), 200);
    el.querySelector(".btn").onclick = () => { const t = el.querySelector("input").value.trim(); if (!t) return; Sync.put("checks", { id: uid("c"), text: t, tab, custom: true, v: false }); close(); render(true); };
  });
}
async function rmCk(id) { const r = Sync.get("checks", id); if (r && (await ask(`刪除「${r.text}」？`, "刪除"))) { Sync.put("checks", { ...r, deleted: true }); render(true); } }

/* ---------- 服裝穿搭（依行程自動提醒） ---------- */
function outfitTips(d) {
  const txt = d.stops.map((s) => s.title + " " + (s.sub || "")).join(" ");
  return TRIP.outfitRules.filter(([re]) => re.test(txt)).map(([, i, t]) => [i, t]);
}
function ohero(title, en, sub) {
  const name = LS.get("owner", "");
  return `<div class="ohero"><img class="scene" src="img/scene.webp" alt=""><img class="fl" src="img/flowers_l.webp" alt=""><i class="lan" style="left:50%;top:14px"></i>
    <button class="back" onclick="goBack()">${ic("back")}</button><a class="homebtn" href="#home">${ic("home")}</a>
    <div class="ot">${sub ? `<div class="sc">${sub}</div>` : ""}<h1>${title}</h1><div class="en">${en}</div><div class="orn">——◇——</div></div></div>`;
}
function outfitTabs(tab) {
  return `<div class="otabs">${[["daily", "shirt", "每日穿搭"], ["pack", "luggage", "打包清單"], ["idea", "today", "穿搭靈感"]].map(([k, i, z]) => `<a class="${k === tab ? "on" : ""}" href="#outfit-${k}">${ic(i)}<span>${z}</span></a>`).join("")}</div>`;
}
function packState() {
  const items = TRIP.packing.flatMap((g) => g.items.map(([id, name, q, def]) => ({ id, g: g.k, name, q, v: (Sync.get("checks", "pk_" + id) || { v: def }).v })));
  Sync.list("checks").filter((r) => r.pack).forEach((r) => items.push({ id: r.id.replace(/^pk_/, ""), g: r.g, name: r.text, q: r.q || 1, v: !!r.v, custom: true }));
  return items;
}
V.outfit = (tab) => {
  tab = tab || "daily"; const days = itin(), nowD = curDayN(), name = LS.get("owner", "");
  const sub = `${name ? esc(name) + "'s " : ""}Chiang Mai`;
  if (tab === "pack") {
    const items = packState(), done = items.filter((x) => x.v).length;
    return `<div class="page opage">${ohero("穿搭清單", "Packing List")}${outfitTabs(tab)}
      <div class="card prog pk2"><div style="display:flex;align-items:center;gap:8px">${ic("luggage")}<b>已準備 ${done} / ${items.length}</b><span style="margin-left:auto;font-weight:800;color:var(--green-d)">${Math.round((done / items.length) * 100)}%</span></div><div class="bar"><i style="width:${(done / items.length) * 100}%"></i></div></div>
      ${TRIP.packing.map((g) => `<div class="pgrp"><div class="phd">${ic(g.icon)}<b>${g.name}</b><i>${g.en}</i></div>
        <div class="card">${items.filter((x) => x.g === g.k).map((x) => `<div class="ck ${x.v ? "on" : ""}"><button class="ckb" onclick="togglePack('${x.id}',${!!x.custom})"><span class="box">${ic("ok")}</span><span>${esc(x.name)}</span></button><span class="qty">×${x.q}</span>${x.custom ? `<button class="rm" onclick="rmPack('${x.id}')">${ic("x")}</button>` : ""}</div>`).join("")}
        <button class="addmini" onclick="addPack('${g.k}')">${ic("plus")} 新增</button></div></div>`).join("")}
      <div class="otip card"><img src="img/tipdeco.webp" alt=""><b>${ic("today")} 穿搭小提醒</b><p>${esc(TRIP.packTip)}</p></div>
      ${syncBar()}</div>`;
  }
  if (tab === "idea") {
    return `<div class="page opage">${ohero("穿搭靈感", "Style Inspiration", sub)}${outfitTabs(tab)}
      <div class="igrid">${TRIP.outfits.map((o) => `<a class="card icard" href="#look-${o.d}"><img src="${o.big || o.img}" alt=""><div><span class="dbadge">D${o.d}</span> ${esc(o.title)}<div class="pal sm">${o.palette.map((c) => `<i style="background:${c}"></i>`).join("")}</div><small>${esc(o.mood)}</small></div></a>`).join("")}</div>
      <div class="otip card"><img src="img/tipdeco.webp" alt=""><b>${ic("today")} 整趟旅程的配色建議</b><p>以奶油白、杏色、鼠尾草綠為主，配上一點粉色和金色飾品，跟清邁的寺廟、天燈和花園最搭，照片也會很有一致感。</p></div></div>`;
  }
  return `<div class="page opage">${ohero("服裝穿搭", "Outfit Guide", sub)}${outfitTabs(tab)}
    ${TRIP.outfits.map((o) => { const day = dayOf(o.d, days), on = nowD ? nowD === o.d : o.d === 5 && false;
      return `<a class="card orow2 ${nowD === o.d ? "cur" : ""}" href="#look-${o.d}"><img src="${o.img}" alt="">
        <div class="bd"><div class="dl"><span class="dbadge">D${o.d}</span><span>${md(day.date)}（${wk(day.date)}）</span><span class="oi">${ic(o.icon)}</span></div>
        <h4>${esc(o.title)}</h4><p>${esc(o.look)}</p></div>${nowD === o.d ? `<span class="go">${ic("right")}</span>` : ""}</a>`; }).join("")}
    <img class="ofoot" src="img/scene.webp" alt=""></div>`;
};
V.look = (n) => {
  const o = TRIP.outfits.find((x) => x.d === +n) || TRIP.outfits[0], day = dayOf(o.d), w = weatherFor(day.date), tips = outfitTips(day);
  const fav = LS.get("favLook", []).includes(o.d);
  const wtxt = w ? (o.night ? ["晚間微涼", `${w.lo}–${w.lo + 2}°C`] : [`白天 ${w.hi}°C`, `早晚 ${w.lo}°C`]) : ["", ""];
  return `<div class="page opage look">
    <div class="ohero sm"><img class="scene" src="img/scene.webp" alt=""><i class="lan" style="left:46%;top:20px"></i><i class="lan" style="left:62%;top:44px;--s:.6"></i>
      <button class="back" onclick="goBack()">${ic("back")}</button><button class="homebtn fav ${fav ? "on" : ""}" onclick="favLook(${o.d})">${ic("heart")}</button></div>
    <div class="lt"><h1><em>D${o.d}</em> ${esc(o.title)}穿搭</h1><div class="en">${esc(o.en)}</div><div class="orn">——◇——</div>
      <div class="lpill">${ic("cal")} ${md(day.date)}（${wk(day.date)}）｜${esc(day.title.split("・")[0])}・清邁</div></div>
    <div class="lbig"><img src="${o.big || o.img}" alt=""></div>
    <div class="card pal-card"><b>${ic("today")} 穿搭配色 <i>Color Palette</i></b><div class="pal">${o.palette.map((c) => `<i style="background:${c}"></i>`).join("")}</div></div>
    <div class="card linfo">
      <div>${ic("camera")}<span><b>拍照推薦：</b>${esc(o.photo)}</span></div>
      <div>${ic("info")}<span><b>實用提醒：</b>${esc(o.tip)}</span></div>
      <div>${ic("gift")}<span><b>配件：</b>${esc(o.acc)}</span></div>
      <div>${ic("shirt")}<span><b>今日穿搭：</b>${esc(o.look)}</span></div></div>
    ${tips.length ? `<div class="tips" style="margin:10px 2px">${tips.map(([i, t]) => `<span>${ic(i)}${esc(t)}</span>`).join("")}</div>` : ""}
    <div class="card lbot"><div>${ic(o.night ? "moon" : w ? w.ic : "sun")}<span><b>${wtxt[0]}</b>${wtxt[1]}</span></div><i></i><div>${ic("today")}<span><b>風格氛圍</b>${esc(o.mood)}</span></div></div>
    <div class="lnav">${o.d > 1 ? `<a class="btn ghost sm" href="#look-${o.d - 1}">${ic("back")} D${o.d - 1}</a>` : "<span></span>"}<a class="btn sm" href="#day-${o.d}">${ic("cal")} 看 D${o.d} 行程</a>${o.d < TRIP.outfits.length ? `<a class="btn ghost sm" href="#look-${o.d + 1}">D${o.d + 1} ${ic("right")}</a>` : "<span></span>"}</div>
    <img class="ofoot" src="img/scene.webp" alt=""></div>`;
};
function favLook(d) { const f = LS.get("favLook", []); const i = f.indexOf(d); i < 0 ? f.push(d) : f.splice(i, 1); LS.set("favLook", f); render(true); }
function togglePack(id, custom) { const k = "pk_" + id; const cur = packState().find((x) => x.id === id); const r = Sync.get("checks", k) || { id: k }; Sync.put("checks", { ...r, v: !cur.v }); render(true); }
function addPack(g) {
  sheet(`<h3>新增到「${TRIP.packing.find((x) => x.k === g).name}」</h3><div style="display:flex;gap:8px"><label class="fld" style="flex:3"><input id="x-pn" placeholder="例如：泳衣"></label><label class="fld" style="flex:1"><input id="x-pq" type="number" value="1" min="1"></label></div><div class="btnrow"><button class="btn">加入</button></div>`, (el, close) => {
    setTimeout(() => el.querySelector("#x-pn").focus(), 200);
    el.querySelector(".btn").onclick = () => { const t = el.querySelector("#x-pn").value.trim(); if (!t) return; Sync.put("checks", { id: "pk_" + uid("c"), pack: true, g, text: t, q: +el.querySelector("#x-pq").value || 1, v: false }); close(); render(true); };
  });
}
async function rmPack(id) { const r = Sync.get("checks", "pk_" + id); if (r && (await ask(`刪除「${r.text}」？`, "刪除"))) { Sync.put("checks", { ...r, deleted: true }); render(true); } }

/* ---------- 天氣 ---------- */
V.weather = () => {
  const W = LS.get("weather", null), days = itin().map((d) => [d, weatherFor(d.date)]), nowD = curDayN();
  let big;
  if (W && W.cur) big = `<div class="now">${ic(WMO(W.cur[1])[0])}<div><div class="tmp">${W.cur[0]}°C</div><div>清邁現在・${WMO(W.cur[1])[1]}</div></div></div>`;
  else { const f = days[0][1]; big = `<div class="now">${ic("cloudsun")}<div><div class="tmp">${f.hi}°C <small>/ ${f.lo}°C</small></div><div>多雲時晴・降雨機率 10–20%</div></div></div>`; }
  return `<div class="page">${hdr("weather", "天氣預報", "Chiang Mai Weather")}
    <div class="card wtop"><span class="rng">${md(TRIP.start)}–${md(TRIP.end)}（清邁）</span>${big}</div>
    <div class="card" style="margin-top:12px">${days.map(([d, w]) => `<a class="wrow ${nowD === d.d ? "cur" : ""}" href="#day-${d.d}"><span class="dbadge">D${d.d}</span><span class="d">${md(d.date)}（${wk(d.date)}）<small>${esc(d.title)}</small></span>
      ${w && w.rain != null ? `<span class="small muted">${ic("rain")}${w.rain}%</span>` : ""}<b>${w ? w.hi + "° / " + w.lo + "°" : "--"}</b><span class="w ${w && w.ic === "cloud" ? "c" : w && w.ic === "rain" ? "r" : ""}">${ic(w ? w.ic : "cloud")}</span></a>`).join("")}</div>
    <p class="note">${days.some(([, w]) => w && w.live) ? "即時預報（Open-Meteo）" : "目前顯示參考值，連上網路後會自動更新成即時預報。"}</p>
    <div class="card tip"><b>${ic("shirt")} 穿搭提醒</b><p style="margin:6px 0 0;font-size:14px;line-height:1.6">${esc(TRIP.weatherTip)}</p></div></div>`;
};

/* ---------- 推薦指南（可自己新增） ---------- */
let CUSTOM_IDS = [];
function applyCustomPlaces() {
  CUSTOM_IDS.forEach((id) => delete TRIP.places[id]);
  CUSTOM_IDS = [];
  Sync.list("places").forEach((p) => { TRIP.places[p.id] = { ...p, custom: true }; CUSTOM_IDS.push(p.id); });
}
const GUIDE_TYPE = { food: "food", cafe: "cafe", shop: "shop", massage: "massage", spot: "spot" };
V.guide = (tab) => {
  tab = tab || "food";
  const list = Object.entries(TRIP.places).filter(([, p]) => p.guide === tab || (p.also || []).includes(tab)).sort((a, b) => (a[1].custom ? 1 : 0) - (b[1].custom ? 1 : 0));
  return `<div class="page">${hdr("food", "推薦指南", "Travel Guide")}
    <div class="tabs">${TRIP.guideTabs.map(([k, z, i]) => `<a class="tab ${k === tab ? "on" : ""}" href="#guide-${k}">${ic(i)} ${z}</a>`).join("")}</div>
    ${list.map(([id, p]) => { const ty = T(p.type), uses = placeUses(id); return `<div class="card rowc" onclick="location.hash='#place-${id}'">
      <span class="gart"><img src="${placeArtWC(id)}" alt=""></span>
      <div class="bd"><h4>${esc(p.name)}${p.custom ? `<span class="pill gold" style="font-size:10.5px">自己加的</span>` : ""}</h4><p>${esc(p.zh || "")}${p.zh && p.area ? "・" : ""}${esc(p.area || "")}</p>
      ${p.rating || p.price ? `<p>${p.rating ? `<span class="rating">${ic("star")} ${p.rating}</span> ・ ` : ""}${p.price || ""}</p>` : ""}
      ${uses.length ? `<span class="pill">${ic("cal")} 已排 ${uses.map((u) => "D" + u.d + (u.t ? " " + u.t : "")).join("、")}</span>` : `<button class="pill add" onclick="event.stopPropagation();addPlaceToDay('${id}')">${ic("plus")} 加入行程</button>`}</div>
      <a class="round-ic" target="_blank" rel="noopener" href="${placeLink(p)}" onclick="event.stopPropagation()">${ic("nav")}</a></div>`; }).join("") || `<div class="card empty">這個分類還沒有店家，新增一間吧！</div>`}
    <button class="addstop" onclick="editPlace(null,'${tab}')">${ic("plus")} 新增推薦</button>
    <p class="note">自己加的推薦會同步給旅伴。看到朋友推薦或 IG 上的店，直接把 Google Maps 分享連結貼進來最方便。</p>${syncBar()}</div>`;
};
function editPlace(id, tab) {
  const old = id ? Sync.get("places", id) : null;
  const st = old ? { ...old } : { id: uid("u"), guide: tab || "food" };
  sheet(`<h3>${old ? "編輯推薦" : "新增推薦"}</h3>
    <div class="fld"><span>分類</span><div class="seg" id="x-g">${TRIP.guideTabs.map(([k, z, i]) => `<button type="button" data-v="${k}" class="${k === st.guide ? "on" : ""}">${ic(i)} ${z}</button>`).join("")}</div></div>
    <label class="fld"><span>名稱</span><input id="x-name" value="${esc(st.name || "")}" placeholder="例如：Rustic & Blue"></label>
    <label class="fld"><span>特色／必點（可不填）</span><input id="x-zh" value="${esc(st.zh || "")}" placeholder="例如：早午餐、鬆餅"></label>
    <label class="fld"><span>區域（可不填）</span><input id="x-area" value="${esc(st.area || "")}" placeholder="例如：尼曼區"></label>
    <label class="fld"><span>Google Maps 連結或搜尋關鍵字</span><input id="x-q" value="${esc(st.url || st.q || "")}" placeholder="貼上分享連結，或輸入店名" autocapitalize="off"></label>
    <label class="fld"><span>筆記（可不填）</span><input id="x-desc" value="${esc(st.desc || "")}" placeholder="例如：朋友推薦、要排隊"></label>
    <div class="btnrow">${old ? `<button class="btn red" data-a="del">刪除</button>` : ""}<button class="btn" data-a="save">儲存</button></div>`, (el, close) => {
    el.querySelector("#x-g").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; st.guide = b.dataset.v; el.querySelectorAll("#x-g button").forEach((x) => x.classList.toggle("on", x === b)); };
    if (!old) setTimeout(() => el.querySelector("#x-name").focus(), 250);
    el.querySelector('[data-a="save"]').onclick = () => {
      const name = el.querySelector("#x-name").value.trim(); if (!name) return toast("請填名稱");
      const q = el.querySelector("#x-q").value.trim();
      Object.assign(st, { name, zh: el.querySelector("#x-zh").value.trim(), area: el.querySelector("#x-area").value.trim(), desc: el.querySelector("#x-desc").value.trim(),
        type: GUIDE_TYPE[st.guide] || "spot", url: /^https?:\/\//.test(q) ? q : "", q: /^https?:\/\//.test(q) ? name : (q || name), by: people()[LS.get("me", 0)] });
      Sync.put("places", st); close(); applyCustomPlaces();
      if (location.hash !== "#guide-" + st.guide && !location.hash.startsWith("#place")) location.hash = "#guide-" + st.guide; else render(true);
      toast("已加入推薦");
    };
    const del = el.querySelector('[data-a="del"]'); if (del) del.onclick = () => { close(); delPlace(st.id); };
  });
}
async function delPlace(id) {
  const r = Sync.get("places", id); if (!r) return;
  if (!(await ask(`刪除推薦「${r.name}」？`, "刪除"))) return;
  Sync.put("places", { ...r, deleted: true }); applyCustomPlaces();
  if (location.hash.startsWith("#place")) location.hash = "#guide-" + r.guide; else render(true);
}
V.food = V.guide;

const BK_ART_WC = { flight: "plane", migoo: "migoo", golden: "hotel2", atv: "waterfall", car: "suitcase", spa: "spaoil", lantern: "lanterns", transfer: "airport" };
function bkArt(b) { return `img/rt/${BK_ART_WC[b.id] || { stay: "hotel2", transport: "suitcase", activity: "lanterns", spa: "towels", food: "thaifood" }[b.type] || "suitcase"}.webp`; }
/* ---------- 預訂票券（可新增／修改／刪除，連動行程與出發準備） ---------- */
V.booking = (sel) => {
  const all = bookings(), tab = TRIP.bookingTabs.some(([k]) => k === sel) ? sel : "all", hi = tab === sel ? null : sel;
  const list = all.filter((b) => tab === "all" || b.type === tab), has = LS.get("vouchers", []);
  const days = itin(); const dayFor = (id) => days.find((d) => d.stops.some((s) => s.booking === id));
  setTimeout(() => { if (hi) { const el = document.getElementById("bk-" + hi); el && el.scrollIntoView({ block: "center" }); } }, 50);
  const todo = all.filter((b) => !bkDone(b.id)).length;
  return `<div class="page">${hdr("ticket", "預訂票券", "My Booking")}
    ${todo ? `<div class="card warn">${ic("info")} 還有 ${todo} 項待確認，點狀態可以切換</div>` : ""}
    <div class="tabs">${TRIP.bookingTabs.map(([k, z]) => `<a class="tab ${k === tab ? "on" : ""}" href="#booking-${k}">${z}</a>`).join("")}</div>
    ${list.map((b) => { const dd = dayFor(b.id), dl = dd ? dleft(dd.date) : null; return `<div class="card rowc ${hi === b.id ? "hl" : ""}" id="bk-${b.id}" onclick="editBooking('${b.id}')"><span class="gart" style="width:80px;height:66px"><img src="${bkArt(b)}" alt=""></span>
      <div class="bd"><h4>${esc(b.title)}</h4><p>${b.lines.map(esc).join("<br>")}</p>
        <div style="display:flex;gap:6px;margin-top:5px;flex-wrap:wrap"><button class="pill ${bkDone(b.id) ? "" : "w"}" onclick="event.stopPropagation();toggleCk('bk_${b.id}')">${ic(bkDone(b.id) ? "ok" : "info")} ${bkDone(b.id) ? "已確認" : "待確認"}</button>
        ${dd ? `<a class="pill gold" href="#day-${dd.d}" onclick="event.stopPropagation()">${ic("cal")} D${dd.d}${dl > 0 ? `・${dl} 天後` : dl === 0 ? "・今天" : ""}</a>` : `<span class="pill" style="background:#eee;color:#888">未排進行程</span>`}</div></div>
      <button class="qr ${has.includes(b.id) ? "has" : ""}" onclick="event.stopPropagation();voucher('${b.id}')" aria-label="憑證">${ic("qr")}</button></div>`; }).join("") || `<div class="card empty">這個分類還沒有預訂</div>`}
    <button class="addstop" onclick="editBooking(null,'${tab === "all" ? "activity" : tab}')">${ic("plus")} 新增預訂</button>
    <p class="note">點卡片可以修改或刪除；QR 圖示可以放電子票或訂單截圖（只存在這支手機）。</p>${syncBar()}</div>`;
};
function editBooking(id, type) {
  const old = id ? bookings().find((b) => b.id === id) : null;
  const st = old ? { ...old } : { id: uid("b"), type: type || "activity", date: curDayN() ? dayOf(curDayN()).date : TRIP.start };
  const allStops = itin().flatMap((d) => d.stops.map((s) => ({ d, s })));
  const linked = allStops.find(({ s }) => s.booking === st.id);
  sheet(`<h3>${old ? "修改預訂" : "新增預訂"}</h3>
    <div class="fld"><span>類型</span><div class="seg" id="x-bt">${Object.entries(TRIP.bookingTypes).map(([k, [n, i]]) => `<button type="button" data-v="${k}" class="${k === st.type ? "on" : ""}">${ic(i)} ${n}</button>`).join("")}</div></div>
    <label class="fld"><span>名稱</span><input id="x-bn" value="${esc(st.title || "")}" placeholder="例如：Lila 泰式按摩"></label>
    <div class="dateonly"><label class="fld"><span>日期</span><input id="x-bd" type="date" value="${st.date || ""}" min="${TRIP.start}" max="${TRIP.end}"></label>
      <div style="display:flex;gap:8px"><label class="fld" style="flex:1"><span>開始時間</span><input id="x-btt" type="time" value="${st.t || ""}"></label><label class="fld" style="flex:1"><span>結束時間</span><input id="x-be" type="time" value="${st.end || ""}"></label></div></div>
    <div class="stayonly" style="display:flex;gap:8px"><label class="fld" style="flex:1"><span>入住</span><input id="x-ci" type="date" value="${st.checkin || ""}"></label><label class="fld" style="flex:1"><span>退房</span><input id="x-co" type="date" value="${st.checkout || ""}"></label></div>
    <label class="fld"><span>備註（金額、內容…）</span><input id="x-note" value="${esc(st.note || "")}" placeholder="例如：฿800・腳底 60 分鐘"></label>
    <label class="fld chk"><input id="x-done" type="checkbox" ${old && bkDone(st.id) ? "checked" : ""}> 已確認／已付款</label>
    ${linked ? `<p class="note">${ic("cal")} 已連結行程：D${linked.d.d} ${esc(linked.s.title)}${old ? "（修改時間會一起更新行程）" : ""}</p>` : `<label class="fld chk"><input id="x-add" type="checkbox" checked> 同時加到行程裡</label>`}
    <div class="btnrow">${old ? `<button class="btn red" data-a="del">刪除</button>` : ""}<button class="btn" data-a="save">儲存</button></div>`, (el, close) => {
    const vis = () => { el.querySelector(".dateonly").style.display = st.type === "stay" ? "none" : ""; el.querySelector(".stayonly").style.display = st.type === "stay" ? "flex" : "none"; };
    el.querySelector("#x-bt").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; st.type = b.dataset.v; el.querySelectorAll("#x-bt button").forEach((x) => x.classList.toggle("on", x === b)); vis(); }; vis();
    el.querySelector('[data-a="save"]').onclick = () => {
      const title = el.querySelector("#x-bn").value.trim(); if (!title) return toast("請填名稱");
      const rec = { id: st.id, type: st.type, title, note: el.querySelector("#x-note").value.trim() };
      if (st.type === "stay") Object.assign(rec, { checkin: el.querySelector("#x-ci").value, checkout: el.querySelector("#x-co").value, date: el.querySelector("#x-ci").value });
      else Object.assign(rec, { date: el.querySelector("#x-bd").value, t: el.querySelector("#x-btt").value, end: el.querySelector("#x-be").value });
      Sync.put("bookings", rec);
      const done = el.querySelector("#x-done").checked; Sync.put("checks", { ...(Sync.get("checks", "bk_" + st.id) || {}), id: "bk_" + st.id, v: done });
      const days = itin(); let changed = false;
      if (linked && rec.type !== "stay") { // 同步更新行程時間／日期
        const from = dayOf(linked.d.d, days), s = from.stops.find((x) => x.id === linked.s.id);
        if (s) { const moved = rec.date && rec.date !== from.date; s.t = rec.t || s.t; s.end = rec.end || undefined;
          if (moved) { from.stops = from.stops.filter((x) => x.id !== s.id); const to = days.find((d) => d.date === rec.date); if (to) insertByTime(to.stops, s); } changed = true; }
      } else if (!linked && el.querySelector("#x-add") && el.querySelector("#x-add").checked) {
        const date = rec.type === "stay" ? rec.checkin : rec.date, day = days.find((d) => d.date === date);
        if (day) { insertByTime(day.stops, { id: uid("s"), type: TRIP.bookingTypes[rec.type][3], title: rec.type === "stay" ? "入住 " + title : title, t: rec.t || undefined, end: rec.end || undefined, sub: rec.note || undefined, booking: rec.id }); changed = true; toast(`已加到 D${day.d} 行程`); }
        else toast("日期不在旅程內，只存成預訂");
      }
      if (changed) saveItin(days);
      close(); render(true);
    };
    const del = el.querySelector('[data-a="del"]'); if (del) del.onclick = async () => {
      close();
      const v = linked ? await choose(`刪除預訂「${st.title}」？`, [["bk", "只刪預訂，行程保留"], ["both", "預訂和行程一起刪除", "red"]]) : ((await ask(`刪除預訂「${st.title}」？`, "刪除")) ? "bk" : "");
      if (!v) return;
      Sync.put("bookings", { ...(Sync.docs("bookings")[st.id] || {}), id: st.id, deleted: true });
      const days = itin(); days.forEach((d) => { d.stops = v === "both" ? d.stops.filter((s) => s.booking !== st.id) : d.stops.map((s) => (s.booking === st.id ? { ...s, booking: undefined } : s)); });
      saveItin(days); render(true); toast("已刪除");
    };
  });
}
async function voucher(id) {
  const v = await DB.get("vouchers", id).catch(() => null);
  const b = bookings().find((x) => x.id === id);
  if (!v) {
    sheet(`<h3>${esc(b.title)}</h3><p>還沒有憑證。選一張電子票、QR code 或訂單截圖吧！</p><div class="btnrow"><button class="btn">${ic("camera")} 選擇圖片</button></div>`, (el, close) => {
      el.querySelector(".btn").onclick = async () => { const [f] = await pickFiles(); if (!f) return; await DB.put("vouchers", { id, blob: await shrink(f, 2000) }); const h = LS.get("vouchers", []); h.includes(id) || h.push(id); LS.set("vouchers", h); close(); render(true); voucher(id); };
    });
    return;
  }
  const u = URL.createObjectURL(v.blob);
  const f = document.createElement("div"); f.className = "full";
  f.innerHTML = `<h3 style="font-family:var(--serif);margin:0 0 14px;color:var(--green-d)">${esc(b.title)}</h3><img src="${u}" alt=""><div class="acts"><button class="btn ghost sm" data-a="c">換一張</button><button class="btn red sm" data-a="d">刪除</button><button class="btn sm" data-a="x">關閉</button></div>`;
  document.body.appendChild(f);
  f.onclick = async (e) => {
    const a = e.target.closest("button")?.dataset.a; if (!a) return;
    f.remove(); URL.revokeObjectURL(u);
    if (a === "d" && await ask("確定刪除這張憑證？")) { await DB.del("vouchers", id); LS.set("vouchers", LS.get("vouchers", []).filter((x) => x !== id)); render(true); }
    if (a === "c") { await DB.del("vouchers", id); voucher(id); }
  };
}
/* ---------- 旅費紀錄（分帳＋個人花費） ---------- */
function catName(k) { return (TRIP.budgetCats.find((c) => c[0] === k) || [, "其他"])[1]; }
function myIdx() { return LS.get("whoami", 0); }
function personal() { return Object.values(LS.get("personal", {})).filter((e) => !e.deleted); }
const thb = (e, R) => (e.cur === "TWD" ? e.amt / R : e.amt);
V.budget = (tab) => {
  tab = tab || "all";
  const P = people(), R = rate(), C = TRIP.currency, me = myIdx();
  const shared = Sync.list("expenses"), mine = personal();
  const paid = [0, 0], owe = [0, 0], myCat = {};
  shared.forEach((e) => { const v = thb(e, R); paid[e.payer] += v; let share = 0;
    if (e.split === "both") { owe[0] += v / 2; owe[1] += v / 2; share = v / 2; } else { owe[+e.split] += v; share = +e.split === me ? v : 0; }
    if (share) myCat[e.cat] = (myCat[e.cat] || 0) + share; });
  const myPersonal = mine.reduce((s, e) => s + thb(e, R), 0);
  mine.forEach((e) => (myCat[e.cat] = (myCat[e.cat] || 0) + thb(e, R)));
  const myTotal = owe[me] + myPersonal, maxCat = Math.max(1, ...Object.values(myCat));
  const bal = paid[0] - owe[0];
  const settle = Math.abs(bal) < 1 ? `<div class="who">${ic("ok")} 目前兩清，不用找錢</div>` :
    `<div class="who">${esc(bal > 0 ? P[1] : P[0])} → ${esc(bal > 0 ? P[0] : P[1])}</div><div style="font-size:24px;font-weight:800;margin:4px 0">${C}${fmt(Math.abs(bal))}</div><div class="muted small">≈ NT$${fmt(Math.abs(bal) * R)}</div>`;
  const lo = 7100, hi = 10000, pct = Math.min(100, (myTotal / hi) * 100);
  const list = [...(tab !== "personal" ? shared.map((e) => ({ ...e, _k: "s" })) : []), ...(tab !== "shared" ? mine.map((e) => ({ ...e, _k: "p" })) : [])]
    .sort((a, b) => (b.date + b.ts).localeCompare(a.date + a.ts));
  const byDay = {}; list.forEach((e) => (byDay[e.date] = byDay[e.date] || []).push(e));
  const bp = TRIP.budgetPlan;
  return `<div class="page">${hdr("wallet", "旅費紀錄", "Travel Budget")}
    <div class="card mytotal"><div class="lbl">${ic("user")} ${esc(P[me])} 這趟總共花了</div>
      <div class="big">${C}${fmt(myTotal)}<small>≈ NT$${fmt(myTotal * R)}</small></div>
      <div class="split2"><span>分帳中我的部分 <b>${C}${fmt(owe[me])}</b></span><span>個人花費 <b>${C}${fmt(myPersonal)}</b></span></div>
      <div class="bbar"><i style="width:${pct}%;background:${myTotal > hi ? "var(--red)" : myTotal > lo ? "var(--gold)" : "var(--green)"}"></i><em style="left:${(lo / hi) * 100}%"></em></div>
      <div class="small muted" style="display:flex;justify-content:space-between"><span>預算 ${bp.range}</span><span>${myTotal > hi ? "超出預算了！" : `還剩 ${C}${fmt(Math.max(0, hi - myTotal))}`}</span></div>
      ${Object.keys(myCat).length ? `<div class="cats">${Object.entries(myCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="catrow">${ic(k)}<span>${catName(k)}</span><i><b style="width:${(v / maxCat) * 100}%"></b></i><em>${C}${fmt(v)}</em></div>`).join("")}</div>` : ""}
    </div>
    <div class="sec">${ic("user")} 分帳結算</div>
    <div class="card settle">${settle}
      <div class="stat"><div>${esc(P[0])} 分攤<b>${C}${fmt(owe[0])}</b></div><div>${esc(P[1])} 分攤<b>${C}${fmt(owe[1])}</b></div></div></div>
    <div class="sec">${ic("list")} 花費明細 <span class="muted small" style="margin-left:auto;font-weight:400;font-family:inherit">1${TRIP.currencyCode} ≈ ${R.toFixed(3)} 台幣</span></div>
    <div class="tabs"><a class="tab ${tab === "all" ? "on" : ""}" href="#budget-all">全部</a><a class="tab ${tab === "shared" ? "on" : ""}" href="#budget-shared">${ic("user")} 共同分帳</a><a class="tab ${tab === "personal" ? "on" : ""}" href="#budget-personal">${ic("heart")} 我的個人</a></div>
    ${list.length ? Object.keys(byDay).sort().reverse().map((d) => `<div class="dayh">${md(d)}（${wk(d)}）・${C}${fmt(byDay[d].reduce((s, e) => s + thb(e, R), 0))}</div>
      <div class="card">${byDay[d].map((e) => `<button class="exp" style="width:100%;text-align:left" onclick="editExp('${e.id}','${e._k}')"><span class="ci ${e._k === "p" ? "pk" : ""}">${ic(e.cat)}</span>
        <span class="bd">${esc(e.title || catName(e.cat))}<small>${e._k === "p" ? `<span class="pill p">個人</span> 只有我看得到` : `${esc(P[e.payer])} 付・${e.split === "both" ? "兩人平分" : "只算 " + esc(P[+e.split])}`}</small></span>
        <span class="am">${e.cur === "TWD" ? "NT$" + fmt(e.amt) : C + fmt(e.amt)}<small>${e.cur === "TWD" ? "≈ " + C + fmt(e.amt / R) : "≈ NT$" + fmt(e.amt * R)}</small></span></button>`).join("")}</div>`).join("")
      : `<div class="card empty">還沒有花費紀錄，按下面的按鈕新增第一筆吧！</div>`}
    ${syncBar()}
    <details class="card plan"><summary>${ic("coins")} 出發前的預算規劃（每人）</summary>${bp.items.map(([i, k, v]) => `<div class="brow">${ic(i)}<span>${esc(k)}</span><b>${v}</b></div>`).join("")}</details>
    <button class="btn fab" onclick="editExp()">${ic("plus")} 新增花費</button></div>`;
};
function editExp(id, kind, preset) {
  if (kind && typeof kind === "object") { preset = kind; kind = null; }
  const P = people(), me = myIdx();
  const e = id ? (kind === "p" ? LS.get("personal", {})[id] : Sync.get("expenses", id)) : null;
  const t = todayISO(); const defDate = t >= TRIP.start && t <= TRIP.end ? t : TRIP.start;
  const st = e ? { ...e, kind: kind === "p" ? "p" : "s" } : { id: uid("e"), amt: "", cur: "THB", title: "", cat: "food", payer: me, split: "both", date: defDate, ts: Date.now(), kind: "s", ...(preset || {}) };
  const seg = (name, opts, val) => `<div class="seg" data-n="${name}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${String(v) === String(val) ? "on" : ""}">${l}</button>`).join("")}</div>`;
  sheet(`<h3>${e ? "編輯花費" : "新增花費"}</h3>
    <div class="fld"><span>這筆是</span>${seg("kind", [["s", "👭 共同（要分帳）"], ["p", "🙋‍♀️ 個人（只有我）"]], st.kind)}</div>
    <label class="fld"><span>金額</span><div style="display:flex;gap:6px"><input id="x-amt" type="number" inputmode="decimal" placeholder="0" value="${st.amt}">${seg("cur", [["THB", "฿ 泰銖"], ["TWD", "NT$"]], st.cur)}</div></label>
    <div class="small muted" id="x-conv" style="margin:-4px 2px 6px"></div>
    <label class="fld"><span>項目（可不填）</span><input id="x-title" value="${esc(st.title)}" placeholder="例如：泰式按摩"></label>
    <div class="fld"><span>分類</span>${seg("cat", TRIP.budgetCats, st.cat)}</div>
    <div class="shareonly"><div class="fld"><span>誰付的？</span>${seg("payer", [[0, esc(P[0])], [1, esc(P[1])]], st.payer)}</div>
    <div class="fld"><span>算誰的？</span>${seg("split", [["both", "兩人平分"], ["0", "只算 " + esc(P[0])], ["1", "只算 " + esc(P[1])]], st.split)}</div></div>
    <p class="note personalonly">個人花費只存在你的手機，不會同步、也不會算進分帳。</p>
    <label class="fld"><span>日期</span><input id="x-date" type="date" value="${st.date}"></label>
    <div class="btnrow">${e ? `<button class="btn red" data-a="del">刪除</button>` : ""}<button class="btn" data-a="save">儲存</button></div>`, (el, close) => {
    const R = rate();
    const conv = () => { const v = +el.querySelector("#x-amt").value || 0; el.querySelector("#x-conv").textContent = v ? (st.cur === "TWD" ? `≈ ฿${fmt(v / R)}` : `≈ NT$${fmt(v * R)}`) : ""; };
    const vis = () => { el.querySelector(".shareonly").style.display = st.kind === "s" ? "" : "none"; el.querySelector(".personalonly").style.display = st.kind === "p" ? "" : "none"; };
    el.querySelectorAll(".seg").forEach((s) => s.addEventListener("click", (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      s.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      const n = s.dataset.n; st[n] = n === "payer" ? +b.dataset.v : b.dataset.v; conv(); vis();
    }));
    el.querySelector("#x-amt").addEventListener("input", conv); conv(); vis();
    if (!e) setTimeout(() => el.querySelector("#x-amt").focus(), 250);
    const removeOld = () => { if (!e) return; if (kind === "p") { const all = LS.get("personal", {}); delete all[e.id]; LS.set("personal", all); } else Sync.put("expenses", { ...Sync.get("expenses", e.id), deleted: true }); };
    el.querySelector('[data-a="save"]').onclick = () => {
      const amt = parseFloat(el.querySelector("#x-amt").value);
      if (!(amt > 0)) { toast("請輸入金額"); return; }
      Object.assign(st, { amt, title: el.querySelector("#x-title").value.trim(), date: el.querySelector("#x-date").value || defDate });
      const rec = { ...st }; delete rec.kind;
      if (e && (kind === "p") !== (st.kind === "p")) { removeOld(); rec.id = uid("e"); }
      if (st.kind === "p") { const all = LS.get("personal", {}); all[rec.id] = rec; LS.set("personal", all); }
      else Sync.put("expenses", rec);
      close(); render(true); toast(st.kind === "p" ? "已記到個人花費" : "已記到共同分帳");
    };
    const d = el.querySelector('[data-a="del"]');
    if (d) d.onclick = async () => { if (await ask("確定刪除這筆？")) { removeOld(); close(); render(true); } };
  });
}

/* ---------- 相冊（雲端共享相簿＋拍照清單） ---------- */
function albumCfg() { return Sync.get("meta", "album") || {}; }
V.album = () => {
  const a = albumCfg(), days = itin();
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
  return `<div class="page">${hdr("album", "旅行相冊", "Shared Album")}
    <div class="card albhero">
      <div class="covers art">${["whitet", "lanterns", "waterfall"].map((k) => `<img src="img/rt/${k}.webp" alt="">`).join("")}</div>
      ${a.url ? `<div class="albbd"><small>我們的共享相簿</small><h3>${esc(a.name || "清邁閨蜜旅行")}</h3><p class="small muted">${esc(host(a.url))}・兩個人都可以上傳</p>
        <div class="btnrow"><a class="btn" href="${esc(a.url)}" target="_blank" rel="noopener">${ic("album")} 開啟相簿</a><button class="btn ghost" onclick="copyAlbum()">${ic("copy")} 複製連結</button></div>
        <button class="small muted" style="margin-top:10px;text-decoration:underline" onclick="setAlbum()">更換相簿連結</button></div>`
      : `<div class="albbd"><small>還沒設定</small><h3>建立共享相簿</h3>
        <p class="small" style="line-height:1.7">照片放雲端，兩個人都能上傳、看到原圖，換手機也不會不見。建立好之後把連結貼進來，旅伴的 App 會自動拿到。</p>
        <ol class="howto"><li><b>Google 相簿</b>（推薦）：＋ → 共享相簿 → 取名 → 共用 → 複製連結</li><li><b>LINE 相簿</b>：聊天室 → 相簿 → 建立 → 分享連結</li><li><b>iCloud 共享相簿</b>：兩人都用 iPhone 時可以用</li></ol>
        <div class="btnrow"><button class="btn" onclick="setAlbum()">${ic("plus")} 貼上相簿連結</button></div></div>`}
    </div>
    <div class="sec">${ic("camera")} 小提醒</div>
    <div class="card" style="padding:12px 16px;font-size:13.5px;line-height:1.8">
      <div>${ic("ok")} 每天晚上回飯店，把當天的照片上傳到共享相簿</div>
      <div>${ic("ok")} Google 相簿可以開「原始畫質」，回台灣再一起挑照片</div>
      <div>${ic("ok")} 天燈節晚上光線暗，記得開夜間模式、手要穩</div></div>
</div>`;
};
function togglePh(id) { const r = Sync.get("checks", "ph_" + id) || { id: "ph_" + id }; Sync.put("checks", { ...r, v: !r.v }); render(true); }
function setAlbum() {
  const a = albumCfg();
  sheet(`<h3>共享相簿連結</h3><label class="fld"><span>相簿名稱</span><input id="x-an" value="${esc(a.name || "清邁閨蜜旅行")}"></label>
    <label class="fld"><span>連結（https:// 開頭）</span><input id="x-au" value="${esc(a.url || "")}" placeholder="https://photos.app.goo.gl/…" autocapitalize="off"></label>
    <p class="note">連結會同步給旅伴。任何拿到連結的人都能看相簿，不要貼到公開的地方。</p>
    <div class="btnrow">${a.url ? `<button class="btn ghost" data-a="rm">移除</button>` : ""}<button class="btn" data-a="ok">儲存</button></div>`, (el, close) => {
    el.querySelector('[data-a="ok"]').onclick = () => { const url = el.querySelector("#x-au").value.trim(); if (!/^https?:\/\//.test(url)) return toast("請貼上 https:// 開頭的連結");
      Sync.put("meta", { id: "album", url, name: el.querySelector("#x-an").value.trim() }); close(); render(true); toast("已儲存"); };
    const rm = el.querySelector('[data-a="rm"]'); if (rm) rm.onclick = () => { Sync.put("meta", { id: "album" }); close(); render(true); };
  });
}
function copyAlbum() { navigator.clipboard?.writeText(albumCfg().url).then(() => toast("已複製"), () => toast("請長按複製")); }

/* ---------- 設定 ---------- */
V.setup = () => {
  const P = people(), c = Sync.cfg(), r = LS.get("rate", { v: TRIP.defaultRate });
  return `<div class="page">${hdr("settings", "設定", "Settings")}
    <div class="sec">${ic("user")} 基本資料</div>
    <div class="card" style="padding:4px 14px 14px">
      <label class="fld"><span>首頁顯示的名字（例如：小美）</span><input id="s-owner" value="${esc(LS.get("owner", ""))}" placeholder="可不填"></label>
      <label class="fld"><span>旅伴 1（記帳用）</span><input id="s-p0" value="${esc(P[0])}"></label>
      <label class="fld"><span>旅伴 2（記帳用）</span><input id="s-p1" value="${esc(P[1])}"></label>
      <div class="fld"><span>這支手機是誰的？（「我的花費」會算這個人）</span><div class="seg" id="s-me">${[0, 1].map((i) => `<button type="button" data-v="${i}" class="${myIdx() === i ? "on" : ""}" onclick="LS.set('whoami',${i});render(true)">${esc(P[i])}</button>`).join("")}</div></div>
      <button class="btn" style="width:100%" onclick="saveBasic()">儲存</button></div>

    <div class="sec">${ic("sync")} 兩支手機同步（記帳＋打勾）</div>
    <div class="card" style="padding:4px 14px 14px">
      ${c ? `<p>${ic("ok")} 已開啟同步・旅行代碼 <b>${esc(c.t)}</b></p>${syncBar()}
        <p class="small muted">把下面這串「同步碼」傳給旅伴，請她在自己 App 的設定頁貼上：</p>
        <div class="code" id="s-code">${esc(shareCode(c))}</div>
        <div class="btnrow"><button class="btn ghost sm" onclick="copyCode()">${ic("copy")} 複製同步碼</button><button class="btn ghost sm" onclick="stopSync()">關閉同步</button></div>`
      : `<p class="small muted">方法一：旅伴已經設定好了 → 貼上她給你的同步碼。</p>
        <label class="fld"><textarea id="s-join" style="min-height:70px" placeholder="貼上同步碼"></textarea></label>
        <button class="btn" style="width:100%" onclick="joinSync()">加入同步</button>
        <p class="small muted" style="margin-top:16px">方法二：第一次設定 → 填入 Firebase 的資料（照教學操作）。</p>
        <label class="fld"><span>projectId</span><input id="s-pid" autocapitalize="off" autocorrect="off"></label>
        <label class="fld"><span>apiKey</span><input id="s-key" autocapitalize="off" autocorrect="off"></label>
        <label class="fld"><span>旅行代碼（自動產生，可修改）</span><input id="s-trip" value="${TRIP.id}-${Math.random().toString(36).slice(2, 10)}" autocapitalize="off"></label>
        <button class="btn ghost" style="width:100%" onclick="newSync()">開始同步</button>`}
    </div>

    <div class="sec">${ic("coins")} 匯率</div>
    <div class="card" style="padding:4px 14px 14px">
      <label class="fld"><span>1 泰銖 = ? 台幣 ${r.auto ? "（已自動更新）" : r.manual ? "（手動設定）" : ""}</span><input id="s-rate" type="number" step="0.001" inputmode="decimal" value="${(+r.v).toFixed(3)}"></label>
      <div class="btnrow"><button class="btn ghost sm" onclick="setRate(false)">恢復自動</button><button class="btn sm" onclick="setRate(true)">手動設定</button></div></div>

    <div class="sec">${ic("cal")} 行程</div>
    <div class="card" style="padding:14px"><p class="small muted" style="margin-top:0">行程改過之後，想回到最原本的版本可以按這裡（開啟同步的話旅伴也會一起恢復）。</p>
      <button class="btn ghost sm" onclick="resetItin()">${ic("undo")} 恢復全部預設行程</button></div>
    <div class="sec">${ic("trash")} 資料</div>
    <div class="card" style="padding:14px"><p class="small muted" style="margin-top:0">票券截圖、行程備註只存在這支手機。換手機或刪除 App 會消失。</p>
      <button class="btn red sm" onclick="resetAll()">清除這支手機的所有資料</button></div>
    <div class="copy">${esc(TRIP.title)} Trip App・v${APP_VERSION}<br>${esc(TRIP.copyright)}<br><small>本 App 的設計、程式與內容版權歸 YaoyaoWeng 所有，未經授權請勿複製、轉載或商業使用。</small></div></div>`;
};
async function resetItin() { if (await ask("把 6 天行程全部恢復成預設？", "恢復")) { saveItin(defaultDays()); toast("已恢復"); render(true); } }
function shareCode(c) { return "TRIP:" + btoa(unescape(encodeURIComponent(JSON.stringify({ ...c, n: people() })))); }
function saveBasic() {
  LS.set("owner", $("#s-owner").value.trim());
  const n = [$("#s-p0").value.trim() || "我", $("#s-p1").value.trim() || "旅伴"];
  LS.set("names", n); Sync.put("meta", { id: "people", names: n }); toast("已儲存"); render(true);
}
function copyCode() { navigator.clipboard?.writeText($("#s-code").textContent).then(() => toast("已複製"), () => toast("請長按文字複製")); }
async function newSync() {
  const p = $("#s-pid").value.trim(), k = $("#s-key").value.trim(), t = $("#s-trip").value.trim();
  if (!p || !k || t.length < 10) { toast("請填好 projectId、apiKey，旅行代碼至少 10 個字"); return; }
  LS.set("sync", { p, k, t }); queueAll(); await Sync.run();
  toast(Sync.status === "ok" ? "同步成功！" : "設定已存，但連線失敗，請檢查資料"); render(true);
}
async function joinSync() {
  try {
    const raw = $("#s-join").value.trim().replace(/^TRIP:/, "");
    const o = JSON.parse(decodeURIComponent(escape(atob(raw))));
    if (!o.p || !o.k || !o.t) throw 0;
    LS.set("sync", { p: o.p, k: o.k, t: o.t }); if (o.n) LS.set("names", o.n);
    queueAll(); await Sync.run(); toast(Sync.status === "ok" ? "已加入同步！" : "已存，稍後自動同步"); render(true);
  } catch { toast("同步碼格式不對，請重新複製"); }
}
function queueAll() { const p = new Set(Sync.pending()); Sync.cols.forEach((c) => Object.keys(Sync.docs(c)).forEach((id) => p.add(c + "/" + id))); LS.set("pending", [...p]); }
async function stopSync() { if (await ask("關閉同步？（已記的資料會留在這支手機）")) { localStorage.removeItem(LS.k("sync")); Sync.setStatus("local"); render(true); } }
function setRate(manual) {
  if (manual) { const v = parseFloat($("#s-rate").value); if (!(v > 0)) return toast("請輸入匯率"); LS.set("rate", { v, manual: true }); toast("已設定"); }
  else { localStorage.removeItem(LS.k("rate")); refreshRate().then(() => render(true)); toast("改成自動更新"); }
  render(true);
}
async function resetAll() {
  if (!await ask("確定清除這支手機上的所有資料？（同步到雲端的記帳不會刪除）")) return;
  Object.keys(localStorage).filter((k) => k.startsWith(TRIP.id + ":")).forEach((k) => localStorage.removeItem(k));
  indexedDB.deleteDatabase(TRIP.id); location.hash = "#home"; location.reload();
}

/* ---------- 旅伴對話框＋我在這裡＋旅伴在哪 ---------- */
if (!Sync.cols.includes("msgs")) Sync.cols.push("msgs");
const QUICK = ["我到了 👋", "等我 5 分鐘", "你在哪？", "我先去排隊", "要不要喝咖啡 ☕", "我先墊了，記帳囉 💰"];
function msgs() { return Sync.list("msgs").sort((a, b) => a.ts - b.ts); }
function unread() { const last = LS.get("chatRead", 0), me = myIdx(); return msgs().filter((m) => m.from !== me && m.ts > last).length; }
function lastLoc(who) { return msgs().filter((m) => m.loc && m.from === who).pop(); }
function ago(ts) { const s = (Date.now() - ts) / 1000; return s < 60 ? "剛剛" : s < 3600 ? `${Math.floor(s / 60)} 分鐘前` : s < 86400 ? `${Math.floor(s / 3600)} 小時前` : `${md(new Date(ts).toISOString().slice(0, 10))}`; }
function hm(ts) { const d = new Date(ts); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; }
const mapsAt = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

V.chat = () => {
  LS.set("chatRead", Date.now());
  const P = people(), me = myIdx(), other = 1 - me, list = msgs(), synced = !!Sync.cfg();
  const ol = lastLoc(other);
  let lastDay = "";
  const bubbles = list.map((m) => {
    const day = new Date(m.ts).toISOString().slice(0, 10), mine = m.from === me;
    const sep = day !== lastDay ? `<div class="cday">${md(day)}（${wk(day)}）</div>` : ""; lastDay = day;
    const body = m.loc ? `<a class="cloc" href="${mapsAt(m.loc[0], m.loc[1])}" target="_blank" rel="noopener"><img src="img/rt/rflower.webp" alt=""><span><b>${ic("pin")} 我在這裡</b><small>點一下用 Google 地圖導航${m.loc[2] ? `・誤差約 ${Math.round(m.loc[2])} 公尺` : ""}</small></span></a>` : esc(m.text).replace(/\n/g, "<br>");
    return `${sep}<div class="cm ${mine ? "me" : ""}">${mine ? "" : `<span class="cav">${esc(P[m.from][0] || "?")}</span>`}<div><div class="cb ${m.loc ? "loc" : ""}">${body}</div><small>${mine ? "" : esc(P[m.from]) + "・"}${hm(m.ts)}${m.pending ? "・傳送中" : ""}</small></div></div>`;
  }).join("");
  setTimeout(() => { const b = $("#cbody"); if (b) b.scrollTop = b.scrollHeight; }, 0);
  return `<div class="page chatp">${hdr("chat", "旅伴聊天", "Travel Chat")}
    <div class="cbar"><button class="btn ghost sm" onclick="shareHere()">${ic("pin")} 我在這裡</button><button class="btn ghost sm" onclick="whereBuddy()">${ic("find")} ${esc(P[other])} 在哪？</button></div>
    ${ol ? `<a class="card clast" href="${mapsAt(ol.loc[0], ol.loc[1])}" target="_blank" rel="noopener">${ic("pin")}<span>${esc(P[other])} 最後分享的位置・${ago(ol.ts)}</span>${ic("nav")}</a>` : ""}
    ${synced ? "" : `<div class="card warn">${ic("info")} 還沒開啟同步，訊息只會存在這支手機。到「設定」開啟兩支手機同步後，閨蜜才收得到。</div>`}
    <div class="card cbody" id="cbody">${bubbles || `<div class="cempty"><img src="img/elephant2.webp" alt=""><p>還沒有訊息<br>跟 ${esc(P[other])} 打聲招呼吧 ♡</p></div>`}</div>
    <div class="cquick">${QUICK.map((q) => `<button onclick="sendMsg(${JSON.stringify(q).replace(/"/g, "&quot;")})">${esc(q)}</button>`).join("")}</div>
    <form class="cin" onsubmit="event.preventDefault();sendMsg($('#cinput').value)"><input id="cinput" placeholder="輸入訊息…" autocomplete="off" enterkeyhint="send"><button class="btn" aria-label="送出">${ic("send")}</button></form>
    <p class="note">App 開著時幾秒內就會收到；App 關掉時不會跳通知。只有你們兩支手機看得到（開啟同步後）。</p>
    ${syncBar()}</div>`;
};
function sendMsg(text, loc) {
  text = (text || "").trim(); if (!text && !loc) return;
  Sync.put("msgs", { id: uid("m"), from: myIdx(), text, loc, ts: Date.now() });
  const i = $("#cinput"); if (i) i.value = "";
  render(true); Sync.run();
}
function shareHere() {
  if (!navigator.geolocation) return toast("這支手機不支援定位");
  toast("取得位置中…");
  navigator.geolocation.getCurrentPosition(
    (p) => sendMsg("", [+p.coords.latitude.toFixed(6), +p.coords.longitude.toFixed(6), p.coords.accuracy]),
    () => toast("無法取得位置，請在手機設定允許 Roamie／瀏覽器使用定位"),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
}
function whereBuddy() {
  const P = people(), other = 1 - myIdx(), ol = lastLoc(other);
  sheet(`<h3>${esc(P[other])} 在哪？</h3>
    ${ol ? `<a class="card clast" href="${mapsAt(ol.loc[0], ol.loc[1])}" target="_blank" rel="noopener">${ic("pin")}<span>在 Roamie 最後分享的位置・${ago(ol.ts)}</span>${ic("nav")}</a>` : `<p class="small muted">${esc(P[other])} 還沒在 Roamie 分享過位置。</p>`}
    <p class="small" style="line-height:1.7;margin:14px 0 6px"><b>要 24 小時即時位置</b>，請用手機內建的位置分享（App 關掉也會持續更新），出發前兩個人先設定好一次：</p>
    <div class="choices">
      <a class="btn ghost" href="findmy://" onclick="setTimeout(()=>{location.href='https://www.icloud.com/find'},1200)">${ic("find")} 打開 iPhone「尋找」</a>
      <a class="btn ghost" href="https://www.google.com/maps" target="_blank" rel="noopener">${ic("map")} 打開 Google 地圖</a>
    </div>
    <details class="howset"><summary>第一次怎麼設定？</summary>
      <p><b>iPhone「尋找」</b>：尋找 →「聯絡人」→「＋」→ 選旅伴 →「傳送」→「無限期分享」。對方也做一次。</p>
      <p><b>Google 地圖</b>：點右上頭像 →「位置資訊分享」→「新增分享對象」→ 選旅伴 →「直到你關閉此功能」。</p></details>`);
}
// 首頁浮動聊天按鈕（有未讀數）
const _homeChat = V.home;
V.home = () => { const n = unread(); return _homeChat() + `<a class="cfab" href="#chat" aria-label="旅伴聊天">${ic("chat")}${n ? `<em>${n}</em>` : ""}</a>`; };
// 聊天頁時加快同步
setInterval(() => { if (!document.hidden && location.hash === "#chat" && Sync.cfg()) Sync.run(); }, 4000);
/* ---------- 路由（水彩版） ---------- */
const APP_VERSION = "5.0.0";
// 行程資料有新版本時，在每日行程頁提示
const _dayWC = V.day;
V.day = (n) => { const html = _dayWC(n), saved = Sync.get("meta", "itin");
  return saved && saved.base !== TRIP.itinVersion ? html.replace('<div class="daytabs">', `<div class="card warn" style="display:flex;gap:8px;align-items:center;margin-bottom:10px">${ic("info")}<span style="flex:1">行程資料有新版本（航班、D4／D5 細節更新），要套用嗎？你自己改過的行程會被取代。</span><button class="btn sm" onclick="applyNewItinWC()">套用</button></div><div class="daytabs">`) : html; };
async function applyNewItinWC() { if (await ask("套用新版行程？（你自己改過的行程會被取代）", "套用")) { saveItin(defaultDays()); toast("已套用新版行程"); render(true); } }
// 推薦指南：一間店可以同時出現在多個分類
const _guideWC = V.guide;
var render = function (keepScroll) {
  applyCustomPlaces();
  const [name = "", arg] = (location.hash || "").replace(/^#\/?/, "").split(/[\/-]/);
  const view = V[name] || V.home;
  const y = window.scrollY, ae = document.activeElement, keepId = ae && ae.id, keepVal = keepId && ae.value;
  $("#app").innerHTML = view(arg ? decodeURIComponent(arg) : undefined);
  window.scrollTo(0, keepScroll ? y : 0);
  if (keepId) { const el = document.getElementById(keepId); if (el) { if (keepVal != null && el.value === "") el.value = keepVal; el.focus(); } } // 打字時收到新訊息不會被清掉
};
/* ---------- 底部選單（水彩版） ---------- */
const NAVW = [["home", "home", "首頁", ["home", ""]], ["day", "cal", "行程", ["day", "map", "summary", "place"]], ["chat", "chat", "聊天", ["chat"]], ["budget", "wallet", "記帳", ["budget"]], ["more", "menu", "更多", []]];
function navWC(name) {
  const cur = (NAVW.find((t) => t[3].includes(name)) || NAVW[4])[0], n = unread();
  return `<nav class="wnav">${NAVW.map(([k, i, z]) => k === "more"
    ? `<button class="${cur === "more" ? "on" : ""}" onclick="moreSheet()">${ic(i)}<span>${z}</span></button>`
    : `<a class="${k === cur ? "on" : ""} ${k === "chat" ? "mid" : ""}" href="#${k}"><i>${ic(i)}${k === "chat" && n ? `<em>${n}</em>` : ""}</i><span>${z}</span></a>`).join("")}</nav>`;
}
function moreSheet() {
  const items = [["#map", "map", "路線地圖", "#dfeaf3", "#4f7ea8"], ["#checklist", "check", "出發準備", "#f5ecc9", "#a07b16"], ["#booking", "ticket", "預訂票券", "#f8e0e2", "#c2566b"],
    ["#outfit", "shirt", "服裝穿搭", "#ece4f4", "#7a5aa6"], ["#weather", "weather", "天氣預報", "#e0eef2", "#3f8aa0"], ["#guide", "food", "推薦指南", "#f9e3d3", "#c8692f"],
    ["#album", "album", "旅行相冊", "#f6e1ea", "#b0507a"], ["#summary", "route", "行程總覽", "#e6ecd2", "#5f7431"], ["#setup", "settings", "設定同步", "#efe9dc", "#7c7a66"]];
  sheet(`<div class="msh"><img src="img/temple.webp" alt=""><h3>更多功能</h3></div>
    <div class="grid9 sm">${items.map(([h, i, z, bg, c]) => `<a class="tile" href="${h}" style="--tb:${bg};--tc:${c}"><span class="ti">${ic(i)}</span><b>${z}</b></a>`).join("")}</div>`,
    (el, close) => el.querySelectorAll("a").forEach((a) => a.addEventListener("click", close)));
}
// 有底部選單後，首頁的浮動聊天按鈕就不需要了
V.home = _homeChat;
const _renderWC = render;
render = function (keepScroll) {
  _renderWC(keepScroll);
  const name = (location.hash || "").replace(/^#\/?/, "").split(/[\/-]/)[0];
  $("#app").insertAdjacentHTML("beforeend", navWC(V[name] ? name : "home"));
};
window.addEventListener("hashchange", () => { document.querySelectorAll(".mask,.full").forEach((e) => e.remove()); render(false); });
render(false);
Sync.run(); loadWeather(); refreshRate();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
