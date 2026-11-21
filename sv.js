// 스크롤 뷰어: 누를 필요 없이 스크롤만 하면 된다.
// 넓은 화면: 왼쪽에 항목 글이 차례로 밝아지고, 오른쪽에 붙어 있는 그림이 지금 읽는 항목의 그림으로 저절로 바뀐다.
// 좁은 화면: 그림은 각 항목 글 바로 아래에 놓인다(위에 붙어 글을 가리지 않게).
// 자료: [data-sv] 안의 <script type="application/json" class="vdata"> 목록.
//   항목 = {kind(fail|pass|luck|wip|crit|info), badge, title, rows:[[이름, 글, "how"?]], pics:[[그림, 설명]]}
//   구분선 = {mark: true, clip: 이름, text: 설명}
(function () {
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  document.querySelectorAll("[data-sv]").forEach(function (box) {
    var items = JSON.parse(box.querySelector(".vdata").textContent);
    box.insertAdjacentHTML("beforeend",
      "<div class='sv'><div class='sv-steps'></div><div class='sv-side'><div class='sv-sticky'><div class='sv-mon'></div></div></div></div>");
    var stepsEl = box.querySelector(".sv-steps"), mon = box.querySelector(".sv-mon");
    var steps = [], groups = [];

    items.forEach(function (it) {
      if (it.mark) {
        stepsEl.insertAdjacentHTML("beforeend", "<div class='sv-mark'><b>" + esc(it.clip) + "</b><span>" + esc(it.text || "") + "</span></div>");
        return;
      }
      var h = "<span class='vbadge'>" + esc(it.badge || it.clip) + "</span><h4>" + esc(it.title) + "</h4><dl>";
      (it.rows || []).forEach(function (r) {
        var how = r[2] ? " class='how'" : "";
        h += "<dt" + how + ">" + esc(r[0]) + "</dt><dd" + how + ">" + esc(r[1]) + "</dd>";
      });
      h += "</dl>";
      // 좁은 화면용: 그림을 그 항목 글 바로 아래에(위에 떠서 글을 가리지 않게)
      var ps0 = it.pics || [];
      if (ps0.length) h += "<div class='sv-inline'>" + ps0.map(function (p) {
        return "<figure><img loading='lazy' src='" + p[0] + "' alt=''><figcaption>" + esc(p[1] || "") + "</figcaption></figure>"; }).join("") + "</div>";
      var art = document.createElement("article");
      art.className = "sv-step k-" + it.kind;
      art.innerHTML = h;
      stepsEl.appendChild(art);
      steps.push(art);

      var ps = it.pics || [];
      var g = document.createElement("div");
      g.className = "sv-pics " + (ps.length > 1 ? "two" : ps.length ? "one" : "none");
      g.innerHTML = ps.length ? ps.map(function (p) {
        return "<figure><img loading='lazy' src='" + p[0] + "' alt=''><figcaption>" + esc(p[1] || "") + "</figcaption></figure>"; }).join("")
        : "<div class='sv-empty'>" + esc(it.title) + "</div>";
      mon.appendChild(g);
      groups.push(g);
    });

    var cur = -1;
    function show(k) {
      if (k === cur) return;
      cur = k;
      steps.forEach(function (s, j) { s.classList.toggle("on", j === k); });
      groups.forEach(function (g, j) { g.classList.toggle("on", j === k); });
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) show(steps.indexOf(e.target)); });
    }, { rootMargin: "-42% 0px -42% 0px" });
    steps.forEach(function (s) { io.observe(s); });
    show(0);
  });
})();
