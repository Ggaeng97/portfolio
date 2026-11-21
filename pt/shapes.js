// 입자 모양의 재료: 실제 작업물에서 뽑은 데이터(pt/data/*.js — 우파 · 표정 · 성당 · 클리커, _tools/pt/build_*.py 로 만듦)를 풀고,
// 데이터가 아직 안 왔을 때 대신 쓰는 구름을 만든다. 그 자리에서 만드는 모양(파형 · 짚기 · 규칙)은 shapes_live.js, 데이터로 움직이는 모양(조립 · 고리 · 표정)은 shapes_model.js.
// 모양은 모두 {pos: Float32(3N) 모양 좌표(대략 ±1, y 위 · z 보는 쪽), col: Float32(3N, 0~1), hx · hy: 반 너비 · 반 높이} 꼴.
(function () {
  var PT = window.PT = window.PT || {}, RANGE = 1.5, cache = {}, waiting = {};

  function bytes(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  // 점이 모자라면 처음부터 다시 돌려 쓴다(살짝 흩어서 같은 자리에 겹치지 않게)
  function posOf(s, N) {
    var q = new Int16Array(bytes(s).buffer), m = q.length, o = new Float32Array(N * 3);
    for (var i = 0; i < N * 3; i++) o[i] = q[i % m] / 32767 * RANGE + (i >= m ? (Math.sin(i * 12.9898) * 43758.5453 % 1) * 0.012 : 0);
    return o;
  }
  function colOf(s, N) { var u = bytes(s), m = u.length, o = new Float32Array(N * 3); for (var i = 0; i < N * 3; i++) o[i] = u[i % m] / 255; return o; }

  // 데이터 파일을 <script> 로 불러온다(파일 주소에서도 됨). 이미 있으면 바로.
  PT.load = function (name, v) {
    if (window.PT_DATA && window.PT_DATA[name]) return Promise.resolve(true);
    if (!waiting[name]) waiting[name] = new Promise(function (ok) {
      var s = document.createElement("script"); s.src = "pt/data/" + name + ".js" + (v || ""); s.async = true;
      s.onload = function () { ok(true); }; s.onerror = function () { ok(false); };
      document.head.appendChild(s);
    });
    return waiting[name];
  };
  // 풀어 놓은 데이터 {pos, col, sets: {pos_… · col_…}, meta} — 아직 안 왔으면 null
  PT.data = function (name, N) {
    var d = window.PT_DATA && window.PT_DATA[name]; if (!d) return null;
    var key = name + ":" + N; if (cache[key]) return cache[key];
    var o = { pos: posOf(d.pos, N), col: colOf(d.col, N), sets: {}, meta: d.meta || {} };
    for (var k in d.sets || {}) o.sets[k] = k.indexOf("pos_") === 0 ? posOf(d.sets[k], N) : colOf(d.sets[k], N);
    return (cache[key] = o);
  };

  PT.rng = function (seed) { var x = seed >>> 0; return function () { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; };
  PT.hex = function (h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; };
  // 모양의 반 너비 · 반 높이(그림 자리에 꽉 차게 넣을 때 씀)
  PT.extent = function (pos, N) {
    var hx = 0.01, hy = 0.01;
    for (var i = 0; i < N * 3; i += 3) { var a = Math.abs(pos[i]), b = Math.abs(pos[i + 1]); if (a > hx) hx = a; if (b > hy) hy = b; }
    return [hx, hy];
  };
  // 구름: 데이터가 오기 전의 임시 모양(테마 색의 둥근 구름)
  PT.cloud = function (N, dark) {
    var r = PT.rng(77), pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    var pal = (dark ? ["#ffd6dc", "#cfd8ff", "#ffffff"] : ["#ff9ec0", "#9ccbff", "#b9a8ff", "#8fdcb8"]).map(PT.hex);
    for (var i = 0; i < N; i++) {
      var a = r() * 6.2832, u = r() * 2 - 1, w = Math.sqrt(1 - u * u), q = 0.75 * Math.cbrt(r()), c = pal[(r() * pal.length) | 0];
      pos[i * 3] = Math.cos(a) * w * q; pos[i * 3 + 1] = u * q; pos[i * 3 + 2] = Math.sin(a) * w * q;
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
    }
    return { pos: pos, col: col, hx: 0.8, hy: 0.8, name: "cloud" };
  };
})();
