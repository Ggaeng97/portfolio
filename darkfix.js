// 테마마다 어긋나는 색을 찾아 표시해 둔다 — 원래 디자인이 색을 박아 둔 곳(변수로 칠한 곳은 테마 파일이 한 번에 바꾼다).
//  ① 다크: 펼친 구역 · 앱 구역 안의 흰 상자 · 검정 글씨 → .dk-box · .dk-ink (11-21 사용자: "다크모드 일부 박스가 적용이 안 돼")
//  ② 파스텔: 원래 검정이던 구역(crit-dark · 클리커 갤러리)을 단계 색으로 바꿨으니, 그 위에 그대로 놓인 흰 글씨 · 흰 선 → .lt-ink · .lt-ink2 · .lt-line
//     (11-21 사용자: "3번 내부에 블랙테마랑 섞여 있는 것도 이상해"). 어두운 칩 · 단추 · 장면 위젯(.tg) · 그림 위의 흰 글씨는 그대로 둔다.
//  표시는 그 테마일 때만 효과가 있다(css/theme_dark.css · theme_pastel.css). 그림 · 영상은 건드리지 않는다. 열 때 한 번만 훑는다.
(function () {
  var SKIP = /^(IMG|VIDEO|CANVAS|SVG|PICTURE|SOURCE|PATH|G|USE|RECT|CIRCLE|LINE|POLYLINE|POLYGON|ELLIPSE|IFRAME|BR)$/i;
  function rgba(c) { var m = c.match(/[\d.]+/g); if (!m) return null; return { r: +m[0], g: +m[1], b: +m[2], a: m.length > 3 ? +m[3] : 1 }; }
  function lum(c) { return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255; }
  function dark(root) {                                               // ① 다크 색으로 계산했을 때 남는 흰 상자 · 검정 글씨
    var n = 0;
    root.querySelectorAll(".st-more *, #t-app *").forEach(function (el) {
      if (SKIP.test(el.tagName) || el.closest(".tg, .hgal, .crit-dark")) return;
      var cs = getComputedStyle(el), bg = rgba(cs.backgroundColor), fg = rgba(cs.color);
      if (bg && bg.a > 0.5 && lum(bg) > 0.82) { el.classList.add("dk-box"); n++; }
      if (fg && lum(fg) < 0.4 && el.childNodes.length) el.classList.add("dk-ink");
    });
    return n;
  }
  function light(root) {                                              // ② 파스텔 색으로 계산했을 때, 밝은 바탕 위에 남는 흰 글씨 · 흰 선
    var n = 0;
    root.querySelectorAll(".crit-dark, .hgal").forEach(function (zone) {
      zone.querySelectorAll("*").forEach(function (el) {
        if (SKIP.test(el.tagName) || el.closest(".tg")) return;
        var cs = getComputedStyle(el), fg = rgba(cs.color);
        // 이 글씨가 놓인 바탕: 가장 가까운 불투명한 상자(자기 포함). 어두운 상자(칩 · 단추 · 화면 그림 틀) 위면 흰 글씨가 맞다
        for (var p = el, on = null; p && p !== zone.parentNode; p = p.parentNode) {
          var b = rgba(getComputedStyle(p).backgroundColor);
          if (b && b.a > 0.5) { on = b; break; }
        }
        if (on && lum(on) < 0.5) return;
        if (fg && lum(fg) > 0.6 && el.childNodes.length) { el.classList.add(fg.a < 0.8 || lum(fg) < 0.86 ? "lt-ink2" : "lt-ink"); n++; }
        var bc = rgba(cs.borderTopColor), bw = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) + parseFloat(cs.borderLeftWidth);
        if (bw > 0 && bc && lum(bc) > 0.7 && bc.a > 0.02) el.classList.add("lt-line");
      });
    });
    return n;
  }
  function scan() {
    var root = document.documentElement, was = root.dataset.theme;
    var still = document.createElement("style"); still.textContent = "*,*::before,*::after{transition:none!important}";   // 잠깐 바꿨다 되돌릴 때 움직임이 생기지 않게
    document.head.appendChild(still);
    root.dataset.theme = "dark"; var a = dark(document);
    root.dataset.theme = "pastel"; var b = light(document);
    root.dataset.theme = was; getComputedStyle(document.body).color; still.remove();
    window.__darkfix = a; window.__lightfix = b;                       // 점검용: 표시한 개수
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan); else scan();
})();
