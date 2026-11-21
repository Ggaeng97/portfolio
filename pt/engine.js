// 입자 엔진(pt/scene.js 가 씀): 입자마다 자리 · 속도를 CPU 에서 스프링으로 '목표 자리'에 끌어당기고 WebGL 점으로 그린다.
//  · 좌표 = 화면 좌표(화면 가운데가 0, 화면 높이가 1, y 는 위). 장면이 프레임마다 모든 입자의 목표 자리를 화면 좌표로 써 넣는다
//    (모양의 자리 · 크기 · 돌림 · 원근 · 섞임은 장면이 계산). 목표가 스크롤에 따라 움직이면 입자는 0.1초쯤 늦게 따라와 흐르는 느낌이 난다.
//  · z 는 깊이(보는 사람 쪽이 +) — 점 크기와 진하기에만 쓴다.
//  · 어두운 테마 = 색을 밝게 + 덮는 힘을 조금 약하게(겹치면 은은히 빛남), 밝은 테마 = 보통 겹침 + 가장자리 살짝 진하게.
(function () {
  var VS = "attribute vec3 a_pos; attribute vec3 a_col; attribute vec4 a_seed;" +
    "uniform vec2 u_res; uniform float u_size, u_alpha, u_time, u_dz;" +
    "varying vec3 v_col; varying float v_a;" +
    "void main() {" +
    "  vec2 px = u_res * 0.5 + vec2(a_pos.x, -a_pos.y) * u_res.y;" +
    "  gl_Position = vec4(px.x / u_res.x * 2.0 - 1.0, 1.0 - px.y / u_res.y * 2.0, 0.0, 1.0);" +
    "  float d = clamp(a_pos.z * 2.4, -0.4, 0.55) * u_dz;" +                              // 가까운 점이 조금 크게(u_dz = 그 세기 — 깊은 공간 그림은 약하게)
    "  gl_PointSize = u_size * (1.0 + d) * (0.72 + a_seed.y * 0.62) * (0.88 + 0.12 * sin(u_time * 2.1 + a_seed.x * 40.0));" +
    "  v_col = a_col; v_a = u_alpha * (1.0 - 0.26 * u_dz * (1.0 - clamp(a_pos.z * 4.0 + 0.5, 0.0, 1.0)));" +   // 뒤쪽 점은 조금 옅게
    "}";
  var FS = "precision mediump float; varying vec3 v_col; varying float v_a; uniform float u_dark, u_ink, u_cap, u_soft;" +
    "void main() {" +
    "  float r = length(gl_PointCoord - 0.5) * 2.0, a = smoothstep(1.0, u_soft, r) * v_a;" +   // u_soft = 점의 속이 꽉 찬 비율(보통 화면은 점이 작아 더 꽉 차게)
    "  vec3 ink = mix(v_col, v_col * v_col, u_ink);" +                                   // 밝은 바탕: 옅은 색(돌 · 분홍)이 묻히지 않게 진하게(모양마다 정도가 다름)
    "  float l = dot(ink, vec3(0.2126, 0.7152, 0.0722));" +
    "  ink *= mix(1.0, min(l, 0.2 + 0.3 * l) / max(l, 0.001), u_cap);" +                 // 흰 돌처럼 아주 밝은 점은 흰 바탕에서 사라지므로 밝기에 뚜껑을 씌움(색조는 그대로)
    "  vec3 c = u_dark > 0.5 ? v_col * 1.28 + 0.02 : ink * (0.94 - 0.2 * smoothstep(0.45, 1.0, r));" +
    "  gl_FragColor = vec4(c * a, a * (u_dark > 0.5 ? 0.82 : 1.0));" +
    "}";

  window.PT = window.PT || {};
  // 그림판(canvas)과 입자 최대 개수 → 엔진. WebGL 을 못 쓰면 null.
  PT.createEngine = function (canvas, MAX) {
    var gl = null;
    try { gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "high-performance" }); } catch (e) {}
    if (!gl) return null;
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS), prog = gl.createProgram();
    if (!vs || !fs) return null;
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var pos = new Float32Array(MAX * 3), vel = new Float32Array(MAX * 3), tgt = new Float32Array(MAX * 3);
    var col = new Float32Array(MAX * 3), ctg = new Float32Array(MAX * 3), seed = new Float32Array(MAX * 4);
    var kk = new Float32Array(MAX), cc = new Float32Array(MAX);                 // 입자마다 스프링 세기 · 감쇠(한꺼번에 도착하지 않게 조금씩 다름)
    var x = 9301;                                                               // 고정 난수(다시 열어도 같은 흩어짐)
    function rnd() { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }
    for (var i = 0; i < MAX; i++) {
      for (var q = 0; q < 4; q++) seed[i * 4 + q] = rnd();
      kk[i] = 300 * (0.55 + 0.9 * seed[i * 4 + 2]); cc[i] = 1.7 * Math.sqrt(kk[i]);
    }
    function buf(data, usage, name, size) {
      var b = gl.createBuffer(), loc = gl.getAttribLocation(prog, name);
      gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, usage);
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      return b;
    }
    var bPos = buf(pos, gl.DYNAMIC_DRAW, "a_pos", 3), bCol = buf(col, gl.DYNAMIC_DRAW, "a_col", 3); buf(seed, gl.STATIC_DRAW, "a_seed", 4);
    var U = {}; ["u_res", "u_size", "u_alpha", "u_time", "u_dark", "u_ink", "u_cap", "u_dz", "u_soft"].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
    gl.enable(gl.BLEND); gl.disable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    var n = MAX, turb = 0.3, turbTo = 0.3, st = { alpha: 0, dark: 0, size: 2.2, ink: 0, cap: 0, dz: 1, w: 1, h: 1, dpr: 1 }, ptr = { x: 0, y: 0, on: false };

    // 난류의 sin 은 표(1024칸)에서 읽는다 — 입자마다 여섯 번이라 Math.sin 으로는 프레임 CPU 시간의 94 % 를 썼다(26000 입자 1.9 ms → 0.24 ms, 오차 0.006)
    var SN = new Float32Array(1024), SQ = 1024 / 6.283185307;
    for (i = 0; i < 1024; i++) SN[i] = Math.sin(i / SQ);
    function step(t, dt) {
      dt = Math.min(dt, 0.034); turb += (turbTo - turb) * Math.min(1, dt * 6);
      var kc = 1 - Math.exp(-dt * 6), px = ptr.x, py = ptr.y, pon = ptr.on, R2 = 0.0072;
      var ta = t * 0.9, tb = t * 0.7, tc = t * 1.1, td = t * 0.6, te = t * 0.8, tf = t * 0.5;
      for (var i = 0, j = 0, s = 0; i < n; i++, j += 3, s += 4) {
        var X = pos[j], Y = pos[j + 1], Z = pos[j + 2], k = kk[i], ph = seed[s] * 6.2832;
        // 목표로 끄는 힘 + 느린 난류(평소엔 아주 약한 숨결, 모양이 바뀌는 동안 장면이 키움)
        var ax = (tgt[j] - X) * k + (SN[((Y * 11.0 + ta + ph) * SQ) & 1023] + SN[((Z * 9.0 - tb + ph * 1.7) * SQ) & 1023]) * turb;
        var ay = (tgt[j + 1] - Y) * k + (SN[((Z * 10.0 + tc + ph * 2.3) * SQ) & 1023] + SN[((X * 9.5 + td + ph) * SQ) & 1023]) * turb;
        var az = (tgt[j + 2] - Z) * k + (SN[((X * 12.0 - te + ph * 1.3) * SQ) & 1023] + SN[((Y * 8.0 + tf + ph * 2.9) * SQ) & 1023]) * turb * 0.5;
        if (pon) {                                                              // 커서 가까이의 입자는 밀려났다가 돌아온다
          var dx = X - px, dy = Y - py, d2 = dx * dx + dy * dy;
          if (d2 < R2) { var f = 1 - d2 / R2; f = f * f * 9 * k / 300 / (Math.sqrt(d2) + 0.004); ax += dx * f; ay += dy * f; }
        }
        var damp = 1 / (1 + cc[i] * dt);                                         // 감쇠는 암시적으로(프레임이 늘어져도 튀지 않음)
        vel[j] = (vel[j] + ax * dt) * damp; vel[j + 1] = (vel[j + 1] + ay * dt) * damp; vel[j + 2] = (vel[j + 2] + az * dt) * damp;
        pos[j] = X + vel[j] * dt; pos[j + 1] = Y + vel[j + 1] * dt; pos[j + 2] = Z + vel[j + 2] * dt;
        col[j] += (ctg[j] - col[j]) * kc; col[j + 1] += (ctg[j + 1] - col[j + 1]) * kc; col[j + 2] += (ctg[j + 2] - col[j + 2]) * kc;
      }
    }
    function draw(t) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (st.alpha <= 0.003) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, bPos); gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos.subarray(0, n * 3));
      gl.bindBuffer(gl.ARRAY_BUFFER, bCol); gl.bufferSubData(gl.ARRAY_BUFFER, 0, col.subarray(0, n * 3));
      gl.uniform2f(U.u_res, st.w, st.h); gl.uniform1f(U.u_size, st.size * st.dpr); gl.uniform1f(U.u_alpha, st.alpha);
      gl.uniform1f(U.u_time, t); gl.uniform1f(U.u_dark, st.dark); gl.uniform1f(U.u_ink, st.ink); gl.uniform1f(U.u_cap, st.cap); gl.uniform1f(U.u_dz, st.dz); gl.uniform1f(U.u_soft, st.dpr >= 1.5 ? 0.3 : 0.62);
      gl.drawArrays(gl.POINTS, 0, n);
    }
    return {
      max: MAX,
      count: function (k) { n = Math.max(1, Math.min(MAX, k | 0)); return n; },
      targets: function () { return tgt; },                                     // 장면이 프레임마다 화면 좌표로 써 넣는다
      colors: function () { return ctg; },                                      // 목표 색(0~1) — 엔진이 부드럽게 따라감
      seeds: function () { return seed; },
      snap: function () { pos.set(tgt); col.set(ctg); for (var i = 0; i < vel.length; i++) vel[i] = 0; },
      turbulence: function (v) { turbTo = v; },
      alpha: function (a) { st.alpha = a; },
      theme: function (dark) { st.dark = dark ? 1 : 0; },
      size: function (px) { st.size = px; },
      ink: function (v, cap) { st.ink = v; st.cap = cap || 0; },
      depth: function (v) { st.dz = v; },
      pointer: function (x, y, on) { ptr.x = x; ptr.y = y; ptr.on = !!on; },
      resize: function (w, h, dpr) {
        st.dpr = dpr; st.w = Math.round(w * dpr); st.h = Math.round(h * dpr);
        if (canvas.width !== st.w || canvas.height !== st.h) { canvas.width = st.w; canvas.height = st.h; }
        gl.viewport(0, 0, st.w, st.h);
      },
      frame: function (t, dt) { step(t, dt); draw(t); },
      clear: function () { gl.clear(gl.COLOR_BUFFER_BIT); },
      lost: function () { return gl.isContextLost(); }
    };
  };
})();
