// 화면에 들어오면 떠오르기(.rise 하나, .stag 는 안의 카드가 하나씩 차례로) + 저절로 도는 영상(video[data-auto])은
// 화면에 보일 때만 재생하고 벗어나면 멈춘다(소리 없음·무한 반복). cards.js 다음에 불러야 카드까지 잡힌다.
(function () {
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".rise, .stag").forEach(function (el) { io.observe(el); });

  var vids = Array.prototype.slice.call(document.querySelectorAll("video[data-auto]"));
  vids.forEach(function (v) { v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute("playsinline", ""); });
  var vio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else v.pause();
    });
  }, { threshold: 0.05 });
  vids.forEach(function (v) { vio.observe(v); });
})();
