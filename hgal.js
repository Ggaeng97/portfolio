// 가로 갤러리([data-hgal]): 어두운 전체 화면 뒤에 카드 대신 쓰는 방식. 화면을 붙잡아 두고, 내리는 만큼 판이 옆으로 넘어간다.
//  - 첫 판(.hg-intro)은 HTML 에 있고, 나머지 판은 같은 구역의 <script class="vdata"> 항목(title·badge·rows·pics)으로 만든다.
//  - 판마다 탁 걸림(스크롤 위치로 판 번호만 정함). 보는 판만 또렷, 좌우 판은 거의 안 보이게. 아래 막대 위에는 묶음 이름(badge)이 그 판 자리에 붙는다.
//  - 좁은 화면(900px 이하)은 붙잡지 않고 위아래로 쌓는다.
(function () {
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function panelHTML(it) {
    var ps = it.pics || [];
    var pics = ps.map(function (p) {
      return "<figure><img src='" + p[0] + "' alt='" + esc(p[1]) + "' loading='lazy'>" + (p[1] ? "<figcaption>" + esc(p[1]) + "</figcaption>" : "") + "</figure>";
    }).join("");
    var rows = (it.rows || []).map(function (r) { return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("");
    return "<article class='hg-panel" + (it.kind === "crit" ? " crit" : "") + "'><div class='hg-pics n" + Math.min(ps.length, 2) + "'>" + pics + "</div>" +
      "<div class='hg-text'><h3>" + esc(it.title) + "</h3><dl>" + rows + "</dl></div></article>";   // 제목 위 작은 묶음 이름은 두지 않음(아래 묶음 줄과 겹침 — 사용자 11-13)
  }
  document.querySelectorAll("[data-hgal]").forEach(function (sec) {
    var items = JSON.parse(sec.querySelector(".vdata").textContent).filter(function (it) { return !it.mark; });
    var track = sec.querySelector(".hg-track"), fill = sec.querySelector(".hg-bar i"), groups = sec.querySelector(".hg-groups");
    var pre = track.querySelectorAll(".hg-panel").length;   // HTML 에 미리 있는 판(첫 판·제안 판) 수 — 자료 판 번호는 그 뒤부터
    track.insertAdjacentHTML("beforeend", items.map(panelHTML).join(""));
    var panels = Array.prototype.slice.call(track.querySelectorAll(".hg-panel"));
    // 묶음 이름: 같은 badge 가 처음 나오는 판에 하나씩
    var marks = [];
    items.forEach(function (it, i) {
      if (i && items[i - 1].badge === it.badge) return;
      var g = document.createElement("span"); g.textContent = it.badge; groups.appendChild(g);
      g.addEventListener("click", function () { goPanel(i + pre); });   // 누르면 그 묶음의 첫 판으로
      marks.push({ el: g, at: i + pre });
    });
    var flat = window.matchMedia("(max-width: 900px)"), xs = [], cur = -1, n = panels.length;
    function goPanel(i) {   // i 번째 판이 보이는 스크롤 자리(판마다 구간 가운데)로
      if (flat.matches) { panels[i].scrollIntoView({ behavior: "smooth", block: "center" }); return; }
      var r = sec.getBoundingClientRect(), range = r.height - window.innerHeight;
      window.scrollTo({ top: r.top + window.scrollY + (i + 0.5) / n * range, behavior: "smooth" });
    }
    sec.querySelector(".hg-bar").addEventListener("click", function (e) {
      var b = e.currentTarget.getBoundingClientRect(); goPanel(Math.min(n - 1, Math.floor(clamp((e.clientX - b.left) / b.width) * n)));
    });
    function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function layout() {
      sec.classList.toggle("flat", flat.matches);
      if (flat.matches) { sec.style.height = ""; track.style.transform = ""; cur = -1; return; }
      // 판마다 그 판이 화면 가운데 오는 자리. 스크롤은 판마다 화면 0.7 장씩
      xs = panels.map(function (pn) { return pn.offsetLeft + pn.offsetWidth / 2 - window.innerWidth / 2; });
      sec.style.height = (n * window.innerHeight * 0.7 + window.innerHeight) + "px";
      marks.forEach(function (m) { m.el.style.left = (m.at / (n - 1) * 100) + "%"; });
      cur = -1; update();
    }
    // 스크롤 속도를 따라 미끄러지지 않고, 몇 번째 판인지만 정해서 그 판으로 탁 넘어감(움직임은 CSS transition)
    function update() {
      if (flat.matches) return;
      var r = sec.getBoundingClientRect(), vh = window.innerHeight;
      var i = Math.min(n - 1, Math.floor(clamp(-r.top / Math.max(1, r.height - vh)) * n));
      if (i === cur) return;
      cur = i;
      track.style.transform = "translate3d(" + (-xs[i]).toFixed(0) + "px,0,0)";
      panels.forEach(function (pn, j) { pn.classList.toggle("on", j === i); });
      fill.style.width = (i / (n - 1) * 100).toFixed(2) + "%";
      marks.forEach(function (m, j) { m.el.classList.toggle("on", i >= m.at && (j === marks.length - 1 || i < marks[j + 1].at)); });
    }
    var queued = false;
    function req() { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; update(); }); } }
    window.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", layout);
    window.addEventListener("load", layout);
    layout();
  });
})();
