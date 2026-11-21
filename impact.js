// 성과 숫자(.st-impact) — 단계가 끝나 넘어가는 자리마다 크게(사용자 11-22: "전환될 때 임팩트가 필요 · 효과음 포함, 타자 소리 말고 · 성과 강조").
// 화면에 들어오면 숫자가 data-from 에서 data-to 까지 차오르고, 다 차면 숫자가 튀어 오르며 크레파스 밑줄 + '탁' 소리(sound.js 의 impactSound — 소리를 꺼 두면 안 남).
// 한 번만. 움직임 줄이기를 켠 사람에겐 바로 끝 숫자.
(function () {
  var els = document.querySelectorAll(".st-impact");
  if (!els.length) return;
  var calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function fmt(v, dec) { return dec ? v.toFixed(dec) : String(Math.round(v)); }
  function run(el) {
    var n = el.querySelector("i[data-to]");
    function done() { el.classList.add("hit"); if (window.impactSound) window.impactSound(); }
    if (!n || calm) { done(); return; }
    var a = parseFloat(n.dataset.from), b = parseFloat(n.dataset.to), dec = parseInt(n.dataset.dec || "0", 10), t0 = 0, D = 900;
    n.textContent = fmt(a, dec);
    function step(t) {
      if (!t0) t0 = t;
      var u = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - u, 3);
      n.textContent = fmt(a + (b - a) * e, dec);
      if (u < 1) requestAnimationFrame(step); else { n.textContent = fmt(b, dec); done(); }
    }
    requestAnimationFrame(step);
  }
  if (!("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("hit"); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); run(e.target); } });
  }, { threshold: 0.7 });
  els.forEach(function (el) { io.observe(el); });
})();
