// 들머리의 입자 장면: 문장마다 입자 그림이 좌우로 번갈아 놓이고(.fh-fig — 문서에 붙어 글과 함께 흘러감), 스크롤하는 만큼 입자가
// 화면을 가로질러 다음 그림으로 흘러간다(시간이 아니라 스크롤이 움직임을 끈다 — 멈추면 그 상태로 멈춤).
//   첫 화면의 우파(흐려지는 그림과 같은 자리) → 파형 → 하늘섬 우체국 홀(탑 위 고리가 돈다) → 표정 → 클리커 부품 → 짚기 → 규칙 → 다시 우파.
//   11-21 사용자: "오른쪽만 변화가 있고 계속 그림만 바뀌니 단조로워 — 화면 고정은 말고 지금처럼 아래로 흘러가는 구조로 하되 역동적이었으면".
//  · 그림 j 와 j+1 사이: 다음 그림이 화면 아래에서 기준선(화면 60 % 높이)까지 올라오는 동안 입자가 하나둘 떠나(입자마다 때가 다름)
//    소용돌이치며 흩어졌다가 다음 자리에 모인다. 그림은 화면을 지나가는 동안 스크롤에 따라 조금씩 돌아 입체로 보인다.
//  · 켜지는 조건: WebGL 이 되고 '움직임 줄이기'가 아닐 때만 #why 에 .pt-on(아니면 예전의 촘촘한 들머리 그대로). sound.js 보다 먼저 불러야 한다.
(function () {
  var why = document.getElementById("why"), hero = document.getElementById("top");
  var beats = why ? Array.prototype.slice.call(why.querySelectorAll(".fh-beat[data-pt]")) : [];
  if (!beats.length || !hero || !window.PT || !PT.createEngine || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var W = innerWidth, H = innerHeight, small = W < 900;
  var MAX = small ? 9000 : (navigator.hardwareConcurrency || 8) <= 4 ? 14000 : 26000;   // 데이터는 섞여 있어 앞에서 몇 개만 써도 모양이 고르다
  var cv = document.createElement("canvas"); cv.className = "pt-cv"; cv.setAttribute("aria-hidden", "true");
  var eng = PT.createEngine(cv, MAX); if (!eng) return;
  document.body.appendChild(cv); why.classList.add("pt-on");
  var figs = beats.map(function (b, i) {                                // 문장마다 입자 그림 자리 — 좌우 번갈아
    var f = document.createElement("div"); f.className = "fh-fig"; f.setAttribute("aria-hidden", "true");
    b.appendChild(f); if (i % 2) b.classList.add("flip");
    f.L = undefined; return f;                                         // 모델링 그림이면 실시간 3D 층(real3d.js — 모듈이라 늦게 와서 프레임에서 만든다)
  });
  var src = (document.currentScript && document.currentScript.src) || "", V = src.indexOf("?") > 0 ? src.slice(src.indexOf("?")) : "";
  var root = document.documentElement, dark = root.dataset.theme === "dark";
  var seed = eng.seeds(), tgt = eng.targets(), ctg = eng.colors(), cnt = MAX;
  eng.theme(dark);

  // 입자마다: 떠나는 때(dly) · 흩어지는 방향(sx, sy, sz) · 먼지인지(amb — 모양에 안 끼고 화면 전체에 떠다니는 3.5 %)
  var dly = new Float32Array(MAX), sx = new Float32Array(MAX), sy = new Float32Array(MAX), sz = new Float32Array(MAX);
  var amb = new Uint8Array(MAX), ax = new Float32Array(MAX), ay = new Float32Array(MAX), aph = new Float32Array(MAX);
  for (var i = 0; i < MAX; i++) {
    var a = seed[i * 4] * 6.2832, rr = 0.1 + 0.3 * Math.sqrt(seed[i * 4 + 1]);
    dly[i] = seed[i * 4 + 2] * 0.4; sx[i] = Math.cos(a) * rr; sy[i] = Math.sin(a) * rr; sz[i] = (seed[i * 4 + 3] - 0.5) * 0.3;
    amb[i] = seed[i * 4 + 3] < 0.035 ? 1 : 0; ax[i] = (seed[i * 4 + 1] - 0.5) * 2.1; ay[i] = (seed[i * 4 + 2] - 0.5) * 1.1; aph[i] = seed[i * 4] * 40;
  }
  function dust() {                                                     // 먼지 색: 파스텔 = 단계 색의 색종이 가루, 다크 = 흰 · 분홍 별가루
    var pal = (dark ? ["#ffffff", "#ffd6dc", "#cfd8ff", "#ffe9b0"] : ["#ff9ec0", "#8fc4ff", "#b9a8ff", "#86dab2", "#ffc94d", "#ffab85"]).map(PT.hex);
    for (var i = 0; i < MAX; i++) if (amb[i]) { var c = pal[(seed[i * 4] * 97 | 0) % pal.length]; ctg[i * 3] = c[0]; ctg[i * 3 + 1] = c[1]; ctg[i * 3 + 2] = c[2]; }
  }

  // 모양: 이름 → {pos, col, hx, hy, turn(스크롤에 따라 도는 폭), psize(점 크기 배율), live(t, pr)}
  var SH = {}, cloud = null, box = [806, 228, 1497, 973];
  var TURN = { uppa: 0.55, face: 0.5, clicker: 0.9, skypost: 0.3, wave: 0.2, mark: 0.16, rules: 0.16 };
  var PSIZE = small ? { skypost: 0.8, wave: 0.85, mark: 0.85, rules: 0.85 } : {};   // 좁은 화면은 입자가 9000 개라 점을 키워 면을 채우되(아래 eng.size), 선으로 읽는 그림은 덜 키운다
  var INK = { uppa: 0.6, face: 0.6, clicker: 0.12 }, CAP = {};                // 밝은 테마에서 색을 진하게 · 밝기에 뚜껑(engine.js). 하늘섬은 모양이 스스로 테마 색을 칠하고,
                                                                              // 클리커는 데이터에 이미 빛(그늘)이 들어 있어 거의 그대로(진하게 하면 흰 조랑말이 잿빛이 된다)
  var DZ = { skypost: 0.2 };                                                  // 깊이에 따른 점 크기 차(1 = 보통). 깊은 공간 그림은 먼 쪽(탑 · 고리)이 주인공이라 약하게
  var CALM = { skypost: 0.12 };                                               // 가만히 있을 때의 일렁임(1 = 보통). 건축의 선은 일렁이면 흐려진다
  function shape(name) {
    var s = SH[name], d; if (s) return s;
    if (name === "wave" || name === "mark" || name === "rules") s = PT[name](MAX, dark);
    else if ((d = PT.data(name, MAX))) {
      s = name === "clicker" ? PT.assembly(d, MAX) : name === "face" ? PT.looks(d, MAX) : name === "skypost" ? PT.orrery(d, MAX, dark) : { pos: d.pos, col: d.col };
      var e = PT.extent(d.sets.pos_open || d.pos, MAX); s.hx = e[0]; s.hy = e[1];
      if (name === "uppa" && d.meta.box) box = d.meta.box;
    } else return cloud || (cloud = Object.assign(PT.cloud(MAX, dark), { turn: 0.4, psize: 1, ink: 0, cap: 0, dz: 1, calm: 1 }));   // 데이터가 오는 중 — 올 때까지 구름
    s.turn = TURN[name] || 0.3; s.psize = PSIZE[name] || 1; s.ink = INK[name] || 0; s.cap = CAP[name] || 0; s.dz = DZ[name] || 1; s.calm = CALM[name] || 1; s.name = name;
    return (SH[name] = s);
  }
  ["uppa", "skypost", "face", "clicker"].forEach(function (n, k) {             // 우파는 바로, 나머지는 페이지가 뜬 뒤
    var go = function () { PT.load(n, V).then(function (ok) { if (ok) { colKey = ""; wake(); } }); };
    if (!k || document.readyState === "complete") go(); else addEventListener("load", function () { setTimeout(go, 200); });
  });

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(v) { return v * v * (3 - 2 * v); }
  var F = [], REF = 0.6, mx = 0.5, my = 0.5, colKey = "";
  var PR = { clicker: [0.86, 0.3] };                                  // 스크롤 진행이 0 → 1 이 되는 그림 높이(화면 높이 비 · 길이). 클리커는 일찍 맞물려야 실물로 바뀔 틈이 난다
  function place(j, name, cx, cy, sc, dir, t, L) {                    // 그림 j 의 화면 자리 → 화면 좌표(가운데 0 · 높이 1) + 스크롤에 따른 돌림
    var s = shape(name), f = F[j] || (F[j] = {}), off = (cy - H * 0.45) / H, w = PR[name] || [0.62, 0.3];
    f.name = name; f.s = s; f.y = cy; f.ox = (cx - W / 2) / H; f.oy = -(cy - H / 2) / H; f.sc = sc / H; f.L = L;
    f.yaw = dir ? dir * s.turn * off * 1.6 + Math.sin(t * 0.5 + j) * 0.05 + (L ? 0 : (mx - 0.5) * 0.22) : 0;   // 실물 층이 있는 그림은 화면 전체 마우스 대신 올린 마우스로 돈다
    f.pit = dir ? off * 0.14 - (L ? 0 : (my - 0.5) * 0.1) : 0; f.pf = 0.22;
    f.pr = clamp((H * w[0] - cy) / (H * w[1]));                        // 이 그림의 스크롤 진행(모양이 스스로 변하는 데 씀)
  }
  var active = -2, last = 0, raf = 0, shown = false, slow = 0;
  function frame(now) {
    raf = 0;
    var t = now / 1000, dt = last ? Math.min(0.05, t - last) : 0.016, sY = window.scrollY, k, i;
    last = t;
    // 1) 그림 자리: 0번 = 첫 화면의 우파(heroback.js 의 확대와 같은 식으로 흐려지는 그림과 겹침), 1번부터 = 문장 옆 자리
    var c = Math.max(W / 1920, H / 1080), z = 1.08 + 0.5 * ease(clamp(sY / (H * 0.8)));
    var lx = (W - 1920 * c) / 2 + (box[0] + box[2]) / 2 * c, ly = (H - 1080 * c) / 2 + (box[1] + box[3]) / 2 * c;
    place(0, "uppa", W * 0.5 + (lx - W * 0.5) * z, H * 0.45 + (ly - H * 0.45) * z, (box[3] - box[1]) * c * z / 2, 0, t);
    for (k = -1, i = 0; i < beats.length; i++) {
      if (figs[i].L === undefined && PT.realLayer) figs[i].L = PT.realLayer(figs[i], beats[i].dataset.pt) || null;
      var r = figs[i].getBoundingClientRect(), s = shape(beats[i].dataset.pt), b = beats[i].getBoundingClientRect();
      place(i + 1, beats[i].dataset.pt, r.left + r.width / 2, r.top + r.height / 2, Math.min(r.width / 2 / s.hx, r.height / 2 / s.hy), i % 2 ? -1 : 1, t, figs[i].L);
      F[i + 1].rect = r;
      if (b.top + b.height / 2 < H * 0.62) k = i;
    }
    if (k !== active) { active = k; beats.forEach(function (bt, n) { bt.classList.toggle("on", n === k); }); }
    // 2) 지금 섞는 두 그림과 섞임 u(0 = 앞 그림, 1 = 뒤 그림) — 뒤 그림이 기준선까지 올라오는 길의 뒤쪽 절반에서 바뀐다
    var j = 0, u = 0;
    for (i = 1; i < F.length; i++) if (F[i].y <= H * REF) j = i;
    var A = F[j], B = F[Math.min(j + 1, F.length - 1)];
    if (B !== A) u = j ? ease(clamp(((H * REF - A.y) / (B.y - A.y) - 0.5) / 0.45))
      : ease(clamp((H * (small ? 1.05 : 0.84) - B.y) / (H * (small ? 0.44 : 0.23))));   // 첫 화면의 우파는 화면에 붙어 있어 제 자리가 안 움직인다 → 다음 그림이 올라온 높이로 잰다
                                                                                    // (앞의 식을 그대로 쓰면 u 가 0 에 머물다 한 번에 넘어가 흩어지는 장면이 없었다. 좁은 화면은 글이 그림 위라 더 일찍 푼다)
    var SA = A.s, SB = B.s, oMax = 0, over = false;
    for (i = 1; i < F.length; i++) {                                    // 실물 층: 입자가 모이면서 모델이 되고(뒤 그림 u 0.5 → 0.95), 퍼지기 시작하면 모델이 입자로(앞 그림 u 0 → 0.45)
      var f = F[i], L = f.L; if (!L) continue;
      var tg = i === j ? (B !== A ? 1 - ease(clamp(u / 0.45)) : 1) : i === j + 1 ? ease(clamp((u - 0.5) / 0.45)) : 0;
      if (L.after === "assembled") tg *= ease(clamp((f.pr * 1.2 - 0.85) / 0.15));   // 클리커는 조립이 끝나 갈 때 모델로
      L.update(dt, f.rect, f.sc * H, tg, f.s);
      f.yaw = L.yaw; f.pit = 0; f.pf = L.flat ? 0 : 0.22;               // 입자도 모델과 늘 같은 각도(마우스로 돈 각) · 모델 그림과 같은 투영 → 바뀌는 순간에도 각도가 맞는다
      oMax = Math.max(oMax, L.o); over = over || L.inside;
    }
    var hold = u > 0.15 && u < 0.85;                                    // 다른 그림으로 넘어가는 한가운데(표정은 이때 새로 바꾸지 않는다)
    if (SA.live) SA.live(t, A.pr, hold, 0); if (u > 0 && SB.live) SB.live(t, B.pr, hold, 0);   // 고리는 모델이 되어도 계속 돈다(3D 고리도 같은 각)
    var D = u < 0.5 ? SA : SB;                                          // 지금 주인공인 모양
    // 3) 입자마다 목표 자리
    var PA = SA.pos, PB = SB.pos, CA = SA.col, CB = SB.col, mid = u > 0 && u < 1;
    var ca = Math.cos(A.yaw), sa = Math.sin(A.yaw), cpa = Math.cos(A.pit), spa = Math.sin(A.pit);
    var cb = Math.cos(B.yaw), sb = Math.sin(B.yaw), cpb = Math.cos(B.pit), spb = Math.sin(B.pit);
    var th = (u * 2.6 - 1.3) * (j % 2 ? -1 : 1), cth = Math.cos(th), sth = Math.sin(th), SC = small ? 0.62 : 1, par = sY / H;
    for (var p = 0, n = 0; n < cnt; n++, p += 3) {
      if (amb[n]) {                                                     // 먼지: 화면 전체에서 천천히 떠다니고, 스크롤하면 살짝 따라 움직인다
        tgt[p] = ax[n] * W / H / 2 + Math.sin(t * 0.13 + aph[n]) * 0.02; tgt[p + 1] = ay[n] + Math.sin(par * 1.1 + aph[n]) * 0.1 + Math.sin(t * 0.09 + aph[n] * 1.7) * 0.02; tgt[p + 2] = sz[n];
        continue;
      }
      var x = PA[p], y = PA[p + 1], zz = PA[p + 2];
      var x1 = x * ca + zz * sa, z1 = -x * sa + zz * ca, y1 = y * cpa - z1 * spa, z2 = y * spa + z1 * cpa, kp = 1 / (1 - z2 * A.pf);
      var X = A.ox + x1 * kp * A.sc, Y = A.oy + y1 * kp * A.sc, Z = z2 * A.sc;
      if (u > 0) {
        var e = (u - dly[n]) / 0.6; e = e <= 0 ? 0 : e >= 1 ? 1 : e * e * (3 - 2 * e);
        if (e > 0) {
          x = PB[p]; y = PB[p + 1]; zz = PB[p + 2];
          x1 = x * cb + zz * sb; z1 = -x * sb + zz * cb; y1 = y * cpb - z1 * spb; z2 = y * spb + z1 * cpb; kp = 1 / (1 - z2 * B.pf);
          var bm = 4 * e * (1 - e) * SC;                               // 가는 길 한가운데에서 가장 넓게 흩어짐(소용돌이)
          X += (B.ox + x1 * kp * B.sc - X) * e + (sx[n] * cth - sy[n] * sth) * bm;
          Y += (B.oy + y1 * kp * B.sc - Y) * e + (sx[n] * sth + sy[n] * cth) * bm;
          Z += (z2 * B.sc - Z) * e + sz[n] * bm;
        }
        if (mid) { var C = e < 0.5 ? CA : CB; ctg[p] = C[p]; ctg[p + 1] = C[p + 1]; ctg[p + 2] = C[p + 2]; }
      }
      tgt[p] = X; tgt[p + 1] = Y; tgt[p + 2] = Z;
    }
    var key = mid ? "~" : D.name + ":" + (D.rev || 0);                 // 모양이 색을 고치면(rev) 다시 칠한다
    if (key !== colKey) { colKey = key; if (!mid) { ctg.set(D.col.subarray(0, MAX * 3)); } dust(); }
    // 4) 보이는 정도 · 점 크기 · 난류
    var alpha = ease(clamp((sY - H * 0.18) / (H * 0.3))) * ease(clamp((why.getBoundingClientRect().bottom - H * 0.05) / (H * 0.35)));
    eng.alpha(alpha * (1 - 0.92 * oMax)); eng.pointer(PT.mouse ? (PT.mouse.x - W / 2) / H : 0, PT.mouse ? -(PT.mouse.y - H / 2) / H : 0, !small && !over && PT.mouse && PT.mouse.on); eng.size((small ? 2.6 : 2.3) * (SA.psize + (SB.psize - SA.psize) * u)); eng.ink(SA.ink + (SB.ink - SA.ink) * u, SA.cap + (SB.cap - SA.cap) * u); eng.depth(SA.dz + (SB.dz - SA.dz) * u); eng.turbulence(0.3 * (SA.calm + (SB.calm - SA.calm) * u) + 7 * 4 * u * (1 - u));
    if (alpha > 0.003) { if (!shown) { eng.snap(); shown = true; } eng.frame(t, dt); } else if (shown) { eng.clear(); shown = false; }
    // 느린 기기: 프레임이 계속 늘어지면 입자를 줄인다
    slow = dt > 0.03 ? slow + 1 : Math.max(0, slow - 1);
    if (slow > 45 && cnt > 6000) { cnt = eng.count(cnt * 0.75); slow = 0; }
    st.pair = A.name + (B !== A ? " → " + B.name : ""); st.u = u; st.alpha = alpha;
    if (alpha > 0.003 && near() && !document.hidden) raf = requestAnimationFrame(frame); else last = 0;   // 안 보일 땐 멈췄다가 스크롤하면 다시
  }
  var st = { pair: "", u: 0, alpha: 0 };
  function near() { var r = why.getBoundingClientRect(); return r.bottom > -H * 0.3 && r.top < H * 2.2; }
  function wake() { if (!raf && near() && !document.hidden) raf = requestAnimationFrame(frame); }
  function fitView() { W = innerWidth; H = innerHeight; small = W < 900; eng.resize(W, H, Math.min(2, window.devicePixelRatio || 1)); wake(); }
  addEventListener("scroll", wake, { passive: true });
  addEventListener("resize", fitView);
  document.addEventListener("visibilitychange", wake);
  addEventListener("mousemove", function (e) { mx = e.clientX / W; my = e.clientY / H; }, { passive: true });   // 커서 밀어내기는 프레임에서(모델링 그림 위에선 끔)
  new MutationObserver(function () {                                   // 테마가 바뀌면: 그 자리에서 만든 모양 · 먼지의 색을 다시
    var d = root.dataset.theme === "dark"; if (d === dark) return;
    dark = d; eng.theme(dark); delete SH.wave; delete SH.mark; delete SH.rules; delete SH.skypost; cloud = null; colKey = ""; wake();
  }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  window.PTScene = { state: function () { return { pair: st.pair, u: +st.u.toFixed(3), alpha: +st.alpha.toFixed(2), n: cnt, max: MAX, running: !!raf, data: Object.keys(window.PT_DATA || {}), lost: eng.lost(), real: figs.filter(function (g) { return g.L; }).map(function (g) { return [g.L.o.toFixed(2), g.L.deg.toFixed(1)]; }) }; } };   // 점검용
  fitView();
})();
