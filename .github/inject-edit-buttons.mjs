import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const docsDir = join(root, "docs");
const EDIT_BASE = "https://github.com/Zhongloul/Obsidian-notes/edit/main/";
const MARKER = "gh-edit-btn";

function walk(dir, out, skipNames) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (skipNames.has(entry.name.toLowerCase()) || entry.name.startsWith(".")) continue;
      walk(join(dir, entry.name), out, skipNames);
    } else {
      out.push(join(dir, entry.name));
    }
  }
}

const allFiles = [];
walk(root, allFiles, new Set(["docs", "node_modules"]));

const mdMap = new Map();
for (const f of allFiles) {
  if (!f.toLowerCase().endsWith(".md")) continue;
  const rel = relative(root, f).split(sep).join("/");
  const lower = rel.replace(/\.md$/i, "").toLowerCase();
  for (const v of [lower, lower.replace(/\s+/g, "-"), lower.replace(/\s*[-–—]\s*/g, "-").replace(/\s+/g, "-")]) {
    if (!mdMap.has(v)) mdMap.set(v, rel);
  }
}

const htmls = [];
walk(docsDir, htmls, new Set(["site-lib"]));

const pagePairs = {};
const targets = [];
for (const h of htmls) {
  const relHtml = relative(docsDir, h).split(sep).join("/");
  if (/^index\.html$/i.test(relHtml)) continue;
  const key = decodeURIComponent(relHtml).toLowerCase().replace(/\.html$/i, "");
  const mdRel = mdMap.get(key);
  if (!mdRel) continue;
  pagePairs[key] = mdRel;
  targets.push(h);
}

const mapJson = JSON.stringify(pagePairs).replace(/</g, "\\u003c");
const style = '<style>.gh-edit-btn{position:fixed;right:18px;bottom:18px;z-index:9999;background:#2f6fed;color:#fff;text-decoration:none;font:13px/1 "Microsoft YaHei",sans-serif;padding:9px 14px;border-radius:20px;box-shadow:0 4px 14px rgba(47,111,237,.35);opacity:.9;cursor:pointer}.gh-edit-btn:hover{opacity:1}</style>';
const script =
  "<script>(function(){var M=" + mapJson + ";" +
  "function keyOf(){var segs=decodeURIComponent(location.pathname).split('/').filter(Boolean);" +
  "var take=segs.slice(-2).join('/');if(!take)take=segs[0]||'';return take.replace(/\\.html$/i,'').toLowerCase();}" +
  "window.__editHere=function(){var md=M[keyOf()];if(!md){alert('未找到对应的源文件：'+keyOf());return;}" +
  "window.open('" + EDIT_BASE + "'+encodeURI(md).replace(/#/g,'%23'),'_blank');};" +
  "})();</script>";
const btn = style + '<a class="gh-edit-btn" id="gh-edit-btn" href="javascript:void(0)" onclick="__editHere();return false;">&#9998; 编辑此页</a>' + script;

let injected = 0;
let updated = 0;
for (const h of targets) {
  let content = readFileSync(h, "utf8");
  const had = content.includes(MARKER);
  if (had) {
    content = content.replace(/<style>\.gh-edit-btn[\s\S]*?(?=<\/body>)/i, "");
  }
  content = content.replace(/<\/body>/i, btn + "</body>");
  writeFileSync(h, content);
  if (had) updated++;
  else injected++;
}

console.log("injected:", injected, "updated:", updated, "pages:", targets.length);
