// 훅(검은 화면의 문장들)이 끝나면 본문(#story)으로 부드럽게 내려간다(사용자 11-15 밤 "이거 끝나고 화면 본문으로 부드럽게 스르륵").
// 훅이 끝났는지는 hook2.js 가 내주는 window.__hk().done 으로 안다(hookgate.js 와 같은 신호).
// 마지막 문장을 읽을 틈(0.9초)을 두고, 1.3초 동안 천천히 출발해 천천히 멈추며 내려간다.
// 사용자가 스스로 굴리는 중이면(0.7초 안에 입력이 있었으면) 끼어들지 않고 기다리며, 내려가는 도중 입력이 들어오면 바로 손을 뗀다.
// 훅이 아직 화면에 절반 넘게 남아 있을 때만 움직인다(이미 지나갔거나 위로 되돌아갔으면 건드리지 않음).
(function () {
  var hook = document.getElementById("challenge"), story = document.getElementById("story");
  if (!hook || !story) return;
  var lastInput = 0, stop = false, running = false, timer = 0;
  function onInput() { lastInput = performance.now(); if (running) stop = true; }
  ["wheel", "touchstart", "touchmove", "keydown", "mousedown"].forEach(function (ev) { window.addEventListener(ev, onInput, { passive: true }); });
  function calm() { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function glide() {
    var r = hook.getBoundingClientRect(), dist = Math.ceil(story.getBoundingClientRect().top) + 1;
    if (document.body.classList.contains("hook-retired") || dist < 8) return;
    if (r.bottom < window.innerHeight * 0.5 || r.top > 40) return;
    if (performance.now() - lastInput < 700) { setTimeout(glide, 400); return; }
    var from = window.scrollY, t0 = 0, dur = 1300;
    if (calm()) { window.scrollTo({ top: from + dist, behavior: "instant" }); return; }
    stop = false; running = true;
    function step(now) {
      if (stop || document.body.classList.contains("hook-retired")) { running = false; return; }
      if (!t0) t0 = now;
      var k = Math.min(1, (now - t0) / dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      window.scrollTo({ top: from + dist * e, behavior: "instant" });
      if (k < 1) requestAnimationFrame(step); else running = false;
    }
    requestAnimationFrame(step);
  }
  timer = setInterval(function () {
    var s = window.__hk && window.__hk();
    if (!s || !s.done) return;
    clearInterval(timer);
    setTimeout(glide, 900);
  }, 200);
})();
