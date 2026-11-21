// 조립 소리(assemble.js 가 부품마다 부름): 부품이 자리에 닿는 순간 '찰칵'.
// 사용자 11-14: 처음 넣었던 찰칵 소리 그대로, 음(피치)만 낮춰 둔탁하고 작게. 마찰음은 뺌.
// 처음 소리 = 25 ms 잡음을 2.6~3.1 kHz 띠로 걸러 0.32 크기 → 지금 = 같은 모양을 0.95~1.15 kHz 띠로, 0.2 크기(귀에 들리는 크기 약 7 dB 작게, 11-14 측정).
// 브라우저는 누르기·키 입력 전엔 소리를 막으므로 첫 입력 때 소리 장치를 연다.
(function () {
  var ctx = null;
  function unlock() {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
    } catch (e) {}
  }
  ["pointerdown", "keydown", "touchend"].forEach(function (ev) { window.addEventListener(ev, unlock, { passive: true }); });

  function click(c, o, t) {
    var len = Math.floor(c.sampleRate * 0.025), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var j = 0; j < len; j++) d[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / len, 5);
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; f.type = "bandpass"; f.frequency.value = 950 + Math.random() * 200; f.Q.value = 3.5; g.gain.value = 0.2;
    s.connect(f); f.connect(g); g.connect(o); s.start(t);
    return [s];
  }
  // 부품 하나: dur(초) 동안 움직인 뒤, 닿는 순간 찰칵
  function build(c, o, t, dur) { return click(c, o, t + dur); }
  window.AsmSound = {
    build: build,
    part: function (dur) {
      if (!ctx || ctx.state !== "running") return null;
      try {
        var nodes = build(ctx, ctx.destination, ctx.currentTime, dur);
        return { stop: function () { nodes.forEach(function (n) { try { n.stop(); } catch (e) {} }); } };
      } catch (e) { return null; }
    }
  };
})();
