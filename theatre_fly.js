// 성당 장면(theatre.js)의 첫 설명 구간 '첫 모델링 직후': 카메라가 첫 모델의 정면에서 2층 높이 오른쪽 벽으로 들어가
// 아치·창이 한쪽만 휜 D자 모양을 보여 주고, 제단 쪽을 둘러보며 정면으로 내려앉는다. 스크롤 속도와 상관없이 시간으로 한 번 재생하고,
// 재생하는 동안은 페이지 스크롤을 멈춘다(끝나기 전에 다음 장면으로 넘어가지 않게 — 사용자 11-13). 위치를 끌어당기지 않고 휠·터치·키 입력만 막는다
// (overflow:hidden 으로 잠그면 무대 고정(sticky)이 풀려 화면이 튄다 — 11-13 사건). 그림이 다 준비 안 됐으면 재생·잠금 없이 건너뜀.
// 그림 = 들어감 img/flyd/d000~109 · 돌아옴 img/flyd/e000~139 (첫 모델 복원 장면에서 fly_render.py 로 렌더, 정면 = r01 과 같은 자리)
window.TheatreFly = (function () {
  // 들어감 1.7초 · 벽 앞 멈춤 0.8초 · 돌아옴 2.5초 = 5초(처음 8초는 멈춤이 길어 답답하다 — 사용자 11-13)
  var SEQ = [{ src: "img/flyd/d", n: 110, ms: 1700 }, { hold: 800 }, { src: "img/flyd/e", n: 140, ms: 2500 }];
  var TOTAL = SEQ.reduce(function (t, s) { return t + (s.ms || s.hold); }, 0);
  var img = null, tag = null, state = "idle", t0 = 0, raf = 0, lastSrc = "", done = null, loaded = false, guard = 0;
  function block(e) { e.preventDefault(); }
  function blockKey(e) { if ([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"].indexOf(e.key) >= 0) e.preventDefault(); }
  function lock(on) {
    var f = on ? "addEventListener" : "removeEventListener";
    window[f]("wheel", block, { passive: false }); window[f]("touchmove", block, { passive: false }); window[f]("keydown", blockKey);
  }
  function ready() {   // 그림이 9할 넘게 제대로 불러와졌나(렌더 중이거나 파일이 없으면 재생하지 않음)
    var ok = 0, all = 0;
    SEQ.forEach(function (s) { if (s.cache) s.cache.forEach(function (im) { all++; if (im.complete && im.naturalWidth > 0) ok++; }); });
    return all > 0 && ok / all > 0.9;
  }
  function pad(k) { return String(k).padStart(3, "0"); }
  function load() {
    if (loaded) return; loaded = true;
    SEQ.forEach(function (s) { if (s.src) s.cache = Array.apply(null, { length: s.n }).map(function (_, k) { var im = new Image(); im.src = s.src + pad(k) + ".jpg"; return im; }); });
  }
  function frameAt(e) {   // 지난 시간 → [그림, 머무는 중인가]. 그림에 처음·끝 감속이 들어 있으므로 시간은 고르게
    var t = 0, prev = null;
    for (var i = 0; i < SEQ.length; i++) {
      var s = SEQ[i], len = s.ms || s.hold;
      if (e < t + len) return s.hold ? [prev, true] : [s.cache[Math.round(Math.min(1, (e - t) / len) * (s.n - 1))], false];
      if (s.cache) prev = s.cache[s.n - 1];
      t += len;
    }
    return null;
  }
  function finish(call) {
    if (raf) cancelAnimationFrame(raf);
    clearTimeout(guard); raf = 0; tag && tag.classList.remove("in"); lock(false);
    state = "done";
    if (call && done) done();
  }
  function tick(now) {
    var f = frameAt(now - t0);
    if (!f) { finish(true); return; }
    tag && tag.classList.toggle("in", f[1]);
    if (f[0] && f[0].complete && f[0].naturalWidth > 0 && f[0].src !== lastSrc) { lastSrc = f[0].src; img.src = lastSrc; }   // 못 불러온 장은 앞 장 유지
    raf = requestAnimationFrame(tick);
  }
  // 휠·터치·키로 직접 내렸는지(메뉴·건너뛰기로 지나갈 때는 걸지 않음)
  var prevT = -1, userAt = 0;
  ["wheel", "touchmove", "keydown"].forEach(function (ev) { window.addEventListener(ev, function () { userAt = performance.now(); }, { passive: true }); });
  return {
    init: function (l1, t) { img = l1; tag = t; },
    // 스크롤마다: p = 무대 진행(0~1), [a0, a1) = 첫 설명 구간, top/range = 무대 위치·길이. 지나쳤으면 구간 안으로 되돌리고 p 를 고쳐 돌려준다
    check: function (p, a0, a1, top, range, end) {
      var auto = window.AutoScene && window.AutoScene.on();
      if (p < a0 - 0.004) this.reset();
      else if (auto) { if (state === "idle" && ready() && prevT >= 0 && prevT < a0 + 0.002 && p >= a0 && window.AutoScene.rate() <= 2.5) this.play(end); }   // 자동 재생: 지나가면 재생(빨리 감는 중엔 건너뜀)
      else if (state === "idle" && ready() && prevT >= 0 && prevT < a0 + 0.002 && p >= a0 && p - prevT < 0.06 && performance.now() - userAt < 600) {
        if (p > a1 - 0.01) { p = a0 + 0.01; window.scrollTo({ top: top + p * range, behavior: "instant" }); }
        this.play(end);
      }
      prevT = p;
      return p;
    },
    load: load,
    idle: function () { return state === "idle"; },
    // 재생 진행(0~1): 재생 중엔 지난 시간 / 전체, 끝났으면 1, 아직이면 0 — 액자가 재생 동안 커져 끝날 때 꽉 참(theatre.js)
    progress: function () { return state === "play" ? Math.min(1, (performance.now() - t0) / TOTAL) : state === "done" ? 1 : 0; },
    active: function () { return state === "play"; },
    play: function (end) {
      load(); state = "play"; t0 = performance.now(); lastSrc = ""; done = end;
      lock(true);
      guard = setTimeout(function () { if (state === "play") finish(true); }, TOTAL + 1500);   // 무슨 일이 있어도 잠금은 풀림
      raf = requestAnimationFrame(tick);
    },
    stop: function () { if (state === "play") finish(true); },          // 건너뛰기: 멈추고 잠금 풀기(다시 위로 올라가기 전엔 재생 안 함)
    reset: function () { if (state === "play") finish(true); state = "idle"; }   // 구간 위로 올라가면: 다음에 내려올 때 또 재생
  };
})();
