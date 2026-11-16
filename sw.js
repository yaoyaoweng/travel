/* © 2026 YaoyaoWeng. All rights reserved. */
const CACHE = "chiangmai-v12";
const CORE = ["./","index.html","style.css","app.js","data.js","icons.js","manifest.webmanifest","icons/icon-192.png","icons/apple-touch-icon.png","icons/favicon-64.png","img/a3.jpg","img/a4.jpg","img/a5.jpg","img/b_car.jpg","img/b_hotel1.jpg","img/b_hotel2.jpg","img/b_lantern.jpg","img/b_plane.jpg","img/b_spa.jpg","img/d1.jpg","img/d2.jpg","img/d3.jpg","img/d4.jpg","img/d5.jpg","img/d6.jpg","img/deco.webp","img/elephant2.webp","img/f1.jpg","img/f2.jpg","img/f3.jpg","img/f4.jpg","img/fabric.webp","img/flower.webp","img/flowers_l.webp","img/lantern.webp","img/look1.jpg","img/look2.jpg","img/look3.jpg","img/look4.jpg","img/look5.jpg","img/look5_big.jpg","img/look6_big.jpg","img/look4_big.jpg","img/look3_big.jpg","img/look2_big.jpg","img/look1_big.jpg","img/look6.jpg","img/map.jpg","img/p_black.jpg","img/p_blue.jpg","img/p_karen.jpg","img/rt/airport.webp","img/rt/blackt.webp","img/rt/bluet.webp","img/rt/bn1l.webp","img/rt/bn1r.webp","img/rt/bn2l.webp","img/rt/bn2r.webp","img/rt/bn3l.webp","img/rt/bn3r.webp","img/rt/bn4l.webp","img/rt/bn4r.webp","img/rt/bn5l.webp","img/rt/bn5r.webp","img/rt/bn6l.webp","img/rt/bn6r.webp","img/rt/coffee.webp","img/rt/croissant.webp","img/rt/gate.webp","img/rt/hotel2.webp","img/rt/karen.webp","img/rt/khaosoi.webp","img/rt/lalitta.webp","img/rt/lanterns.webp","img/rt/market.webp","img/rt/migoo.webp","img/rt/nightmkt.webp","img/rt/nimman.webp","img/rt/plane.webp","img/rt/rflower.webp","img/rt/spaoil.webp","img/rt/suitcase.webp","img/rt/taipei.webp","img/rt/thaifood.webp","img/rt/towels.webp","img/rt/waterfall.webp","img/rt/whitet.webp","img/scene.webp","img/sp_mtn_br.webp","img/sp_mtn_mid.webp","img/sp_mtn_top.webp","img/sp_pagoda.webp","img/sp_palm.webp","img/sp_tree_b.webp","img/sp_tree_d.webp","img/sp_tree_g.webp","img/sp_trees_a.webp","img/sp_trees_c.webp","img/sp_trees_e.webp","img/sp_trees_f.webp","img/temple.webp","img/tipdeco.webp","img/umbrella.webp"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== CACHE + "-fonts").map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (u.host === "fonts.googleapis.com" || u.host === "fonts.gstatic.com") {
    e.respondWith(caches.open(CACHE + "-fonts").then(async c => { const hit = await c.match(e.request); if (hit) return hit; const r = await fetch(e.request); if (r.ok || r.type === "opaque") c.put(e.request, r.clone()); return r; }));
    return;
  }
  if (u.origin !== location.origin) return; // 天氣、匯率、同步：直接連網
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; }).catch(() => hit);
    return hit || net;
  }));
});
