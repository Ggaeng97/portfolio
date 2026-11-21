// 첫 카드: 열면 우파가 "어떤 테마로 볼까요?" — 파스텔 / 다크를 고르는 그 클릭이 브라우저의 첫 손짓이 되어 음악이 함께 시작된다.
// (11-21 사용자: 참고 포트폴리오는 열자마자 소리가 남 → 확인해 보니 그 사이트도 첫 창의 '확인' 클릭으로 시작 → "우리도 확인 버튼을, 아니면 테마색 지정이나")
// 그 사람의 소개 카드(신분증 모양)는 따라 하지 않고, 우리는 고를 이유가 있는 테마 고르기로. 고를 때까지 바깥 스크롤은 막는다.
// 점검용 헤드리스 크롬(check_site)에서는 건너뜀 — 주소에 ?entry=1 을 붙이면 띄우고, ?noentry 면 언제나 건너뜀.
(function () {
  var q = location.search + location.hash;
  if (/noentry/.test(q) || (/HeadlessChrome/.test(navigator.userAgent) && !/entry=1/.test(q))) return;
  var root = document.documentElement, cur = root.dataset.theme === "dark" ? "dark" : "pastel", closed = false;
  var el = document.createElement("div");
  el.className = "entry"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "entryT");
  el.innerHTML = '<div class="en-card"><img class="en-uppa" src="img/u3d/uppa_peek.webp" alt="">' +
    '<p class="en-k">이경환 포트폴리오</p><h2 id="entryT">어떤 테마로 볼까요?</h2>' +
    '<div class="en-pick"><button type="button" data-t="pastel"><i class="sw pastel"></i><b>파스텔</b></button>' +
    '<button type="button" data-t="dark"><i class="sw dark"></i><b>다크</b></button></div></div>';
  document.body.appendChild(el);
  var prev = root.style.overflow; root.style.overflow = "hidden";
  el.querySelectorAll(".en-pick button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.t === cur ? "true" : "false"); });
  function done(t) {
    if (closed) return; closed = true;
    if (window.SiteTheme) window.SiteTheme.set(t);
    el.classList.remove("show"); root.style.overflow = prev;
    document.removeEventListener("keydown", key, true);
    setTimeout(function () { el.remove(); }, 480);
  }
  function key(e) {
    if (e.key !== "Enter" && e.key !== " " && e.key !== "Escape") return;
    e.preventDefault(); var f = document.activeElement; done(f && f.dataset && f.dataset.t ? f.dataset.t : cur);
  }
  el.addEventListener("click", function (e) { var b = e.target.closest("button[data-t]"); if (b) done(b.dataset.t); });
  document.addEventListener("keydown", key, true);
  el.addEventListener("wheel", function (e) { e.preventDefault(); }, { passive: false });
  el.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });
  requestAnimationFrame(function () { requestAnimationFrame(function () {
    el.classList.add("show"); var f = el.querySelector('button[data-t="' + cur + '"]'); if (f) f.focus({ preventScroll: true });
  }); });
})();
