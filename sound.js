// 소리 단추 · 배경음 흐름(기승전결) · 글 써지기(한 줄씩, 핵심 줄만 타자 소리) · 분필 밑줄. 소리 자체는 audio.js(SiteAudio)가 낸다.
//  · 11-21 사용자: 구역마다 층을 켜고 끄니 "확 몰리고 확 줄어 갑작스럽다" → 읽어 내려갈수록 층이 하나씩 쌓인다
//    (건반 → 베이스 · 패드 → 글로켄슈필 → 드럼 → 휘파람 멜로디). 쌓이는 속도에 한도가 있어 빨리 내려도 시간이 흐르며 천천히 쌓인다.
//  · "기승전결이 있듯 가장 마지막엔 잔잔하게" → 마무리(#next)에 닿으면 층이 거꾸로 빠지고 오르골이 들어온다.
//  · 소리는 기본 켜짐 — 열자마자 재생하고(자동 재생을 허락하는 브라우저 · Claude 앱 미리보기), 막는 브라우저에선 페이지 어디든 첫 클릭 · 키 · 터치에서 바로 시작.
//    ♪ 단추는 처음부터 켜진 모양 그대로(11-21 사용자: "기본적으로 소리가 켜 있으면 좋겠다고 — 왜 자꾸 소리 켜기를 누르게 해 놨어" → '소리 켜기' 모양 · 깜빡임 뺌).
//  · 분필 소리: snd/chalk.mp3 한 칸(지금은 소리 없는 빈 파일 — 고른 소리로 덮어쓰면 남). 밑줄 · 동그라미 · ✓ 때 chalkSound().
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var defs = document.createElementNS(NS, "svg"); defs.setAttribute("width", "0"); defs.setAttribute("height", "0"); defs.setAttribute("aria-hidden", "true");
  defs.style.position = "absolute";
  defs.innerHTML = '<filter id="chalk-rough" x="-5%" y="-40%" width="110%" height="180%"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="4" result="n"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/></filter>';
  document.body.appendChild(defs);

  var A = window.SiteAudio, on = true, calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // 소리 크기 VOL 0~1(기본 0.7, 브라우저가 기억). 귀에 고르게 들리게 제곱으로 — 0.7 일 때 예전 크기(배경음 0.034)
  var VOL = 0.7; try { var sv = parseFloat(localStorage.getItem("site-vol")); if (sv >= 0 && sv <= 1) VOL = sv; } catch (e) {}
  function master() { return 0.0694 * VOL * VOL; }
  function fxk() { return VOL * VOL / 0.49; }
  var btn = document.createElement("button"); btn.className = "snd-btn on"; btn.type = "button"; btn.setAttribute("aria-label", "소리 크기 조절(두 번 누르면 끄기)");
  var pop = document.createElement("div"); pop.className = "snd-pop";
  pop.innerHTML = '<input type="range" min="0" max="100" step="1" aria-label="소리 크기">';
  var bar = pop.firstChild; bar.value = Math.round(VOL * 100);
  document.body.appendChild(pop); document.body.appendChild(btn);
  function look() { btn.classList.toggle("on", on && VOL > 0); }
  function tryStart() { if (on && !A.playing()) A.start().catch(function () {}); }
  // 첫 손짓(페이지 어디든 클릭 · 키 · 터치, ♪ 포함)은 언제나 '틀기' — 끄지 않는다. 열 때부터 돌던 소리는 다시 서서히(audio.js unlock).
  var gestured = false;
  function first() { if (gestured) return false; gestured = true; if (on) { A.unlock().catch(function () {}); replayKeys(); } return true; }
  // 첫 손짓 전(브라우저가 소리를 막던 동안) 이미 써진 핵심 문장이 화면에 있으면 다시 써서 타자 소리를 들려준다
  // (11-21 사용자: 들머리 마지막 다짐은 첫 화면 바로 다음이라 첫 클릭 전에 소리 없이 써져 버림 — "이것도 소리가 나야 해")
  function replayKeys() {
    if (calm || !window.IntersectionObserver) return;
    writers.forEach(function (el) {
      if (el._st !== 2 || !el.matches(KEY)) return;
      var r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      reset(el); el._st = 1; queue.push(el);
    });
    queue.sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; }); next();
  }
  ["pointerdown", "keydown", "touchend"].forEach(function (ev) {
    window.addEventListener(ev, function (e) {
      var t = e.target && e.target.closest ? e.target : null;
      if (t && t.closest(".snd-btn")) return;
      // 첫 카드(entry.js)가 떠 있는 동안엔 '파스텔' · '다크' 칸을 눌러야만 시작 — 허공을 눌러도 흐르지 않게(11-21 사용자)
      if (document.querySelector(".entry") && (!t || !t.closest(".en-pick button") || (ev === "keydown" && e.key !== "Enter" && e.key !== " "))) return;
      if (!first()) tryStart();
    }, { passive: true, capture: true });
  });
  // ♪ 한 번 = 크기 조절 막대 열기/닫기(꺼져 있으면 켬), 두 번 = 끄기/켜기 — 탁 끄지 않고 줄일 수 있게(11-21 사용자)
  function setOn(v) { on = v; look(); if (on) tryStart(); else { A.stop(); pop.classList.remove("open"); } }
  var clickT = 0;
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    var was = first();                                           // 첫 손짓이 ♪ 여도 끄지 않고 튼다
    clearTimeout(clickT);
    clickT = setTimeout(function () {                            // 두 번 누르기와 가리려고 잠깐 기다린다
      if (!on) { setOn(true); return; }
      if (!was && !A.playing()) tryStart();
      pop.classList.toggle("open");
    }, 240);
  });
  btn.addEventListener("dblclick", function (e) { e.stopPropagation(); clearTimeout(clickT); setOn(!on); });
  bar.addEventListener("input", function () {
    VOL = bar.value / 100; A.volume(master()); look();
    try { localStorage.setItem("site-vol", String(VOL)); } catch (e) {}
  });
  ["pointerdown", "keydown"].forEach(function (ev) {             // 막대 밖을 누르면 닫힘
    document.addEventListener(ev, function (e) { if (!(e.target.closest && e.target.closest(".snd-pop, .snd-btn"))) pop.classList.remove("open"); }, true);
  });
  window.addEventListener("scroll", function () { pop.classList.remove("open"); }, { passive: true });
  window.chalkSound = function () { A.fx("chalk", 0.12 * fxk(), 0.92 + Math.random() * 0.16); };

  // 배경음 흐름: 구역마다 쌓인 정도의 목표(기 · 승 · 전 = 클리커에서 가장 풍성), 마무리는 결(층이 빠지고 오르골).
  // 실제 값 E: 쌓이는 쪽(목표가 더 높음)은 스크롤하는 동안에만 움직이고(멈추면 그 자리에서 멈춤), 빠지는 쪽(위로 올라감 · 마무리)은 멈춰 있어도 진행.
  // 스크롤하는 동안 0→1 에 6초 이상(층 하나가 1초쯤에 걸쳐), 빠질 땐 10초 이상. 층이 한 번에 하나씩 들어오는 건 문턱이 층마다 따로라서.
  // (11-21 사용자: '확 몰려 갑작스럽다' → 80초로 늦춤 → '다양해지는 구간이 너무 느리다 · 가만히 두면 알아서 쌓이는 느낌' → '스크롤이 멈춰 있으면 쌓이면 안 돼')
  var ARC = { top: 0, why: .1, story: .2, st1: .32, st2: .46, st3: .6, stR: .72, st4: .86, st5: 1 };
  var ZONES = ["top", "why", "story", "st1", "st2", "st3", "stR", "st4", "st5", "next"]
    .map(function (id) { return document.getElementById(id); }).filter(Boolean);
  function target() {
    var mid = innerHeight * 0.5, k = 0, f = 0;
    ZONES.forEach(function (el, i) { var r = el.getBoundingClientRect(); if (r.top < mid) { k = i; f = Math.min(1, (mid - r.top) / Math.max(1, r.height)); } });
    var id = ZONES[k].id, nx = ZONES[k + 1] && ARC[ZONES[k + 1].id];
    if (id === "next") return { e: 0.08, end: 1 };
    return { e: ARC[id] + ((nx === undefined ? ARC[id] : nx) - ARC[id]) * f, end: 0 };
  }
  function ss(a, b, x) { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
  function levels(e, end) {                                     // 파일 순서: 건반 · 베이스+패드 · 글로켄슈필 · 드럼 · 멜로디 · 오르골
    return [1 - 0.3 * end, 0.85 * ss(0.06, 0.2, e),        // 건반은 첫 화면부터 제 크기(11-21 사용자: "인트로 화면부터 음악이 있어야 해")
             0.7 * ss(0.22, 0.36, e), 0.8 * ss(0.38, 0.54, e), 0.75 * ss(0.6, 0.78, e), 0.85 * end];
  }
  var E = 0, END = 0, sent = levels(0, 0), last = performance.now(), moved = -1e9;
  window.addEventListener("scroll", function () { moved = performance.now(); }, { passive: true });
  A.volume(master()); A.mix(sent); look(); tryStart();
  setInterval(function () {
    var t = performance.now(), dt = Math.min(1, (t - last) / 1000); last = t;
    if (!A.playing()) return;                                     // 소리가 나기 시작한 뒤부터 흐른다
    var g = target();
    var d = g.e - E;
    if (d > 0) { if (t - moved < 300) E += Math.min(d, dt / 6); }   // 쌓이는 건 스크롤하는 동안만
    else E += Math.max(d, -dt / 10);                                // 빠지는 건 멈춰 있어도
    END += Math.max(-dt / 3, Math.min(dt / 4, g.end - END));
    var lv = levels(E, END);
    if (lv.some(function (v, i) { return Math.abs(v - sent[i]) > 0.003; })) { sent = lv; A.mix(lv); }
  }, 200);
  window.SiteMusic = { energy: function () { return E; }, end: function () { return END; }, target: target, levels: function () { return sent.slice(); } };   // 점검용

  // 글 써지기: 화면에 들어온 글을 문서 순서대로 한 줄씩(앞 줄이 다 써진 뒤 다음 줄) 앞 글자부터 — 여러 줄이 한꺼번에 써지지 않게.
  // 타자 소리는 핵심 문장(단계 제목 01~06 · 들머리 마지막 다짐 · 마무리 제목)만 — 모든 줄에서 나면 겹쳐서 시끄럽다(11-21 사용자:
  // "핵심 1~2줄만" → "전부 없애 달란 게 아니라 12345 정도는, 핵심 문장 위주로"). 다리 문장 · 들머리의 다른 줄은 조용히 써진다. 번호(.st-no)는 처음부터 보인다.
  var KEY = ".st-title .st-h, .fh-group.last .fh-line, .next-card h2";
  var writers = Array.prototype.slice.call(document.querySelectorAll(".fh-line, .st-map-k, .st-title .st-h, .st-bridge p, .next-card h2"));
  function split(el) {
    var n = 0, w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), list = [];
    while (w.nextNode()) if (!w.currentNode.parentNode.closest(".st-no")) list.push(w.currentNode);
    list.forEach(function (t) {                                   // 글 덩어리마다 감싸개 하나 — 줄 배치가 flex 인 곳(다리 문장)에서 글자가 한 칸씩 벌어지지 않게
      var f = document.createElement("span"); f.className = "chw";
      Array.from(t.nodeValue).forEach(function (c) {
        if (/\s/.test(c)) { f.appendChild(document.createTextNode(c)); return; }
        var s = document.createElement("span"); s.className = "ch"; s.style.setProperty("--i", n++); s.textContent = c; f.appendChild(s);
      });
      t.parentNode.replaceChild(f, t);
    });
    return n;
  }
  if (!calm) writers.forEach(function (el) { el.dataset.n = split(el); el.classList.add("wr"); });
  // 타자 소리 크기 0.08(음악에 묻히지 않게, 11-21 0.06 에서 올림)
  function write(el, instant) {                                   // 핵심 문장은 천천히(글자당 40ms) + 타자 소리, 나머지는 조용히 빨리(26ms)
    var n = +el.dataset.n || 1, key = el.matches(KEY), step = instant ? 0 : Math.min(key ? 40 : 26, (key ? 2000 : 1100) / n), t0 = performance.now();
    el.style.setProperty("--st", step + "ms"); el.classList.add("go");
    if (key && !instant) (function tick() { if (el._st !== 2 || performance.now() - t0 > n * step) return; A.fx("type", 0.08 * fxk(), 0.85 + Math.random() * 0.35); setTimeout(tick, 70 + Math.random() * 50); })();
    return n * step + 240;
  }
  // 줄마다 상태 _st: 0 = 안 써짐, 1 = 차례 기다림, 2 = 써짐. 화면 밖으로 완전히 나가면 0 으로 되돌려 다시 들어올 때 또 써진다(타자 소리 · 밑줄도 다시)
  // (11-21 사용자: "한번 내렸다 올려도 다시 재생이 안 됨 — 그로 인해 한번 싱크가 틀어지면 더 이상 소리를 못 들어")
  var queue = [], busy = false;
  function next() {
    if (busy || !queue.length) return;
    var el = queue.shift(), past = el.getBoundingClientRect().bottom < 0;   // 이미 위로 지나간 줄은 바로 보이고 넘어감
    busy = true; el._st = 2;
    var dur = write(el, past);
    el.querySelectorAll(".ul").forEach(function (u, i) { u._tm = setTimeout(function () { if (el._st === 2) { u.classList.add("drawn"); window.chalkSound(); } }, dur + 150 + i * 300); });
    setTimeout(function () { busy = false; next(); }, past ? 0 : dur - 120);
  }
  function reset(el) {
    if (el._st === 1) queue.splice(queue.indexOf(el), 1);
    el._st = 0; el.classList.remove("go");
    el.querySelectorAll(".ul").forEach(function (u) { clearTimeout(u._tm); u.classList.remove("drawn"); });
  }
  // 분필 밑줄: 글에 .ul 만 붙이고(선은 css 배경) 글이 다 써진 뒤 긋는다
  var lines = Array.prototype.slice.call(document.querySelectorAll(".fh-line em, .st-lede b, .next-card h2 em"));
  lines.forEach(function (el) { el.classList.add("ul"); });
  if (calm || !("IntersectionObserver" in window)) { lines.forEach(function (el) { el.classList.add("drawn"); }); return; }
  function seen(e) { return e.isIntersecting && e.intersectionRatio >= 0.55; }   // 60 % 넘게 보일 때만(살짝 걸친 것은 아직)
  function onSeen(es) {
    es.forEach(function (e) { var el = e.target; if (seen(e) && !el._st) { el._st = 1; queue.push(el); } });
    queue.sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
    next();
  }
  var wio = new IntersectionObserver(onSeen, { threshold: 0.6, rootMargin: "0px 0px -10% 0px" });
  // 입자 장면이 켜진 들머리(#why.pt-on, pt/scene.js)는 문장이 화면 62 % 높이에 올라와 '지금 장면'이 될 때 써진다(입자가 그 모양으로 모이는 때와 같이)
  var wioPt = new IntersectionObserver(onSeen, { threshold: 0.6, rootMargin: "0px 0px -36% 0px" });
  var outv = new IntersectionObserver(function (es) {             // 화면 밖으로 완전히 나감 → 되돌림
    es.forEach(function (e) {
      var el = e.target; if (e.isIntersecting) return;
      if (el._st) reset(el);
      if (el._on) { el._on = 0; clearTimeout(el._tm); el.classList.remove("drawn"); }
    });
  }, { threshold: 0 });
  writers.forEach(function (el) { (el.closest(".fhook.pt-on") ? wioPt : wio).observe(el); outv.observe(el); });
  var lio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var el = e.target; if (!seen(e) || el._on) return;
      el._on = 1; el._tm = setTimeout(function () { el.classList.add("drawn"); window.chalkSound(); }, 300);
    });
  }, { threshold: 0.6, rootMargin: "0px 0px -12% 0px" });
  lines.forEach(function (el) { if (!el.closest(".wr")) { lio.observe(el); outv.observe(el); } });   // 써지는 글 안의 밑줄은 다 써진 뒤(위)
})();
