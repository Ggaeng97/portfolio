// 바탕색이 구역마다 스며들며 바뀜(피클처럼): 화면 전체가 한 색이고, 다음 구역([data-bg])의 윗선이 화면 아래에서 올라오는 만큼
// 지금 색 → 다음 구역 색으로 섞인다. 같은 색을 body 와 모든 [data-bg] 구역에 칠해서 구역 사이에 경계선이 생기지 않는다.
// 색이 바뀌는 경계(테마 전환)는 모두 같은 방식: ① 앞 내용이 먼저 사라지고 ② 새 장면은 흐림 → 선명,
// 투명 → 불투명, 윗가장자리를 부드럽게 지운 채로 떠올라 화면 맨 위에 닿을 때 다 선명해진다. 색이 같은 경계는 그냥 이어진다.
// 마지막 구역은 둥근 모서리로 끝나고 그 아래는 흰 바탕(피클의 어두운 판). --lum(화면 밝기)을 body 에 넘긴다.
(function () {
  // 접혀 숨은 구역(성장 이야기의 '자세히 보기' 안)은 빼고 모은다 — 숨은 구역은 위치가 0 이라 색을 망가뜨림(story.js)
  function collect() { return Array.prototype.slice.call(document.querySelectorAll("[data-bg]")).filter(function (e) { return e.getClientRects().length > 0; }); }
  var els = collect();
  if (!els.length) return;
  // 장 순서가 바뀌면(pickpop.js 'tracks-reordered') 문서 순서대로 다시 모은다(색 섞는 순서 = 화면 순서)
  document.addEventListener("tracks-reordered", function () {
    els = collect();
    START = document.body.dataset.bg0 ? hex(document.body.dataset.bg0) : WHITE;   // 첫 화면 · 훅을 걷어 내면(hookgate.js) 시작색도 바뀜
    cols = els.map(function (e) { return hex(e.dataset.bg); });
    last = ""; update();
  });
  function hex(c) { c = c.replace("#", ""); return [0, 2, 4].map(function (i) { return parseInt(c.substr(i, 2), 16); }); }
  var WHITE = [255, 255, 255];
  // 첫 구역 앞의 바탕색(body data-bg0): 첫 화면(어두운 성당) 색에서 시작해야 첫 장이 어두우면 흰색을 거치지 않는다(사용자 11-14)
  var START = document.body.dataset.bg0 ? hex(document.body.dataset.bg0) : WHITE;
  var cols = els.map(function (e) { return hex(e.dataset.bg); });
  var last = "";
  function mix(a, b, p) { return a.map(function (v, i) { return v + (b[i] - v) * p; }); }
  // 밝기가 뒤집히는 전환(쨍한 파스텔 ↔ 검정)은 섞는 동안 색을 빼서 회색을 지나게 — 그냥 섞으면 레몬 + 검정 = 탁한 국방색(회사판 11-21 파스텔 테마).
  // 가운데(p 0.5)에서 같은 밝기의 회색, 양 끝은 원래 색. 흰색 ↔ 검정(옛 AIGEN)은 원래 색이 없어 그대로다.
  function fade(a, b, p) { var c = mix(a, b, p), y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2], s = Math.abs(1 - 2 * p); return c.map(function (v) { return y + (v - y) * s; }); }
  // 같은 색(채널 차이 3 아래)만 같은 색으로 본다 — 색이 조금이라도 바뀌면 모두 클리커 장처럼 흐림 전환(앞 내용 흐려지며 사라짐 → 새 내용 흐림에서 풀림)으로 통일
  // (사용자 11-15 저녁 "이걸로 통일" — 예전 11-14 '거의 같은 색은 전환 안 걸기(채널 차 24)'를 바꿈: 펼친 구역 옅은 색 ↔ 흰 단계 경계도 흐림 전환)
  function same(a, b) { return Math.abs(a[0] - b[0]) < 3 && Math.abs(a[1] - b[1]) < 3 && Math.abs(a[2] - b[2]) < 3; }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function dark(c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255 < 0.5; }   // 어두운 바탕인가(밝기 뒤집힘 판정)
  function ease(v) { return v * v * (3 - 2 * v); }
  // 구역의 내용 = 구역의 직접 자식 전부(무대·글·그림 상자 등 무엇이든). 색이 바뀌는 전환 때 나가는 쪽은 통째로 흐려지며 사라지고,
  // 들어오는 쪽은 흐림 → 선명으로 떠오른다. 구역마다 따로 지정하지 않으므로 새 구역이 생겨도 그대로 적용된다(사용자 11-14:
  // 넘길 때 그림 상자 가장자리 선이 남음 — 전환마다 따로 블러를 달지 말고 전환이면 전부 흐림으로 날릴 것).
  // 흐린 영상(.ch-blur)은 들어올 때만 — 나갈 때는 남겨 다음 장면을 품는다
  function parts(e, incoming) {
    return Array.prototype.filter.call(e.children, function (c) { return incoming || !c.matches(".ch-blur"); });
  }
  // 첫 구역 앞의 내용(앞 장 통째) — 장 순서가 바뀔 수 있어 매번 찾는다
  function before(e) { while (e && !e.previousElementSibling) e = e.parentElement; return e ? e.previousElementSibling : null; }
  var touched = [];
  function update() {
    var vh = window.innerHeight, col = START, prev = START, fx = new Map();
    function get(n) { if (!fx.has(n)) fx.set(n, { op: 1, blur: 0, mask: 0 }); return fx.get(n); }
    for (var k = 0; k < els.length; k++) {
      var top = els[k].getBoundingClientRect().top;
      // (사용자 11-15 저녁 "위아래로 흐리니 어지럽다 · 흐리는 범위가 길다 · 아래 글이 있을 것 같은데 없다가 생긴다") 전환은 짧게, 흐림은 나가는 쪽만:
      // · 바탕색 = 다음 구역 위끝이 화면 50 %→15 %(밝기가 뒤집히는 경계는 60 %→25 %)를 지나는 동안
      // · 나가는 쪽(경계 위, 이미 읽은 내용) = 위끝 42 %→20 %(뒤집히면 55 %→28 %) 동안 세게 흐려지며 사라짐
      // · 들어오는 쪽 = 같은 밝기(흰색 ↔ 옅은 파랑 · 분홍)면 처음부터 또렷이 보임(가림 · 흐림 없음). 밝기가 뒤집히면(어두운 훅 → 흰 장,
      //   흰 단계 → 어두운 클리커) 옛 바탕 위에 미리 보이지 않게 바탕색과 함께 나타나며 살짝 흐림에서 풀림 — 뒤로 같은 색이 이어지는 구역(조립 장면)도 함께
      var flip = dark(prev) !== dark(cols[k]);
      var p = flip ? clamp((vh * 0.6 - top) / (vh * 0.35)) : clamp((vh * 0.5 - top) / (vh * 0.35));
      if (p > 0) col = flip ? fade(col, cols[k], ease(p)) : mix(col, cols[k], ease(p));
      if (!same(prev, cols[k])) {
        var out = flip ? clamp((vh * 0.55 - top) / (vh * 0.27)) : clamp((vh * 0.42 - top) / (vh * 0.22));
        (k ? parts(els[k - 1], false) : [before(els[0])]).forEach(function (n) {
          if (!n) return; var f = get(n); f.op *= 1 - out; f.blur = Math.max(f.blur, Math.min(1, out * 1.5) * 32);
        });
        if (flip) {
          var vis = ease(clamp((p - 0.55) / 0.45));   // 바탕색이 절반 넘게 바뀐 뒤부터 — 그림 상자(밝은 바탕 그림 · 어두운 바탕 그림)가 옛 바탕 위에 미리 비치지 않게
          for (var j = k; j < els.length && vis < 1 && (j === k || same(cols[j], cols[k])); j++) {
            if (j > k && els[j].getBoundingClientRect().top > vh) break;   // 아직 화면 아래면 그만
            parts(els[j], true).forEach(function (n) { var f = get(n); f.op *= vis; if (!n.matches(".ch-blur")) f.blur = Math.max(f.blur, (1 - vis) * 12); });
          }
        }
      }
      prev = cols[k];
    }
    touched.forEach(function (n) { if (!fx.has(n)) { n.style.opacity = ""; n.style.filter = ""; n.style.webkitMaskImage = n.style.maskImage = ""; } });
    touched = [];
    fx.forEach(function (f, n) {
      touched.push(n);
      n.style.opacity = f.op >= 0.999 ? "" : f.op.toFixed(3);
      n.style.filter = f.blur > 0.3 && f.op > 0.001 ? "blur(" + f.blur.toFixed(1) + "px)" : "";
      var m = f.mask > 0.01 && f.op > 0.001 ? "linear-gradient(transparent, #000 " + (f.mask * 55).toFixed(1) + "%)" : "";
      n.style.webkitMaskImage = n.style.maskImage = m;
    });
    var css = "rgb(" + col.map(Math.round).join(",") + ")";
    // 마지막 구역(둥근 모서리로 끝남)의 아랫선이 화면에 들어오면 그 아래 바탕은 흰색 — 구역 색은 그대로라 모서리 밖으로 흰 바탕이 보임
    // 단, 마지막 구역이 칠하지 않는 구역(data-bg-clear — 예: 05 를 접어 둔 채 마지막이 된 흰 단계 머리)이면 그대로 섞인 색 —
    // 안 그러면 그 구역 아랫선이 보이는 순간 앞 구역 색(04 분홍)이 흰색으로 툭 바뀜(사용자 11-15 저녁)
    var lastEl = els[els.length - 1];
    var body = !lastEl.hasAttribute("data-bg-clear") && lastEl.getBoundingClientRect().bottom < vh ? "#fff" : css;
    if (css + body === last) return;
    last = css + body;
    document.body.style.background = body;
    // data-bg-clear: 칠하지 않음(뒤의 흐린 바탕이 비쳐 보이게) — 색은 body 로만
    els.forEach(function (e) { if (!e.hasAttribute("data-bg-clear")) e.style.background = css; });
    document.body.style.setProperty("--lum", ((0.2126 * col[0] + 0.7152 * col[1] + 0.0722 * col[2]) / 255).toFixed(3));
  }
  var queued = false;
  window.addEventListener("scroll", function () { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; update(); }); } }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
