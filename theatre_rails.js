// 성당 장면(theatre.js) 오른쪽 막대 두 개: 설명마다 점을 찍고, 점·막대·위아래 글자에 이동할 자리(data-p = 무대 진행 0~1)를 단다.
// 누르면 railnav.js 가 그 자리로 옮긴다. 앞 막대 = '처음 → 지금'(56장), 뒤 막대 = '전체 → 무늬'(탁자 확대, 시간으로 재생).
window.TheatreRails = function (PH, rails, caps1, caps2) {
  // 막대 위 점·막대·위아래 글자는 누르면 그 자리로(data-p = 무대 진행 0~1, railnav.js 가 이동)
  function dotsFor(rail, caps, toP) {
    var tr = rail.querySelector(".op-track");
    return Array.prototype.map.call(caps, function (cp) {
      var s = document.createElement("s"); s.style.top = (parseFloat(cp.dataset.at) * 100) + "%"; s.dataset.p = toP(parseFloat(cp.dataset.at)).toFixed(4); tr.appendChild(s); return s;
    });
  }
  function f1p(q) { return PH.f1[0] + (PH.f1[1] - PH.f1[0]) * q + 0.006; }
  function zp() { return PH.zoom + 0.02; }
  var dots1 = dotsFor(rails[0], caps1, f1p), dots2 = dotsFor(rails[1], caps2, zp);
  (function (r0, r1) {
    var t0 = r0.querySelector(".op-track"), s0 = r0.querySelectorAll("span"), t1 = r1.querySelector(".op-track"), s1 = r1.querySelectorAll("span");
    t0.dataset.p0 = f1p(0).toFixed(4); t0.dataset.p1 = (PH.end[0] - 0.01).toFixed(4);
    s0[0].dataset.p = f1p(parseFloat(caps1[0].dataset.at)).toFixed(4); s0[1].dataset.p = (PH.end[0] - 0.01).toFixed(4);
    t1.dataset.p0 = t1.dataset.p1 = s1[0].dataset.p = s1[1].dataset.p = zp().toFixed(4);
  })(rails[0], rails[1]);
  return [dots1, dots2];
};
