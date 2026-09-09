import { readdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const docsDir = new URL("../docs", import.meta.url).pathname;
const outPath = join(docsDir, "index.html");
const homePath = join(docsDir, "Home.html");

function collect(dir, prefix, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      collect(full, rel, out);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html") && entry.name !== "index.html") {
      out.push(rel.split("\\").join("/"));
    }
  }
}

let page;
if (existsSync(homePath)) {
  page = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0; url=Home.html">
<title>我的笔记</title>
<script>location.replace("Home.html");</script>
</head>
<body>
<p>正在进入笔记首页… 若未跳转，请<a href="Home.html">点击这里</a>。</p>
</body>
</html>
`;
} else {
  const pages = [];
  collect(docsDir, "", pages);
  pages.sort((a, b) => a.localeCompare(b, "zh"));
  const listHtml = pages
    .map((f) => {
      const label = decodeURIComponent(f.split("/").pop().replace(/\.html$/i, ""));
      return `<a class="note" href="${f}"><span>${label}</span><span class="arrow">-></span></a>`;
    })
    .join("\n");
  page = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>我的笔记</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Segoe UI", "Microsoft YaHei", sans-serif; background: linear-gradient(160deg, #f6f8fb 0%, #eeeff6 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .card { width: 100%; max-width: 640px; background: #fff; border-radius: 16px; box-shadow: 0 12px 40px rgba(30, 40, 90, .12); padding: 42px 40px; }
  h1 { font-size: 26px; color: #26324d; margin-bottom: 6px; }
  .sub { color: #8a93a8; font-size: 14px; margin-bottom: 26px; }
  a.note { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; margin-bottom: 10px; text-decoration: none; color: #2f3b57; background: #f4f6fb; border-radius: 10px; transition: background .15s, transform .15s; font-size: 15px; }
  a.note:hover { background: #e8edfa; transform: translateX(3px); }
  a.note .arrow { color: #9aa4bd; font-size: 13px; }
  .hint { margin-top: 22px; font-size: 12.5px; color: #a0a8ba; line-height: 1.8; }
</style>
</head>
<body>
<div class="card">
  <h1>我的笔记</h1>
  <div class="sub">Obsidian 导出 · 点击任意一篇查看（左侧有导航树）</div>
  <div id="list">
${listHtml || '<div style="color:#8a93a8;font-size:14px;padding:12px 0;">导出目录中还没有页面。</div>'}
  </div>
  <div class="hint">提示：进入任意页面后，左侧即为文件导航树，右上角可搜索。</div>
</div>
</body>
</html>
`;
}

const old = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";
if (old !== page) {
  writeFileSync(outPath, page);
  console.log("index.html updated");
} else {
  console.log("index.html unchanged");
}
