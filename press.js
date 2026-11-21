// 클리커 첫 판: 조립된 클리커의 머리를 누르면 딸깍(img[data-press] = 눌림 단계 그림 p000~012, 0 → 3.6 mm).
// 누르고 있으면 눌린 채, 떼면 올라온다. 누를 때·뗄 때 짧은 딸깍 소리(직접 누를 때만 — 브라우저 규칙).
// 안내 문구는 두지 않는다(사용자 11-13): 아무도 안 눌렀으면 화면에 보일 때 몇 초마다 저절로 한 번 딸깍해서 움직인다는 걸 보여 줌.
(function () {
  document.querySelectorAll("img[data-press]").forEach(function (img) {
    var src = img.dataset.press, ext = img.dataset.ext || ".jpg", n = parseInt(img.dataset.count, 10), cache = [], k = 0, target = 0, raf = 0, last = 0, touched = false, vis = false, ctx = null, auto = 0;
    // data-ext: 바탕을 걷어 낸 .webp(06 카드, 11-22) — 없으면 .jpg
    for (var i = 0; i < n; i++) { var im = new Image(); im.src = src + String(i).padStart(3, "0") + ext; cache.push(im); }
    function ready() { return cache.every(function (im) { return im.complete && im.naturalWidth > 0; }); }
    function show(i) { var c = cache[i]; if (c.complete && c.naturalWidth > 0 && img.src !== c.src) img.src = c.src; }
    function step(now) {
      var dt = last ? now - last : 16; last = now;
      var v = (n - 1) / (target > k ? 70 : 120);   // 내려갈 땐 0.07초, 올라올 땐 0.12초
      k = target > k ? Math.min(target, k + v * dt) : Math.max(target, k - v * dt);
      show(Math.round(k));
      if (k !== target) raf = requestAnimationFrame(step); else { raf = 0; last = 0; }
    }
    function go(t) { target = t; if (!raf) raf = requestAnimationFrame(step); }
    function tick(vol, freq) {   // 짧은 잡음을 좁은 대역으로 걸러 '딸깍'
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        var len = Math.floor(ctx.sampleRate * 0.03), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
        for (var j = 0; j < len; j++) d[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / len, 6);
        var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        s.buffer = buf; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 3; g.gain.value = vol;
        s.connect(f); f.connect(g); g.connect(ctx.destination); s.start();
      } catch (e) {}
    }
    img.addEventListener("pointerdown", function (e) {
      if (!ready()) return;
      if (e.pointerType === "mouse") e.preventDefault();
      if (auto) { clearTimeout(auto); auto = 0; }   // 저절로 딸깍하던 중이면 그 '떼기'를 끊는다 — 누르고 있는데 머리가 혼자 올라오던 것(11-22)
      touched = true; go(n - 1); tick(0.9, 3200);
      var fig = img.closest("figure"); if (fig) fig.classList.add("pressed");   // 한 번 눌러 봤으면 '눌러 보세요' 안내를 거둔다(css/cards05.css .cs-hint)
    });
    window.addEventListener("pointerup", function () { if (target === n - 1 && touched) { go(0); tick(0.45, 2300); } });
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(img);
    setInterval(function () { if (touched || !vis || !ready()) return; go(n - 1); auto = setTimeout(function () { auto = 0; go(0); }, 260); }, 3200);
  });
})();
