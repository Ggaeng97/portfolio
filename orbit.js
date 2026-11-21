// 돌려 보기
//  - 3D(model-viewer): 저절로 천천히 돈다. 끌면 직접 돌리고, 휠은 페이지 스크롤 그대로.
//    확대·축소는 Ctrl + 휠(맥 트랙패드는 두 손가락 벌리기)일 때만. 휠만 굴리면 'Ctrl + 휠로 확대' 안내가 잠깐 뜬다.
//  - 각도 렌더([data-angles]): 화면에 보이는 동안 그림이 저절로 넘어가고, 좌우로 끌어도 넘어간다.
(function () {
  // 3D 파일은 models/<이름>.glb.js(글자로 바꾼 것)를 화면에 가까워질 때 불러서 넣는다 — 서버 없이 파일로 열어도 뜬다.
  function loadGlb(mv) {
    var name = mv.dataset.glb;
    if (!name || mv.dataset.asked) return;
    mv.dataset.asked = "1";
    var put = function () { if (window.GLB && window.GLB[name]) mv.src = window.GLB[name]; };
    if (window.GLB && window.GLB[name]) return put();
    var s = document.createElement("script");
    s.src = "models/" + name + ".glb.js";
    s.onload = put;
    document.head.appendChild(s);
  }
  // 3D 줄(.orbit-grid)이 가까워지면 그 안의 셋을 한꺼번에(휴대폰에서 옆으로 밀어야 보이는 칸도 미리)
  var near = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll("model-viewer[data-glb]").forEach(loadGlb);
      near.unobserve(e.target);
    });
  }, { rootMargin: "800px 0px" });
  document.querySelectorAll(".orbit-grid").forEach(function (g) { near.observe(g); });

  document.querySelectorAll(".orbit-stage model-viewer").forEach(function (mv) {
    var tip = document.createElement("div");
    tip.className = "orbit-zoom";
    tip.textContent = "확대·축소는 Ctrl + 휠";
    mv.parentElement.appendChild(tip);
    var hideT = null;
    mv.addEventListener("wheel", function (e) {
      if (!e.ctrlKey) {
        tip.classList.add("show");
        clearTimeout(hideT);
        hideT = setTimeout(function () { tip.classList.remove("show"); }, 900);
        return;                                   // 막지 않음 → 페이지가 그대로 내려감
      }
      e.preventDefault();
      var o = mv.getCameraOrbit();
      var k = Math.exp(e.deltaY * 0.004);
      var r = Math.min(Math.max(o.radius * k, mv.__rmin || 0), mv.__rmax || Infinity);
      mv.cameraOrbit = o.theta + "rad " + o.phi + "rad " + r + "m";
    }, { passive: false });
    mv.addEventListener("load", function () {
      var r = mv.getCameraOrbit().radius;
      mv.__rmin = r * 0.45;
      mv.__rmax = r * 1.6;
    });
  });

  document.querySelectorAll("[data-angles]").forEach(function (box) {
    var imgs = box.querySelectorAll("img");
    var tag = box.parentElement.querySelector(".angles-tag");
    var n = imgs.length, cur = 0, timer = null;
    function show(k) {
      cur = (k + n) % n;
      imgs.forEach(function (im, j) { im.classList.toggle("on", j === cur); });
      tag.textContent = imgs[cur].alt;
    }
    function start() { stop(); timer = setInterval(function () { show(cur + 1); }, 2600); }
    function stop() { clearInterval(timer); timer = null; }
    var x0 = null, k0 = 0;
    box.addEventListener("pointerdown", function (e) { x0 = e.clientX; k0 = cur; stop(); box.setPointerCapture(e.pointerId); });
    box.addEventListener("pointermove", function (e) { if (x0 !== null) show(k0 - Math.round((e.clientX - x0) / 50)); });
    function up() { if (x0 !== null) { x0 = null; start(); } }
    box.addEventListener("pointerup", up);
    box.addEventListener("pointercancel", up);
    show(0);
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) start(); else stop(); }, { threshold: 0.2 }).observe(box);
  });
})();
