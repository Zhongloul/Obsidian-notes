import { readdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const docsDir = new URL("../docs", import.meta.url).pathname;
const outPath = join(docsDir, "index.html");
const metaPath = join(docsDir, "site-lib", "metadata.json");

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

let pages = [];
if (existsSync(metaPath)) {
  try {
    const meta = JSON.parse(readFileSync(metaPath, "utf8"));
    pages = (meta.shownInTree || []).filter(
      (f) => f.toLowerCase().endsWith(".html") && !f.startsWith("site-lib/") && f !== "index.html"
    );
  } catch (e) {
    pages = [];
  }
}
if (pages.length === 0) {
  collect(docsDir, "", pages);
  pages = pages.filter((f) => !f.startsWith("site-lib/") && f !== "index.html");
}
pages = [...new Set(pages)];

const groupMap = new Map();
for (const f of pages) {
  const parts = f.split("/");
  const folder = parts.length > 1 ? parts[0] : "";
  if (!folder) continue;
  const label = decodeURIComponent(parts[parts.length - 1].replace(/\.html$/i, ""));
  const path = f.replace(/ /g, "%20");
  if (!groupMap.has(folder)) groupMap.set(folder, []);
  groupMap.get(folder).push({ label, path });
}

const clean = (s) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const treeHtml = [];
const cardsHtml = [];
const dataJson = [];

for (const [folder, items] of groupMap) {
  items.sort((a, b) => a.label.localeCompare(b.label, "zh"));
  const dispFolder = folder ? folder : "根目录";
  treeHtml.push('<div class="tree-folder" data-folder="' + clean(folder) + '">');
  treeHtml.push('<div class="tree-head"><span class="arrow">&#9662;</span>' + clean(dispFolder) + "<span class='count'>" + items.length + "</span></div>");
  treeHtml.push('<ul class="tree-list">');
  for (const it of items) {
    const key = folder + "/" + it.label;
    dataJson.push([key, folder, it.label, it.path]);
    treeHtml.push('<li class="tree-item"><a href="' + clean(it.path) + '" data-key="' + clean(key) + '">' + clean(it.label) + "</a></li>");
    cardsHtml.push('<a class="note" href="' + clean(it.path) + '" data-key="' + clean(key) + '"><span>' + clean(it.label) + "</span><span class='arrow'>-&gt;</span></a>");
  }
  treeHtml.push("</ul></div>");
}

const page = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>我的笔记</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Segoe UI", "Microsoft YaHei", sans-serif; background: #f6f8fb; color: #26324d; }
  .layout { display: flex; min-height: 100vh; }
  #sidebar { width: 300px; flex-shrink: 0; background: #ffffff; border-right: 1px solid #e6e9f2; padding: 18px 14px; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
  #resizer { width: 6px; flex-shrink: 0; cursor: col-resize; background: transparent; transition: background .15s; }
  #resizer:hover, #resizer.active { background: #c7d0f4; }
  body.resizing { cursor: col-resize; user-select: none; }
  .brand { font-size: 18px; font-weight: 700; padding: 0 6px 12px; }
  #search { width: 100%; padding: 9px 12px; border: 1px solid #dde2ee; border-radius: 8px; font-size: 14px; outline: none; margin-bottom: 12px; }
  #search:focus { border-color: #7a8cff; }
  .tree-folder { margin-bottom: 8px; }
  .tree-folder.collapsed .tree-list { display: none; }
  .tree-head { font-size: 12.5px; color: #8a93a8; font-weight: 600; padding: 6px 6px 4px; display: flex; align-items: center; gap: 4px; cursor: pointer; user-select: none; border-radius: 6px; }
  .tree-head:hover { background: #f2f4fb; }
  .tree-head .arrow { display: inline-block; font-size: 10px; color: #9aa4bd; transition: transform .15s; }
  .tree-folder.collapsed .tree-head .arrow { transform: rotate(-90deg); }
  .tree-head .count { margin-left: auto; font-weight: 500; }
  .tree-list { list-style: none; }
  .tree-item a { display: block; padding: 6px 8px; font-size: 13.5px; color: #3b4664; text-decoration: none; border-radius: 6px; line-height: 1.4; }
  .tree-item a:hover { background: #eef1fb; }
  .tree-item.hide, .tree-folder.hide { display: none; }
  main { flex: 1; padding: 34px 38px; max-width: 860px; }
  h1 { font-size: 26px; margin-bottom: 6px; }
  .sub { color: #8a93a8; font-size: 14px; margin-bottom: 22px; }
  #cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  a.note { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; text-decoration: none; color: #2f3b57; background: #ffffff; border: 1px solid #e6e9f2; border-radius: 10px; font-size: 14px; transition: background .15s, transform .15s; }
  a.note:hover { background: #eef1fb; transform: translateY(-1px); }
  a.note .arrow { color: #9aa4bd; font-size: 12px; }
  a.note.hide, #no-result { display: none; }
  #no-result.show { display: block; color: #8a93a8; margin-top: 20px; }
  @media (max-width: 860px) {
    .layout { flex-direction: column; }
    #sidebar { width: 100%; height: auto; position: static; border-right: none; border-bottom: 1px solid #e6e9f2; }
    main { padding: 22px 18px; }
    #cards { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<div class="layout">
  <aside id="sidebar">
    <div class="brand">我的笔记</div>
    <input id="search" type="search" placeholder="搜索笔记..." autocomplete="off">
    <nav id="tree"></nav>
  </aside>
  <div id="resizer"></div>
  <main>
    <h1>我的笔记</h1>
    <div class="sub">Obsidian 导出 · 点击任意一篇查看（左侧为导航，上方可搜索）</div>
    <div id="cards"></div>
    <div id="no-result">没有找到匹配的笔记。</div>
  </main>
</div>
<script>
(function () {
  var DATA = ${JSON.stringify([...dataJson])};
  var tree = document.getElementById("tree");
  var cards = document.getElementById("cards");
  var search = document.getElementById("search");
  var resizer = document.getElementById("resizer");
  var sidebar = document.getElementById("sidebar");
  var items = [];

  function build() {
    tree.innerHTML = ${JSON.stringify(treeHtml.join(""))};
    cards.innerHTML = ${JSON.stringify(cardsHtml.join(""))};
    items = DATA.map(function (d) { return { key: d[0], folder: d[1], label: d[2], path: d[3] }; });
  }
  build();

  resizer.addEventListener("mousedown", function (e) {
    e.preventDefault();
    var startX = e.clientX;
    var startW = sidebar.getBoundingClientRect().width;
    resizer.classList.add("active");
    document.body.classList.add("resizing");
    function onMove(ev) {
      var w = startW + (ev.clientX - startX);
      if (w < 220) w = 220;
      if (w > 480) w = 480;
      sidebar.style.width = w + "px";
    }
    function onUp() {
      resizer.classList.remove("active");
      document.body.classList.remove("resizing");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
  resizer.addEventListener("touchstart", function (e) {
    var t = e.touches[0];
    var startX = t.clientX;
    var startW = sidebar.getBoundingClientRect().width;
    resizer.classList.add("active");
    function onMove(ev) {
      var x = ev.touches[0].clientX;
      var w = startW + (x - startX);
      sidebar.style.width = Math.min(480, Math.max(220, w)) + "px";
    }
    function onUp() {
      resizer.classList.remove("active");
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
    }
    document.addEventListener("touchmove", onMove);
    document.addEventListener("touchend", onUp);
  });

  document.addEventListener("click", function (e) {
    var head = e.target.closest ? e.target.closest(".tree-head") : null;
    if (head && head.parentElement.classList.contains("tree-folder")) {
      head.parentElement.classList.toggle("collapsed");
    }
  });

  search.addEventListener("input", function () {
    var q = search.value.trim().toLowerCase();
    var cardNodes = cards.querySelectorAll(".note");
    for (var i = 0; i < items.length; i++) {
      var hit = !q || items[i].label.toLowerCase().indexOf(q) >= 0 || items[i].folder.toLowerCase().indexOf(q) >= 0;
      cardNodes[i].classList.toggle("hide", !hit);
    }
    var folders = tree.querySelectorAll(".tree-folder");
    var treeItems = tree.querySelectorAll(".tree-item");
    for (var j = 0; j < items.length; j++) {
      var hit2 = !q || items[j].label.toLowerCase().indexOf(q) >= 0 || items[j].folder.toLowerCase().indexOf(q) >= 0;
      treeItems[j].classList.toggle("hide", !hit2);
    }
    for (var k = 0; k < folders.length; k++) {
      var anyVisible = folders[k].querySelectorAll(".tree-item:not(.hide)").length > 0;
      folders[k].classList.toggle("hide", !anyVisible);
    }
    var anyCard = cards.querySelectorAll(".note:not(.hide)").length > 0;
    document.getElementById("no-result").classList.toggle("show", !anyCard);
  });
})();
</script>
</body>
</html>
`;

const old = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";
if (old !== page) {
  writeFileSync(outPath, page);
  console.log("index.html updated, pages:", pages.length);
} else {
  console.log("index.html unchanged");
}
