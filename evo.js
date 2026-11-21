// 진화 단계: 스크롤을 내리면 처음 → 최후반으로 저절로 넘어가고,
// 아래 단계 그림에 마우스를 올리면 그 단계를 크게 보여 준다(손을 떼면 다시 스크롤 위치대로).
// 블라인드 시험 줄: 화면에 들어오면 하나씩 떠오른다.
(function () {
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  var boxes = [];
  document.querySelectorAll("[data-evo]").forEach(function (box) {
    var big = box.querySelectorAll(".evo-stage img");
    var steps = box.querySelectorAll(".evo-steps li");
    var tag = box.querySelector(".evo-tag");
    var bar = box.querySelector(".evo-bar i");
    var state = { box: box, hover: -1, cur: -1 };

    function show(i) {
      if (i === state.cur) return;
      state.cur = i;
      big.forEach(function (im, k) { im.classList.toggle("on", k === i); });
      steps.forEach(function (li, k) { li.classList.toggle("on", k === i); });
      tag.textContent = steps[i].querySelector("b").textContent;
      bar.style.width = (i / (steps.length - 1)) * 100 + "%";
    }
    state.byScroll = function () {
      if (state.hover >= 0) return;
      var r = box.getBoundingClientRect();
      // 상자 맨 위가 화면 80 % 높이에 왔을 때 처음, 상자 아래가 화면 60 % 를 지날 때 최후반
      var p = clamp((window.innerHeight * 0.8 - r.top) / (r.height + window.innerHeight * 0.2));
      show(Math.min(steps.length - 1, Math.floor(p * steps.length)));
    };
    steps.forEach(function (li, k) {
      li.addEventListener("mouseenter", function () { state.hover = k; show(k); });
      li.addEventListener("mouseleave", function () { state.hover = -1; state.byScroll(); });
      li.addEventListener("click", function () { state.hover = k; show(k); });
    });
    show(0);
    boxes.push(state);
  });

  var queued = false;
  function update() {
    queued = false;
    boxes.forEach(function (s) { s.byScroll(); });
  }
  function request() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  request();

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.2 });
  document.querySelectorAll(".run").forEach(function (el) { io.observe(el); });
})();
