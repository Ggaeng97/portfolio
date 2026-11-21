// 실제 작업물에서 뽑은 데이터(pt/data/*.js)로 움직이는 모양 — 장면이 프레임마다 live(t, pr, hold) 를 부른다(t 초 · pr 그 그림의 스크롤 진행 0~1 ·
// hold 다른 그림으로 넘어가는 한가운데). 모두 {pos, col, live} — live 가 pos(· col)를 그 자리에서 고쳐 쓴다. 색을 고치면 rev 를 올려 장면에 알린다.
//  · 조립(클리커): 벌어져 있던 부품이 스크롤하는 만큼 제자리로 모여 맞물린다
//  · 고리(하늘섬 우체국 홀): 탑 위의 금빛 고리들이 저마다 다른 빠르기로 돈다
//  · 표정(우파 얼굴): 네 표정이 차례로 — 눈 · 입에 모였던 입자가 퍼져 나가고 새 눈 · 입으로 모여든다
(function () {
  var PT = window.PT = window.PT || {};
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ez(v) { v = cl(v); return v * v * (3 - 2 * v); }

  // 조립: 벌린 자리(pos_open) → 조립된 자리(pos)를 스크롤 진행으로 섞는다. 벌린 자리가 없으면 그대로.
  PT.assembly = function (d, N) {
    var open = d.sets.pos_open, shut = d.pos, pos = new Float32Array(open || shut), last = -1;
    function live(t, pr) {
      if (!open) return;
      var a = ez(pr * 1.2); if (Math.abs(a - last) < 0.002) return; last = a;
      for (var i = 0; i < N * 3; i++) pos[i] = open[i] + (shut[i] - open[i]) * a;
    }
    return { pos: pos, col: d.col, live: live, open: !!open };
  };

  // 하늘섬 우체국 홀: 그림은 그대로 두고, 탑 위의 고리(샹들리에 고리 · 혼천의 고리 여섯 · 가운데 별)만 세로축으로 저마다 다른 빠르기로 돈다
  // (이 홀의 얼굴이라 — 사용자 11-21 "저 원형 고리 오브젝트가 아이덴티티야"). 고리 입자는 모델의 진짜 자리(묶음 가운데에서의 벡터)를
  // 갖고 있어서, 돌린 뒤 데이터를 만들 때와 같은 카메라 식으로 입자 공간에 놓는다(_tools/pt/build_skypost_rings.py 의 world_to_particle 과 같은 식).
  // 도는 양 = 시간(느리게) + 스크롤 진행 pr(크게) → 가만히 있어도 살아 있고, 스크롤하면 그만큼 더 돈다.
  // 홀의 색을 테마에 맞게: 선(가장자리 점)이 그림을 이끌고 면(고른 점)은 물러나며, 고리는 금빛으로 가장 또렷하다.
  //  밝은 바탕 = 연필 선처럼 가장자리를 진하게 · 흰 대리석 면은 옅게 / 어두운 바탕 = 가장자리는 밝게 · 면은 어둑하게. 색 있는 것(남색 · 나무 · 금)은 제 색.
  function tone(src, tag, N, dark) {
    var out = new Float32Array(src.length), GOLD = [0.95, 0.68, 0.2];
    for (var n = 0; n < N; n++) {
      var q = n * 3, r = src[q], g = src[q + 1], b = src[q + 2], grp = Math.round(tag[q] * 255), edge = tag[q + 1] > 0.5, lt;
      if (grp) { var m = dark ? (grp === 8 ? 0.25 : 0.5) : (grp === 8 ? 0.6 : 0.78); r += (GOLD[0] - r) * m; g += (GOLD[1] - g) * m; b += (GOLD[2] - b) * m; }   // 고리는 금빛으로(밝은 바탕에선 더 짙게)
      var l = 0.2126 * r + 0.7152 * g + 0.0722 * b + 1e-4, mx = Math.max(r, g, b), sat = Math.min(1, (mx - Math.min(r, g, b)) / (mx + 1e-4) * 2.2);
      if (dark) lt = grp ? Math.max(l, 0.62) : edge ? l : l * 0.5;
      else if (grp) lt = grp === 8 ? 0.62 : 0.46 + 0.1 * l;
      else if (edge) lt = (0.14 + 0.3 * l) * (1 - sat) + Math.min(l, 0.36) * sat;
      else lt = (0.62 + 0.3 * l) * (1 - sat) + Math.min(l, 0.5) * sat;
      var k = lt / l, bo = dark || grp ? 1 : 1 + 0.3 * sat;                     // 밝은 바탕: 색 있는 것은 조금 더 쨍하게
      r = lt + (r * k - lt) * bo; g = lt + (g * k - lt) * bo; b = lt + (b * k - lt) * bo;
      if (!dark && !grp && edge) { var ti = 0.6 * (1 - sat), sl = lt / 0.39; r += (0.32 * sl - r) * ti; g += (0.38 * sl - g) * ti; b += (0.62 * sl - b) * ti; }   // 색 없는 선은 남색 잉크 빛으로
      out[q] = Math.min(1, Math.max(0, r)); out[q + 1] = Math.min(1, Math.max(0, g)); out[q + 2] = Math.min(1, Math.max(0, b));
    }
    return out;
  }
  PT.orrery = function (d, N, dark) {
    var o = d.meta.orrery, vec = d.sets.pos_ring, tag = d.sets.col_grp;
    if (!o || !vec || !tag) return { pos: d.pos, col: d.col };
    var col = tone(d.col, tag, N, dark);
    var pos = new Float32Array(d.pos), G = o.groups, R = o.R, E = o.eye, idx = [], grp = [], n, k;
    for (n = 0; n < N; n++) { k = Math.round(tag[n * 3] * 255); if (k > 0 && k <= G.length) { idx.push(n); grp.push(k - 1); } }
    var cs = new Float32Array(G.length), sn = new Float32Array(G.length);
    function live(t, pr, hold, rest) {                                       // rest = 실물로 바뀐 정도 — 그만큼 고리가 렌더 그림의 자세(돌림 0)로 돌아간다
      var ph = t * 0.2 + pr * 2.6, i, q, c, an;
      for (k = 0; k < G.length; k++) { an = G[k].w * ph; an = (an - 6.2832 * Math.round(an / 6.2832)) * (1 - (rest || 0)); cs[k] = Math.cos(an); sn[k] = Math.sin(an); }
      for (i = 0; i < idx.length; i++) {
        q = idx[i] * 3; k = grp[i]; c = G[k].c;
        var dx = vec[q] * o.unit, dy = vec[q + 1] * o.unit;
        var wx = c[0] + dx * cs[k] - dy * sn[k] - E[0], wy = c[1] + dx * sn[k] + dy * cs[k] - E[1], wz = c[2] + vec[q + 2] * o.unit - E[2];
        var dep = -(R[6] * wx + R[7] * wy + R[8] * wz), z = 1 / o.persp - 1 / (o.a + o.b / dep);
        if (z > o.zn) z = o.zn + o.soft * Math.tanh((z - o.zn) / o.soft); else if (z < o.zf) z = o.zf - o.soft * Math.tanh((o.zf - z) / o.soft);
        var kk = (1 - o.persp * z) * o.scale, dt = dep * o.tan;
        pos[q] = ((R[0] * wx + R[1] * wy + R[2] * wz) / dt - o.off[0]) * kk; pos[q + 1] = ((R[3] * wx + R[4] * wy + R[5] * wz) / dt - o.off[1]) * kk; pos[q + 2] = z;
      }
    }
    return { pos: pos, col: col, live: live, rings: idx.length, cs: cs, sn: sn };   // cs · sn = 고리 묶음마다의 돌림(실시간 3D 고리가 같은 각으로 돈다)
  };

  // 표정: 한 표정에 HOLD 초 머물고 MOVE 초에 걸쳐 다음 표정으로. 데이터는 표정마다 자리 · 색이 따로다(_tools/pt/build_face.py · face_flow.py):
  //  눈 · 입의 어두운 면을 채우던 입자가 다음 표정에서 남으면 얼굴 넓게 퍼지고, 모자라면 둘레에서 모여든다.
  //  (11-21 사용자: "표정이 바뀔 때 가운데 몰린 눈 입자였던 핑크색이 퍼져야 한다" — 자리는 두고 색만 바꾸면 큰 눈 자리가 진한 얼룩 = 팬더 눈으로 남는다.)
  //  입자마다 떠나는 때가 조금씩 다르고 길이 살짝 휜다. 색은 가는 길 한가운데에서 바뀐다.
  var HOLD = 1.5, MOVE = 1.0;
  PT.looks = function (d, N) {
    var L = [{ pos: d.pos, col: d.col }], k, i;
    for (k = 1; k < 8 && d.sets["col_" + k]; k++) L.push({ pos: d.sets["pos_" + k] || d.pos, col: d.sets["col_" + k] });
    var pos = new Float32Array(d.pos), col = new Float32Array(d.col), r = PT.rng(41), dl = new Float32Array(N), bend = new Float32Array(N);
    for (i = 0; i < N; i++) { dl[i] = r(); bend[i] = (r() - 0.5) * 0.5; }
    // to · mix = 다음 표정과 넘어간 정도(실물 층이 그림을 겹치는 데 씀)
    var S = { pos: pos, col: col, k: 0, to: 1 % L.length, mix: 0, rev: 0, looks: L.length }, at = -1, t0 = 0, moving = false, A = 0, B = 0, plans = {};
    function plan(a, b) {                                                       // 이 바뀜에서 자리나 색이 달라지는 입자 번호
      var key = a + ">" + b, m = plans[key]; if (m) return m;
      var pa = L[a].pos, pb = L[b].pos, ca = L[a].col, cb = L[b].col, out = [];
      for (var n = 0, q = 0; n < N; n++, q += 3)
        if (pa[q] !== pb[q] || pa[q + 1] !== pb[q + 1] || ca[q] !== cb[q] || ca[q + 1] !== cb[q + 1] || ca[q + 2] !== cb[q + 2]) out.push(n);
      return (plans[key] = new Int32Array(out));
    }
    S.live = function (t, pr, hold) {
      if (L.length < 2) return;
      if (at < 0) at = t;
      if (!moving) {
        if (hold || t - at < HOLD) return;                                       // 다른 그림으로 넘어가는 한가운데에선 새로 바꾸지 않는다
        moving = true; t0 = t; A = S.k; B = S.to = (S.k + 1) % L.length;
      }
      var q = (t - t0) / MOVE, pa = L[A].pos, pb = L[B].pos, ca = L[A].col, cb = L[B].col;
      S.rev++; S.mix = Math.min(1, q);
      if (q >= 1) { pos.set(pb); col.set(cb); S.k = B; S.to = (B + 1) % L.length; S.mix = 0; moving = false; at = t; return; }
      for (var m = plan(A, B), n = 0; n < m.length; n++) {
        var j = m[n], p = j * 3, e = ez(q * 1.6 - dl[j] * 0.6), dx = pb[p] - pa[p], dy = pb[p + 1] - pa[p + 1], w = Math.sin(e * 3.1416) * bend[j], c = e < 0.5 ? ca : cb;
        pos[p] = pa[p] + dx * e - dy * w; pos[p + 1] = pa[p + 1] + dy * e + dx * w; pos[p + 2] = pa[p + 2] + (pb[p + 2] - pa[p + 2]) * e;
        col[p] = c[p]; col[p + 1] = c[p + 1]; col[p + 2] = c[p + 2];
      }
    };
    return S;
  };
})();
