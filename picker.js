// 무엇부터 볼지 고르기(팝업): 오프닝 문구를 읽고 내리면 오프닝 화면 위에 뜬다. 칸을 누르면 그 분야 묶음(.track)이 소개 다음 맨 앞으로 온다
// (소개는 항상 먼저 — 소개 쪽에서 골랐으면 맨 위에 그대로, 분야들을 보던 중에 다시 골랐으면 그 분야로 내려감).
// '소개부터 차례로'·Esc·바깥 누르기 = 그냥 닫기. 위쪽 줄 '무엇부터 볼지 고르기'로 다시 열 수 있다.
// 주소에 ?first=edit | 3d 를 붙이면(editra 는 edit 묶음, game 은 3d 묶음으로 합쳐짐) 처음부터 그 분야가 맨 앞(업계마다 다른 링크로 보낼 때).
// 그림 파일이 없는 분야 칸은 여기서 그린다: 파형(영상 편집 자동화), 편집 타임라인, 진행 경로(게임).
(function () {
  var tracks = document.querySelector(".tracks");
  if (!tracks) return;
  var tiles = Array.prototype.slice.call(document.querySelectorAll("[data-pick]"));

  function seeded(n) { var x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); }
  document.querySelectorAll(".art-wave").forEach(function (el) {
    var h = "";
    for (var k = 0; k < 64; k++) {
      var v = 0.15 + 0.85 * Math.abs(Math.sin(k * 0.37) * 0.6 + (seeded(k) - 0.5) * 0.8);
      h += "<i style='height:" + Math.min(100, v * 70).toFixed(0) + "%'></i>";
    }
    el.innerHTML = h + "<s></s>";
  });
  document.querySelectorAll(".art-line").forEach(function (el) {
    var C = ["#e3805c", "#2fb39c", "#7d8cf0", "#c96a52", "#a874d6"];
    var rows = [[3, 2, 4, 2, 3], [5, 3, 2, 4], [2, 6, 3, 3]];
    el.innerHTML = rows.map(function (r, i) {
      return "<div>" + r.map(function (w, j) {
        return "<span style='flex:" + w + ";background:" + C[(i * 2 + j) % C.length] + ";opacity:" + (i === 2 ? .45 : .9) + "'></span>";
      }).join("") + "</div>";
    }).join("") + "<s></s>";
  });
  document.querySelectorAll(".art-route").forEach(function (el) {
    el.innerHTML = "<svg viewBox='0 0 200 250' preserveAspectRatio='xMidYMid slice' width='100%' height='100%'>" +
      "<path d='M30 200 C 60 150, 20 120, 70 100 S 150 110, 140 60 S 90 30, 170 20' fill='none' stroke='#c9a8ff' stroke-width='3' stroke-dasharray='6 6'/>" +
      "<circle cx='30' cy='200' r='6' fill='#e2b4e4'/><circle cx='70' cy='100' r='5' fill='#9a59cc'/><circle cx='140' cy='60' r='5' fill='#7d8cf0'/><circle cx='170' cy='20' r='7' fill='#fff'/></svg>";
  });

  var modal = document.getElementById("pickModal");
  function bringFirst(id) {
    var t = document.getElementById(id);
    if (!t) return null;
    tracks.insertBefore(t, tracks.firstElementChild);
    tiles.forEach(function (x) { x.classList.toggle("chosen", x.dataset.pick === id); });
    document.dispatchEvent(new CustomEvent("tracks-reordered"));
    return t;
  }
  // 팝업이 떠 있는 동안 뒤 페이지가 굴러가지 않게(팝업 안이 넘칠 때만 팝업 안은 굴러감)
  function blockWheel(e) {
    var b = modal.querySelector(".pick-box");
    if (!(b.contains(e.target) && b.scrollHeight > b.clientHeight)) e.preventDefault();
  }
  function lock(on) { document.documentElement.classList.toggle("locked", on); }
  function open() {
    lock(true);
    modal.hidden = false;
    requestAnimationFrame(function () { modal.classList.add("show"); });
    modal.addEventListener("wheel", blockWheel, { passive: false });
    modal.addEventListener("touchmove", blockWheel, { passive: false });
  }
  function close() {
    // 오프닝 화면이 뒤에 남아 있으면 같이 걷는다(분야를 골랐으면 불투명한 팝업 뒤에서 바로, 아니면 함께 서서히)
    document.dispatchEvent(new CustomEvent("pick-close", { detail: { solid: modal.classList.contains("solid") } }));
    window.__pickPending = false;
    lock(false);
    modal.classList.remove("show");
    modal.removeEventListener("wheel", blockWheel);
    modal.removeEventListener("touchmove", blockWheel);
    setTimeout(function () { modal.hidden = true; modal.classList.remove("solid"); }, 460);
  }
  // 고르면: 팝업을 먼저 불투명하게 덮고 → 그 뒤에서 순서를 바꾸고 그 자리로 바로 옮긴 다음 → 팝업을 걷는다(섞이는 모습이 안 보이게)
  tiles.forEach(function (x) {
    x.addEventListener("click", function (e) {
      e.preventDefault();
      modal.classList.add("solid");
      setTimeout(function () {
        // 소개는 항상 먼저(사용자 11-13): 아직 소개 쪽에 있으면 순서만 바꾸고 맨 위에 그대로, 이미 분야들을 보던 중이면 고른 분야로
        var inIntro = window.scrollY < tracks.getBoundingClientRect().top + window.scrollY - 10;
        var t = bringFirst(x.dataset.pick);
        var html = document.documentElement, sb = html.style.scrollBehavior;
        html.style.scrollBehavior = "auto";
        lock(false);
        if (t) window.scrollTo(0, inIntro ? 0 : t.getBoundingClientRect().top + window.scrollY);
        html.style.scrollBehavior = sb;
        requestAnimationFrame(function () { requestAnimationFrame(close); });
      }, 280);
    });
  });
  modal.querySelector(".pick-skip").onclick = function () { close(); };
  modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
  window.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) close(); });
  document.querySelectorAll(".pick-open").forEach(function (b) { b.onclick = open; });

  // 주소에 ?first= 가 있으면 그 분야를 맨 앞에 두고 팝업은 띄우지 않는다. 없으면 오프닝이 끝날 때 띄운다.
  var first = new URLSearchParams(location.search).get("first");
  if (first) bringFirst("t-" + ({ editra: "edit", game: "3d" }[first] || first));
  else if (document.querySelector(".intro")) {
    window.__pickPending = true;                       // 오프닝이 닫혀도 잠금 유지 → 팝업이 넘겨받음
    document.addEventListener("intro-done", open, { once: true });   // 오프닝이 걷히기 전, 그 위에 바로
  }
  else open();
})();
