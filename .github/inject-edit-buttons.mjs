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
  const noExt = rel.replace(/\.md$/i, "");
  const lower = noExt.toLowerCase();
  const variants = new Set([
    lower,
    lower.replace(/\s+/g, "-"),
    lower.replace(/\s*[-–—]\s*/g, "-").replace(/\s+/g, "-"),
  ]);
  for (const v of variants) {
    if (!mdMap.has(v)) mdMap.set(v, rel);
  }
}

const htmls = [];
walk(docsDir, htmls, new Set(["site-lib"]));

const style = '<style>.gh-edit-btn{position:fixed;right:18px;bottom:18px;z-index:9999;background:#2f6fed;color:#fff;text-decoration:none;font:13px/1 "Microsoft YaHei",sans-serif;padding:9px 14px;border-radius:20px;box-shadow:0 4px 14px rgba(47,111,237,.35);opacity:.9}.gh-edit-btn:hover{opacity:1}</style>';

let injected = 0;
let skipped = 0;
for (const h of htmls) {
  const relHtml = relative(docsDir, h).split(sep).join("/");
  if (/^index\.html$/i.test(relHtml)) continue;
  const key = decodeURIComponent(relHtml).toLowerCase().replace(/\.html$/i, "");
  const mdRel = mdMap.get(key);
  if (!mdRel) {
    skipped++;
    continue;
  }
  let content = readFileSync(h, "utf8");
  if (content.includes(MARKER)) continue;
  const href = EDIT_BASE + encodeURI(mdRel).replace(/#/g, "%23");
  const btn = style + '<a class="gh-edit-btn" href="' + href + '" target="_blank" rel="noopener">&#9998; 编辑此页</a>';
  content = content.replace(/<\/body>/i, btn + "</body>");
  writeFileSync(h, content);
  injected++;
}

console.log("injected:", injected, "skipped(no md):", skipped);
