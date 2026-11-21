// 원본/편집본 비교: .compare 안의 그림 두 장(원본, 편집본)이 모두 들어오면 겹쳐 보기로 바꾼다.
//  - 스크롤: 화면을 내릴수록 원본 → 편집본으로 저절로 닦여 넘어간다
//  - 호버: 마우스를 올리면 커서가 있는 곳까지 원본, 그 오른쪽이 편집본(누르거나 끌 필요 없음)
// 한 장이라도 없으면 두 칸 그대로 둔다.
(function () {
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  document.querySelectorAll(".compare").forEach(function (box) {
    var loaded = 0;
    box.addEventListener("slotloaded", function () {
      loaded += 1;
      if (loaded < 2) return;
      var imgs = box.querySelectorAll("figure.slot img");
      var cmp = document.createElement("div");
      cmp.className = "cmp";
      cmp.innerHTML =
        '<img alt="편집본">' +
        '<div class="top"><img alt="원본"></div>' +
        '<div class="handle"></div>' +
        '<span class="lab l">원본</span><span class="lab r">편집본</span>';
      cmp.querySelector("img").src = imgs[1].src;
      cmp.querySelector(".top img").src = imgs[0].src;
      box.appendChild(cmp);
      box.classList.add("ready");

      var hovering = false;
      function set(x) { cmp.style.setProperty("--x", (clamp(x) * 100).toFixed(1) + "%"); }
      function byScroll() {
        if (hovering) return;
        var r = cmp.getBoundingClientRect();
        // 비교 화면이 화면 아래쪽에서 가운데로 올라오는 동안 원본(100 %) → 편집본(0 %)
        var p = clamp((window.innerHeight * 0.85 - r.top) / (window.innerHeight * 0.6));
        set(1 - p);
      }
      cmp.addEventListener("mousemove", function (e) {
        hovering = true;
        var r = cmp.getBoundingClientRect();
        set((e.clientX - r.left) / r.width);
      });
      cmp.addEventListener("mouseleave", function () { hovering = false; byScroll(); });
      window.addEventListener("scroll", byScroll, { passive: true });
      byScroll();
    });
  });
})();
