// 4장 앱: 잔소리 사다리 1·2·3 을 누르면 옆 폰 화면이 그 단계 화면으로(사용자 11-14 "123은 눌렀을 때 그 화면을 볼 수 있게").
// 폰 위 [인트로 화면] 단추 = 처음 녹화(우파 소개)로 돌아가 처음부터 재생. 영상은 폰이 화면에 보일 때만 재생.
(function () {
  var box = document.querySelector(".app-phone");
  if (!box) return;
  var scr = box.querySelectorAll(".ph-s"), caps = box.querySelectorAll("figcaption [data-s]");
  var btn = box.querySelector(".ph-intro"), items = document.querySelectorAll(".ladder li[data-s]");
  var cur = "0", seen = false;
  function playCur() {
    scr.forEach(function (el) {
      if (el.tagName !== "VIDEO") return;
      if (el.dataset.s === cur && seen) { var p = el.play(); if (p && p.catch) p.catch(function () {}); } else el.pause();
    });
  }
  function show(k) {
    cur = k;
    scr.forEach(function (el) {
      var on = el.dataset.s === k;
      el.classList.toggle("on", on);
      if (on && el.tagName === "VIDEO") { el.preload = "auto"; try { el.currentTime = 0; } catch (e) {} }
    });
    caps.forEach(function (c) { c.hidden = c.dataset.s !== k; });
    items.forEach(function (li) { li.classList.toggle("on", li.dataset.s === k); li.setAttribute("aria-pressed", li.dataset.s === k ? "true" : "false"); });
    if (btn) btn.classList.toggle("on", k === "0");
    playCur();
    // 한 줄 화면(휴대폰)에선 폰이 사다리 위에 있어 안 보일 수 있음 → 폰이 보이게 올려 줌
    var r = box.getBoundingClientRect();
    if (k !== "0" && (r.bottom < 80 || r.top > innerHeight - 80)) box.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  items.forEach(function (li) {
    li.tabIndex = 0; li.setAttribute("role", "button"); li.setAttribute("aria-pressed", "false");
    li.addEventListener("click", function () { show(cur === li.dataset.s ? "0" : li.dataset.s); });   // 켜진 단계를 다시 누르면 처음 녹화로(인트로 단추를 뺀 대신, 사용자 11-15)
    li.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(cur === li.dataset.s ? "0" : li.dataset.s); } });
  });
  if (btn) btn.addEventListener("click", function () { show("0"); });
  scr.forEach(function (el) { if (el.tagName === "VIDEO") el.muted = true; });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { seen = es[0].isIntersecting; playCur(); }, { threshold: 0.35 }).observe(box.querySelector(".ph-screen"));
  } else { seen = true; playCur(); }
})();
