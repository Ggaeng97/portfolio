// 모니터 + 트랙 뷰어: [data-viewer] 안의 <script type="application/json" class="vdata"> 목록을 읽어
// 위 모니터(그림 + 설명) 하나와 아래 트랙(클립)을 만든다.
// 클립에 마우스를 올리면 모니터가 바뀐다. ▶ 는 차례로 저절로 넘김. ← → 키로도 넘김. 확대 효과 없음.
// 항목: { clip, short, kind, title, rows:[[이름, 내용, "how"?]], said:[문장, 날짜], pics:[[주소, 설명]] }
//      kind = fail | pass | luck | wip | crit | info · mark:true 면 고를 수 없는 표식(예: 기준 올림)
(function () {
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  document.querySelectorAll("[data-viewer]").forEach(function (box) {
    var items = JSON.parse(box.querySelector(".vdata").textContent);
    var pick = items.filter(function (it) { return !it.mark; });
    box.insertAdjacentHTML("beforeend",
      "<div class='vmon'><div class='vpics'></div><div class='vtext'></div></div>" +
      "<div class='vctrl'><button class='vprev' type='button'>◀</button><button class='vplay' type='button'>▶ 차례로 보기</button>" +
      "<button class='vnext' type='button'>▶▶</button><span class='vtc'></span></div><div class='vtrack' tabindex='0'></div>");
    var pics = box.querySelector(".vpics"), text = box.querySelector(".vtext"), tc = box.querySelector(".vtc");
    var track = box.querySelector(".vtrack"), playB = box.querySelector(".vplay");
    var clips = [];

    items.forEach(function (it) {
      if (it.mark) { track.insertAdjacentHTML("beforeend", "<div class='vmark'>" + esc(it.clip) + "</div>"); return; }
      var b = document.createElement("button");
      b.type = "button";
      b.className = "vclip k-" + it.kind;
      b.innerHTML = "<b>" + esc(it.clip) + "</b><span>" + esc(it.short || "") + "</span>";
      var k = clips.length;
      b.onmouseenter = function () { stop(); show(k); };
      b.onclick = function () { stop(); show(k); };
      track.appendChild(b);
      clips.push(b);
    });

    var cur = -1, timer = null;
    function show(k) {
      if (k === cur) return;
      cur = k;
      var it = pick[k];
      clips.forEach(function (c, j) { c.classList.toggle("on", j === k); });
      var ps = it.pics || [];
      box.querySelector(".vmon").classList.toggle("nopic", ps.length === 0);
      pics.className = "vpics " + (ps.length > 1 ? "two" : "one");
      pics.innerHTML = ps.map(function (p) {
        return "<figure><img src='" + p[0] + "' alt=''><figcaption>" + esc(p[1] || "") + "</figcaption></figure>"; }).join("");
      var h = "<span class='vbadge k-" + it.kind + "'>" + esc(it.badge || it.clip) + "</span><h4>" + esc(it.title) + "</h4><dl>";
      (it.rows || []).forEach(function (r) { h += "<dt>" + esc(r[0]) + "</dt><dd" + (r[2] ? " class='how'" : "") + ">" + esc(r[1]) + "</dd>"; });
      h += "</dl>";
      if (it.said) h += "<p class='said'>\"" + esc(it.said[0]) + "\"<em>" + esc(it.said[1] || "") + "</em></p>";
      text.innerHTML = h;
      pics.style.animation = text.style.animation = "none"; void text.offsetWidth;
      pics.style.animation = text.style.animation = "";
      tc.textContent = String(k + 1).padStart(2, "0") + " / " + String(pick.length).padStart(2, "0");
    }
    function stop() { clearInterval(timer); timer = null; playB.textContent = "▶ 차례로 보기"; }
    function play() {
      if (timer) { stop(); return; }
      playB.textContent = "❚❚ 멈춤";
      if (cur >= pick.length - 1) show(0);
      timer = setInterval(function () { if (cur >= pick.length - 1) stop(); else show(cur + 1); }, 3200);
    }
    playB.onclick = play;
    box.querySelector(".vprev").onclick = function () { stop(); show(Math.max(0, cur - 1)); };
    box.querySelector(".vnext").onclick = function () { stop(); show(Math.min(pick.length - 1, cur + 1)); };
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { stop(); show(Math.min(pick.length - 1, cur + 1)); e.preventDefault(); }
      if (e.key === "ArrowLeft") { stop(); show(Math.max(0, cur - 1)); e.preventDefault(); }
    });
    show(0);
  });
})();
