// 성당 장면(theatre.js) 제목에서 한 번 멈춤(사용자 11-13: 무심코 내리면 제목 장면이 건너뛰어짐).
// 휠·터치·키로 내려와 무대가 붙는 순간(p ≥ HOLD) 1.4초 입력을 막고, 한 번에 제목 구간을 지나쳤으면 제목 자리로 되돌린다.
// 위로(무대 앞까지) 올라가면 다음에 또 멈춤. 위치를 끌어당겨 붙잡지 않고 입력만 막는다(sticky 가 풀리지 않게 — theatre_fly.js 와 같은 방식).
window.TheatreHold = (function () {
  var OUT = 0.045, HOLD = 0.004, done = false, prev = -1, userAt = 0;
  ["wheel", "touchmove", "keydown"].forEach(function (ev) { window.addEventListener(ev, function () { userAt = performance.now(); }, { passive: true }); });
  function stopWheel(e) { e.preventDefault(); }
  function stopKey(e) { if ([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"].indexOf(e.key) >= 0) e.preventDefault(); }
  function holdInput(ms) {
    window.addEventListener("wheel", stopWheel, { passive: false }); window.addEventListener("touchmove", stopWheel, { passive: false }); window.addEventListener("keydown", stopKey);
    setTimeout(function () {
      window.removeEventListener("wheel", stopWheel, { passive: false }); window.removeEventListener("touchmove", stopWheel, { passive: false }); window.removeEventListener("keydown", stopKey);
    }, ms);
  }
  return {
    OUT: OUT,   // 제목이 사라지는 진행 자리
    // p = 무대 진행(0~1), top/range = 무대 위치·길이. 지나쳤으면 제목 자리로 고친 p 를 돌려준다
    check: function (p, top, range) {
      if (window.AutoScene && window.AutoScene.on()) { prev = p; return p; }   // 자동 재생 중엔 붙잡지 않음
      if (p <= 0) done = false;
      else if (!done && prev >= 0 && prev < HOLD && p >= HOLD && performance.now() - userAt < 600) {
        done = true;
        if (p > OUT - 0.01) { p = HOLD; window.scrollTo({ top: top + p * range, behavior: "instant" }); }
        holdInput(1400);
      }
      prev = p;
      return p;
    }
  };
})();
