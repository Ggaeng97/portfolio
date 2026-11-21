// 구역 카드(.sc[data-sc]): 아래 작은 카드(항목)를 누르면 위 글과 큰 화면이 그 항목으로 바뀐다(바르코 3D 카드 방식).
//  - 첫 칸 '한눈에' = 구역의 핵심 영상·비교(처음 상태). 다시 누르거나 '← 한눈에 보기'로 돌아온다.
//  - '짚은 순서' 단추 줄(.goto)이 있으면 단추 줄은 그대로, 그 아래 본문만 바뀐다(.keep)
//  - 그림 두 장이 '처음/첫/중간/…전' → '지금/…뒤' 짝이고 비율이 같으면 좌우로 끌어 비교(widgets.js 의 initCmp)
//  - 그림 없이 글뿐인 항목은 큰 화면에 ✦ 줄글로
//  - .sc-thumbs.chips 이면 작은 카드 대신 회차 칩 띠(블라인드 시험)
// 자료: .sc-thumbs 안의 <script class="vdata"> (항목 = {kind, badge, title, clip?, short?, text?, rows, pics}, 구분 = {mark, clip, text})
(function () {
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function cmpPair(ps) {
    if (!ps || ps.length !== 2) return false;
    var a = ps[0][1] || "", b = ps[1][1] || "";
    return (/^(처음|첫|중간)/.test(a) || /전/.test(a)) && (/^지금/.test(b) || /뒤/.test(b));
  }
  function cmpHTML(before, after) {
    return "<div class='cmpd fit'><img class='aft' src='" + after[0] + "' alt='" + esc(after[1]) + "'><div class='bef'><img src='" + before[0] + "' alt='" + esc(before[1]) + "'></div>" +
      "<i class='bar'><b>‹ ›</b></i><span class='lb l'>" + esc(before[1]) + "</span><span class='lb r'>" + esc(after[1]) + "</span></div>";
  }
  function stageHTML(it) {
    var h = stageInner(it);
    // 그림 바탕이 흰색 등이면 큰 화면 바탕도 같은 색으로(자료의 bg) — 어두운 화면에 흰 상자처럼 뜨지 않게
    return it.bg ? h.replace(/^<div class='([^']+)'/, "<div class='$1' style='background:" + it.bg + "'") : h;
  }
  function stageInner(it) {
    var ps = it.pics || [];
    if (cmpPair(ps)) return cmpHTML(ps[0], ps[1]);
    if (ps.length === 1) return "<div class='st-one'><img src='" + ps[0][0] + "' alt='" + esc(ps[0][1] || it.title) + "'></div>";
    if (ps.length > 1) return "<div class='st-pair'>" + ps.map(function (p) {
      return "<figure><img src='" + p[0] + "' alt='" + esc(p[1]) + "'>" + (p[1] ? "<figcaption>" + esc(p[1]) + "</figcaption>" : "") + "</figure>";
    }).join("") + "</div>";
    var lines = (it.rows || []).map(function (r) { return r[1]; });
    if (!lines.length && it.text) lines = [it.text];
    return "<div class='st-quote'>" + lines.slice(0, 3).map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") + "</div>";
  }
  function detailHTML(it, noBack) {
    var rows = (it.rows || []).map(function (r) {
      return "<div" + (r[2] ? " class='how'" : "") + "><b>" + esc(r[0]) + "</b>" + esc(r[1]) + "</div>";
    }).join("") || (it.text ? "<div>" + esc(it.text) + "</div>" : "");
    return "<span class='pill k-" + (it.kind || "info") + "'>" + esc(it.badge || it.clip || "") + "</span><h3>" + esc(it.title) + "</h3>" +
      "<div class='sc-rows'>" + rows + "</div>" + (noBack ? "" : "<button class='sc-back' type='button'>← 한눈에 보기</button>");
  }
  function tileHTML(it) {
    var ps = it.pics || [];
    var inner = ps.length ? ps.slice(0, 2).map(function (p) { return "<img src='" + p[0] + "' alt='' loading='lazy'>"; }).join("")
      : "<p class='q'>" + esc(it.short || it.title) + "</p>";
    // 작은 카드엔 이름표(처음·지적 1 …)를 달지 않는다 — 그림 + 제목만(사용자 11-13: 정신없음)
    return "<span class='th-tile'><span class='th-in'>" + inner + "</span></span><b>" + esc(it.title) + "</b>";
  }

  document.querySelectorAll(".sc[data-sc]").forEach(function (sc) {
    var box = sc.querySelector(".sc-thumbs"), chips = box.classList.contains("chips"), list = box.classList.contains("list");
    var items = JSON.parse(box.querySelector(".vdata").textContent);
    var detail = sc.querySelector(".sc-detail"), stItem = sc.querySelector(".st-item"), defVid = sc.querySelector(".st-default video");
    var ov = (box.dataset.ov || "").split(",").filter(Boolean), ovLabel = box.dataset.ovLabel || "한눈에";
    // .list: 작은 카드 대신 글 탭 줄(어두운 테마 — 카드 아닌 방식)
    var html = list ? "<button class='th tab on' type='button' data-i='-1'><b>" + esc(ovLabel) + "</b></button>" : chips ? "<button class='th chip on' type='button' data-i='-1'><i style='--dot:#fff'></i><b>" + esc(ovLabel) + "</b></button>"
      : "<button class='th on' type='button' data-i='-1'><span class='th-tile'><span class='th-in'>" + ov.map(function (s) { return "<img src='" + s + "' alt=''>"; }).join("") +
        "</span></span><b>" + esc(ovLabel) + "</b></button>";
    // .line: 가는 가로 선 위 점 + 회차 이름(블라인드 시험). '기준 올림' 같은 구분은 점선 눈금, 설명은 선 아래 한 줄
    if (box.classList.contains("line")) {
      var note = "";
      html = "<div class='tl'><button class='th tl-pt on' type='button' data-i='-1'><i style='--dot:#fff'></i><b>" + esc(ovLabel) + "</b></button>";
      items.forEach(function (it, i) {
        if (it.mark) { html += "<span class='tl-mark'><em>" + esc(it.clip) + "</em></span>"; note = "<b>" + esc(it.clip) + "</b>" + esc(it.text); return; }
        html += "<button class='th tl-pt k-" + (it.kind || "info") + "' type='button' data-i='" + i + "'><i></i><b>" + esc(it.clip || it.badge) + "</b></button>";
      });
      html += "</div>";
      if (note) box.insertAdjacentHTML("afterend", "<p class='tl-note'>" + note + "</p>");
    } else items.forEach(function (it, i) {
      if (it.mark) { if (chips) html += "<span class='chip-mark'>" + esc(it.clip) + " — " + esc(it.text) + "</span>"; return; }
      html += list ? "<button class='th tab' type='button' data-i='" + i + "'><b>" + esc(it.title) + "</b></button>" : chips
        ? "<button class='th chip k-" + (it.kind || "info") + "' type='button' data-i='" + i + "'><i></i><b>" + esc(it.clip || it.badge) + "</b><span>" + esc(it.short || it.title) + "</span></button>"
        : "<button class='th k-" + (it.kind || "info") + "' type='button' data-i='" + i + "'>" + tileHTML(it) + "</button>";
    });
    box.insertAdjacentHTML("beforeend", html);
    // .goto(짚은 순서 단추 줄)가 있는 구역(제단): 제목·단추 줄은 그대로 두고 그 아래 본문만 바뀐다(사용자 11-13 — '한눈에 보기'로 돌아가는 방식이 불편).
    // 본문을 전부 미리 겹쳐 두어 높이가 가장 긴 본문에 맞춰 고정 → 단추를 바꿔 눌러도 아래 화면이 위아래로 튀지 않음
    var keep = !!sc.querySelector(".goto"), gos = sc.querySelectorAll(".goto button[data-go]");
    if (keep) {
      sc.classList.add("keep");
      detail.innerHTML = items.map(function (it, i) { return it.mark ? "" : "<div class='dt' data-i='" + i + "'>" + detailHTML(it, true) + "</div>"; }).join("");
    }

    function select(i) {
      box.querySelectorAll(".th").forEach(function (b) { b.classList.toggle("on", +b.dataset.i === i); });
      gos.forEach(function (g) { g.classList.toggle("on", +g.dataset.go === i); });
      if (keep) detail.querySelectorAll(".dt").forEach(function (d) { d.classList.toggle("on", +d.dataset.i === i); });
      if (i < 0) {
        sc.classList.remove("picked");
        if (defVid) { var p = defVid.play(); if (p && p.catch) p.catch(function () {}); }
        return;
      }
      var it = items[i];
      if (!keep) detail.innerHTML = detailHTML(it);
      stItem.innerHTML = stageHTML(it);
      var c = stItem.querySelector(".cmpd");
      if (c && window.initCmp) window.initCmp(c);
      sc.classList.add("picked");
      if (defVid) defVid.pause();
      if (window.innerWidth <= 900) {
        var top = sc.querySelector(".sc-text").getBoundingClientRect().top;
        if (top < 0) window.scrollBy({ top: top - 70, behavior: "smooth" });
      }
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest(".th");
      if (b) select(+b.dataset.i);
    });
    detail.addEventListener("click", function (e) { if (e.target.closest(".sc-back")) select(-1); });
    // 글 쪽 '짚은 순서' 버튼 → 그 항목 본문(누른 단추를 한 번 더 누르면 처음 화면으로)
    gos.forEach(function (g) {
      g.addEventListener("click", function () { select(g.classList.contains("on") ? -1 : +g.dataset.go); });
    });
  });
})();
