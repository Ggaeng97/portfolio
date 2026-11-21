// 카드 속 움직이는 그래픽(화면에 보일 때만 돈다) + 좌우로 끌어 비교하기.
//  .typer[data-lines="한 줄|두 줄"]   : 알약 안에서 글이 타이핑되고 지워지며 다음 줄로
//  .cycle (안의 span 들)              : 하나씩 차례로 켜짐(단계·부품 이름)
//  .checks (안의 li 들)               : 하나씩 체크되고, 다 되면 처음부터
//  .cmpd (그림 두 장 = 처음·지금)      : 끌면(마우스·손가락) 경계선이 따라옴. 페이지에서 처음 보이는 비교 하나만 한 번 저절로 좌우로 움직여 끌 수 있다는 걸 보여 줌(탭을 바꿔도 다시 안 함)
// window.initCmp(el) 로 나중에 만든 비교도 살린다(sections.js).
(function () {
  function onView(el, fn) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { fn(e.isIntersecting); }); }, { threshold: 0.1 });
    io.observe(el);
  }
  // 타이핑 알약
  document.querySelectorAll(".typer").forEach(function (el) {
    var lines = el.dataset.lines.split("|"), out = el.querySelector(".typer-text"), li = 0, ci = 0, del = false, live = false, t = null;
    function step() {
      if (!live) { t = null; return; }
      var s = lines[li];
      if (!del) { ci++; out.textContent = s.slice(0, ci); if (ci >= s.length) { del = true; t = setTimeout(step, 1700); return; } t = setTimeout(step, 70); }
      else { ci -= 2; out.textContent = s.slice(0, Math.max(0, ci)); if (ci <= 0) { del = false; ci = 0; li = (li + 1) % lines.length; t = setTimeout(step, 350); return; } t = setTimeout(step, 22); }
    }
    onView(el, function (v) { live = v; if (v && !t) step(); });
  });
  // 차례로 켜짐 · 체크 목록
  document.querySelectorAll(".cycle, .checks").forEach(function (el) {
    var items = el.querySelectorAll(el.classList.contains("checks") ? "li" : "span"), k = -1, live = false, t = null, list = el.classList.contains("checks");
    function step() {
      if (!live) { t = null; return; }
      k = (k + 1) % (items.length + (list ? 2 : 0));
      items.forEach(function (it, j) { it.classList.toggle("on", list ? j <= k : j === k); });
      t = setTimeout(step, list ? 900 : 1300);
    }
    onView(el, function (v) { live = v; if (v && !t) step(); });
  });

  // 좌우로 끌어 비교
  // 좌우로 움직이는 안내는 페이지 전체에서 딱 한 번(처음 보이는 비교 하나에서만). 한 번이라도 끌어 봤으면 안 함
  var sweptOnce = false;
  function initCmp(box) {
    if (box.dataset.ready) return;
    box.dataset.ready = "1";
    var x = 50, dragging = false, touched = false;
    function set(v) { x = Math.max(0, Math.min(100, v)); box.style.setProperty("--x", x + "%"); }
    function at(e) { var r = box.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; }
    box.addEventListener("pointerdown", function (e) { dragging = touched = sweptOnce = true; box.setPointerCapture(e.pointerId); set(at(e)); box.classList.add("held"); });
    box.addEventListener("pointermove", function (e) { if (dragging) set(at(e)); });
    function up() { dragging = false; box.classList.remove("held"); }
    box.addEventListener("pointerup", up); box.addEventListener("pointercancel", up);
    set(50);
    // data-spin="앞 그림 앞부분|뒤 그림 앞부분|장수": 두 쪽 모두 턴테이블로 함께 돈다(보일 때만, 초당 24장)
    if (box.dataset.spin) {
      var sp = box.dataset.spin.split("|"), n = +sp[2], A = box.querySelector(".bef img"), B = box.querySelector("img.aft");
      var pad = function (k) { return String(k).padStart(3, "0") + ".jpg"; }, cache = null, k = 0, live = false, last = 0;
      var spin = function (ts) {
        if (!live) return;
        if (ts - last > 41) {
          last = ts; k = (k + 1) % n;
          A.src = cache[0][k].src; B.src = cache[1][k].src;
        }
        requestAnimationFrame(spin);
      };
      onView(box, function (v) {
        if (v && !cache) cache = [sp[0], sp[1]].map(function (pre) { return Array.apply(null, { length: n }).map(function (_, j) { var im = new Image(); im.src = pre + pad(j); return im; }); });
        var was = live; live = v;
        if (v && !was) requestAnimationFrame(spin);
      });
    }
    // 처음 보일 때 한 번 좌우로 저절로(끌 수 있다는 표시) — 페이지에서 처음 한 번만
    onView(box, function (v) {
      if (!v || sweptOnce || touched) return;
      sweptOnce = true;
      var t0 = null;
      function sweep(ts) {
        if (touched) return;
        if (t0 === null) t0 = ts;
        var u = (ts - t0) / 2600;
        if (u >= 1) { set(50); return; }
        set(50 + 28 * Math.sin(u * Math.PI * 2));
        requestAnimationFrame(sweep);
      }
      setTimeout(function () { requestAnimationFrame(sweep); }, 500);
    });
  }
  window.initCmp = initCmp;
  document.querySelectorAll(".cmpd").forEach(initCmp);
})();
