// 무엇부터 볼지: 오프닝 마지막 장면에서 더 내리면 성당 위에 뜨는 팝업. 칸을 고르면 그 장이 첫 화면 바로 다음(본문 맨 앞)으로 온다 — 순서 바꾸기(사용자 11-13).
// '처음부터 차례로 보기'·Esc·바깥 = 순서 그대로 닫기. 주소에 ?first=edit | 3d | clicker 를 붙이면 팝업 없이 그 장이 맨 앞.
// 순서가 바뀌면 'tracks-reordered' 를 보내(목차·배경색·성당 장면이 다시 잼) 어두운 구역의 둥근 끝(.slab-end)도 다시 붙인다.
// 오프닝(intro.js)은 window.__pickPending 이 켜져 있으면 닫힐 때 걷히지 않고 'intro-done' 을 보낸 뒤 'pick-close' 를 기다린다.
(function () {
  var tracks = document.querySelector(".tracks");
  var TILES = [
    ["t-edit", "영상 편집 자동화", "NG 규칙 → 편집 도구를 직접", "wave"],
    ["t-3d", "게임 개발 및 3D 모델링", "배운 적 없는 3D를 짚어 가며", "img/flip/r73.jpg"],
    ["t-app", "잔소리 약 알림 앱", "처음 짜 본 수익 구조까지", "img/app/tile.jpg"],
    ["t-clicker", "응용: 클리커", "화면 밖, 출력하는 실물로", "img/clicker/press_poster.jpg"]   // 클리커가 마지막(사용자 11-15 기승전결)
  ];
  var pk = null;
  function dark(e) { var c = (e.dataset.bg || "#fff").replace("#", ""); return (parseInt(c.substr(0, 2), 16) + parseInt(c.substr(2, 2), 16) + parseInt(c.substr(4, 2), 16)) / 3 < 100; }
  // 어두운 구역 가운데, 다음 구역이 밝거나 없는 곳에 둥근 끝
  function slab() {
    var all = Array.prototype.slice.call(tracks.querySelectorAll("[data-bg]"));
    all.forEach(function (e, i) { var n = all[i + 1]; e.classList.toggle("slab-end", dark(e) && (!n || !dark(n))); });
  }
  function bringFirst(id) {
    var t = document.getElementById(id);
    if (!t || !tracks) return;
    tracks.insertBefore(t, tracks.firstElementChild);
    slab();
    document.dispatchEvent(new CustomEvent("tracks-reordered"));
  }
  function media(m) {
    if (m === "wave") return window.ChipModal && window.ChipModal.wave ? window.ChipModal.wave() : "";
    return "<img src='" + m + "' alt=''>";
  }
  function build() {
    pk = document.createElement("div");
    pk.className = "pk"; pk.hidden = true; pk.setAttribute("role", "dialog"); pk.setAttribute("aria-modal", "true");
    pk.innerHTML = "<div class='pk-box'><h2>무엇부터 보시겠습니까?</h2><div class='pk-tiles' style='--n:" + TILES.length + "'>" + TILES.map(function (t) {
      return "<a href='#" + t[0] + "' data-first='" + t[0] + "'><span class='pk-media'>" + media(t[3]) + "</span><b>" + t[1] + "</b></a>"   /* 제목만(사용자 11-14) */;
    }).join("") + "</div><button class='pk-skip' type='button'>처음부터 차례로 보기</button></div>";
    document.body.appendChild(pk);
    pk.addEventListener("click", function (e) {
      var a = e.target.closest(".pk-tiles a");
      if (a) { e.preventDefault(); bringFirst(a.dataset.first); close(); return; }
      if (e.target === pk || e.target.closest(".pk-skip")) close();
    });
    pk.addEventListener("wheel", function (e) { e.preventDefault(); }, { passive: false });
    pk.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });
    window.addEventListener("keydown", function (e) { if (e.key === "Escape" && pk && !pk.hidden && !document.documentElement.classList.contains("cm-open")) close(); });
  }
  function open() {
    if (!pk) build();
    pk.hidden = false;
    requestAnimationFrame(function () { pk.classList.add("show"); });
  }
  function close() {
    if (!pk || pk.hidden) return;
    pk.classList.remove("show");
    window.__pickPending = false;
    document.dispatchEvent(new CustomEvent("pick-close", { detail: { solid: false } }));   // 오프닝도 같이 걷힘 → 첫 화면, 그 아래 고른 장
    document.documentElement.classList.remove("locked");
    window.scrollTo(0, 0);
    setTimeout(function () { pk.hidden = true; }, 380);
  }
  slab();
  var first = new URLSearchParams(location.search).get("first");
  if (first) { bringFirst("t-" + ({ editra: "edit", game: "3d" }[first] || first)); window.__pickPending = false; }
  else window.__pickPending = true;
  document.addEventListener("intro-done", function () { if (window.__pickPending) open(); });
})();
