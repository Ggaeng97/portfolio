// 테마 두 벌 + 위쪽 오른편 바꾸기 단추(11-21 사용자: "칠판테마는 별로" → 옛 우파 파스텔처럼 단계마다 다른 쨍한 파스텔,
// "다크테마도 나빴다고 생각 안 해 · 테마를 변경할 수 있게 상단에 버튼").
//  · 파스텔(기본): 들머리 · 지도 · 마무리는 흰색, 단계(요약 + 펼친 구역 전부)는 단계마다 다른 쨍한 파스텔.
//    원래 검정이던 구역(crit-dark · 클리커 갤러리)도 파스텔에선 그 단계 색 — 11-21 사용자: "3번 내부에 블랙테마랑 섞여 있는 것도 이상해"(글 · 카드 색은 theme_pastel.css + darkfix.js).
//    옛 하늘색(#e9edf9)은 회색빛이 돌아 흰색과 구별이 약했다 → 모두 채도를 끝까지 올린 밝은 색(우파 분홍 #ffedf3 쪽)으로.
//    구역 색은 bgtween.js 가 스며들게 섞는다(옛 AIGEN 과 같은 전환). 단계마다의 강조색(번호 · 1·2·3 · 단추)은 css/theme_pastel.css.
//  · 다크: 3판처럼 검은 한 바탕 — 모든 구역을 같은 검정으로 둬서 색 전환(흐림)이 생기지 않는다. 밝은 펼친 구역은 검정 위 종이(css/theme_dark.css).
//  · 고른 테마는 브라우저가 기억(localStorage 'site-theme'). 첫 그림이 깜빡이지 않게 <head> 의 한 줄이 먼저 html[data-theme] 을 단다.
//  · bgtween.js 보다 먼저 불러 색을 먼저 정하고, 바꿀 때는 'tracks-reordered' 로 bgtween · heroback 이 색을 다시 읽게 한다.
//  · 구역은 칠하지 않는다(모두 data-bg-clear) — 색은 body 하나로만 바뀐다. 구역을 불투명하게 칠하면 뒤에 고정된 첫 화면 그림 ·
//    흐려지며 넘치는 앞 내용이 그 구역 윗선에서 칼로 자른 듯 끊긴다(11-21 사용자: "그림이 하단 잘리면서 블러 돼, 전 구간에서 이렇게 되면 안 돼").
(function () {
  var STAGE = { st1: "#d4ebff", st2: "#e4dcff", st3: "#cdf3df", stR: "#ffe0cb", st4: "#ffd9e7", st5: "#fff0ae", st7: "#e3f5c4" };   // 하늘 · 보라 · 민트 · 살구 · 우파 분홍 · 레몬 · 연두(07 일하는 순서)
  var HERO = "#e3f1ff", WHITE = "#ffffff", DARK = "#0b0c0f";
  var root = document.documentElement, body = document.body;
  var els = Array.prototype.slice.call(document.querySelectorAll("[data-bg]"));
  els.forEach(function (el) { el.setAttribute("data-bg-clear", ""); });
  var light = els.map(function (el) {
    var st = el.closest("article.st");
    return st && STAGE[st.id] ? STAGE[st.id] : WHITE;
  });
  var sw = document.createElement("div");
  sw.className = "theme-sw"; sw.setAttribute("role", "group"); sw.setAttribute("aria-label", "테마");
  sw.innerHTML = '<button type="button" data-t="pastel">파스텔</button><button type="button" data-t="dark">다크</button>';
  body.appendChild(sw);
  function apply(t, tell) {
    root.dataset.theme = t;
    els.forEach(function (el, i) { el.dataset.bg = t === "dark" ? DARK : light[i]; });
    body.dataset.bg0 = t === "dark" ? DARK : HERO;
    sw.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.t === t ? "true" : "false"); });
    try { localStorage.setItem("site-theme", t); } catch (e) {}
    if (tell) document.dispatchEvent(new CustomEvent("tracks-reordered"));
  }
  sw.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (b) switchTo(b.dataset.t);
  });
  apply(root.dataset.theme === "dark" ? "dark" : "pastel", true);   // 처음에도 알림 — 먼저 뜬 heroback 이 바뀐 색(밝기)을 다시 읽게
  // 바꿀 때: 화면 가운데에서 새 테마가 물결처럼 둥글게 퍼짐(11-21 사용자: "부드럽게, 가운데부터 파동이 커지는 느낌") — 브라우저의 화면 전환(View Transitions)으로
  // 바뀐 화면을 가운데 원부터 드러내고 가장자리는 부드럽게(css/marks.css theme-rip). 이 기능이 없거나 '움직임 줄이기'면 바로 바뀜.
  function switchTo(t) {
    if (t === root.dataset.theme) return;
    if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) { apply(t, true); return; }
    root.style.setProperty("--ripple-r", Math.ceil(Math.hypot(innerWidth, innerHeight) / 2 + 140) + "px");
    document.startViewTransition(function () { apply(t, true); });
  }
  window.SiteTheme = { set: switchTo, get: function () { return root.dataset.theme; } };   // 첫 카드(entry.js)가 씀
})();
