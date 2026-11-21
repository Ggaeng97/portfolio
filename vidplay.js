// 화면에 보이는 동안만 재생하는 영상(video[data-inview]): 소리 없이 되풀이, 화면 밖으로 나가면 멈춤(배터리·속도).
(function () {
  var vs = document.querySelectorAll("video[data-inview]");
  if (!vs.length || !("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
    });
  }, { threshold: 0.35 });
  vs.forEach(function (v) { v.muted = true; io.observe(v); });
})();
