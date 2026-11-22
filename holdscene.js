// 걸림 장면(_tools/company_holdscene.py) — 11-22 사용자: 아이젠 판처럼 화면을 그림으로 꽉 채우되 스크롤은 막지 않고,
// 글은 인트로처럼 한 문장씩 아래에서 올라와 가운데서 살짝 걸렸다가 위로 사라지게. 무대(.hs-stage)는 구역 안에서 화면에 붙어 있고(sticky)
// 구역 길이만큼 내리는 동안 문장이 지나감. 휠 · 터치는 잡지 않고 위치만 읽는다.
// u = 지금 초점 높이에 와 있는 문장 번호(소수, 0 = 제목). 11-22 사용자 "걸리는 느낌이 없어 읽기 어렵다 — 가운데 확실히 걸리게" →
// 문장은 |u − i| < H 동안 초점 근처에서 원래 빠르기의 10 %로 아주 천천히 흐르고("딱 멈추지 말고 미미하게"), 그 밖에선 멀어질수록 빨라지며 올라가 사라짐.
// 그림은 글 빠르기와 떼어 영상처럼 고른 빠르기로 다음 문장의 장까지 재생("글 빠르기를 따라가니 영상은 볼 수 없다"). 성당은 끝 장 뒤에 제단 쪽으로 커지며 탁자로 겹쳐 바뀜.
// 스크롤을 멈추면 진행 방향의 다음 문장 자리로 맞춰 들어감("애매하게 중간엔 못 멈추게").
(function () {
  var els = document.querySelectorAll(".hs[data-hs]");
  if (!els.length) return;
  var LEAD = 0.6, TAIL = 0.6, H = 0.32, TAU = 0.09, SLOW = 0.1;
  function clamp(x) { return Math.max(0, Math.min(1, x)); }
  function ss(t) { t = clamp(t); return t * t * (3 - 2 * t); }
  function pad(k) { return String(k).padStart(3, "0"); }
  function expand(seq, ext) {   // [앞글자, 처음, 끝, 건너뛰기, 1초 장 수] 또는 [앞글자, [이름…], 1초 장 수] → 그림 주소 목록 · 장마다 재생 빠르기
    var out = [], fps = [];
    seq.forEach(function (s) {
      var list = Array.isArray(s[1]), r = (list ? s[2] : s[4]) || 24;
      function add(u) { out.push(u.replace(/\.jpg$/, ext)); fps.push(r); }
      if (list) { s[1].forEach(function (nm) { add(s[0] + nm + ".jpg"); }); return; }
      for (var k = s[1]; k <= s[2]; k += s[3]) add(s[0] + pad(k) + ".jpg");
      if ((s[2] - s[1]) % s[3]) add(s[0] + pad(s[2]) + ".jpg");   // 끝 장은 늘 넣음
    });
    return { urls: out, fps: fps };
  }
  function Scene(el) {
    var D = JSON.parse(el.dataset.hs), X = expand(D.seq, D.ext || ".jpg"), urls = X.urls, T = urls, R = X.fps, mixA = -1, mixB = -1;
    if (D.mix) {   // 성당 끝 장 뒤에 빈 칸을 끼워 탁자로 겹쳐 바뀌는 구간으로
      var at = urls.indexOf(D.mix.after) + 1;
      T = urls.slice(0, at).concat(new Array(D.mix.len).fill(null), urls.slice(at));
      R = R.slice(0, at).concat(new Array(D.mix.len).fill(D.mix.len / (D.mix.sec || 1)), R.slice(at));
      mixA = at - 1; mixB = at + D.mix.len;
    }
    var stops = D.stops.map(function (u) { return Math.max(0, T.indexOf(u)); });
    var caps = Array.prototype.slice.call(el.querySelectorAll(".hs-cap")), n = caps.length;
    var stage = el.querySelector(".hs-stage"), box = el.querySelector(".hs-box"), A = el.querySelector(".hs-a"), B = el.querySelector(".hs-b");
    var overs = el.querySelectorAll(".hs-over");
    var cache = [], L = { ok: false }, uT = 0, uS = null, run = false, lastT = 0, mixing = false, kA = { v: "" }, kB = { v: "" };
    var P = null, kT = 0, dirU = 1, prevU = null, idle = 0, ovO = [];
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
      L.step = vh * (wide ? 0.56 : 0.5); L.trav = vh * (wide ? 0.2 : 0.16);   // 문장 하나에 내리는 길이 · 멈춤 밖에서 움직이는 거리
      stage.style.height = vh + "px";
      el.style.height = (vh + (LEAD + n - 1 + TAIL) * L.step).toFixed(0) + "px";   // 첫 문장 앞 LEAD 칸, 끝 문장 뒤 TAIL 칸
      L.F = wide ? vh * (el.closest(".light") ? 0.5 : 0.68) : (box.offsetTop + box.offsetHeight + vh) / 2;   // 문장이 걸리는 높이(휴대폰은 그림 아래 남은 칸 가운데)
      caps.forEach(function (c) { c._h = c.offsetHeight; });
      L.bw = box.clientWidth; L.bh = box.clientHeight; L.ok = true;
    }
    function target() { if (L.ok) uT = -el.getBoundingClientRect().top / L.step - LEAD; }
    function pos(s) {   // 초점에서 문장까지(문장 칸 단위, + 는 아래) → 화면 거리. 걸린 동안(|s| < H)은 원래 빠르기의 SLOW 로 아주 천천히 흐르고(멈추지 않음),
      // 그 밖에선 멀어질수록 빨라져 TRAVEL 만큼 가서 사라짐. 경계에서 빠르기가 끊기지 않게 이어 붙임(11-22 사용자 "딱 멈추지 말고 속도를 미미하게")
      var a = Math.abs(s), v = SLOW * L.step, y, R = 0.5 - H;
      if (a <= H) y = a * v;
      else {
        var e = a - H, k = (L.trav - H * v - v * R) / (R * R);   // 바깥 구간 가속
        y = e <= R ? H * v + v * e + k * e * e : L.trav + (e - R) * (v + 2 * k * R);
      }
      return s > 0 ? y : -y;
    }
    function goalK(u) {   // 그림이 갈 문장: 내려가는 중이면 지금 문장의 걸림을 벗어나자마자 다음 문장, 올라가는 중이면 앞 문장
      var k = dirU > 0 ? Math.ceil(u - H) : Math.floor(u + H);
      return Math.max(0, Math.min(n - 1, k));
    }
    function play(dt) {   // 정한 장까지 장마다 정한 빠르기로(멀리 건너뛰면 3초 안에 닿게 빨리, 되감기는 1.5배) → 움직였으면 true
      var goal = stops[kT];
      if (P === null) P = goal;
      var d = goal - P; if (!d) return false;
      var i = Math.max(0, Math.min(T.length - 1, d > 0 ? Math.floor(P) : Math.ceil(P) - 1)), fps = R[i] || 24;
      var mv = fps * Math.max(1, Math.abs(d) / fps / 3) * (d < 0 ? 1.5 : 1) * dt;
      P = Math.abs(d) <= mv ? goal : P + (d > 0 ? mv : -mv);
      return true;
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
    function edge() {   // 들어올 때 윗가장자리 · 나갈 때 아랫가장자리를 지워 뒤의 바탕색(bgtween 이 구역에 칠한 색)으로 녹아들게 — 11-22 사용자 "넘어갈 때 뚝 끊겨 같은 테마인지 모르겠다"
      var r = stage.getBoundingClientRect(), vh = window.innerHeight, a = clamp(r.top / vh), b = clamp((vh - r.bottom) / vh);
      var mk = a > 0.001 || b > 0.001 ? "linear-gradient(to bottom, transparent 0%, #000 " + (a * 55).toFixed(1) + "%, #000 " + (100 - b * 55).toFixed(1) + "%, transparent 100%)" : "";
      if (mk !== L.mk) { L.mk = mk; stage.style.webkitMaskImage = mk; stage.style.maskImage = mk; }
      // 다른 구역의 전환(bgtween.js)과 같은 값: 들어올 땐 흐림 12px · 투명 → 또렷하게, 나갈 땐 흐려지며(최대 32px) 사라짐 — 11-22 사용자 "다른 페이지처럼 블러로 자연스럽게"
      // (앞뒤 카드와 단계 색이 같아 bgtween 의 전환이 걸리지 않으므로 여기서 직접)
      var vis = ss((vh * 0.8 - r.top) / (vh * 0.55)), out = ss((vh - r.bottom) / (vh * 0.6)), op = vis * (1 - out);
      var bl = Math.max((1 - vis) * 12, Math.min(1, out * 1.5) * 32), fx = op.toFixed(3) + "|" + bl.toFixed(1);
      if (fx !== L.fx) { L.fx = fx; stage.style.opacity = op >= 0.999 ? "" : op.toFixed(3); stage.style.filter = bl > 0.3 && op > 0.001 ? "blur(" + bl.toFixed(1) + "px)" : ""; }
    }
    function render(u, dt) {
      edge();
      caps.forEach(function (c, i) {   // 한 문장씩: 멈춘 동안 또렷하고, 움직이기 시작하면 사라짐. 제목은 무대와 함께 들어오고 끝 문장은 무대와 함께 나감(걸림 구간 끝자리에서)
        var end = (i === 0 && u < -H) || (i === n - 1 && u > n - 1 + H), e = Math.abs(u - i);
        var op = end || e <= H ? 1 : 1 - ss((e - H) / (0.5 - H) * 1.15);
        c.style.transform = "translateY(" + (L.F + pos(end ? (i === 0 ? H : -H) : i - u) - c._h / 2).toFixed(1) + "px)";
        c.style.opacity = op.toFixed(3);
        c.style.visibility = op < 0.003 ? "hidden" : "";
      });
      if (D.mix && P > mixA && P < mixB) mix((P - mixA) / (mixB - mixA));
      else { unmix(); put(A, near(Math.round(P)), kA); }
      var busy = false;
      overs.forEach(function (o, i) {   // 턴어라운드 · 와이어프레임 그림은 그림이 그 문장의 장에 닿아 있는 동안만(0.35초에 걸쳐 나타나고 사라짐)
        if (o.tagName !== "IMG") return;
        var want = i === kT && Math.abs(P - stops[i]) < 0.5 ? 1 : 0, cur = ovO[i] || 0;
        cur = want > cur ? Math.min(want, cur + dt / 0.35) : Math.max(want, cur - dt / 0.35);
        ovO[i] = cur; o.style.opacity = cur.toFixed(3); if (cur !== want) busy = true;
      });
      var top = 0; ovO.forEach(function (v) { if (v > top) top = v; });   // (빈 칸이 섞여 Math.max 는 NaN) 겹침 그림도 바탕이 투명해 아래 렌더가 비침 → 겹침이 보이는 만큼 렌더를 흐리게
      if (!mixing) A.style.opacity = top > 0.001 ? (1 - top).toFixed(3) : "";
      return busy;
    }
    function tick(now) {
      var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016; lastT = now;
      uS = uS === null || Math.abs(uT - uS) > 3 ? uT : uS + (uT - uS) * (1 - Math.exp(-dt / TAU));   // 휠 한 칸씩 뚝뚝 끊기지 않게
      kT = goalK(uS);
      var moving = play(dt), fading = render(uS, dt);
      if (Math.abs(uT - uS) > 0.0005 || moving || fading) requestAnimationFrame(tick); else { run = false; lastT = 0; }
    }
    function req() {
      if (!L.ok) layout();
      if (!L.ok) return;
      target(); if (!run) { run = true; requestAnimationFrame(tick); }
    }
    function scrolled() {   // 스크롤마다: 방향을 기억하고, 멈추면(0.16초) 맞춰 들어감
      req(); if (!L.ok) return;
      if (prevU !== null && Math.abs(uT - prevU) > 0.002) dirU = uT > prevU ? 1 : -1;
      prevU = uT; clearTimeout(idle); idle = setTimeout(snap, 160);
    }
    function snap() {   // 무대가 화면에 붙어 있는 동안 문장 사이에서 멈췄으면 진행 방향의 다음 문장 자리로(이미 문장 자리면 그대로)
      if (!L.ok) return; target();
      var u = uT, k = Math.round(u);
      if (u <= -LEAD || u >= n - 1 + TAIL || Math.abs(u - k) <= 0.08) return;
      var t = dirU > 0 ? Math.ceil(u) : Math.floor(u);
      if (t < 0 || t > n - 1) return;   // 첫 문장 앞으로 올라가거나 끝 문장 뒤로 내려가는 중이면 그대로 나가게
      window.scrollTo({ top: Math.round(el.getBoundingClientRect().top + window.scrollY + (t + LEAD) * L.step), behavior: "smooth" });
    }
    return { el: el, load: load, req: req, scrolled: scrolled, relayout: function () { L.ok = false; uS = null; req(); } };
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
  window.addEventListener("scroll", function () { near.forEach(function (s) { s.scrolled(); }); }, { passive: true });
  window.addEventListener("resize", function () { near.forEach(function (s) { s.relayout(); }); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { near.forEach(function (s) { s.relayout(); }); });
})();
