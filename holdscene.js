// 걸림 장면 카드(_tools/company_holdscene.py) — 11-22 사용자: 화면을 붙잡지 않게, 카드 크기 그림은 제자리에 멈춰 있고 설명이 지나가되
// 가운데로 갈수록 느려지고 멀어질수록 빨라지게(살짝 걸리게). 스크롤은 막지 않는다(휠 · 터치를 잡지 않고 위치만 읽음).
// u = 지금 초점(그림 가운데 높이)에 와 있는 설명 번호(소수). 설명 자리는 g(d) = d − C·w·tanh(d/w) 로 옮겨 보여, 가운데서 빠르기가 1 − C 로 줄어듦.
// 그림은 설명이 걸린 동안(|u − i| < H) 그 설명의 장에 머물고, 사이에서 다음 장으로 넘어감. 성당은 끝 장 뒤에 제단 쪽으로 커지며 탁자로 겹쳐 바뀜.
(function () {
  var arts = document.querySelectorAll("article.hs[data-hs]");
  if (!arts.length) return;
  var C = 0.8, LEAD = 0.75, TAIL = 0.55, H = 0.2, TAU = 0.09;
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
  function Scene(art) {
    var D = JSON.parse(art.dataset.hs), urls = expand(D.seq), T = urls, mixA = -1, mixB = -1;
    if (D.mix) {   // 성당 끝 장 뒤에 빈 칸을 끼워 탁자로 겹쳐 바뀌는 구간으로
      var at = urls.indexOf(D.mix.after) + 1;
      T = urls.slice(0, at).concat(new Array(D.mix.len).fill(null), urls.slice(at));
      mixA = at - 1; mixB = at + D.mix.len;
    }
    var stops = D.stops.map(function (u) { return Math.max(0, T.indexOf(u)); });
    var caps = Array.prototype.slice.call(art.querySelectorAll(".hs-cap")), n = caps.length;
    var box = art.querySelector(".hs-box"), A = art.querySelector(".hs-a"), B = art.querySelector(".hs-b");
    var overs = art.querySelectorAll(".hs-over"), pin = art.querySelector(".hs-pin"), mark = art.querySelector(".hs-mark");
    var wrap = art.querySelector(".hs-caps");
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
      if (!art.offsetHeight) { L.ok = false; return; }   // 접힌 '자세히 보기' 안
      var vh = window.innerHeight, wide = window.innerWidth > 900;
      L.wide = wide; L.hp = pin.offsetHeight;
      L.top = wide ? Math.max(76, (vh - L.hp) / 2) : 62;
      pin.style.top = L.top + "px";
      L.F = wide ? L.top + L.hp / 2 : (L.top + L.hp + vh) / 2;            // 초점: 넓은 화면은 그림 가운데, 휴대폰은 그림 아래 남은 칸 가운데
      L.step = wide ? vh * 0.42 : Math.max(200, (vh - L.top - L.hp) * 0.7);
      L.w = L.step * 0.36;
      L.tail = wide ? TAIL : (L.F - L.top - L.hp) / L.step + 0.45;   // 휴대폰: 설명이 그림 아래에 걸리므로, 마지막 설명이 그림 밑으로 사라진 뒤에 카드가 끝나게
      var d = wrap.getBoundingClientRect().top - mark.getBoundingClientRect().top;   // 그림 칸 원래 위끝 → 설명 칸 위끝
      L.y0 = L.F - L.top - d + LEAD * L.step;                           // 그림이 멈추기 시작할 때 첫 설명이 LEAD 칸 아래에
      wrap.style.height = Math.max(0, L.hp + (LEAD + n - 1 + L.tail) * L.step - d) + "px";   // 마지막 설명 뒤 tail 칸에서 그림이 풀림
      caps.forEach(function (c, i) { c._h = c.offsetHeight; c.style.top = (L.y0 + i * L.step - c._h / 2).toFixed(1) + "px"; });
      L.bw = box.clientWidth; L.bh = box.clientHeight; L.ok = true;
    }
    function target() { if (L.ok) uT = (L.F - wrap.getBoundingClientRect().top - L.y0) / L.step; }
    function g(d) { return d - C * L.w * Math.tanh(d / L.w); }
    function frameAt(u) {   // 설명 좌표 → 그림 칸(소수)
      if (u <= -H) return stops[0] * ss((u + LEAD) / (LEAD - H));   // 첫 설명이 오는 동안 첫 장 → 첫 설명의 장
      var k = Math.floor(u + H);
      if (k >= n - 1) return stops[n - 1];
      return stops[k] + (stops[k + 1] - stops[k]) * ss((u - k - H) / (1 - 2 * H));
    }
    function put(el, i, key) { if (i >= 0 && cache[i].src !== key.v) { key.v = cache[i].src; el.src = key.v; } }
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
      var pinB = L.top + L.hp + 14;
      caps.forEach(function (c, i) {
        var dShow = g((i - u) * L.step), dNat = (i - uT) * L.step;
        var op = 0.14 + 0.86 * Math.exp(-Math.pow(dShow / (L.step * 0.38), 2));
        if (!L.wide) op *= clamp((L.F + dShow - c._h / 2 - pinB) / 48);   // 휴대폰: 그림 밑으로 들어가기 전에 사라짐
        c.style.transform = "translateY(" + (dShow - dNat).toFixed(1) + "px)";
        c.style.opacity = op.toFixed(3);
      });
      var P = frameAt(u);
      if (D.mix && P > mixA && P < mixB) mix((P - mixA) / (mixB - mixA));
      else { unmix(); put(A, near(Math.round(P)), kA); }
      overs.forEach(function (o, i) {   // 턴어라운드 · 와이어프레임 그림은 그 설명이 걸린 동안만
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
    return { art: art, load: load, req: req, relayout: function () { L.ok = false; uS = null; req(); } };
  }
  var scenes = Array.prototype.map.call(arts, Scene), near = [];
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var sc = scenes.filter(function (s) { return s.art === e.target; })[0];
      if (e.isIntersecting) { sc.load(); if (near.indexOf(sc) < 0) near.push(sc); sc.relayout(); }
      else near = near.filter(function (s) { return s !== sc; });
    });
  }, { rootMargin: "120% 0px" });
  scenes.forEach(function (s) { io.observe(s.art); });
  window.addEventListener("scroll", function () { near.forEach(function (s) { s.req(); }); }, { passive: true });
  window.addEventListener("resize", function () { near.forEach(function (s) { s.relayout(); }); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { near.forEach(function (s) { s.relayout(); }); });
})();
