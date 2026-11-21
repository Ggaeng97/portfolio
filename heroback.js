// 첫 화면 성당(화면에 고정된 바탕 .hc-back): 내리는 만큼 그림이 크게 커지며 세게 흐려지고, 첫 장이 올라와 화면을 덮을 때 걷힌다.
// 첫 장이 밝으면(영상 편집) 바탕색이 흰색으로 바뀌는 만큼(bgtween 과 같은 구간) 같이 걷히고,
// 어두우면(3D · 클리커) 첫 장 위끝이 화면 50 % → 맨 위로 오는 동안 걷힌다 — 그 뒤엔 어두운 바탕이나 성당 장의 흐린 영상이 이어짐(사용자 11-14: 흰 틈 없이).
(function () {
  var back = document.querySelector(".hc-back"), hero = document.querySelector(".hcath");
  if (!back || !hero) return;
  var zoom = back.querySelector(".hb-zoom"), pic = back.querySelector(".hb-sharp");
  var words = hero.querySelectorAll(".hc-text, .hc-chips");
  var first = null, solid = null, light = false, last = "";
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(v) { return v * v * (3 - 2 * v); }
  function pick() {   // 본문 맨 앞 장(순서가 바뀔 수 있음)과 그 밝기
    first = document.querySelector("main [data-bg]");   // 첫 화면 다음 구역(도전 이야기 훅, 없으면 본문 맨 앞 장)
    // 그 뒤 처음으로 칠해진(data-bg-clear 아닌) 구역 — 예: 클리커 머리글 다음 조립 장면. 이 구역 위끝이 화면에 들어오기 전에 다 걷혀야
    // 흐린 성당과 칠한 어두운 판 사이에 끊긴 선이 생기지 않는다(사용자 11-14: 페더처럼 부드럽게)
    solid = document.querySelector(".tracks [data-bg]:not([data-bg-clear])");
    var c = ((first && first.dataset.bg) || "#000000").replace("#", "");
    light = (0.2126 * parseInt(c.substr(0, 2), 16) + 0.7152 * parseInt(c.substr(2, 2), 16) + 0.0722 * parseInt(c.substr(4, 2), 16)) / 255 > 0.5;
  }
  function update() {
    var H = window.innerHeight, h = ease(clamp(window.scrollY / (H * 0.8)));
    var top = first ? first.getBoundingClientRect().top : H;
    var o = 1 - ease(light ? clamp((H * 0.3 - top) / (H * 0.3)) : clamp((H * 0.45 - top) / (H * 0.45)));   // bgtween 바탕색 구간(30 %→0)과 같이
    if (solid) o = Math.min(o, 1 - ease(clamp((H * 1.6 - solid.getBoundingClientRect().top) / (H * 0.6))));   // 칠한 구역 위끝 1.6H → 1.0H 동안 걷힘
    // 회사판(11-21 사용자): 아래 구역의 흰 판이 올라와 캐릭터를 하반신부터 자르지 않게 — 내리는 만큼 흐려지면서 서서히 사라져 배경에 섞임(화면 높이의 65 % 에서 다 사라짐)
    o = Math.min(o, 1 - ease(clamp(window.scrollY / (H * 0.65))));
    var key = h.toFixed(3) + "|" + o.toFixed(3);
    if (key === last) return;
    last = key;
    zoom.style.transform = "scale(" + (1.08 + 0.5 * h).toFixed(4) + ")";   // 크게(1.08 → 1.58)
    // 세게 흐리게(성당 장의 흐린 영상과 같은 46px) — 흐린 그림을 겹쳐 바꾸면 선명한 선이 비쳐 이중으로 보여서 그림 자체를 흐림
    pic.style.filter = "brightness(" + (0.76 - 0.1 * h).toFixed(3) + ") saturate(" + (1 + 0.45 * h).toFixed(3) + ")" + (h > 0.005 ? " blur(" + (46 * h).toFixed(1) + "px)" : "");
    back.style.opacity = o.toFixed(3);
    back.style.visibility = o < 0.002 ? "hidden" : "";
    var w = 1 - clamp(h * 1.5);                                              // 문구·칩은 먼저 사라짐
    words.forEach(function (n) { n.style.opacity = w >= 0.999 ? "" : w.toFixed(3); n.style.pointerEvents = w < 0.3 ? "none" : ""; });
  }
  var queued = false;
  function req() { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; update(); }); } }
  document.addEventListener("tracks-reordered", function () { pick(); last = ""; update(); });
  window.addEventListener("scroll", req, { passive: true });
  window.addEventListener("resize", function () { last = ""; req(); });
  pick(); update();
})();
