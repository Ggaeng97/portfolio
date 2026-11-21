// 칩 팝업: 성당 위 칩(.hc-chips a)을 누르면 그 장의 카드를 띄운다 — 페이지는 넘기지 않는다(사용자 11-13).
// 카드 = 왼쪽 큰 그림(원래 ↔ 고친 뒤 끌어 비교 등) + 오른쪽 글(원래 · 짚은 것 · 시킨 방법 · 그래서), 아래 작은 그림을 누르면 위가 그 항목으로 바뀜.
// 자료는 index.html 의 <script id="chipData">(JSON). 오프닝 위에서도 뜨고, 떠 있는 동안 뒤 페이지·오프닝은 굴러가지 않는다.
window.ChipModal = (function () {
  var DATA = {}, cm = null, box = null, from = null, cur = null;
  try { DATA = JSON.parse(document.getElementById("chipData").textContent); } catch (e) {}
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function seeded(n) { var x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); }
  function wave() {   // 파형(영상 편집)
    var h = "";
    for (var k = 0; k < 56; k++) { var v = 0.15 + 0.85 * Math.abs(Math.sin(k * 0.37) * 0.6 + (seeded(k) - 0.5) * 0.8); h += "<i style='height:" + Math.min(100, v * 70).toFixed(0) + "%'></i>"; }
    return "<div class='art art-wave'>" + h + "<s></s></div>";
  }
  function line() {   // 편집 타임라인(편집 도구)
    var C = ["#8f9ff0", "#c9b48a", "#6474c8", "#b9c3ff", "#a38c5e"], rows = [[3, 2, 4, 2, 3], [5, 3, 2, 4], [2, 6, 3, 3]];
    return "<div class='art art-line'>" + rows.map(function (r, i) {
      return "<div>" + r.map(function (w, j) { return "<span style='flex:" + w + ";background:" + C[(i * 2 + j) % C.length] + ";opacity:" + (i === 2 ? .45 : .9) + "'></span>"; }).join("") + "</div>";
    }).join("") + "<s></s></div>";
  }
  function stage(s) {
    if (s.cmp) return "<div class='cmpd fit'><img class='aft' src='" + s.cmp[1] + "' alt='" + esc(s.lb[1]) + "'><div class='bef'><img src='" + s.cmp[0] + "' alt='" + esc(s.lb[0]) + "'></div>" +
      "<i class='bar'><b>‹ ›</b></i><span class='lb l'>" + esc(s.lb[0]) + "</span><span class='lb r'>" + esc(s.lb[1]) + "</span></div>";
    // 영상이 핵심인 항목(대롱대롱 · 던지기 등)은 영상으로(사용자 11-15 "여기 페이지들이 영상이 아니네")
    if (s.vid) return "<video class='cm-one' src='" + s.vid + "' poster='" + (s.poster || "") + "' muted loop autoplay playsinline aria-label='" + esc(s.cap) + "'></video>" + (s.cap ? "<span class='cm-cap'>" + esc(s.cap) + "</span>" : "");
    if (s.img) return "<img class='cm-one' src='" + s.img + "' alt='" + esc(s.cap) + "'>" + (s.cap ? "<span class='cm-cap'>" + esc(s.cap) + "</span>" : "");
    if (s.art) return s.art === "wave" ? wave() : line();
    if (s.flow) return "<div class='cm-flow'>" + s.flow.map(function (f, i) { return "<span><i>" + (i + 1) + "</i>" + esc(f) + "</span>"; }).join("") + "</div>";
    if (s.dur) return "<div class='cm-dur'><div><b>편집자가 직접</b><p><i style='width:75%'></i></p><em>2~4시간 · 늦으면 하루 이틀</em></div><div><b>EDITRA</b><p><i class='hot' style='width:11%'></i></p><em>20~30분 · 분석부터 내용 확인까지 아홉 단계</em></div></div>";
    if (s.big) return "<div class='cm-big'><b>" + s.big + "</b></div>";
    return "";
  }
  function textHTML(it) {
    // 글은 짧은 칩으로 세로로(문제 → 원인 → 지시 → 결과, 사용자 11-14: 긴 글은 한눈에 안 읽힘)
    // 앱 카드는 칸 대신 의도가 드러나는 이야기 문단(사용자 11-15) — <b> 만 쓰는 우리 글이라 그대로 넣음
    if (it.story) return "<h4>" + esc(it.h) + "</h4><p class='cm-story'>" + it.story + "</p>";
    return "<h4>" + esc(it.h) + "</h4><ol class='cm-chips'>" + it.rows.map(function (r) {
      return "<li" + (r[2] ? " class='k'" : "") + "><b>" + esc(r[0]) + "</b><span>" + esc(r[1]) + "</span></li>";
    }).join("") + "</ol>";
  }
  // 아래 칸 = 첫 화면 칩과 같은 박스(굵은 이름 + 흐린 한 줄). 그림이 있으면 박스 안 위쪽에 작게
  function thumbHTML(it, i) {
    var t = it.thumb, name = t.cap || t.txt;
    var pic = "";
    return "<button type='button' class='cm-th' data-i='" + i + "'><span class='cm-tile'>" + pic + "<b>" + esc(name) + "</b></span></button>"   /* 제목만(사용자 11-14) */;
  }
  function show(i) {
    var it = cur.items[i];
    box.querySelector(".cm-stage").innerHTML = stage(it.stage);
    box.querySelector(".cm-text").innerHTML = textHTML(it);
    box.querySelectorAll(".cm-th").forEach(function (b) { b.classList.toggle("on", +b.dataset.i === i); });
    var c = box.querySelector(".cmpd"); if (c && window.initCmp) window.initCmp(c);
  }
  function build() {
    cm = document.createElement("div");
    cm.className = "cm"; cm.hidden = true; cm.setAttribute("role", "dialog"); cm.setAttribute("aria-modal", "true");
    cm.innerHTML = "<div class='cm-box'><button class='cm-x' type='button' aria-label='닫기'>×</button><h3></h3>" +
      "<div class='cm-card'><div class='cm-stage'></div><div class='cm-text'></div></div><div class='cm-ths'></div></div>";
    document.body.appendChild(cm);
    box = cm.querySelector(".cm-box");
    cm.addEventListener("click", function (e) {
      if (e.target === cm || e.target.closest(".cm-x")) { close(); return; }
      var b = e.target.closest(".cm-th"); if (b) show(+b.dataset.i);
    });
    function block(e) { if (!(box.contains(e.target) && box.scrollHeight > box.clientHeight)) e.preventDefault(); }
    cm.addEventListener("wheel", block, { passive: false });
    cm.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", function (e) { if (e.key === "Escape" && !cm.hidden) { e.stopImmediatePropagation(); close(); } }, true);
  }
  function open(id, opener) {
    cur = DATA[id];
    if (!cur) return false;
    var start = 0;
    if (cur.ref) { start = cur.start || 0; cur = DATA[cur.ref]; if (!cur) return false; }   // 02 칩 = 영상 편집 카드의 EDITRA 장부터(사용자 11-15 '전엔 종류가 많았다')
    if (!cm) build();
    from = opener || null;
    box.querySelector("h3").textContent = cur.title;
    var ths = box.querySelector(".cm-ths");
    ths.innerHTML = cur.items.map(thumbHTML).join("");
    ths.style.setProperty("--n", cur.items.length);
    ths.hidden = cur.items.length < 2;
    show(start);
    box.scrollTop = 0;
    cm.hidden = false;
    document.documentElement.classList.add("cm-open");
    requestAnimationFrame(function () { cm.classList.add("show"); });
    return true;
  }
  function close() {
    if (!cm || cm.hidden) return;
    cm.classList.remove("show");
    window.__cmClosedAt = performance.now();   // 닫은 직후의 입력이 오프닝을 넘기지 않게(intro.js)
    setTimeout(function () { cm.hidden = true; document.documentElement.classList.remove("cm-open"); }, 300);
    if (from) from.focus({ preventScroll: true });
  }
  // 첫 화면 칩
  document.addEventListener("click", function (e) {
    var a = e.target.closest(".hcath .hc-chips a");
    if (a && open(a.getAttribute("href"), a)) e.preventDefault();
  });
  return { open: open, close: close, wave: wave };
})();
