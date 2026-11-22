// 걸림 장면(_tools/company_holdscene.py) — 11-22 사용자: 아이젠 판처럼 화면을 그림으로 꽉 채우되 스크롤은 막지 않고,
// 글은 인트로처럼 한 문장씩 아래에서 올라와 가운데서 살짝 걸렸다가 위로 사라지게. 무대(.hs-stage)는 구역 안에서 화면에 붙어 있고(sticky)
// 구역 길이만큼 내리는 동안 문장이 지나감. 휠 · 터치는 잡지 않고 위치만 읽는다.
// u = 지금 초점 높이에 와 있는 문장 번호(소수, 0 = 제목). 문장 자리는 g(d) = d − C·w·tanh(d/w) 로 옮겨 보여 가운데서 빠르기가 1 − C 로 줄어듦.
// 그림은 문장이 걸린 동안(|u − i| < H) 그 문장의 장에 머물고, 사이에서 다음 장으로. 성당은 끝 장 뒤에 제단 쪽으로 커지며 탁자로 겹쳐 바뀜.
(function () {
  var els = document.querySelectorAll(".hs[data-hs]");
  if (!els.length) return;
  var C = 0.75, LEAD = 0.6, TAIL = 0.6, H = 0.2, TAU = 0.09, SHOW = 0.15, FADE = 0.32;
  function clamp(x) { return Math.max(0, Math.min(1, x)); }
  function ss(t) { t = clamp(t); return t * t * (3 - 2 * t); }
  function pad(k) { return String(k).padStart(3, "0"); }
  function expand(seq) {   // [앞글자, 처음, 끝, 건너뛰기] 또는 [앞글자, [이름…]] → 그림 주소 목록
    var out = [];
    seq.forEach(function (s) {
      if (Array.isArray(s[1])) { s[1].forEach(function (n) { out.push(s[0] + n + ".jpg"); }); return; }
      for (var k = s[1]; k <= s[2]; k += s[3]) out.push(s[0] + pad(k) + ".jpg");
      if ((s[2] - s[1]) % s[3]) out.push(s[0] + pad(s[2]) + ".jpg");   // 끝 장은 늘 넣음
    });
    return out;
  }
  function Scene(el) {
    var D = JSON.parse(el.dataset.hs), urls = expand(D.seq), T = urls, mixA = -1, mixB = -1;
    if (D.mix) {   // 성당 끝 장 뒤에 빈 칸을 끼워 탁자로 겹쳐 바뀌는 구간으로
      var at = urls.indexOf(D.mix.after) + 1;
      T = urls.slice(0, at).concat(new Array(D.mix.len).fill(null), urls.slice(at));
      mixA = at - 1; mixB = at + D.mix.len;
    }
    var stops = D.stops.map(function (u) { return Math.max(0, T.indexOf(u)); });
    var caps = Array.prototype.slice.call(el.querySelectorAll(".hs-cap")), n = caps.length;
    var stage = el.querySelector(".hs-stage"), box = el.querySelector(".hs-box"), A = el.querySelector(".hs-a"), B = el.querySelector(".hs-b");
    var overs = el.querySelectorAll(".hs-over");
    var cache = [], L = { ok: false }, uT = 0, uS = null, run = false, lastT = 0, mixing = false, kA = { v: "" }, kB = { v: "" };
    function load() {
      if (cache.length) return;
      cache = T.map(function (u) { if (!u) return null; var im = new Image(); im.decoding = "async"; im.src = u; return im; });
    }
    function ok(i) { var im = cache[i]; return !!(im && im.complete && im.naturalWidth > 0); }
    function near(i) {   // 아직 못 불러온 장이면 가까운 장
      for (var k = 0; k < 60; k++) { if (ok(i - k)) return i - k; if (ok(i + k)) return i + k; }
      return -1;
    }
    function layout() {
      if (!el.offsetWidth) { L.ok = false; return; }   // 접힌 '자세히 보기' 안
      var vh = window.innerHeight, wide = window.innerWidth > 900;
      L.step = vh * (wide ? 0.5 : 0.46); L.w = L.step * 0.36;
      stage.style.height = vh + "px";
      el.style.height = (vh + (LEAD + n - 1 + TAIL) * L.step).toFixed(0) + "px";   // 첫 문장 앞 LEAD 칸, 끝 문장 뒤 TAIL 칸
      L.F = wide ? vh * (el.closest(".light") ? 0.5 : 0.68) : (box.offsetTop + box.offsetHeight + vh) / 2;   // 문장이 걸리는 높이(휴대폰은 그림 아래 남은 칸 가운데)
      caps.forEach(function (c) { c._h = c.offsetHeight; });
      L.bw = box.clientWidth; L.bh = box.clientHeight; L.ok = true;
    }
    function target() { if (L.ok) uT = -el.getBoundingClientRect().top / L.step - LEAD; }
    function g(d) { return d - C * L.w * Math.tanh(d / L.w); }
    function frameAt(u) {   // 문장 좌표 → 그림 칸(소수)
      if (u <= -H) return stops[0];
      var k = Math.floor(u + H);
      if (k >= n - 1) return stops[n - 1];
      return stops[k] + (stops[k + 1] - stops[k]) * ss((u - k - H) / (1 - 2 * H));
    }
    function put(im, i, key) { if (i >= 0 && cache[i].src !== key.v) { key.v = cache[i].src; im.src = key.v; } }
    function fit(iw, ih) { var s = Math.max(L.bw / iw, L.bh / ih); return { s: s, oy: (L.bh - ih * s) / 2 }; }
    function mix(m) {   // 아이젠 theatre.js 와 같은 겹쳐 바뀌기: 성당은 제단을 중심으로 커지며, 탁자는 제단 크기에서 제자리 크기로
      var f = D.mix.from, t = D.mix.to, a = fit(f[2], f[3]), b = fit(t[2], t[3]);
      var ay = a.oy + f[0] * f[3] * a.s, ty = b.oy + t[0] * t[3] * b.s, k = (f[1] * f[2] * a.s) / (t[1] * t[2] * b.s);
      var s1 = 1 + (1 / k - 1) * m, s2 = s1 * k, ya = ay - (ay - ty) * m, e = ss((m - 0.6) / 0.4);
      put(A, near(mixA), kA); put(B, near(mixB), kB);
      A.style.transformOrigin = "50% " + ay.toFixed(1) + "px";
      A.style.transform = "translateY(" + (ya - ay).toFixed(1) + "px) scale(" + s1.toFixed(4) + ")";
      A.style.opacity = (1 - clamp((m - 0.12) / 0.6)).toFixed(3);
      A.style.filter = "brightness(" + (1 - 0.55 * m).toFixed(3) + ")";
      B.style.transformOrigin = "50% " + ty.toFixed(1) + "px";
      B.style.transform = "translateY(" + (ya - ty).toFixed(1) + "px) scale(" + s2.toFixed(4) + ")";
      B.style.opacity = clamp((m - 0.04) / 0.55).toFixed(3);
      var mk = "radial-gradient(50% 50% at 50% " + ty.toFixed(0) + "px, #000 " + (68 + 82 * e).toFixed(0) + "%, transparent " + (100 + 80 * e).toFixed(0) + "%)";
      B.style.webkitMaskImage = mk; B.style.maskImage = mk;   // 겹치는 동안 탁자 그림의 네모 테두리가 안 보이게, 끝나면 가장자리까지
      mixing = true;
    }
    function unmix() {
      if (!mixing) return; mixing = false;
      A.style.transform = A.style.transformOrigin = A.style.opacity = A.style.filter = "";
      B.style.opacity = "0"; B.style.transform = ""; B.style.webkitMaskImage = B.style.maskImage = "";
    }
    function render(u) {
      caps.forEach(function (c, i) {   // 한 문장씩: 걸린 동안만 또렷하고 앞뒤로 금방 사라짐. 제목은 무대와 함께 들어오고 끝 문장은 무대와 함께 나감
        var e = Math.abs(u - i), op = (i === 0 && u < 0) || (i === n - 1 && u > n - 1) ? 1 : 1 - ss((e - SHOW) / FADE);
        c.style.transform = "translateY(" + (L.F + g((i - u) * L.step) - c._h / 2).toFixed(1) + "px)";
        c.style.opacity = op.toFixed(3);
        c.style.visibility = op < 0.003 ? "hidden" : "";
      });
      var P = frameAt(u);
      if (D.mix && P > mixA && P < mixB) mix((P - mixA) / (mixB - mixA));
      else { unmix(); put(A, near(Math.round(P)), kA); }
      overs.forEach(function (o, i) {   // 턴어라운드 · 와이어프레임 그림은 그 문장이 걸린 동안만
        if (o.tagName === "IMG") o.style.opacity = clamp(1 - (Math.abs(u - i) - H) / 0.25).toFixed(3);
      });
    }
    function tick(now) {
      var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016; lastT = now;
      uS = uS === null || Math.abs(uT - uS) > 3 ? uT : uS + (uT - uS) * (1 - Math.exp(-dt / TAU));   // 휠 한 칸씩 뚝뚝 끊기지 않게
      render(uS);
      if (Math.abs(uT - uS) > 0.0005) requestAnimationFrame(tick); else { run = false; lastT = 0; }
    }
    function req() {
      if (!L.ok) layout();
      if (!L.ok) return;
      target(); if (!run) { run = true; requestAnimationFrame(tick); }
    }
    return { el: el, load: load, req: req, relayout: function () { L.ok = false; uS = null; req(); } };
  }
  var scenes = Array.prototype.map.call(els, Scene), near = [];
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var sc = scenes.filter(function (s) { return s.el === e.target; })[0];
      if (e.isIntersecting) { sc.load(); if (near.indexOf(sc) < 0) near.push(sc); sc.relayout(); }
      else near = near.filter(function (s) { return s !== sc; });
    });
  }, { rootMargin: "120% 0px" });
  scenes.forEach(function (s) { io.observe(s.el); });
  window.addEventListener("scroll", function () { near.forEach(function (s) { s.req(); }); }, { passive: true });
  window.addEventListener("resize", function () { near.forEach(function (s) { s.relayout(); }); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { near.forEach(function (s) { s.relayout(); }); });
})();
