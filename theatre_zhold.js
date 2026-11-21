// 성당 장면(theatre.js) ③ 탁자 확대를 설명마다 한 번씩 걸리게(사용자 11-14: 마지막 직전 멘트가 걸리지 않음 —
// 확대가 한 번에 재생돼 첫 탁자 설명이 0.5초만 보였음). 설명 i 의 구간(AT[i])에 들어서면 그 설명까지의 확대(Z[i])만 재생하고,
// 재생하는 동안 휠·터치·키를 막는다. 그사이 다음 구간까지 넘어갔으면 지금 구간 첫머리로 되돌린다(조립 장면 data-one 과 같은 방식).
// 위로 올라가면 바로 거꾸로. 메뉴·막대처럼 손으로 내린 게 아닌 이동이나 무대 밖으로 나간 경우엔 붙잡지 않는다.
window.TheatreZoomHold = (function () {
  var AT = [0.70, 0.84], Z = [0.5, 1], cur = -1, userAt = 0, halfMs = 1300, timer = 0, locked = false;
  ["wheel", "touchmove", "keydown"].forEach(function (ev) { window.addEventListener(ev, function () { userAt = performance.now(); }, { passive: true }); });
  function stopWheel(e) { e.preventDefault(); }
  function stopKey(e) { if ([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"].indexOf(e.key) >= 0) e.preventDefault(); }
  function lock(ms) {
    clearTimeout(timer);
    if (!locked) { locked = true; window.addEventListener("wheel", stopWheel, { passive: false }); window.addEventListener("touchmove", stopWheel, { passive: false }); window.addEventListener("keydown", stopKey); }
    timer = setTimeout(function () {
      locked = false; window.removeEventListener("wheel", stopWheel, { passive: false }); window.removeEventListener("touchmove", stopWheel, { passive: false }); window.removeEventListener("keydown", stopKey);
    }, ms);
  }
  return {
    AT: AT,
    setHalf: function (ms) { halfMs = ms; },          // 한 구간 확대에 걸리는 시간
    goal: function () { return cur < 0 ? 0 : Z[cur]; },  // 지금 확대 목표(0~1)
    // p = 무대 진행(0~1), top/range = 무대 위치·길이, z = 지금 확대 정도. 붙잡았으면 고친 p 를 돌려준다
    check: function (p, top, range, z) {
      var seg = -1;
      AT.forEach(function (a, i) { if (p >= a) seg = i; });
      if (seg === cur) return p;
      if (window.AutoScene && window.AutoScene.on()) { cur = seg; return p; }   // 자동 재생: 구간만 따라감(되돌리기 · 잠금 없음, 기다림은 autoscene 이)
      if (seg < cur || performance.now() - userAt > 600) { cur = seg; return p; }
      var doneCur = cur < 0 || Math.abs(z - Z[cur]) < 0.01, next = doneCur ? cur + 1 : cur;
      // 다음 구간 첫머리를 넘어 더 갔으면(빠른 휠, 마지막 구간에서 무대 끝을 지나친 것 포함) 그 첫머리로 되돌림
      if (seg > next || !doneCur || p > AT[next] + 0.02) { p = AT[next] + 0.008; window.scrollTo({ top: Math.round(top + p * range), behavior: "instant" }); }
      if (next !== cur) { cur = next; lock(halfMs + 250); }
      return p;
    }
  };
})();
