// 그 자리에서 만드는, 스크롤에 따라 스스로 변하는 모양(장면이 그 그림의 진행 pr 0~1 을 넘겨 준다 — 그림이 화면 62 % 높이에서 32 % 높이로 올라가는 동안):
//  · 파형: 말소리처럼 오르내리다가, 스크롤하면 빨간 NG 구간이 떨어져 나가고 남은 파형이 당겨 붙는다(01 단계의 '잘라 내고 당기기')
//  · 짚기: 스크롤하는 만큼 빨간 동그라미가 그려지고 ✓ 가 붙는다(입자 전부가 지금까지 그린 선 위에 고르게 퍼져, 잉크가 늘어나듯 선이 길어진다)
//  · 규칙: ✓ 가 붙은 줄 넷이 스크롤하는 만큼 한 줄씩 써진다
// 실제 작업물 데이터로 움직이는 모양(클리커 조립 · 하늘섬 고리 · 표정)은 shapes_model.js.
// 모두 {pos, col, hx, hy, live(t, pr)} — live 가 pos 를 그 자리에서 고쳐 쓴다.
(function () {
  var PT = window.PT = window.PT || {};
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ez(v) { v = cl(v); return v * v * (3 - 2 * v); }

  PT.wave = function (N, dark) {
    var B = 44, r = PT.rng(5), base = [], xo = [], xc = [], ng = [], kept = 0, k;
    var pos = new Float32Array(N * 3), col = new Float32Array(N * 3), bar = new Uint8Array(N), fr = new Float32Array(N), dx = new Float32Array(N), fly = new Float32Array(N * 2);
    for (k = 0; k < B; k++) { base[k] = 0.2 + 0.8 * Math.abs(Math.sin(k * 0.41 + 1) * 0.6 + (r() - 0.5) * 0.8); ng[k] = (k >= 8 && k <= 12) || (k >= 22 && k <= 25) || (k >= 34 && k <= 36); if (!ng[k]) kept++; }
    for (k = 0, kept = B - 12; k < B; k++) xo[k] = (k - (B - 1) / 2) * (2 / B);
    for (var idx = 0, kk = 0; kk < B; kk++) xc[kk] = ng[kk] ? xo[kk] : (idx++ - (kept - 1) / 2) * (2 / B);
    var c0 = PT.hex(dark ? "#e6eaff" : "#2f6fe0"), c1 = PT.hex(dark ? "#8f9ff0" : "#5a3fd8"), cr = PT.hex(dark ? "#ff5c7a" : "#ff3d55");
    for (var i = 0; i < N; i++) {
      var b = (r() * B) | 0, f = r() * 2 - 1, m = Math.abs(f), c = ng[b] ? cr : [c0[0] + (c1[0] - c0[0]) * m, c0[1] + (c1[1] - c0[1]) * m, c0[2] + (c1[2] - c0[2]) * m];
      bar[i] = b; fr[i] = f; dx[i] = (r() - 0.5) * (2 / B) * 0.42; fly[i * 2] = (r() - 0.5) * 1.6; fly[i * 2 + 1] = 2.2 + r() * 1.8;
      pos[i * 3 + 2] = (r() - 0.5) * 0.1; col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
    }
    function live(t, pr) {
      var cut = ez((pr - 0.28) / 0.55), c2 = cut * cut;
      for (var i = 0, p = 0; i < N; i++, p += 3) {
        var b = bar[i], h = fr[i] * base[b] * (0.6 + 0.4 * Math.sin(t * 2.3 + b * 0.55)) * 0.62;
        if (ng[b]) { pos[p] = xo[b] + dx[i] + fly[i * 2] * c2; pos[p + 1] = h * (1 - cut) + fly[i * 2 + 1] * c2; }   // 잘린 구간은 위로 날아가 화면 밖으로
        else { pos[p] = xo[b] + (xc[b] - xo[b]) * cut + dx[i]; pos[p + 1] = h; }
      }
    }
    live(0, 0);
    return { pos: pos, col: col, hx: 1, hy: 0.66, live: live };
  };

  // 손으로 두 바퀴 돌린 동그라미(길의 86 %) + ✓ — u(0~1)는 펜이 지나가는 순서
  function markAt(u, o) {
    if (u < 0.86) { var q = u / 0.86, th = 0.6 + 12.97 * q, w = 1 + 0.04 * Math.sin(3 * th) + 0.03 * q; o[0] = -0.26 + Math.cos(th) * 0.5 * w; o[1] = -0.02 - Math.sin(th) * 0.56 * w; return; }
    var v = (u - 0.86) / 0.14;
    if (v < 0.32) { v /= 0.32; o[0] = 0.5 + 0.14 * v; o[1] = -0.02 - 0.24 * v; } else { v = (v - 0.32) / 0.68; o[0] = 0.64 + 0.3 * v; o[1] = -0.26 + 0.7 * v; }
  }
  PT.mark = function (N, dark) {
    var r = PT.rng(11), pos = new Float32Array(N * 3), col = new Float32Array(N * 3), uu = new Float32Array(N), on = new Float32Array(N * 2), jit = new Float32Array(N * 2);
    var c = PT.hex(dark ? "#ff5a5f" : "#ff3d4f"), o = [0, 0], last = -1;
    for (var i = 0; i < N; i++) {
      uu[i] = r(); markAt(uu[i], o);
      var a = r() * 6.2832, d = Math.sqrt(r());
      jit[i * 2] = Math.cos(a) * d; jit[i * 2 + 1] = Math.sin(a) * d;
      on[i * 2] = o[0] + jit[i * 2] * 0.034; on[i * 2 + 1] = o[1] + jit[i * 2 + 1] * 0.034;
      pos[i * 3 + 2] = (r() - 0.5) * 0.1; col[i * 3] = c[0] * (0.86 + 0.14 * r()); col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
    }
    function live(t, pr) {
      var p = cl(pr * 1.18); if (Math.abs(p - last) < 0.0015) return; last = p;
      if (p >= 1) { for (var n = 0, m = 0; n < N; n++, m += 3) { pos[m] = on[n * 2]; pos[m + 1] = on[n * 2 + 1]; } return; }
      var pe = Math.max(p, 0.03);                                                // 처음엔 펜이 닿은 자리의 잉크 한 방울
      for (var i = 0, q = 0; i < N; i++, q += 3) {                               // 입자 전부를 지금까지 그린 길이 안에 고르게 → 펜 끝에 뭉치지 않는다(11-21: 펜 끝의 붉은 덩어리를 없앰)
        markAt(uu[i] * pe, o); pos[q] = o[0] + jit[i * 2] * 0.034; pos[q + 1] = o[1] + jit[i * 2 + 1] * 0.034;
      }
    }
    live(0, 0);
    return { pos: pos, col: col, hx: 1, hy: 0.7, live: live };
  };

  PT.rules = function (N, dark) {
    var r = PT.rng(23), pos = new Float32Array(N * 3), col = new Float32Array(N * 3), row = new Uint8Array(N), kind = new Uint8Array(N), vv = new Float32Array(N), jit = new Float32Array(N * 2);
    var LEN = [1.12, 0.84, 1.24, 0.7], cg = PT.hex(dark ? "#7fdcb5" : "#0f9467"), cv = PT.hex(dark ? "#b5a8ff" : "#6b4de0"), last = -1;
    for (var i = 0; i < N; i++) {
      row[i] = (r() * 4) | 0; kind[i] = r() < 0.2 ? 1 : 0; vv[i] = r();
      var a = r() * 6.2832, d = Math.sqrt(r()); jit[i * 2] = Math.cos(a) * d; jit[i * 2 + 1] = Math.sin(a) * d;
      var c = kind[i] ? cg : cv; pos[i * 3 + 2] = (r() - 0.5) * 0.1; col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
    }
    function live(t, pr) {
      var p = cl(pr * 1.15) * 4; if (Math.abs(p - last) < 0.004) return; last = p;
      for (var i = 0, q = 0; i < N; i++, q += 3) {
        var k = row[i], y = 0.6 - k * 0.4, g = cl(p - k), v, x;
        if (kind[i]) {                                                            // ✓: 짧게 내려갔다 길게 올라감
          v = vv[i] * cl(g * 2.6);
          if (v < 0.36) { x = -0.9 + 0.1 * v / 0.36; y += -0.02 - 0.1 * v / 0.36; } else { x = -0.8 + 0.2 * (v - 0.36) / 0.64; y += -0.12 + 0.24 * (v - 0.36) / 0.64; }
          pos[q] = x + jit[i * 2] * 0.03; pos[q + 1] = y + jit[i * 2 + 1] * 0.03;
        } else {                                                                  // 줄: 왼쪽에서 오른쪽으로 써짐(입자 전부가 지금까지 쓴 길이에 고르게 — 아직이면 줄 머리에 점으로)
          v = vv[i] * cl(g * 1.5 - 0.3);
          pos[q] = -0.42 + LEN[k] * v + jit[i * 2] * 0.03; pos[q + 1] = y + jit[i * 2 + 1] * 0.045;
        }
      }
    }
    live(0, 0);
    return { pos: pos, col: col, hx: 0.95, hy: 0.78, live: live };
  };
})();
