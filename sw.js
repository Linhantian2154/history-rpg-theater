// 时光大冒险 · 历史剧场 PWA Service Worker
// 策略 v2：网络优先（在线用最新版，失败才用缓存兜底）——保证线上更新能及时看到
const CACHE = "shiguang-v2";
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./zhangqian/index.html",
  "./zhenghe/index.html"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  // 只处理同源 GET
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;

  // 网络优先：先试网络，失败（离线）再回缓存
  e.respondWith(
    fetch(e.request).then((resp) => {
      // 成功：更新缓存（stale-while-revalidate 的效果）
      if (resp && resp.status === 200 && resp.type === "basic") {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return resp;
    }).catch(() =>
      caches.match(e.request).then((hit) => hit || caches.match("./index.html"))
    )
  );
});
