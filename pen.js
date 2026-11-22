// 빨간 펜 '짚기' 장치 — 화면에 들어오면 움직이고, 나가면 멈춘다(붙잡거나 강제로 보게 하지 않는다)
//  1) 첫 화면: 완성 렌더 위 첨삭 묶음(동그라미 + 메모) 네 장(.hb-pen). 커서가 동그라미 가까이 오면 그 묶음이 통째로 떠오르고,
//     커서를 안 쓰는 동안(손가락 화면은 늘) 한 묶음씩 돌아가며 보인다. 내리기 시작하면 바로 사라진다.
//  2) 들머리 이야기 줄(.fh-line): 화면에 들어온 줄만 떠오른다.
//  3) 대표 영상 · 그림 위 손글씨 메모(.st-vis .pn): 화면에 들어오면 떠오르고 나가면 숨는다.
//  4) 카드: '원래' 그림(figure[data-ring])에 문제 자리 동그라미 + 짧은 메모, '고친 뒤' 그림 모서리에 ✓ — 처음 들어올 때 긋는다.
//  5) 왼쪽 줄(넓은 화면): 본문에 들어서면 보이고, 읽고 지나간 단계에 ✓.
(function () {
  var NS = "http://www.w3.org/2000/svg";
  function svgPath(cls, viewBox, d, keepRatio) {
    var svg = document.createElementNS(NS, "svg"); svg.setAttribute("class", cls); svg.setAttribute("viewBox", viewBox);
    if (!keepRatio) svg.setAttribute("preserveAspectRatio", "none");
    var p = document.createElementNS(NS, "path"); p.setAttribute("d", d); p.setAttribute("pathLength", "1");
    svg.appendChild(p); return svg;
  }
  function ringD(cx, cy, rx, ry) {          // 손으로 한 번 그은 듯한 동그라미(끝이 살짝 넘침)
    var d = "", n = 56, t0 = -2.3, span = 2 * Math.PI + 0.5;
    for (var i = 0; i <= n; i++) {
      var t = t0 + span * i / n, w = 1 + 0.045 * Math.sin(3 * t + 1.3) + 0.035 * (i / n);
      d += (i ? " L" : "M") + (cx + rx * w * Math.cos(t)).toFixed(2) + " " + (cy + ry * w * Math.sin(t)).toFixed(2);
    }
    return d;
  }
  var once = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.dispatchEvent(new Event("pen-in")); once.unobserve(e.target); } });
  }, { threshold: 0.7 }) : null;
  function onFirstView(el, fn) { if (once) { el.addEventListener("pen-in", fn); once.observe(el); } else fn(); }
  function toggleInView(sel, cls, thr) {
    var els = document.querySelectorAll(sel); if (!els.length) return;
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add(cls); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle(cls, e.isIntersecting); }); }, { threshold: thr });
    els.forEach(function (e) { io.observe(e); });
  }

  // 2) · 3) 화면에 들어오면 떠오름
  toggleInView(".fh-line", "in", 0.5);
  toggleInView(".st-vis", "in", 0.45);
  toggleInView(".wf", "in", 0.45);   // 일하는 순서 흐름 그림(들머리 다음 — 단계 그림 칸이 아니라 따로)

  // 4) 카드의 동그라미 · ✓
  document.querySelectorAll(".cs-pics figure[data-ring]").forEach(function (f) {
    var v = f.dataset.ring.split(",").map(Number);           // 가운데 x, y, 가로 · 세로 반지름(그림 % )
    var svg = svgPath("pen-ring", "0 0 100 100", ringD(v[0], v[1], v[2], v[3])); f.appendChild(svg);
    if (f.dataset.note) {
      var n = document.createElement("span"); n.className = "ring-note"; n.textContent = f.dataset.note;
      var below = v[1] + v[3] + 4 < 88;
      n.style.left = Math.max(4, Math.min(70, v[0] - 10)) + "%";
      n.style.top = (below ? v[1] + v[3] + 3 : Math.max(4, v[1] - v[3] - 12)) + "%";
      f.appendChild(n);
    }
    onFirstView(f, function () { svg.classList.add("drawn"); f.classList.add("ringed"); if (window.chalkSound) chalkSound("ring"); });
  });
  document.querySelectorAll(".cs-pics:is(.duo, .sq, .tallpair) > figure.b").forEach(function (f) {   // 겹친 짝(sq)에도 ✓ — 빠져 있었음(11-22)
    var svg = svgPath("pen-mark", "0 0 46 40", "M5 22 C 9 25, 13 29, 17 34 C 23 22, 31 12, 42 5", true); f.appendChild(svg);
    onFirstView(f, function () { svg.classList.add("drawn"); if (window.chalkSound) setTimeout(function () { chalkSound("tick"); }, 200); });
  });

  // 4-2) 카드 그림 사이 화살표: 딱딱한 글자(→) 대신 색연필로 그은 듯한 손그림 — 동그라미 · ✓ 와 같은 펜, 화면에 들어오면 긋는다
  //      (11-21 사용자: "화살표 디자인이 너무 딱딱해, 색연필 효과랑 너무 동떨어져"). 세로로 쌓인 배치의 90° 돌림(css)은 그대로 먹는다.
  var ARROWS = ["M4 16 C 13 12, 25 19, 39 15 M30 6 C 34 10, 39 13, 43 15 C 38 18, 34 21, 31 25",
                "M4 13 C 15 18, 26 11, 39 15 M31 5 C 35 9, 39 13, 43 15 C 39 17, 34 20, 30 24",
                "M5 15 C 14 15, 27 13, 39 15 M30 7 C 34 9, 39 13, 43 15 C 38 18, 35 20, 32 24"];
  document.querySelectorAll(".cs-pics .cs-arr").forEach(function (a, k) {
    a.textContent = ""; a.classList.add("hand");
    var svg = svgPath("pen-arrow", "0 0 48 30", ARROWS[k % ARROWS.length], true); a.appendChild(svg);
    onFirstView(a, function () { svg.classList.add("drawn"); });
  });

  // 5) 왼쪽 줄
  var rail = document.querySelector(".rail"), story = document.getElementById("story");
  function stamp() {
    if (!rail) return;
    document.body.classList.toggle("rail-on", !!(story && story.getBoundingClientRect().top < window.innerHeight * 0.6));
    rail.querySelectorAll("li a").forEach(function (a) {
      var s = document.querySelector(a.getAttribute("href")); if (!s) return;
      a.parentElement.classList.toggle("done", s.getBoundingClientRect().bottom < window.innerHeight * 0.4);
    });
  }
  window.addEventListener("scroll", stamp, { passive: true }); window.addEventListener("resize", stamp); stamp();

  // 1) 첫 화면 첨삭 묶음
  var back = document.querySelector(".hc-back"), zoom = back && back.querySelector(".hb-zoom");
  var pens = back ? Array.prototype.slice.call(back.querySelectorAll(".hb-pen")) : [];
  if (!pens.length) return;
  var IW = 1920, IH = 1080, R = 190;                                    // 그림 크기 · 동그라미 둘레 감지 반지름(그림 화소)
  var RINGS = [[1372, 318], [1150, 505], [1300, 872], [1290, 735]];     // 아가미(위쪽 잎) · 표정 · 꼬리(서브디비전) · 팔(_tools/hero_pen.py 와 같은 자리)
  // 넷이 한꺼번에 보이고, 커서를 묶음 가까이 얹으면 그 묶음만 또렷 · 나머지는 옅게 물러남. 내리면 사라짐.
  // (11-21 사용자: "동그라미를 하나씩 보여주기보다 한꺼번에, 마우스 얹는 글을 강조 — 얹은 것 빼고 자연스럽게 가리게". 그 전엔 2.4초마다 하나씩 돌았음)
  var cur = -1;
  function focus(i, quiet) { if (i === cur) return; cur = i; if (i >= 0 && !quiet && window.chalkSound) chalkSound("ring"); pens.forEach(function (p, n) { p.classList.toggle("dim", i >= 0 && n !== i); }); }
  function toImage(x, y) {                                              // 화면 좌표 → 그림 좌표(확대 50% 45% · 화면 꽉 채우기)
    var W = innerWidth, H = innerHeight, m = /scale\(([\d.]+)\)/.exec(zoom.style.transform || ""), s = m ? +m[1] : 1.08;
    var lx = W * 0.5 + (x - W * 0.5) / s, ly = H * 0.45 + (y - H * 0.45) / s, c = Math.max(W / IW, H / IH);
    return [(lx - (W - IW * c) / 2) / c, (ly - (H - IH * c) / 2) / c];
  }
  window.addEventListener("mousemove", function (e) {
    if (window.scrollY > 30) return;
    var p = toImage(e.clientX, e.clientY), best = -1, bd = R;
    RINGS.forEach(function (r, i) { var d = Math.hypot(p[0] - r[0], p[1] - r[1]); if (d < bd) { bd = d; best = i; } });
    focus(best);
  }, { passive: true });
  document.addEventListener("mouseleave", function () { focus(-1, true); });
  function vis() { var off = window.scrollY > 30; back.classList.toggle("pens-off", off); if (off) focus(-1, true); }
  window.addEventListener("scroll", vis, { passive: true }); vis();
  setTimeout(function () { back.classList.add("pens-reveal", "pens-on"); setTimeout(function () { back.classList.remove("pens-reveal"); }, 1500); }, 500);   // 처음엔 하나씩 이어서 떠오름
})();
