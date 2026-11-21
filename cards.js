// 항목 카드: [data-sv] 안의 자료(JSON)로 둥근 회색 카드를 만든다(흰 테마, 바르코 3D 식 카드 묶음).
//  - 그림 두 장(비교)인 항목은 가로 한 줄 전체(.wide): 위에 그림 둘, 아래에 이름표·굵은 한 줄·짧은 한 줄
//  - 그림 한 장·글뿐인 항목은 두 개씩 나란히(.two). 짝이 없이 혼자 남으면 그림 왼쪽·글 오른쪽(.side)
//  - 순서는 자료 그대로(회차 순서가 섞이지 않게). 줄마다 화면에 들어오면 하나씩 차례로 떠오른다(.stag, reveal.js)
// 자료: 항목 = {kind, badge, title, text?, rows:[[이름, 글, "how"?]], pics:[[그림, 설명]]} / 구분 = {mark:true, clip, title?, text}
(function () {
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function lineOf(it) {
    if (it.text) return it.text;
    var rows = it.rows || [];
    for (var j = 0; j < rows.length; j++) if (rows[j][2]) return rows[j][1];
    return rows.length ? rows[rows.length - 1][1] : "";
  }
  function card(it, cls) {
    var ps = it.pics || [], line = lineOf(it);
    var media = ps.length ? "<div class='card-media'>" + ps.map(function (p) {
      return "<figure" + (p[1] ? " class='cap'" : "") + "><img src='" + p[0] + "' alt='" + esc(p[1] || it.title) + "' loading='lazy'>" +
        (p[1] ? "<figcaption>" + esc(p[1]) + "</figcaption>" : "") + "</figure>";
    }).join("") + "</div>" : "";
    var body = "<div class='card-body'><div><em>" + esc(it.badge || "") + "</em><b>" + esc(it.title) + "</b></div>" +
      (ps.length ? "<span>" + esc(line) + "</span>" : "<p>" + esc(line) + "</p>") + "</div>";
    return "<article class='card k-" + (it.kind || "info") + (ps.length ? "" : " quote") + (cls ? " " + cls : "") + "'>" + media + body + "</article>";
  }

  document.querySelectorAll("[data-sv]").forEach(function (box) {
    var items = JSON.parse(box.querySelector(".vdata").textContent);
    var html = "", buf = [];
    function flush() {
      if (buf.length === 2) html += "<div class='crow two stag'>" + card(buf[0]) + card(buf[1]) + "</div>";
      else if (buf.length === 1) html += "<div class='crow stag'>" + card(buf[0], (buf[0].pics || []).length ? "side" : "") + "</div>";
      buf = [];
    }
    items.forEach(function (it) {
      if (it.mark) {
        flush();
        html += "<div class='card-mark rise'><em>" + esc(it.clip) + "</em><b>" + esc(it.title || "여기서부터 기준을 올렸습니다") +
          "</b><span>" + esc(it.text || "") + "</span></div>";
        return;
      }
      if ((it.pics || []).length >= 2) { flush(); html += "<div class='crow stag'>" + card(it, "wide") + "</div>"; return; }
      buf.push(it);
      if (buf.length === 2) flush();
    });
    flush();
    box.classList.add("cards");
    box.insertAdjacentHTML("beforeend", html);
  });
})();
