// 도전 이야기 훅(#challenge, 첫 화면 바로 아래 · 사용자 11-14): 검은 바탕에 흰 글씨 한 문장씩.
// 영상처럼(사용자 11-14 "프레임 사이에 멈추는 게 아니라 영상처럼 자동으로 계속 재생, 스크롤 속도에 따라 빨리 감기"):
//   훅이 화면 맨 위에 닿으면 그 자리에 멈춰 세우고 저절로 재생(1배속). 내리는 스크롤은 페이지를 움직이지 않고
//   그 빠르기만큼 재생을 빨리 감음(손을 떼면 다시 1배속). 올리면 되감고, 처음에서 더 올리면 첫 화면으로 돌아감.
//   다 재생되면 풀려서 그대로 다음 장으로 내려감. 아래에서 올라와 다시 만나면 멈추지 않고 마지막 문장만 보임.
(function () {
  var sec = document.getElementById("challenge");
  if (!sec) return;
  var lines = Array.prototype.slice.call(sec.querySelectorAll(".hk-line")), n = lines.length;
  // 글자마다 <span class="c"> 로 쪼갬(<br>·<em> 은 그대로 두고 그 안의 글자만). 낱말은 한 덩어리(.w) — 줄바꿈은 낱말 사이에서만
  var chars = lines.map(function (p) {
    var list = [];
    (function split(el) {
      Array.prototype.slice.call(el.childNodes).forEach(function (nd) {
        if (nd.nodeType === 3) {
          var f = document.createDocumentFragment();
          nd.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { f.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "w";
            Array.from(part).forEach(function (ch) {
              var s = document.createElement("span"); s.className = "c"; s.textContent = ch; w.appendChild(s); list.push(s);
            });
            f.appendChild(w);
          });
          el.replaceChild(f, nd);
        } else if (nd.nodeType === 1 && nd.tagName !== "BR") split(nd);
      });
    })(p);
    return list;
  });

  // 문장 하나: 떠오름 0.84초 · 멈춰 읽기 1.9초 · 위로 빠짐 0.56초(마지막 문장은 남음)
  // 멈춰 읽기는 1.4 → 1.9초(사용자 11-14 "스크롤하면 빨리 넘어가니까, 느리게 읽는 사람 위해 0.5초 정도 늘려도")
  var T_IN = 0.84, T_HOLD = 1.9, T_OUT = 0.56, SEG = T_IN + T_HOLD + T_OUT;
  var IN = T_IN / SEG, OUT = (T_IN + T_HOLD) / SEG, S_IN = 0.55, S_OUT = 0.4;
  var END = (n - 1 + OUT) * SEG;   // 마지막 문장이 다 떠오르고 읽을 틈까지 = 재생 끝
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  var painted = lines.map(function () { return null; });
  function paint(t) {
    var p = t / SEG;
    for (var i = 0; i < n; i++) {
      var u = p - i, last = i === n - 1, on = u > 0 && (u < 1 || last);
      if (!on) { if (painted[i] !== "off") { lines[i].style.visibility = "hidden"; painted[i] = "off"; } continue; }
      var key = u >= IN && (u <= OUT || last) ? "hold" : u.toFixed(4);
      if (painted[i] === key) continue;
      painted[i] = key; lines[i].style.visibility = "visible";
      var cs = chars[i], N = cs.length;
      for (var k = 0; k < N; k++) {
        var o, y, b, at = N > 1 ? k / (N - 1) : 0;
        if (u < IN) { var e = clamp((u / IN - at * S_IN) / (1 - S_IN)); e = 1 - Math.pow(1 - e, 3); o = e; y = (1 - e) * 0.45; b = (1 - e) * 8; }
        else if (u <= OUT || last) { o = 1; y = 0; b = 0; }
        else { var g = clamp(((u - OUT) / (1 - OUT) - at * S_OUT) / (1 - S_OUT)); g = g * g; o = 1 - g; y = -g * 0.35; b = g * 6; }
        var st = cs[k].style;
        st.opacity = o.toFixed(3);
        st.transform = y ? "translateY(" + y.toFixed(3) + "em)" : "none";
        st.filter = b > 0.05 ? "blur(" + b.toFixed(2) + "px)" : "none";
      }
    }
  }

  // ── 재생기: t(초)를 rate 배속으로 흘림. rate = 1 + boost, boost 는 스크롤 빠르기로 쌓이고 0.35초 반감으로 사그라듦
  var t = 0, boost = 0, locked = false, done = false, prev = 0, raf = 0, lastInput = 0, topY = 0;
  function frame(now) {
    var dt = prev ? Math.min(0.1, (now - prev) / 1000) : 0; prev = now;
    boost *= Math.exp(-dt / 0.35);
    var rate = Math.max(-12, Math.min(14, 1 + boost));
    t = Math.max(0, Math.min(END, t + dt * rate));
    paint(t);
    if (t >= END) { finish(); return; }
    raf = requestAnimationFrame(frame);
  }
  function push(dy) {   // 휠·터치·키 한 번의 움직임(px) → 빨리 감기/되감기
    lastInput = performance.now();
    if (!locked) return;
    if (dy < 0 && t <= 0.05) { unlock(); return; }   // 처음에서 더 올리면 풀어서 첫 화면으로
    boost += dy * (dy < 0 ? 0.03 : 0.015);   // 되감기는 두 배로 세게(처음으로 빨리 돌아가게)
  }
  function onWheel(e) {
    lastInput = performance.now(); byTouch = false;
    if (!locked) return;
    var dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
    if (dy < 0 && t <= 0.05) { unlock(); return; }
    e.preventDefault(); push(dy);
  }
  var ty = null;
  var byTouch = false;
  function onTouchStart(e) { ty = e.touches[0].clientY; lastInput = performance.now(); byTouch = true; }
  function onTouchMove(e) {
    lastInput = performance.now();
    if (!locked || ty === null) return;
    var y = e.touches[0].clientY, dy = (ty - y) * 2; ty = y;
    if (dy < 0 && t <= 0.05) { unlock(); return; }
    e.preventDefault(); push(dy);
  }
  var KEYS = { ArrowDown: 120, PageDown: 400, " ": 400, End: 2000, ArrowUp: -120, PageUp: -400, Home: -2000 };
  function onKey(e) {
    if (!(e.key in KEYS)) return;
    lastInput = performance.now();
    if (!locked) return;
    if (KEYS[e.key] < 0 && t <= 0.05) { unlock(); return; }
    e.preventDefault(); push(KEYS[e.key]);
  }
  function lock() {
    locked = true; boost = 0; prev = 0;
    topY = sec.getBoundingClientRect().top + scrollY;
    scrollTo({ top: topY, behavior: "instant" });
    document.body.classList.add("hk-lock");
    // 휴대폰: 손가락 관성 스크롤은 막을 수 없어 훅을 지나쳐 버리므로, 재생 동안 페이지 스크롤 자체를 잠금
    if (byTouch) document.documentElement.style.overflow = "hidden";
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  function unlock() { locked = false; cancelAnimationFrame(raf); document.body.classList.remove("hk-lock"); document.documentElement.style.overflow = ""; }
  function finish() { unlock(); done = true; t = END; paint(t); }

  // ── 스크롤 감시: 사람이 내리다가(휠·터치·키 직후) 훅이 맨 위에 닿으면 멈춰 세움
  var lastY = scrollY;
  function onScroll() {
    var y = scrollY, down = y > lastY; lastY = y;
    var H = innerHeight, r = sec.getBoundingClientRect();
    document.body.classList.toggle("in-hook", r.top <= H * 0.5 && r.bottom > H * 0.5);
    if (locked) { if (Math.abs(y - topY) > H * 0.6) unlock(); else if (y !== topY) scrollTo({ top: topY, behavior: "instant" }); return; }
    if (r.top > H * 0.5) { if (done || t > 0) { done = false; t = 0; paint(0); } return; }   // 훅이 아직 아래 = 처음부터 다시
    if (!done && r.top <= 2 && r.top > -H * 0.9 && down && performance.now() - lastInput < 400) { lock(); return; }
    if (!done && r.bottom < H * 0.9) { done = true; t = END; paint(t); }   // 아래에서 올라옴·건너뜀 = 마지막 문장만
  }
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("keydown", onKey);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.__hk = function () { return { t: +t.toFixed(2), boost: +boost.toFixed(2), locked: locked, done: done }; };   // 점검용(헤드리스 시험)
  paint(0); onScroll();
})();
