// 스크롤 고정 장면([data-asm]): 내리는 만큼 렌더 그림이 넘어간다(분해 → 조립, 카메라가 다가가는 장면 등).
// data-src = 그림 앞부분(예: img/assemble_m/a), data-count = 장수(a000.jpg ~). 설명은 .asm-cap[data-at](0~1).
// data-stops="0;19;37…": 설명마다 머무는 그림 번호(설명 수와 같게, ';' 로 나눔. 'a,b' 는 설명 하나에 여러 자리를 잠깐씩 쉬며 차례로).
//   스크롤은 지금 몇 번째 설명 구간인지만 정하고, 구간이 바뀌면 그 구간의 그림까지 정해진 시간 동안 스르륵 넘어간다(스크롤 속도를 따라가지 않음).
// data-one: 설명 하나 = 부품 하나(사용자 11-14). 부품이 다 끼워질 때까지 다음 설명으로 안 넘어가고, 그동안 스크롤을 잠근다.
// data-snap: 부품이 들어가는 동안 마찰음 + 자리에 앉을 때 낮은 '톡'(asm_sound.js). data-quiet="259" = 소리 없는 자리(카메라만 물러남).
(function () {
  var lockOn = false, guard = 0;
  function block(e) { e.preventDefault(); }
  function blockKey(e) { if ([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"].indexOf(e.key) >= 0) e.preventDefault(); }
  function lock(on) {   // 부품이 끼워지는 동안만 휠·터치·키를 막음(3초 넘으면 저절로 풂)
    clearTimeout(guard);
    if (on) guard = setTimeout(function () { lock(false); }, 3000);
    if (on === lockOn) return; lockOn = on;
    var f = on ? "addEventListener" : "removeEventListener";
    window[f]("wheel", block, { passive: false }); window[f]("touchmove", block, { passive: false }); window[f]("keydown", blockKey);
  }
  // 목차·장 바로가기·오른쪽 막대를 누른 이동(프로그램 이동)인지: 그때만 여러 칸을 한 번에 건너뜀
  var navAt = -1e9;
  document.addEventListener("click", function (e) { if (e.target.closest('a[href^="#"], .op-rail, .hc-chips, .cm, .pk')) navAt = performance.now(); }, true);
  document.querySelectorAll("[data-asm]").forEach(function (sec) {
    var withSnap = sec.hasAttribute("data-snap"), one = sec.hasAttribute("data-one");
    var quiet = (sec.dataset.quiet || "").split(",").map(Number);
    var src = sec.dataset.src, n = parseInt(sec.dataset.count, 10);
    var intro = sec.querySelector(".asm-intro");               // 있으면: 처음엔 겹쳐 있다가 내리기 시작하면 사라짐
    var raw = sec.dataset.stops, groups = !raw ? null : raw.split(raw.indexOf(";") >= 0 ? ";" : ",").map(function (g) { return g.split(",").map(Number); });
    var stops = groups ? groups.map(function (g) { return g[g.length - 1]; }) : null;   // 설명마다 마지막 자리
    var queue = [], qt = 0;
    var overs = sec.querySelectorAll(".asm-stop");
    var img = sec.querySelector(".asm-img"), caps = sec.querySelectorAll(".asm-cap");
    var track = sec.querySelector(".op-track"), fill = track ? track.querySelector("i") : null;
    function ok(im) { return im && im.complete && im.naturalWidth > 0; }
    function name(k) { return src + String(k).padStart(3, "0") + ".jpg"; }
    var cache = [];
    for (var k = 0; k < n; k++) { var im = new Image(); im.src = name(k); cache.push(im); }
    var dots = Array.prototype.map.call(caps, function (cp) {
      if (!track) return null;
      // 누르면 그 설명 구간으로(data-p = 장면 진행 0~1, railnav.js 가 이동)
      var s = document.createElement("s"); s.style.top = (parseFloat(cp.dataset.at) * 100) + "%"; s.dataset.p = (0.05 + parseFloat(cp.dataset.at) * 0.8 + 0.006).toFixed(4); track.appendChild(s); return s;
    });
    if (track) {
      track.dataset.p0 = "0.05"; track.dataset.p1 = "0.85";
      var lab = sec.querySelectorAll(".op-rail > span");
      if (lab.length === 2) { lab[0].dataset.p = (0.05 + parseFloat(caps[0].dataset.at) * 0.8 + 0.006).toFixed(4); lab[1].dataset.p = "0.86"; }
    }
    function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    // 렌더가 부품마다 20장 안팎이라 그대로 넘기면 초당 20장쯤으로 끊겨 보임(사용자 11-14) → 겹침 그림(.asm-mid)이 있으면
    // 지금 장 위에 다음 장을 남은 비율만큼 겹쳐, 화면이 바뀔 때마다(초당 60번) 조금씩 넘어가게 한다
    var last = -1, lastM = -1, mid = sec.querySelector(".asm-mid");
    function show(k) {
      var b = mid ? Math.floor(k + 1e-6) : Math.round(k), fr = mid ? k - b : 0;
      if (b !== last && ok(cache[b])) { last = b; img.src = cache[b].src; }   // 다 불러온 그림만(빈 틈에 깜빡이지 않게 — 사용자 11-15)
      if (!mid) return;
      var nx = Math.min(b + 1, n - 1);
      if (fr > 0.01 && nx !== lastM && ok(cache[nx])) { lastM = nx; mid.src = cache[nx].src; }
      mid.style.opacity = fr > 0.01 && lastM === nx && last === b ? fr.toFixed(3) : "0";
    }
    function warm(f, t) {   // 지나갈 장들을 미리 풀어 둠(그림 풀기가 늦어 한 장씩 밀리지 않게)
      var w = [];
      for (var j = Math.max(0, Math.floor(Math.min(f, t))); j <= Math.min(n - 1, Math.ceil(Math.max(f, t))); j++) if (cache[j].decode) w.push(cache[j].decode().catch(function () {}));
      return w;
    }
    function caption(j) {   // 설명·점은 '보이는 구간'(seg)을 따른다 — 스크롤 위치가 아니라
      caps.forEach(function (cp, i) { cp.classList.toggle("in", i === j); });
      dots.forEach(function (d, i) { if (d) d.classList.toggle("past", i <= j); });
    }

    // 구간별 움직임: 지금 그림 번호(a.k)에서 목표(a.to)까지 시간으로 재생
    var a = { k: stops ? stops[0] : 0, from: 0, to: stops ? stops[0] : 0, t0: 0, dur: 0, raf: 0, done: null }, seg = -1, arrived = true, snd = null, busy = false;
    function ease(u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
    function overlays() { overs.forEach(function (o, j) { o.style.opacity = arrived && j === seg ? "1" : "0"; }); }
    function step(now) {
      var u = clamp((now - a.t0) / a.dur);
      a.k = a.from + (a.to - a.from) * ease(u);
      show(a.k);
      if (u < 1) { a.raf = requestAnimationFrame(step); return; }
      a.raf = 0; a.k = a.to;
      if (queue.length) { var nx = queue.shift(); qt = setTimeout(function () { goTo(nx); }, 220); return; }   // 다음 부품까지 잠깐 쉼
      arrived = true; overlays();
      if (a.done) { var cb = a.done; a.done = null; cb(); }
    }
    function goTo(target, o) {
      o = o || {};
      if (target === a.to && (a.raf || Math.round(a.k) === target)) { overlays(); if (o.done) o.done(); return; }   // 같은 그림에서 겹침만 바뀌는 구간
      if (snd) { snd.stop(); snd = null; }
      a.from = a.k; a.to = target; a.t0 = performance.now(); a.done = o.done || null;
      a.dur = Math.min(1800, 450 + Math.abs(target - a.from) * 22);   // 멀수록 조금 길게(부품 하나 ≈ 0.9초, 최대 1.8초)
      if (o.instant || a.from === target) { a.k = target; show(target); arrived = true; overlays(); if (a.done) { var cb = a.done; a.done = null; cb(); } return; }
      var tok = a.tok = (a.tok || 0) + 1, w = warm(a.from, target), sound = withSnap && !o.quiet && window.AsmSound && target > a.from && quiet.indexOf(target) < 0;
      arrived = false; overlays();
      // 앞쪽 몇 장이 풀릴 때까지(최대 0.12초) 기다렸다 시작 — 소리도 그때 맞춰 예약
      Promise.race([Promise.all(w.slice(0, 6)), new Promise(function (r) { setTimeout(r, 120); })]).then(function () {
        if (tok !== a.tok) return;
        a.t0 = performance.now();
        if (sound) snd = window.AsmSound.part(a.dur / 1000);
        if (!a.raf) a.raf = requestAnimationFrame(step);
      });
    }

    // data-one: 한 칸씩 걸림(사용자 11-14: 스크롤 속도를 따라가지 말 것). 아무리 빨리 내려도 다음 부품 하나만 —
    //   스크롤 자리를 그 설명 구간 첫머리로 되돌려 놓고, 다 끼워질 때까지 잠근다.
    //   장면 밖·뒤로·목차/막대로 누른 이동이면 그 설명의 마지막 모습으로 바로.
    function holdAt(j) {   // j 번째 설명 구간 첫머리(구간 폭의 15 % 안쪽)로 스크롤 자리를 맞춤
      var r = sec.getBoundingClientRect(), range = r.height - window.innerHeight;
      var at = parseFloat(caps[j].dataset.at), nx = j + 1 < caps.length ? parseFloat(caps[j + 1].dataset.at) : 1;
      var y = r.top + window.scrollY + (0.05 + (at + (nx - at) * 0.15) * 0.8) * range;
      if (Math.abs(y - window.scrollY) > 2) window.scrollTo({ top: Math.round(y), behavior: "instant" });
    }
    function oneStep(cur, inPin) {
      if (cur === seg) return;
      var nav = performance.now() - navAt < 1500, auto = window.AutoScene && window.AutoScene.on(sec);   // 자동 재생(autoscene.js)
      if (!inPin || seg < 0 || cur < seg || ((nav || auto) && cur - seg >= 2)) {
        busy = false; lock(false); clearTimeout(qt);
        var far = !inPin || seg < 0;
        seg = cur; caption(seg); goTo(stops[seg], { instant: far, quiet: true });
        return;
      }
      if (busy) { if (!nav && !auto) holdAt(seg); return; }       // 끼워지는 중에 더 내려간 만큼은 되돌림(자동 재생은 기다려 줌)
      seg += 1; caption(seg); busy = true; if (!auto) lock(true);
      if (!nav && !auto) holdAt(seg);
      goTo(stops[seg], { done: function () { qt = setTimeout(function () { busy = false; lock(false); req(); }, 250); } });
    }

    var first = true;
    function update() {
      var r = sec.getBoundingClientRect();
      var range = r.height - window.innerHeight;
      var p = range > 0 ? clamp(-r.top / range) : 0;
      var q = clamp((p - 0.05) / 0.8);           // 앞 5 % 는 처음 그대로, 끝 15 % 는 마지막 그대로 머묾
      if (intro) intro.style.opacity = (1 - clamp(p / 0.12)).toFixed(3);
      var cur = 0;
      caps.forEach(function (cp, j) { if (q >= parseFloat(cp.dataset.at)) cur = j; });
      if (fill) fill.style.height = (q * 100).toFixed(2) + "%";
      if (stops && one) oneStep(Math.min(cur, stops.length - 1), r.top <= 1 && r.bottom >= window.innerHeight - 1);
      else if (stops) {
        if (cur !== seg) {   // 같은 그림에서 겹침만 바뀌는 구간도 있음
          var fwd = seg >= 0 && cur > seg, g = groups[Math.min(cur, groups.length - 1)];
          seg = cur; caption(seg); clearTimeout(qt);
          queue = fwd ? g.slice(1) : [];                 // 앞으로 갈 땐 부품 하나씩, 뒤로 갈 땐 그 설명의 마지막 모습으로 바로
          goTo(fwd ? g[0] : g[g.length - 1], { instant: first }); overlays();
        }
      } else { caption(cur); show(q * (n - 1)); }
      first = false;
    }
    var queued = false;
    function req() { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; update(); }); } }
    window.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", req);
    update();
    // 자동 재생 시간표: 설명마다 그 구간 첫머리로 가서(부품이 끼워지는 동안 기다림) 읽을 시간만큼 머묾
    if (window.AutoScene && stops) {
      var keys = [{ p: 0, stay: intro ? 1.2 : 0.6 }];
      caps.forEach(function (cp, j) { var at = parseFloat(cp.dataset.at), nx = j + 1 < caps.length ? parseFloat(caps[j + 1].dataset.at) : 1; keys.push({ p: 0.05 + (at + (nx - at) * 0.15) * 0.8, go: 0.5, stay: 1.9 }); });
      keys.push({ p: 1, go: 0.8, stay: 0 });
      window.AutoScene.add(sec, keys, { busy: function () { return busy || !!a.raf || queue.length > 0; } });
    }
  });
})();
