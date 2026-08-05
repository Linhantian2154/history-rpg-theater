/*
 * 时光大冒险 · 语音朗读模块（TTS）
 * Copyright (c) 2026 林寒天. All Rights Reserved.
 *
 * 用法：在每个故事页面的 <script> 标签后引入：
 *   <script src="../tts-engine.js"></script>
 * 不需要修改现有游戏引擎。
 */

(function () {
  "use strict";

  const STORAGE_KEY = "shiguang_tts_auto";
  let voices = [];
  let autoSpeak = false;

  // 初始化：加载语音列表 + 读取用户偏好
  function init() {
    autoSpeak = localStorage.getItem(STORAGE_KEY) === "1";
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    observeNarrators();
  }

  function loadVoices() {
    if (!window.speechSynthesis) return;
    voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("zh"));
  }

  // 选择最合适的中文语音：优先 Google / Microsoft / 系统默认
  function pickVoice() {
    if (!voices.length) return null;
    const preferred = [
      "Google 普通话",
      "Microsoft Yaoyao",
      "Microsoft Xiaoxiao",
      "Microsoft Huihui",
      "Ting-Ting",
      "Mei-Jia"
    ];
    for (const name of preferred) {
      const found = voices.find((v) => v.name.includes(name));
      if (found) return found;
    }
    return voices.find((v) => v.lang === "zh-CN") || voices[0];
  }

  // 朗读文本
  function speak(text) {
    if (!window.SpeechSynthesisUtterance || !window.speechSynthesis) {
      console.warn("[TTS] 当前浏览器不支持语音朗读");
      return;
    }

    // 停止当前朗读，避免重叠
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.92;      // 稍慢，适合小朋友
    u.pitch = 1.05;     // 稍微明亮一点
    u.volume = 1;

    const voice = pickVoice();
    if (voice) u.voice = voice;

    window.speechSynthesis.speak(u);
  }

  // 给 narrator 气泡加朗读按钮
  function decorateNarrator(el) {
    if (el.dataset.tts === "ok") return; // 已处理过
    el.dataset.tts = "ok";

    // 创建一个容器，把按钮绝对定位到右上角
    el.style.position = "relative";

    const btn = document.createElement("button");
    btn.className = "tts-btn";
    btn.setAttribute("aria-label", "朗读这段文字");
    btn.title = "朗读";
    btn.innerHTML = "🔊";
    Object.assign(btn.style, {
      position: "absolute",
      top: "6px",
      right: "6px",
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      border: "none",
      background: "rgba(255,255,255,.7)",
      cursor: "pointer",
      fontSize: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 1px 4px rgba(0,0,0,.1)",
      zIndex: "2"
    });

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const text = el.textContent.replace(/🔊/g, "").trim();
      speak(text);
    });

    el.appendChild(btn);

    // 如果开启了自动朗读，且是新出现的主要 narrator，则自动朗读
    if (autoSpeak && !el.closest(".feedback")) {
      const text = el.textContent.replace(/🔊/g, "").trim();
      // 延迟一点，等页面渲染完
      setTimeout(() => speak(text), 300);
    }
  }

  // 监听动态生成的 narrator
  function observeNarrators() {
    // 先处理已有的
    document.querySelectorAll(".narrator").forEach(decorateNarrator);

    // 再用 MutationObserver 处理后续生成的
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.classList && node.classList.contains("narrator")) {
            decorateNarrator(node);
          }
          if (node.querySelectorAll) {
            node.querySelectorAll(".narrator").forEach(decorateNarrator);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // 暴露全局 API
  window.ShiguangTTS = {
    speak,
    setAutoSpeak: (enabled) => {
      autoSpeak = !!enabled;
      localStorage.setItem(STORAGE_KEY, autoSpeak ? "1" : "0");
    },
    getAutoSpeak: () => autoSpeak
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
