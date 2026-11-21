// 지나온 '자세히 보기' 저절로 접기(사용자 11-15 밤 "다 읽고 시야 밖, 안 보이는 곳에서 접히게 — 접혔는지 모르게, 화면이 튀면 안 됨").
// 펼친 과정의 아랫끝이 화면 위로 완전히 사라지면(다 읽고 지나감) 접는다 — ① 다시 올라오기 시작하는 순간(아직 화면 밖일 때) 바로,
// ② 아니면 잠깐(0.15초) 멈췄을 때. 접으면서 없어진 높이만큼 스크롤 자리를 같이 당겨(과정 바로 뒤 내용 하나를 기준으로 재서)
// 보이는 화면은 한 줄도 움직이지 않는다. 화면 밖에 있던 접기 막대는 소리 없이 제자리 알약으로.
// 터치 화면은 ①을 쓰지 않음(미끄러지는 중에 스크롤 자리를 바꾸면 관성이 멈출 수 있어서 — 멈춘 뒤에만).
// 화면을 꽉 붙잡은 장면(성당 · 조립 · 옆으로 넘기는 칸이 고정된 동안), 자동 재생 · 오프닝 잠금 중엔 접지 않고 그다음에.
(function () {
  var api = window.StoryAPI; if (!api) return;
  var lastY = window.scrollY, t = 0, queued = false;
  var coarse = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
  function holding() {
    if (document.documentElement.classList.contains("locked") || document.body.classList.contains("as-lock")) return true;
    if (window.AutoScene && window.AutoScene.on && window.AutoScene.on()) return true;
    var H = window.innerHeight;
    return Array.prototype.some.call(document.querySelectorAll(".theatre, .pin, .hgal"), function (s) {
      var r = s.getBoundingClientRect(); return r.height > 0 && r.top <= 1 && r.bottom >= H - 1;
    });
  }
  function anchorOf(p) {   // 과정 바로 뒤에 보이는 것(다리 문장 · 다음 단계)
    var a = p.more.nextElementSibling;
    while (a && !a.getClientRects().length) a = a.nextElementSibling;
    return a || p.st.nextElementSibling;
  }
  function foldPassed() {
    if (holding()) return;
    api.items.forEach(function (p) {
      if (p.more.hidden || p.busy) return;
      if (p.more.getBoundingClientRect().bottom > -40) return;   // 아직 화면에 걸쳐 있음
      var a = anchorOf(p); if (!a) return;
      var before = a.getBoundingClientRect().top;
      p.more.hidden = true;
      p.btn.setAttribute("aria-expanded", "false"); p.btn.textContent = "자세히 보기"; p.bar.setAttribute("aria-expanded", "false");
      window.scrollTo({ top: window.scrollY + (a.getBoundingClientRect().top - before), behavior: "instant" });
      lastY = window.scrollY;   // 우리가 당긴 만큼은 '다시 올라옴'으로 치지 않음
      api.restore(p);
      api.notify();
    });
  }
  function onScroll() {
    var y = window.scrollY, up = y < lastY - 1; lastY = y;
    clearTimeout(t); t = setTimeout(foldPassed, 150);
    if (up && !coarse) foldPassed();
  }
  window.addEventListener("scroll", function () {
    if (queued) return; queued = true;
    requestAnimationFrame(function () { queued = false; onScroll(); });
  }, { passive: true });
})();
