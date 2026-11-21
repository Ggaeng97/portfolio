// 한 무대에서 끊김 없이 이어지는 장면(.theatre = #hook). 휠을 내리는 만큼:
//  ⓪ 흐린 영상(.bd-blur, 화면에 고정된 바탕)이 화면 전체에 깔리고 제목(.op-title)만 → 제목이 사라지며 가운데 둥근 액자로 성당이 떠오름
//  ① 액자 속에서 같은 카메라로 찍은 성당 렌더 56장이 '처음 → 지금'으로 넘어간다(설명은 액자 아래).
//  ①' 끝 문구와 함께 액자가 화면 가득 커지고 블러가 걷혀 검은 전체 화면이 된다.
//  ② 성당 마지막 그림이 제단 쪽으로 확대되며 위로 올라가고, 같은 자리에서 어둠 속 제단 탁자가 같이 커지며 겹쳐 바뀐다(크로스 디졸브).
//  ③ 그 지점을 지나면 탁자 전체 → 앞판 무늬 80장이 저절로 한 번에 재생된다(스크롤로 한 장씩 넘기지 않음). 다 내리면 본문이 올라온다.
//  화면은 스크롤 위치를 부드럽게 따라간다(휠 한 칸에 툭툭 끊기지 않게).
// 탁자 그림: 가로 화면은 img/table/w###(1440×810), 세로 화면(휴대폰)은 img/table/t###(720×1280). 바탕은 페이지색이라 contain 으로 이음매 없음.
(function () {
  var sec = document.querySelector(".theatre");
  if (!sec) return;
  var D = sec.dataset, N = parseInt(D.count, 10);
  var ALTAR = { y: 0.79, w: 0.09 };                       // 성당 마지막 그림 속 제단 탁자: 세로 자리·폭(그림 대비)
  var SETS = { wide: { src: D.wide, fw: 1440, fh: 810, y: 0.53, w: 0.66 },   // 탁자 첫 장 속 탁자: 가운데 높이·폭
               tall: { src: D.tall, fw: 720, fh: 1280, y: 0.51, w: 0.89 } };
  var PH = { open: [0.04, 0.08], f1: [0.09, 0.45], end: [0.45, 0.52], grow: [0.45, 0.505], mix: [0.52, 0.66], head2: 0.65, zoom: 0.70 };   // 확대 시작 뒤 30 %는 무대가 고정된 채 머무는 구간   // 단계 자리(무대 길이 대비)
  var hookNames = D.frames.split(",").map(function (n) { return "img/flip/" + n + ".jpg"; });
  var l1 = sec.querySelector(".l1"), l2 = sec.querySelector(".l2");
  var bd = document.querySelector(".bd-blur"), blur = bd ? bd.querySelector("video") : null, title = sec.querySelector(".op-title");
  var fly = window.TheatreFly; if (fly) fly.init(l1, sec.querySelector(".op-tag"));   // 첫 설명 구간: D자 벽 보러 갔다 둘러보며 돌아옴(theatre_fly.js)
  var heads = sec.querySelectorAll(".op-head"), end = sec.querySelector(".op-end"), hint = sec.querySelector(".op-hint");
  var caps1 = sec.querySelectorAll(".op-cap.s1"), caps2 = sec.querySelectorAll(".op-cap.s2");
  var rails = sec.querySelectorAll(".op-rail");
  var stage = sec.querySelector(".op-stage"), fshade = sec.querySelector(".op-fshade");   // 액자 안 설명 · 그 밑 그늘
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function span(p, r) { return clamp((p - r[0]) / (r[1] - r[0])); }
  function ease(x) { return x * x * (3 - 2 * x); }
  function pad(k) { return String(k).padStart(3, "0"); }
  function ok(im) { return im && im.complete && im.naturalWidth > 0; }

  // 막대 위 점(설명이 바뀌는 자리)
  var dd = window.TheatreRails(PH, rails, caps1, caps2), dots1 = dd[0], dots2 = dd[1];   // 막대 점(누르면 이동 — theatre_rails.js)
  var CAT = Array.prototype.map.call(caps1, function (c) { return [parseFloat(c.dataset.at), parseInt(c.dataset.f || "0", 10)]; }).concat([[1, hookNames.length - 1]]);
  function frameFor(q) {
    if (q <= CAT[0][0]) return CAT[0][1];
    for (var i = 0; i < CAT.length - 1; i++) {
      if (q < CAT[i + 1][0]) { var u = clamp(((q - CAT[i][0]) / (CAT[i + 1][0] - CAT[i][0]) - 0.5) / 0.5); return Math.round(CAT[i][1] + (CAT[i + 1][1] - CAT[i][1]) * ease(u)); }
    }
    return CAT[CAT.length - 1][1];
  }

  // 그림 미리 불러 두기(무대가 화면 두 장 거리로 다가올 때)
  var set = null, hookCache = null, tableCache = {};
  function pick() {
    var s = window.innerWidth / window.innerHeight < 0.8 ? SETS.tall : SETS.wide;
    if (s !== set) { set = s; last2 = -1; if (hookCache) load2(); }
  }
  function load2() {
    if (!tableCache[set.src]) tableCache[set.src] = Array.apply(null, { length: N }).map(function (_, k) { var im = new Image(); im.src = set.src + pad(k) + ".jpg"; return im; });
  }
  new IntersectionObserver(function (es, io) {
    if (!es[0].isIntersecting) return;
    hookCache = hookNames.map(function (n) { var im = new Image(); im.src = n; return im; });
    if (fly) fly.load();
    load2(); io.disconnect(); req();
  }, { rootMargin: "200% 0px" }).observe(sec);

  // 크기 맞추기: 성당 그림 속 제단과 탁자 그림 속 탁자가 같은 자리·같은 크기에서 만나게
  var g = {};
  function geom() {
    var W = window.innerWidth, H = window.innerHeight;
    var c1 = Math.max(W / 1000, H / 555), h1 = c1 * 555;            // 성당 그림: 화면을 덮게(cover)
    var c2 = Math.min(W / set.fw, H / set.fh), h2 = c2 * set.fh;    // 탁자 그림: 다 보이게(contain)
    g.ay = (H - h1) / 2 + ALTAR.y * h1;
    g.ty = (H - h2) / 2 + set.y * h2;
    g.k = (c1 * 1000 * ALTAR.w) / (c2 * set.fw * set.w);           // 탁자 그림을 이만큼 줄이면 성당 속 제단 크기
    // 처음(가장 작은) 액자: 아래 자막 위 공간의 가운데에, 자막과 겹치지 않게(사용자 11-14: 아래로 쏠려 보임 · 시작점이 글자에 겹치지 않게).
    // 크기는 0.78(세로 화면 0.88)까지 — 너무 작은 데서 키우면 과함(사용자 11-13). 자막 자리는 실제 배치에서 잰다.
    var capTop = H;
    stage.querySelectorAll(".op-head:not(.top), .op-cap.s1").forEach(function (c) { if (c.offsetHeight) capTop = Math.min(capTop, c.offsetTop); });
    var gap = Math.max(20, H * 0.03), room = capTop - gap;
    g.H = H; g.fs = Math.min(set === SETS.tall ? 0.88 : 0.78, (room - gap) / H); g.fy = room / 2 / H;
    // 처음(가장 작은) 액자의 아래끝 자리 — 자막 그늘 높이에 씀(hook.css)
    stage.style.setProperty("--fb0", (H * (1 - g.fs) / 2 - (g.fy - 0.5) * H).toFixed(1) + "px");
  }

  var last1 = -1, last2 = -1;
  var hold = window.TheatreHold, TITLE_OUT = hold ? hold.OUT : 0.045;   // 제목에서 한 번 멈춤(theatre_hold.js)
  // 스크롤 위치(목표)를 화면이 부드럽게 따라간다(휠 한 칸에 툭툭 끊기지 않게). 멀리 건너뛰면 바로 맞춤.
  // 탁자 확대(③)는 스크롤로 한 장씩 넘기지 않고, 지점을 지나면 ZOOM_SEC 동안 저절로 한 번에 재생(올리면 거꾸로).
  var ZOOM_SEC = 2.6, TAU = 0.16, zh = window.TheatreZoomHold;   // 확대는 탁자 설명마다 절반씩 걸림(theatre_zhold.js)
  if (zh) zh.setHalf(ZOOM_SEC * 500);
  var pT = 0, ps = 0, zt = 0, lastT = 0, running = false;
  // 액자 크기(0 = 처음 크기, 1 = 화면 가득): 스크롤이 아니라 날아가기 영상 재생 시간으로 커져 재생이 끝날 때 꽉 참(사용자 11-13).
  // 영상을 건너뛰고 지나갔으면(막대·메뉴 이동) 그 뒤로는 꽉 찬 채, 위로 올라가 다시 볼 때는 처음 크기로 부드럽게 돌아감
  var gCur = 0, gGoal = 0, flyA1 = 1, fastNow = false;
  function target() {
    var r = sec.getBoundingClientRect(), range = r.height - window.innerHeight;
    pT = range > 0 ? clamp(-r.top / range) : 0;
    // 머리 줄은 무대가 화면 절반 넘게 걷힌 뒤에야 다시 보임(위로 빠르게 올릴 때 무대 위에 먼저 툭 나타나 깜빡이지 않게 — 사용자 11-14)
    document.body.classList.toggle("in-opening", r.top <= window.innerHeight * 0.5 && r.bottom > window.innerHeight * 0.35);
    if (hold && range > 0) pT = hold.check(pT, r.top + window.scrollY, range);
    // 첫 설명 구간(D자 벽 보러 가기): 내려오며 들어오거나 지나쳐도 그 구간에서 재생, 끝날 때까지 스크롤 멈춤(theatre_fly.js)
    if (fly && hookCache && range > 0) {
      // 첫 설명(처음)이 뜬 채 한 번 머문 뒤 시작 — 들어서자마자 날아가 버려 첫 장면이 안 보였음(사용자 11-13). 구간 45 % 지점에서 시작
      var span = PH.f1[1] - PH.f1[0], c0 = PH.f1[0] + span * parseFloat(caps1[0].dataset.at), a1 = PH.f1[0] + span * parseFloat(caps1[1].dataset.at);
      var a0 = c0 + (a1 - c0) * 0.45; flyA1 = a1;
      pT = fly.check(pT, a0, a1, r.top + window.scrollY, range, function () { last1 = -1; req(); });
    }
    if (zh && range > 0) pT = zh.check(pT, r.top + window.scrollY, range, zt);
  }
  function tick(now) {
    var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016; lastT = now;
    ps = Math.abs(pT - ps) > 0.2 ? pT : ps + (pT - ps) * (1 - Math.exp(-dt / TAU));
    var zGoal = zh ? zh.goal() : ps >= PH.zoom ? 1 : 0;
    zt = zGoal > zt ? Math.min(zGoal, zt + dt / ZOOM_SEC) : Math.max(zGoal, zt - dt / (ZOOM_SEC * 0.6));   // 목표에서 멈춤(중간 목표 0.5 를 넘나들며 떨지 않게)
    var flying = fly && fly.active();
    gGoal = Math.max(fly ? ease(fly.progress()) : 0, ps >= flyA1 ? 1 : 0, ease(span(ps, PH.grow)));
    gCur = flying ? gGoal : gCur + (gGoal - gCur) * (1 - Math.exp(-dt / 0.35));
    fastNow = Math.abs(pT - ps) > 0.02 && !flying;   // 빠르게 지나가는 중
    render(ps, smooth(zt));
    if (Math.abs(pT - ps) > 0.0004 || zt !== zGoal || flying || Math.abs(gGoal - gCur) > 0.001) requestAnimationFrame(tick);
    else { running = false; lastT = 0; }
  }
  function smooth(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function render(p, z) {
    if (hookCache) {
      // 설명마다 그 변화가 실제로 보이는 장(data-f): 구간 앞 절반은 그 장에 머물고, 뒤 절반에 다음 설명의 장으로 넘어감(대사와 장면 맞춤)
      var k1 = frameFor(span(p, PH.f1));
      if (!(fly && fly.active()) && k1 !== last1 && ok(hookCache[k1])) { last1 = k1; l1.src = hookCache[k1].src; }   // 다 불러온 그림만(빈 틈에 깜빡이지 않게)
      var k2 = Math.round(z * (N - 1)), tc = tableCache[set.src];
      if (k2 !== last2 && tc && ok(tc[k2])) { last2 = k2; l2.src = tc[k2].src; }
    }
    // ② 겹쳐 바뀌기: 성당은 제단을 중심으로 커지며 위로, 탁자는 같은 자리에서 같은 비율로 커지며 제자리로
    var m = ease(span(p, PH.mix));
    var s1 = 1 + (1 / g.k - 1) * m, s2 = s1 * g.k, ya = g.ay - (g.ay - g.ty) * m;
    // ⓪·① 액자: 떠오를 때(e) 살짝 커지며 나타나고, 끝 문구 때(f) 화면 가득 커짐. 블러는 그동안 걷힘
    var e = ease(span(p, PH.open)), f = ease(span(p, PH.grow));
    if (m) {
      l1.style.transformOrigin = "50% " + g.ay.toFixed(1) + "px";
      l1.style.transform = "translateY(" + (ya - g.ay).toFixed(1) + "px) scale(" + s1.toFixed(4) + ")";
      l1.style.borderRadius = "";
    } else if (f < 1) {
      var gp = gCur;   // 날아가기 영상이 재생되는 동안 커져 끝날 때 화면 가득(tick 의 gCur)
      var sc = (g.fs + (1 - g.fs) * gp) * (0.94 + 0.06 * e), dy = (g.fy - 0.5) * g.H * (1 - gp) + (1 - e) * 26;
      // 설명을 액자 안 왼쪽 아래에 넣기 위한 액자 자리(px)
      var W = window.innerWidth;
      stage.style.setProperty("--fl", (W * (1 - sc) / 2).toFixed(1) + "px"); stage.style.setProperty("--fw", (W * sc).toFixed(1) + "px");
      stage.style.setProperty("--fb", (g.H * (1 - sc) / 2 - dy).toFixed(1) + "px"); stage.style.setProperty("--fh", (g.H * sc).toFixed(1) + "px");
      l1.style.transformOrigin = "50% 50%";
      l1.style.transform = "translateY(" + dy.toFixed(1) + "px) scale(" + sc.toFixed(4) + ")";
      l1.style.borderRadius = (20 * (1 - gp) / sc).toFixed(1) + "px";
    } else { l1.style.transform = ""; l1.style.borderRadius = ""; }
    l1.style.opacity = ((1 - clamp((m - 0.12) / 0.6)) * e).toFixed(3);
    // 흐린 바탕: 무대 위끝이 화면 55 %→15 % 로 올라오는 동안(앞 장 글이 사라진 뒤) 번져 나오고, 액자가 커질 때(f) 걷힘
    if (bd) {
      var tp = sec.getBoundingClientRect().top, bo = sec.offsetHeight ? ease(clamp((g.H * 0.55 - tp) / (g.H * 0.4))) * (1 - f) : 0;   // 접혀 숨었으면 흐린 바탕도 숨김   // 앞 장 글이 사라진 뒤(55 %→15 %) 번져 나옴
      bd.style.opacity = bo.toFixed(3);
      if (bo < 0.01 && !blur.paused) blur.pause();
      else if (bo >= 0.01 && blur.paused) { var pp = blur.play(); if (pp && pp.catch) pp.catch(function () {}); }
    }
    l1.style.filter = m ? "brightness(" + (1 - 0.55 * m).toFixed(3) + ")" : "";
    l2.style.transformOrigin = "50% " + g.ty.toFixed(1) + "px";
    l2.style.transform = m < 1 ? "translateY(" + (ya - g.ty).toFixed(1) + "px) scale(" + s2.toFixed(4) + ")" : "";
    l2.style.opacity = clamp((m - 0.04) / 0.55).toFixed(3);
    // 겹쳐 바뀌는 동안엔 탁자 그림의 가장자리를 지워 네모 상자가 안 보이게(탁자만 떠오름). 다 바뀌면 지움 해제
    var mk = m > 0 && m < 1 ? "radial-gradient(50% 50% at 50% " + g.ty.toFixed(0) + "px, #000 68%, transparent 100%)" : "";
    l2.style.webkitMaskImage = mk; l2.style.maskImage = mk;

    // 글: 앞 장면 설명 → 끝 문구(겹쳐 바뀔 때 위로 사라짐) → 탁자 제목 → (확대가 재생되며) 탁자 설명
    var q1 = span(p, PH.f1), cur1 = -1, cur2 = -1;
    caps1.forEach(function (cp, j) { if (q1 >= parseFloat(cp.dataset.at)) cur1 = j; });
    if (z > 0.02) caps2.forEach(function (cp, j) { if (z >= parseFloat(cp.dataset.at)) cur2 = j; });
    // 빠르게 지나가는 동안엔 글을 새로 켜지 않는다(지나치는 설명이 잠깐씩 떴다 사라져 깜빡임 — 사용자 11-14). 멈추면 그 자리 글이 뜸
    function on(el, c) { el.classList.toggle("in", c && (!fastNow || el.classList.contains("in"))); }
    caps1.forEach(function (cp, j) { on(cp, j === cur1 && p >= PH.f1[0] + 0.012 && p < PH.end[0]); });
    if (fshade) fshade.classList.toggle("in", cur1 >= 0 && p >= PH.f1[0] + 0.012 && p < PH.end[0]);
    caps2.forEach(function (cp, j) { on(cp, j === cur2); });
    dots1.forEach(function (d, j) { d.classList.toggle("past", j <= cur1); });
    dots2.forEach(function (d, j) { d.classList.toggle("past", j <= cur2); });
    on(title, p < TITLE_OUT); title.classList.toggle("out", p >= TITLE_OUT);
    on(heads[0], p >= 0.04 && p < PH.f1[0] + 0.012); heads[0].classList.toggle("out", p >= PH.f1[0] + 0.012);
    on(heads[1], p >= PH.head2 && cur2 < 0); heads[1].classList.toggle("out", cur2 >= 0);
    on(end, p >= PH.end[0] && p < PH.mix[0] + 0.02); end.classList.toggle("out", p >= PH.mix[0] + 0.02);
    hint.classList.toggle("gone", p > TITLE_OUT - 0.01);
    rails[0].querySelector("i").style.height = (q1 * 100).toFixed(2) + "%";
    rails[1].querySelector("i").style.height = (z * 100).toFixed(2) + "%";
    rails[0].classList.toggle("off", p >= PH.mix[0]);
    rails[1].classList.toggle("off", p < PH.mix[1]);
  }
  function req() { target(); if (!running) { running = true; requestAnimationFrame(tick); } }
  function resize() { pick(); geom(); req(); }
  window.addEventListener("scroll", req, { passive: true });
  window.addEventListener("resize", resize);
  document.addEventListener("tracks-reordered", req);
  pick(); geom(); sec.classList.add("ready"); target(); ps = pT; render(ps, 0);

  // 자동 재생(autoscene.js · theatre_auto.js)이 쓰는 정보: 날아가기 영상 · 탁자 확대가 도는 동안은 기다림
  window.TheatreApi = { sec: sec, PH: PH, caps1: caps1, zAT: zh ? zh.AT : [PH.zoom],
    busy: function () { return (fly && fly.active()) || Math.abs(zt - (zh ? zh.goal() : ps >= PH.zoom ? 1 : 0)) > 0.003; },
    fast: function () { if (fly && fly.active()) fly.stop(); } };
  var skip = sec.querySelector(".op-skip");
  if (skip) skip.onclick = function () {
    if (fly) fly.stop();
    window.scrollTo({ top: sec.getBoundingClientRect().bottom + window.scrollY - 10, behavior: "smooth" });
  };
})();
