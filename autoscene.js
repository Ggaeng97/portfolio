// 스크롤 고정 장면(성당 .theatre · 조립 [data-asm])을 훅처럼 '영상'으로: 장면 맨 위에 닿으면 페이지를 잠그고 저절로 재생,
// 휠(터치·키)은 재생 속도 — 내리면 빨리 감기, 올리면 되감기(사용자 11-15 "훅처럼 자동 재생, 마우스로 속도 조절, 오른쪽 내비게이션 유지").
// 각 장면은 AutoScene.add(sec, keys, opt) 로 '시간표'를 준다: keys = [{p: 장면 진행 0~1, go: 거기까지 가는 초, stay: 머무는 초}].
// 재생은 시간표대로 페이지 스크롤 자리를 옮기는 것이라 장면 그림 코드는 그대로 스크롤을 읽는다. opt.busy() 가 참이면(부품이 끼워지는 중 ·
// 날아가기 영상 · 확대 재생 중) 시간을 멈추고 기다린다. 끝까지 가면 잠금을 풀고, 처음에서 더 올리면 풀어서 위로 나간다.
// 손으로 내리는 동안 자리를 되돌려 화면이 깜빡이던 것(사용자 11-15)도 이 방식으로 없어진다(재생 중엔 스크롤을 우리가만 옮김).
window.AutoScene = (function () {
  var S = [], cur = null, boost = 0, lastInput = 0, navAt = -1e9, raf = 0, lastT = 0, Y = 0, prevY = window.scrollY, byTouch = false, ty = null;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(u) { return u * u * (3 - 2 * u); }
  function rate() { return clamp(1 + boost, -12, 14); }
  function build(keys) {
    var tl = [], t = 0;
    keys.forEach(function (k, i) {
      if (i) { tl.push({ a: keys[i - 1].p, b: k.p, t0: t, t1: t + k.go }); t += k.go; }
      tl.push({ a: k.p, b: k.p, t0: t, t1: t + (k.stay || 0) }); t += k.stay || 0;
    });
    return { tl: tl, D: t };
  }
  function pAt(s, T) {
    for (var i = 0; i < s.tl.length; i++) {
      var g = s.tl[i];
      if (T <= g.t1) { var u = g.t1 > g.t0 ? (T - g.t0) / (g.t1 - g.t0) : 1; return g.a + (g.b - g.a) * ease(clamp(u, 0, 1)); }
    }
    return s.tl[s.tl.length - 1].b;
  }
  function tAt(s, p) {   // 시간표가 진행 p 에 처음 닿는 시각(오른쪽 막대를 눌렀을 때)
    for (var i = 0; i < s.tl.length; i++) {
      var g = s.tl[i];
      if (p >= Math.min(g.a, g.b) && p <= Math.max(g.a, g.b)) return g.b === g.a ? g.t0 : g.t0 + (g.t1 - g.t0) * (p - g.a) / (g.b - g.a);
    }
    return p <= s.tl[0].a ? 0 : s.D;
  }
  function put(s) {
    var r = s.sec.getBoundingClientRect(), range = r.height - window.innerHeight;
    Y = Math.round(r.top + window.scrollY + pAt(s, s.T) * range);
    if (Math.abs(window.scrollY - Y) > 0.5) window.scrollTo({ top: Y, behavior: "instant" });
  }
  function frame(now) {
    var s = cur; if (!s) return;
    var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016; lastT = now;
    boost *= Math.exp(-dt / 0.35); if (Math.abs(boost) < 0.01) boost = 0;
    var r = rate();
    if (r > 2.5 && s.o.fast) s.o.fast();                       // 빨리 감는 중엔 긴 재생(날아가기 영상 등)을 건너뜀
    var wait = r > 0 && r <= 2.5 && s.o.busy && s.o.busy();     // 보통 속도에선 장면이 끝낼 때까지 기다림
    if (!wait) s.T = clamp(s.T + dt * r, 0, s.D);
    put(s);
    if (s.T >= s.D && r > 0) { s.done = true; unlock(); return; }
    raf = requestAnimationFrame(frame);
  }
  function lock(s, T) {
    cur = s; s.T = T || 0; boost = 0; lastT = 0;
    document.body.classList.add("as-lock");
    if (byTouch) document.documentElement.style.overflow = "hidden";
    put(s); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  function unlock() { cur = null; cancelAnimationFrame(raf); raf = 0; document.body.classList.remove("as-lock"); document.documentElement.style.overflow = ""; }
  function push(dy) {
    lastInput = performance.now();
    if (!cur) return;
    if (dy < 0 && cur.T <= 0.05) { cur.done = false; unlock(); return; }   // 처음에서 더 올리면 풀어서 위로
    boost = clamp(boost + dy * (dy < 0 ? 0.03 : 0.015), -13, 13);
  }
  window.addEventListener("wheel", function (e) { var was = !!cur; byTouch = false; push(e.deltaY * (e.deltaMode === 1 ? 16 : 1)); if (was) e.preventDefault(); }, { passive: false });
  window.addEventListener("touchstart", function (e) { ty = e.touches[0].clientY; lastInput = performance.now(); byTouch = true; }, { passive: true });
  window.addEventListener("touchmove", function (e) {
    lastInput = performance.now();
    if (!cur || ty === null) return;
    var y = e.touches[0].clientY, was = !!cur; push((ty - y) * 2); ty = y;
    if (was && e.cancelable) e.preventDefault();   // 이미 굴러가는 중인 터치는 막을 수 없음(경고만 남지 않게)
  }, { passive: false });
  var KEYS = { " ": 1, PageDown: 1, ArrowDown: 1, PageUp: -1, ArrowUp: -1 };
  window.addEventListener("keydown", function (e) {
    if (!(e.key in KEYS)) return;
    lastInput = performance.now();
    if (!cur) return;
    e.preventDefault(); push(KEYS[e.key] * 120);
  });
  // 목차 · 장 바로가기 · 건너뛰기를 누르면 재생을 풀고(그 이동을 막지 않게) 그 장면은 다시 걸지 않음
  document.addEventListener("click", function (e) {
    if (e.target.closest('a[href^="#"], .hc-chips, .cm, .pk, .op-skip, .toc')) { navAt = performance.now(); if (cur) { cur.done = true; unlock(); } }
  }, true);
  function onScroll() {
    var y = window.scrollY, H = window.innerHeight, down = y > prevY; prevY = y;
    if (cur) {   // 재생 중: 우리가 옮긴 자리에서 크게 벗어났으면(다른 이동) 풀고, 조금이면 되돌림
      if (Math.abs(y - Y) > H * 0.6) unlock(); else if (Math.abs(y - Y) > 1) window.scrollTo({ top: Y, behavior: "instant" });
      return;
    }
    S.forEach(function (s) {
      if (!s.sec.offsetHeight) return;                           // 접혀 숨은 장면(성장 이야기 '자세히 보기' 안)은 건너뜀
      var r = s.sec.getBoundingClientRect();
      if (r.top > H * 0.5) s.done = false;                     // 장면 위로 올라갔으면 다음에 또 재생
      if (!cur && !s.done && down && r.top <= 2 && r.top > -H * 0.9 && performance.now() - lastInput < 400 && performance.now() - navAt > 1500) lock(s, 0);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  return {
    add: function (sec, keys, o) { var b = build(keys); S.push({ sec: sec, tl: b.tl, D: b.D, o: o || {}, T: 0, done: false }); },
    on: function (sec) { return !!cur && (!sec || cur.sec === sec); },   // 이 장면(또는 아무 장면)이 재생 중인가
    rate: function () { return cur ? rate() : 1; },
    // 오른쪽 막대를 누르면: 재생 중이면 그 자리부터 이어서, 아니면 그 자리부터 재생 시작
    jump: function (sec, p) {
      for (var i = 0; i < S.length; i++) if (S[i].sec === sec) { var s = S[i]; if (cur === s) { s.T = tAt(s, p); put(s); } else { s.done = false; lock(s, tAt(s, p)); } return true; }
      return false;
    },
    state: function () { return cur ? { sec: cur.sec.id, T: +cur.T.toFixed(2), D: +cur.D.toFixed(2), rate: +rate().toFixed(2) } : null; }   // 점검용
  };
})();
