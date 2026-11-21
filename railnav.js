// 고정 장면 오른쪽 세로 막대(.op-rail)를 누르면 그 자리로 이동: 점(s[data-p]) = 그 설명 구간, 위아래 글자(span[data-p]) = 처음·끝,
// 막대(.op-track[data-p0][data-p1]) = 누른 높이만큼. p 는 장면(.theatre 또는 [data-asm]) 안의 진행 0~1. 눌릴 것처럼 생겼으면 눌려야 한다(사용자 11-13).
(function () {
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  document.addEventListener("click", function (e) {
    var t = e.target.closest(".op-track s[data-p], .op-rail > span[data-p], .op-track[data-p0]");
    if (!t || t.closest(".op-rail.off")) return;
    var sec = t.closest(".theatre, [data-asm]");
    if (!sec) return;
    var p;
    if (t.matches(".op-track")) {
      var r = t.getBoundingClientRect(), u = clamp((e.clientY - r.top) / r.height);
      p = +t.dataset.p0 + (+t.dataset.p1 - +t.dataset.p0) * u;
    } else p = +t.dataset.p;
    if (window.TheatreFly) window.TheatreFly.stop();
    if (window.AutoScene && window.AutoScene.jump(sec, p)) return;   // 자동 재생: 그 자리부터 이어서 재생   // D자 벽 재생 중이어도 멈추고 이동
    var sr = sec.getBoundingClientRect(), range = sr.height - window.innerHeight;
    window.scrollTo({ top: sr.top + window.scrollY + p * range, behavior: "smooth" });
  });
})();
