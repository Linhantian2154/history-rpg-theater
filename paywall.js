/*
 * 时光大冒险 · 付费墙（纯前端解锁）
 * Copyright (c) 2026 林寒天. All Rights Reserved.
 *
 * 原理：免费 3 个故事直接玩；其余故事需解锁码（localStorage 记解锁状态）。
 * 说明：纯前端只能挡"不懂技术的人"；懂技术的人看 JS 能绕过（已知局限，接受）。
 *
 * 用法：故事页 </body> 前引入 <script src="../paywall.js"></script>
 *      首页 </body> 前引入 <script src="./paywall.js"></script>
 */
(function () {
  "use strict";

  // ===== 免费 3 个故事（张骞/李白/祖冲之）=====
  const FREE = ["zhangqian", "libai", "zuchongzhi"];
  // ===== 解锁码（家长从开发者处获取）=====
  const UNLOCK_CODE = "SG2026";
  const LOCK_KEY = "shiguang_unlocked";
  const LOCK_TIME_KEY = "shiguang_unlock_time";

  const FREE_TITLES = {
    zhangqian: "张骞出塞",
    libai: "李白写诗",
    zuchongzhi: "祖冲之算圆周率",
  };

  function isUnlocked() {
    try {
      return localStorage.getItem(LOCK_KEY) === "1";
    } catch (e) { return false; }
  }

  function unlock() {
    try {
      localStorage.setItem(LOCK_KEY, "1");
      localStorage.setItem(LOCK_TIME_KEY, String(Date.now()));
    } catch (e) {}
  }

  // ===== 首页：给故事卡加锁标记 + 拦截点击 =====
  function decorateIndex() {
    // 找所有故事卡链接（url: "xxx/" 形式）
    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      const m = href.match(/^([^\/]+)\/$/);
      if (!m) return;
      const key = m[1];
      if (FREE.includes(key) || isUnlocked()) return;
      // 加锁标记
      const badge = document.createElement("span");
      badge.className = "lock-badge";
      badge.textContent = "🔒";
      badge.style.cssText = "position:absolute;top:6px;right:6px;font-size:1.1rem;z-index:5;";
      if (getComputedStyle(a).position === "static") {
        a.style.position = "relative";
      }
      a.appendChild(badge);
      // 拦截点击
      a.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showLockModal(key);
      });
    });
  }

  // ===== 解锁弹窗 =====
  function showLockModal(key) {
    const name = FREE_TITLES[key] || "这个故事";
    const mask = document.createElement("div");
    mask.className = "paywall-mask";
    mask.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:20px;";
    mask.innerHTML = `
      <div style="max-width:380px;width:100%;background:#fff;border-radius:18px;padding:24px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.3);">
        <div style="font-size:2.2rem;margin-bottom:8px;">🔒</div>
        <div style="font-size:1.05rem;font-weight:800;color:#5b4a2a;margin-bottom:6px;">《${name}》需要解锁</div>
        <div style="font-size:.82rem;color:#8a8577;line-height:1.7;margin-bottom:16px;">
          免费试玩：张骞出塞 · 李白写诗 · 祖冲之算圆周率<br>
          解锁全部 40+ 个故事，请联系家长获取解锁码
        </div>
        <input id="lockInput" type="text" placeholder="输入解锁码"
          style="width:100%;padding:10px;border:2px solid #e8dcc0;border-radius:10px;font-size:.9rem;text-align:center;margin-bottom:10px;box-sizing:border-box;">
        <button id="lockBtn" style="width:100%;padding:12px;background:linear-gradient(180deg,#2a9d8f,#1c6b62);color:#fff;border:none;border-radius:999px;font-size:.9rem;font-weight:800;cursor:pointer;margin-bottom:8px;">🔓 解锁</button>
        <button id="lockClose" style="background:none;border:none;color:#a89c80;font-size:.78rem;cursor:pointer;text-decoration:underline;">暂不解锁，先试玩免费故事</button>
      </div>`;
    document.body.appendChild(mask);
    const input = mask.querySelector("#lockInput");
    const btn = mask.querySelector("#lockBtn");
    const close = mask.querySelector("#lockClose");
    const fail = () => {
      input.style.borderColor = "#e07a5f";
      input.placeholder = "解锁码不对，再试试";
      input.value = "";
    };
    btn.addEventListener("click", () => {
      const code = input.value.trim().toUpperCase();
      if (code === UNLOCK_CODE) {
        unlock();
        mask.remove();
        location.reload();
      } else {
        fail();
      }
    });
    close.addEventListener("click", () => mask.remove());
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
    input.focus();
  }

  // ===== 故事页：未解锁则显示遮罩 =====
  function decorateStory() {
    // 从路径提取 story_key（例如 /zhangqian/ 或 /李冰修都江堰-v11.0/index.html）
    const path = location.pathname;
    const m = path.match(/\/([^\/]+)\/(?:index\.html)?$/);
    const key = m ? m[1] : "";
    if (!key) return;
    if (FREE.includes(key)) return;   // 免费故事直接玩
    if (isUnlocked()) return;         // 已解锁直接玩

    // 未解锁：显示全屏遮罩（覆盖游戏）
    const mask = document.createElement("div");
    mask.className = "paywall-mask";
    mask.style.cssText = "position:fixed;inset:0;z-index:99999;background:#fffdf5;display:flex;align-items:center;justify-content:center;padding:20px;";
    mask.innerHTML = `
      <div style="max-width:400px;width:100%;background:#fff;border:3px solid #e8dcc0;border-radius:18px;padding:28px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.15);">
        <div style="font-size:2.6rem;margin-bottom:10px;">🔒</div>
        <div style="font-size:1.15rem;font-weight:800;color:#5b4a2a;margin-bottom:8px;">这个故事需要解锁</div>
        <div style="font-size:.85rem;color:#8a8577;line-height:1.8;margin-bottom:18px;">
          免费试玩：<b>张骞出塞 · 李白写诗 · 祖冲之算圆周率</b><br>
          解锁全部故事，请让家长联系开发者获取解锁码
        </div>
        <input id="lockInput" type="text" placeholder="输入解锁码"
          style="width:100%;padding:12px;border:2px solid #e8dcc0;border-radius:10px;font-size:.95rem;text-align:center;margin-bottom:12px;box-sizing:border-box;">
        <button id="lockBtn" style="width:100%;padding:13px;background:linear-gradient(180deg,#2a9d8f,#1c6b62);color:#fff;border:none;border-radius:999px;font-size:.95rem;font-weight:800;cursor:pointer;">🔓 解锁</button>
        <div style="margin-top:14px;font-size:.75rem;color:#a89c80;">
          <a href="../" style="color:#2a9d8f;">← 回到首页，先玩免费故事</a>
        </div>
      </div>`;
    document.body.appendChild(mask);
    const input = mask.querySelector("#lockInput");
    const btn = mask.querySelector("#lockBtn");
    btn.addEventListener("click", () => {
      const code = input.value.trim().toUpperCase();
      if (code === UNLOCK_CODE) {
        unlock();
        mask.remove();
        // 重新进入故事（刷新让游戏初始化）
        location.reload();
      } else {
        input.style.borderColor = "#e07a5f";
        input.value = "";
        input.placeholder = "解锁码不对，再试试";
      }
    });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
    input.focus();
  }

  // ===== 启动 =====
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      // 首页有 STORIES 卡片（含 url:"xxx/")，故事页有 #stage
      if (document.getElementById("stage")) {
        decorateStory();
      } else {
        decorateIndex();
      }
    });
  } else {
    if (document.getElementById("stage")) {
      decorateStory();
    } else {
      decorateIndex();
    }
  }
})();
