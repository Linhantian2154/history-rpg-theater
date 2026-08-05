/*
 * 批量添加版权声明脚本
 * Copyright (c) 2026 林寒天. All Rights Reserved.
 *
 * 用法：
 * 1. 把此文件放到仓库根目录
 * 2. 运行：node add-copyright.js
 * 3. 脚本会自动处理 index.html 和所有子目录的 index.html 文件
 * 4. 处理前会自动创建 .backup 目录备份原文件
 */

const fs = require("fs");
const path = require("path");

const AUTHOR = "林寒天";
const YEAR = "2026";
const COPYRIGHT_LINE = `Copyright (c) ${YEAR} ${AUTHOR}. All Rights Reserved.`;
const FOOTER_HTML = `
<footer class="site-footer" style="text-align:center;padding:18px 12px;font-size:.78rem;color:#a89c80;background:#fff;border-top:1px solid #f0e0b8;margin-top:24px;">
  &copy; ${YEAR} ${AUTHOR} | 时光大冒险 · 中国历史人物剧场 | All Rights Reserved
</footer>`;

const JS_COMMENT = `/*!
 * 时光大冒险 · 中国历史人物剧场
 * ${COPYRIGHT_LINE}
 * 未经授权禁止复制、修改、分发或用于商业用途。
 */\n`;

function walk(dir, ext, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== ".git" && entry.name !== ".backup") {
      walk(full, ext, files);
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      files.push(full);
    }
  }
  return files;
}

function addCopyright(filePath, backupDir) {
  let html = fs.readFileSync(filePath, "utf-8");

  // 如果已经包含 All Rights Reserved 或版权声明，跳过
  if (html.includes("All Rights Reserved") || html.includes("保留所有权利")) {
    console.log(`[SKIP] ${filePath}`);
    return;
  }

  // 备份
  const rel = path.relative(process.cwd(), filePath);
  const backupPath = path.join(backupDir, rel);
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.copyFileSync(filePath, backupPath);

  // 1. 在 </head> 前添加 meta 标签
  const metaBlock = `
  <meta name="author" content="${AUTHOR}">
  <meta name="copyright" content="${COPYRIGHT_LINE}">`;
  if (!html.includes('name="copyright"')) {
    html = html.replace(/<\/head>/i, `${metaBlock}\n</head>`);
  }

  // 2. 在 </body> 前添加 footer
  if (!html.includes("site-footer")) {
    html = html.replace(/<\/body>/i, `${FOOTER_HTML}\n</body>`);
  }

  // 3. 给内联 <script> 顶部加版权注释（可选，只处理较大的脚本块）
  html = html.replace(/(<script[^>]*>)(\s*)([\s\S]{0,200}function)/i, (match, p1, p2, p3) => {
    // 避免重复添加
    if (match.includes("Copyright (c)")) return match;
    return `${p1}\n${JS_COMMENT}${p3}`;
  });

  fs.writeFileSync(filePath, html, "utf-8");
  console.log(`[OK] ${filePath}`);
}

function main() {
  const root = process.cwd();
  const backupDir = path.join(root, ".backup", Date.now().toString());
  fs.mkdirSync(backupDir, { recursive: true });

  const files = walk(root, ".html");
  let count = 0;
  for (const file of files) {
    addCopyright(file, backupDir);
    count++;
  }

  console.log(`\n处理完成：${count} 个文件`);
  console.log(`备份目录：${backupDir}`);
  console.log("请检查 diff 后再提交到 Git。");
}

main();
